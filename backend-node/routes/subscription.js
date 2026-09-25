const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { UserModel } = require('../models/User');

/**
 * @route   GET /api/subscription
 * @desc    Lấy thông tin gói cước hiện tại của người dùng
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      data: {
        plan: user.plan || 'free',
        scanCount: user.scanCount || 0,
        subscriptionExpires: user.subscriptionExpires || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

/**
 * @route   POST /api/subscription/upgrade
 * @desc    Nâng cấp gói cước
 * @access  Private
 */
router.post('/upgrade', authenticate, async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ['free', 'premium', 'business', 'api'];
    
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ success: false, message: 'Gói cước không hợp lệ' });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Mô phỏng thanh toán thành công
    user.plan = plan;
    
    // Nếu nâng cấp lên premium/business/api, set hạn dùng là 30 ngày (hoặc 1 năm cho business)
    if (plan !== 'free') {
      const expires = new Date();
      if (plan === 'business') {
        expires.setFullYear(expires.getFullYear() + 1); // 1 năm
      } else {
        expires.setMonth(expires.getMonth() + 1); // 1 tháng
      }
      user.subscriptionExpires = expires;
    } else {
      user.subscriptionExpires = null;
    }

    await user.save();

    res.json({
      success: true,
      message: `Đã nâng cấp lên gói ${plan.toUpperCase()} thành công!`,
      data: {
        plan: user.plan,
        subscriptionExpires: user.subscriptionExpires
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi nâng cấp gói cước' });
  }
});

module.exports = router;
