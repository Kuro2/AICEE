const express = require('express');
const router = express.Router();
const { analyzeUrl, analyzeEmail, analyzePhone, formatScanResponse } = require('../services/scanService');
const { sendToGemini } = require('../services/aiService');
const { optionalAuth } = require('../middleware/auth');
const { checkScanLimit } = require('../middleware/subscription');
const Resource = require('../models/Resource');
const Report = require('../models/Report');

/**
 * Tra cứu trong cơ sở dữ liệu (Resource & Report)
 */
async function checkDatabaseTarget(target, type) {
  if (!target) return null;
  try {
    const escaped = target.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const resource = await Resource.findOne({
      $or: [{ address: regex }, { address: target }]
    });
    if (resource) {
      return {
        found: true,
        isNewData: false,
        inResource: true,
        isSafe: resource.isSafe,
        resource,
        type,
        target
      };
    }

    const report = await Report.findOne({
      $or: [{ target: regex }, { target }]
    }).sort({ createdAt: -1 });
    if (report) {
      return {
        found: true,
        isNewData: false,
        inReport: true,
        reportStatus: report.status,
        type,
        target
      };
    }

    return {
      found: false,
      isNewData: true,
      type,
      target
    };
  } catch (e) {
    return null;
  }
}

/**
 * @route   POST /api/scan/url
 * @desc    Kiểm tra độ an toàn của URL
 * @access  Public
 */
router.post('/url', optionalAuth, checkScanLimit, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp URL cần kiểm tra'
      });
    }

    const dbCheck = await checkDatabaseTarget(url, 'Website');

    // Phân tích heuristic
    const scanResult = analyzeUrl(url);

    if (dbCheck) {
      if (dbCheck.inResource) {
        if (!dbCheck.isSafe) {
          scanResult.status = 'danger';
          scanResult.score = 0;
          scanResult.issues.unshift(`[Cơ sở dữ liệu AICEE]: Website này ĐÃ CÓ trong Danh sách Đen (Blacklist). Lý do: ${dbCheck.resource.description || 'Lừa đảo'}`);
        } else {
          scanResult.status = 'safe';
          scanResult.score = 100;
          scanResult.issues.unshift(`[Cơ sở dữ liệu AICEE]: Website này thuộc Danh sách An toàn đã xác minh.`);
        }
      } else if (dbCheck.inReport) {
        scanResult.issues.unshift(`[Cơ sở dữ liệu AICEE]: Đang có báo cáo chờ Quản trị viên duyệt (Trạng thái: ${dbCheck.reportStatus}).`);
      } else if (dbCheck.isNewData) {
        scanResult.issues.push(`[Dữ liệu mới]: Website này chưa có trong cơ sở dữ liệu AICEE.`);
      }
    }

    const formatted = formatScanResponse('url', scanResult);

    // Tạo text phản hồi chi tiết
    let responseText = `[KIỂM TRA URL] ${url}\n\n`;
    responseText += `${formatted.text}`;

    if (scanResult.details.hostname) {
      responseText += `Thông tin kỹ thuật:\n`;
      responseText += `- Domain: ${scanResult.details.hostname}\n`;
      responseText += `- Giao thức: ${scanResult.details.isHttps ? 'HTTPS (Mã hóa an toàn)' : 'HTTP (Không mã hóa)'}\n`;
      responseText += `- Điểm an toàn: ${scanResult.score}/100\n`;
    }

    res.json({
      success: true,
      data: {
        url,
        status: scanResult.status,
        score: scanResult.score,
        message: responseText,
        issues: scanResult.issues,
        details: scanResult.details,
        recommendations: formatted.recommendations,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('URL scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra URL'
    });
  }
});

/**
 * @route   POST /api/scan/email
 * @desc    Phân tích email lừa đảo
 * @access  Public
 */
router.post('/email', optionalAuth, checkScanLimit, async (req, res) => {
  try {
    const { email, subject, body } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email cần kiểm tra'
      });
    }

    const dbCheck = await checkDatabaseTarget(email, 'Email');
    const scanResult = analyzeEmail(email, subject || '', body || '');

    if (dbCheck) {
      if (dbCheck.inResource) {
        if (!dbCheck.isSafe) {
          scanResult.status = 'danger';
          scanResult.score = 0;
          scanResult.issues.unshift(`[Cơ sở dữ liệu AICEE]: Email này ĐÃ CÓ trong Danh sách Đen (Blacklist).`);
        } else {
          scanResult.status = 'safe';
          scanResult.score = 100;
          scanResult.issues.unshift(`[Cơ sở dữ liệu AICEE]: Email này thuộc Danh sách An toàn đã xác minh.`);
        }
      } else if (dbCheck.inReport) {
        scanResult.issues.unshift(`[Cơ sở dữ liệu AICEE]: Đang có báo cáo chờ Quản trị viên duyệt (Trạng thái: ${dbCheck.reportStatus}).`);
      } else if (dbCheck.isNewData) {
        scanResult.issues.push(`[Dữ liệu mới]: Email này chưa có trong cơ sở dữ liệu AICEE.`);
      }
    }

    const formatted = formatScanResponse('email', scanResult);

    let responseText = `[PHÂN TÍCH EMAIL] ${email}\n\n`;
    responseText += formatted.text;

    res.json({
      success: true,
      data: {
        email,
        status: scanResult.status,
        score: scanResult.score,
        message: responseText,
        issues: scanResult.issues,
        details: scanResult.details,
        recommendations: formatted.recommendations,
        newDataCheck: dbCheck?.isNewData ? { isNewData: true, target: email, type: 'Email', suggestRequest: true } : null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Email scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi phân tích email'
    });
  }
});

