import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  Check, X, Zap, Shield, Sparkles, MessageSquare,
  FileSearch, ArrowRight, HelpCircle, ChevronDown, ChevronUp, Loader
} from 'lucide-react';
import { authAPI, paymentAPI } from '@/services/api';

const Pricing = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const user = authAPI.getCurrentUser();
    setCurrentUser(user);

    // Lấy profile mới nhất nếu đã đăng nhập
    if (authAPI.isLoggedIn()) {
      authAPI.getMe().then((res) => {
        if (res.success && res.data?.user) {
          setCurrentUser(res.data.user);
          localStorage.setItem('aicee_user', JSON.stringify(res.data.user));
        }
      }).catch(() => {});
    }
  }, []);

  const handleSelectPlan = async (planKey) => {
    setErrorMsg(null);

    if (planKey === 'free') {
      navigate('/chatbox');
      return;
    }

    if (!authAPI.isLoggedIn()) {
      navigate('/login?redirect=/pricing');
      return;
    }

    const planType = billingCycle === 'yearly' ? 'premium_yearly' : 'premium_monthly';
    setLoadingPlan(planKey);

    try {
      const res = await paymentAPI.create(planType, 'vnpay');
      if (res.success && res.data?.paymentUrl) {
        // Chuyển hướng tới trang thanh toán (VNPay hoặc Simulator)
        window.location.href = res.data.paymentUrl;
      } else {
        throw new Error(res.message || 'Không thể tạo đơn thanh toán');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi khởi tạo đơn hàng. Vui lòng thử lại.');
      setLoadingPlan(null);
    }
  };

  const isUserPremium = currentUser?.isPremium || (currentUser?.plan === 'premium');

  const faqs = [
    {
      q: 'Lưu lịch sử chat hoạt động như thế nào đối với tài khoản Premium?',
      a: 'Với tài khoản Premium, toàn bộ cuộc hội thoại của bạn với trợ lý AI sẽ tự động được lưu trữ an toàn trên đám mây. Bạn có thể xem lại, đổi tên hoặc tiếp tục bất kỳ phiên chat nào bất kỳ lúc nào.'
    },
    {
      q: 'Phương thức thanh toán nào được chấp nhận?',
      a: 'AICEE hỗ trợ thanh toán qua VNPay (hỗ trợ tất cả ngân hàng nội địa, thẻ Visa/MasterCard, ví điện tử) và QR Code quét nhanh.'
    },
    {
      q: 'Tôi có thể hủy gói hoặc gia hạn bất kỳ lúc nào không?',
      a: 'Gói dịch vụ không tự động trừ tiền khi hết hạn. Bạn có quyền chủ động gia hạn bất cứ lúc nào bạn cần mà không lo phát sinh phụ phí ẩn.'
    },
    {
      q: 'Nếu tôi đang dùng gói tháng và muốn nâng cấp lên năm thì sao?',
      a: 'Thời hạn còn lại của gói tháng sẽ được cộng dồn trực tiếp vào thời hạn gói năm mới của bạn.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white flex flex-col">
      <Header />

      <main className="flex-grow pt-28 pb-20 px-4">
        {/* Hero Section */}
        <div className="container mx-auto max-w-6xl text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>Nâng Cấp Trải Nghiệm Bảo Mật AI</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Chọn Gói Bảo Vệ Phù Hợp Cho Bạn
          </h1>

          <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
            Trang bị lá chắn AI bảo vệ bạn trước mọi hiểm họa mạng, lừa đảo trực tuyến và lưu trữ lịch sử tư vấn không giới hạn.
          </p>

          {/* Toggle Billing Cycle */}
          <div className="flex items-center justify-center pt-4">
            <div className="bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 flex items-center space-x-2 backdrop-blur-md">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Gói Hàng Tháng
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all flex items-center space-x-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>Gói 1 Năm</span>
                <span className="bg-amber-400/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold border border-amber-400/40">
                  Tiết kiệm 32%
                </span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="max-w-md mx-auto p-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-8 items-stretch text-left">
            {/* Free Tier */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all backdrop-blur-sm">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Miễn Phí</h3>
                    <p className="text-gray-400 text-sm mt-1">Dành cho nhu cầu tra cứu an toàn cơ bản</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800 text-gray-300">
                    <Shield className="w-6 h-6" />
                  </div>
                </div>

                <div className="my-6">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-extrabold text-white">0đ</span>
                    <span className="text-gray-400">/ mãi mãi</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Không cần thẻ thanh toán</p>
                </div>

                <div className="space-y-3.5 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center space-x-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Quét nhanh URL, Email, SĐT (10 lần/ngày)</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Chatbot AI phân tích an ninh mạng</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Xem tin tức & kho dữ liệu lừa đảo</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <X className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span>Lưu lịch sử các cuộc trò chuyện</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <X className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span>Phân tích tải lên tệp tin dung lượng lớn</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <X className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span>Tốc độ phản hồi AI ưu tiên</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handleSelectPlan('free')}
                  disabled={!isUserPremium && authAPI.isLoggedIn()}
                  className="w-full py-3.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white font-medium transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {!isUserPremium && authAPI.isLoggedIn() ? 'Gói hiện tại của bạn' : 'Bắt đầu miễn phí'}
                </button>
              </div>
            </div>

            {/* Premium Tier */}
            <div className="relative bg-gradient-to-b from-slate-900/90 via-slate-900 to-blue-950/60 border-2 border-cyan-500/60 rounded-3xl p-8 flex flex-col justify-between shadow-2xl shadow-cyan-500/10 hover:border-cyan-400 transition-all backdrop-blur-md">
              {/* Badge Popular */}
              <div className="absolute -top-3.5 right-8 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-cyan-500/30 flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Khuyên dùng</span>
              </div>

              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                      <span>Premium</span>
                      <span className="text-amber-400 text-xs px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 rounded-md font-semibold">
                        VIP
                      </span>
                    </h3>
                    <p className="text-cyan-300/80 text-sm mt-1">Bảo vệ tối đa & Lưu trữ không giới hạn</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>

                <div className="my-6">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-400">
                      {billingCycle === 'yearly' ? '399.000đ' : '49.000đ'}
                    </span>
                    <span className="text-gray-400">
                      /{billingCycle === 'yearly' ? 'năm' : 'tháng'}
                    </span>
                  </div>
                  <p className="text-xs text-cyan-400/90 mt-1 font-medium">
                    {billingCycle === 'yearly' ? 'Chỉ ~33.000đ / tháng (tiết kiệm 189.000đ)' : 'Hủy hoặc gia hạn linh hoạt'}
                  </p>
                </div>

                <div className="space-y-3.5 pt-4 border-t border-cyan-500/20">
                  <div className="flex items-center space-x-3 text-sm text-gray-200">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="font-semibold text-cyan-200">Lưu & tìm kiếm toàn bộ lịch sử chat vĩnh viễn</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-200">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>Không giới hạn số lượt hỏi đáp & phân tích AI</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-200">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>Phân tích tải lên tệp tin, email, hình ảnh chuyên sâu</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-200">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>Ưu tiên băng thông & mô hình AI nhanh nhất</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-200">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>Thông báo khẩn cấp các chiêu trò lừa đảo mới</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-200">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>Huy hiệu thành viên Premium độc quyền</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handleSelectPlan('premium')}
                  disabled={loadingPlan === 'premium'}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 group"
                >
                  {loadingPlan === 'premium' ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : isUserPremium ? (
                    <>
                      <span>Gia Hạn Gói Premium</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      <span>Nâng Cấp Premium Ngay</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="pt-20 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">So Sánh Tính Năng Chi Tiết</h2>
            <div className="overflow-x-auto bg-slate-900/60 rounded-2xl border border-slate-800 p-2 backdrop-blur-md">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-gray-400">
                    <th className="py-4 px-6 font-semibold">Tính năng</th>
                    <th className="py-4 px-6 font-semibold text-center">Gói Miễn Phí</th>
                    <th className="py-4 px-6 font-semibold text-center text-cyan-400">Gói Premium ⭐</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-gray-300">
                  <tr>
                    <td className="py-4 px-6">Quét URL / Email / SĐT lừa đảo</td>
                    <td className="py-4 px-6 text-center">10 lần / ngày</td>
                    <td className="py-4 px-6 text-center font-bold text-cyan-400">Không giới hạn</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6">Hỏi đáp AI Security Assistant</td>
                    <td className="py-4 px-6 text-center">10 câu / ngày</td>
                    <td className="py-4 px-6 text-center font-bold text-cyan-400">Không giới hạn</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                      <span>Lưu trữ lịch sử chat & xem lại</span>
                    </td>
                    <td className="py-4 px-6 text-center text-gray-500">❌ Không hỗ trợ</td>
                    <td className="py-4 px-6 text-center text-emerald-400 font-bold">✅ Không giới hạn</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 flex items-center space-x-2">
                      <FileSearch className="w-4 h-4 text-cyan-400" />
                      <span>Tải tệp tin để phân tích mã độc</span>
                    </td>
                    <td className="py-4 px-6 text-center text-gray-500">❌ Không hỗ trợ</td>
                    <td className="py-4 px-6 text-center text-emerald-400 font-bold">✅ Hỗ trợ đa định dạng</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6">Tốc độ phản hồi AI</td>
                    <td className="py-4 px-6 text-center">Tiêu chuẩn</td>
                    <td className="py-4 px-6 text-center text-cyan-400 font-bold">Ưu tiên cực nhanh</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6">Hỗ trợ kỹ thuật</td>
                    <td className="py-4 px-6 text-center">Cộng đồng</td>
                    <td className="py-4 px-6 text-center text-cyan-400 font-bold">Hỗ trợ 24/7 trực tiếp</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="pt-20 max-w-3xl mx-auto text-left">
            <h2 className="text-2xl font-bold mb-8 text-center flex items-center justify-center space-x-2">
              <HelpCircle className="w-6 h-6 text-cyan-400" />
              <span>Câu Hỏi Thường Gặp</span>
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full py-4 px-6 text-left flex justify-between items-center hover:text-cyan-400 transition-colors"
                  >
                    <span className="font-semibold text-base">{faq.q}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 flex-shrink-0 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 flex-shrink-0 text-gray-500" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4 text-sm text-gray-400 border-t border-slate-800/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
