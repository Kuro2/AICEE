const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { findUserByEmail, createUser, verifyLogin, findOrCreateSocialUser, updateUser, UserModel } = require('../models/User');
const { generateToken, authenticate } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

// Khởi tạo Google Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
 * @route   PUT /api/auth/profile
 * @desc    Cập nhật thông tin profile của user (name, avatar)
 * @access  Private
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (avatar !== undefined) updates.avatar = avatar;

    const updatedUser = await updateUser(req.user.id, updates);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });
    }

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công!',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật thông tin hồ sơ' });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Đổi mật khẩu người dùng
 * @access  Private
 */
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });
    }

    // Nếu user đã có mật khẩu, bắt buộc kiểm tra currentPassword
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
      }
    }

    const hadPasswordBefore = !!user.password;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: hadPasswordBefore ? 'Đổi mật khẩu thành công!' : 'Thiết lập mật khẩu thành công! Giờ đây bạn có thể dùng mật khẩu này để đăng nhập trực tiếp.',
      hasPassword: true
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi đổi mật khẩu' });
  }
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

/**
 * @route   POST /api/auth/google
 * @desc    Đăng nhập bằng Google
 * @access  Public
 */
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Thiếu Google token' });
    }

    // Lấy thông tin user từ Google bằng access_token
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = response.data;

    // Tìm hoặc tạo user
    const profile = {
      email: payload.email,
      name: payload.name,
      avatar: payload.picture,
      provider: 'google',
      providerId: payload.sub
    };

    const result = await findOrCreateSocialUser(profile);

    if (!result.success) {
      return res.status(401).json({ success: false, message: result.error });
    }

    const appToken = generateToken(result.user.id);

    res.json({
      success: true,
      message: 'Đăng nhập Google thành công!',
      data: {
        user: result.user,
        token: appToken
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi đăng nhập bằng Google' });
  }
});

/**
 * @route   POST /api/auth/facebook
 * @desc    Đăng nhập bằng Facebook
 * @access  Public
 */
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Thiếu Facebook token' });
    }

    // Lấy thông tin user từ Graph API
    const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
    const payload = response.data;

    // Tạo email giả nếu user đăng ký FB bằng số điện thoại
    const email = payload.email || `${payload.id}@facebook.aicee.com`;

    // Tìm hoặc tạo user
    const profile = {
      email: email,
      name: payload.name,
      avatar: payload.picture?.data?.url || null,
      provider: 'facebook',
      providerId: payload.id
    };

    const result = await findOrCreateSocialUser(profile);

    if (!result.success) {
      return res.status(401).json({ success: false, message: result.error });
    }

    const appToken = generateToken(result.user.id);

    res.json({
      success: true,
      message: 'Đăng nhập Facebook thành công!',
      data: {
        user: result.user,
        token: appToken
      }
    });
  } catch (error) {
    console.error('Facebook login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi đăng nhập bằng Facebook' });
  }
});

module.exports = router;
