import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { XCircle, RefreshCw, ArrowLeft, AlertCircle, HelpCircle } from 'lucide-react';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('vnp_TxnRef') || 'N/A';
  const errorCode = searchParams.get('code') || searchParams.get('vnp_ResponseCode') || 'CANCELLED';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white flex flex-col">
      <Header />

      <main className="flex-grow pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-lg w-full bg-slate-900/80 border border-red-500/40 rounded-3xl p-8 md:p-10 shadow-2xl shadow-red-500/10 text-center backdrop-blur-xl relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-6 shadow-lg shadow-red-500/30">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-red-500/10 text-red-300 text-xs font-semibold mb-3 border border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Giao dịch không thành công</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">
            Thanh Toán Bị Gián Đoạn
          </h1>
          <p className="text-gray-300 text-sm max-w-md mx-auto mb-6">
            Giao dịch nâng cấp gói chưa thể hoàn tất. Tài khoản của bạn vẫn chưa bị trừ tiền hoặc giao dịch đã bị hủy bởi người dùng.
          </p>

          {/* Details */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-6 text-left space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Mã đơn hàng</span>
              <span className="font-mono text-gray-200">{orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Mã phản hồi</span>
              <span className="text-red-400 font-mono font-semibold">{errorCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Lý do</span>
              <span className="text-gray-300">Khách hàng hủy giao dịch hoặc quá thời gian thanh toán</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/pricing')}
              className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold transition-all shadow-lg shadow-red-500/25 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử Thanh Toán Lại</span>
            </button>
            <Link
              to="/"
              className="py-3.5 px-6 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-gray-300 hover:text-white font-medium transition-all text-sm flex items-center justify-center space-x-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-xs text-gray-400 flex items-center justify-center space-x-1">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Cần trợ giúp? Liên hệ với chúng tôi qua hotline hoặc email hỗ trợ AICEE</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentFailed;
