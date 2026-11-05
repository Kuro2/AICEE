const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { UserModel } = require('../models/User');
const { PaymentModel } = require('../models/Payment');
const Order = require('../models/Order');
const ChatMessage = require('../models/ChatMessage');
const Quiz = require('../models/Quiz');
const News = require('../models/News');
const { generateQuizWithAI, exportToExcel, getTemplateBuffer, parseExcelBuffer } = require('../services/quizService');
const multer = require('multer');
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});
const mongoose = require('mongoose');

// Sử dụng middleware xác thực và kiểm tra quyền admin cho TẤT CẢ các route trong file này
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Lấy thống kê tổng quan (bao gồm biểu đồ người dùng và đăng ký gói cước)
 * @access  Private/Admin
 */
router.get('/stats', async (req, res) => {
  try {
    const userCount = await UserModel.countDocuments();
    
    // Thống kê người dùng theo quyền
    const usersByRole = await UserModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // 2. Thống kê phân bố gói cước (Plan distribution)
    const planAgg = await UserModel.aggregate([
      { $group: { _id: { $ifNull: ['$plan', 'free'] }, count: { $sum: 1 } } }
    ]);
    const planMap = Object.fromEntries(planAgg.map(p => [(p._id || 'free').toLowerCase(), p.count]));
    const usersByPlan = [
      { plan: 'free', name: 'Gói Free', count: planMap['free'] || 0, color: '#64748b' },
      { plan: 'premium', name: 'Gói Premium', count: (planMap['premium'] || 0) + (planMap['premium_monthly'] || 0), color: '#06b6d4' },
      { plan: 'business', name: 'Gói Business', count: (planMap['business'] || 0) + (planMap['business_yearly'] || 0), color: '#a855f7' },
      { plan: 'api', name: 'Platform API', count: (planMap['api'] || 0) + (planMap['platform-api'] || 0), color: '#10b981' }
    ];

    // Số người dùng trả phí
    const paidUsersCount = usersByPlan
      .filter(p => p.plan !== 'free')
      .reduce((sum, p) => sum + p.count, 0);

    // 3. Doanh thu thanh toán tổng quan (Tổng hợp từ Order SePay và PaymentModel)
    let totalRevenue = 0;
    let totalSuccessPayments = 0;

    const orderAgg = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    if (orderAgg[0]) {
      totalRevenue += orderAgg[0].total;
      totalSuccessPayments += orderAgg[0].count;
    }

    if (PaymentModel) {
      try {
        const revAgg = await PaymentModel.aggregate([
          { $match: { status: 'success' } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);
        if (revAgg[0]) {
          totalRevenue += revAgg[0].total;
          totalSuccessPayments += revAgg[0].count;
        }
      } catch (err) {
        console.warn('PaymentModel aggregation skipped:', err.message);
      }
    }

    // 4. Dữ liệu xu hướng 7 ngày gần nhất (Registration & Subscription trend)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      days.push({ dateStr, label, newUsers: 0, newSubscribers: 0, revenue: 0 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    // Người dùng đăng ký mới theo ngày
    const userRegs = await UserModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Đơn đăng ký gói SePay thành công theo ngày
    const orderStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      }
    ]);

    const userRegMap = Object.fromEntries(userRegs.map(r => [r._id, r.count]));
    const paymentMap = Object.fromEntries(orderStats.map(p => [p._id, { count: p.count, revenue: p.revenue }]));

    days.forEach(day => {
      day.newUsers = userRegMap[day.dateStr] || 0;
      day.newSubscribers = paymentMap[day.dateStr]?.count || 0;
      day.revenue = paymentMap[day.dateStr]?.revenue || 0;
    });

    res.json({
      success: true,
      data: {
        totalUsers: userCount,
        usersByRole,
        usersByPlan,
        paidUsersCount,
        totalRevenue,
        totalSuccessPayments,
        trendData: days,
        totalChatMessages: await ChatMessage.countDocuments(),
        totalChatSessions: (await ChatMessage.distinct('sessionId')).length
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy thống kê' });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Lấy danh sách người dùng
 * @access  Private/Admin
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await UserModel.find()
      .select('-password') // Không trả về mật khẩu
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await UserModel.countDocuments();

    res.json({
      success: true,
      data: {
        users: users.map(u => {
          const obj = u.toObject();
          obj.id = obj._id;
          delete obj._id;
          return obj;
        }),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin Users Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách người dùng' });
  }
});

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Thay đổi quyền người dùng
 * @access  Private/Admin
 */
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Quyền không hợp lệ' });
    }

    // Không cho phép tự đổi quyền của chính mình (chống việc admin tự hạ quyền rồi mất quyền quản trị)
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Không thể tự thay đổi quyền của chính mình' });
    }

    const user = await UserModel.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({ success: true, message: 'Cập nhật quyền thành công', data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật quyền người dùng' });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Xóa người dùng
 * @access  Private/Admin
 */
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Không thể tự xóa tài khoản của chính mình' });
    }

    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa người dùng' });
  }
});

/**
 * ====================================================================
 *                 QUẢN LÝ LỊCH SỬ TIN NHẮN CHAT AI (ADMIN)
 * ====================================================================
 */

/**
 * @route   GET /api/admin/chats/conversations
 * @desc    Lấy danh sách các phiên chat/cuộc hội thoại người dùng (kèm phân trang, lọc, tìm kiếm)
 * @access  Private/Admin
 */
router.get('/chats/conversations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const { search, userType, status, userId } = req.query;

    const matchConditions = {};

    // Lọc theo người dùng cụ thể nếu truyền userId
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      matchConditions.userId = new mongoose.Types.ObjectId(userId);
    }

    // Tìm kiếm từ khóa (tên user, email, sessionId, nội dung tin nhắn)
    if (search && search.trim()) {
      const s = search.trim();
      const userMatches = await UserModel.find({
        $or: [
          { name: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } }
        ]
      }).select('_id');
      const matchedUserIds = userMatches.map(u => u._id);

      const messageMatches = await ChatMessage.distinct('sessionId', {
        text: { $regex: s, $options: 'i' }
      });

      matchConditions.$or = [
        { sessionId: { $regex: s, $options: 'i' } },
        { sessionId: { $in: messageMatches } },
        ...(matchedUserIds.length ? [{ userId: { $in: matchedUserIds } }] : [])
      ];
    }

    // Pipeline nhóm theo sessionId
    const pipeline = [
      ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
      {
        $sort: { createdAt: 1 }
      },
      {
        $group: {
          _id: '$sessionId',
          userId: { $first: '$userId' },
          messageCount: { $sum: 1 },
          userMessageCount: { $sum: { $cond: [{ $eq: ['$type', 'user'] }, 1, 0] } },
          aiMessageCount: { $sum: { $cond: [{ $eq: ['$type', 'ai'] }, 1, 0] } },
          lastActive: { $max: '$createdAt' },
          firstActive: { $min: '$createdAt' },
          lastMessage: { $last: '$text' },
          lastType: { $last: '$type' },
          lastStatus: { $last: '$status' },
          dangerCount: { $sum: { $cond: [{ $eq: ['$status', 'danger'] }, 1, 0] } },
          warningCount: { $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] } },
          safeCount: { $sum: { $cond: [{ $eq: ['$status', 'safe'] }, 1, 0] } },
          filesCount: { $sum: { $size: { $ifNull: ['$files', []] } } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: {
          path: '$userInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          sessionId: '$_id',
          userId: 1,
          messageCount: 1,
          userMessageCount: 1,
          aiMessageCount: 1,
          lastActive: 1,
          firstActive: 1,
          lastMessage: 1,
          lastType: 1,
          lastStatus: 1,
          dangerCount: 1,
          warningCount: 1,
          safeCount: 1,
          filesCount: 1,
          user: {
            $cond: [
              { $ifNull: ['$userInfo._id', false] },
              {
                id: '$userInfo._id',
                name: '$userInfo.name',
                email: '$userInfo.email',
                avatar: '$userInfo.avatar',
                role: '$userInfo.role',
                plan: '$userInfo.plan'
              },
              null
            ]
          }
        }
      }
    ];

    // Lọc theo userType (đăng ký vs khách)
    if (userType === 'user') {
      pipeline.push({ $match: { user: { $ne: null } } });
    } else if (userType === 'guest') {
      pipeline.push({ $match: { user: null } });
    }

    // Lọc theo status nguy hại
    if (status === 'danger') {
      pipeline.push({ $match: { dangerCount: { $gt: 0 } } });
    } else if (status === 'warning') {
      pipeline.push({ $match: { warningCount: { $gt: 0 } } });
    } else if (status === 'safe') {
      pipeline.push({ $match: { safeCount: { $gt: 0 } } });
    }

    // Đếm tổng số kết quả sau lọc
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await ChatMessage.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Sắp xếp thời gian hoạt động mới nhất và phân trang
    pipeline.push(
      { $sort: { lastActive: -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const conversations = await ChatMessage.aggregate(pipeline);

    // Tính nhanh tổng quan thống kê cho Admin
    const allStatsResult = await ChatMessage.aggregate([
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          totalDanger: { $sum: { $cond: [{ $eq: ['$status', 'danger'] }, 1, 0] } },
          totalWarning: { $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] } },
          totalFiles: { $sum: { $size: { $ifNull: ['$files', []] } } },
          sessions: { $addToSet: '$sessionId' }
        }
      }
    ]);

    const stats = {
      totalConversations: allStatsResult[0]?.sessions?.length || 0,
      totalMessages: allStatsResult[0]?.totalMessages || 0,
      totalDanger: allStatsResult[0]?.totalDanger || 0,
      totalWarning: allStatsResult[0]?.totalWarning || 0,
      totalFiles: allStatsResult[0]?.totalFiles || 0
    };

    res.json({
      success: true,
      data: {
        conversations,
        stats,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin Chat Conversations Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải lịch sử tin nhắn' });
  }
});

