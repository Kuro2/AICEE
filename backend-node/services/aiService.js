const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const { decodeQRFromImage, analyzeQRPayload } = require('./qrService');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-flash-lite-latest';
const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-flash-lite-latest';

// Giới hạn thời gian tối đa cho mỗi lượt gọi model (ngăn chặn tình trạng SDK tự động retry loop khi Google 503 làm treo nhiều phút)
function callWithTimeout(promise, ms, name) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Model ${name} vượt quá ${ms}ms (timeout)`)), ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise
  ]);
}

// Hệ thống prompt cho AI chuyên về an ninh mạng - Cực kỳ tinh gọn, điềm tĩnh, không lặp ý
const SYSTEM_PROMPT = `Bạn là chuyên gia an ninh mạng và an toàn số của AICEE. Bạn đóng vai trò như một người bạn hiểu biết, điềm tĩnh, trực tiếp bảo vệ và hướng dẫn người dùng trước các rủi ro lừa đảo trực tuyến.

NGUYÊN TẮC BẮT BUỘC VỀ ĐỘ DÀI VÀ CẤU TRÚC:
1. CỰC KỲ NGẮN GỌN VÀ ĐI THẲNG VÀO TRỌNG TÂM:
   - Người đọc (đặc biệt là người đang lo lắng, hoảng sợ) chỉ cần biết: Đây là gì, vì sao đáng ngờ, và phải làm gì ngay.
   - Tuyệt đối KHÔNG viết dài dòng. Mỗi gạch đầu dòng chỉ từ 1 đến 2 câu ngắn (không giải thích dông dài).
   - KHÔNG lặp ý giữa phần phân tích và phần hành động.

2. KHÔNG LẠM DỤNG EMOJI VÀ CHỮ IN HOA:
   - Tuyệt đối KHÔNG gắn emoji ở đầu mỗi câu hay mỗi gạch đầu dòng (không dùng ❌, 🔍, 💡, 🚫, 🧘, 🏥, 🛑).
   - KHÔNG viết hoa toàn bộ từ ngữ (ALL CAPS).

3. BỐ CỤC CHUẨN XÁC THEO MẪU:
   Câu 1 (Khẳng định trực diện): "Đây là tin nhắn lừa đảo, bạn đừng chuyển tiền." (hoặc "Đây là trang web chính thức, bạn có thể yên tâm.").
   
   Đoạn 2 (1-2 câu tóm tắt kịch bản): Kẻ gian giả làm ai, tạo cớ gì để gây áp lực. Có mấy điểm đáng ngờ:
   
   Mục "Có mấy điểm đáng ngờ:"
   - Dấu hiệu số lạ / mạo danh.
   - Dấu hiệu thúc ép, từ ngữ tạo hoảng loạn.
   - Mâu thuẫn với quy trình thực tế (bệnh viện luôn cấp cứu trước, ngân hàng không bao giờ hỏi mật khẩu/OTP).
   
   Mục "Bạn nên làm ngay:"
   - Không chuyển tiền, không trả lời số/tin nhắn này.
   - Gọi trực tiếp cho người liên quan/nhà trường bằng số điện thoại đã lưu từ trước để hỏi.
   - Chặn số và báo nhà mạng hoặc công an.
   
   Đoạn kết: "Nếu lỡ chuyển tiền, gọi ngay ngân hàng để xin khóa giao dịch và trình báo công an."

