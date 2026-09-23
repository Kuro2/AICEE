import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfUse = () => {
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
                <FileText className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Điều khoản sử dụng</h1>
            </div>
            
            <div className="prose max-w-none text-gray-600 space-y-4">
              <p>Chào mừng bạn đến với AICEE. Khi sử dụng các dịch vụ của chúng tôi, bạn đồng ý với các điều khoản dưới đây:</p>
              
              <h3 className="text-xl font-bold text-gray-800 mt-6">1. Mục đích sử dụng</h3>
              <p>Hệ thống AICEE được thiết kế nhằm mục đích cảnh báo, tư vấn và cung cấp thông tin liên quan đến an toàn thông tin mạng. Các kết quả phân tích chỉ mang tính chất tham khảo và hỗ trợ ra quyết định.</p>

              <h3 className="text-xl font-bold text-gray-800 mt-6">2. Trách nhiệm người dùng</h3>
              <p>Người dùng không được lợi dụng hệ thống AICEE để thực hiện các hành vi vi phạm pháp luật, như spam hệ thống, thử nghiệm lỗ hổng trái phép hoặc can thiệp vào mã nguồn của nền tảng.</p>

              <h3 className="text-xl font-bold text-gray-800 mt-6">3. Miễn trừ trách nhiệm</h3>
              <p>Kết quả do AI cung cấp (được hỗ trợ bởi Google Gemini) có thể có sai số. AICEE không chịu trách nhiệm đối với bất kỳ thiệt hại nào về tài sản, dữ liệu phát sinh từ việc người dùng hoàn toàn tin tưởng vào kết quả tự động mà bỏ qua các bước kiểm chứng thủ công khác.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfUse;
