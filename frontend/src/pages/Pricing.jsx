import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  Check, 
  Info, 
  Loader, 
  Sparkles, 
  Building, 
  Code2, 
  QrCode, 
  X, 
  Copy, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { paymentAPI, authAPI } from '@/services/api';

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();
  const [user, setUser] = useState(() => authAPI.getCurrentUser());

  // SePay Payment Modal State
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    orderCode: '',
    plan: null,
    amount: 0,
    qrUrl: '',
    vietQrUrl: '',
    bankInfo: null,
    isPaid: false,
    statusText: 'Đang lắng nghe giao dịch SePay...'
  });

  const [copiedField, setCopiedField] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const pollingRef = useRef(null);

  // Auto-polling kiểm tra biến động số dư qua SePay khi modal mở
  useEffect(() => {
    if (!paymentModal.isOpen || paymentModal.isPaid || !paymentModal.orderCode) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await paymentAPI.checkStatus(paymentModal.orderCode);
        if (res && res.isPaid) {
          handlePaymentSuccess(res.data?.plan || paymentModal.plan, res.data?.subscriptionExpires);
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra SePay:', err);
      }
    };

    // Kiểm tra định kỳ mỗi 3.5 giây
    pollingRef.current = setInterval(checkStatus, 3500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [paymentModal.isOpen, paymentModal.isPaid, paymentModal.orderCode]);

  const handlePaymentSuccess = (upgradedPlan, subscriptionExpires) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    setPaymentModal(prev => ({
      ...prev,
      isPaid: true,
      statusText: 'Giao dịch thành công!'
    }));

    if (user) {
      const updatedUser = { 
        ...user, 
        plan: upgradedPlan, 
        subscriptionExpires: subscriptionExpires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      localStorage.setItem('aicee_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const handleUpgrade = async (planId, priceString) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (planId === 'free') return; 
setLoading(true);
    try {
      // Tạo đơn hàng thanh toán SePay trên Backend
      const res = await paymentAPI.createOrder(planId, billingCycle);
      if (res && res.success) {
        const orderData = res.data;
        setPaymentModal({
          isOpen: true,
          orderCode: orderData.orderCode,
          plan: orderData.plan,
          amount: orderData.amount,
          qrUrl: orderData.qrUrl,
          vietQrUrl: orderData.vietQrUrl,
          bankInfo: orderData.bankInfo,
          isPaid: false,
          statusText: 'Đang lắng nghe biến động số dư SePay...'
        });
      } else {
        alert(res?.message || 'Không thể tạo đơn hàng thanh toán');
      }
    } catch (error) {
      console.error('Lỗi tạo đơn SePay:', error);
      alert(error.message || 'Không thể kết nối đến cổng thanh toán SePay');
    } finally {
      setLoading(false);
  };
    }
  };

  // Nút thủ công để kiểm tra thanh toán ngay
  const handleManualCheck = async () => {
    if (!paymentModal.orderCode || isChecking) return;
    setIsChecking(true);
    try {
      const res = await paymentAPI.checkStatus(paymentModal.orderCode);
      if (res && res.isPaid) {
        handlePaymentSuccess(res.data?.plan || paymentModal.plan, res.data?.subscriptionExpires);
      } else {
        alert('⏳ Hệ thống SePay chưa nhận được khoản chuyển. Vui lòng kiểm tra lại tiền trong tài khoản hoặc thử lại sau vài giây!');
      }
    } catch (err) {
      alert('Lỗi kiểm tra giao dịch: ' + (err.message || 'Thử lại sau'));
    } finally {
      setIsChecking(false);
    }
  };

  // Hỗ trợ mô phỏng thanh toán thành công (dành cho demo / test)
  const handleSimulatePayment = async () => {
    if (!paymentModal.orderCode) return;
    try {
      setIsChecking(true);
      const res = await paymentAPI.simulatePayment(paymentModal.orderCode);
      if (res && res.success) {
        handlePaymentSuccess(res.data?.plan || paymentModal.plan, res.data?.subscriptionExpires);
      }
    } catch (err) {
      alert('Lỗi mô phỏng thanh toán: ' + err.message);
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
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

      {/* SePay Automated Payment Modal */}
      {paymentModal.isOpen && (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-cyan-500/30 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full relative shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden max-h-[92vh] overflow-y-auto">
            {/* Modal Decorative background glow */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-cyan-600/20 to-transparent rounded-t-[2.5rem] pointer-events-none"></div>

            <button 
              onClick={() => {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setPaymentModal(prev => ({ ...prev, isOpen: false }));
              }}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {paymentModal.isPaid ? (
              /* MÀN HÌNH CHÚC MỪNG KHI SEPAY NHẬN ĐƯỢC TIỀN */
              <div className="text-center py-6 relative z-10 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-bounce">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  Xác Nhận Thành Công Qua SePay
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2">
                  Thanh Toán Thành Công!
                </h2>
                <p className="text-gray-300 text-sm max-w-sm mx-auto mb-6">
                  Cảm ơn bạn! Tài khoản đã được nâng cấp lên gói <span className="text-cyan-400 font-bold uppercase tracking-wider">{paymentModal.plan}</span>. Toàn bộ tính năng cao cấp đã sẵn sàng.
                </p>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left text-xs space-y-2 mb-6">
                  <div className="flex justify-between text-gray-400">
                    <span>Mã đơn hàng:</span>
                    <span className="font-mono text-cyan-400 font-bold">{paymentModal.orderCode}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Gói dịch vụ:</span>
                    <span className="text-white font-bold uppercase">{paymentModal.plan}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Số tiền đã thanh toán:</span>
                    <span className="text-emerald-400 font-bold">{paymentModal.amount.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Cổng giao dịch:</span>
                    <span className="text-white">TPBank (Tự động bởi SePay)</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPaymentModal(prev => ({ ...prev, isOpen: false }));
                    navigate('/chatbox');
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold rounded-2xl transition-all shadow-lg shadow-emerald-500/25 text-sm"
                >
                  Bắt Đầu Trải Nghiệm Chatbox AI Ngay
                </button>
              </div>
            ) : (
              /* MÀN HÌNH QUÉT MÃ QR SEPAY */
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Zap className="w-3.5 h-3.5 fill-cyan-400" />
                    Cổng Thanh Toán Tự Động SePay
                  </div>
                  <h2 className="text-2xl font-extrabold text-white mb-1">
                    Quét Mã VietQR Thanh Toán
                  </h2>
                  <p className="text-gray-400 text-xs">
                    Nâng cấp gói <span className="text-cyan-400 font-bold uppercase tracking-wider">{paymentModal.plan}</span> ({paymentModal.amount.toLocaleString()} VNĐ)
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-4 rounded-3xl flex flex-col items-center justify-center mb-5 shadow-2xl relative group max-w-[260px] mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl opacity-40 blur-xl group-hover:opacity-70 transition-opacity -z-10"></div>
                  <img 
                    src={paymentModal.qrUrl || paymentModal.vietQrUrl} 
                    alt="SePay VietQR" 
                    className="w-full object-contain rounded-xl"
                  />
                  <div className="text-center mt-2">
                    <span className="text-[10px] font-bold text-slate-800 tracking-wider uppercase block">
                      Hỗ Trợ Mọi Ứng Dụng Ngân Hàng & Ví Điện Tử
                    </span>
                  </div>
                </div>

                {/* Bank Account Details with 1-click Copy */}
                <div className="space-y-2.5 mb-5 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Ngân hàng:</span>
                    <span className="text-white font-bold">{paymentModal.bankInfo?.bankName || 'TPBank (Ngân Hàng Tiên Phong)'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Chủ tài khoản:</span>
                    <span className="text-white font-semibold">{paymentModal.bankInfo?.accountHolder || 'TRAN TRUNG HAI'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono font-bold text-sm">{paymentModal.bankInfo?.accountNumber || '10005920328'}</span>
                      <button
                        onClick={() => copyToClipboard(paymentModal.bankInfo?.accountNumber || '10005920328', 'acc')}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-gray-300"
                        title="Sao chép số tài khoản"
                      >
                        {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Số tiền:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold text-sm">{paymentModal.amount.toLocaleString()} VNĐ</span>
                      <button
                        onClick={() => copyToClipboard(String(paymentModal.amount), 'amount')}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-gray-300"
                        title="Sao chép số tiền"
                      >
                        {copiedField === 'amount' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Order Code / Transfer Content */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-yellow-400 font-semibold">Nội dung chuyển khoản (Bắt buộc):</span>
                      <button
                        onClick={() => copyToClipboard(paymentModal.orderCode, 'code')}
                        className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        {copiedField === 'code' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            Đã sao chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Sao chép mã
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-center font-mono font-extrabold text-cyan-300 text-base tracking-widest select-all">
                      {paymentModal.orderCode}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5 flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>Quý khách vui lòng điền đúng mã nội dung để hệ thống SePay tự động ghi nhận và kích hoạt ngay.</span>
                    </p>
                  </div>
                </div>

                {/* Radar Polling Status */}
                <div className="flex items-center justify-center gap-2.5 py-2 px-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                  <span>Đang kết nối SePay: Tự động kích hoạt khi có tiền vào...</span>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={handleManualCheck}
                    disabled={isChecking}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isChecking ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>Tôi Đã Chuyển Khoản (Kiểm Tra Ngay)</span>
                  </button>

                  <button
                    onClick={handleSimulatePayment}
                    disabled={isChecking}
                    className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-cyan-300 rounded-xl font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5"
                    title="Mô phỏng thanh toán thành công (hỗ trợ kiểm thử demo)"
                  >
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span>⚡ Thử Nghiệm Mô Phỏng Thanh Toán (Demo/Test)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Pricing;