/**
 * @route   GET /api/admin/chats/conversations/:sessionId
 * @desc    Lấy toàn bộ chi tiết cuộc hội thoại của 1 sessionId
 * @access  Private/Admin
 */
router.get('/chats/conversations/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .populate('userId', 'name email avatar role plan');

    if (!messages || messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc hội thoại này'
      });
    }

    // Lấy thông tin user nếu có
    const userDoc = messages.find(m => m.userId)?.userId || null;
    let user = null;
    if (userDoc) {
      user = {
        id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        avatar: userDoc.avatar,
        role: userDoc.role,
        plan: userDoc.plan
      };
    }

    // Đếm thống kê phiên chat này
    const sessionStats = {
      userMessages: messages.filter(m => m.type === 'user').length,
      aiMessages: messages.filter(m => m.type === 'ai').length,
      dangerCount: messages.filter(m => m.status === 'danger').length,
      warningCount: messages.filter(m => m.status === 'warning').length,
      safeCount: messages.filter(m => m.status === 'safe').length,
      totalFiles: messages.reduce((acc, m) => acc + (m.files?.length || 0), 0)
    };

    res.json({
      success: true,
      data: {
        sessionId,
        user,
        stats: sessionStats,
        messageCount: messages.length,
        messages: messages.map(m => ({
          id: m._id.toString(),
          type: m.type,
          text: m.text,
          status: m.status,
          recommendations: m.recommendations || [],
          files: m.files || [],
          createdAt: m.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Admin Chat Detail Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải chi tiết cuộc hội thoại' });
  }
});

/**
 * @route   DELETE /api/admin/chats/conversations/:sessionId
 * @desc    Xóa toàn bộ cuộc hội thoại của một sessionId
 * @access  Private/Admin
 */
router.delete('/chats/conversations/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await ChatMessage.deleteMany({ sessionId });
    res.json({
      success: true,
      message: `Đã xóa cuộc hội thoại (${result.deletedCount} tin nhắn)`
    });
  } catch (error) {
    console.error('Admin Delete Conversation Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa cuộc hội thoại' });
  }
});

