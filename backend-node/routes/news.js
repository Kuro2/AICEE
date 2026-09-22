const express = require('express');
const router = express.Router();
const { getAllNews, getNewsById, getCategories, searchNews, addSubscriber } = require('../services/newsService');

/**
 * @route   GET /api/news
 * @desc    Lấy danh sách tin tức (có phân trang và lọc)
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category || null;
    const search = req.query.search || null;

    // Nếu có tìm kiếm
    if (search) {
      const results = searchNews(search);
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

    const result = getAllNews(page, limit, category);

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
router.get('/categories', (req, res) => {
  try {
    const categories = getCategories();
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
router.get('/:id', (req, res) => {
  try {
    const news = getNewsById(req.params.id);

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
router.post('/subscribe', (req, res) => {
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

    const isNew = addSubscriber(email);

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

module.exports = router;
