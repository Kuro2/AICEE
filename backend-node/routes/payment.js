const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const { UserModel } = require('../models/User');
const { authenticate, optionalAuth, isAdmin } = require('../middleware/auth');

// Cấu hình SePay từ biến môi trường
const SEPAY_CONFIG = {
  apiToken: (process.env.SEPAY_API_TOKEN || 'HP7KCPUEXD7Z1RJMS5XSOK3WFY8NR301PAELLY0HGILH9OAGF6JZEUZITWXN82YG').trim(),
  bankName: (process.env.SEPAY_BANK_NAME || 'TPBank').trim(),
  bankCode: (process.env.SEPAY_BANK_CODE || 'TPB').trim(),
  accountNumber: (process.env.SEPAY_ACCOUNT_NUMBER || '10005920328').trim(),
  accountHolder: (process.env.SEPAY_ACCOUNT_HOLDER || 'TRAN TRUNG HAI').trim(),
  apiUrl: 'https://my.sepay.vn/userapi'
};

// Bảng giá quy đổi
const PLAN_PRICES = {
  premium: { monthly: 49000, yearly: 490000 },
  business: { monthly: 625000, yearly: 6996000 },
  api: { monthly: 2000000, yearly: 20000000 },
  'platform-api': { monthly: 2000000, yearly: 20000000 }
};

/**
 * Hàm kích hoạt gói cước cho User khi thanh toán thành công
 */
async function fulfillOrder(order, transactionData = null) {
  if (order.status === 'paid') return;

  order.status = 'paid';
  order.paidAt = new Date();
  if (transactionData) {
    order.transactionId = transactionData.id ? String(transactionData.id) : order.transactionId;
    order.sepayTransaction = transactionData;
  }
  await order.save();

  // Nâng cấp gói cho người dùng
  const user = await UserModel.findById(order.userId);
  if (user) {
    user.plan = order.plan === 'api' ? 'platform-api' : order.plan;
    const expires = new Date();
    if (order.billingCycle === 'yearly') {
      expires.setFullYear(expires.getFullYear() + 1);
    } else {
      expires.setMonth(expires.getMonth() + 1);
    }
    user.subscriptionExpires = expires;
    await user.save();
    console.log(`[SePay] Đã nâng cấp thành công gói ${user.plan} cho user: ${user.email} (${user._id})`);
  }
}

/**
 * @route   POST /api/payment/create-order
 * @desc    Tạo đơn hàng nâng cấp gói cước qua SePay QR
 * @access  Private
 */
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { plan, billingCycle = 'monthly' } = req.body;
    const planKey = (plan || '').toLowerCase();

    if (!PLAN_PRICES[planKey]) {
      return res.status(400).json({
        success: false,
        message: `Gói cước "${plan}" không hợp lệ để thanh toán.`
      });
    }

    const amount = PLAN_PRICES[planKey][billingCycle] || PLAN_PRICES[planKey].monthly;
    
    // Tạo mã đơn hàng duy nhất có tiền tố AICEE để nhận diện trong nội dung chuyển khoản
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const orderCode = `AICEE${randomCode}`;

    const newOrder = new Order({
      userId: req.user.id,
      orderCode,
      plan: planKey,
      amount,
      billingCycle,
      paymentGateway: `${SEPAY_CONFIG.bankName} (SePay)`,
      accountNumber: SEPAY_CONFIG.accountNumber,
      status: 'pending'
    });

    await newOrder.save();

    // Link mã QR trực tiếp từ dịch vụ SePay
    const sepayQrUrl = `https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.accountNumber}&bank=${SEPAY_CONFIG.bankName}&amount=${amount}&des=${orderCode}&template=compact`;
    
    // Link VietQR dự phòng
    const vietQrUrl = `https://img.vietqr.io/image/${SEPAY_CONFIG.bankCode}-${SEPAY_CONFIG.accountNumber}-compact2.png?amount=${amount}&addInfo=${orderCode}&accountName=${encodeURIComponent(SEPAY_CONFIG.accountHolder)}`;

    res.json({
      success: true,
      message: 'Tạo đơn hàng thanh toán SePay thành công',
      data: {
        orderId: newOrder._id,
        orderCode: newOrder.orderCode,
        plan: newOrder.plan,
        amount: newOrder.amount,
        billingCycle: newOrder.billingCycle,
        qrUrl: sepayQrUrl,
        vietQrUrl,
        bankInfo: {
          bankName: SEPAY_CONFIG.bankName,
          bankCode: SEPAY_CONFIG.bankCode,
          accountNumber: SEPAY_CONFIG.accountNumber,
          accountHolder: SEPAY_CONFIG.accountHolder,
          amount,
          orderCode
        }
      }
    });
  } catch (error) {
    console.error('[SePay Create Order Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo đơn hàng thanh toán'
    });
  }
});

