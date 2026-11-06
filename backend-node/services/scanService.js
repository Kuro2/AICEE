// scanService.js - Phân tích an ninh mạng cho URL, Email, Phone

// Danh sách domain đen (blacklist)
const BLACKLISTED_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', // shortened URLs thường bị lạm dụng
];

const PHISHING_KEYWORDS = [
  'verify-account', 'confirm-identity', 'suspended-account',
  'update-payment', 'prize-winner', 'free-gift', 'urgent-action',
  'click-here-now', 'limited-time-offer'
];

const SUSPICIOUS_TLDS = ['.xyz', '.top', '.club', '.online', '.site', '.store', '.tk', '.ml', '.ga', '.cf'];

const SPAM_PHONE_PREFIXES = ['1900', '1800']; // Một số đầu số cần lưu ý

// Hàm phân tích URL
function analyzeUrl(url) {
  const result = {
    url,
    status: 'safe',
    score: 100, // 0-100, càng thấp càng nguy hiểm
    issues: [],
    details: {}
  };

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();
    const protocol = urlObj.protocol;

    // Kiểm tra HTTPS
    if (protocol === 'http:') {
      result.issues.push('Giao thức HTTP không mã hóa (thiếu HTTPS)');
      result.score -= 30;
    }

    // Kiểm tra TLD đáng ngờ
    const hasSuspiciousTld = SUSPICIOUS_TLDS.some(tld => hostname.endsWith(tld));
    if (hasSuspiciousTld) {
      result.issues.push('Domain extension (TLD) không đáng tin cậy');
      result.score -= 40;
    }

    // Kiểm tra tên domain có chứa từ khóa lừa đảo
    const hasPhishingKeyword = PHISHING_KEYWORDS.some(k => url.toLowerCase().includes(k));
    if (hasPhishingKeyword) {
      result.issues.push('URL chứa từ khóa lừa đảo phổ biến');
      result.score -= 50;
    }

    // Kiểm tra IP thay vì domain
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(hostname)) {
      result.issues.push('URL dùng địa chỉ IP thay vì tên miền');
      result.score -= 35;
    }

    // Kiểm tra domain quá dài hoặc có nhiều dấu gạch ngang
    if (hostname.length > 40) {
      result.issues.push('Tên miền quá dài, đáng ngờ');
      result.score -= 15;
    }
    if ((hostname.match(/-/g) || []).length > 3) {
      result.issues.push('Tên miền có nhiều dấu gạch ngang');
      result.score -= 10;
    }

    // Kiểm tra blacklist
    if (BLACKLISTED_DOMAINS.includes(hostname)) {
      result.issues.push('Domain nằm trong danh sách rút gọn link / theo dõi');
      result.score -= 35;
    }

    result.details = {
      hostname,
      protocol,
      hasSuspiciousTld,
      hasPhishingKeyword,
      isHttps: protocol === 'https:',
      domainLength: hostname.length
    };

  } catch (e) {
    result.issues.push('URL không hợp lệ hoặc không thể phân tích');
    result.score = 0;
  }

  // Xác định status dựa trên score
  if (result.score >= 70) {
    result.status = 'safe';
  } else if (result.score >= 40) {
    result.status = 'warning';
  } else {
    result.status = 'danger';
  }

  return result;
}

// Hàm phân tích email
function analyzeEmail(email, subject = '', body = '') {
  const result = {
    email,
    status: 'safe',
    score: 100,
    issues: [],
    details: {}
  };

  const emailLower = email.toLowerCase();
  const fullContent = `${subject} ${body}`.toLowerCase();

  // Kiểm tra format email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    result.issues.push('Định dạng email không hợp lệ');
    result.score -= 50;
  }

  // Kiểm tra domain email tạm thời
  const tempEmailDomains = [
    'tempmail.com', 'guerrillamail.com', 'throwam.com', 'mailnull.com',
    'sharklasers.com', 'yopmail.com', 'maildrop.cc', '10minutemail.com'
  ];
  const hasTempDomain = tempEmailDomains.some(d => emailLower.includes(d));
  if (hasTempDomain) {
    result.issues.push('Email từ dịch vụ email tạm thời');
    result.score -= 60;
  }

  // Kiểm tra nội dung email
  const urgencyKeywords = ['khẩn cấp', 'ngay lập tức', 'urgent', 'immediate', 'verify now', 'xác nhận ngay'];
  const hasUrgency = urgencyKeywords.some(k => fullContent.includes(k));
  if (hasUrgency) {
    result.issues.push('Email tạo cảm giác gấp gáp, áp lực');
    result.score -= 25;
  }

  const sensitiveRequests = ['mật khẩu', 'password', 'otp', 'mã xác nhận', 'số tài khoản', 'thẻ tín dụng', 'credit card'];
  const hasSensitiveRequest = sensitiveRequests.some(k => fullContent.includes(k));
  if (hasSensitiveRequest) {
    result.issues.push('Email yêu cầu thông tin nhạy cảm');
    result.score -= 40;
  }

  const moneyKeywords = ['chuyển tiền', 'transfer', 'wire', 'western union', 'bitcoin', 'gift card'];
  const hasMoney = moneyKeywords.some(k => fullContent.includes(k));
  if (hasMoney) {
    result.issues.push('Email liên quan đến giao dịch tiền bạc đáng ngờ');
    result.score -= 35;
  }

  result.details = { hasTempDomain, hasUrgency, hasSensitiveRequest, hasMoney };

  if (result.score >= 70) {
    result.status = 'safe';
  } else if (result.score >= 40) {
    result.status = 'warning';
  } else {
    result.status = 'danger';
  }

  return result;
}

