import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, Settings, Cpu, ShieldCheck, Zap, Database, Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  const steps = [
    {
      num: '01',
      title: 'Thu thập & Đa kênh Tiếp nhận (Data Ingestion)',
      desc: 'Hệ thống tiếp nhận dữ liệu đầu vào qua nhiều phương thức: Tên miền, URL đầy đủ, nội dung SMS, file ảnh chụp màn hình hoặc địa chỉ email nghi vấn. Dữ liệu được chuẩn hóa và loại bỏ các ký tự gây nhiễu.',
      icon: <Database className="w-6 h-6 text-cyan-400" />,
      badges: ['Multi-modal Input', 'URL Normalization', 'Anti-obfuscation'],
    },
    {
      num: '02',
      title: 'Đối chiếu Cơ sở Dữ liệu Mối đe dọa (Threat Intelligence)',
      desc: 'Hệ thống tự động tra cứu tức thì trên kho cơ sở dữ liệu Blacklist quốc tế và Blacklist độc quyền của AICEE (đặc thù lừa đảo tại Việt Nam: giả mạo VNeID, giả mạo biên lai ngân hàng, cổng tuyển dụng fake).',
      icon: <Search className="w-6 h-6 text-blue-400" />,
      badges: ['Local VN Context', 'Global Threat Feeds', '0.05s Query Time'],
    },
    {
      num: '03',
      title: 'Suy luận bằng AI Đa phương thức (Google Gemini Engine)',
      desc: 'Mô hình AI đọc hiểu ngữ nghĩa của văn bản và hình ảnh, tìm kiếm các mẫu hành vi thao túng tâm lý (FOMO, đe dọa tố tụng, quà tặng ảo), đồng thời kiểm tra tuổi thọ tên miền (WHOIS) và chứng chỉ bảo mật.',
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      badges: ['Gemini 1.5 Pro', 'Behavioral NLP', 'OCR Image Scanning'],
    },
    {
      num: '04',
      title: 'Chấm điểm Rủi ro & Hướng dẫn Tức thì (Scoring & Action)',
      desc: 'Kết quả được tổng hợp thành thang điểm an toàn minh bạch (An toàn, Cảnh báo, Nguy hiểm) kèm theo giải thích chi tiết lý do AI đánh giá và các bước hành động cụ thể để người dùng không mắc bẫy.',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      badges: ['Explainable AI', 'Instant Action Plan', 'Confidence Score'],
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-purple-500/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

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

          {/* Hero Banner */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-purple-950/40 via-slate-900/40 to-slate-950/60 border border-purple-500/30 backdrop-blur-2xl shadow-2xl mb-12">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
                <Settings className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                  Kiến Trúc Công Nghệ
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
                  Cơ Chế Hoạt Động Của AICEE
                </h1>
              </div>
            </div>
            <p className="text-gray-300 text-base leading-relaxed max-w-3xl mt-4">
              Khám phá đường ống xử lý dữ liệu thông minh kết hợp giữa cơ sở dữ liệu an ninh mạng theo thời gian thực và mô hình Trí tuệ Nhân tạo thế hệ mới của Google.
            </p>
          </div>

          {/* Timeline Process */}
          <div className="space-y-6 relative mb-16">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="group relative p-8 rounded-3xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-purple-500/40 backdrop-blur-xl transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {step.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xs font-mono font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                          BƯỚC {step.num}
                        </span>
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">
                        {step.desc}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {step.badges.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className="text-xs font-medium px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Core Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
              <div className="text-3xl font-extrabold text-cyan-400 mb-2">&lt; 3 Giây</div>
              <h4 className="font-semibold text-white mb-1">Tốc độ Phân tích</h4>
              <p className="text-xs text-gray-400">Trả lời tức thời ngay cả với dữ liệu ảnh phức tạp</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
              <div className="text-3xl font-extrabold text-purple-400 mb-2">99.8%</div>
              <h4 className="font-semibold text-white mb-1">Độ chính xác AI</h4>
              <p className="text-xs text-gray-400">Nhận diện chính xác các biến thể lừa đảo mới</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
              <div className="text-3xl font-extrabold text-emerald-400 mb-2">24/7/365</div>
              <h4 className="font-semibold text-white mb-1">Bảo vệ Chủ động</h4>
              <p className="text-xs text-gray-400">Liên tục cập nhật dữ liệu từ nguồn tin tình báo</p>
            </div>
          </div>

          {/* CTA Box */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 to-cyan-950/60 border border-purple-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Trải nghiệm ngay khả năng phân tích của AI</h3>
              <p className="text-gray-300 text-sm">Gửi thử một đường link hoặc ảnh chụp màn hình để xem AI phân tích.</p>
            </div>
            <Link
              to="/chatbox"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] shrink-0"
            >
              Thử nghiệm Chatbox
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