/**
 * @route   GET /api/payment/check-status/:orderCode
 * @desc    Kiểm tra trạng thái đơn hàng (gọi SePay API tra cứu biến động số dư ngân hàng)
 * @access  Public / OptionalAuth
 */
router.get('/check-status/:orderCode', optionalAuth, async (req, res) => {
  try {
    const { orderCode } = req.params;
    const cleanCode = (orderCode || '').trim().toUpperCase();

    const order = await Order.findOne({ orderCode: cleanCode });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng với mã: ' + cleanCode
      });
    }

    // Nếu đơn hàng đã được đánh dấu thanh toán trước đó
    if (order.status === 'paid') {
      const user = await UserModel.findById(order.userId);
      return res.json({
        success: true,
        isPaid: true,
        data: {
          orderCode: order.orderCode,
          plan: order.plan,
          paidAt: order.paidAt,
          userPlan: user?.plan || order.plan,
          subscriptionExpires: user?.subscriptionExpires
        }
      });
    }

    // Nếu chưa đánh dấu thanh toán, gọi trực tiếp SePay API để kiểm tra danh sách giao dịch mới nhất
    try {
      const sepayRes = await axios.get(`${SEPAY_CONFIG.apiUrl}/transactions/list`, {
        headers: {
          Authorization: `Bearer ${SEPAY_CONFIG.apiToken}`
        },
        timeout: 8000
      });

      const transactions = sepayRes.data?.transactions || [];
      console.log(`[SePay Check] Đang tra cứu SePay cho mã ${cleanCode}. Tổng số giao dịch trả về: ${transactions.length}`);

      // Tìm giao dịch khớp với mã đơn hàng và số tiền (hỗ trợ cả format SePay API và Webhook)
      const matchedTx = transactions.find(tx => {
        const content = `${tx.transaction_content || ''} ${tx.content || ''} ${tx.description || ''} ${tx.code || ''}`.toUpperCase();
        const amountIn = Number(tx.amount_in || tx.transferAmount || tx.amount || 0);
        const isInbound = tx.transferType === 'in' || amountIn > 0;
        const isCodeMatched = content.includes(cleanCode);
        const isAmountMatched = amountIn >= Number(order.amount);

        return isInbound && isCodeMatched && isAmountMatched;
      });

      if (matchedTx) {
        const matchedAmount = matchedTx.amount_in || matchedTx.transferAmount || matchedTx.amount;
        console.log(`[SePay Match!] Tìm thấy giao dịch SePay khớp: #${matchedTx.id} - ${matchedAmount}đ cho mã ${cleanCode}`);
        await fulfillOrder(order, matchedTx);

        const user = await UserModel.findById(order.userId);
        return res.json({
          success: true,
          isPaid: true,
          message: 'Thanh toán thành công! Gói cước đã được kích hoạt tự động.',
          data: {
            orderCode: order.orderCode,
            plan: order.plan,
            paidAt: order.paidAt,
            userPlan: user?.plan || order.plan,
            subscriptionExpires: user?.subscriptionExpires
          }
        });
      }
    } catch (apiErr) {
      console.warn('[SePay API Polling Warning]:', apiErr.response?.data || apiErr.message);
    }

    // Chưa phát hiện giao dịch khớp
    return res.json({
      success: true,
      isPaid: false,
      message: 'Đang lắng nghe chuyển khoản ngân hàng...'
    });
  } catch (error) {
    console.error('[SePay Check Status Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra trạng thái thanh toán'
    });
  }
});

