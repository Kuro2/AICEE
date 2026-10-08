const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeFile } = require('../services/aiService');
const { optionalAuth } = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');

// Cấu hình multer - lưu file vào thư mục uploads
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Cho phép: ảnh, PDF, Word, text
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Loại file không được hỗ trợ: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Tối đa 5 file
  }
});

/**
 * @route   POST /api/upload/image
 * @desc    Upload 1 file ảnh độc lập (cho ảnh bìa bài viết, banner, avatar...)
 * @access  Public / OptionalAuth
 */
router.post('/image', optionalAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file hình ảnh'
      });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    // Hỗ trợ cả full URL và relative URL
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Tải ảnh thành công',
      data: {
        url: fileUrl,
        relativePath: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi upload ảnh'
    });
  }
});

/**
 * @route   POST /api/upload
 * @desc    Upload file, phân tích bằng AI và lưu vào lịch sử Chat
 * @access  Public
 */
router.post('/', optionalAuth, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một file để phân tích'
      });
    }

    const sid = req.body.sessionId || (req.user ? `user-${req.user.id}` : `guest-${Date.now()}`);
    const userId = req.user ? req.user.id : null;
    const userCustomText = req.body.message && req.body.message.trim() ? req.body.message.trim() : '';

    let clientPreviews = [];
    try {
      if (req.body.previews) {
        clientPreviews = JSON.parse(req.body.previews);
      }
    } catch (e) {}

    // Phân tích từng file
    const analyses = await Promise.all(
      req.files.map(async (file, idx) => {
        const analysis = await analyzeFile(file.originalname, file.mimetype, null);

        // Lưu preview: ưu tiên dataUrl từ client, hoặc base64 tự sinh, hoặc static url
        let preview = clientPreviews[idx] || `/uploads/${file.filename}`;
        if (!clientPreviews[idx] && file.mimetype.startsWith('image/') && file.size <= 500 * 1024) {
          try {
            const b64 = fs.readFileSync(file.path, 'base64');
            preview = `data:${file.mimetype};base64,${b64}`;
          } catch (e) {}
        }

        return {
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          preview,
          ...analysis
        };
      })
    );

    // Tổng hợp kết quả
    const overallStatus = analyses.some(a => a.status === 'danger') ? 'danger' :
                          analyses.some(a => a.status === 'warning') ? 'warning' : 'safe';
    const combinedText = analyses.map(a => `**${a.fileName}**:\n${a.text}`).join('\n\n---\n\n');
    const allRecs = [...new Set(analyses.flatMap(a => a.recommendations || []))];

    // Chuẩn bị metadata file
    const filesMeta = analyses.map(a => ({
      name: a.fileName,
      type: a.fileType,
      size: a.fileSize,
      preview: a.preview
    }));

    const queryTitle = userCustomText || (
      req.files.length === 1 
        ? `Phân tích tệp: ${req.files[0].originalname}` 
        : `Phân tích ${req.files.length} tệp tin: ${req.files.map(f => f.originalname).join(', ')}`
    );

    let userMsgDoc = null;
    let aiMsgDoc = null;

    try {
      userMsgDoc = await ChatMessage.create({
        userId,
        sessionId: sid,
        type: 'user',
        text: queryTitle,
        files: filesMeta
      });

      aiMsgDoc = await ChatMessage.create({
        userId,
        sessionId: sid,
        type: 'ai',
        text: combinedText,
        status: overallStatus,
        recommendations: allRecs
      });
    } catch (saveErr) {
      console.warn('Lỗi lưu tệp vào ChatMessage MongoDB:', saveErr.message);
    }

    res.json({
      success: true,
      data: {
        analyses,
        overallStatus,
        recommendations: allRecs,
        fileCount: req.files.length,
        timestamp: new Date().toISOString(),
        userMessage: userMsgDoc ? {
          id: userMsgDoc._id.toString(),
          type: 'user',
          text: userMsgDoc.text,
          files: userMsgDoc.files,
          timestamp: userMsgDoc.createdAt
        } : null,
        aiMessage: aiMsgDoc ? {
          id: aiMsgDoc._id.toString(),
          type: 'ai',
          text: aiMsgDoc.text,
          status: aiMsgDoc.status,
          recommendations: aiMsgDoc.recommendations,
          timestamp: aiMsgDoc.createdAt
        } : null
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi phân tích file'
    });
  }
});

// Error handler riêng cho multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Kích thước tối đa là 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được upload tối đa 5 file một lần.'
      });
    }
  }
  res.status(400).json({
    success: false,
    message: err.message
  });
});

module.exports = router;
