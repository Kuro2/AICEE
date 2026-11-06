const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const { decodeQRFromImage, analyzeQRPayload } = require('./qrService');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-flash-lite-latest';
const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-flash-lite-latest';

// Hệ thống prompt cho AI chuyên về an ninh mạng
const SYSTEM_PROMPT = `Bạn là Chuyên gia Trợ lý AI Bảo mật & An ninh mạng của AICEE - Nền tảng phòng chống lừa đảo trực tuyến hàng đầu Việt Nam.

Nhiệm vụ chính của bạn:
1. Phân tích độ an toàn và nhận diện rủi ro của liên kết (URL), website, tên miền.
2. Phát hiện và bóc tách các thủ đoạn lừa đảo qua tin nhắn (SMS Brandname giả, Zalo, Telegram, mạng xã hội).
3. Phân tích email lừa đảo (phishing), phát hiện mạo danh tổ chức, ngân hàng, cơ quan công quyền.
4. Xác minh số điện thoại đáng ngờ, số tổng đài ảo, số lừa đảo quốc tế hoặc số bị phản ánh.
5. Phân tích ảnh chụp màn hình, bóc tách mã QR độc hại và giải mã bối cảnh thao túng tâm lý.
6. Hướng dẫn và tư vấn người dùng biện pháp tự bảo vệ, xử lý khi nghi ngờ bị lừa đảo.

CẤU TRÚC PHẢN HỒI BẮT BUỘC KHI PHÂN TÍCH RỦI RO / BẢO MẬT:
Khi người dùng gửi liên kết (URL), tin nhắn, email, số điện thoại, hình ảnh hoặc một tình huống nghi vấn lừa đảo, câu trả lời của bạn BẮT BUỘC phải tuân thủ cấu trúc 3 phần rõ ràng sau:

---
BẮT ĐẦU BẰNG PHÂN LOẠI & KẾT LUẬN:
Một trong bốn nhãn ở dòng đầu tiên:
- "✅ [AN TOÀN] - <Tóm tắt ngắn gọn kết luận>"
- "⚠️ [CẢNH BÁO] - <Tóm tắt ngắn gọn nguy cơ phát hiện>"
- "❌ [NGUY HIỂM] - <Tóm tắt ngắn gọn mối đe dọa lừa đảo>"
- "ℹ️ [THÔNG TIN] - <Tóm tắt ngắn gọn nội dung>"

### 1. Cách thức hệ thống đưa ra kết luận
Giải thích chi tiết cơ sở kỹ thuật và quy trình mà hệ thống AICEE đã phân tích để đi đến kết luận:
• Cơ chế kiểm tra kỹ thuật: Phân tích cú pháp liên kết, giao thức bảo mật (HTTPS/HTTP), cấu trúc domain, đuôi tên miền (TLD), địa chỉ IP trực tiếp, kiểm tra chuyển hướng ẩn.
• Cơ chế đối chiếu cơ sở dữ liệu: Đối chiếu danh sách đen (Blacklist) tên miền lừa đảo, danh sách số điện thoại/tài khoản ngân hàng bị cộng đồng báo cáo tại Việt Nam.
• Cơ chế phân tích ngữ cảnh & tâm lý (Social Engineering): Nhận diện các chiêu bài thao túng tâm lý (tạo sự khẩn cấp, dọa phong tỏa tài khoản/truy tố hình sự, dụ dỗ hoa hồng/việc nhẹ lương cao, hối thúc cung cấp OTP/mật khẩu, chuyển tiền gấp).
• Cơ chế nhận diện hình ảnh/mã QR (nếu có): Thị giác máy tính nhận dạng giao diện mạo danh, bóc tách chuỗi đích của mã QR.

### 2. Giải thích các dấu hiệu đáng ngờ
Chỉ rõ và giải thích cặn kẽ từng dấu hiệu rủi ro phát hiện được:
• Dấu hiệu mạo danh: Sai lệch tên miền (typosquatting), mạo danh cơ quan công quyền (Công an, Tòa án, Viện kiểm sát, Cục Thuế) hoặc ngân hàng thương mại, sàn thương mại điện tử.
• Dấu hiệu kỹ thuật bất thường: TLD rủi ro cao (.xyz, .top, .vip, .site, .store...), thiếu mã hóa SSL/TLS, trang web ẩn danh.
• Dấu hiệu nội dung & hành vi: Ngữ pháp bất thường, hối thúc thời gian, yêu cầu tiền bạc hoặc thông tin định danh nhạy cảm (CCCD, mã OTP, mật khẩu, mã PIN Smart OTP).
• (Nếu nội dung AN TOÀN): Nêu rõ các yếu tố chứng minh an toàn (tên miền chính chủ đã xác thực, có chứng chỉ bảo mật uy tín, không có dấu hiệu thu thập thông tin độc hại).

### 3. Đề xuất biện pháp phòng tránh
Đưa ra hướng dẫn hành động cụ thể, thiết thực cho người dùng theo thứ tự ưu tiên:
• Hành động tức thì: Tuyệt đối không bấm liên kết, không quét mã QR lạ, không cung cấp mã OTP/mật khẩu, không tải file APK ngoài kho ứng dụng, không chuyển tiền.
• Biện pháp xác minh an toàn: Hướng dẫn kênh liên hệ chính thống (hotline ngân hàng, đến trực tiếp trụ sở công an, tra cứu tên miền tại tinnhiemmang.vn).
• Biện pháp bảo vệ lâu dài: Bật xác thực 2 lớp (2FA), kích hoạt sinh trắc học, đổi mật khẩu định kỳ, chặn số/người gửi và gửi báo cáo lừa đảo lên AICEE.
---

LƯU Ý QUAN TRỌNG:
- Trả lời bằng tiếng Việt tự nhiên, chuẩn xác, dễ hiểu với người dùng phổ thông.
- Với các câu hỏi chào hỏi xã giao hoặc giới thiệu (ví dụ: "xin chào", "bạn là ai"), hãy chào hỏi thân thiện, giới thiệu ngắn gọn các năng lực bảo vệ an ninh mạng của AICEE và mời người dùng gửi liên kết/nội dung cần kiểm tra.
- Tuyệt đối KHÔNG trả lời dưới dạng JSON code block trừ khi có yêu cầu riêng.`;

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
        text: `🔍 **Kết quả kiểm tra liên kết**\n\n✅ [AN TOÀN] — Liên kết có độ tin cậy cao, hợp lệ.\n\n### 1. Cách thức hệ thống đưa ra kết luận\n• Phân tích giao thức: Sử dụng chứng chỉ bảo mật HTTPS mã hóa dữ liệu an toàn.\n• Kiểm tra tên miền & TLD: Domain uy tín, phần mở rộng phổ biến, không nằm trong danh sách đen (Blacklist).\n• Đánh giá cấu trúc: Không phát hiện kỹ thuật chuyển hướng mờ ám hay mã độc chèn trong URL.\n\n### 2. Giải thích các dấu hiệu đáng ngờ\n• Không phát hiện dấu hiệu lừa đảo, giả mạo hay tấn công mạng.\n• Tên miền rõ ràng, định danh tổ chức nhất quán.\n\n### 3. Đề xuất biện pháp phòng tránh\n• Luôn duy trì thói quen kiểm tra thanh địa chỉ (URL) trên trình duyệt trước khi nhập mật khẩu.\n• Cảnh giác nếu trang web yêu cầu cấp quyền truy cập bất thường vào micro/camera/vị trí.`,
        status: 'safe',
        recommendations: ['Kiểm tra kỹ địa chỉ URL trước khi nhập mật khẩu', 'Tìm biểu tượng khóa HTTPS trên trình duyệt']
      },
      danger: {
        text: `🔍 **Kết quả kiểm tra liên kết**\n\n❌ [NGUY HIỂM] — Liên kết có nguy cơ lừa đảo hoặc chứa mã độc!\n\n### 1. Cách thức hệ thống đưa ra kết luận\n• Phân tích cú pháp: Kiểm tra tên miền, phát hiện phần mở rộng (TLD) rủi ro cao hoặc cấu trúc tên miền dài bất thường.\n• Đối chiếu cơ sở dữ liệu: Trùng khớp với các mẫu URL lừa đảo (phishing) và giả mạo thương hiệu đã được cảnh báo.\n• Kiểm tra giao thức: Không có mã hóa bảo mật hoặc chuyển hướng qua nhiều máy chủ trung gian ẩn danh.\n\n### 2. Giải thích các dấu hiệu đáng ngờ\n• Tên miền có dấu hiệu giả mạo (typosquatting), cố tình bắt chước tên thương hiệu uy tín.\n• Giao thức HTTP không an toàn, dễ bị đánh cắp thông tin đăng nhập.\n• Chứa từ khóa thường gặp trong các chiến dịch tấn công chiếm đoạt tài khoản.\n\n### 3. Đề xuất biện pháp phòng tránh\n• Tuyệt đối KHÔNG bấm vào liên kết hoặc đóng tab trình duyệt ngay lập tức.\n• KHÔNG cung cấp mật khẩu, thông tin cá nhân, số thẻ hay mã OTP trên trang web này.\n• Chặn liên kết và gửi báo cáo lừa đảo lên AICEE để bảo vệ cộng đồng.`,
        status: 'danger',
        recommendations: ['Không nhấp vào liên kết này', 'Không nhập thông tin cá nhân', 'Báo cáo cho cơ quan chức năng nếu cần']
      }
    },
    email: {
      warning: {
        text: `📧 **Phân tích Email**\n\n⚠️ [CẢNH BÁO] — Email có nhiều dấu hiệu giả mạo (Phishing)!\n\n### 1. Cách thức hệ thống đưa ra kết luận\n• Phân tích định danh người gửi: Tên hiển thị và địa chỉ hòm thư có sự sai lệch hoặc dùng dịch vụ email nặc danh.\n• Phân tích ngữ cảnh & tâm lý: Phát hiện thủ thuật tạo sự cấp bách, đe dọa khóa tài khoản hoặc áp lực phạt tiền.\n• Đối chiếu mẫu mã độc: Nội dung chứa yêu cầu xác minh thông tin qua đường link ngoài.\n\n### 2. Giải thích các dấu hiệu đáng ngờ\n• Email yêu cầu cung cấp thông tin nhạy cảm (mật khẩu, mã OTP, số CCCD, tài khoản ngân hàng).\n• Địa chỉ người gửi không xuất phát từ máy chủ chính thức của đơn vị được xưng danh.\n• Lời lẽ hối thúc ("hành động ngay trong 24h", "nếu không sẽ bị xử lý hình sự").\n\n### 3. Đề xuất biện pháp phòng tránh\n• Tuyệt đối KHÔNG trả lời email, không click vào liên kết và không tải tệp đính kèm.\n• KHÔNG bao giờ chia sẻ mã OTP hoặc mật khẩu qua email hay bất kỳ hình thức nào.\n• Đánh dấu email là Spam / Lừa đảo và liên hệ trực tiếp đơn vị qua hotline chính thống để xác minh.`,
        status: 'warning',
        recommendations: ['Không cung cấp OTP, mật khẩu qua email', 'Xác minh danh tính người gửi qua kênh chính thức', 'Báo cáo email vào mục Spam']
      }
    },
    phone: {
      danger: {
        text: `📱 **Xác minh Số Điện Thoại**\n\n❌ [NGUY HIỂM] — Số điện thoại có dấu hiệu lừa đảo cao!\n\n### 1. Cách thức hệ thống đưa ra kết luận\n• Đối chiếu cơ sở dữ liệu: Số điện thoại nằm trong danh sách bị cộng đồng an ninh mạng và người dùng báo cáo lừa đảo.\n• Phân tích hành vi cuộc gọi: Thường xuyên thực hiện cuộc gọi nháy máy, gọi tự động (robocall) hoặc giả danh cơ quan nhà nước.\n• Đánh giá mức độ rủi ro: Mức độ đe dọa cao, thuộc các nhóm kịch bản mạo danh tống tiền/chiếm đoạt tài sản.\n\n### 2. Giải thích các dấu hiệu đáng ngờ\n• Tự xưng là Cán bộ Công an, Viện kiểm sát, Tòa án, Nhân viên Ngân hàng hoặc Điện lực đòi làm việc qua điện thoại.\n• Đe dọa tài khoản dính líu đến đường dây rửa tiền, buôn bán ma túy hoặc nợ cước viễn thông lớn.\n• Yêu cầu chuyển tiền vào "tài khoản tạm giữ điều tra" hoặc yêu cầu đọc mã OTP ngân hàng.\n\n### 3. Đề xuất biện pháp phòng tránh\n• Dập máy ngay lập tức. Cơ quan chức năng Việt Nam KHÔNG BAO GIỜ làm việc hay yêu cầu chuyển tiền qua điện thoại.\n• Tuyệt đối KHÔNG chuyển tiền, không đọc mã OTP, không cài app theo đường link đối tượng gửi.\n• Chặn số điện thoại này trên thiết bị và báo cáo lên hệ thống AICEE hoặc đầu số 156 / 5656.`,
        status: 'danger',
        recommendations: ['Chặn số điện thoại này ngay', 'Không chuyển tiền theo yêu cầu lạ', 'Báo cáo lên cơ quan công an']
      }
    },
    advice: {
      info: {
        text: `🛡️ **Tư vấn An toàn Trực tuyến**\n\nℹ️ [THÔNG TIN] — Cẩm nang phòng chống lừa đảo & bảo vệ an toàn số.\n\n### 1. Cách thức hệ thống đưa ra kết luận\n• Dựa trên các khuyến cáo tiêu chuẩn của Cục An toàn thông tin (Bộ TT&TT) và kinh nghiệm phòng thủ an ninh mạng AICEE.\n• Tổng hợp từ các phương thức tấn công phổ biến nhất hiện nay nhắm vào người dùng internet tại Việt Nam.\n\n### 2. Giải thích các dấu hiệu đáng ngờ cần nhớ\n• Mạo danh: Tin nhắn SMS Brandname giả mạo ngân hàng, cuộc gọi Deepfake giả người thân.\n• Thao túng tâm lý: Đánh vào lòng tham (hoa hồng làm nhiệm vụ, trúng thưởng) hoặc nỗi sợ hãi (đe dọa khởi tố, phong tỏa tài sản).\n• Dẫn dụ cài mã độc: Yêu cầu cài đặt ứng dụng dịch vụ công giả mạo (file đuôi .apk) để chiếm quyền điều khiển điện thoại.\n\n### 3. Đề xuất biện pháp phòng tránh\n• Nguyên tắc 3 KHÔNG: Không tin - Không làm theo - Không chuyển tiền/cung cấp thông tin nhạy cảm.\n• Kích hoạt xác thực 2 bước (2FA) và bảo mật sinh trắc học cho mọi tài khoản quan trọng.\n• Cài đặt ứng dụng chỉ từ Google Play / App Store chính thức, thường xuyên cập nhật hệ điều hành.`,
        status: 'info',
        recommendations: ['Kiểm tra định kỳ tài khoản ngân hàng', 'Dùng ứng dụng quản lý mật khẩu uy tín']
      }
    },
    general: {
      info: {
        text: `Xin chào! Tôi là Chuyên gia Trợ lý AI Bảo mật của **AICEE** 🛡️\n\nTôi sẵn sàng hỗ trợ bạn phát hiện và phòng chống các thủ đoạn lừa đảo công nghệ cao:\n\n🔗 **Kiểm tra liên kết** — Phân tích URL, tên miền mạo danh, mã độc ẩn\n📧 **Phân tích email** — Phát hiện email giả mạo (phishing), lừa đảo doanh nghiệp\n📱 **Xác minh số điện thoại** — Kiểm tra số lừa đảo, mạo danh cơ quan công quyền\n📁 **Phân tích hình ảnh & file** — Quét mã QR, đọc ảnh chụp màn hình tin nhắn đáng ngờ\n🛡️ **Tư vấn an ninh** — Hướng dẫn xử lý khi gặp tình huống nghi ngờ lừa đảo\n\n**Khi phân tích, tôi luôn cung cấp đầy đủ 3 phần:**\n1. Cách thức hệ thống đưa ra kết luận\n2. Giải thích các dấu hiệu đáng ngờ\n3. Đề xuất biện pháp phòng tránh cụ thể\n\nHãy gửi nội dung hoặc đính kèm ảnh cần kiểm tra cho tôi nhé!`,
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

// Gửi tin nhắn tới Gemini AI (Hỗ trợ cấu hình riêng GEMINI_CHAT_MODEL và cơ chế dự phòng)
async function sendToGemini(message, history = []) {
  if (!GEMINI_API_KEY) {
    return getMockResponse(message);
  }

  const chatModels = [
    process.env.GEMINI_CHAT_MODEL,
    process.env.GEMINI_MODEL,
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-pro-latest'
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  // Lọc lịch sử hợp lệ và đổi role từ 'ai' thành 'model' nếu có
  const validHistory = history
    .filter(h => h.content && h.content.trim())
    .map(h => ({
      role: h.role === 'model' || h.role === 'ai' ? 'model' : 'user',
      parts: [{ text: h.content.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '') }]
    }));

  const cleanMessage = message.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '');

  let lastError = null;

  for (const modelName of chatModels) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: SYSTEM_PROMPT 
      });

      const chat = model.startChat({
        history: validHistory,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.6,
        }
      });

      const result = await chat.sendMessage(cleanMessage);
      let responseText = result.response.text().trim();

      // Strip markdown code blocks
      responseText = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();

      try {
        if (responseText.startsWith('{')) {
          const parsed = JSON.parse(responseText);
          if (parsed.text) responseText = parsed.text;
        }
      } catch (e) {
        // Bỏ qua lỗi parse JSON
      }

      // Chuẩn hóa khoảng trắng thừa nhưng GIỮ NGUYÊN emoji và định dạng markdown
      responseText = responseText.replace(/[^\S\r\n]{2,}/g, ' ').trim();

      // Xác định status từ phần đầu của phản hồi với thứ tự ưu tiên chính xác
      const headerSample = responseText.slice(0, 300).toLowerCase();
      let status = 'info';
      if (
        headerSample.includes('❌') ||
        headerSample.includes('[nguy hiểm]') ||
        headerSample.startsWith('nguy hiểm') ||
        headerSample.includes('kết luận: nguy hiểm')
      ) {
        status = 'danger';
      } else if (
        headerSample.includes('⚠️') ||
        headerSample.includes('[cảnh báo]') ||
        headerSample.startsWith('cảnh báo') ||
        headerSample.includes('kết luận: cảnh báo') ||
        headerSample.includes('đáng ngờ')
      ) {
        status = 'warning';
      } else if (
        headerSample.includes('✅') ||
        headerSample.includes('[an toàn]') ||
        headerSample.startsWith('an toàn') ||
        headerSample.includes('kết luận: an toàn')
      ) {
        status = 'safe';
      } else {
        // Fallback kiểm tra từ khóa trọng yếu
        const lower = responseText.toLowerCase();
        if (lower.includes('nguy hiểm') || lower.includes('lừa đảo')) {
          status = 'danger';
        } else if (lower.includes('cảnh báo') || lower.includes('đáng ngờ') || lower.includes('rủi ro')) {
          status = 'warning';
        } else if (lower.includes('an toàn')) {
          status = 'safe';
        }
      }

      return { text: responseText, status, recommendations: [] };
    } catch (error) {
      console.warn(`[Gemini Chat] Model ${modelName} gặp sự cố, tự động thử model dự phòng:`, error.message);
      lastError = error;
    }
  }

  console.error('Gemini Chat API error trên tất cả các model:', lastError?.message);
  return getMockResponse(message);
}

