const express = require('express');
const router = express.Router();
const { sendToGemini, analyzeFile } = require('../services/aiService');
const { optionalAuth } = require('../middleware/auth');
const { checkScanLimit } = require('../middleware/subscription');
const ChatMessage = require('../models/ChatMessage');

// Cache in-memory theo session để dự phòng
const memoryChatHistories = new Map();

/**
 * @route   POST /api/chat
 * @desc    Gửi tin nhắn tới AI và lưu trữ lịch sử
 * @access  Public (tự động liên kết userId nếu đã đăng nhập)
 */
router.post('/', optionalAuth, checkScanLimit, async (req, res) => {
  try {
    const { message, sessionId, files } = req.body;

    if (!message && (!files || files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tin nhắn hoặc đính kèm file'
      });
    }

    // Xác định session ID & user ID
    const sid = sessionId || (req.user ? `user-${req.user.id}` : `guest-${Date.now()}`);
    const userId = req.user ? req.user.id : null;

    // Lấy lịch sử gần nhất để làm ngữ cảnh cho AI
    let contextHistory = [];
    try {
      const recentDocs = await ChatMessage.find({
        $or: [
          { sessionId: sid },
          ...(userId ? [{ userId }] : [])
        ]
      })
      .sort({ createdAt: -1 })
      .limit(16);

      // Đảo ngược về thứ tự thời gian cũ -> mới
      contextHistory = recentDocs.reverse().map(d => ({
        role: d.type === 'user' ? 'user' : 'model',
        content: d.text
      }));
    } catch (dbErr) {
      console.warn('Không thể đọc ngữ cảnh từ DB, dùng memory:', dbErr.message);
      contextHistory = memoryChatHistories.get(sid) || [];
    }

    // Xử lý phản hồi AI
    let aiResponse;
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
      aiResponse = await sendToGemini(message, contextHistory);
    }

    const userText = message || (files?.length ? `Đã gửi ${files.length} tệp để phân tích` : '');
    const aiText = aiResponse.text;

    // Lưu vào MongoDB
    let savedAiId = Date.now();
    try {
      await ChatMessage.create({
        userId,
        sessionId: sid,
        type: 'user',
        text: userText,
        files: files ? files.map(f => ({ name: f.name, type: f.type, size: f.size, preview: f.preview })) : []
      });

      const aiMsgDoc = await ChatMessage.create({
        userId,
        sessionId: sid,
        type: 'ai',
        text: aiText,
        status: aiResponse.status || 'info',
        recommendations: aiResponse.recommendations || []
      });
      savedAiId = aiMsgDoc._id;
    } catch (saveErr) {
      console.warn('Lỗi lưu tin nhắn vào MongoDB:', saveErr.message);
    }

    // Cập nhật bộ nhớ đệm memory
    if (!memoryChatHistories.has(sid)) memoryChatHistories.set(sid, []);
    const memHist = memoryChatHistories.get(sid);
    memHist.push({ role: 'user', content: userText });
    memHist.push({ role: 'model', content: aiText });
    if (memHist.length > 30) memHist.splice(0, 2);

    res.json({
      success: true,
      data: {
        id: savedAiId,
        message: aiText,
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
 * @desc    Lấy lịch sử chat đã lưu theo sessionId và userId
 * @access  Public (nhận diện theo token nếu có)
 */
router.get('/history/:sessionId', optionalAuth, async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user ? req.user.id : null;

  try {
    const filter = {
      $or: [
        { sessionId },
        ...(userId ? [{ userId }] : [])
      ]
    };

    const docs = await ChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .limit(100);

    const history = docs.map(d => ({
      id: d._id.toString(),
      type: d.type,
      text: d.text,
      status: d.status,
      recommendations: d.recommendations || [],
      files: d.files || [],
      timestamp: d.createdAt
    }));

    res.json({
      success: true,
      data: {
        sessionId,
        history,
        messageCount: history.length
      }
    });
  } catch (err) {
    console.error('Lỗi lấy lịch sử chat:', err);
    // Dự phòng memory nếu lỗi MongoDB
    const fallback = memoryChatHistories.get(sessionId) || [];
    res.json({
      success: true,
      data: {
        sessionId,
        history: fallback.map((h, i) => ({
          id: i,
          type: h.role === 'user' ? 'user' : 'ai',
          text: h.content,
          timestamp: new Date()
        })),
        messageCount: fallback.length
      }
    });
  }
});

/**
 * @route   GET /api/chat/feed
 * @desc    Lấy danh sách dòng thời gian (Timeline) các lần tư vấn/phân tích AI kèm thống kê
 * @access  Public (nhận diện theo token nếu có)
 */
router.get('/feed', optionalAuth, async (req, res) => {
  const sessionId = req.query.sessionId;
  const userId = req.user ? req.user.id : null;

  try {
    const filter = {};
    if (userId) {
      filter.$or = [{ userId }, ...(sessionId ? [{ sessionId }] : [])];
    } else if (sessionId) {
      filter.sessionId = sessionId;
    } else {
      return res.json({ success: true, data: { items: [], stats: { total: 0, safe: 0, warning: 0, danger: 0 } } });
    }

    const docs = await ChatMessage.find(filter).sort({ createdAt: 1 }).limit(200);

    // Ghép cặp câu hỏi người dùng và phản hồi AI tương ứng
    const items = [];
    for (let i = 0; i < docs.length; i++) {
      if (docs[i].type === 'user') {
        const userDoc = docs[i];
        let aiDoc = null;
        if (i + 1 < docs.length && docs[i + 1].type === 'ai') {
          aiDoc = docs[i + 1];
          i++; // Bỏ qua aiDoc ở vòng lặp ngoài
        }

        const textLower = userDoc.text.toLowerCase();
        let category = 'general';
        if (userDoc.files && userDoc.files.length > 0) category = 'file';
        else if (textLower.includes('http://') || textLower.includes('https://') || textLower.includes('.vn') || textLower.includes('.com') || textLower.includes('.xyz') || textLower.includes('link') || textLower.includes('web')) category = 'url';
        else if (textLower.includes('@') || textLower.includes('email') || textLower.includes('thư')) category = 'email';
        else if (/\b(0|\+84)\d{8,10}\b/.test(textLower) || textLower.includes('sđt') || textLower.includes('điện thoại')) category = 'phone';

        const status = aiDoc ? aiDoc.status : 'info';

        items.push({
          id: userDoc._id.toString(),
          aiId: aiDoc ? aiDoc._id.toString() : null,
          query: userDoc.text,
          files: userDoc.files || [],
          response: aiDoc ? aiDoc.text : 'Chưa có phản hồi.',
          status,
          category,
          recommendations: aiDoc ? (aiDoc.recommendations || []) : [],
          timestamp: userDoc.createdAt
        });
      } else if (docs[i].type === 'ai') {
        items.push({
          id: docs[i]._id.toString(),
          aiId: docs[i]._id.toString(),
          query: 'Tư vấn an ninh mạng',
          files: [],
          response: docs[i].text,
          status: docs[i].status || 'info',
          category: 'general',
          recommendations: docs[i].recommendations || [],
          timestamp: docs[i].createdAt
        });
      }
    }

    // Sắp xếp mục mới nhất lên đầu timeline
    items.reverse();

    const stats = {
      total: items.length,
      safe: items.filter(it => it.status === 'safe').length,
      warning: items.filter(it => it.status === 'warning').length,
      danger: items.filter(it => it.status === 'danger').length,
    };

    res.json({
      success: true,
      data: {
        items,
        stats
      }
    });
  } catch (err) {
    console.error('Lỗi lấy feed nhật ký:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải nhật ký tư vấn' });
  }
});

/**
 * @route   DELETE /api/chat/message/:id
 * @desc    Xóa một mục cụ thể trong nhật ký
 * @access  Public
 */
router.delete('/message/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await ChatMessage.deleteOne({ _id: id });
    res.json({ success: true, message: 'Đã xóa mục nhật ký thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi xóa mục nhật ký' });
  }
});

/**
 * @route   DELETE /api/chat/history/:sessionId
 * @desc    Xóa toàn bộ lịch sử chat
 * @access  Public
 */
router.delete('/history/:sessionId', optionalAuth, async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user ? req.user.id : null;

  try {
    const filter = {
      $or: [
        { sessionId },
        ...(userId ? [{ userId }] : [])
      ]
    };
    await ChatMessage.deleteMany(filter);
  } catch (err) {
    console.warn('Lỗi xóa tin nhắn trong DB:', err.message);
  }

  memoryChatHistories.delete(sessionId);

  res.json({
    success: true,
    message: 'Đã xóa lịch sử chat thành công'
  });
});

module.exports = router;
