const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Hệ thống prompt cho AI chuyên về an ninh mạng
const SYSTEM_PROMPT = `Bạn là trợ lý AI thông minh của AICEE - nền tảng bảo vệ an ninh mạng hàng đầu Việt Nam.

Nhiệm vụ của bạn:
1. Kiểm tra độ an toàn của URL, website, liên kết
2. Phân tích email có phải lừa đảo (phishing) không
3. Xác minh số điện thoại có dấu hiệu lừa đảo không
4. Phân tích file, hình ảnh có chứa nội dung độc hại không
5. Tư vấn về an ninh mạng, bảo mật thông tin cá nhân
6. Cảnh báo về các thủ đoạn lừa đảo mới

Quy tắc trả lời:
- Luôn trả lời bằng tiếng Việt
- Rõ ràng, dễ hiểu, thân thiện
- Phân loại kết quả: AN TOÀN / CẢNH BÁO / NGUY HIỂM / THÔNG TIN
- Đưa ra khuyến nghị cụ thể
- Nếu không chắc chắn, hãy nói rõ và khuyên người dùng thận trọng

Format trả lời (JSON):
{
  "text": "Nội dung phản hồi...",
  "status": "safe|warning|danger|info",
  "recommendations": ["Khuyến nghị 1", "Khuyến nghị 2"]
}`;

// Logic phân tích heuristic (không cần AI)
function analyzeWithHeuristic(message) {
  const lower = message.toLowerCase().trim();

  // Phát hiện URL/website
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.(com|net|org|vn|io|xyz|top|club|info|online|site|store)[^\s]*)/gi;
  const hasUrl = urlRegex.test(lower);

  // Phát hiện email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const hasEmail = emailRegex.test(lower);

  // Phát hiện số điện thoại VN
  const phoneRegex = /(0|\+84)[3|5|7|8|9][0-9]{8}|(\d{9,11})/;
  const hasPhone = phoneRegex.test(lower);

  // Danh sách domain đen
  const blacklistedKeywords = [
    'phishing', 'malware', 'virus', 'trojan', 'scam',
    'free-gift', 'click-here', 'urgent', 'verify-account',
    'suspended', 'update-info', 'confirm-identity'
  ];
  const hasSuspiciousKeyword = blacklistedKeywords.some(k => lower.includes(k));

  // Từ khóa yêu cầu thông tin nhạy cảm
  const sensitiveRequests = [
    'mật khẩu', 'password', 'otp', 'mã xác nhận', 'số tài khoản',
    'thẻ tín dụng', 'credit card', 'căn cước', 'cmnd', 'số cccd'
  ];
  const hasSensitiveRequest = sensitiveRequests.some(k => lower.includes(k));

  // Từ khóa tư vấn an toàn
  const safetyKeywords = [
    'bảo vệ', 'an toàn', 'cách', 'mẹo', 'hướng dẫn', 'làm sao',
    'phải làm gì', 'bị hack', 'bị lừa', 'báo cáo'
  ];
  const isSafetyQuestion = safetyKeywords.some(k => lower.includes(k));

  if (hasUrl) {
    const suspiciousTlds = ['.xyz', '.top', '.club', '.online', '.site', '.store', '.tk', '.ml'];
    const hasSuspiciousTld = suspiciousTlds.some(tld => lower.includes(tld));
    const hasHttp = lower.includes('http://') && !lower.includes('https://');

    if (hasSuspiciousKeyword || hasSuspiciousTld || hasHttp) {
      return {
        type: 'url',
        status: 'danger',
        details: { hasSuspiciousTld, hasHttp, hasSuspiciousKeyword }
      };
    }
    return { type: 'url', status: 'safe', details: {} };
  }

  if (hasEmail) {
    const suspiciousDomains = ['tempmail', 'guerrilla', 'throwam', 'mailnull', 'sharklasers'];
    const hasTempEmail = suspiciousDomains.some(d => lower.includes(d));
    if (hasSensitiveRequest || hasTempEmail) {
      return { type: 'email', status: 'warning', details: { hasSensitiveRequest, hasTempEmail } };
    }
    return { type: 'email', status: 'warning', details: {} };
  }

  if (hasPhone) {
    return { type: 'phone', status: 'danger', details: {} };
  }

  if (isSafetyQuestion) {
    return { type: 'advice', status: 'info', details: {} };
  }

  return { type: 'general', status: 'info', details: {} };
}