/**
 * @route   POST /api/scan/phone
 * @desc    Xác minh số điện thoại
 * @access  Public
 */
router.post('/phone', optionalAuth, checkScanLimit, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp số điện thoại cần kiểm tra'
      });
    }

    const dbCheck = await checkDatabaseTarget(phone, 'SĐT');
    const scanResult = analyzePhone(phone);

    if (dbCheck) {
      if (dbCheck.inResource) {
        if (!dbCheck.isSafe) {
          scanResult.status = 'danger';
          scanResult.score = 0;
          scanResult.issues.unshift(`[Cơ sở dữ liệu AICEE]: Số điện thoại này ĐÃ CÓ trong Danh sách Đen (Blacklist).`);
        } else {
          scanResult.status = 'safe';
          scanResult.score = 100;
          scanResult.issues.unshift(`[Cơ sở dữ liệu AICEE]: Số điện thoại này thuộc Danh sách An toàn đã xác minh.`);
        }
      } else if (dbCheck.inReport) {
        scanResult.issues.unshift(`[Cơ sở dữ liệu AICEE]: Đang có báo cáo chờ Quản trị viên duyệt (Trạng thái: ${dbCheck.reportStatus}).`);
      } else if (dbCheck.isNewData) {
        scanResult.issues.push(`[Dữ liệu mới]: Số điện thoại này chưa có trong cơ sở dữ liệu AICEE.`);
      }
    }

    const formatted = formatScanResponse('phone', scanResult);

    let responseText = `[XÁC MINH SỐ ĐIỆN THOẠI] ${phone}\n\n`;
    responseText += formatted.text;

    res.json({
      success: true,
      data: {
        phone,
        status: scanResult.status,
        score: scanResult.score,
        message: responseText,
        issues: scanResult.issues,
        details: scanResult.details,
        recommendations: formatted.recommendations,
        newDataCheck: dbCheck?.isNewData ? { isNewData: true, target: phone, type: 'SĐT', suggestRequest: true } : null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Phone scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác minh số điện thoại'
    });
  }
});

/**
 * @route   POST /api/scan/quick
 * @desc    Quét nhanh - tự động nhận diện loại input (URL/email/phone)
 * @access  Public
 */
router.post('/quick', optionalAuth, checkScanLimit, async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp nội dung cần kiểm tra'
      });
    }

    const trimmed = input.trim();

    // Tự động nhận diện loại
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^(\+84|0)[0-9]{8,10}$/;

    let scanResult, type;

    if (urlRegex.test(trimmed)) {
      type = 'url';
      scanResult = analyzeUrl(trimmed);
    } else if (emailRegex.test(trimmed)) {
      type = 'email';
      scanResult = analyzeEmail(trimmed);
    } else if (phoneRegex.test(trimmed.replace(/[\s\-]/g, ''))) {
      type = 'phone';
      scanResult = analyzePhone(trimmed);
    } else {
      // Dùng AI để phân tích text chung
      const aiResponse = await sendToGemini(trimmed);
      return res.json({
        success: true,
        data: {
          input: trimmed,
          type: 'general',
          status: aiResponse.status || 'info',
          message: aiResponse.text,
          recommendations: aiResponse.recommendations || [],
          timestamp: new Date().toISOString()
        }
      });
    }

    let targetType = type === 'url' ? 'Website' : type === 'email' ? 'Email' : 'SĐT';
    const dbCheck = await checkDatabaseTarget(trimmed, targetType);

    if (dbCheck) {
      if (dbCheck.inResource) {
        if (!dbCheck.isSafe) {
          scanResult.status = 'danger';
          scanResult.score = 0;
          scanResult.issues.unshift(`[Cơ sở dữ liệu AICEE]: ${targetType} này ĐÃ CÓ trong Danh sách Đen (Blacklist).`);
        } else {
          scanResult.status = 'safe';
          scanResult.score = 100;
          scanResult.issues.unshift(`[Cơ sở dữ liệu AICEE]: ${targetType} này thuộc Danh sách An toàn đã xác minh.`);
        }
      } else if (dbCheck.inReport) {
        scanResult.issues.unshift(`[Cơ sở dữ liệu AICEE]: Đang có báo cáo chờ Quản trị viên duyệt (Trạng thái: ${dbCheck.reportStatus}).`);
      } else if (dbCheck.isNewData) {
        scanResult.issues.push(`[Dữ liệu mới]: ${targetType} này chưa có trong cơ sở dữ liệu AICEE.`);
      }
    }

    const formatted = formatScanResponse(type, scanResult);

    res.json({
      success: true,
      data: {
        input: trimmed,
        type,
        status: scanResult.status,
        score: scanResult.score,
        message: formatted.text,
        issues: scanResult.issues,
        recommendations: formatted.recommendations,
        newDataCheck: dbCheck?.isNewData ? { isNewData: true, target: trimmed, type: targetType, suggestRequest: true } : null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Quick scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi quét nhanh'
    });
  }
});

module.exports = router;
