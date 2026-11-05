const { GoogleGenerativeAI } = require('@google/generative-ai');
const XLSX = require('xlsx');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GEMINI_QUIZ_MODEL = process.env.GEMINI_QUIZ_MODEL || 'gemini-3.6-flash';

/**
 * Prompt yêu cầu Gemini tạo câu hỏi trắc nghiệm an ninh mạng dạng JSON chuẩn
 */
function buildQuizPrompt(content, count = 2) {
  return `Bạn là chuyên gia an ninh mạng và đào tạo nhận thức phòng chống lừa đảo của nền tảng AICEE Việt Nam.

Nhiệm vụ của bạn:
Đọc kỹ nội dung bài viết/tình huống lừa đảo sau đây và tạo đúng ${count} câu hỏi trắc nghiệm thực hành để giúp người dùng nhận diện và phòng ngừa thủ đoạn này.

Nội dung nguồn:
"""
${content}
"""

Yêu cầu định dạng:
- Trả về DUY NHẤT một mảng JSON thuần túy (JSON Array). Tuyệt đối KHÔNG kèm giải thích hay chữ nào khác ngoài JSON.
- Mỗi phần tử trong mảng phải có cấu trúc chính xác sau:
[
  {
    "title": "Tên câu hỏi hoặc mô tả tình huống cụ thể (Ví dụ: Bạn nhận được cuộc gọi/tin nhắn/email...)",
    "type": "scenario",
    "options": [
      { "text": "Nội dung phương án A", "isCorrect": false },
      { "text": "Nội dung phương án B", "isCorrect": true },
      { "text": "Nội dung phương án C", "isCorrect": false },
      { "text": "Nội dung phương án D", "isCorrect": false }
    ],
    "explanation": "Giải thích chi tiết dấu hiệu nhận biết lừa đảo và cách xử lý an toàn.",
    "difficulty": "medium"
  }
]

Quy tắc biên soạn:
- Câu hỏi bám sát vào chiêu trò thực tế được mô tả trong bài viết (mạo danh, đe dọa, dụ dỗ hoa hồng, link giả mạo...).
- Phải có chính xác 1 phương án có isCorrect: true, các phương án còn lại là isCorrect: false.
- Mỗi câu hỏi nên có 4 phương án lựa chọn A, B, C, D rõ ràng, thực tế.
- Lời giải thích phải rõ ràng, mang tính giáo dục kỹ năng tự bảo vệ bản thân trên không gian mạng.`;
}

/**
 * Tạo câu hỏi trắc nghiệm tự động bằng Gemini AI từ nội dung văn bản / bài báo
 */
async function generateQuizWithAI(content, count = 2) {
  if (!content || !content.trim()) {
    throw new Error('Nội dung bài viết không được để trống');
  }

  // Fallback nếu không có API Key
  if (!GEMINI_API_KEY) {
    return getFallbackQuestions(content, count);
  }

  const prompt = buildQuizPrompt(content, count);
  const modelsToTry = [
    process.env.GEMINI_QUIZ_MODEL || 'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest'
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: modelName
      });

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();

      // Làm sạch markdown code block nếu có
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Kết quả AI trả về không phải là mảng câu hỏi JSON');
      }

      // Chuẩn hóa và validate dữ liệu
      return parsed.map((item, idx) => {
        const rawOpts = Array.isArray(item.options) ? item.options : [];
        const options = rawOpts.length >= 2
          ? rawOpts.map(opt => ({
              text: String(opt.text || '').trim(),
              isCorrect: Boolean(opt.isCorrect)
            }))
          : [
              { text: 'Phương án đúng', isCorrect: true },
              { text: 'Phương án sai', isCorrect: false }
            ];

        // Đảm bảo có ít nhất 1 đáp án đúng
        if (!options.some(o => o.isCorrect)) {
          options[0].isCorrect = true;
        }

        return {
          title: item.title || `Tình huống an ninh mạng số ${idx + 1}`,
          type: ['url', 'email', 'scenario', 'general'].includes(item.type) ? item.type : 'scenario',
          options,
          explanation: item.explanation || 'Hãy luôn kiểm tra kỹ nguồn gốc và không chia sẻ thông tin nhạy cảm.',
          difficulty: ['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : 'medium',
          status: 'published'
        };
      });
    } catch (err) {
      console.warn(`[Gemini Quiz] Model ${modelName} gặp lỗi:`, err.message);
      lastError = err;
    }
  }

  console.error('Tất cả các model Gemini đều không phản hồi, sử dụng bộ câu hỏi mẫu dự phòng:', lastError?.message);
  return getFallbackQuestions(content, count);
}

