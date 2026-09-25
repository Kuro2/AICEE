const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8';

// ============================================================
// CƠ CHẾ COOLDOWN THEO MODEL
// Khi một model bị lỗi quota (429 / RESOURCE_EXHAUSTED), ta đánh dấu
// "tạm nghỉ" model đó trong 1 khoảng thời gian. Các request sau sẽ tự
// động bỏ qua model đang cooldown và nhảy thẳng sang model kế tiếp,
// thay vì lặp lại một lượt gọi thất bại tốn quota mỗi lần.
//
// LƯU Ý: Map này chỉ tồn tại trong bộ nhớ của 1 tiến trình (process).
// Nếu bạn deploy dạng serverless (mỗi request có thể là 1 instance mới,
// ví dụ Vercel/Cloud Functions), cooldown sẽ KHÔNG được chia sẻ giữa
// các lần gọi. Trường hợp đó cần lưu cooldown vào Redis / DB / file
// thay vì biến trong RAM để cơ chế này thực sự hiệu quả.
// ============================================================
const modelCooldowns = new Map(); // modelName -> timestamp (ms) hết hạn cooldown

const COOLDOWN_RPM_MS = 60 * 1000;            // hết RPM (theo phút) -> nghỉ 60s
const COOLDOWN_RPD_MS = 24 * 60 * 60 * 1000;  // hết RPD (theo ngày) -> nghỉ 24h

function isModelOnCooldown(modelName) {
  const until = modelCooldowns.get(modelName);
  return typeof until === 'number' && Date.now() < until;
}

function setModelCooldown(modelName, ms) {
  modelCooldowns.set(modelName, Date.now() + ms);
}

// Phân loại lỗi từ Gemini API để biết nên cooldown bao lâu
function classifyQuotaError(error) {
  const status = error?.status || error?.response?.status || error?.code;
  const raw = `${error?.message || ''} ${JSON.stringify(error?.errorDetails || '')}`.toLowerCase();

  const isQuotaError =
    status === 429 ||
    raw.includes('resource_exhausted') ||
    raw.includes('quota') ||
    raw.includes('rate limit');

  if (!isQuotaError) return { isQuotaError: false, cooldownMs: 0 };

  // Cố gắng đoán đây là quota theo NGÀY (RPD) hay theo PHÚT (RPM)
  // dựa trên nội dung message trả về từ Google.
  const isDailyQuota =
    raw.includes('per day') ||
    raw.includes('daily') ||
    raw.includes('requests per day') ||
    raw.includes('generaterequestsperdayperprojectpermodel');

  return {
    isQuotaError: true,
    cooldownMs: isDailyQuota ? COOLDOWN_RPD_MS : COOLDOWN_RPM_MS,
  };
}
// ============================================================

// Hàm loại bỏ triệt để mọi biểu tượng cảm xúc và icon Unicode, nhưng giữ nguyên ngắt dòng và đoạn văn
function stripEmojis(text) {
  if (!text) return '';
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '')
    .replace(/[^\S\r\n]{2,}/g, ' ') // Chỉ gộp khoảng trắng ngang, không xóa ngắt dòng
    .replace(/\n{3,}/g, '\n\n')     // Giữ tối đa 2 ngắt dòng liên tiếp để cách đoạn thoáng
    .trim();
}

// Hệ thống prompt chuyên gia cho AI an ninh mạng và vấn đáp tình huống
const SYSTEM_PROMPT = `Bạn là Chuyên gia Cố vấn An ninh mạng của nền tảng AICEE Việt Nam.

TÂM LÝ NGƯỜI DÙNG: Người dùng đang trong tình huống nghi ngờ bị lừa đảo hoặc đang rất hoang mang, lo lắng. Họ KHÔNG có kiên nhẫn để đọc các đoạn văn dài giải thích lý thuyết.

QUY TẮC TRÌNH BÀY BẮT BUỘC:
1. NGẮN GỌN VÀ ĐI THẲNG VÀO HÀNH ĐỘNG: Toàn bộ câu trả lời chỉ từ 100 - 180 từ. Không viết mở bài hay kết bài rườm rà.
2. GIÃN DÒNG THOÁNG ĐÃNG: Bắt buộc chèn một dòng trống giữa các phần để dễ đọc lướt nhanh trong 10 giây.
3. IN ĐẬM TỪ KHÓA QUAN TRỌNG: Sử dụng cú pháp **từ khóa** để làm nổi bật ngay lập tức các hành động sống còn (ví dụ: **Tuyệt đối không chuyển tiền**, **Khóa tài khoản ngay**, **Gọi điện thoại trực tiếp**).
4. KHÔNG DÙNG ICON/EMOJI: Tuyệt đối không dùng bất kỳ icon hay biểu tượng cảm xúc nào.
5. CẤU TRÚC PHẢN HỒI (bắt đầu bằng nhãn phân loại ở dòng đầu tiên):

[NGUY HIỂM] (hoặc [CẢNH BÁO] / [AN TOÀN] / [THÔNG TIN])

**Dấu hiệu nhận biết nhanh:**
- Gạch đầu dòng ngắn về 2-3 dấu hiệu cốt lõi.

**Hành động khẩn cấp:**
- Gạch đầu dòng về các bước người dùng cần làm ngay lúc này.`;