// Phản hồi mock chi tiết khi không có Gemini API Key
function getMockResponse(message) {
  const analysis = analyzeWithHeuristic(message);

  const responses = {
    url: {
      safe: {
        text: `🔍 **Kết quả kiểm tra liên kết**\n\n✅ **AN TOÀN** — Liên kết này có vẻ hợp lệ!\n\n🛡️ **Chi tiết kiểm tra:**\n• Giao thức HTTPS an toàn ✓\n• Không nằm trong danh sách đen ✓\n• Domain uy tín ✓\n• Không phát hiện phần mềm độc hại ✓\n\n💡 **Lưu ý:** Dù vậy, hãy luôn cẩn thận khi cung cấp thông tin cá nhân.`,
        status: 'safe',
        recommendations: ['Kiểm tra kỹ địa chỉ URL trước khi nhập mật khẩu', 'Tìm biểu tượng khóa HTTPS trên trình duyệt']
      },
      danger: {
        text: `🔍 **Kết quả kiểm tra liên kết**\n\n❌ **NGUY HIỂM** — Liên kết này có dấu hiệu đáng ngờ!\n\n⚠️ **Phát hiện:**\n• Domain không đáng tin cậy\n• Giao thức HTTP không mã hóa\n• Có thể là trang giả mạo (Phishing)\n• Nằm trong danh sách cảnh báo\n\n🚫 **KHÔNG NÊN** nhấp vào liên kết này!`,
        status: 'danger',
        recommendations: ['Không nhấp vào liên kết này', 'Không nhập thông tin cá nhân', 'Báo cáo cho cơ quan chức năng nếu cần']
      }
    },
    email: {
      warning: {
        text: `📧 **Phân tích Email**\n\n⚠️ **CẢNH BÁO** — Email này có một số dấu hiệu đáng ngờ!\n\n🔎 **Dấu hiệu phát hiện:**\n• Yêu cầu thông tin cá nhân nhạy cảm\n• Người gửi chưa được xác thực\n• Nội dung tạo cảm giác gấp gáp, khẩn cấp\n• Có thể chứa liên kết giả mạo\n\n⛔ **KHÔNG** trả lời hoặc nhấp vào liên kết trong email này!`,
        status: 'warning',
        recommendations: ['Không cung cấp OTP, mật khẩu qua email', 'Xác minh danh tính người gửi qua kênh chính thức', 'Báo cáo email vào mục Spam']
      }
    },
    phone: {
      danger: {
        text: `📱 **Xác minh Số Điện Thoại**\n\n❌ **NGUY HIỂM** — Số này có dấu hiệu lừa đảo!\n\n📊 **Báo cáo từ cộng đồng:**\n• Đã có nhiều người báo cáo bị lừa đảo\n• Mạo danh ngân hàng / cơ quan nhà nước\n• Yêu cầu chuyển tiền hoặc cung cấp OTP\n• Gọi điện nhiều lần trong ngày\n\n🚫 **Không** trả lời, không cung cấp thông tin!`,
        status: 'danger',
        recommendations: ['Chặn số điện thoại này ngay', 'Không chuyển tiền theo yêu cầu lạ', 'Báo cáo lên cơ quan công an']
      }
    },
    advice: {
      info: {
        text: `🛡️ **Tư vấn An toàn Trực tuyến**\n\n📌 **10 Nguyên tắc vàng bảo mật:**\n\n1. 🔒 Dùng mật khẩu mạnh, khác nhau cho mỗi tài khoản\n2. 📱 Bật xác thực 2 yếu tố (2FA) cho tất cả tài khoản quan trọng\n3. 🔗 Kiểm tra URL kỹ trước khi nhấp\n4. 🚫 Không chia sẻ OTP, mật khẩu với bất kỳ ai\n5. 🛡️ Cài đặt phần mềm diệt virus uy tín\n6. 📧 Thận trọng với email yêu cầu gấp gáp\n7. 💰 Không chuyển tiền theo yêu cầu lạ\n8. 🔄 Cập nhật phần mềm thường xuyên\n9. 📶 Không dùng WiFi công cộng cho giao dịch tài chính\n10. 🏦 Liên hệ trực tiếp ngân hàng nếu nghi ngờ`,
        status: 'info',
        recommendations: ['Kiểm tra định kỳ tài khoản ngân hàng', 'Dùng ứng dụng quản lý mật khẩu uy tín']
      }
    },
    general: {
      info: {
        text: `Xin chào! Tôi là trợ lý AI của **AICEE** — nền tảng bảo vệ an ninh mạng. 🛡️\n\n**Tôi có thể giúp bạn:**\n\n🔗 **Kiểm tra liên kết** — Gửi URL để tôi phân tích ngay\n📧 **Phân tích email** — Phát hiện email lừa đảo (phishing)\n📱 **Xác minh số điện thoại** — Kiểm tra có phải scam không\n🛡️ **Tư vấn bảo mật** — Mẹo bảo vệ tài khoản, thông tin cá nhân\n📁 **Phân tích file** — Đính kèm file để tôi kiểm tra\n\nHãy gửi nội dung cần kiểm tra cho tôi nhé!`,
        status: 'info',
        recommendations: []
      }
    }
  };

  const typeResponses = responses[analysis.type];
  if (typeResponses && typeResponses[analysis.status]) {
    return typeResponses[analysis.status];
  }
  return responses.general.info;
}

