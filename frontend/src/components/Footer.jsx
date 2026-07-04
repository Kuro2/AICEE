import React from 'react';
import { Shield, Facebook, Twitter, Send } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 border-t border-blue-700/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Logo và thông tin */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/logo-aicee.png" 
                alt="AICEE Logo" 
                className="w-20 h-20 object-contain"
              />
              <span className="text-2xl font-bold text-white">AICEE</span>
            </div>
            <p className="text-gray-400 mb-4">
              AICEE có cơ sở trên cửa hàng tiện ích mở rộng của các trình duyệt sau: Microsoft Edge, Chrome, Cốc Cốc, Brave và FireFox.
            </p>
          </div>

          {/* Mạng xã hội */}
          <div>
            <h3 className="text-white font-semibold mb-4">Tham gia nhóm cộng đồng</h3>
            <div className="flex space-x-4">
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