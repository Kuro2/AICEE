import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Calendar, ArrowRight, BookOpen } from 'lucide-react';

const News = () => {
  const newsItems = [
    {
      id: 1,
      title: 'Cảnh báo hình thức lừa đảo chiếm đoạt tài khoản ngân hàng mới',
      excerpt: 'Gần đây xuất hiện nhiều thủ đoạn tinh vi giả danh cán bộ thuế, ngân hàng yêu cầu cài đặt ứng dụng giả mạo để đánh cắp thông tin...',
      date: '24/10/2023',
      category: 'Cảnh báo lừa đảo',
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
    },
    {
      id: 2,
      title: 'AICEE ra mắt tính năng AI Tư vấn an toàn thông tin 24/7',
      excerpt: 'Người dùng hiện có thể trò chuyện trực tiếp với AI để nhận diện các đường link đáng ngờ, tin nhắn lừa đảo và cách xử lý kịp thời...',
      date: '20/10/2023',
      category: 'Cập nhật sản phẩm',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1632&q=80',
    },
    {
      id: 3,
      title: '5 Nguyên tắc vàng bảo mật thông tin cá nhân trên mạng xã hội',
      excerpt: 'Mạng xã hội tiềm ẩn nhiều rủi ro rò rỉ dữ liệu. Hãy áp dụng ngay 5 nguyên tắc này để bảo vệ bản thân và gia đình bạn...',
      date: '15/10/2023',
      category: 'Kiến thức an toàn',
      image: 'https://images.unsplash.com/photo-1614064641913-6b71a2161ca1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
    },
    {
      id: 4,
      title: 'Phát hiện chiến dịch tấn công Phishing nhắm vào người dùng crypto',
      excerpt: 'Hàng loạt email giả mạo các sàn giao dịch tiền điện tử lớn đang được phát tán nhằm đánh cắp private key của người dùng...',
      date: '10/10/2023',
      category: 'Báo cáo bảo mật',
      image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1469&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 pt-24 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tin tức & Sự kiện
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Cập nhật những thông tin mới nhất về an ninh mạng, cảnh báo lừa đảo và các tính năng mới của AICEE.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
          {newsItems.map((news) => (
            <div 
              key={news.id} 
              className="bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-cyan-500/50 transition-all group flex flex-col"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={news.image} 
                  alt={news.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-cyan-500/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                  {news.category}
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center text-gray-400 text-sm mb-3">
                  <Calendar className="w-4 h-4 mr-2" />
                  {news.date}
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                  {news.title}
                </h3>
                
                <p className="text-gray-400 mb-6 flex-grow line-clamp-3">
                  {news.excerpt}
                </p>
                
                <button className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors font-medium mt-auto group-hover:underline">
                  Đọc tiếp <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-8 text-center md:text-left">
            <h3 className="text-3xl font-bold text-white mb-2">Đăng ký nhận bản tin</h3>
            <p className="text-gray-300 text-lg">Không bỏ lỡ bất kỳ cảnh báo bảo mật quan trọng nào từ chúng tôi.</p>
          </div>
          <div className="flex w-full md:w-auto">
            <input 
              type="email" 
              placeholder="Nhập email của bạn..." 
              className="px-6 py-4 rounded-l-xl bg-slate-800/80 border border-slate-600 text-white focus:outline-none focus:border-cyan-500 w-full md:w-72"
            />
            <button className="bg-cyan-500 hover:bg-cyan-400 text-white px-6 py-4 rounded-r-xl font-bold transition-colors">
              Đăng ký
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;
