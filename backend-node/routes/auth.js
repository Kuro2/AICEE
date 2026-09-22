const express = require('express');
const router = express.Router();
const { findUserByEmail, createUser, verifyLogin } = require('../models/User');
const { generateToken, authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản mới
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu là bắt buộc'
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    const result = await createUser(email, password, name);

    if (!result.success) {
      return res.status(409).json({
        success: false,
        message: result.error
      });
    }

    const token = generateToken(result.user.id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      data: {
        user: result.user,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu là bắt buộc'
      });
    }

    const result = await verifyLogin(email, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.error
      });
    }

    const token = generateToken(result.user.id);

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        user: result.user,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin user hiện tại
 * @access  Private
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Đăng xuất (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

module.exports = router;
