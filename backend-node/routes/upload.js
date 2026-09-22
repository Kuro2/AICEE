const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeFile } = require('../services/aiService');
const { optionalAuth } = require('../middleware/auth');

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
 * @route   POST /api/upload
 * @desc    Upload file và phân tích bằng AI
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

    // Phân tích từng file
    const analyses = await Promise.all(
      req.files.map(async (file) => {
        const analysis = await analyzeFile(file.originalname, file.mimetype, null);

        // Xóa file sau khi phân tích (không lưu lại)
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          // Bỏ qua lỗi xóa file
        }

        return {
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          ...analysis
        };
      })
    );

    // Tổng hợp kết quả
    const overallStatus = analyses.some(a => a.status === 'danger') ? 'danger' :
                          analyses.some(a => a.status === 'warning') ? 'warning' : 'safe';

    res.json({
      success: true,
      data: {
        analyses,
        overallStatus,
        fileCount: req.files.length,
        timestamp: new Date().toISOString()
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
