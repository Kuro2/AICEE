import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  Shield, Lock, Globe, Eye, AlertTriangle, CheckCircle, Search,
  ArrowRight, Sparkles, Zap, ShieldCheck, HelpCircle, Mail, Database,
  ExternalLink, ChevronRight, CheckCircle2, AlertOctagon, Terminal
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [quickInput, setQuickInput] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  const handleQuickScan = (e) => {
    e.preventDefault();
    if (!quickInput.trim()) {
      navigate('/chatbox');
      return;
    }
    // Chuyển sang Chatbox kèm nội dung cần quét
    navigate('/chatbox', { state: { initialPrompt: `Kiểm tra an toàn cho: ${quickInput.trim()}` } });
  };

  const stats = [
    { value: '1,250,000+', label: 'Liên kết & Tệp đã quét' },
    { value: '99.8%', label: 'Độ chính xác AI' },
    { value: '< 2 Giây', label: 'Tốc độ phản hồi' },
    { value: '24/7/365', label: 'Bảo vệ thời gian thực' },
  ];

  const features = [
    {
      title: 'Phát hiện Phishing & Lừa đảo Tức thì',
      description: 'Nhận diện ngay lập tức các website giả mạo ngân hàng, cổng thanh toán fake, tin nhắn lừa đảo trúng thưởng hay mạo danh cơ quan nhà nước.',
      icon: Shield,
      badge: 'Công nghệ lõi',
      gradient: 'from-cyan-500/10 to-blue-500/5',
      border: 'border-cyan-500/30 hover:border-cyan-500/60',
    },
    {
      title: 'Trí tuệ Nhân tạo',
      description: 'Phân tích đa phương thức văn bản, mã nguồn HTML và ảnh chụp màn hình để tìm ra những bẫy thao túng tâm lý tinh vi nhất.',
      icon: Sparkles,
      badge: 'Multimodal AI',
      gradient: 'from-purple-500/10 to-pink-500/5',
      border: 'border-purple-500/30 hover:border-purple-500/60',
    },
    {
      title: 'Cơ sở Dữ liệu Mối đe dọa Việt Nam',
      description: 'Kho dữ liệu Blacklist và Whitelist cập nhật liên tục các hình thức lừa đảo đặc thù tại Việt Nam (VNeID giả, hóa đơn điện tử fake, việc nhẹ lương cao).',
      icon: Database,
      badge: 'Bản địa hóa VN',
      gradient: 'from-emerald-500/10 to-teal-500/5',
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
    },
  ];

  const protectionLevels = [
    {
      level: 'An Toàn (Safe)',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      icon: CheckCircle,
      description: 'Tổ chức chính thống đã xác minh danh tính, tên miền hợp pháp, có chứng chỉ bảo mật đầy đủ.',
      example: 'cổng gov.vn, ngân hàng chính thức',
    },
    {
      level: 'Cảnh Báo (Suspicious)',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      icon: AlertTriangle,
      description: 'Website mới đăng ký, thiếu thông tin doanh nghiệp, có chứa từ khóa nhạy cảm hoặc link rút gọn lạ.',
      example: 'tên miền đuôi .xyz, .top, link bit.ly',
    },
    {
      level: 'Nguy Hiểm (Malicious)',
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      icon: AlertOctagon,
      description: 'Đã bị báo cáo lừa đảo, giả mạo giao diện ngân hàng, chứa mã độc đánh cắp mật khẩu hoặc OTP.',
      example: 'link giả mạo đăng nhập vietcombank',
    },
  ];

  const faqs = [
    {
      q: 'AICEE hoạt động như thế nào khi tôi gửi một đường link?',
      a: 'AICEE tự động chuẩn hóa URL, tra cứu tức thời trên kho Blacklist/Whitelist và đưa dữ liệu vào mô hình AI Google Gemini để phân tích cú pháp, chứng chỉ SSL và nội dung trang web nhằm đưa ra điểm số rủi ro trong chưa đầy 2 giây.',
    },
    {
      q: 'Tôi có bị lộ thông tin cá nhân khi tải ảnh chụp màn hình lên kiểm tra không?',
      a: 'Không. Toàn bộ hình ảnh và dữ liệu được mã hóa một chiều trong quá trình phân tích và được khử định danh (loại bỏ thông tin nhạy cảm) theo đúng Chính sách Bảo mật của chúng tôi.',
    },
    {
      q: 'AICEE có hỗ trợ tiện ích trên các trình duyệt máy tính không?',
      a: 'Có, AICEE hỗ trợ đầy đủ tiện ích mở rộng (Extension) trên Chrome, Microsoft Edge, Cốc Cốc, Brave và Firefox để tự động cảnh báo bạn ngay khi bạn vừa truy cập một trang web độc hại.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Dynamic Ambient Mesh Glows */}
      <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-2/3 left-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />

      <Header />

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Hệ Thống Phòng Vệ AI Thế Hệ Mới
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
                BẢO VỆ TOÀN DIỆN TRƯỚC{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                  HIỂM HỌA LỪA ĐẢO
                </span>{' '}
                TRỰC TUYẾN
              </h1>

              <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
                Ứng dụng sức mạnh của <strong className="text-white font-semibold">AI</strong> và cơ sở dữ liệu an ninh mạng bản địa hóa để thẩm định tức thì website, email, SMS và hình ảnh nghi vấn.
              </p>

              {/* Quick AI Scanner Input Box */}
              <div className="pt-2 max-w-xl mx-auto lg:mx-0">
                <form
                  onSubmit={handleQuickScan}
                  className="p-2 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-2xl shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col sm:flex-row items-center gap-2"
                >
                  <div className="flex items-center space-x-3 px-3 w-full sm:w-auto flex-1">
                    <Search className="w-5 h-5 text-cyan-400 shrink-0" />
                    <input
                      type="text"
                      value={quickInput}
                      onChange={(e) => setQuickInput(e.target.value)}
                      placeholder="Dán URL, số điện thoại hoặc email cần kiểm tra..."
                      className="w-full py-2.5 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-2 shrink-0 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Quét Bằng AI</span>
                  </button>
                </form>
                <div className="flex items-center justify-center lg:justify-start space-x-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Miễn phí 100%
                  </span>
                  <span>•</span>
                  <span>Phát hiện nhanh sau 2s</span>
                  <span>•</span>
                  <span>Không cần cài đặt</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                <button
                  onClick={() => navigate('/chatbox')}
                  className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-all flex items-center space-x-2"
                >
                  <span>Mở Trợ Lý AI Chatbox</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/resources')}
                  className="px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-sm transition-all"
                >
                  Xem Cơ Sở Dữ Liệu
                </button>
              </div>
            </div>

            {/* Right Hero Illustration (5 cols) */}
            <div className="lg:col-span-5 relative flex items-center justify-center select-none py-8">
              {/* Soft Ambient Glow Aura */}
              <div className="absolute w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative w-80 sm:w-[420px] h-80 sm:h-[420px] mx-auto flex items-center justify-center">
                {/* ── Rotating Glowing Light Beam Orbit (Vòng sáng chạy quanh logo) ── */}
                <svg className="absolute inset-0 w-full h-full animate-spin-beam pointer-events-none z-10" viewBox="0 0 400 400">
                  <defs>
                    <linearGradient id="beam-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                      <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                    </linearGradient>

                    <filter id="neon-beam-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Faint Guide Orbit Track */}
                  <circle cx="200" cy="200" r="165" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1.5" />

                  {/* Moving Glowing Light Arc (Comet Tail) */}
                  <circle
                    cx="200"
                    cy="200"
                    r="165"
                    fill="none"
                    stroke="url(#beam-grad-1)"
                    strokeWidth="3.5"
                    strokeDasharray="220 820"
                    strokeLinecap="round"
                    filter="url(#neon-beam-glow)"
                  />

                  {/* Intense Glowing Leading Light Head */}
                  <circle cx="200" cy="35" r="4.5" fill="#ffffff" filter="url(#neon-beam-glow)" />
                  <circle cx="200" cy="35" r="2.5" fill="#ffffff" />
                </svg>

                {/* Secondary Delicate Counter-Rotating Light Ring */}
                <svg className="absolute inset-0 w-full h-full animate-spin-beam-slow pointer-events-none opacity-60 z-10" viewBox="0 0 400 400">
                  <defs>
                    <linearGradient id="beam-grad-2" x1="100%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
                      <stop offset="70%" stopColor="#6366f1" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>
                  <circle cx="200" cy="200" r="135" fill="none" stroke="rgba(99, 102, 241, 0.12)" strokeWidth="1.5" />
                  <circle
                    cx="200"
                    cy="200"
                    r="135"
                    fill="none"
                    stroke="url(#beam-grad-2)"
                    strokeWidth="2.5"
                    strokeDasharray="140 710"
                    strokeLinecap="round"
                    filter="url(#neon-beam-glow)"
                  />
                  <circle cx="200" cy="65" r="3" fill="#38bdf8" filter="url(#neon-beam-glow)" />
                </svg>

                {/* ── Soft Central Glow behind Shield ── */}
                <div className="absolute inset-16 bg-gradient-to-br from-cyan-500/25 via-blue-600/20 to-purple-600/15 blur-3xl rounded-full pointer-events-none" />

                {/* ── Big Prominent Logo (Pure Graphic) ── */}
                <div className="relative z-10 animate-float group cursor-pointer transition-transform duration-300">
                  <img
                    src="/logo-aicee.png"
                    alt="AICEE Cyber Shield"
                    className="w-64 sm:w-80 h-64 sm:h-80 object-contain drop-shadow-[0_0_45px_rgba(6,182,212,0.6)] transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-[0_0_65px_rgba(6,182,212,0.85)]"
                  />
                </div>

                {/* ── Floating Graphic Icon Badges (Nghiêng sang 2 phía, không chữ) ── */}
                {/* 1. Shield Check Icon (Top-Right: Nghiêng sang phải +12deg) */}
                <div className="absolute top-2 -right-2 sm:-right-4 animate-float z-20">
                  <div
                    title="Bảo vệ an toàn"
                    className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-slate-900/90 border border-emerald-500/50 backdrop-blur-xl shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center text-emerald-400 transform rotate-12 hover:rotate-3 hover:scale-110 transition-all duration-300 cursor-pointer"
                  >
                    <ShieldCheck className="w-6 sm:w-7 h-6 sm:h-7 drop-shadow-[0_0_10px_#10b981]" />
                  </div>
                </div>

                {/* 2. Sparkles AI Icon (Bottom-Left: Nghiêng sang trái -12deg) */}
                <div className="absolute bottom-2 -left-2 sm:-left-4 animate-float-delayed z-20">
                  <div
                    title="Trí tuệ nhân tạo AI"
                    className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-slate-900/90 border border-cyan-500/50 backdrop-blur-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center text-cyan-400 transform -rotate-12 hover:-rotate-3 hover:scale-110 transition-all duration-300 cursor-pointer"
                  >
                    <Sparkles className="w-6 sm:w-7 h-6 sm:h-7 drop-shadow-[0_0_10px_#06b6d4]" />
                  </div>
                </div>

                {/* 3. Cyber Lock Icon (Bottom-Right: Nghiêng sang phải +12deg) */}
                <div className="absolute bottom-4 -right-1 sm:right-1 animate-float-slow z-20">
                  <div
                    title="Mã hóa bảo mật"
                    className="w-11 sm:w-12 h-11 sm:h-12 rounded-2xl bg-slate-900/90 border border-purple-500/50 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center justify-center text-purple-300 transform rotate-12 hover:rotate-3 hover:scale-110 transition-all duration-300 cursor-pointer"
                  >
                    <Lock className="w-5 sm:w-6 h-5 sm:h-6 drop-shadow-[0_0_10px_#a855f7]" />
                  </div>
                </div>

                {/* 4. Mini Guard Shield Icon (Top-Left: Nghiêng sang trái -12deg) */}
                <div className="absolute top-6 -left-1 sm:left-2 animate-float z-20">
                  <div
                    title="Khiên phòng vệ mạng"
                    className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-slate-900/90 border border-blue-500/40 backdrop-blur-xl shadow-[0_0_20px_rgba(59,130,246,0.35)] flex items-center justify-center text-blue-400 transform -rotate-12 hover:-rotate-3 hover:scale-110 transition-all duration-300 cursor-pointer"
                  >
                    <Shield className="w-5 h-5 drop-shadow-[0_0_8px_#3b82f6]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="py-12 border-y border-white/10 bg-white/[0.01] backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, idx) => (
              <div key={idx} className="p-4">
                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400 mb-1 font-mono">
                  {stat.value}
                </div>
                <p className="text-gray-400 text-xs sm:text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 bg-cyan-500/10 px-3.5 py-1.5 rounded-full border border-cyan-500/20">
              Công Nghệ Đột Phá
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-3 tracking-tight">
              Phòng Vệ Đa Lớp Thông Minh
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Kết hợp nhiều thuật toán kiểm tra chuyên sâu giúp bạn an tâm tuyệt đối khi lướt web, mua sắm và giao dịch online.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className={`group relative p-8 rounded-3xl bg-gradient-to-b ${feature.gradient} bg-white/[0.02] border ${feature.border} backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] font-semibold text-gray-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        {feature.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      {feature.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Khám phá công nghệ</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Three Protection Levels */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950/60 border-y border-white/10 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 bg-cyan-500/10 px-3.5 py-1.5 rounded-full border border-cyan-500/20">
              Tiêu Chuẩn Đánh Giá
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-3 tracking-tight">
              3 Mức Độ Cảnh Báo An Ninh
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Mỗi liên kết và nội dung kiểm tra đều được AI phân loại thành các mức độ rủi ro rõ ràng kèm theo khuyến nghị tức thì.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {protectionLevels.map((lvl, idx) => {
              const Icon = lvl.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 ${lvl.color}`}>
                      <Icon className="w-7 h-7" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3">
                      {lvl.level}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      {lvl.description}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-400 font-mono">
                    <span className="text-gray-500 block mb-0.5">Dấu hiệu nhận biết:</span>
                    <span className="text-white">{lvl.example}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Quiz Practice Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-cyan-950/50 via-slate-900/60 to-purple-950/50 border border-cyan-500/30 backdrop-blur-2xl shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-center lg:text-left">
              <span className="text-xs uppercase tracking-wider font-semibold text-yellow-400 bg-yellow-500/10 px-3.5 py-1.5 rounded-full border border-yellow-500/20">
                Thực Hành Tương Tác
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Kiểm Tra Kỹ Năng Săn Bắt Lừa Đảo Của Bạn
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Tham gia các mini-game trắc nghiệm tình huống thực tế để nhận diện ngay các chiêu trò giả mạo ngân hàng và email độc hại.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <button
                onClick={() => navigate('/quiz/fake')}
                className="px-6 py-3.5 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-105"
              >
                Trắc Nghiệm Web Thật/Giả
              </button>
              <button
                onClick={() => navigate('/quiz/email')}
                className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105"
              >
                Bắt Bài Email Lừa Đảo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-2">Câu Hỏi Thường Gặp</h2>
            <p className="text-gray-400 text-sm">Giải đáp mọi thắc mắc về nền tảng an ninh AICEE</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-semibold text-sm text-white hover:text-cyan-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${activeFaq === idx ? 'rotate-90' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;