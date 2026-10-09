import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, Lock, ShieldCheck, Database, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* Back button */}
          <Link 
            to="/resources" 
            className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-emerald-400 mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Quay lại Trung tâm Tài nguyên
          </Link>

          {/* Document Card */}
          <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-white/10">
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Bảo Mật Dữ Liệu
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
                  Chính Sách Bảo Mật
                </h1>
              </div>
            </div>

            <div className="space-y-8 text-gray-300 leading-relaxed text-sm sm:text-base">
              <p className="text-gray-300">
                AICEE cam kết tôn trọng và bảo vệ tuyệt đối quyền riêng tư cùng thông tin cá nhân của người dùng theo các tiêu chuẩn an toàn bảo mật thông tin quốc tế.
              </p>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  1. Thu thập Thông tin Tối thiểu
                </h3>
                <p className="text-gray-400">
                  Chúng tôi chỉ thu thập thông tin tài khoản cơ bản (Email, Tên hiển thị) để quản lý gói dịch vụ và các liên kết/hình ảnh mà người dùng chủ động tải lên để yêu cầu AI phân tích rủi ro.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <EyeOff className="w-5 h-5 text-emerald-400" />
                  2. Khử định danh &amp; Đóng góp Cộng đồng
                </h3>
                <p className="text-gray-400">
                  Các đường link hay kịch bản lừa đảo sau khi được phân tích sẽ được khử định danh (ẩn toàn bộ thông tin cá nhân của người gửi) trước khi đưa vào tập huấn luyện hoặc công bố trên Blacklist để bảo vệ cộng đồng.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  3. Tiêu chuẩn Mã hóa An toàn
                </h3>
                <p className="text-gray-400">
                  Toàn bộ mật khẩu được băm bằng thuật toán bcrypt. Dữ liệu truyền tải giữa máy tính người dùng và máy chủ AICEE luôn được mã hóa thông qua giao thức TLS 1.3/HTTPS hiện đại.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
