import React from 'react';
import { Shield, Facebook, Twitter, Send } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 border-t border-blue-700/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo và thông tin */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-8 h-8 text-cyan-400" />
              <span className="text-2xl font-bold text-white">Chống Lừa Đảo</span>
            </div>
            <p className="text-gray-400 mb-4">
              ChongLuaDao có cơ sở trên cửa hàng tiện ích mở rộng của các trình duyệt sau: Microsoft Edge, Chrome, Cốc Cốc, Brave và FireFox.
            </p>
            <div className="text-gray-500 text-sm space-y-1">
              <p>Bản quyền © ChongLuaDao 2026</p>
              <p>Liên hệ: <a href="mailto:info@chongluadao.vn" className="text-cyan-400 hover:text-cyan-300">info@chongluadao.vn</a></p>
              <p className="mt-2">Công ty TNHH Doanh Nghiệp Về Hỗ Chống Lừa Đảo</p>
              <p>Mã Số thuế: 0317048919</p>
            </div>
          </div>

          {/* Đối tác */}
          <div>
            <h3 className="text-white font-semibold mb-4">Thành viên Hiệp hội</h3>
            <div className="space-y-2 text-gray-400">
              <p>• Thành viên Hiệp hội an ninh mạng Quốc gia</p>
              <p>• Thành viên Liên minh An toàn không gian số</p>
              <p>• Đăng ký kết hợp Cloudflare</p>
              <p>• Project Galileo</p>
            </div>
          </div>

          {/* Mạng xã hội */}
          <div>
            <h3 className="text-white font-semibold mb-4">Tham gia nhóm cộng đồng</h3>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-blue-500 hover:bg-blue-400 rounded-full flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-cyan-500 hover:bg-cyan-400 rounded-full flex items-center justify-center transition-colors">
                <Send className="w-5 h-5 text-white" />
              </a>
            </div>
            <div className="text-gray-500 text-sm">
              <p>Thiết kế bởi: <span className="text-cyan-400">Collective Design Agency</span></p>
              <p className="mt-1">Viết mã bởi: <span className="text-cyan-400">OLD Team</span></p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
          <p>Trang web này được bảo hộ bởi <span className="text-cyan-400">reCAPTCHA</span> và <span className="text-cyan-400">Chính sách Bảo mật</span> và <span className="text-cyan-400">Điều khoản dịch vụ</span> của Google được áp dụng.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;