/**
 * @route   POST /api/payment/sepay-webhook
 * @desc    Webhook nhận thông báo biến động số dư tự động từ SePay
 * @access  Public (SePay Webhook IP/Server)
 */
router.post('/sepay-webhook', async (req, res) => {
  try {
    const data = req.body;
    console.log('[SePay Webhook Received]:', JSON.stringify(data));

    if (!data) {
      return res.status(400).json({ success: false, message: 'Dữ liệu webhook trống' });
    }

    const content = `${data.transaction_content || ''} ${data.content || ''} ${data.description || ''} ${data.code || ''}`.toUpperCase();
    const transferAmount = Number(data.amount_in || data.transferAmount || data.amount || 0);

    // Trích xuất mã đơn hàng có định dạng AICEE + 6 số
    const match = content.match(/AICEE\d+/i);
    if (!match) {
      console.log('[SePay Webhook] Không tìm thấy mã đơn hàng AICEE trong nội dung chuyển khoản:', content);
      return res.json({ success: true, message: 'Bỏ qua giao dịch không chứa mã đơn hàng AICEE' });
    }

    const orderCode = match[0].toUpperCase();
    const order = await Order.findOne({ orderCode });

    if (!order) {
      console.log(`[SePay Webhook] Không tìm thấy đơn hàng với mã ${orderCode}`);
      return res.json({ success: true, message: 'Không tìm thấy đơn hàng tương ứng' });
    }

    if (transferAmount < order.amount) {
      console.warn(`[SePay Webhook] Số tiền chuyển ${transferAmount} nhỏ hơn giá gói ${order.amount} cho mã ${orderCode}`);
      return res.json({ success: true, message: 'Số tiền chuyển không đủ' });
    }

    await fulfillOrder(order, data);

    return res.json({
      success: true,
      message: 'Xử lý webhook SePay và kích hoạt gói cước thành công!'
    });
  } catch (error) {
    console.error('[SePay Webhook Error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi xử lý webhook' });
  }
});

/**
 * @route   POST /api/payment/simulate/:orderCode
 * @desc    Giả lập thanh toán thành công (hỗ trợ kiểm thử / demo nhanh khi dev)
 * @access  Private
 */
router.post('/simulate/:orderCode', authenticate, async (req, res) => {
  try {
    const { orderCode } = req.params;
    const order = await Order.findOne({ orderCode: orderCode.toUpperCase() });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    await fulfillOrder(order, {
      id: `SIM_${Date.now()}`,
      gateway: 'SePay Demo Simulation',
      transferAmount: order.amount,
      content: `${order.orderCode} DEMO PAYMENT`
    });

    const user = await UserModel.findById(order.userId);

    res.json({
      success: true,
      message: `[Mô phỏng] Đã kích hoạt thành công gói ${order.plan.toUpperCase()}!`,
      data: {
        orderCode: order.orderCode,
        plan: order.plan,
        paidAt: order.paidAt,
        userPlan: user?.plan,
        subscriptionExpires: user?.subscriptionExpires
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/payment/bank-info
 * @desc    Lấy thông tin tài khoản ngân hàng SePay đã kết nối
 * @access  Public
 */
router.get('/bank-info', (req, res) => {
  res.json({
    success: true,
    data: {
      bankName: SEPAY_CONFIG.bankName,
      bankCode: SEPAY_CONFIG.bankCode,
      accountNumber: SEPAY_CONFIG.accountNumber,
      accountHolder: SEPAY_CONFIG.accountHolder
    }
  });
});

module.exports = router;