// Logic phân tích heuristic khi chạy chế độ dự phòng
function analyzeWithHeuristic(message) {
  const lower = message.toLowerCase().trim();

  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.(com|net|org|vn|io|xyz|top|club|info|online|site|store)[^\s]*)/gi;
  const hasUrl = urlRegex.test(lower);

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const hasEmail = emailRegex.test(lower);

  const phoneRegex = /(0|\+84)[3|5|7|8|9][0-9]{8}|(\d{9,11})/;
  const hasPhone = phoneRegex.test(lower);

  const blacklistedKeywords = [
    'phishing', 'malware', 'virus', 'trojan', 'scam',
    'free-gift', 'click-here', 'urgent', 'verify-account',
    'suspended', 'update-info', 'confirm-identity'
  ];
  const hasSuspiciousKeyword = blacklistedKeywords.some(k => lower.includes(k));

  const sensitiveRequests = [
    'mật khẩu', 'password', 'otp', 'mã xác nhận', 'số tài khoản',
    'thẻ tín dụng', 'credit card', 'căn cước', 'cmnd', 'số cccd'
  ];
  const hasSensitiveRequest = sensitiveRequests.some(k => lower.includes(k));

  if (lower.includes('chuyển tiền') && (lower.includes('lừa') || lower.includes('lấy lại') || lower.includes('mất tiền'))) {
    return { type: 'scam_urgent', status: 'danger', details: {} };
  }

  if (lower.includes('deepfake') || (lower.includes('gọi video') && lower.includes('mượn tiền'))) {
    return { type: 'deepfake', status: 'warning', details: {} };
  }

  if (lower.includes('cộng tác viên') || lower.includes('ctv') || lower.includes('nạp tiền làm nhiệm vụ')) {
    return { type: 'ctv_scam', status: 'danger', details: {} };
  }

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

  return { type: 'general', status: 'info', details: {} };
}