/**
 * @route   DELETE /api/admin/chats/messages/:id
 * @desc    Xóa một tin nhắn cụ thể
 * @access  Private/Admin
 */
router.delete('/chats/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ChatMessage.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tin nhắn' });
    }
    res.json({ success: true, message: 'Đã xóa tin nhắn thành công' });
  } catch (error) {
    console.error('Admin Delete Message Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa tin nhắn' });
  }
});

/**
 * ====================================================================
 *                 QUẢN LÝ NGÂN HÀNG CÂU HỎI QUIZ (ADMIN)
 * ====================================================================
 */

/**
 * @route   GET /api/admin/quiz
 * @desc    Lấy danh sách câu hỏi trong ngân hàng đề (phân trang, lọc, thống kê)
 * @access  Private/Admin
 */
router.get('/quiz', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { type, search, difficulty, status } = req.query;

    const query = {};
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (status) query.status = status;
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { explanation: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const [total, quizzes] = await Promise.all([
      Quiz.countDocuments(query),
      Quiz.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    // Thống kê nhanh
    const [totalAll, typeStats] = await Promise.all([
      Quiz.countDocuments(),
      Quiz.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        quizzes,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          total: totalAll,
          byType: Object.fromEntries(typeStats.map(s => [s._id, s.count]))
        }
      }
    });
  } catch (error) {
    console.error('Admin Get Quizzes Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách câu hỏi' });
  }
});

