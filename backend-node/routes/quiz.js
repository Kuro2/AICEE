const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizTopic = require('../models/QuizTopic');

/**
 * @route   GET /api/quiz/topics
 * @desc    Lấy danh sách các chủ đề trắc nghiệm đã xuất bản
 * @access  Public
 */
router.get('/topics', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { status: 'published' };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    const topics = await QuizTopic.find(filter)
      .sort({ createdAt: -1 })
      .select('title slug description category difficulty questions status createdAt');

    res.json({
      success: true,
      data: {
        topics: topics.map(t => ({
          id: t._id.toString(),
          title: t.title,
          slug: t.slug,
          description: t.description,
          category: t.category,
          difficulty: t.difficulty,
          questionCount: Array.isArray(t.questions) ? t.questions.length : 0,
          createdAt: t.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get Topics Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách chủ đề Quiz' });
  }
});

/**
 * @route   GET /api/quiz/topic/:slug
 * @desc    Lấy chi tiết một chủ đề trắc nghiệm và danh sách câu hỏi theo slug (ví dụ: luadao, email)
 * @access  Public
 */
router.get('/topic/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const normalizedSlug = slug.toLowerCase().trim();

    const topic = await QuizTopic.findOne({ 
      slug: normalizedSlug,
      status: 'published'
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy chủ đề trắc nghiệm "${slug}"`
      });
    }

    res.json({
      success: true,
      data: {
        id: topic._id.toString(),
        title: topic.title,
        slug: topic.slug,
        description: topic.description,
        category: topic.category,
        difficulty: topic.difficulty,
        questionCount: topic.questions.length,
        questions: topic.questions.map((q, idx) => ({
          id: q._id ? q._id.toString() : idx + 1,
          title: q.title,
          type: q.type,
          options: q.options,
          explanation: q.explanation,
          difficulty: q.difficulty
        }))
      }
    });
  } catch (error) {
    console.error('Get Topic Detail Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải câu hỏi chủ đề' });
  }
});

/**
 * @route   GET /api/quiz
 * @desc    Lấy danh sách câu hỏi trắc nghiệm ngẫu nhiên (Backward compatible)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { type, difficulty } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

    const matchQuery = { status: 'published' };
    if (type) matchQuery.type = type;
    if (difficulty) matchQuery.difficulty = difficulty;

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

    const result = { total: 0, url: 0, email: 0, scenario: 0, general: 0 };
    stats.forEach(s => {
      if (result[s._id] !== undefined) result[s._id] = s.count;
      result.total += s.count;
    });

    const topicCount = await QuizTopic.countDocuments({ status: 'published' });
    result.topics = topicCount;

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải thống kê câu hỏi' });
  }
});

module.exports = router;
