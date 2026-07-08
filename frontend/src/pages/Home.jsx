import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, Lock, Globe, Eye, AlertTriangle, CheckCircle, Search, ArrowRight, Sparkles } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: 'Bảo vệ toàn diện',
      description: 'Công cụ của chúng tôi sử dụng cánh báo khi bạn truy cập các trang web nguy hiểm, lừa đảo, giả mạo.',
      icon: Shield,
    },
    {
      title: 'Kiểm tra nhanh chóng',
      description: 'Chỉ cần nhập URL, số điện thoại hoặc email để kiểm tra ngay lập tức và nhận kết quả trong vòng vài giây.',
      icon: Search,
    },
    {
      title: 'AI hỗ trợ 24/7',
      description: 'Trí tuệ nhân tạo của chúng tôi sẵn sàng tư vấn và hỗ trợ bạn mọi lúc, mọi nơi.',
      icon: Sparkles,
    },
  ];

  const protectionLevels = [
    {
      level: 'An toàn',
      color: 'from-green-500 to-emerald-600',
      icon: CheckCircle,
      description: 'Trang web đáng tin cậy',
    },
    {
      level: 'Cảnh báo',
      color: 'from-yellow-500 to-orange-500',
      icon: AlertTriangle,
      description: 'Cần thận khi truy cập',
    },
    {
      level: 'Nguy hiểm',
      color: 'from-red-500 to-rose-600',
      icon: AlertTriangle,
      description: 'Không nên truy cập',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-block">
                <span className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-medium">
                  Bảo vệ trực tuyến
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                BẠN CÓ ĐANG
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  LƯỚT MẠNG AN TOÀN?
                </span>
              </h1>

              <p className="text-xl text-gray-300">
                Để AICEE bảo vệ bạn khỏi các mối đe dọa trực tuyến, lừa đảo.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/chatbox')}
                  className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg hover:shadow-cyan-500/50 font-semibold text-lg flex items-center justify-center space-x-2"
                  data-testid="hero-chatbox-btn"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Trò chuyện với AI</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700 font-semibold text-lg"
                >
                  Tìm hiểu thêm
                </button>
              </div>
            </div>

            {/* Right - Illustration */}
            <div className="relative">
              <div className="relative w-full max-w-md mx-auto">
                {/* Main Shield Circle */}
                <div className="relative w-80 h-80 mx-auto">
                  {/* Outer Ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 animate-spin-slow"></div>
                  <div className="absolute inset-4 rounded-full border-4 border-blue-500/30 animate-spin-slow-reverse"></div>

                  {/* Center Logo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-2xl"></div>
                      <img
                        src="/logo-aicee.png"
                        alt="AICEE Logo"
                        className="relative z-10 object-contain"
                        style={{ width: '624px', height: '624px' }}
                      />
                    </div>
                  </div>

                  {/* Floating Icons */}
                  <div className="absolute top-0 right-0 animate-float">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 animate-float-delayed">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg">
                      <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <div className="absolute top-1/2 -right-8 animate-float">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              TIỆN ÍCH MIỄN PHÍ
            </h2>
            <p className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold">
              AN TOÀN TRONG TẦM TAY
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20"
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 rounded-2xl transition-all"></div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4">
                      {feature.title}
                    </h3>

                    <p className="text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Protection Levels Section */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              CÁCH HOẠT ĐỘNG
            </h2>
            <p className="text-xl text-gray-400">
              AN TÂM TRÊN MỌI NGỔ NGÁCH
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {protectionLevels.map((level, index) => {
              const Icon = level.icon;
              return (
                <div
                  key={index}
                  className="text-center space-y-4"
                >
                  <div className="relative w-32 h-32 mx-auto">
                    <div className={`absolute inset-0 bg-gradient-to-br ${level.color} rounded-full opacity-20 blur-xl"`}></div>
                    <div className={`relative w-32 h-32 bg-gradient-to-br ${level.color} rounded-full flex items-center justify-center shadow-xl`}>
                      <Icon className="w-16 h-16 text-white" strokeWidth={2} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white">
                    {level.level}
                  </h3>

                  <p className="text-gray-400">
                    {level.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/chatbox')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg hover:shadow-cyan-500/50 font-semibold text-lg"
            >
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl border border-cyan-500/30 p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              BẢO VỆ BẢN THÂN
            </h2>
            <p className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold mb-8">
              NGAY HÔM NAY
            </p>

            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => navigate('/chatbox')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg hover:shadow-cyan-500/50 font-semibold"
              >
                🛡️ Cài đặt tiện ích
              </button>

              <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-semibold">
                🔒 Chống tin nhắn/cuộc gọi rác
              </button>

              <button className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl transition-all font-semibold">
                🔍 Trác nghiệm thử/giả
              </button>

              <button className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all font-semibold">
                ⚠️ Trác nghiệm về Email lừa đảo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards Section */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-12">Xem Thêm</h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group">
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                Thông tin hữu ích
              </h3>
              <ArrowRight className="w-6 h-6 text-cyan-400 group-hover:translate-x-2 transition-transform" />
            </div>

            <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group">
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                Điều khoản sử dụng
              </h3>
              <ArrowRight className="w-6 h-6 text-cyan-400 group-hover:translate-x-2 transition-transform" />
            </div>

            <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group">
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                Chính sách bảo mật
              </h3>
              <ArrowRight className="w-6 h-6 text-cyan-400 group-hover:translate-x-2 transition-transform" />
            </div>

            <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group">
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                Xem thêm
              </h3>
              <ArrowRight className="w-6 h-6 text-cyan-400 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Browser Support Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-8">Có mặt trên mọi trình duyệt</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <span className="text-gray-400 text-lg">Microsoft Edge</span>
            <span className="text-gray-400 text-lg">Chrome</span>
            <span className="text-gray-400 text-lg">Cốc Cốc</span>
            <span className="text-gray-400 text-lg">Firefox</span>
            <span className="text-gray-400 text-lg">Brave</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;