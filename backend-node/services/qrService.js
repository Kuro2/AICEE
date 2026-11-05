const { Jimp } = require('jimp');
const jsQR = require('jsqr');
const { analyzeUrl } = require('./scanService');

/**
 * Tính toán tỷ lệ diện tích của mã QR so với tổng diện tích ảnh
 * Để xác định ảnh chỉ là 1 mã QR đơn thuần hay là ảnh chụp màn hình (chat/web/tờ rơi)
 */
function calculateQRRatio(location, imageWidth, imageHeight) {
  if (!location) return 0;
  try {
    const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = location;

    // Chiều rộng trung bình của QR
    const topWidth = Math.hypot(topRightCorner.x - topLeftCorner.x, topRightCorner.y - topLeftCorner.y);
    const bottomWidth = Math.hypot(bottomRightCorner.x - bottomLeftCorner.x, bottomRightCorner.y - bottomLeftCorner.y);
    const avgWidth = (topWidth + bottomWidth) / 2;

    // Chiều cao trung bình của QR
    const leftHeight = Math.hypot(bottomLeftCorner.x - topLeftCorner.x, bottomLeftCorner.y - topLeftCorner.y);
    const rightHeight = Math.hypot(bottomRightCorner.x - topRightCorner.x, bottomRightCorner.y - topRightCorner.y);
    const avgHeight = (leftHeight + rightHeight) / 2;

    const qrArea = avgWidth * avgHeight;
    const totalArea = imageWidth * imageHeight;

    return Math.min(1, Math.max(0, qrArea / totalArea));
  } catch (err) {
    return 0;
  }
}

/**
 * Nhận diện và giải mã mã QR từ Buffer hoặc File path (100% thuần JS, không cần C++)
 * @param {Buffer|string} input Buffer ảnh hoặc đường dẫn file ảnh
 * @returns {Promise<{ found: boolean, data?: string, ratio?: number, isStandalone?: boolean, details?: object }>}
 */
async function decodeQRFromImage(input) {
  try {
    const img = await Jimp.read(input);
    const width = img.bitmap.width;
    const height = img.bitmap.height;

    // Chuẩn bị dữ liệu RGBA cho jsQR
    let data = new Uint8ClampedArray(img.bitmap.data);

    // Quét lần 1: Nguyên bản (hỗ trợ cả QR sáng và tối)
    let code = jsQR(data, width, height, {
      inversionAttempts: 'attemptBoth'
    });

    // Quét lần 2: Nếu chưa tìm thấy và ảnh quá lớn (> 1600px), thử thu nhỏ để giảm nhiễu hạt
    if (!code && (width > 1600 || height > 1600)) {
      const scaledImg = img.clone().scaleToFit({ w: 1200, h: 1200 });
      const scaledData = new Uint8ClampedArray(scaledImg.bitmap.data);
      code = jsQR(scaledData, scaledImg.bitmap.width, scaledImg.bitmap.height, {
        inversionAttempts: 'attemptBoth'
      });
    }

    // Quét lần 3: Tăng độ tương phản (contrast) nếu ảnh chụp camera bị mờ hoặc chói
    if (!code) {
      const contrastImg = img.clone().greyscale().contrast(0.3);
      const contrastData = new Uint8ClampedArray(contrastImg.bitmap.data);
      code = jsQR(contrastData, contrastImg.bitmap.width, contrastImg.bitmap.height, {
        inversionAttempts: 'attemptBoth'
      });
    }

    if (!code || !code.data) {
      return { found: false };
    }

    const ratio = calculateQRRatio(code.location, width, height);
    // Nếu QR chiếm >= 28% diện tích toàn ảnh, coi là mã QR đơn thuần
    const isStandalone = ratio >= 0.28;

    return {
      found: true,
      data: code.data.trim(),
      ratio: Number(ratio.toFixed(3)),
      isStandalone,
      imageDimensions: { width, height }
    };
  } catch (error) {
    console.warn('Lỗi khi quét QR cục bộ:', error.message);
    return { found: false, error: error.message };
  }
}

/**
 * Phân tích sơ bộ nội dung giải mã từ mã QR
 * @param {string} payload Chuỗi trích xuất được từ QR
 */
function analyzeQRPayload(payload) {
  if (!payload) {
    return { type: 'unknown', status: 'warning', summary: 'Không có dữ liệu', details: [] };
  }

  const trimmed = payload.trim();
  const lower = trimmed.toLowerCase();

  // 1. Nhận diện URL / Website
  const isUrl = /^https?:\/\//i.test(trimmed) || /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(trimmed);
  if (isUrl) {
    const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const urlAnalysis = analyzeUrl(fullUrl);
    
    return {
      type: 'url',
      url: fullUrl,
      status: urlAnalysis.status,
      score: urlAnalysis.score,
      summary: urlAnalysis.status === 'danger'
        ? `Phát hiện URL nguy hiểm có dấu hiệu lừa đảo: ${fullUrl}`
        : urlAnalysis.status === 'warning'
        ? `URL cần cảnh giác: ${fullUrl}`
        : `URL có vẻ hợp lệ: ${fullUrl}`,
      issues: urlAnalysis.issues,
      recommendations: [
        'Không nhập mật khẩu ngân hàng, mã OTP trên các trang web lạ',
        'Kiểm tra kỹ tên miền chính xác trước khi đăng nhập',
        urlAnalysis.status === 'danger' ? 'Tuyệt đối KHÔNG truy cập vào liên kết này' : null
      ].filter(Boolean)
    };
  }

  // 2. Nhận diện VietQR / Mã chuyển khoản ngân hàng (chuẩn EMVCo bắt đầu bằng 000201)
  if (trimmed.startsWith('000201')) {
    return {
      type: 'vietqr',
      status: 'warning',
      summary: 'Phát hiện mã thanh toán / chuyển tiền VietQR ngân hàng',
      issues: ['Mã thanh toán ngân hàng tự động điền số tiền và tài khoản nhận'],
      recommendations: [
        'Xác minh chính xác người nhận trước khi bấm chuyển khoản trên ứng dụng ngân hàng',
        'Không quét mã chuyển tiền để nhận thưởng, quà tặng hay đặt cọc việc làm'
      ]
    };
  }

  // 3. Nhận diện WiFi, Số điện thoại, Thông tin văn bản
  if (lower.startsWith('wifi:')) {
    return {
      type: 'wifi',
      status: 'safe',
      summary: 'Mã QR cấu hình kết nối mạng WiFi',
      issues: [],
      recommendations: ['Chỉ kết nối với các mạng WiFi từ người quen hoặc cơ quan tin cậy']
    };
  }

  if (lower.startsWith('tel:') || /^(\+84|0)\d{9,10}$/.test(trimmed)) {
    return {
      type: 'phone',
      status: 'warning',
      summary: `Mã QR chứa số điện thoại: ${trimmed}`,
      issues: ['Số điện thoại cần được xác minh'],
      recommendations: ['Không gọi lại nếu có yêu cầu chuyển tiền hoặc đe dọa']
    };
  }

  // 4. Văn bản thông thường
  return {
    type: 'text',
    status: 'info',
    summary: 'Mã QR chứa nội dung văn bản',
    text: trimmed,
    issues: [],
    recommendations: ['Kiểm tra nội dung để đảm bảo không bị dẫn dụ vào bẫy lừa đảo']
  };
}

module.exports = {
  decodeQRFromImage,
  analyzeQRPayload,
  calculateQRRatio
};

