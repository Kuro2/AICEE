const express = require('express');
const router = express.Router();
const { sendToGemini, analyzeFile } = require('../services/aiService');
const { optionalAuth } = require('../middleware/auth');

// Lưu lịch sử chat trong memory (theo session)
const chatHistories = new Map();

const MAX_HISTORY_LENGTH = 20; // Tối đa 20 tin nhắn mỗi session

/**
 * @route   POST /api/chat
 * @desc    Gửi tin nhắn tới AI và nhận phản hồi
 * @access  Public (có thể không cần đăng nhập)
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
    const sid = sessionId || (req.user ? req.user.id : `guest-${Date.now()}`);

    // Lấy lịch sử chat
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
      // Gộp kết quả phân tích các file
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

    // Thêm vào lịch sử
    if (message) {
      history.push({ role: 'user', content: message });
    }
    history.push({ role: 'model', content: aiResponse.text });

    // Giới hạn lịch sử
    if (history.length > MAX_HISTORY_LENGTH * 2) {
      history.splice(0, 2); // Xóa cặp message-response cũ nhất
    }

    res.json({
      success: true,
      data: {
        message: aiResponse.text,
        status: aiResponse.status || 'info',
        recommendations: aiResponse.recommendations || [],
        sessionId: sid,
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
 * @route   GET /api/chat/history/:sessionId
 * @desc    Lấy lịch sử chat theo session
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
 * @desc    Xóa lịch sử chat
 * @access  Public
 */
router.delete('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  chatHistories.delete(sessionId);

  res.json({
    success: true,
    message: 'Đã xóa lịch sử chat'
  });
});

module.exports = router;
