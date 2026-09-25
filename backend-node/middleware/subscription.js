const { UserModel } = require('../models/User');

/**
 * Middleware kiểm tra giới hạn lượt quét dựa trên Gói cước
 */
async function checkScanLimit(req, res, next) {
  // Nếu chưa đăng nhập, chỉ cho phép quét 1 lần demo (phải dựa vào Frontend ẩn đi hoặc bắt đăng nhập)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để sử dụng tính năng Quét.'
    });
  }

  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Reset lượt quét nếu qua ngày mới
    if (!user.lastScanReset || user.lastScanReset < today) {
      user.scanCount = 0;
      user.lastScanReset = today;
    }

    // Kiểm tra giới hạn gói Free
    if (user.plan === 'free') {
      if (user.scanCount >= 5) {
        return res.status(403).json({
          success: false,
          isLimitReached: true,
          message: 'Bạn đã đạt giới hạn 5 lượt quét của gói Free hôm nay. Vui lòng nâng cấp gói Premium để quét không giới hạn.'
        });
      }
    }

    // Tăng số lượt quét
    user.scanCount += 1;
    await user.save();

    next();
  } catch (error) {
    console.error('Lỗi kiểm tra giới hạn quét:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra gói cước' });
  }
}

module.exports = { checkScanLimit };