/**
 * Bộ câu hỏi mẫu dự phòng khi lỗi kết nối AI (Luôn đảm bảo trả về mảng câu hỏi hợp lệ)
 */
function getFallbackQuestions(content, count = 2) {
  const isJobScam = /tuyển dụng|việc làm|nhiệm vụ|hoa hồng|shopee|lazada|telegram/i.test(content);
  const isBankScam = /ngân hàng|chuyển tiền|mã otp|tài khoản|vneid|sinh trắc/i.test(content);

  const fallbackPool = [];

  if (isJobScam) {
    fallbackPool.push({
      title: 'Tình huống: Tin nhắn mời làm cộng tác viên online xử lý đơn hàng hoa hồng 20-30% trên Telegram',
      type: 'scenario',
      options: [
        { text: 'Tham gia ngay vì việc nhẹ kiếm tiền nhanh', isCorrect: false },
        { text: 'Cảnh giác, từ chối và chặn tin nhắn vì đây là thủ đoạn lừa đảo cọc tiền làm nhiệm vụ', isCorrect: true },
        { text: 'Chuyển một khoản tiền nhỏ trước để thử xem có hoàn tiền thật không', isCorrect: false },
        { text: 'Chia sẻ cho bạn bè cùng làm', isCorrect: false }
      ],
      explanation: 'Thủ đoạn lừa đảo tuyển dụng thường hứa hẹn hoa hồng rất cao, ban đầu trả tiền vài đơn nhỏ để tạo lòng tin, sau đó yêu cầu nạp số tiền lớn và chiếm đoạt toàn bộ.',
      difficulty: 'medium',
      status: 'published'
    });
  }

  if (isBankScam) {
    fallbackPool.push({
      title: 'Tình huống: Người tự xưng cán bộ yêu cầu cung cấp mã OTP để hỗ trợ cập nhật định danh / sinh trắc học',
      type: 'scenario',
      options: [
        { text: 'Cung cấp ngay vì người gọi xưng là cơ quan chức năng', isCorrect: false },
        { text: 'Tuyệt đối không cung cấp OTP và liên hệ trực tiếp cơ quan công an địa phương để xác minh', isCorrect: true },
        { text: 'Đọc mã OTP nếu người gọi biết chính xác số CCCD của bạn', isCorrect: false },
        { text: 'Chụp màn hình tin nhắn OTP gửi qua Zalo', isCorrect: false }
      ],
      explanation: 'Không có bất kỳ cơ quan công an, thuế hay ngân hàng nào yêu cầu công dân cung cấp mã OTP qua điện thoại.',
      difficulty: 'easy',
      status: 'published'
    });
  }

  // Luôn bổ sung câu hỏi tình huống chung nếu chưa đủ số lượng
  const generalQuestions = [
    {
      title: 'Tình huống: Nhận được tin nhắn thông báo tài khoản có biến động hoặc trúng thưởng kèm đường link lạ',
      type: 'url',
      options: [
        { text: 'Bấm vào link ngay để kiểm tra thông tin', isCorrect: false },
        { text: 'Tuyệt đối không bấm vào link, mở app chính thống để kiểm tra', isCorrect: true },
        { text: 'Chuyển tiếp tin nhắn cho người khác hỏi ý kiến', isCorrect: false },
        { text: 'Gọi lại trực tiếp vào số điện thoại gửi link', isCorrect: false }
      ],
      explanation: 'Đường link trong tin nhắn rác thường là bẫy Phishing giả mạo giao diện ngân hàng để đánh cắp tên đăng nhập và mật khẩu.',
      difficulty: 'easy',
      status: 'published'
    },
    {
      title: 'Dấu hiệu nhận biết rõ ràng nhất của một vụ lừa đảo qua mạng là gì?',
      type: 'scenario',
      options: [
        { text: 'Hối thúc người dùng chuyển tiền hoặc cung cấp OTP trong thời gian gấp gáp', isCorrect: true },
        { text: 'Giao diện trang web có màu sắc đẹp mắt', isCorrect: false },
        { text: 'Yêu cầu gặp mặt trực tiếp tại trụ sở công ty', isCorrect: false },
        { text: 'Gửi hợp đồng có dấu mộc đỏ qua bưu điện', isCorrect: false }
      ],
      explanation: 'Kẻ lừa đảo luôn tạo tâm lý hoang mang, sợ hãi hoặc hám lợi để ép nạn nhân hành động vội vàng mà không kịp suy nghĩ hay tham vấn người thân.',
      difficulty: 'medium',
      status: 'published'
    }
  ];

  const merged = [...fallbackPool, ...generalQuestions];
  return merged.slice(0, Math.max(count, 1));
}

