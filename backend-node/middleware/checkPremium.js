function requirePremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để sử dụng tính năng này.'
    });
  }

  const isPremium = req.user.plan === 'premium' && 
    (!req.user.planExpiry || new Date(req.user.planExpiry) > new Date());

  if (!isPremium) {
    return res.status(403).json({
      success: false,
      code: 'PREMIUM_REQUIRED',
      message: 'Tính năng lưu lịch sử chat chỉ dành riêng cho tài khoản Premium.',
      upgradeUrl: '/pricing'
    });
  }

  next();
}

module.exports = { requirePremium };