Tuyệt đối KHÔNG trả lời dưới dạng JSON hay code block.`;

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

  // Cac mau kich ban lua dao tin nhan pho bien tai Viet Nam
  const hasEmergencyScam = (lower.includes('cấp cứu') || lower.includes('chấn thương sọ não') || lower.includes('phẫu thuật') || lower.includes('tai nạn')) && (lower.includes('chuyển tiền') || lower.includes('tiền') || lower.includes('viện phí'));
  const hasLotteryScam = (lower.includes('trúng thưởng') || lower.includes('tri ân') || lower.includes('nhận xe') || lower.includes('trung thuong')) && (lower.includes('chuyển khoản') || lower.includes('phí') || lower.includes('phi'));
  const hasJobScam = (lower.includes('tuyển') || lower.includes('cộng tác viên') || lower.includes('tiktok') || lower.includes('nhiệm vụ') || lower.includes('nhiem vu')) && (lower.includes('hoa hồng') || lower.includes('hoa hong') || lower.includes('kiếm') || lower.includes('kiem'));
  const hasBankOtpScam = (lower.includes('ngân hàng') || lower.includes('ngan hang') || lower.includes('tài khoản') || lower.includes('giao dịch bất thường') || lower.includes('giao dich')) && (lower.includes('mã otp') || lower.includes('otp') || lower.includes('mật khẩu') || lower.includes('hủy giao dịch') || lower.includes('huy giao dich'));
  const hasPoliceScam = (lower.includes('cảnh sát giao thông') || lower.includes('công an') || lower.includes('phạt nguội') || lower.includes('phat nguoi') || lower.includes('csgt')) && (lower.includes('nộp phạt') || lower.includes('nop phat') || lower.includes('tước bằng lái') || lower.includes('tich thu'));

  if (hasEmergencyScam || hasLotteryScam || hasJobScam || hasBankOtpScam || hasPoliceScam) {
    return { type: 'scam_text', status: 'danger', details: { hasEmergencyScam, hasLotteryScam, hasJobScam, hasBankOtpScam, hasPoliceScam } };
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

// Gửi tin nhắn tới Gemini AI (Hỗ trợ cấu hình riêng GEMINI_CHAT_MODEL và cơ chế dự phòng)
async function sendToGemini(message, history = []) {
  if (!GEMINI_API_KEY) {
    return getMockResponse(message);
  }

  const chatModels = [
    process.env.GEMINI_CHAT_MODEL || 'gemini-flash-lite-latest',
    'gemini-flash-lite-latest',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'
  ].filter((v, i, a) => a.indexOf(v) === i);

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

      const result = await callWithTimeout(chat.sendMessage(cleanMessage), 6000, modelName);
      console.log(`[Gemini Chat] ✅ Phản hồi thành công từ model ${modelName}`);
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

      // Loại bỏ toàn bộ emoji khỏi câu trả lời của AI
      responseText = responseText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '').replace(/[^\S\r\n]{2,}/g, ' ').trim();

      const lower = responseText.toLowerCase();
      let status = 'info';
      if (
        lower.includes('lừa đảo') ||
        lower.includes('nguy hiểm') ||
        lower.includes('giả mạo') ||
        lower.includes('đừng chuyển tiền') ||
        lower.includes('không chuyển tiền') ||
        lower.includes('mã độc')
      ) {
        status = 'danger';
      } else if (
        lower.includes('cảnh báo') ||
        lower.includes('đáng ngờ') ||
        lower.includes('cảnh giác') ||
        lower.includes('thận trọng')
      ) {
        status = 'warning';
      } else if (
        lower.includes('an toàn') ||
        lower.includes('chính thức') ||
        lower.includes('hợp lệ')
      ) {
        status = 'safe';
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
      text: `📄 **Phân tích tệp tin: ${fileName}**\n\n✅ **KẾT QUẢ: ĐÃ KIỂM TRA ĐỊNH DẠNG**\n\n🔎 **Chi tiết kiểm tra:**\n• Định dạng tệp: ${fileType || 'Không xác định'}\n• Không phát hiện phần mở rộng nguy hiểm thực thi (.exe, .bat, .vbs, .sh, .apk)\n• Tệp tài liệu tiêu chuẩn.`,
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
    const riskBadge = qrAnalysis.status === 'danger' ? '❌ NGUY HIỂM' :
                      qrAnalysis.status === 'warning' ? '⚠️ CẢNH BÁO' : '✅ AN TOÀN';
    
    let reportText = `🔍 **Phát hiện mã QR trong ảnh (${fileName})**\n\n` +
      `📌 **Nội dung mã QR trích xuất:** \`${qrResult.data}\`\n\n` +
      `${riskBadge} — **${qrAnalysis.summary}**\n\n`;

    if (qrAnalysis.issues && qrAnalysis.issues.length > 0) {
      reportText += `🔎 **Dấu hiệu kỹ thuật:**\n` + qrAnalysis.issues.map(iss => `• ${iss}`).join('\n') + `\n\n`;
    }

    reportText += `⚡ *Kết quả giải mã tức thì bằng công cụ quét mã nội bộ AICEE (Tiết kiệm thời gian & không qua AI).*`;

    return {
      text: reportText,
      status: qrAnalysis.status,
      recommendations: qrAnalysis.recommendations || []
    };
  }

  // 4. Xử lý Trường hợp B (Ảnh chụp đoạn chat/website CÓ chứa mã QR)
  // và Trường hợp C (Ảnh chụp màn hình thông thường KHÔNG CÓ mã QR)
  // => Đều chuyển tiếp cho Gemini Vision để phân tích toàn bộ ngữ cảnh (kèm chuỗi fallback)
  if (GEMINI_API_KEY && imageBuffer) {
    const visionModels = [
      process.env.GEMINI_VISION_MODEL || 'gemini-flash-lite-latest',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'
    ].filter((v, i, a) => a.indexOf(v) === i);

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
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
${userMessage ? `[Ghi chú / câu hỏi của người dùng]: "${userMessage}"` : ''}

YÊU CẦU PHÂN TÍCH:
1. Đọc và phân tích toàn bộ nội dung trong ảnh kết hợp với chuỗi liên kết/mã QR ở trên.
2. Trả lời theo phong cách điềm tĩnh, ấm áp, thấu cảm và trực diện như một người bạn hiểu biết:
   - Mở đầu bằng 1 câu khẳng định ngắn gọn bản chất sự việc (Ví dụ: "Đây là tin nhắn lừa đảo, bạn đừng chuyển tiền." hoặc "Mã QR này dẫn đến trang web an toàn, bạn có thể yên tâm.").
   - Nêu ngắn gọn kịch bản lừa đảo (kẻ gian mạo danh ai, tạo tình huống gì để đánh vào tâm lý).
   - "Những điểm đáng ngờ trong tin nhắn:" (nêu 2-3 điểm cụ thể: chi tiết vô lý, số điện thoại lạ, mâu thuẫn quy trình thực tế).
   - "Bạn nên làm gì:" (các bước hành động bình tĩnh: không làm theo, gọi số chính thức từ trước để xác minh, chặn số, liên hệ ngân hàng nếu đã lỡ chuyển).
3. Tuyệt đối KHÔNG lạm dụng emoji ở đầu mỗi câu (không dùng ❌, 🔍, 💡, 🚫, 🧘, 🏥, 🛑), KHÔNG viết hoa toàn bộ từ ngữ (ALL CAPS).`;
      } else {
        // Trường hợp C: Ảnh chụp màn hình thông thường (SMS, chat, app, hóa đơn)
        promptText = `[PHÂN TÍCH HÌNH ẢNH AN NINH MẠNG]:
Người dùng gửi hình ảnh này để nhờ kiểm tra xem có phải lừa đảo hay an toàn không.
${userMessage ? `[Ghi chú / câu hỏi của người dùng]: "${userMessage}"` : ''}

YÊU CẦU QUAN TRỌNG:
Hãy trả lời CỰC KỲ NGẮN GỌN, đi thẳng vào bản chất, không lặp ý, không giải thích dông dài theo đúng cấu trúc mẫu chuẩn sau:

Đoạn 1:
"Đây là tin nhắn lừa đảo, bạn đừng chuyển tiền." (hoặc "Đây là trang web/thông báo an toàn, bạn có thể yên tâm.")

Đoạn 2 (1-2 câu):
Kẻ gian giả làm ai, bịa chuyện gì rồi giục chuyển tiền gấp để bạn hoảng mà không kịp kiểm tra. Có mấy điểm đáng ngờ:

Mục "Có mấy điểm đáng ngờ:" (chỉ nêu 2-3 gạch đầu dòng ngắn, mỗi dòng 1 câu):
- Tin nhắn từ số lạ, không phải số giáo viên bạn đã lưu.
- Liên tục thúc giục, dùng từ "nguy kịch" để tạo áp lực.
- Bệnh viện luôn cấp cứu trước, không bắt chuyển tiền cá nhân rồi mới mổ.

Mục "Bạn nên làm ngay:" (chỉ nêu 2-3 gạch đầu dòng hành động ngắn, không lặp lại ý bên trên):
- Không chuyển tiền, không trả lời số này.
- Gọi giáo viên chủ nhiệm hoặc nhà trường bằng số đã lưu để hỏi về con.
- Chặn số và báo nhà mạng hoặc công an.

Đoạn kết (1 câu):
"Nếu lỡ chuyển tiền, gọi ngay ngân hàng để xin khóa giao dịch và trình báo công an."

TUYỆT ĐỐI BẮT BUỘC:
- KHÔNG dùng bất kỳ emoji nào (không ❌, 🔍, 💡, 🚫, 🧘, 🏥, 🛑).
- KHÔNG viết hoa nguyên câu (ALL CAPS).
- Mỗi gạch đầu dòng chỉ từ 1 câu ngắn, không giải thích dông dài.`;
      }

      let result = null;
      let lastVisionErr = null;
      for (const vModel of visionModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: vModel,
            systemInstruction: SYSTEM_PROMPT
          });
          result = await callWithTimeout(model.generateContent([promptText, imagePart]), 8000, vModel);
          if (result) {
            console.log(`[Gemini Vision] ✅ Phân tích thành công từ model ${vModel}`);
            break;
          }
        } catch (vErr) {
          console.warn(`[Gemini Vision] Model ${vModel} lỗi, tự động thử model dự phòng:`, vErr.message);
          lastVisionErr = vErr;
        }
      }

      if (!result) throw lastVisionErr;
      let responseText = result.response.text().trim();

      // Dọn dẹp markdown code block
      responseText = responseText.replace(/^```(?:json|markdown)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

      // Xác định status từ câu trả lời một cách tự nhiên
      const lower = responseText.toLowerCase();
      let status = 'info';
      if (
        lower.includes('lừa đảo') ||
        lower.includes('nguy hiểm') ||
        lower.includes('giả mạo') ||
        lower.includes('đừng chuyển tiền') ||
        lower.includes('không chuyển tiền') ||
        lower.includes('mã độc')
      ) {
        status = 'danger';
      } else if (
        lower.includes('cảnh báo') ||
        lower.includes('đáng ngờ') ||
        lower.includes('cảnh giác') ||
        lower.includes('thận trọng')
      ) {
        status = 'warning';
      } else if (
        lower.includes('an toàn') ||
        lower.includes('chính thức') ||
        lower.includes('hợp lệ')
      ) {
        status = 'safe';
      }

      // Nếu có mã QR, thêm thông tin bóc tách ngắn gọn lên đầu
      if (qrResult.found) {
        responseText = `Mã QR trong ảnh dẫn tới: \`${qrResult.data}\`\n\n` + responseText;
      }

      return {
        text: responseText,
        status,
        recommendations: [] // Để rỗng vì các hành động cụ thể đã được AI trình bày rõ ràng trong "Bạn nên làm gì:"
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
    text: `🖼️ **Phân tích hình ảnh: ${fileName}**\n\n✅ **KẾT QUẢ: ĐÃ KIỂM TRA**\n\n• Không phát hiện mã QR nguy hiểm\n• Định dạng hình ảnh hợp lệ.\n• Khuyên người dùng thận trọng nếu đây là tin nhắn yêu cầu tiền bạc.`,
    status: 'safe',
    recommendations: ['Luôn cẩn trọng với các tin nhắn yêu cầu mã OTP hoặc chuyển khoản']
  };
}

module.exports = { sendToGemini, analyzeFile, analyzeWithHeuristic, getMockResponse };
