import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw, ShieldCheck, AlertTriangle, Sparkles, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuizFake = () => {
  const questions = [
    {
      id: 1,
      title: 'Tình huống 1: Đường link tra cứu hóa đơn tiền điện',
      url: 'https://cskh.evnspc.vn/tra-cuu-tien-dien',
      context: 'Bạn nhận được tin nhắn báo tiền điện tháng này với đường dẫn trên. Đây là website thật hay giả?',
      isReal: true,
      explanation: 'Đây là website THẬT. Tên miền kết thúc bằng đuôi chính thức của Tổng công ty Điện lực Miền Nam (evnspc.vn) và sử dụng giao thức HTTPS an toàn.',
    },
    {
      id: 2,
      title: 'Tình huống 2: Link đăng nhập nhận trợ cấp an sinh xã hội',
      url: 'http://baohiemxahoi-vietnam.online/nhan-tro-cap-tet',
      context: 'Tin nhắn SMS Brandname thông báo bạn được nhận trợ cấp 2.500.000đ và yêu cầu nhấn vào link trên.',
      isReal: false,
      explanation: 'Đây là website GIẢ MẠO! Cổng thông tin BHXH Việt Nam chính thức là baohiemxahoi.gov.vn (đuôi .gov.vn của cơ quan nhà nước), không dùng đuôi lạ như .online và không dùng giao thức http không bảo mật.',
    },
    {
      id: 3,
      title: 'Tình huống 3: Cổng xác thực sinh trắc học ngân hàng',
      url: 'https://vietcombank.com.vn-xacthuc-khachhang.cc',
      context: 'Một email thông báo bạn phải cập nhật sinh trắc học khuôn mặt trước 24h nếu không sẽ bị khóa tài khoản.',
      isReal: false,
      explanation: 'Đây là bẫy lừa đảo PHISHING tinh vi! Kẻ gian ghép tên vietcombank vào phần đầu (subdomain), nhưng tên miền gốc thực chất là .cc! Ngân hàng Vietcombank chỉ dùng vietcombank.com.vn.',
    },
    {
      id: 4,
      title: 'Tình huống 4: Cổng Dịch Vụ Công Quốc Gia',
      url: 'https://dichvucong.gov.vn',
      context: 'Bạn truy cập để làm thủ tục cấp đổi giấy phép lái xe và định danh điện tử.',
      isReal: true,
      explanation: 'Đây là website CHÍNH THỐNG của Chính phủ Việt Nam với tên miền đuôi cấp 1 .gov.vn được bảo vệ nghiêm ngặt.',
    },
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // true = Real, false = Fake
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = questions[currentIdx];

  const handleSelect = (choice) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(choice);
    if (choice === currentQ.isReal) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsCompleted(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-yellow-500/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-3xl">
          {/* Back button */}
          <Link 
            to="/resources" 
            className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-yellow-400 mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Quay lại Trung tâm Tài nguyên
          </Link>

          {!isCompleted ? (
            <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl">
              {/* Header Progress */}
              <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-400">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-yellow-400">
                      Mini Game Luyện Tập
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                      Trắc Nghiệm Website Thật / Giả
                    </h1>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-400 block">Tiến độ</span>
                  <span className="text-lg font-bold text-yellow-400 font-mono">
                    {currentIdx + 1} / {questions.length}
                  </span>
                </div>
              </div>

              {/* Question Body */}
              <div className="mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
                  {currentQ.title}
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  {currentQ.context}
                </p>

                {/* Mock Browser URL Bar */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-white/15 flex items-center space-x-3 shadow-inner">
                  <div className="flex space-x-1.5 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs sm:text-sm font-mono text-cyan-300 truncate">
                    {currentQ.url}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <button
                  disabled={selectedAnswer !== null}
                  onClick={() => handleSelect(true)}
                  className={`p-5 rounded-2xl border font-bold text-base transition-all flex items-center justify-center space-x-2 ${
                    selectedAnswer === null
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:scale-[1.02]'
                      : selectedAnswer === true
                      ? currentQ.isReal
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                        : 'bg-red-500 border-red-400 text-white'
                      : currentQ.isReal
                      ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300'
                      : 'opacity-40 border-white/10 text-gray-500'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Website Thật (Chính thống)</span>
                </button>

                <button
                  disabled={selectedAnswer !== null}
                  onClick={() => handleSelect(false)}
                  className={`p-5 rounded-2xl border font-bold text-base transition-all flex items-center justify-center space-x-2 ${
                    selectedAnswer === null
                      ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-300 hover:scale-[1.02]'
                      : selectedAnswer === false
                      ? !currentQ.isReal
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                        : 'bg-red-500 border-red-400 text-white'
                      : !currentQ.isReal
                      ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300'
                      : 'opacity-40 border-white/10 text-gray-500'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>Website Giả mạo (Lừa đảo)</span>
                </button>
              </div>

              {/* Feedback box */}
              {selectedAnswer !== null && (
                <div className={`p-6 rounded-2xl border mb-6 animate-fadeIn ${
                  selectedAnswer === currentQ.isReal
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  <div className="flex items-center space-x-2 font-bold mb-2">
                    {selectedAnswer === currentQ.isReal ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>Chính xác! Bạn nhận được +1 điểm.</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-400" />
                        <span>Chưa chính xác! Hãy lưu ý chi tiết dưới đây.</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    {currentQ.explanation}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                    <button
                      onClick={handleNext}
                      className="px-6 py-2 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                      {currentIdx + 1 < questions.length ? 'Câu tiếp theo →' : 'Xem kết quả'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Result Screen */
            <div className="p-10 sm:p-12 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl text-center">
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-yellow-400" />
              </div>

              <h2 className="text-3xl font-extrabold text-white mb-2">
                Hoàn Thành Thử Thách!
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Bạn đã trả lời đúng <strong className="text-yellow-400 text-lg font-bold">{score}/{questions.length}</strong> câu hỏi.
              </p>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 max-w-md mx-auto mb-8">
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 block mb-1">
                  Đánh giá năng lực phòng vệ
                </span>
                <p className="text-base font-bold text-cyan-300">
                  {score === 4 ? '🛡️ Xuất sắc! Bạn có khả năng nhận diện lừa đảo như chuyên gia!' :
                   score >= 2 ? '⚠️ Tốt! Bạn đã nắm được các nguyên tắc cơ bản nhưng cần cẩn trọng hơn với các tên miền phụ (subdomain).' :
                   '🚨 Cảnh báo! Hãy trang bị thêm kiến thức tại Cẩm nang của AICEE để tránh rơi vào bẫy lừa đảo.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleRestart}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Làm lại thử thách
                </button>
                <Link
                  to="/quiz/email"
                  className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Thử thách Phân tích Email lừa đảo
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuizFake;
