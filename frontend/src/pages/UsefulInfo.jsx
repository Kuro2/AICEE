import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const UsefulInfo = () => {
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
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Search className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Thông tin hữu ích</h1>
            </div>
            
            <div className="prose max-w-none text-gray-600 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">1. Cẩm nang xử lý nhanh khi gặp lừa đảo trực tuyến</h3>
                <p>Nếu bạn nghi ngờ mình vừa bị lừa đảo (chuyển tiền nhầm, cung cấp OTP), hãy làm ngay 3 bước sau:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Gọi ngay cho ngân hàng:</strong> Yêu cầu khóa thẻ và tạm ngưng giao dịch ngay lập tức.</li>
                  <li><strong>Thay đổi mật khẩu:</strong> Đổi mật khẩu các tài khoản email, mạng xã hội và bật xác thực 2 yếu tố (2FA).</li>
                  <li><strong>Trình báo cơ quan chức năng:</strong> Báo cáo lên trang Cảnh báo An toàn thông tin Quốc gia hoặc cơ quan công an gần nhất.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">2. Dấu hiệu nhận biết Website giả mạo</h3>
                <p>Các website lừa đảo thường có những đặc điểm sau để đánh lừa người dùng:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Domain sai chính tả (VD: vıetcombank.com.vn thay vì vietcombank.com.vn).</li>
                  <li>Thiếu chứng chỉ bảo mật SSL (không có hình ổ khóa, báo Not Secure).</li>
                  <li>Thiết kế cẩu thả, nhiều lỗi font chữ hoặc hình ảnh mờ, vỡ nét.</li>
                  <li>Thúc giục bạn nhập thông tin nhạy cảm ngay lập tức với lý do "Tài khoản bị khóa", "Trúng thưởng".</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UsefulInfo;
