const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');

// Dữ liệu tin tức mặc định
const DEFAULT_NEWS = [
  {
    id: '1',
    title: 'Cảnh báo hình thức lừa đảo chiếm đoạt tài khoản ngân hàng mới',
    excerpt: 'Gần đây xuất hiện nhiều thủ đoạn tinh vi giả danh cán bộ thuế, ngân hàng yêu cầu cài đặt ứng dụng giả mạo để đánh cắp thông tin và tiền trong tài khoản của nạn nhân.',
    content: 'Nội dung chi tiết về hình thức lừa đảo mới này...',
    date: '24/10/2023',
    category: 'Cảnh báo lừa đảo',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80',
    author: 'AICEE Security Team',
    views: 1250,
    tags: ['lừa đảo', 'ngân hàng', 'phishing']
  },
  {
    id: '2',
    title: 'AICEE ra mắt tính năng AI Tư vấn an toàn thông tin 24/7',
    excerpt: 'Người dùng hiện có thể trò chuyện trực tiếp với AI để nhận diện các đường link đáng ngờ, tin nhắn lừa đảo và cách xử lý kịp thời mà không cần chờ đợi.',
    content: 'AICEE tự hào giới thiệu tính năng AI Chatbot hoạt động 24/7...',
    date: '20/10/2023',
    category: 'Cập nhật sản phẩm',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    author: 'AICEE Team',
    views: 980,
    tags: ['AI', 'tính năng mới', 'bảo mật']
  },
  {
    id: '3',
    title: '5 Nguyên tắc vàng bảo mật thông tin cá nhân trên mạng xã hội',
    excerpt: 'Mạng xã hội tiềm ẩn nhiều rủi ro rò rỉ dữ liệu. Hãy áp dụng ngay 5 nguyên tắc này để bảo vệ bản thân và gia đình khỏi những mối nguy hiểm trực tuyến.',
    content: '5 nguyên tắc quan trọng để bảo vệ thông tin cá nhân...',
    date: '15/10/2023',
    category: 'Kiến thức an toàn',
    image: 'https://images.unsplash.com/photo-1614064641913-6b71a2161ca1?auto=format&fit=crop&w=800&q=80',
    author: 'AICEE Expert',
    views: 2100,
    tags: ['mạng xã hội', 'bảo mật', 'thông tin cá nhân']
  },
  {
    id: '4',
    title: 'Phát hiện chiến dịch tấn công Phishing nhắm vào người dùng crypto',
    excerpt: 'Hàng loạt email giả mạo các sàn giao dịch tiền điện tử lớn đang được phát tán nhằm đánh cắp private key của người dùng và chiếm đoạt tài sản.',
    content: 'Chiến dịch phishing quy mô lớn nhắm vào cộng đồng crypto...',
    date: '10/10/2023',
    category: 'Báo cáo bảo mật',
    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80',
    author: 'AICEE Research',
    views: 1670,
    tags: ['crypto', 'phishing', 'email lừa đảo']
  },
  {
    id: '5',
    title: 'Cảnh báo: Deepfake được dùng để lừa đảo qua video call',
    excerpt: 'Công nghệ Deepfake ngày càng tinh vi, tội phạm mạng đang sử dụng để giả mạo người thân, lãnh đạo doanh nghiệp trong các cuộc gọi video nhằm lừa chuyển tiền.',
    content: 'Deepfake đang trở thành công cụ lừa đảo nguy hiểm...',
    date: '05/10/2023',
    category: 'Cảnh báo mới',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    author: 'AICEE Security Team',
    views: 3400,
    tags: ['deepfake', 'video call', 'lừa đảo']
  },
  {
    id: '6',
    title: 'Hướng dẫn bật xác thực 2 yếu tố (2FA) cho tài khoản quan trọng',
    excerpt: 'Xác thực 2 yếu tố là lớp bảo mật bổ sung cực kỳ hiệu quả. Bài viết hướng dẫn chi tiết cách bật 2FA cho Gmail, Facebook, ngân hàng và các dịch vụ phổ biến.',
    content: 'Hướng dẫn từng bước bật xác thực 2 yếu tố...',
    date: '01/10/2023',
    category: 'Hướng dẫn',
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80',
    author: 'AICEE Expert',
    views: 4200,
    tags: ['2FA', 'bảo mật tài khoản', 'hướng dẫn']
  }
];

// Đảm bảo thư mục data tồn tại
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(NEWS_FILE)) {
    fs.writeFileSync(NEWS_FILE, JSON.stringify(DEFAULT_NEWS, null, 2));
  }
}

// Lấy tất cả tin tức
function getAllNews(page = 1, limit = 10, category = null) {
  ensureDataDir();
  let news = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));

  if (category) {
    news = news.filter(n => n.category === category);
  }

  const total = news.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedNews = news.slice(startIndex, endIndex);

  return {
    news: paginatedNews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// Lấy tin tức theo ID
function getNewsById(id) {
  ensureDataDir();
  const news = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
  const item = news.find(n => n.id === id);

  if (item) {
    // Tăng view count
    item.views = (item.views || 0) + 1;
    fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2));
  }

  return item || null;
}

// Lấy danh sách categories
function getCategories() {
  ensureDataDir();
  const news = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
  const categories = [...new Set(news.map(n => n.category))];
  return categories;
}

// Tìm kiếm tin tức
function searchNews(query) {
  ensureDataDir();
  const news = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
  const q = query.toLowerCase();
  return news.filter(n =>
    n.title.toLowerCase().includes(q) ||
    n.excerpt.toLowerCase().includes(q) ||
    (n.tags || []).some(t => t.toLowerCase().includes(q))
  );
}

// Lưu email đăng ký nhận bản tin
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');
function addSubscriber(email) {
  ensureDataDir();
  let subscribers = [];
  if (fs.existsSync(SUBSCRIBERS_FILE)) {
    subscribers = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
  }
  if (!subscribers.includes(email)) {
    subscribers.push(email);
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
    return true; // Mới đăng ký
  }
  return false; // Đã đăng ký rồi
}

module.exports = { getAllNews, getNewsById, getCategories, searchNews, addSubscriber };