/**
 * Xuất danh sách câu hỏi ra Buffer file Excel (.xlsx) theo chuẩn Kahoot
 */
function exportToExcel(questions) {
  const rows = questions.map((q, idx) => {
    // Nếu item đã là dạng row phẳng
    if (q['Tình huống / Câu hỏi'] || q['Câu hỏi']) {
      return {
        'STT': idx + 1,
        'Tình huống / Câu hỏi': q['Tình huống / Câu hỏi'] || q['Câu hỏi'] || '',
        'Phương án 1': q['Phương án 1'] || '',
        'Phương án 2': q['Phương án 2'] || '',
        'Phương án 3': q['Phương án 3'] || '',
        'Phương án 4': q['Phương án 4'] || '',
        'Đáp án đúng (1-4)': q['Đáp án đúng (1-4)'] || q['Đáp án đúng'] || 1,
        'Giải thích chi tiết': q['Giải thích chi tiết'] || q['Giải thích'] || '',
        'Thể loại': q['Thể loại'] || 'scenario',
        'Độ khó': q['Độ khó'] || 'medium'
      };
    }

    // Dạng question object chuẩn
    let correctNumber = 1;
    if (Array.isArray(q.options)) {
      const foundIdx = q.options.findIndex(o => o.isCorrect);
      if (foundIdx !== -1) correctNumber = foundIdx + 1;
    }

    return {
      'STT': idx + 1,
      'Tình huống / Câu hỏi': q.title || '',
      'Phương án 1': q.options?.[0]?.text || '',
      'Phương án 2': q.options?.[1]?.text || '',
      'Phương án 3': q.options?.[2]?.text || '',
      'Phương án 4': q.options?.[3]?.text || '',
      'Đáp án đúng (1-4)': correctNumber,
      'Giải thích chi tiết': q.explanation || '',
      'Thể loại': q.type || 'scenario',
      'Độ khó': q.difficulty || 'medium'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Căn chỉnh độ rộng các cột cho đẹp
  worksheet['!cols'] = [
    { wch: 6 },   // STT
    { wch: 45 },  // Tình huống / Câu hỏi
    { wch: 25 },  // Phương án 1
    { wch: 25 },  // Phương án 2
    { wch: 25 },  // Phương án 3
    { wch: 25 },  // Phương án 4
    { wch: 18 },  // Đáp án đúng
    { wch: 45 },  // Giải thích
    { wch: 14 },  // Thể loại
    { wch: 12 },  // Độ khó
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ngân Hàng Quiz AICEE');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Tạo file Excel mẫu (Template) chuẩn để Admin tải về soạn thảo
 */
function getTemplateBuffer() {
  const sampleQuestions = [
    {
      title: 'Website "https://vietcombank.com.vn-xacthuc.cc" có phải website thật của ngân hàng không?',
      options: [
        { text: 'Đúng, là website của ngân hàng Vietcombank', isCorrect: false },
        { text: 'Sai, đây là website giả mạo tên miền .cc lừa đảo', isCorrect: true }
      ],
      explanation: 'Tên miền gốc thực chất là .cc, phần vietcombank chỉ là subdomain kẻ gian đặt để đánh lừa mắt.',
      type: 'url',
      difficulty: 'medium'
    },
    {
      title: 'Email từ "support@shopee-khuyenmai.online" yêu cầu xác nhận đơn hàng nhận thưởng 5 triệu. Bạn nên làm gì?',
      options: [
        { text: 'Bấm vào liên kết và điền thông tin tài khoản ngân hàng để nhận tiền', isCorrect: false },
        { text: 'Bỏ qua, không click vào link và vào app Shopee chính thức kiểm tra', isCorrect: true },
        { text: 'Chuyển tiếp cho bạn bè cùng nhận thưởng', isCorrect: false },
        { text: 'Gọi lại số điện thoại ghi trong email để hỏi', isCorrect: false }
      ],
      explanation: 'Shopee chỉ dùng email @shopee.vn hoặc @shopee.com, tuyệt đối không dùng đuôi .online.',
      type: 'email',
      difficulty: 'easy'
    }
  ];

  return exportToExcel(sampleQuestions);
}

/**
 * Phân tích (Parse) dữ liệu từ Buffer file Excel tải lên
 */
function parseExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('File Excel rỗng, không tìm thấy Sheet nào');
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  if (!rows || rows.length === 0) {
    throw new Error('Không tìm thấy dữ liệu dòng nào trong file Excel');
  }

  const questions = [];
  const errors = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // Dòng 1 là tiêu đề
    const title = (row['Tình huống / Câu hỏi'] || row['Câu hỏi'] || row['Question'] || '').toString().trim();

    if (!title) {
      errors.push(`Dòng ${rowNum}: Thiếu nội dung câu hỏi`);
      return;
    }

    const opt1 = (row['Phương án 1'] || row['Option 1'] || '').toString().trim();
    const opt2 = (row['Phương án 2'] || row['Option 2'] || '').toString().trim();
    const opt3 = (row['Phương án 3'] || row['Option 3'] || '').toString().trim();
    const opt4 = (row['Phương án 4'] || row['Option 4'] || '').toString().trim();

    if (!opt1 || !opt2) {
      errors.push(`Dòng ${rowNum}: Cần tối thiểu 2 phương án lựa chọn (Phương án 1 và 2)`);
      return;
    }

    const correctRaw = parseInt(row['Đáp án đúng (1-4)'] || row['Đáp án đúng'] || row['Correct'] || '1', 10);
    const correctIdx = (!isNaN(correctRaw) && correctRaw >= 1 && correctRaw <= 4) ? correctRaw : 1;

    const rawOptions = [opt1, opt2, opt3, opt4].filter(Boolean);
    const options = rawOptions.map((text, oIdx) => ({
      text,
      isCorrect: (oIdx + 1) === correctIdx
    }));

    // Đảm bảo có ít nhất 1 đáp án đúng
    if (!options.some(o => o.isCorrect)) {
      options[0].isCorrect = true;
    }

    const explanation = (row['Giải thích chi tiết'] || row['Giải thích'] || row['Explanation'] || '').toString().trim();
    const rawType = (row['Thể loại'] || row['Type'] || 'scenario').toString().toLowerCase().trim();
    const type = ['url', 'email', 'scenario', 'general'].includes(rawType) ? rawType : 'scenario';
    
    const rawDiff = (row['Độ khó'] || row['Difficulty'] || 'medium').toString().toLowerCase().trim();
    const difficulty = ['easy', 'medium', 'hard'].includes(rawDiff) ? rawDiff : 'medium';

    questions.push({
      title,
      type,
      options,
      explanation,
      difficulty,
      status: 'published'
    });
  });

  return { questions, errors };
}

module.exports = {
  generateQuizWithAI,
  exportToExcel,
  getTemplateBuffer,
  parseExcelBuffer
};
