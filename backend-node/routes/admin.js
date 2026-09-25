const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { UserModel } = require('../models/User');

// Sử dụng middleware xác thực và kiểm tra quyền admin cho TẤT CẢ các route trong file này
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Lấy thống kê tổng quan
 * @access  Private/Admin
 */
router.get('/stats', async (req, res) => {
  try {
    const userCount = await UserModel.countDocuments();
    
    // Thống kê người dùng theo quyền
    const usersByRole = await UserModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: userCount,
        usersByRole
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
