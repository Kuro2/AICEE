const express = require('express');
const router = express.Router();
const { getAllNews, getNewsById, getCategories, searchNews, addSubscriber } = require('../services/newsService');

/**
 * @route   GET /api/news
 * @desc    Lấy danh sách tin tức (có phân trang và lọc)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category || null;
    const search = req.query.search || null;

    // Nếu có tìm kiếm
    if (search) {
      const results = await searchNews(search);
      return res.json({
        success: true,
        data: {
          news: results,
          pagination: {
            total: results.length,
            page: 1,
            limit: results.length,
            totalPages: 1
          },
          query: search
        }
      });
    }

    const result = await getAllNews(page, limit, category);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('News list error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tin tức'
    });
  }
});

/**
 * @route   GET /api/news/categories
 * @desc    Lấy danh sách categories
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách categories'
    });
  }
});

/**
 * @route   GET /api/news/:id
 * @desc    Lấy chi tiết tin tức theo ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const news = await getNewsById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin tức'
      });
    }

    res.json({
      success: true,
      data: { news }
    });
  } catch (error) {
    console.error('News detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết tin tức'
    });
  }
});

/**
 * @route   POST /api/news/subscribe
 * @desc    Đăng ký nhận bản tin qua email
 * @access  Public
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email'
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    const isNew = await addSubscriber(email);

    res.json({
      success: true,
      message: isNew
        ? '🎉 Đăng ký nhận bản tin thành công! Cảm ơn bạn.'
        : 'Email này đã đăng ký nhận bản tin trước đó.'
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng ký bản tin'
    });
  }
});

const News = require('../models/News');
const { authenticate, isAdmin } = require('../middleware/auth');

/**
 * @route   POST /api/news
 * @desc    Tạo tin tức mới
 * @access  Private/Admin
 */
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const newNews = new News({
      ...req.body,
      author: req.body.author || 'AICEE Team',
      date: new Date().toLocaleDateString('vi-VN')
    });
    await newNews.save();
    res.json({ success: true, message: 'Đã thêm tin tức', data: newNews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi thêm tin tức' });
  }
});

/**
 * @route   PUT /api/news/:id
 * @desc    Cập nhật tin tức
 * @access  Private/Admin
 */
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const updated = await News.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    res.json({ success: true, message: 'Đã cập nhật', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật tin tức' });
  }
});

/**
 * @route   DELETE /api/news/:id
 * @desc    Xóa tin tức
 * @access  Private/Admin
 */
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const deleted = await News.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    res.json({ success: true, message: 'Đã xóa tin tức' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa tin tức' });
  }
});

module.exports = router;