/**
 * @route   POST /api/admin/quiz/generate
 * @desc    Dùng Gemini AI sinh danh sách câu hỏi từ bài báo hoặc văn bản
 * @access  Private/Admin
 */
router.post('/quiz/generate', async (req, res) => {
  try {
    const { newsId, rawContent, count = 2 } = req.body;

    let contentToAnalyze = rawContent;
    let sourceNewsId = null;

    if (newsId) {
      const newsItem = await News.findById(newsId);
      if (!newsItem) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết nguồn' });
      }
      sourceNewsId = newsItem._id;
      contentToAnalyze = `Tiêu đề: ${newsItem.title}\nTóm tắt: ${newsItem.excerpt || ''}\nNội dung: ${newsItem.content || ''}`;
    }

    if (!contentToAnalyze || !contentToAnalyze.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp nội dung bài viết hoặc chọn bài báo' });
    }

    const questions = await generateQuizWithAI(contentToAnalyze, count);

    // Gắn sourceNewsId nếu có
    const finalQuestions = questions.map(q => ({
      ...q,
      sourceNewsId
    }));

    res.json({
      success: true,
      message: `AI đã sinh thành công ${finalQuestions.length} câu hỏi trắc nghiệm!`,
      data: {
        questions: finalQuestions
      }
    });
  } catch (error) {
    console.error('Admin Generate Quiz Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi sinh câu hỏi từ AI' });
  }
});

/**
 * @route   POST /api/admin/quiz/bulk-save
 * @desc    Lưu hàng loạt câu hỏi từ bảng chỉnh sửa trực tiếp vào CSDL
 * @access  Private/Admin
 */
