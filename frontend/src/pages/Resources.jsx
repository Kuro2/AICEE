import React from 'react';
import { 
  ShieldAlert, ShieldCheck, Search, Settings, FileText, Lock, 
  ArrowRight, Sparkles, BookOpen, AlertOctagon, HelpCircle, MailCheck, ExternalLink, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Resources = () => {
  const primaryResources = [
    {
      title: 'Danh sách Cảnh báo Nguy hiểm',
      subtitle: 'Blacklist - Cảnh báo các website, số điện thoại, tài khoản lừa đảo đã được xác thực.',
      badge: 'Cập nhật liên tục',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      icon: <ShieldAlert className="w-8 h-8 text-red-400" />,
      path: '/resources/unsafe',
      glow: 'from-red-500/10 via-rose-500/5 to-transparent',
      borderColor: 'border-red-500/30 hover:border-red-500/60',
      tagColor: 'text-red-400',
      buttonBg: 'bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white',
    },
    {
      title: 'Danh sách Xác minh An toàn',
      subtitle: 'Whitelist - Danh mục các cổng thông tin, tổ chức và ngân hàng chính thống.',
      badge: 'Đã thẩm định',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
      path: '/resources/safe',
      glow: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
      tagColor: 'text-emerald-400',
      buttonBg: 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-200 hover:text-white',
    },
  ];

  const toolsAndGuides = [
    {
      title: 'Trắc nghiệm Website Thật / Giả',
      desc: 'Luyện tập phát hiện website lừa đảo tinh vi thông qua 5 tình huống thực tế có chấm điểm.',
      icon: <HelpCircle className="w-6 h-6 text-yellow-400" />,
      path: '/quiz/fake',
      tag: 'Tương tác & Học tập',
      tagColor: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    },
    {
      title: 'Thử thách Bắt bài Email Phishing',
      desc: 'Phân tích tiêu đề, địa chỉ người gửi và đường link giả mạo trong các email lừa đảo ngân hàng.',
      icon: <MailCheck className="w-6 h-6 text-cyan-400" />,
      path: '/quiz/email',
      tag: 'Tương tác & Học tập',
      tagColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    },
    {
      title: 'Cẩm nang Xử lý Khẩn cấp',
      desc: 'Hướng dẫn các bước xử lý ngay lập tức khi bạn nghi ngờ mình đã bị lộ thông tin hoặc chuyển tiền.',
      icon: <BookOpen className="w-6 h-6 text-blue-400" />,
      path: '/resources/info',
      tag: 'Cẩm nang phòng tránh',
      tagColor: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    },
    {
      title: 'Cơ chế Hoạt động của AI',
      desc: 'Tìm hiểu kiến trúc bảo mật kết hợp Google Gemini và hệ thống Threat Intelligence của AICEE.',
      icon: <Settings className="w-6 h-6 text-purple-400" />,
      path: '/resources/how-it-works',
      tag: 'Công nghệ lõi',
      tagColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    },
    {
      title: 'Chính sách Bảo mật',
      desc: 'Cam kết minh bạch về thu thập, xử lý và bảo vệ an toàn tuyệt đối dữ liệu người dùng.',
      icon: <Lock className="w-6 h-6 text-teal-400" />,
      path: '/resources/privacy',
      tag: 'Pháp lý & Quy định',
      tagColor: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
    },
    {
      title: 'Điều khoản Dịch vụ',
      desc: 'Quy định sử dụng nền tảng, quyền và nghĩa vụ của người dùng khi trải nghiệm AICEE.',
      icon: <FileText className="w-6 h-6 text-gray-400" />,
      path: '/resources/terms',
      tag: 'Pháp lý & Quy định',
      tagColor: 'text-gray-400 border-white/20 bg-white/5',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-[160px] pointer-events-none" />

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-6xl">
          {/* Header section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Cơ sở Tri thức &amp; Tài nguyên
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 mb-6 tracking-tight">
              Trung tâm Dữ liệu An toàn
            </h1>

            <p className="text-gray-400 text-base sm:text-lg leading-relaxed font-light">
              Khám phá các danh sách an ninh mạng được thẩm định, công cụ kiểm tra tương tác và cẩm nang kiến thức phòng chống lừa đảo trực tuyến.
            </p>
          </div>

          {/* Primary Big Cards: Blacklist & Whitelist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {primaryResources.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className={`group relative p-8 rounded-3xl bg-gradient-to-b ${item.glow} bg-white/[0.02] border ${item.borderColor} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between overflow-hidden`}
              >
                {/* Top Corner Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-8">
                    {item.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${item.tagColor}`}>
                    Truy cập dữ liệu
                  </span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${item.buttonBg} group-hover:translate-x-1`}>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Tools & Guides Grid */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Công cụ &amp; Hướng dẫn bảo mật</h2>
                <p className="text-gray-400 text-sm mt-1">Các bài thực hành và tài liệu hướng dẫn an ninh toàn diện</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {toolsAndGuides.map((guide, idx) => (
                <Link
                  key={idx}
                  to={guide.path}
                  className="group relative p-6 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(6,182,212,0.2)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-105 transition-transform">
                        {guide.icon}
                      </div>
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${guide.tagColor}`}>
                        {guide.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6">
                      {guide.desc}
                    </p>
                  </div>

                  <div className="flex items-center text-cyan-400 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Xem chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Emergency Alert Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-blue-950/60 to-purple-950/60 border border-cyan-500/30 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Cần hỗ trợ kiểm tra trực tiếp?</h3>
                <p className="text-gray-300 text-sm">
                  Gửi ngay đường link, số điện thoại hoặc tin nhắn cho Trợ lý AI để nhận kết quả phân tích chỉ sau 3 giây.
                </p>
              </div>
            </div>
            <Link
              to="/chatbox"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0 transition-all hover:scale-105"
            >
              Hỏi AI ngay
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Resources;
