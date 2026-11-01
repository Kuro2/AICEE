const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { UserModel } = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const mongoose = require('mongoose');

// Sử dụng middleware xác thực và kiểm tra quyền admin cho TẤT CẢ các route trong file này
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Lấy thống kê tổng quan
 * @access  Private/Admin
 */
router.get('/stats', async (req, res) => {
  try {
    const userCount = await UserModel.countDocuments();
    const totalChatMessages = await ChatMessage.countDocuments();
    const totalChatSessions = (await ChatMessage.distinct('sessionId')).length;
    
    // Thống kê người dùng theo quyền
    const usersByRole = await UserModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: userCount,
        usersByRole,
        totalChatMessages,
        totalChatSessions
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

module.exports = router;
