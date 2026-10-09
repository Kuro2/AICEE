import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, BookOpen, AlertOctagon, PhoneCall, KeyRound, ShieldAlert, CheckCircle, Globe, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const UsefulInfo = () => {
  const emergencySteps = [
    {
      step: '01',
      title: 'Khóa thẻ & Đóng băng tài khoản ngay',
      desc: 'Gọi hotline khẩn cấp của ngân hàng hoặc sử dụng tính năng "Khóa thẻ tức thì" trên ứng dụng Mobile Banking.',
      color: 'from-red-500/20 to-orange-500/10 border-red-500/30 text-red-400',
    },
    {
      step: '02',
      title: 'Đổi mật khẩu & Bật xác thực 2 lớp (2FA)',
      desc: 'Ngay lập tức thay đổi mật khẩu email chính, mạng xã hội và các tài khoản dịch vụ, đồng thời đăng xuất khỏi mọi thiết bị lạ.',
      color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400',
    },
    {
      step: '03',
      title: 'Trình báo cơ quan chức năng & Cảnh báo người thân',
      desc: 'Báo cáo ngay tới Phòng An ninh mạng (A05) hoặc Cục An toàn thông tin, đồng thời đăng thông báo để người thân không bị lừa vay mượn.',
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-cyan-400',
    },
  ];

  const fakeWebsiteSigns = [
    {
      sign: 'Tên miền biến dị (Typosquatting)',
      example: 'vıetcombank.com.vn, bidvv.vn, techcom-bank.vip',
      tip: 'Đối tượng thường thay thế một ký tự rất khó phát hiện (chữ l thành 1, o thành 0, hoặc đuôi .vip, .top thay vì .vn).',
    },
    {
      sign: 'Thiếu chứng chỉ mã hóa SSL / Cảnh báo trình duyệt',
      example: 'http:// thay vì https://, hoặc chứng chỉ cấp phát sai tên miền',
      tip: 'Trình duyệt sẽ hiển thị icon ổ khóa gạch đỏ hoặc cảnh báo "Không an toàn". Hãy thoát ngay.',
    },
    {
      sign: 'Tâm lý học thúc giục & Đe dọa khẩn cấp',
      example: '"Tài khoản bị khóa sau 24h", "Nhận quà tặng 50 triệu ngay"',
      tip: 'Các tổ chức tài chính chính thống KHÔNG BAO GIỜ yêu cầu bạn đăng nhập để "mở khóa" qua đường link tin nhắn.',
    },
    {
      sign: 'Giao diện bắt chước nhưng lỗi font hoặc bố cục méo mó',
      example: 'Ảnh logo bị mờ, văn bản sai chính tả tiếng Việt',
      tip: 'Website lừa đảo thường copy mã nguồn vội vã nên các đường link chân trang thường trỏ về trang trắng hoặc #.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-5xl">
          {/* Back button */}
          <Link 
            to="/resources" 
            className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-cyan-400 mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Quay lại Trung tâm Tài nguyên
          </Link>

          {/* Hero Header */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-blue-950/40 via-slate-900/40 to-slate-950/60 border border-blue-500/30 backdrop-blur-2xl shadow-2xl mb-12">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                  Cẩm Nang An Toàn Thông Tin
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
                  Thông Tin Hữu Ích &amp; Phòng Tránh
                </h1>
              </div>
            </div>
            <p className="text-gray-300 text-base leading-relaxed max-w-3xl mt-4">
              Tổng hợp kinh nghiệm thực chiến từ các chuyên gia bảo mật AICEE nhằm bảo vệ bạn và gia đình trước các thủ đoạn công nghệ cao mới nhất.
            </p>
          </div>

          {/* Section 1: Emergency Guide */}
          <div className="mb-14">
            <div className="flex items-center space-x-3 mb-6">
              <AlertOctagon className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-bold text-white">Quy Trình Xử Lý Khẩn Cấp (Khi nghi bị lừa đảo)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {emergencySteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl bg-gradient-to-b ${step.color} bg-white/[0.02] border backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 relative`}
                >
                  <div className="text-3xl font-black opacity-30 mb-2">{step.step}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Spotting Fake Websites */}
          <div className="mb-14">
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">4 Dấu Hiệu Nhận Diện Website Lừa Đảo Phổ Biến</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fakeWebsiteSigns.map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl transition-all"
                >
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    {item.sign}
                  </h3>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono text-amber-300 mb-3">
                    Ví dụ: {item.example}
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    💡 <strong className="text-gray-200">Lời khuyên:</strong> {item.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Support Hotlines */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Đường dây nóng hỗ trợ phòng chống tội phạm công nghệ</h3>
              <p className="text-gray-400 text-sm">
                Trang Cảnh báo An toàn thông tin Việt Nam: <strong className="text-cyan-400">canhbao.ncsc.gov.vn</strong>
              </p>
            </div>
            <Link
              to="/chatbox"
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Tư vấn cùng AI ngay
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UsefulInfo;
