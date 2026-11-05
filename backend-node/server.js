const dns = require('dns');
// Khắc phục lỗi querySrv ECONNREFUSED do DNS nhà mạng không phân giải được MongoDB Atlas SRV
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('DNS server override failed:', e.message);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');
const serverless = require('serverless-http');

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;

// ===== SECURITY MIDDLEWARE =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting - chống spam requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200, // Tối đa 200 request/15 phút
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Rate limit nghiêm hơn cho AI chat
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 30, // Tối đa 30 tin nhắn/phút
  message: {
    success: false,
    message: 'Gửi tin nhắn quá nhanh. Vui lòng đợi một chút.'
  }
});

// ===== CORS =====
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ===== BODY PARSER =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== STATIC FILES =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== REQUEST LOGGING =====
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===== IMPORT ROUTES =====
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const scanRoutes = require('./routes/scan');
const newsRoutes = require('./routes/news');
const uploadRoutes = require('./routes/upload');
const resourcesRoutes = require('./routes/resources');
const adminRoutes = require('./routes/admin');
const subscriptionRoutes = require('./routes/subscription');
const reportRoutes = require('./routes/reports');
const paymentRoutes = require('./routes/payment');
const quizRoutes = require('./routes/quiz');

// ===== MOUNT ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/quiz', quizRoutes);

// ===== ROOT ENDPOINT =====
app.get('/', (req, res) => {
  res.json({
    name: 'AICEE Backend API',
    version: '1.0.0',
    description: 'API bảo vệ an ninh mạng thông minh',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      chat: '/api/chat',
      scan: '/api/scan',
      news: '/api/news',
      upload: '/api/upload',
      health: '/api/health'
    }
  });
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    geminiEnabled: !!process.env.GEMINI_API_KEY,
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  });
});