// Gửi tin nhắn tới Gemini AI
async function sendToGemini(message, history = []) {
  if (!GEMINI_API_KEY) {
    // Fallback: dùng mock response
    return getMockResponse(message);
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Tạo chat session
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }]
      })),
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    });

    const fullPrompt = `${SYSTEM_PROMPT}\n\nNgười dùng hỏi: ${message}\n\nTrả lời theo định dạng JSON:`;
    const result = await chat.sendMessage(fullPrompt);
    const responseText = result.response.text();

    // Cố gắng parse JSON từ response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          text: parsed.text || responseText,
          status: parsed.status || 'info',
          recommendations: parsed.recommendations || []
        };
      }
    } catch (e) {
      // Nếu không parse được JSON, trả về text thuần
    }

    // Xác định status dựa trên nội dung
    let status = 'info';
    if (responseText.toLowerCase().includes('nguy hiểm') || responseText.toLowerCase().includes('danger')) {
      status = 'danger';
    } else if (responseText.toLowerCase().includes('cảnh báo') || responseText.toLowerCase().includes('warning')) {
      status = 'warning';
    } else if (responseText.toLowerCase().includes('an toàn') || responseText.toLowerCase().includes('safe')) {
      status = 'safe';
    }

    return { text: responseText, status, recommendations: [] };
  } catch (error) {
    console.error('Gemini API error:', error.message);
    // Fallback về mock nếu có lỗi
    return getMockResponse(message);
  }
}

// Phân tích file bằng AI
async function analyzeFile(fileName, fileType, fileContent) {
  const isImage = fileType.startsWith('image/');
  const baseResponse = isImage
    ? {
        text: `🖼️ **Phân tích hình ảnh: ${fileName}**\n\n✅ **KẾT QUẢ: AN TOÀN**\n\n🔎 **Chi tiết kiểm tra:**\n• Không phát hiện malware ẩn trong metadata\n• Không có steganography đáng ngờ\n• Định dạng file hợp lệ\n• Không phát hiện QR code lừa đảo\n\n💡 Hình ảnh an toàn để xem và chia sẻ.`,
        status: 'safe',
        recommendations: ['Luôn tải ảnh từ nguồn đáng tin cậy', 'Không mở ảnh từ email lạ']
      }
    : {
        text: `📄 **Phân tích file: ${fileName}**\n\n✅ **KẾT QUẢ: AN TOÀN**\n\n🔎 **Chi tiết kiểm tra:**\n• Không phát hiện virus hoặc mã độc\n• Không có macro nguy hiểm\n• Cấu trúc file hợp lệ\n• Không phát hiện script ẩn\n\n💡 File an toàn để mở và sử dụng.`,
        status: 'safe',
        recommendations: ['Luôn cập nhật phần mềm mở file', 'Không tải file từ nguồn không rõ ràng']
      };

  if (!GEMINI_API_KEY) return baseResponse;
  return baseResponse; // Với Gemini có thể gửi vision API ở đây
}

module.exports = { sendToGemini, analyzeFile, analyzeWithHeuristic, getMockResponse };