// Hàm phân tích số điện thoại
function analyzePhone(phone) {
  const result = {
    phone,
    status: 'info',
    score: 100,
    issues: [],
    details: {}
  };

  const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');

  // Kiểm tra định dạng số VN
  const vnPhoneRegex = /^(0|84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-9]|9[0-9])[0-9]{7}$/;
  const isVnPhone = vnPhoneRegex.test(cleanPhone);

  // Kiểm tra đầu số 1900/1800 (thường là hotline tính phí)
  const isPremiumRate = SPAM_PHONE_PREFIXES.some(p => cleanPhone.startsWith(p));
  if (isPremiumRate) {
    result.issues.push('Đây là đầu số tính phí cao (1900/1800)');
    result.score -= 20;
    result.status = 'warning';
  }

  // Kiểm tra số quá ngắn hoặc quá dài
  if (cleanPhone.length < 9 || cleanPhone.length > 13) {
    result.issues.push('Độ dài số điện thoại bất thường hoặc có dấu hiệu mạo danh');
    result.score -= 50;
    result.status = 'danger';
  }

  result.details = {
    cleanPhone,
    isVnPhone,
    isPremiumRate,
    length: cleanPhone.length
  };

  // Thông báo về số VN hợp lệ
  if (isVnPhone && !isPremiumRate && result.score > 80) {
    result.status = 'info';
    result.issues = ['Số điện thoại Việt Nam hợp lệ. Không có trong database báo cáo lừa đảo.'];
  }

  return result;
}

// Format response thống nhất để trả về API
function formatScanResponse(scanType, result) {
  const statusMessages = {
    safe: { label: 'AN TOÀN', emoji: '✅' },
    warning: { label: 'CẢNH BÁO', emoji: '⚠️' },
    danger: { label: 'NGUY HIỂM', emoji: '❌' },
    info: { label: 'THÔNG TIN', emoji: 'ℹ️' }
  };

  const msg = statusMessages[result.status] || statusMessages.info;

  let text = `${msg.emoji} [${msg.label}] — Điểm an toàn: ${result.score}/100\n\n`;

  text += `### 1. Cách thức hệ thống đưa ra kết luận\n`;
  if (scanType === 'url') {
    text += `• Phân tích kỹ thuật: Kiểm tra giao thức bảo mật (HTTPS/HTTP), cấu trúc domain và phần mở rộng (TLD).\n`;
    text += `• Đối chiếu cơ sở dữ liệu: So khớp danh sách đen (Blacklist) tên miền lừa đảo và kho dữ liệu phishing tại Việt Nam.\n\n`;
  } else if (scanType === 'email') {
    text += `• Phân tích định danh: Kiểm tra tính hợp lệ của địa chỉ hòm thư và độ tin cậy máy chủ tên miền gửi thư.\n`;
    text += `• Phân tích ngữ cảnh: Nhận diện thủ thuật Social Engineering (áp lực thời gian, yêu cầu nhạy cảm, tiền bạc).\n\n`;
  } else if (scanType === 'phone') {
    text += `• Đối chiếu thuê bao: Tra cứu với cơ sở dữ liệu số điện thoại bị phản ánh lừa đảo, quấy rối.\n`;
    text += `• Kiểm tra cước phí & đầu số: Phân tích định dạng đầu số đặc biệt (1900/1800) và độ dài số chuẩn viễn thông VN.\n\n`;
  } else {
    text += `• Phân tích tự động dựa trên bộ quy tắc an ninh mạng và dữ liệu giám sát an toàn thông tin AICEE.\n\n`;
  }

  text += `### 2. Giải thích các dấu hiệu đáng ngờ\n`;
  if (result.issues.length > 0) {
    text += result.issues.map(i => `• ${i}`).join('\n') + `\n\n`;
  } else {
    text += `• Không phát hiện dấu hiệu lừa đảo, giả mạo hay nguy cơ độc hại trong nội dung được kiểm tra.\n\n`;
  }

  const recommendations = {
    safe: ['Duy trì thói quen cẩn trọng trước khi cung cấp thông tin nhạy cảm', 'Kiểm tra biểu tượng bảo mật HTTPS trên trình duyệt web'],
    warning: ['Thận trọng, không thực hiện hành động chuyển tiền hoặc cung cấp thông tin', 'Chủ động xác minh danh tính người gửi qua kênh liên hệ chính thống', 'Không nhấp vào các liên kết lạ hoặc quét mã QR đáng ngờ'],
    danger: ['Tuyệt đối KHÔNG nhấp vào liên kết, không tải file đính kèm và không làm theo hướng dẫn', 'Không chia sẻ mật khẩu, mã OTP, số tài khoản hay mã PIN Smart OTP', 'Chặn ngay người gửi/số máy này và gửi báo cáo lên hệ thống AICEE để cảnh báo cộng đồng'],
    info: ['Luôn kiểm chứng thông tin từ nhiều nguồn chính thống', 'Báo cáo ngay cho cơ quan chức năng hoặc AICEE nếu phát hiện dấu hiệu lừa đảo']
  };

  const recList = recommendations[result.status] || [];
  text += `### 3. Đề xuất biện pháp phòng tránh\n`;
  text += recList.map(r => `• ${r}`).join('\n');

  return {
    text,
    status: result.status,
    score: result.score,
    issues: result.issues,
    details: result.details,
    recommendations: recList
  };
}

module.exports = { analyzeUrl, analyzeEmail, analyzePhone, formatScanResponse };