// ===== QUICK SCAN SHORTCUT =====
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'AICEE Backend Node.js đang hoạt động tốt',
    version: '1.0.0'
  });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint '${req.method} ${req.path}' không tồn tại`
  });
});

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi server không xác định',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===== START SERVER / EXPORT FOR NETLIFY =====
// Nếu có MONGODB_URI thì kết nối kèm cơ chế tự động thử lại (Retry)
if (process.env.MONGODB_URI) {
  const connectDBWithRetry = async (retries = 5) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ MongoDB Connected');

        // Seed Admin user
        const { UserModel } = require('./models/User');
        const bcrypt = require('bcryptjs');
        const adminCount = await UserModel.countDocuments({ role: 'admin' });
        if (adminCount === 0) {
          console.log('🔄 Đang khởi tạo tài khoản Admin mặc định...');
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('admin123', salt);
          await UserModel.create({
            email: 'admin@aicee.com',
            name: 'Quản trị viên',
            password: hashedPassword,
            role: 'admin'
          });
          console.log('✅ Đã tạo tài khoản Admin (admin@aicee.com / admin123)');
        }

        // Seed dữ liệu mẫu cho resources nếu chưa có
        const Resource = require('./models/Resource');
        const count = await Resource.countDocuments();
        if (count === 0) {
          console.log('🔄 Đang khởi tạo dữ liệu mẫu cho danh sách an toàn/không an toàn...');
          const initialData = [
            // Safe List
            { isSafe: true, type: 'Tổ chức', name: 'Cổng Dịch vụ công Quốc gia', address: 'dichvucong.gov.vn', description: 'Chính phủ' },
            { isSafe: true, type: 'Tổ chức', name: 'Bộ Thông tin và Truyền thông', address: 'mic.gov.vn', description: 'Chính phủ' },
            { isSafe: true, type: 'Tổ chức', name: 'Ngân hàng Vietcombank', address: 'vietcombank.com.vn', description: 'Tài chính' },
            { isSafe: true, type: 'Tổ chức', name: 'Tổng cục Thuế', address: 'gdt.gov.vn', description: 'Chính phủ' },
            { isSafe: true, type: 'Tổ chức', name: 'Tập đoàn Điện lực Việt Nam', address: 'evn.com.vn', description: 'Dịch vụ công' },
            { isSafe: true, type: 'Tổ chức', name: 'Công ty Cổ phần VNG', address: 'vng.com.vn', description: 'Công nghệ' },
            
            // Unsafe List
            { isSafe: false, type: 'Website', address: 'kiemtiennhanh24h.xyz', description: 'Lừa đảo đầu tư, Ponzi' },
            { isSafe: false, type: 'Email', address: 'support-bink@gmail.com', description: 'Giả danh ngân hàng (Phishing)' },
            { isSafe: false, type: 'SĐT', address: '0987.xxx.999', description: 'Giả mạo công an yêu cầu chuyển tiền' },
            { isSafe: false, type: 'Website', address: 'nhanqua-shopee.net', description: 'Lừa đảo lấy cắp tài khoản' },
            { isSafe: false, type: 'Email', address: 'trungthuong-apple@yahoo.com', description: 'Lừa đảo trúng thưởng' },
            { isSafe: false, type: 'SĐT', address: '0901.xxx.222', description: 'Quấy rối, đòi nợ thuê trái phép' }
          ];
          await Resource.insertMany(initialData);
          console.log('✅ Đã nạp dữ liệu mẫu cho danh sách thành công!');
        }

        // Seed dữ liệu mẫu cho Ngân hàng câu hỏi Quiz nếu chưa có
        const Quiz = require('./models/Quiz');
        const quizCount = await Quiz.countDocuments();
        if (quizCount === 0) {
          console.log('🔄 Đang khởi tạo dữ liệu mẫu cho Ngân hàng câu hỏi Quiz...');
          const initialQuizzes = [
            {
              title: 'Đường link "https://cskh.evnspc.vn/tra-cuu-tien-dien" trong tin nhắn báo tiền điện là website thật hay giả?',
              type: 'url',
              options: [
                { text: 'Đây là website THẬT chính thống', isCorrect: true },
                { text: 'Đây là website GIẢ MẠO lừa đảo', isCorrect: false }
              ],
              explanation: 'Website THẬT của Tổng công ty Điện lực Miền Nam có tên miền đuôi cấp 1 chính thức .vn (evnspc.vn) và sử dụng giao thức HTTPS bảo mật.',
              difficulty: 'easy',
              status: 'published'
            },
            {
              title: 'Tin nhắn gửi kèm link "http://baohiemxahoi-vietnam.online/nhan-tro-cap" yêu cầu đăng nhập nhận tiền an sinh. Đây là thật hay giả?',
              type: 'url',
              options: [
                { text: 'Website chính thống của Bảo hiểm xã hội', isCorrect: false },
                { text: 'Website giả mạo đánh cắp thông tin cá nhân', isCorrect: true }
              ],
              explanation: 'Cổng thông tin BHXH Việt Nam chỉ sử dụng tên miền đuôi .gov.vn (baohiemxahoi.gov.vn), không bao giờ dùng đuôi .online hoặc giao thức http không bảo mật.',
              difficulty: 'easy',
              status: 'published'
            },
            {
              title: 'Website "https://vietcombank.com.vn-xacthuc-khachhang.cc" yêu cầu cập nhật sinh trắc học trước 24h nếu không sẽ bị khóa thẻ.',
              type: 'url',
              options: [
                { text: 'Website chính thức của ngân hàng Vietcombank', isCorrect: false },
                { text: 'Bẫy lừa đảo Phishing tinh vi (tên miền gốc thực chất là .cc)', isCorrect: true }
              ],
              explanation: 'Kẻ gian sử dụng kỹ thuật Subdomain để đưa chữ vietcombank vào đầu, nhưng tên miền gốc thực chất là .cc! Vietcombank chỉ dùng vietcombank.com.vn.',
              difficulty: 'medium',
              status: 'published'
            },
            {
              title: 'Email từ "Techcombank Support <security-alert@techcom-security.net>" thông báo tài khoản bị khóa và đòi nhập mã OTP.',
              type: 'email',
              options: [
                { text: 'Email chính thức từ ngân hàng Techcombank', isCorrect: false },
                { text: 'Email lừa đảo nguy hiểm nhằm đánh cắp mã OTP', isCorrect: true }
              ],
              explanation: 'Ngân hàng Techcombank không bao giờ gửi email từ đuôi lạ @techcom-security.net và không bao giờ yêu cầu khách hàng cung cấp OTP qua đường link.',
              difficulty: 'easy',
              status: 'published'
            },
            {
              title: 'Email từ "Google Security <no-reply@accounts.google.com>" thông báo có thiết bị mới vừa đăng nhập vào tài khoản của bạn.',
              type: 'email',
              options: [
                { text: 'Email chính hãng từ hệ thống bảo mật Google', isCorrect: true },
                { text: 'Email giả mạo lừa đảo', isCorrect: false }
              ],
              explanation: 'Email chính hãng được gửi trực tiếp từ @accounts.google.com để cảnh báo sự kiện đăng nhập thông thường, không đòi hỏi mật khẩu hay OTP.',
              difficulty: 'medium',
              status: 'published'
            },
            {
              title: 'Người tự xưng cán bộ điều tra gọi điện yêu cầu chuyển tiền vào "Tài khoản bảo chứng" để chứng minh vô tội.',
              type: 'scenario',
              options: [
                { text: 'Chuyển tiền ngay để chứng minh mình trong sạch', isCorrect: false },
                { text: 'Tuyệt đối không chuyển tiền, cúp máy và báo cơ quan công an', isCorrect: true },
                { text: 'Nhờ người thân vay tiền chuyển giúp', isCorrect: false }
              ],
              explanation: 'Cơ quan Công an, Viện kiểm sát KHÔNG BAO GIỜ làm việc qua điện thoại và tuyệt đối KHÔNG có "Tài khoản bảo chứng" yêu cầu công dân nạp tiền.',
              difficulty: 'easy',
              status: 'published'
            },
            {
              title: 'Tin nhắn mời làm cộng tác viên online xử lý đơn hàng Shopee kiếm hoa hồng 20-30% mỗi ngày.',
              type: 'scenario',
              options: [
                { text: 'Cảnh giác, chặn liên hệ vì đây là bẫy lừa đảo cọc tiền làm nhiệm vụ', isCorrect: true },
                { text: 'Tham gia ngay vì việc nhẹ lương cao, kiếm tiền dễ dàng', isCorrect: false },
                { text: 'Chuyển thử vài triệu xem có rút được tiền thật không', isCorrect: false }
              ],
              explanation: 'Thủ đoạn lừa đảo việc làm thường trả vài chục ngàn cho các nhiệm vụ đầu, sau đó yêu cầu nạp hàng triệu, hàng chục triệu rồi khóa tài khoản chiếm đoạt tiền.',
              difficulty: 'medium',
              status: 'published'
            }
          ];
          await Quiz.insertMany(initialQuizzes);
          console.log(`✅ Đã nạp thành công ${initialQuizzes.length} câu hỏi mẫu vào Ngân hàng Quiz!`);
        }
        return;
      } catch (err) {
        console.error(`❌ MongoDB Attempt ${attempt}/${retries} Error:`, err.message);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    }
  };
  connectDBWithRetry();
} else {
  console.log('⚠️  Chưa cấu hình MONGODB_URI. Server sẽ chạy nhưng không lưu được dữ liệu!');
}

// Chạy local hoặc deploy Render (Standalone server)
if (process.env.NODE_ENV !== 'serverless') {
  app.listen(PORT, () => {
  console.log('\n======================================');
  console.log('  🛡️  AICEE Backend API Started!');
  console.log('======================================');
  console.log(`  🌐 URL:        http://localhost:${PORT}`);
  console.log(`  🤖 AI:         ${process.env.GEMINI_API_KEY ? '✅ Gemini Connected' : '⚠️  Mock Mode (add GEMINI_API_KEY)'}`);
  console.log(`  📡 CORS:       ${process.env.CORS_ORIGIN || '*'}`);
  console.log('--------------------------------------');
  console.log('  📌 Endpoints:');
  console.log(`     POST  /api/auth/register`);
  console.log(`     POST  /api/auth/login`);
  console.log(`     GET   /api/auth/me`);
  console.log(`     POST  /api/chat`);
  console.log(`     POST  /api/scan/url`);
  console.log(`     POST  /api/scan/email`);
  console.log(`     POST  /api/scan/phone`);
  console.log(`     POST  /api/scan/quick`);
  console.log(`     GET   /api/news`);
  console.log(`     GET   /api/news/:id`);
  console.log(`     POST  /api/news/subscribe`);
  console.log(`     POST  /api/upload`);
    console.log(`     GET   /api/health`);
    console.log('======================================\n');
  });
}

// Export cho Netlify Functions (Serverless)
module.exports.handler = serverless(app);
module.exports.app = app;
