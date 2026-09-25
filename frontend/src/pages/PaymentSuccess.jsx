import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CheckCircle2, ArrowRight, ShieldCheck, Sparkles, MessageSquare, History } from 'lucide-react';
import { authAPI, paymentAPI } from '@/services/api';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [orderDetails, setOrderDetails] = useState({
    orderId: searchParams.get('orderId') || searchParams.get('vnp_TxnRef') || `AICEE_${Date.now()}`,
    amount: searchParams.get('amount') || (searchParams.get('vnp_Amount') ? Number(searchParams.get('vnp_Amount')) / 100 : 49000),
    plan: searchParams.get('plan') || 'premium_monthly'
  });

  useEffect(() => {
    // Tự động làm mới thông tin user để nhận badge Premium ngay lập tức
    const refreshUser = async () => {
      try {
        const res = await authAPI.getMe();
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('aicee_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('Không thể cập nhật thông tin user sau thanh toán:', err);
      }
    };

    refreshUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white flex flex-col">
      <Header />

      <main className="flex-grow pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-slate-900/80 border border-emerald-500/40 rounded-3xl p-8 md:p-10 shadow-2xl shadow-emerald-500/10 text-center backdrop-blur-xl relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Success Animated Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Giao dịch thành công</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">
            Chào Mừng Đến Với Premium!
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-md mx-auto mb-8">
            Bạn đã nâng cấp thành công lên tài khoản **AICEE Premium**. Toàn bộ tính năng bảo vệ cao cấp và lưu trữ lịch sử chat đã được kích hoạt.
          </p>

          {/* Order Summary Box */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 mb-8 text-left space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-slate-800/80 pb-2">
              <span className="text-gray-400">Mã giao dịch</span>
              <span className="font-mono text-cyan-400 font-semibold">{orderDetails.orderId}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-800/80 pb-2">
              <span className="text-gray-400">Số tiền thanh toán</span>
              <span className="text-white font-bold">{Number(orderDetails.amount).toLocaleString('vi-VN')} VND</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-800/80 pb-2">
              <span className="text-gray-400">Gói dịch vụ</span>
              <span className="text-emerald-400 font-medium">AICEE Premium (VIP)</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Trạng thái</span>
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Đã kích hoạt</span>
              </span>
            </div>
          </div>

          {/* Feature Highlights unlocked */}
          <div className="grid grid-cols-2 gap-3 mb-8 text-left">
            <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl flex items-center space-x-2.5">
              <History className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span className="text-xs text-gray-200 font-medium">Lưu lịch sử hội thoại vĩnh viễn</span>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-gray-200 font-medium">Không giới hạn lượt hỏi AI</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/chatbox')}
              className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Vào Chat AI Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/profile"
              className="py-3.5 px-6 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-gray-300 hover:text-white font-medium transition-all text-sm flex items-center justify-center"
            >
              Xem Trang Cá Nhân
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
