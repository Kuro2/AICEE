import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Check, Info, Loader, Sparkles, Building, Code2, QrCode, X } from 'lucide-react';
import { subscriptionAPI, authAPI } from '@/services/api';

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, plan: null, amount: 0 });
  const navigate = useNavigate();
  const [user, setUser] = useState(() => authAPI.getCurrentUser());

  const handleUpgrade = (planId, priceString) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (planId === 'free') return; 
    
    // Tính số tiền thực (loại bỏ ký tự đ và dấu chấm)
    const amount = parseInt(priceString.replace(/\D/g, ''));

    // Mở modal thanh toán QR
    setPaymentModal({ isOpen: true, plan: planId, amount });
  };

  const confirmPayment = async () => {
    const token = localStorage.getItem('aicee_token');
    if (!token) {
      alert('🔒 Bạn cần đăng nhập để thực hiện nâng cấp gói cước.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await subscriptionAPI.upgradePlan(paymentModal.plan);
      if (res && res.success) {
        const upgradedPlan = res.data?.plan || paymentModal.plan;
        alert('🎉 Thanh toán thành công! Gói cước của bạn đã được nâng cấp lên ' + upgradedPlan.toUpperCase() + '.');
        
        if (user) {
          const updatedUser = { 
            ...user, 
            plan: upgradedPlan, 
            subscriptionExpires: res.data?.subscriptionExpires 
          };
          localStorage.setItem('aicee_user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } else {
        alert(res?.message || 'Lỗi khi nâng cấp gói cước');
      }
    } catch (error) {
      console.error('Lỗi thanh toán / nâng cấp:', error);
      const errorMsg = error.data?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại.';
      alert(errorMsg);
    } finally {
      setLoading(false);
      setPaymentModal({ isOpen: false, plan: null, amount: 0 });
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Gói Free',
      description: 'Dành cho cá nhân kiểm tra rủi ro cơ bản.',
      price: '0đ',
      period: '/ tháng',
      buttonText: 'Gói hiện tại',
      buttonAction: () => handleUpgrade('free', '0'),
      highlight: false,
      features: [
        'Giới hạn 5 lượt quét/ngày',
        'Kiểm tra chủ động URL, SMS, Email',
        'Cảnh báo mức độ rủi ro (Risk Scoring)',
        'Khuyến nghị hành động cơ bản',
        'Lịch sử duyệt lưu ngắn hạn (7 ngày)'
      ]
    },
    {
      id: 'premium',
      name: 'Gói Premium',
      description: 'Bảo vệ toàn diện, không giới hạn.',
      price: '49.000đ',
      period: '/ tháng',
      buttonText: 'Nâng cấp Premium',
      buttonAction: (price) => handleUpgrade('premium', price),
      highlight: true, 
      features: [
        'Tất cả tính năng của gói Free',
        'Không giới hạn lượt quét/ngày',
        'Lưu trữ lịch sử quét vĩnh viễn',
        'Phân tích đa định dạng (Ảnh, Màn hình)',
        'Giải thích rủi ro bằng AI (Explainable AI)',
        'Bài học giáo dục an ninh mạng'
      ],
      icon: <Sparkles className="w-5 h-5 ml-2 inline-block text-yellow-400" />
    },
    {
      id: 'business',
      name: 'Gói Business',
      description: 'Dành cho Trường học & Tổ chức.',
      price: billingCycle === 'yearly' ? '583.000đ' : '625.000đ',
      period: '/ tháng',
      buttonText: 'Đăng ký ngay',
      buttonAction: (price) => handleUpgrade('business', price),
      highlight: false,
      features: [
        'Tất cả tính năng của gói Premium',
        'Bảng điều khiển quản lý tập trung (Dashboard)',
        'Đồng bộ bảo vệ toàn bộ Học sinh/Sinh viên',
        'Tích hợp chương trình nâng cao nhận thức',
        'Báo cáo và thống kê nguy cơ cấp tổ chức',
        'Hỗ trợ kỹ thuật 24/7 ưu tiên'
      ],
      icon: <Building className="w-5 h-5 ml-2 inline-block text-blue-400" />
    },
    {
      id: 'api',
      name: 'Platform API',
      description: 'Tích hợp API và White-label cho doanh nghiệp.',
      price: '2.000.000đ',
      period: '/ tháng',
      buttonText: 'Nâng cấp API',
      buttonAction: (price) => handleUpgrade('api', price),
      highlight: false,
      features: [
        'Cấp quyền gọi API Phân tích lõi',
        'Chấm điểm rủi ro & Khuyến nghị hành động',
        'White-label: Áp dụng dưới tên thương hiệu riêng',
        'Sử dụng chung nguồn dữ liệu AICEE (VN context)',
        'Tích hợp không giới hạn (Rate limit cao)'
      ],
      icon: <Code2 className="w-5 h-5 ml-2 inline-block text-purple-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <Header />
      
      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-gray-300">Nâng tầm bảo mật với AI</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-600 text-center mb-6 tracking-tight">
          Bảo vệ thông minh hơn
        </h1>
        <p className="text-gray-400 text-center max-w-2xl mb-12 text-lg md:text-xl font-light leading-relaxed">
          Lựa chọn gói cước phù hợp để bảo vệ bạn, gia đình và tổ chức khỏi các mối đe dọa trên không gian mạng.
        </p>

        {/* Toggle Switch */}
        <div className="flex bg-white/5 p-1.5 rounded-full mb-16 border border-white/10 backdrop-blur-md shadow-2xl relative">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
              billingCycle === 'monthly' 
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg border border-white/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Thanh toán Tháng
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              billingCycle === 'yearly' 
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg border border-white/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Thanh toán Năm
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              billingCycle === 'yearly' ? 'bg-cyan-500 text-white' : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              Giảm 20%
            </span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl w-full mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative flex flex-col rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-2 group ${
                plan.highlight 
                  ? 'bg-gradient-to-b from-[#111827] to-[#030712] border border-cyan-500/50 shadow-[0_0_60px_-15px_rgba(6,182,212,0.4)]' 
                  : 'bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.04] backdrop-blur-xl'
              }`}
            >
              {plan.highlight && (
                <>
                  {/* Premium Glow inner */}
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem] pointer-events-none"></div>
                  
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                      Khuyên dùng
                    </div>
                  </div>
                </>
              )}

              <div className="mb-8 relative z-10">
                <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                  {plan.icon}
                  {plan.name}
                </h3>
                <p className="text-gray-400 text-sm h-12 leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-8 flex items-baseline relative z-10 flex-wrap">
                <span className="text-4xl xl:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                  {plan.price}
                </span>
                {plan.id !== 'free' && (
                  <span className="text-gray-500 ml-2 font-medium">{plan.period}</span>
                )}
              </div>

              {(() => {
                const currentPlanId = (user?.plan || 'free').toLowerCase();
                const isCurrentPlan = currentPlanId === plan.id || (currentPlanId === 'platform-api' && plan.id === 'api');
                return (
                  <button
                    onClick={() => plan.buttonAction(plan.price)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold transition-all duration-300 mb-8 flex items-center justify-center gap-2 relative overflow-hidden group/btn ${
                      isCurrentPlan
                        ? 'opacity-85 cursor-default bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : plan.highlight
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-95'
                          : 'bg-white text-black hover:bg-gray-100 hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    {plan.highlight && !isCurrentPlan && (
                      <div className="absolute inset-0 -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"></div>
                    )}
                    <span className="relative z-10">{isCurrentPlan ? '✓ Gói hiện tại của bạn' : plan.buttonText}</span>
                  </button>
                );
              })()}

              <div className="space-y-4 flex-1 relative z-10">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start group/feature">
                    <div className={`mt-0.5 mr-3 rounded-full p-0.5 transition-colors ${
                      plan.highlight ? 'bg-cyan-500/20 text-cyan-400 group-hover/feature:bg-cyan-500/30' : 'bg-white/5 text-gray-400 group-hover/feature:text-gray-200'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-gray-300 text-sm leading-relaxed group-hover/feature:text-white transition-colors">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* FAQ or Info Section */}
        <div className="mt-20 flex items-center justify-center gap-3 text-gray-400 bg-white/[0.02] px-6 py-4 rounded-full border border-white/5 backdrop-blur-md">
          <div className="bg-cyan-500/20 p-1.5 rounded-full">
            <Info className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-sm font-medium">Gói Business dành cho doanh nghiệp mua theo năm sẽ tiết kiệm hơn 7%.</span>
        </div>
      </main>

      {/* Payment Modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Decorative background */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cyan-900/30 to-transparent rounded-t-[2rem] pointer-events-none"></div>

            <button 
              onClick={() => setPaymentModal({ isOpen: false, plan: null, amount: 0 })}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8 relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)] transform rotate-3">
                <QrCode className="w-10 h-10 text-white -rotate-3" />
              </div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">Thanh toán VNPay</h2>
              <p className="text-gray-400">Nâng cấp lên gói <span className="text-cyan-400 font-bold uppercase tracking-wider">{paymentModal.plan}</span></p>
            </div>

            <div className="bg-white p-4 rounded-3xl flex items-center justify-center mb-8 shadow-xl relative z-10 group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl opacity-50 blur-xl group-hover:opacity-75 transition-opacity duration-500 -z-10"></div>
              {/* VietQR Image API */}
              <img 
                src={`https://img.vietqr.io/image/MB-1903673562013-compact2.png?amount=${paymentModal.amount}&addInfo=AICEE%20${user?.email?.split('@')[0]}%20${paymentModal.plan}&accountName=AICEE%20TECH`} 
                alt="QR Code" 
                className="w-full max-w-[220px] object-contain rounded-2xl relative z-10"
              />
            </div>

            <div className="space-y-4 mb-8 bg-white/5 p-5 rounded-2xl border border-white/10 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-medium">Số tiền chuyển:</span>
                <span className="text-white font-bold text-lg">{paymentModal.amount.toLocaleString()} VNĐ</span>
              </div>
              <div className="h-px w-full bg-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-medium">Nội dung (Bắt buộc):</span>
                <span className="text-cyan-400 font-bold bg-cyan-400/10 px-3 py-1 rounded-lg">AICEE {user?.email?.split('@')[0]} {paymentModal.plan}</span>
              </div>
            </div>

            <button
              onClick={confirmPayment}
              disabled={loading}
              className="w-full py-4 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 relative z-10"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Xác nhận đã thanh toán'}
            </button>
            <p className="text-center text-xs text-gray-500 mt-5 font-medium">Hệ thống sẽ tự động xác nhận trong vài phút.</p>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Pricing;
