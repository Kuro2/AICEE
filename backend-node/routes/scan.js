const express = require('express');
const router = express.Router();
const { analyzeUrl, analyzeEmail, analyzePhone, formatScanResponse } = require('../services/scanService');
const { sendToGemini } = require('../services/aiService');

/**
 * @route   POST /api/scan/url
 * @desc    Kiểm tra độ an toàn của URL
 * @access  Public
 */
router.post('/url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp URL cần kiểm tra'
      });
    }

    // Phân tích heuristic
    const scanResult = analyzeUrl(url);
    const formatted = formatScanResponse('url', scanResult);

    // Tạo text phản hồi chi tiết
    let responseText = `🔍 **Kiểm tra URL: ${url}**\n\n`;
    responseText += `${formatted.text}`;

    if (scanResult.details.hostname) {
      responseText += `\n📊 **Thông tin kỹ thuật:**\n`;
      responseText += `• Domain: ${scanResult.details.hostname}\n`;
      responseText += `• Giao thức: ${scanResult.details.isHttps ? '🔒 HTTPS (An toàn)' : '⚠️ HTTP (Không mã hóa)'}\n`;
      responseText += `• Điểm an toàn: ${scanResult.score}/100\n`;
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
router.post('/email', async (req, res) => {
  try {
    const { email, subject, body } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email cần kiểm tra'
      });
    }

    const scanResult = analyzeEmail(email, subject || '', body || '');
    const formatted = formatScanResponse('email', scanResult);

    let responseText = `📧 **Phân tích Email: ${email}**\n\n`;
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
router.post('/phone', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp số điện thoại cần kiểm tra'
      });
    }

    const scanResult = analyzePhone(phone);
    const formatted = formatScanResponse('phone', scanResult);

    let responseText = `📱 **Xác minh Số Điện Thoại: ${phone}**\n\n`;
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
router.post('/quick', async (req, res) => {
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