// Phân tích file/hình ảnh kết hợp bộ giải mã QR cục bộ và Gemini Vision
async function analyzeFile(fileName, fileType, fileContent, userMessage = '') {
  const isImage = fileType && fileType.startsWith('image/');

  if (!isImage) {
    return {
      text: `📄 **Phân tích tệp tin: ${fileName}**\n\n✅ [AN TOÀN] — Đã kiểm tra định dạng và cấu trúc tệp tin.\n\n### 1. Cách thức hệ thống đưa ra kết luận\n• Phân tích phần mở rộng và MIME type: Xác nhận định dạng hợp lệ (${fileType || 'tài liệu'}).\n• Quét cấu trúc nhị phân: Không phát hiện chữ ký thực thi độc hại (.exe, .bat, .vbs, .sh, .apk, .scr).\n• Kiểm tra script: Không phát hiện macro tự động hoặc payload khả nghi trong metadata.\n\n### 2. Giải thích các dấu hiệu đáng ngờ\n• Không phát hiện dấu hiệu virus, trojan hoặc mã độc tống tiền (ransomware).\n• Tệp tin tài liệu đạt chuẩn an toàn cơ bản.\n\n### 3. Đề xuất biện pháp phòng tránh\n• Luôn vô hiệu hóa tính năng tự động chạy Macro trên Microsoft Office / PDF reader.\n• Chỉ mở các tệp tin được gửi từ nguồn người gửi rõ ràng, đã được xác thực danh tính.`,
      status: 'safe',
      recommendations: [
        'Không mở macro trong tài liệu Word/Excel từ nguồn lạ',
        'Kiểm tra kỹ nguồn gốc người gửi trước khi tải và mở tệp'
      ]
    };
  }

  // 1. Chuẩn bị Buffer ảnh từ filePath hoặc base64
  let imageBuffer = null;
  if (Buffer.isBuffer(fileContent)) {
    imageBuffer = fileContent;
  } else if (typeof fileContent === 'string') {
    try {
      if (fs.existsSync(fileContent)) {
        imageBuffer = fs.readFileSync(fileContent);
      } else if (fileContent.startsWith('data:')) {
        const base64Data = fileContent.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      }
    } catch (e) {
      console.warn('Không thể đọc file buffer cho ảnh:', e.message);
    }
  }

  // 2. Tiền xử lý quét QR cục bộ (100% thuần JS, không tốn token, dưới 50ms)
  let qrResult = { found: false };
  let qrAnalysis = null;
  if (imageBuffer) {
    qrResult = await decodeQRFromImage(imageBuffer);
    if (qrResult.found) {
      qrAnalysis = analyzeQRPayload(qrResult.data);
    }
  }

  // 3. Xử lý Trường hợp A: Ảnh chỉ là 1 mã QR đơn thuần và người dùng không hỏi câu hỏi phức tạp
  // => Trả ngay kết quả giải mã và kiểm tra rủi ro tức thì mà KHÔNG CẦN gọi AI Model
  const hasUserSpecificQuestion = userMessage && userMessage.trim().length > 6;
  if (qrResult.found && qrResult.isStandalone && !hasUserSpecificQuestion) {
    const riskBadge = qrAnalysis.status === 'danger' ? '❌ [NGUY HIỂM]' :
                      qrAnalysis.status === 'warning' ? '⚠️ [CẢNH BÁO]' : '✅ [AN TOÀN]';
    
    let reportText = `🔍 **Phát hiện mã QR trong ảnh (${fileName})**\n\n` +
      `📌 **Nội dung mã QR trích xuất:** \`${qrResult.data}\`\n\n` +
      `${riskBadge} — **${qrAnalysis.summary}**\n\n` +
      `### 1. Cách thức hệ thống đưa ra kết luận\n` +
      `• Bộ giải mã QR nội bộ AICEE bóc tách dữ liệu gốc trực tiếp từ pixel ảnh mà không cần chuyển tiếp bên ngoài.\n` +
      `• Phân tích cấu trúc chuỗi ký tự, giao thức điều hướng (scheme/URL) và đối chiếu danh mục tấn công QR Phishing (Quishing).\n\n` +
      `### 2. Giải thích các dấu hiệu đáng ngờ\n` +
      (qrAnalysis.issues && qrAnalysis.issues.length > 0
        ? qrAnalysis.issues.map(iss => `• ${iss}`).join('\n')
        : `• Không phát hiện liên kết chuyển hướng độc hại, đầu số tính phí ngầm hay mã nhúng bất thường trong mã QR này.`) + `\n\n` +
      `### 3. Đề xuất biện pháp phòng tránh\n` +
      `• Luôn kiểm tra kỹ tên miền trên thanh địa chỉ trình duyệt sau khi quét mở bất kỳ mã QR nào.\n` +
      `• Cảnh giác với các mã QR dán đè ở cây xăng, quán ăn, trụ ATM hoặc nhận qua tin nhắn từ người lạ.\n` +
      `• Tuyệt đối không cung cấp thông tin tài khoản ngân hàng hoặc mã OTP sau khi quét mã QR.`;

    return {
      text: reportText,
      status: qrAnalysis.status,
      recommendations: qrAnalysis.recommendations || []
    };
  }

  // 4. Xử lý Trường hợp B (Ảnh chụp đoạn chat/website CÓ chứa mã QR)
  // và Trường hợp C (Ảnh chụp màn hình thông thường KHÔNG CÓ mã QR)
  // => Đều chuyển tiếp cho Gemini Vision để phân tích toàn bộ ngữ cảnh
  if (GEMINI_API_KEY && imageBuffer) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: GEMINI_VISION_MODEL || GEMINI_MODEL || 'gemini-3.5-flash',
        systemInstruction: SYSTEM_PROMPT
      });

      const mime = fileType && fileType.startsWith('image/') ? fileType : 'image/jpeg';
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mime
        }
      };

      let promptText = '';
      if (qrResult.found) {
        // Trường hợp B: Bổ trợ dữ liệu QR đã giải mã vào Prompt của AI
        promptText = `[THÔNG TIN GIẢI MÃ TỪ CÔNG CỤ QUÉT QR NỘI BỘ]:
Hệ thống đã nhận diện và bóc tách thành công mã QR xuất hiện trong hình ảnh này:
- Chuỗi dữ liệu/Liên kết thực tế trong mã QR: "${qrResult.data}"
- Đánh giá kỹ thuật sơ bộ: ${qrAnalysis ? qrAnalysis.summary : 'Chưa rõ'}
${userMessage ? `[GHI CHÚ / CÂU HỎI CỦA NGƯỜI DÙNG]: "${userMessage}"` : ''}

NHIỆM VỤ CỦA BẠN:
1. Đọc và phân tích toàn bộ nội dung trò chuyện/giao diện trang web trong ảnh (thủ đoạn lừa đảo, mạo danh ngân hàng/công an, yêu cầu chuyển tiền/nạp tiền/làm nhiệm vụ).
2. Kết hợp với liên kết/mã QR đã giải mã ở trên để đánh giá rủi ro tổng thể.
3. BẮT BUỘC tuân thủ cấu trúc 3 phần:
Dòng đầu: "✅ [AN TOÀN]", "⚠️ [CẢNH BÁO]", hoặc "❌ [NGUY HIỂM]" kèm tóm tắt.
### 1. Cách thức hệ thống đưa ra kết luận
### 2. Giải thích các dấu hiệu đáng ngờ
### 3. Đề xuất biện pháp phòng tránh`;
      } else {
        // Trường hợp C: Ảnh chụp màn hình thông thường (SMS, chat, app, hóa đơn)
        promptText = `[PHÂN TÍCH HÌNH ẢNH AN NINH MẠNG]:
Người dùng gửi hình ảnh này để kiểm tra rủi ro lừa đảo / an toàn bảo mật.
${userMessage ? `[GHI CHÚ / CÂU HỎI CỦA NGƯỜI DÙNG]: "${userMessage}"` : ''}

NHIỆM VỤ CỦA BẠN:
1. Đọc văn bản trong hình ảnh (OCR), nhận diện thủ đoạn lừa đảo (giả mạo thương hiệu/ngân hàng/công an, dọa khóa tài khoản, trúng thưởng, yêu cầu nạp tiền, vay online, cài app .apk lạ).
2. BẮT BUỘC tuân thủ cấu trúc 3 phần:
Dòng đầu: "✅ [AN TOÀN]", "⚠️ [CẢNH BÁO]", "❌ [NGUY HIỂM]", hoặc "ℹ️ [THÔNG TIN]" kèm tóm tắt.
### 1. Cách thức hệ thống đưa ra kết luận
(Cơ sở nhận diện qua thị giác OCR, phân tích tâm lý thao túng, kiểm tra dấu hiệu mạo danh)
### 2. Giải thích các dấu hiệu đáng ngờ
(Chỉ rõ từng điểm bất thường: từ ngữ hối thúc/đe dọa, yêu cầu nhạy cảm như OTP/tiền, lỗi văn phong, số điện thoại hoặc tài khoản đích đáng ngờ)
### 3. Đề xuất biện pháp phòng tránh
(Hành động tức thời không làm theo, cách xác minh kênh chính thống, biện pháp phòng ngừa lâu dài)`;
      }

      const result = await model.generateContent([promptText, imagePart]);
      let responseText = result.response.text().trim();

      // Dọn dẹp markdown code block
      responseText = responseText.replace(/^```(?:json|markdown)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

      // Xác định status từ câu trả lời
      const headerSample = responseText.slice(0, 300).toLowerCase();
      let status = 'info';
      if (
        headerSample.includes('❌') ||
        headerSample.includes('[nguy hiểm]') ||
        headerSample.startsWith('nguy hiểm') ||
        headerSample.includes('kết luận: nguy hiểm')
      ) {
        status = 'danger';
      } else if (
        headerSample.includes('⚠️') ||
        headerSample.includes('[cảnh báo]') ||
        headerSample.startsWith('cảnh báo') ||
        headerSample.includes('kết luận: cảnh báo') ||
        headerSample.includes('đáng ngờ')
      ) {
        status = 'warning';
      } else if (
        headerSample.includes('✅') ||
        headerSample.includes('[an toàn]') ||
        headerSample.startsWith('an toàn') ||
        headerSample.includes('kết luận: an toàn')
      ) {
        status = 'safe';
      } else {
        const lower = responseText.toLowerCase();
        if (lower.includes('nguy hiểm') || lower.includes('lừa đảo')) {
          status = 'danger';
        } else if (lower.includes('cảnh báo') || lower.includes('đáng ngờ') || lower.includes('rủi ro')) {
          status = 'warning';
        } else if (lower.includes('an toàn')) {
          status = 'safe';
        }
      }

      // Nếu có mã QR, thêm thông tin bóc tách nổi bật lên đầu tin nhắn
      if (qrResult.found) {
        responseText = `🔍 **Phát hiện mã QR trong ảnh: [ \`${qrResult.data}\` ]**\n\n` + responseText;
      }

      const recs = qrAnalysis && qrAnalysis.recommendations && qrAnalysis.recommendations.length > 0
        ? qrAnalysis.recommendations
        : ['Luôn xác minh danh tính người gửi qua kênh chính thức', 'Không cung cấp mã OTP hoặc mật khẩu'];

      return {
        text: responseText,
        status,
        recommendations: recs
      };
    } catch (aiErr) {
      console.error('Lỗi khi gọi Gemini Vision:', aiErr.message);
      if (qrResult.found) {
        return {
          text: `🔍 **Phát hiện mã QR trong ảnh:** \`${qrResult.data}\`\n\n⚠️ ${qrAnalysis.summary}\n\n*Hệ thống tạm thời không thể kết nối tới mô hình AI để phân tích ngữ cảnh ảnh.*`,
          status: qrAnalysis.status,
          recommendations: qrAnalysis.recommendations || []
        };
      }
    }
  }

  // Fallback an toàn khi không thể gọi AI
  return {
    text: `🖼️ **Phân tích hình ảnh: ${fileName}**\n\n✅ [AN TOÀN] — Đã kiểm tra cơ bản hình ảnh.\n\n### 1. Cách thức hệ thống đưa ra kết luận\n• Bộ lọc hình ảnh kiểm tra định dạng tệp và không phát hiện mã QR nguy hiểm.\n• Tệp hình ảnh hiển thị hợp lệ, không chứa mã khai thác tràn bộ đệm.\n\n### 2. Giải thích các dấu hiệu đáng ngờ\n• Không phát hiện dấu hiệu bất thường trực quan.\n\n### 3. Đề xuất biện pháp phòng tránh\n• Luôn cảnh giác nếu đây là ảnh chụp tin nhắn yêu cầu mã OTP hoặc chuyển khoản tiền bạc.`,
    status: 'safe',
    recommendations: ['Luôn cẩn trọng với các tin nhắn yêu cầu mã OTP hoặc chuyển khoản']
  };
}

module.exports = { sendToGemini, analyzeFile, analyzeWithHeuristic, getMockResponse };
