import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* Back button */}
          <Link 
            to="/resources" 
            className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-cyan-400 mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Quay lại Trung tâm Tài nguyên
          </Link>

          {/* Document Card */}
          <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-white/10">
              <div className="p-3.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                  Pháp Lý &amp; Quy Định
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
                  Điều Khoản Dịch Vụ
                </h1>
              </div>
            </div>

            <div className="space-y-8 text-gray-300 leading-relaxed text-sm sm:text-base">
              <p className="text-gray-300">
                Chào mừng bạn đến với nền tảng an ninh thông tin <strong className="text-white">AICEE</strong>. Khi truy cập và sử dụng các dịch vụ của chúng tôi, bạn đồng ý tuân thủ toàn bộ các điều khoản được quy định dưới đây.
              </p>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  1. Mục đích và Phạm vi Dịch vụ
                </h3>
                <p className="text-gray-400">
                  Hệ thống AICEE được thiết kế nhằm mục đích hỗ trợ người dùng phân tích, cảnh báo và phòng ngừa các nguy cơ lừa đảo, giả mạo trực tuyến. Kết quả phân tích do Trí tuệ Nhân tạo cung cấp có giá trị tham khảo hỗ trợ ra quyết định an toàn.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  2. Trách nhiệm của Người dùng
                </h3>
                <p className="text-gray-400">
                  Người dùng cam kết không lợi dụng hệ thống để thực hiện các hành vi phá hoại, spam API, rà quét lỗ hổng trái phép hoặc can thiệp vào hoạt động bình thường của hệ thống.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  3. Giới hạn Trách nhiệm
                </h3>
                <p className="text-gray-400">
                  Mặc dù chúng tôi liên tục cải tiến mô hình AI và kho dữ liệu để đạt độ chính xác cao nhất, AICEE không chịu trách nhiệm đối với các thiệt hại phát sinh từ việc người dùng hoàn toàn tin tưởng vào kết quả tự động mà bỏ qua các biện pháp xác minh trực tiếp với các đơn vị liên quan.
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

export default TermsOfUse;
