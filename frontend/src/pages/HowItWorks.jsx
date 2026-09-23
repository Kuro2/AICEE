import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-[#f3f7f8] flex flex-col">
      <Header />
      <main className="flex-grow pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link to="/resources" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Tài nguyên
          </Link>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center space-x-4 mb-8 pb-4 border-b border-gray-100">
              <div className="p-3 bg-gray-100 text-gray-700 rounded-lg">
                <Settings className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Cơ chế hoạt động</h1>
            </div>
            
            <div className="prose max-w-none text-gray-600 space-y-6">
              <p>AICEE hoạt động dựa trên sự kết hợp giữa Trí tuệ Nhân tạo (AI) và cơ sở dữ liệu về an ninh mạng được cập nhật liên tục.</p>
              
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">1. Thu thập dữ liệu (Data Gathering)</h3>
                <p>Hệ thống của chúng tôi liên tục quét và thu thập dữ liệu từ các nguồn tình báo mối đe dọa (Threat Intelligence), báo cáo của người dùng, và danh sách đen (Blacklists) toàn cầu.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">2. Phân tích bằng AI (AI Analysis)</h3>
                <p>Khi bạn gửi một liên kết, email hoặc số điện thoại, mô hình AI (được huấn luyện bởi Google Gemini) sẽ tiến hành phân tích cú pháp, trích xuất đặc trưng và so khớp với các mẫu hình (patterns) lừa đảo đã biết. Hệ thống có khả năng nhận diện ngay cả những biến thể phishing mới nhất.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">3. Trả về kết quả (Scoring & Feedback)</h3>
                <p>AI sẽ đưa ra kết luận (An toàn, Cảnh báo, hoặc Nguy hiểm) kèm theo giải thích chi tiết tại sao địa chỉ đó lại đáng ngờ, đồng thời đưa ra lời khuyên để bạn tự bảo vệ bản thân.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
