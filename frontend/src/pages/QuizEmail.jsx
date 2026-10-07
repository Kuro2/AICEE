import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw, Mail, AlertTriangle, ShieldCheck, Sparkles, Paperclip, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuizEmail = () => {
  const emails = [
    {
      id: 1,
      sender: 'Techcombank Support <security-alert@techcom-security.net>',
      subject: '🚨 CẢNH BÁO: Tài khoản của bạn sẽ bị tạm ngưng sau 12 giờ',
      date: 'Hôm nay, 10:45 AM',
      body: 'Kính gửi Quý khách,\n\nHệ thống ghi nhận một lượt đăng nhập bất thường từ thiết bị lạ tại Singapore. Để đảm bảo an toàn, vui lòng truy cập đường dẫn dưới đây và nhập mã OTP xác thực hủy giao dịch ngay lập tức.\n\nNếu không thực hiện trong vòng 12h, tài khoản của bạn sẽ bị đóng băng vĩnh viễn.',
      linkText: '👉 Nhấp vào đây để xác minh tài khoản an toàn',
      isPhishing: true,
      explanation: 'Đây là EMAIL LỪA ĐẢO NGUY HIỂM! Ngân hàng không bao giờ gửi mail từ đuôi lạ như @techcom-security.net (tên miền chính thức là techcombank.com.vn). Thủ đoạn tạo áp lực thời gian "sau 12 giờ" và đòi hỏi mã OTP là đặc trưng của tội phạm mạng.',
    },
    {
      id: 2,
      sender: 'Google Security <no-reply@accounts.google.com>',
      subject: 'Cảnh báo bảo mật: Thiết bị mới vừa đăng nhập',
      date: 'Hôm qua, 18:20 PM',
      body: 'Tài khoản Google của bạn vừa được đăng nhập trên Windows (Chrome) tại Hà Nội, Việt Nam.\n\nNếu đây là bạn, bạn không cần làm gì cả. Nếu đây không phải là bạn, hãy kiểm tra hoạt động thiết bị và bảo mật tài khoản trong Cài đặt Google.',
      linkText: 'Kiểm tra hoạt động thiết bị',
      isPhishing: false,
      explanation: 'Đây là EMAIL CHÍNH HÃNG từ Google (@accounts.google.com). Google thông báo sự kiện bảo mật bình thường và không hề yêu cầu bạn cung cấp mật khẩu hay mã OTP qua email.',
    },
    {
      id: 3,
      sender: 'Netflix Billing <support-payment@netflix-member-renew.xyz>',
      subject: 'Thanh toán gói thuê bao tháng này không thành công',
      date: '3 ngày trước',
      body: 'Gói đăng ký Netflix của bạn đã bị từ chối thanh toán. Vui lòng cập nhật thông tin thẻ tín dụng (số thẻ, ngày hết hạn và số CVV) để tiếp tục thưởng thức các bộ phim yêu thích mà không bị gián đoạn.',
      linkText: 'Cập nhật thẻ tín dụng ngay',
      isPhishing: true,
      explanation: 'EMAIL PHISHING RÕ RỆT! Netflix chỉ gửi email từ @netflix.com, không bao giờ dùng đuôi tên miền rẻ tiền .xyz. Đường link sẽ dẫn bạn tới form đánh cắp toàn bộ thông tin thẻ tín dụng/Visa/MasterCard.',
    },
    {
      id: 4,
      sender: 'Shopee Rewards <hotro@shopee.vn>',
      subject: 'Thông báo: Đơn hàng #SP892348 đã được giao thành công',
      date: '5 ngày trước',
      body: 'Đơn hàng của bạn đã được đơn vị vận chuyển giao thành công. Vui lòng kiểm tra hàng và xác nhận "Đã nhận hàng" trên ứng dụng Shopee để nhận Xu tích lũy.',
      linkText: 'Xem chi tiết đơn hàng trong app',
      isPhishing: false,
      explanation: 'EMAIL CHÍNH HÃNG của sàn thương mại điện tử Shopee (đuôi @shopee.vn). Email chỉ cập nhật trạng thái đơn hàng thông thường và hướng dẫn người dùng thao tác trong ứng dụng chính thức.',
    },
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // true = Phishing, false = Legitimate
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentEmail = emails[currentIdx];

  const handleSelect = (choice) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(choice);
    if (choice === currentEmail.isPhishing) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < emails.length) {
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
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-3xl">
          {/* Back button */}
          <Link 
            to="/resources" 
            className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-cyan-400 mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Quay lại Trung tâm Tài nguyên
          </Link>

          {!isCompleted ? (
            <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl">
              {/* Header Progress */}
              <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">
                      Mini Game Luyện Tập
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                      Thử Thách Bắt Bài Email Lừa Đảo
                    </h1>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-400 block">Tiến độ</span>
                  <span className="text-lg font-bold text-cyan-400 font-mono">
                    {currentIdx + 1} / {emails.length}
                  </span>
                </div>
              </div>

              {/* Mock Email Client Container */}
              <div className="mb-8 rounded-2xl bg-slate-900/90 border border-white/15 overflow-hidden shadow-inner">
                {/* Email Header Bar */}
                <div className="p-4 bg-slate-800/80 border-b border-white/10 space-y-2">
                  <div className="flex items-baseline justify-between text-xs text-gray-400">
                    <span className="font-semibold text-white">Người gửi:</span>
                    <span>{currentEmail.date}</span>
                  </div>
                  <p className="text-sm font-mono text-cyan-300 break-all">
                    {currentEmail.sender}
                  </p>
                  <div className="pt-1">
                    <span className="text-xs text-gray-400 font-semibold">Tiêu đề: </span>
                    <span className="text-sm font-bold text-white">{currentEmail.subject}</span>
                  </div>
                </div>

                {/* Email Content Body */}
                <div className="p-6 text-sm text-gray-300 leading-relaxed space-y-4">
                  <p className="whitespace-pre-line">{currentEmail.body}</p>

                  <div className="pt-2">
                    <span className="inline-block px-4 py-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold hover:underline cursor-not-allowed">
                      {currentEmail.linkText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decision Choice */}
              <p className="text-center text-sm font-semibold text-gray-300 mb-4">
                Dựa trên địa chỉ người gửi và nội dung trên, email này là:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <button
                  disabled={selectedAnswer !== null}
                  onClick={() => handleSelect(false)}
                  className={`p-5 rounded-2xl border font-bold text-base transition-all flex items-center justify-center space-x-2 ${
                    selectedAnswer === null
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:scale-[1.02]'
                      : selectedAnswer === false
                      ? !currentEmail.isPhishing
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                        : 'bg-red-500 border-red-400 text-white'
                      : !currentEmail.isPhishing
                      ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300'
                      : 'opacity-40 border-white/10 text-gray-500'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Email Hợp Lệ (Chính thức)</span>
                </button>

                <button
                  disabled={selectedAnswer !== null}
                  onClick={() => handleSelect(true)}
                  className={`p-5 rounded-2xl border font-bold text-base transition-all flex items-center justify-center space-x-2 ${
                    selectedAnswer === null
                      ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-300 hover:scale-[1.02]'
                      : selectedAnswer === true
                      ? currentEmail.isPhishing
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                        : 'bg-red-500 border-red-400 text-white'
                      : currentEmail.isPhishing
                      ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300'
                      : 'opacity-40 border-white/10 text-gray-500'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>Email Lừa Đảo (Phishing)</span>
                </button>
              </div>

              {/* Feedback box */}
              {selectedAnswer !== null && (
                <div className={`p-6 rounded-2xl border mb-6 ${
                  selectedAnswer === currentEmail.isPhishing
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  <div className="flex items-center space-x-2 font-bold mb-2">
                    {selectedAnswer === currentEmail.isPhishing ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>Chính xác! Bạn nhận được +1 điểm.</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-400" />
                        <span>Chưa chính xác! Hãy lưu ý phân tích bên dưới.</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    {currentEmail.explanation}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                    <button
                      onClick={handleNext}
                      className="px-6 py-2 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                      {currentIdx + 1 < emails.length ? 'Email tiếp theo →' : 'Xem kết quả'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Result Screen */
            <div className="p-10 sm:p-12 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl text-center">
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-cyan-400" />
              </div>

              <h2 className="text-3xl font-extrabold text-white mb-2">
                Hoàn Thành Thử Thách Email!
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Bạn đã phân tích đúng <strong className="text-cyan-400 text-lg font-bold">{score}/{emails.length}</strong> email.
              </p>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 max-w-md mx-auto mb-8">
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 block mb-1">
                  Đánh giá khả năng phòng vệ Hộp thư
                </span>
                <p className="text-base font-bold text-cyan-300">
                  {score === 4 ? '🛡️ Tuyệt vời! Bạn có mắt nhìn của chuyên gia săn bắt mã độc!' :
                   score >= 2 ? '⚠️ Khá tốt! Hãy luôn kiểm tra kỹ đuôi tên miền @sau chữ @ để tránh bị lừa.' :
                   '🚨 Cảnh báo! Hãy sử dụng tính năng Chatbox AI của AICEE để kiểm tra bất kỳ email lạ nào trước khi click link.'}
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
                  to="/quiz/fake"
                  className="px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Chuyển sang Trắc nghiệm Website Thật/Giả
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

export default QuizEmail;
