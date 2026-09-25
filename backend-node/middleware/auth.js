const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'aicee-secret-key';

// Tạo JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

// Middleware xác thực JWT (bắt buộc)
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không có token xác thực. Vui lòng đăng nhập.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
}

// Middleware xác thực JWT (tùy chọn - không bắt buộc)
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await findUserById(decoded.userId);
  } catch (e) {
    req.user = null;
  }

  next();
}

module.exports = { generateToken, authenticate, optionalAuth };
