import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans selection:bg-rose-500/30 relative overflow-hidden text-white">
      {/* Glow effect */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative z-10">
        <div className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-2xl shadow-2xl relative text-center">
          
          <div className="w-20 h-20 bg-rose-500/20 border border-rose-500/40 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <XCircle className="w-12 h-12 text-rose-400" />
          </div>

          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-rose-300 mb-3">
            Giao dịch đã bị hủy
          </h1>
          
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">
            Bạn đã hủy giao dịch hoặc quá trình thanh toán qua SePay chưa hoàn tất. Không có khoản tiền nào bị trừ khỏi tài khoản của bạn.
          </p>

          {orderId && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-6 text-xs text-gray-400 font-mono">
              Mã đơn hàng: {orderId}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              to="/pricing"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử thanh toán lại</span>
            </Link>
            
            <Link
              to="/"
              className="w-full py-3.5 px-4 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại trang chủ</span>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-gray-500">
            <HelpCircle className="w-4 h-4" />
            <span>Cần hỗ trợ? Liên hệ bộ phận kỹ thuật AICEE</span>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentFailed;
