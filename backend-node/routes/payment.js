const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const { PaymentModel } = require('../models/Payment');
const { UserModel } = require('../models/User');

const PLANS = {
  premium_monthly: {
    name: 'AICEE Premium 1 Tháng',
    amount: 49000,
    durationDays: 30
  },
  premium_yearly: {
    name: 'AICEE Premium 1 Năm',
    amount: 399000,
    durationDays: 365
  }
};

/**
 * Helper format date VNPay: yyyyMMddHHmmss
 */
function getVNPayDateFormat(date = new Date()) {
  const pad = (n) => (n < 10 ? '0' + n : n);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Helper sắp xếp params cho VNPay
 */
function sortObject(obj) {
  const sorted = {};
  const str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[decodeURIComponent(str[key])]).replace(/%20/g, '+');
  }
  return sorted;
}

/**
 * @route   POST /api/payment/create
 * @desc    Tạo đơn thanh toán gói dịch vụ
 * @access  Private (Cần đăng nhập)
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { planType, provider = 'vnpay' } = req.body;
    const plan = PLANS[planType];

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Gói dịch vụ không hợp lệ. Vui lòng chọn premium_monthly hoặc premium_yearly.'
      });
    }

    const orderId = `AICEE_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await PaymentModel.create({
      userId: req.user.id,
      orderId,
      amount: plan.amount,
      planType,
      provider,
      status: 'pending'
    });

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = process.env.VNPAY_RETURN_URL || `${frontendUrl}/payment/success`;

    // Nếu cấu hình VNPay đầy đủ thì build URL VNPay
    if (tmnCode && secretKey && provider === 'vnpay') {
      const createDate = getVNPayDateFormat(new Date());
      const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

      let vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan goi ${plan.name} tai AICEE`,
        vnp_OrderType: 'other',
        vnp_Amount: plan.amount * 100, // VNPay tính bằng đơn vị xu/đồng x100
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr.includes('::') ? '127.0.0.1' : ipAddr,
        vnp_CreateDate: createDate
      };

      vnp_Params = sortObject(vnp_Params);
      const querystring = require('querystring');
      const signData = querystring.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      vnp_Params['vnp_SecureHash'] = signed;
      const paymentUrl = `${vnpUrl}?${querystring.stringify(vnp_Params, { encode: false })}`;

      payment.paymentUrl = paymentUrl;
      await payment.save();

      return res.json({
        success: true,
        data: {
          orderId,
          amount: plan.amount,
          planName: plan.name,
          paymentUrl,
          mode: 'vnpay'
        }
      });
    }

    // Nếu chưa cấu hình VNPay hoặc test mock mode
    // Trả về URL dẫn đến màn hình thanh toán mô phỏng
    const mockUrl = `${frontendUrl}/payment/checkout-simulator?orderId=${orderId}&amount=${plan.amount}&plan=${planType}`;
    payment.paymentUrl = mockUrl;
    await payment.save();

    res.json({
      success: true,
      data: {
        orderId,
        amount: plan.amount,
        planName: plan.name,
        paymentUrl: mockUrl,
        mode: 'simulator'
      }
    });
  } catch (error) {
    console.error('Payment create error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể khởi tạo giao dịch thanh toán. Vui lòng thử lại.'
    });
  }
});

/**
 * @route   POST /api/payment/simulate
 * @desc    Xác nhận giao dịch thanh toán trong môi trường sandbox/demo
 * @access  Private
 */
router.post('/simulate', authenticate, async (req, res) => {
  try {
    const { orderId, status = 'success' } = req.body;

    const payment = await PaymentModel.findOne({ orderId, userId: req.user.id });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch này'
      });
    }

    if (payment.status === 'success') {
      return res.json({
        success: true,
        message: 'Giao dịch đã được ghi nhận thành công trước đó',
        data: { payment }
      });
    }

    if (status === 'success') {
      payment.status = 'success';
      payment.transactionId = `SIM_${Date.now()}`;
      await payment.save();

      const planConfig = PLANS[payment.planType] || PLANS.premium_monthly;
      const durationDays = planConfig.durationDays || 30;

      // Tính ngày hết hạn
      const now = new Date();
      const user = await UserModel.findById(req.user.id);
      let expiryDate = new Date();

      if (user.plan === 'premium' && user.planExpiry && new Date(user.planExpiry) > now) {
        // Cộng dồn thời gian nếu đang còn hạn
        expiryDate = new Date(user.planExpiry);
      }
      expiryDate.setDate(expiryDate.getDate() + durationDays);

      user.plan = 'premium';
      user.planExpiry = expiryDate;
      await user.save();

      return res.json({
        success: true,
        message: 'Nâng cấp Premium thành công!',
        data: {
          orderId: payment.orderId,
          plan: user.plan,
          planExpiry: user.planExpiry,
          amount: payment.amount
        }
      });
    } else {
      payment.status = 'failed';
      await payment.save();

      return res.json({
        success: false,
        message: 'Giao dịch thanh toán thất bại'
      });
    }
  } catch (error) {
    console.error('Payment simulate error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý trạng thái thanh toán'
    });
  }
});

/**
 * @route   GET /api/payment/order/:orderId
 * @desc    Lấy chi tiết đơn thanh toán
 * @access  Private
 */
router.get('/order/:orderId', authenticate, async (req, res) => {
  try {
    const payment = await PaymentModel.findOne({
      orderId: req.params.orderId,
      userId: req.user.id
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    res.json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi truy xuất đơn hàng'
    });
  }
});

/**
 * @route   GET /api/payment/history
 * @desc    Lấy lịch sử thanh toán của tài khoản
 * @access  Private
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const payments = await PaymentModel.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử thanh toán'
    });
  }
});

module.exports = router;