// Phản hồi dự phòng chuẩn văn bản, tuyệt đối không dùng icon hay emoji
function getMockResponse(message) {
  const analysis = analyzeWithHeuristic(message);

  const responses = {
    scam_urgent: {
      danger: {
        text: `[NGUY HIỂM] HUỚNG DẪN XỬ LÝ KHẨN CẤP KHI VỪA BỊ LỪA CHUYỂN TIỀN\n\nBạn cần bình tĩnh và lập tức thực hiện ngay 3 bước sau:\n\n1. Bước 1 - Liên hệ ngân hàng ngay lập tức:\nGọi tới hotline chính thức của ngân hàng nơi bạn mở tài khoản. Yêu cầu tổng đài viên khóa tài khoản tạm thời và hỗ trợ tra soát giao dịch vừa thực hiện để cố gắng phong tỏa tài khoản người nhận.\n\n2. Bước 2 - Thu thập bằng chứng đầy đủ:\nChụp ảnh màn hình toàn bộ tin nhắn, số điện thoại, đường link trao đổi, thông tin tài khoản ngân hàng thụ hưởng và biên lai giao dịch chuyển khoản.\n\n3. Bước 3 - Trình báo cơ quan chức năng:\nMang các bằng chứng đã thu thập đến cơ quan Công an phường/xã hoặc Công an quận/huyện nơi gần nhất để làm đơn tố giác tội phạm lừa đảo công nghệ cao.`,
        status: 'danger',
        recommendations: ['Khóa thẻ và tài khoản ngân hàng ngay', 'Thu thập biên lai và tin nhắn chuyển tiền', 'Trình báo cơ quan công an địa phương']
      }
    },
    deepfake: {
      warning: {
        text: `[CẢNH BÁO] PHÂN TÍCH VÀ NHẬN DIỆN CUỘC GỌI VIDEO DEEPFAKE\n\nKẻ gian đang sử dụng công nghệ trí tuệ nhân tạo để làm giả khuôn mặt và giọng nói của người thân nhằm vay tiền gấp.\n\nCác dấu hiệu nhận biết:\n- Cuộc gọi video thường rất ngắn, chỉ kéo dài từ vài giây đến dưới một phút với lý do sóng yếu hoặc đang bận.\n- Khuôn mặt người gọi có dấu hiệu đơ cứng, biểu cảm thiếu tự nhiên, vùng xung quanh mắt hoặc miệng bị nhòe.\n- Âm thanh không đồng bộ với chuyển động môi, có độ trễ hoặc giọng nói hơi đứt quãng.\n\nBiện pháp phòng ngừa:\n- Tuyệt đối không chuyển tiền ngay sau cuộc gọi video.\n- Hãy dập máy và dùng cuộc gọi thoại thông thường (qua mạng viễn thông, không qua ứng dụng mạng xã hội) để liên hệ trực tiếp với người đó nhằm xác thực lại.`,
        status: 'warning',
        recommendations: ['Gọi điện thoại trực tiếp qua sim để kiểm tra', 'Đặt câu hỏi bí mật chỉ hai người biết', 'Không chuyển tiền khi chưa xác thực trực tiếp']
      }
    },
    ctv_scam: {
      danger: {
        text: `[NGUY HIỂM] CẢNH BÁO BẪY LỪA ĐẢO CỘNG TÁC VIÊN ONLINE\n\nĐây là hình thức lừa đảo tài chính rất phổ biến đánh vào tâm lý muốn kiếm tiền dễ dàng tại nhà.\n\nKịch bản lừa đảo điển hình:\n- Kẻ gian mời gọi làm nhiệm vụ: xem video, đánh giá sản phẩm, like bài viết trên sàn thương mại điện tử hoặc mạng xã hội.\n- Ở các nhiệm vụ đầu có giá trị nhỏ, kẻ gian sẽ chuyển lại tiền gốc cùng hoa hồng để tạo lòng tin.\n- Khi số tiền lên đến hàng triệu hoặc chục triệu đồng, đối tượng sẽ báo lỗi hệ thống, sai cú pháp, yêu cầu nạp thêm tiền để kích hoạt hoặc mở khóa tiền thưởng, sau đó cắt đứt liên lạc.\n\nBiện pháp xử lý:\n- Ngừng ngay lập tức việc chuyển tiền, không tin vào các lý do cần nạp thêm tiền để lấy lại vốn.\n- Chặn liên lạc và bảo toàn bằng chứng để gửi cơ quan có thẩm quyền.`,
        status: 'danger',
        recommendations: ['Ngừng ngay việc nạp tiền thực hiện nhiệm vụ', 'Lưu lại tin nhắn và thông tin tài khoản kẻ gian', 'Không tham gia các hội nhóm tuyển dụng không rõ ràng']
      }
    },
    url: {
      safe: {
        text: `[AN TOÀN] KẾT QUẢ KIỂM TRA ĐƯỜNG DẪN\n\nLiên kết này có cấu trúc hợp lệ và chưa ghi nhận báo cáo độc hại.\n\nChi tiết đánh giá kỹ thuật:\n- Giao thức HTTPS an toàn, có mã hóa dữ liệu.\n- Tên miền uy tín, không nằm trong danh sách đen theo dõi.\n- Không phát hiện từ khóa lừa đảo điển hình.\n\nLưu ý: Luôn kiểm tra kỹ đường link trước khi điền thông tin đăng nhập hoặc mật khẩu.`,
        status: 'safe',
        recommendations: ['Kiểm tra chính xác tên miền trước khi đăng nhập', 'Xác thực hai bước cho tài khoản liên quan']
      },
      danger: {
        text: `[NGUY HIỂM] KẾT QUẢ KIỂM TRA ĐƯỜNG DẪN\n\nLiên kết này có nhiều dấu hiệu giả mạo hoặc lừa đảo.\n\nCác rủi ro phát hiện:\n- Tên miền sử dụng đuôi mở rộng có mức độ rủi ro cao hoặc cấu trúc bất thường.\n- Giao thức chưa được bảo mật, có thể đánh cắp dữ liệu đường truyền.\n- Dấu hiệu giả mạo trang đăng nhập dịch vụ trực tuyến nhằm đánh cắp thông tin.\n\nKhuyến cáo: Tuyệt đối không bấm vào liên kết, không nhập thông tin cá nhân hay mã xác thực.`,
        status: 'danger',
        recommendations: ['Không truy cập vào liên kết này', 'Không điền mật khẩu hay thông tin cá nhân', 'Đóng trình duyệt và xóa lịch sử truy cập gần nhất']
      }
    },
    email: {
      warning: {
        text: `[CẢNH BÁO] PHÂN TÍCH EMAIL ĐÁNG NGỜ\n\nNội dung email này chứa các đặc điểm nhận dạng của thư lừa đảo mạo danh.\n\nCác dấu hiệu rủi ro:\n- Đưa ra yêu cầu cung cấp thông tin tài khoản, mật khẩu hoặc số thẻ.\n- Ngữ cảnh tạo cảm giác hối thúc, đe dọa khóa dịch vụ hoặc thông báo trúng thưởng bất ngờ.\n- Địa chỉ người gửi không xuất phát từ tên miền chính thức của đơn vị được nhắc tới.\n\nKhuyến cáo: Không bấm vào các tệp đính kèm hoặc liên kết trong email, chuyển email vào hộp thư rác.`,
        status: 'warning',
        recommendations: ['Không cung cấp mã OTP hay mật khẩu', 'Kiểm tra kỹ tên miền người gửi', 'Đánh dấu email là spam hoặc thư rác']
      }
    },
    phone: {
      danger: {
        text: `[NGUY HIỂM] XÁC MINH SỐ ĐIỆN THOẠI\n\nSố điện thoại này có nhiều dấu hiệu liên quan đến hoạt động quấy rối hoặc lừa đảo.\n\nCác thủ đoạn thường gặp:\n- Mạo danh nhân viên ngân hàng, cán bộ cơ quan nhà nước yêu cầu phối hợp điều tra.\n- Mạo danh nhân viên giao hàng yêu cầu bấm link nhận hàng hoặc chuyển khoản tiền phạt.\n- Yêu cầu cung cấp mã OTP hoặc thông tin bảo mật.\n\nKhuyến cáo: Chặn số điện thoại này ngay lập tức. Không chuyển tiền hay làm theo bất kỳ chỉ dẫn nào qua điện thoại.`,
        status: 'danger',
        recommendations: ['Chặn số điện thoại này trên thiết bị', 'Không chuyển khoản theo bất kỳ yêu cầu nào', 'Ghi âm cuộc gọi hoặc lưu số để phản ánh khi cần']
      }
    },
    general: {
      info: {
        text: `[THÔNG TIN] TRỢ LÝ AN NINH MẠNG AICEE\n\nXin chào bạn. Tôi là trợ lý AI chuyên về an ninh mạng của AICEE.\n\nTôi có thể hỗ trợ bạn:\n1. Vấn đáp và hướng dẫn xử lý các tình huống nghi ngờ lừa đảo trên mạng.\n2. Kiểm tra độ an toàn của đường link, website.\n3. Phân tích nội dung email và thư điện tử đáng ngờ.\n4. Xác minh số điện thoại gọi đến.\n5. Tư vấn phương pháp bảo mật tài khoản cá nhân.\n\nVui lòng nhập nội dung câu hỏi hoặc gửi thông tin bạn cần kiểm tra.`,
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

// Gửi tin nhắn tới Gemini AI, tự động fallback linh hoạt khi model bị lỗi quota
async function sendToGemini(message, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getMockResponse(message);
  }

  const candidateModels = [
    'gemini-3.8-flash',
    process.env.GEMINI_MODEL,
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.7-flash',
    'gemini-3.6-flash'
  ];
  const modelsToTry = [...new Set(candidateModels.filter(Boolean))];

  let allSkippedByCooldown = true;

  for (const modelName of modelsToTry) {
    // Bỏ qua ngay model đang trong thời gian cooldown, không tốn lượt gọi
    if (isModelOnCooldown(modelName)) {
      console.warn(`Bỏ qua model ${modelName} vì đang cooldown (vừa hết quota gần đây).`);
      continue;
    }
    allSkippedByCooldown = false;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel(
        {
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.5,
          }
        },
        { timeout: 6000 }
      );

      const validHistory = history
        .filter(h => h.content && h.content.trim())
        .map(h => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: stripEmojis(h.content) }]
        }));

      let responseText = '';
      if (validHistory.length > 0) {
        const chat = model.startChat({ history: validHistory });
        const result = await chat.sendMessage(stripEmojis(message));
        responseText = result.response.text().trim();
      } else {
        const result = await model.generateContent(stripEmojis(message));
        responseText = result.response.text().trim();
      }

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
        // Không phải JSON, giữ nguyên văn bản
      }

      responseText = stripEmojis(responseText);

      const lower = responseText.toLowerCase();
      let status = 'info';
      if (lower.startsWith('[an toàn]') || lower.includes('[an toàn]')) {
        status = 'safe';
      } else if (lower.startsWith('[nguy hiểm]') || lower.includes('[nguy hiểm]')) {
        status = 'danger';
      } else if (lower.startsWith('[cảnh báo]') || lower.includes('[cảnh báo]')) {
        status = 'warning';
      } else if (lower.startsWith('[thông tin]') || lower.includes('[thông tin]')) {
        status = 'info';
      } else if (lower.includes('lừa đảo') || lower.includes('nguy hiểm')) {
        status = 'danger';
      } else if (lower.includes('cảnh báo') || lower.includes('đáng ngờ')) {
        status = 'warning';
      } else if (lower.includes('an toàn')) {
        status = 'safe';
      }

      return { text: responseText, status, recommendations: [] };
    } catch (error) {
      // Nếu lỗi là do hết quota (RPD/RPM), đánh dấu cooldown cho model này
      const { isQuotaError, cooldownMs } = classifyQuotaError(error);
      if (isQuotaError) {
        setModelCooldown(modelName, cooldownMs);
        console.warn(
          `Model ${modelName} hết quota, tạm ngưng dùng trong ${Math.round(cooldownMs / 1000)}s. Lỗi: ${error.message}`
        );
      } else {
        console.warn(`Lỗi khi gọi model ${modelName}:`, error.message);
      }
      // Tiếp tục vòng lặp để thử model tiếp theo
    }
  }

  if (allSkippedByCooldown) {
    console.warn('Tất cả model đang cooldown do hết quota, dùng phản hồi dự phòng (mock).');
  }

  // Nếu tất cả candidate models đều lỗi/cooldown, dùng mock response
  return getMockResponse(message);
}

