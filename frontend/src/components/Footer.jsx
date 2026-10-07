import React from 'react';
import { Shield, Facebook, Twitter, Send, Github, Lock, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="relative bg-[#070b14] border-t border-white/10 pt-16 pb-12 overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent blur-2xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/30 blur-lg rounded-full group-hover:bg-cyan-500/50 transition-colors" />
                <img 
                  src="/logo-aicee.png" 
                  alt="AICEE Logo" 
                  className="w-12 h-12 object-contain relative z-10 group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400 tracking-wider">
                  AICEE
                </span>
                <span className="block text-[11px] font-semibold text-cyan-400 tracking-widest uppercase -mt-1">
                  AI Cyber Security
                </span>
              </div>
            </Link>

            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Hệ thống phòng vệ an ninh mạng ứng dụng Trí tuệ Nhân tạo thế hệ mới. Bảo vệ bạn và gia đình trước các hiểm họa lừa đảo, giả mạo trực tuyến 24/7.
            </p>

            {/* Browser Support Pills */}
            <div className="pt-2">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2.5">
                Hỗ trợ tiện ích mở rộng trên
              </p>
              <div className="flex flex-wrap gap-2">
                {['Chrome', 'Edge', 'Cốc Cốc', 'Brave', 'Firefox'].map((browser) => (
                  <span
                    key={browser}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-white/5 border border-white/10 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
                  >
                    {browser}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links 1: Sản phẩm */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Sản phẩm
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/chatbox" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  AI Tư vấn an ninh
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Bảng giá &amp; Gói cước
                </Link>
              </li>
              <li>
                <Link to="/resources/how-it-works" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Cơ chế hoạt động AI
                </Link>
              </li>
              <li>
                <Link to="/quiz/fake" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Trắc nghiệm Thật/Giả
                </Link>
              </li>
              <li>
                <Link to="/quiz/email" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Phân tích Email mẫu
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links 2: Tài nguyên & Cảnh báo */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              Cơ sở dữ liệu
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/resources/unsafe" className="text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Danh sách cảnh báo đen
                </Link>
              </li>
              <li>
                <Link to="/resources/safe" className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Danh sách an toàn trắng
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Tin tức an ninh mạng
                </Link>
              </li>
              <li>
                <Link to="/resources/info" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Cẩm nang phòng tránh
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links 3: Pháp lý & Cộng đồng */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Chính sách &amp; Kết nối
            </h4>
            <ul className="space-y-2.5 text-sm mb-5">
              <li>
                <Link to="/resources/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/resources/terms" className="text-gray-400 hover:text-white transition-colors">
                  Điều khoản dịch vụ
                </Link>
              </li>
            </ul>

            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2.5">
              Tham gia cộng đồng
            </p>
            <div className="flex space-x-2.5">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-600/20 hover:text-blue-400 text-gray-400 flex items-center justify-center transition-all duration-300"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-600/20 hover:text-cyan-400 text-gray-400 flex items-center justify-center transition-all duration-300"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:border-sky-500/50 hover:bg-sky-600/20 hover:text-sky-400 text-gray-400 flex items-center justify-center transition-all duration-300"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Phát triển bởi AICEE Security Intelligence &amp; Google Gemini AI</span>
          </div>
          <p>© {new Date().getFullYear()} AICEE. Tất cả các quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;