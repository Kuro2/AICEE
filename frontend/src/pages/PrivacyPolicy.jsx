import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
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
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Chính sách bảo mật</h1>
            </div>
            
            <div className="prose max-w-none text-gray-600 space-y-4">
              <p>AICEE cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của người dùng. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.</p>
              
              <h3 className="text-xl font-bold text-gray-800 mt-6">1. Thu thập dữ liệu</h3>
              <p>Chúng tôi chỉ thu thập các thông tin tối thiểu cần thiết để vận hành dịch vụ, bao gồm: Địa chỉ email (khi đăng ký tài khoản/nhận tin), dữ liệu từ các liên kết hoặc nội dung bạn yêu cầu AI phân tích.</p>

              <h3 className="text-xl font-bold text-gray-800 mt-6">2. Sử dụng thông tin</h3>
              <p>Thông tin đầu vào (URL, email lừa đảo) do bạn cung cấp được dùng ẩn danh để cải thiện mô hình nhận diện của AI và đóng góp vào danh sách đen (Blacklist) vì cộng đồng. Chúng tôi tuyệt đối không sử dụng thông tin này vào mục đích quảng cáo hoặc bán cho bên thứ ba.</p>

              <h3 className="text-xl font-bold text-gray-800 mt-6">3. Bảo mật dữ liệu</h3>
              <p>Mật khẩu của bạn được mã hóa một chiều an toàn (bcrypt) trước khi lưu vào cơ sở dữ liệu. Mọi tương tác của bạn với hệ thống đều được mã hóa bằng giao thức HTTPS/SSL.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
