const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { UserModel } = require('../models/User');
const { PaymentModel } = require('../models/Payment');
const Order = require('../models/Order');

// Sử dụng middleware xác thực và kiểm tra quyền admin cho TẤT CẢ các route trong file này
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Lấy thống kê tổng quan (bao gồm biểu đồ người dùng và đăng ký gói cước)
 * @access  Private/Admin
 */
router.get('/stats', async (req, res) => {
  try {
    const userCount = await UserModel.countDocuments();

    // 1. Thống kê người dùng theo quyền
    const usersByRole = await UserModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // 2. Thống kê phân bố gói cước (Plan distribution)
    const planAgg = await UserModel.aggregate([
      { $group: { _id: { $ifNull: ['$plan', 'free'] }, count: { $sum: 1 } } }
    ]);
    const planMap = Object.fromEntries(planAgg.map(p => [(p._id || 'free').toLowerCase(), p.count]));
    const usersByPlan = [
      { plan: 'free', name: 'Gói Free', count: planMap['free'] || 0, color: '#64748b' },
      { plan: 'premium', name: 'Gói Premium', count: (planMap['premium'] || 0) + (planMap['premium_monthly'] || 0), color: '#06b6d4' },
      { plan: 'business', name: 'Gói Business', count: (planMap['business'] || 0) + (planMap['business_yearly'] || 0), color: '#a855f7' },
      { plan: 'api', name: 'Platform API', count: (planMap['api'] || 0) + (planMap['platform-api'] || 0), color: '#10b981' }
    ];

    // Số người dùng trả phí
    const paidUsersCount = usersByPlan
      .filter(p => p.plan !== 'free')
      .reduce((sum, p) => sum + p.count, 0);

    // 3. Doanh thu thanh toán tổng quan (Tổng hợp từ Order SePay và PaymentModel)
    let totalRevenue = 0;
    let totalSuccessPayments = 0;

    const orderAgg = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    if (orderAgg[0]) {
      totalRevenue += orderAgg[0].total;
      totalSuccessPayments += orderAgg[0].count;
    }

    if (PaymentModel) {
      try {
        const revAgg = await PaymentModel.aggregate([
          { $match: { status: 'success' } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);
        if (revAgg[0]) {
          totalRevenue += revAgg[0].total;
          totalSuccessPayments += revAgg[0].count;
        }
      } catch (err) {
        console.warn('PaymentModel aggregation skipped:', err.message);
      }
    }

    // 4. Dữ liệu xu hướng 7 ngày gần nhất (Registration & Subscription trend)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      days.push({ dateStr, label, newUsers: 0, newSubscribers: 0, revenue: 0 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    // Người dùng đăng ký mới theo ngày
    const userRegs = await UserModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Đơn đăng ký gói SePay thành công theo ngày
    const orderStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      }
    ]);

    const userRegMap = Object.fromEntries(userRegs.map(r => [r._id, r.count]));
    const paymentMap = Object.fromEntries(orderStats.map(p => [p._id, { count: p.count, revenue: p.revenue }]));

    days.forEach(day => {
      day.newUsers = userRegMap[day.dateStr] || 0;
      day.newSubscribers = paymentMap[day.dateStr]?.count || 0;
      day.revenue = paymentMap[day.dateStr]?.revenue || 0;
    });

    res.json({
      success: true,
      data: {
        totalUsers: userCount,
        usersByRole,
        usersByPlan,
        paidUsersCount,
        totalRevenue,
        totalSuccessPayments,
        trendData: days
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy thống kê' });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Lấy danh sách người dùng
 * @access  Private/Admin
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await UserModel.find()
      .select('-password') // Không trả về mật khẩu
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await UserModel.countDocuments();

    res.json({
      success: true,
      data: {
        users: users.map(u => {
          const obj = u.toObject();
          obj.id = obj._id;
          delete obj._id;
          return obj;
        }),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin Users Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách người dùng' });
  }
});

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Thay đổi quyền người dùng
 * @access  Private/Admin
 */
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Quyền không hợp lệ' });
    }

    // Không cho phép tự đổi quyền của chính mình (chống việc admin tự hạ quyền rồi mất quyền quản trị)
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Không thể tự thay đổi quyền của chính mình' });
    }

    const user = await UserModel.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({ success: true, message: 'Cập nhật quyền thành công', data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật quyền người dùng' });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Xóa người dùng
 * @access  Private/Admin
 */
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Không thể tự xóa tài khoản của chính mình' });
    }

    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa người dùng' });
  }
});

module.exports = router;
