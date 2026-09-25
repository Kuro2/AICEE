const express = require('express');
const router = express.Router();
const { sendToGemini, analyzeFile } = require('../services/aiService');
const { optionalAuth, authenticate } = require('../middleware/auth');
const { requirePremium } = require('../middleware/checkPremium');
const { ChatHistoryModel } = require('../models/ChatHistory');

// Lưu lịch sử chat trong memory (cho user vãng lai hoặc free)
const chatHistories = new Map();
const MAX_HISTORY_LENGTH = 20;

/**
 * @route   POST /api/chat
 * @desc    Gửi tin nhắn tới AI và nhận phản hồi
 * @access  Public (có optionalAuth)
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { message, sessionId, files } = req.body;

    if (!message && (!files || files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tin nhắn hoặc đính kèm file'
      });
    }

    // Tạo session ID nếu chưa có
    const sid = sessionId || (req.user ? `user-${req.user.id}-${Date.now()}` : `guest-${Date.now()}`);

    // Lấy lịch sử chat bộ nhớ tạm
    if (!chatHistories.has(sid)) {
      chatHistories.set(sid, []);
    }
    const history = chatHistories.get(sid);

    let aiResponse;

    // Nếu có file đính kèm
    if (files && files.length > 0) {
      const fileResults = await Promise.all(
        files.map(f => analyzeFile(f.name, f.type, f.content))
      );
      aiResponse = {
        text: fileResults.map(r => r.text).join('\n\n---\n\n'),
        status: fileResults.some(r => r.status === 'danger') ? 'danger' :
                fileResults.some(r => r.status === 'warning') ? 'warning' : 'safe',
        recommendations: [...new Set(fileResults.flatMap(r => r.recommendations || []))]
      };
    } else {
      // Gửi tin nhắn text tới AI
      aiResponse = await sendToGemini(message, history);
    }

    // Thêm vào lịch sử memory
    if (message) {
      history.push({ role: 'user', content: message });
    }
    history.push({ role: 'model', content: aiResponse.text });

    if (history.length > MAX_HISTORY_LENGTH * 2) {
      history.splice(0, 2);
    }

    // Nếu user là Premium: Lưu trực tiếp vào MongoDB ChatHistory
    let savedToDB = false;
    if (req.user && req.user.isPremium) {
      try {
        const userMsg = {
          role: 'user',
          text: message || (files ? `[Gửi ${files.length} file đính kèm]` : ''),
          status: 'info',
          timestamp: new Date()
        };

        const aiMsg = {
          role: 'ai',
          text: aiResponse.text || '',
          status: aiResponse.status || 'info',
          recommendations: aiResponse.recommendations || [],
          timestamp: new Date()
        };

        const titleText = message ? (message.length > 45 ? `${message.substring(0, 45)}...` : message) : 'Phân tích tài liệu';

        await ChatHistoryModel.findOneAndUpdate(
          { userId: req.user.id, sessionId: sid },
          {
            $push: { messages: { $each: [userMsg, aiMsg] } },
            $setOnInsert: { title: titleText, isArchived: false }
          },
          { upsert: true, new: true }
        );
        savedToDB = true;
      } catch (dbErr) {
        console.error('Lỗi lưu lịch sử chat vào DB:', dbErr);
      }
    }

    res.json({
      success: true,
      data: {
        message: aiResponse.text,
        status: aiResponse.status || 'info',
        recommendations: aiResponse.recommendations || [],
        sessionId: sid,
        savedToDB,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý tin nhắn. Vui lòng thử lại.',
      data: {
        message: '❌ Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.',
        status: 'info'
      }
    });
  }
});

/**
 * @route   GET /api/chat/sessions
 * @desc    Lấy danh sách các phiên chat đã lưu của tài khoản Premium
 * @access  Private (Premium Only)
 */
router.get('/sessions', authenticate, requirePremium, async (req, res) => {
  try {
    const sessions = await ChatHistoryModel.find({
      userId: req.user.id,
      isArchived: false
    })
      .select('sessionId title createdAt updatedAt messages')
      .sort({ updatedAt: -1 })
      .lean();

    const formattedSessions = sessions.map(s => ({
      id: s._id,
      sessionId: s.sessionId,
      title: s.title || 'Cuộc trò chuyện mới',
      messageCount: s.messages ? s.messages.length : 0,
      lastMessage: s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1].text.substring(0, 60) : '',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }));

    res.json({
      success: true,
      data: { sessions: formattedSessions }
    });
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách phiên trò chuyện'
    });
  }
});

/**
 * @route   GET /api/chat/sessions/:sessionId
 * @desc    Lấy toàn bộ tin nhắn của 1 phiên chat đã lưu
 * @access  Private (Premium Only)
 */
router.get('/sessions/:sessionId', authenticate, requirePremium, async (req, res) => {
  try {
    const session = await ChatHistoryModel.findOne({
      userId: req.user.id,
      sessionId: req.params.sessionId
    }).lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên trò chuyện'
      });
    }

    res.json({
      success: true,
      data: { session }
    });
  } catch (error) {
    console.error('Get chat session detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải nội dung phiên trò chuyện'
    });
  }
});

/**
 * @route   PATCH /api/chat/sessions/:sessionId
 * @desc    Đổi tên tiêu đề của phiên chat
 * @access  Private (Premium Only)
 */
router.patch('/sessions/:sessionId', authenticate, requirePremium, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề không được để trống'
      });
    }

    const session = await ChatHistoryModel.findOneAndUpdate(
      { userId: req.user.id, sessionId: req.params.sessionId },
      { title: title.trim() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên trò chuyện'
      });
    }

    res.json({
      success: true,
      data: { session }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể đổi tên phiên trò chuyện'
    });
  }
});

/**
 * @route   DELETE /api/chat/sessions/:sessionId
 * @desc    Xóa phiên chat đã lưu
 * @access  Private (Premium Only)
 */
router.delete('/sessions/:sessionId', authenticate, requirePremium, async (req, res) => {
  try {
    const result = await ChatHistoryModel.findOneAndDelete({
      userId: req.user.id,
      sessionId: req.params.sessionId
    });

    // Đồng thời xóa khỏi memory nếu có
    chatHistories.delete(req.params.sessionId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên trò chuyện để xóa'
      });
    }

    res.json({
      success: true,
      message: 'Đã xóa phiên trò chuyện thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phiên trò chuyện'
    });
  }
});

/**
 * @route   GET /api/chat/history/:sessionId
 * @desc    Lấy lịch sử chat tạm trong memory theo session (cho guest / free)
 * @access  Public
 */
router.get('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const history = chatHistories.get(sessionId) || [];

  res.json({
    success: true,
    data: {
      sessionId,
      history,
      messageCount: history.length
    }
  });
});

/**
 * @route   DELETE /api/chat/history/:sessionId
 * @desc    Xóa lịch sử chat tạm trong memory
 * @access  Public
 */
router.delete('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  chatHistories.delete(sessionId);

  res.json({
    success: true,
    message: 'Đã làm mới phiên chat'
  });
});

module.exports = router;
