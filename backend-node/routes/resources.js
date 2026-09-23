const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');

/**
 * @route   GET /api/resources
 * @desc    Lấy danh sách tài nguyên (an toàn/không an toàn)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { isSafe } = req.query;
    let query = {};
    
    if (isSafe !== undefined) {
      query.isSafe = isSafe === 'true';
    }

    const resources = await Resource.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    console.error('Lỗi khi lấy tài nguyên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

module.exports = router;
