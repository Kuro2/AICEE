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
  const user = authAPI.getCurrentUser();

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
    setLoading(true);
    try {
      const res = await subscriptionAPI.upgradePlan(paymentModal.plan);
      if (res.success) {
        alert('🎉 Thanh toán thành công! Gói cước của bạn đã được nâng cấp.');
        
        if (user) {
          const updatedUser = { ...user, plan: res.data.plan, subscriptionExpires: res.data.subscriptionExpires };
          localStorage.setItem('aicee_user', JSON.stringify(updatedUser));
        }

        window.location.reload();
      } else {
        alert(res.message || 'Lỗi khi nâng cấp gói cước');
      }
    } catch (error) {
      alert('Có lỗi xảy ra, vui lòng thử lại.');
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
    <div className="min-h-screen bg-[#111111] flex flex-col font-sans selection:bg-cyan-500/30">
      <Header />
      
      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
          Dùng thử AICEE Premium
        </h1>
        <p className="text-gray-400 text-center max-w-2xl mb-10 text-lg">
          Lựa chọn gói cước phù hợp để bảo vệ bạn, gia đình, hoặc tổ chức khỏi các mối đe dọa lừa đảo trên không gian mạng.
        </p>

        {/* Toggle Switch */}
        <div className="flex bg-[#222222] rounded-full p-1 mb-16 border border-[#333333]">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-8 py-3 rounded-full text-sm font-medium transition-colors ${
              billingCycle === 'monthly' ? 'bg-[#333333] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Thanh toán Tháng
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-8 py-3 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              billingCycle === 'yearly' ? 'bg-[#333333] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Thanh toán Năm
            <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-0.5 rounded-full border border-cyan-500/20">
              Giảm 20%
            </span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative flex flex-col rounded-3xl p-6 transition-all duration-300 ${
                plan.highlight 
                  ? 'bg-[#1a1a2e] border-2 border-cyan-500 shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)] transform lg:-translate-y-4' 
                  : 'bg-[#1a1a1a] border border-[#333333] hover:border-gray-500'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-6 transform -translate-y-1/2">
                  <span className="bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                    Khuyên dùng
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                  {plan.name} {plan.icon}
                </h3>
                <p className="text-gray-400 text-sm h-10">{plan.description}</p>
              </div>

              <div className="mb-6 flex items-end">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400 ml-1 pb-1">{plan.period}</span>
              </div>

              <button
                onClick={() => plan.buttonAction(plan.price)}
                disabled={plan.id === 'free'}
                className={`w-full py-3 px-4 rounded-2xl font-semibold transition-all mb-8 flex items-center justify-center gap-2 ${
                  plan.highlight
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/25'
                    : 'bg-white hover:bg-gray-100 text-black'
                } ${plan.id === 'free' ? 'opacity-50 cursor-not-allowed bg-[#333333] text-white hover:bg-[#333333]' : ''}`}
              >
                {plan.buttonText}
              </button>

              <div className="space-y-4 flex-1">
                <p className="text-sm font-medium text-white mb-4">Mọi thứ trong gói này gồm:</p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start">
                    <Check className={`w-5 h-5 shrink-0 mr-3 ${plan.highlight ? 'text-cyan-500' : 'text-gray-400'}`} />
                    <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* FAQ or Info Section */}
        <div className="mt-20 flex items-center justify-center gap-2 text-gray-400 bg-[#1a1a1a] px-6 py-4 rounded-2xl border border-[#333333]">
          <Info className="w-5 h-5 text-cyan-500" />
          <span className="text-sm">Gói Business dành cho doanh nghiệp mua theo năm sẽ tiết kiệm hơn 7%.</span>
        </div>
      </main>

      {/* Payment Modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-[#333333] rounded-3xl p-8 max-w-md w-full relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setPaymentModal({ isOpen: false, plan: null, amount: 0 })}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-[#333333] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Thanh toán Quét mã QR</h2>
              <p className="text-gray-400">Bạn đang nâng cấp lên gói <span className="text-cyan-400 font-bold capitalize">{paymentModal.plan}</span></p>
            </div>

            <div className="bg-white p-4 rounded-2xl flex items-center justify-center mb-6">
              {/* VietQR Image API */}
              <img 
                src={`https://img.vietqr.io/image/MB-1903673562013-compact2.png?amount=${paymentModal.amount}&addInfo=AICEE%20${user?.email?.split('@')[0]}%20${paymentModal.plan}&accountName=AICEE%20TECH`} 
                alt="QR Code" 
                className="w-full max-w-[250px] object-contain rounded-xl"
              />
            </div>

            <div className="space-y-3 mb-8 bg-[#222222] p-4 rounded-xl border border-[#333333]">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Số tiền:</span>
                <span className="text-white font-bold">{paymentModal.amount.toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Nội dung:</span>
                <span className="text-cyan-400 font-medium">AICEE {user?.email?.split('@')[0]} {paymentModal.plan}</span>
              </div>
            </div>

            <button
              onClick={confirmPayment}
              disabled={loading}
              className="w-full py-4 px-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Tôi đã chuyển khoản thành công'}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4">Hệ thống sẽ tự động xác nhận trong vòng 1-3 phút.</p>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Pricing;
