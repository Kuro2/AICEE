const NewsModel = require('../models/News');
const SubscriberModel = require('../models/Subscriber');

// Dữ liệu mẫu (chỉ dùng để seed nếu db trống)
const DEFAULT_NEWS = [
  {
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
    title: '5 Nguyên tắc vàng bảo mật thông tin cá nhân trên mạng xã hội',
    excerpt: 'Mạng xã hội tiềm ẩn nhiều rủi ro rò rỉ dữ liệu. Hãy áp dụng ngay 5 nguyên tắc này để bảo vệ bản thân và gia đình khỏi những mối nguy hiểm trực tuyến.',
    content: '5 nguyên tắc quan trọng để bảo vệ thông tin cá nhân...',
    date: '15/10/2023',
    category: 'Kiến thức an toàn',
    image: 'https://images.unsplash.com/photo-1614064641913-6b71a2161ca1?auto=format&fit=crop&w=800&q=80',
    author: 'AICEE Expert',
    views: 2100,
    tags: ['mạng xã hội', 'bảo mật', 'thông tin cá nhân']
  }
];

// Seed data nếu DB trống
async function seedNewsIfEmpty() {
  const count = await NewsModel.countDocuments();
  if (count === 0) {
    await NewsModel.insertMany(DEFAULT_NEWS);
    console.log('Seeded default news into database.');
  }
}

// Lấy tất cả tin tức
async function getAllNews(page = 1, limit = 10, category = null) {
  await seedNewsIfEmpty();
  const query = category ? { category } : {};
  const total = await NewsModel.countDocuments(query);
  const skip = (page - 1) * limit;

  const news = await NewsModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

  return {
    news,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// Lấy tin tức theo ID
async function getNewsById(id) {
  try {
    const item = await NewsModel.findById(id);
    if (item) {
      item.views = (item.views || 0) + 1;
      await item.save();
    }
    return item;
  } catch (err) {
    return null;
  }
}

// Lấy danh sách categories
async function getCategories() {
  await seedNewsIfEmpty();
  const categories = await NewsModel.distinct('category');
  return categories;
}

// Tìm kiếm tin tức
async function searchNews(query) {
  const q = new RegExp(query, 'i');
  return await NewsModel.find({
    $or: [
      { title: q },
      { excerpt: q },
      { tags: q }
    ]
  }).sort({ createdAt: -1 }).limit(20);
}

// Đăng ký nhận bản tin
async function addSubscriber(email) {
  try {
    const existing = await SubscriberModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return false; // Đã đăng ký rồi
    }
    await SubscriberModel.create({ email: email.toLowerCase() });
    return true; // Mới đăng ký
  } catch (err) {
    console.error('Error adding subscriber:', err);
    throw err;
  }
}

module.exports = { getAllNews, getNewsById, getCategories, searchNews, addSubscriber };