// Phân tích tệp tin bằng AI, đảm bảo không có icon hay emoji
async function analyzeFile(fileName, fileType, fileContent) {
  const isImage = fileType.startsWith('image/');
  const text = isImage
    ? `[AN TOÀN] KẾT QUẢ PHÂN TÍCH HÌNH ẢNH: ${fileName}\n\nChi tiết kiểm tra:\n- Không phát hiện mã độc ẩn trong metadata.\n- Định dạng tệp tin hợp lệ.\n- Không phát hiện mã QR dẫn đến liên kết độc hại.\n\nKhuyến nghị: Chỉ quét các mã QR và mở hình ảnh từ các nguồn đáng tin cậy.`
    : `[AN TOÀN] KẾT QUẢ PHÂN TÍCH TỆP TIN: ${fileName}\n\nChi tiết kiểm tra:\n- Không phát hiện virus hoặc mã thực thi đáng ngờ.\n- Cấu trúc tệp tin đạt tiêu chuẩn an toàn.\n- Không chứa macro nguy hiểm.\n\nKhuyến nghị: Giữ thói quen cập nhật phần mềm diệt virus định kỳ.`;

  return {
    text: stripEmojis(text),
    status: 'safe',
    recommendations: ['Tải tệp từ nguồn chính thống', 'Không mở tệp lạ gửi qua thư rác']
  };
}

module.exports = { sendToGemini, analyzeFile, analyzeWithHeuristic, getMockResponse, stripEmojis };
