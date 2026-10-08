const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Resource = require('../models/Resource');
const { optionalAuth, authenticate, isAdmin } = require('../middleware/auth');

// Cấu hình thư mục uploads cho bằng chứng
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `evidence-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
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
    cb(new Error(`Loại file không được hỗ trợ: ${file.mimetype}. Vui lòng tải file ảnh (PNG, JPG) hoặc PDF.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
    files: 5 // Tối đa 5 file bằng chứng
  }
});

/**
 * @route   POST /api/reports
 * @desc    Gửi báo cáo lừa đảo mới (kèm file bằng chứng PNG/PDF)
 * @access  Public / OptionalAuth
 */
router.post('/', optionalAuth, upload.array('evidenceFiles', 5), async (req, res) => {
  try {
    const { target, type, title, description, reporterName, reporterEmail, reporterPhone } = req.body;

    if (!target || !target.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập địa chỉ website, số điện thoại hoặc email cần báo cáo'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp chi tiết bằng chứng hoặc hành vi lừa đảo'
      });
    }

    const userId = req.user ? req.user.id : null;

    // Xử lý các tệp đính kèm
    const evidenceFiles = (req.files || []).map(file => ({
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    // Tạo báo cáo mới
    const newReport = new Report({
      userId,
      target: target.trim(),
      type: type || 'Website',
      title: title ? title.trim() : `Báo cáo: ${target.trim()}`,
      description: description.trim(),
      evidenceFiles,
      reporterName: reporterName ? reporterName.trim() : (req.user?.name || 'Ẩn danh'),
      reporterEmail: reporterEmail ? reporterEmail.trim() : (req.user?.email || ''),
      reporterPhone: reporterPhone ? reporterPhone.trim() : '',
      status: 'pending'
    });

    await newReport.save();

    res.status(201).json({
      success: true,
      message: 'Báo cáo của bạn đã được gửi thành công! Đội ngũ quản trị viên sẽ tiến hành xác minh và cập nhật vào danh sách cảnh báo.',
      data: newReport
    });
  } catch (error) {
    console.error('Lỗi khi gửi báo cáo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi máy chủ khi gửi báo cáo'
    });
  }
});

/**
 * @route   GET /api/reports
 * @desc    Lấy danh sách các báo cáo lừa đảo (cho Admin quản lý)
 * @access  Private / Admin
 */
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { target: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { reporterName: searchRegex },
        { reporterEmail: searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      Report.find(query)
        .populate('userId', 'name email avatar')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Report.countDocuments(query),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'approved' }),
      Report.countDocuments({ status: 'rejected' })
    ]);

    res.json({
      success: true,
      data: {
        reports,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        stats: {
          totalAll: pendingCount + approvedCount + rejectedCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount
        }
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách báo cáo:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách báo cáo'
    });
  }
});

/**
 * @route   GET /api/reports/:id
 * @desc    Lấy chi tiết một báo cáo
 * @access  Private / Admin
 */
router.get('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'name email avatar')
      .populate('resolvedBy', 'name email')
      .populate('resourceId');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

/**
 * @route   POST /api/reports/:id/approve
 * @desc    Admin duyệt báo cáo và TỰ ĐỘNG THÊM vào Danh sách Không an toàn (Resource)
 * @access  Private / Admin
 */
router.post('/:id/approve', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
    }

    // 1. Kiểm tra xem mục này đã có trong danh sách không an toàn chưa
    let existingResource = await Resource.findOne({
      address: report.target,
      isSafe: false
    });

    let targetResource;
    if (existingResource) {
      // Cập nhật thông tin mô tả nếu có thêm bằng chứng
      existingResource.description = `${existingResource.description}\n[Cập nhật]: ${report.description}`;
      await existingResource.save();
      targetResource = existingResource;
    } else {
      // 2. Tạo bản ghi mới trong Danh sách Không an toàn (Unsafe List)
      const resourceType = report.type === 'Tổ chức giả mạo' ? 'Tổ chức' : report.type;
      targetResource = new Resource({
        isSafe: false,
        type: resourceType || 'Website',
        name: report.title || `Báo cáo: ${report.target}`,
        address: report.target,
        description: report.description
      });
      await targetResource.save();
    }

    // 3. Cập nhật trạng thái của báo cáo
    report.status = 'approved';
    report.adminNote = adminNote || 'Đã xác minh lừa đảo và thêm vào Danh Sách Cảnh Báo Đen';
    report.resolvedAt = new Date();
    report.resolvedBy = req.user.id;
    report.resourceId = targetResource._id;
    await report.save();

    res.json({
      success: true,
      message: 'Đã duyệt báo cáo và thêm vào Danh Sách Không An Toàn thành công!',
      data: {
        report,
        resource: targetResource
      }
    });
  } catch (error) {
    console.error('Lỗi khi duyệt báo cáo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi duyệt báo cáo'
    });
  }
});

/**
 * @route   POST /api/reports/:id/reject
 * @desc    Admin từ chối báo cáo (kèm lý do)
 * @access  Private / Admin
 */
router.post('/:id/reject', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
    }

    report.status = 'rejected';
    report.adminNote = adminNote || 'Báo cáo chưa đủ căn cứ xác minh hoặc thông tin không chính xác.';
    report.resolvedAt = new Date();
    report.resolvedBy = req.user.id;
    await report.save();

    res.json({
      success: true,
      message: 'Đã từ chối báo cáo.',
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi từ chối báo cáo' });
  }
});

/**
 * @route   DELETE /api/reports/:id
 * @desc    Xóa báo cáo
 * @access  Private / Admin
 */
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
    }

    res.json({
      success: true,
      message: 'Đã xóa báo cáo thành công'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa báo cáo' });
  }
});

module.exports = router;
