const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');

/**
 * @route   GET /api/quiz
 * @desc    Lấy danh sách câu hỏi trắc nghiệm ngẫu nhiên để người dùng luyện tập
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { type, difficulty } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

    const matchQuery = { status: 'published' };
    if (type) matchQuery.type = type;
    if (difficulty) matchQuery.difficulty = difficulty;

    // Lấy câu hỏi ngẫu nhiên từ MongoDB
    const count = await Quiz.countDocuments(matchQuery);

    let questions = [];
    if (count > 0) {
      questions = await Quiz.aggregate([
        { $match: matchQuery },
        { $sample: { size: limit } }
      ]);
    }

    res.json({
      success: true,
      data: {
        questions: questions.map(q => ({
          id: q._id.toString(),
          title: q.title,
          type: q.type,
          options: q.options,
          explanation: q.explanation,
          difficulty: q.difficulty
        })),
        totalAvailable: count
      }
    });
  } catch (error) {
    console.error('Get Public Quiz Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách câu hỏi trắc nghiệm' });
  }
});

/**
 * @route   GET /api/quiz/stats
 * @desc    Lấy thống kê số lượng câu hỏi theo từng loại
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Quiz.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const result = {
      total: 0,
      url: 0,
      email: 0,
      scenario: 0,
      general: 0
    };

    stats.forEach(s => {
      if (result[s._id] !== undefined) {
        result[s._id] = s.count;
      }
      result.total += s.count;
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải thống kê câu hỏi' });
  }
});

module.exports = router;