router.post('/quiz/bulk-save', async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách câu hỏi không được rỗng' });
    }

    // Làm sạch và validate
    const validQuestions = [];
    const validationErrors = [];

    questions.forEach((q, idx) => {
      if (!q.title || !q.title.trim()) {
        validationErrors.push(`Câu số ${idx + 1}: Thiếu nội dung câu hỏi`);
        return;
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        validationErrors.push(`Câu số ${idx + 1}: Cần tối thiểu 2 phương án lựa chọn`);
        return;
      }
      if (!q.options.some(o => o.isCorrect)) {
        q.options[0].isCorrect = true; // Đảm bảo luôn có 1 đáp án đúng
      }

      validQuestions.push({
        title: q.title.trim(),
        type: ['url', 'email', 'scenario', 'general'].includes(q.type) ? q.type : 'scenario',
        options: q.options.map(o => ({ text: String(o.text || '').trim(), isCorrect: Boolean(o.isCorrect) })),
        explanation: q.explanation ? q.explanation.trim() : '',
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
        sourceNewsId: q.sourceNewsId || null,
        status: q.status || 'published'
      });
    });

    if (validQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có câu hỏi hợp lệ để lưu',
        errors: validationErrors
      });
    }

    const saved = await Quiz.insertMany(validQuestions);

    res.json({
      success: true,
      message: `Đã lưu thành công ${saved.length} câu hỏi vào ngân hàng đề!`,
      data: {
        savedCount: saved.length,
        errors: validationErrors
      }
    });
  } catch (error) {
    console.error('Admin Bulk Save Quiz Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi lưu ngân hàng câu hỏi' });
  }
});

/**
 * @route   POST /api/admin/quiz/export-excel
 * @desc    Xuất danh sách câu hỏi từ bảng ra file Excel (.xlsx) chuẩn Kahoot
 * @access  Private/Admin
 */
router.post('/quiz/export-excel', async (req, res) => {
  try {
    let { questions } = req.body;

    // Nếu không truyền questions, lấy tất cả từ DB
    if (!Array.isArray(questions) || questions.length === 0) {
      questions = await Quiz.find({ status: 'published' }).sort({ createdAt: -1 }).limit(200);
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có câu hỏi nào để xuất file Excel' });
    }

    const buffer = exportToExcel(questions);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=AICEE_Quiz_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Admin Export Quiz Excel Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi xuất file Excel' });
  }
});

/**
 * @route   GET /api/admin/quiz/template
 * @desc    Tải file template Excel mẫu để soạn câu hỏi
 * @access  Private/Admin
 */
router.get('/quiz/template', (req, res) => {
  try {
    const buffer = getTemplateBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=AICEE_Quiz_Template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Admin Download Template Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải template Excel' });
  }
});

/**
 * @route   POST /api/admin/quiz/import-excel
 * @desc    Tải file Excel lên để parse dữ liệu đổ vào bảng chỉnh sửa trực tuyến
 * @access  Private/Admin
 */
router.post('/quiz/import-excel', memoryUpload.single('file'), (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file Excel (.xlsx, .xls) để tải lên' });
    }

    const { questions, errors } = parseExcelBuffer(req.file.buffer);

    res.json({
      success: true,
      message: `Đã đọc thành công ${questions.length} câu hỏi từ file Excel!`,
      data: {
        questions,
        errors
      }
    });
  } catch (error) {
    console.error('Admin Import Quiz Excel Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Lỗi đọc file Excel' });
  }
});

/**
 * @route   PUT /api/admin/quiz/:id
 * @desc    Cập nhật một câu hỏi cụ thể
 * @access  Private/Admin
 */
router.put('/quiz/:id', async (req, res) => {
  try {
    const { title, type, options, explanation, difficulty, status } = req.body;
    const updated = await Quiz.findByIdAndUpdate(
      req.params.id,
      { title, type, options, explanation, difficulty, status, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
    }
    res.json({ success: true, message: 'Cập nhật câu hỏi thành công', data: { quiz: updated } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật câu hỏi' });
  }
});

/**
 * @route   DELETE /api/admin/quiz/:id
 * @desc    Xóa một câu hỏi khỏi CSDL
 * @access  Private/Admin
 */
router.delete('/quiz/:id', async (req, res) => {
  try {
    const deleted = await Quiz.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
    }
    res.json({ success: true, message: 'Đã xóa câu hỏi thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa câu hỏi' });
  }
});

module.exports = router;
