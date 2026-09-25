const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const mongoose = require('mongoose');
const serverless = require('serverless-http');

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

// ===== MOUNT ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscription', subscriptionRoutes);

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
// Nếu có MONGODB_URI thì kết nối, nếu không thì cảnh báo
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
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
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
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
