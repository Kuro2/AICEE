import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Home, 
  User 
} from 'lucide-react';
import { paymentAPI, authAPI } from '@/services/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'pending' | 'failed' | 'error'
  const [paymentData, setPaymentData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 10;
  const pollTimerRef = useRef(null);

  const checkPaymentStatus = async (isManualRetry = false) => {
    if (!orderId) {
      setStatus('error');
      setErrorMessage('Không tìm thấy mã đơn hàng (orderId) trong liên kết.');
      return;
    }

    if (isManualRetry) {
      setStatus('loading');
    }

    try {
      const res = await paymentAPI.getOrderDetail(orderId);
      if (res.success && res.data?.payment) {
        const payment = res.data.payment;
        setPaymentData(payment);

        if (payment.status === 'success') {
          setStatus('success');
          // Cập nhật lại thông tin user trong localStorage
          try {
            const userRes = await authAPI.getMe();
            if (userRes.success && userRes.data?.user) {
              localStorage.setItem('aicee_user', JSON.stringify(userRes.data.user));
            }
          } catch (e) {
            console.warn('Lỗi cập nhật user profile sau thanh toán:', e);
          }
          return;
        }

        if (payment.status === 'failed') {
          setStatus('failed');
          return;
        }

        // Nếu trạng thái vẫn pending, tiến hành polling
        if (payment.status === 'pending') {
          setPollCount((prev) => {
            const nextCount = prev + 1;
            if (nextCount < MAX_POLLS) {
              setStatus('pending');
              pollTimerRef.current = setTimeout(() => {
                checkPaymentStatus();
              }, 3000);
            } else {
              setStatus('pending_timeout');
            }
            return nextCount;
          });
        }
      } else {
        setStatus('error');
        setErrorMessage(res.message || 'Không thể tra cứu thông tin đơn hàng');
      }
    } catch (err) {
      console.error('Lỗi kiểm tra đơn hàng:', err);
      // Nếu 401 hoặc token hết hạn
      if (err.status === 401 || err.data?.status === 401) {
        setStatus('error');
        setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem kết quả.');
      } else {
        setStatus('error');
        setErrorMessage(err.data?.message || err.message || 'Lỗi kết nối tới máy chủ');
      }
    }
  };

  const handleSimulateDirectly = async () => {
    if (!orderId) return;
    try {
      setStatus('loading');
      await paymentAPI.simulate(orderId, 'success');
      await checkPaymentStatus(true);
    } catch (err) {
      console.error('Lỗi giả lập:', err);
      alert('Không thể giả lập thanh toán: ' + (err.data?.message || err.message));
      checkPaymentStatus(true);
    }
  };

  useEffect(() => {
    checkPaymentStatus();

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [orderId]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-hidden text-white">
      {/* Decorative Glow Backgrounds */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-cyan-600/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative z-10">
        <div className="max-w-xl w-full bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-2xl shadow-2xl relative">
          
          {/* TRẠNG THÁI: LOADING HOẶC ĐANG POLLING */}
          {(status === 'loading' || status === 'pending') && (
            <div className="text-center py-6">
              <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping"></div>
                <div className="w-20 h-20 rounded-full border-4 border-t-cyan-400 border-r-cyan-400/30 border-b-cyan-400/10 border-l-transparent animate-spin flex items-center justify-center">
                  <Clock className="w-8 h-8 text-cyan-400" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 mb-3">
                Đang xác thực thanh toán SePay
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Hệ thống đang kiểm tra xác nhận giao dịch từ SePay Gateway. Quá trình này thường diễn ra trong vài giây...
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 inline-flex items-center gap-3 text-xs text-gray-300">
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Đang tự động kiểm tra ({pollCount}/{MAX_POLLS})...</span>
              </div>

              {orderId && (
                <p className="text-xs text-gray-500 font-mono mb-4">Mã đơn hàng: {orderId}</p>
              )}

              {/* Nút Dev Simulator khi dev test nội bộ (Cách B) */}
              <div className="pt-2">
                <button
                  onClick={handleSimulateDirectly}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 text-xs text-gray-300 hover:text-white rounded-xl transition-all inline-flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>🧪 [Simulator] Kích hoạt thanh toán thành công ngay</span>
                </button>
              </div>
            </div>
          )}

          {/* TRẠNG THÁI: THÀNH CÔNG */}
          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-cyan-400 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] transform hover:rotate-6 transition-transform">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Thanh toán thành công
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-cyan-300 mb-3">
                Nâng cấp thành công!
              </h1>
              <p className="text-gray-300 text-sm mb-8 leading-relaxed">
                Tài khoản của bạn đã được nâng cấp lên gói <span className="text-cyan-400 font-bold uppercase">{paymentData?.planType || 'Premium'}</span>. Các đặc quyền bảo vệ an ninh mạng không giới hạn đã sẵn sàng!
              </p>

              {/* Chi tiết đơn hàng */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left space-y-3">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-400">Mã đơn hàng:</span>
                  <span className="text-white font-mono font-medium">{paymentData?.orderId || orderId}</span>
                </div>
                <div className="h-px bg-white/5"></div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-400">Số tiền:</span>
                  <span className="text-cyan-400 font-bold text-base sm:text-lg">
                    {paymentData?.amount ? paymentData.amount.toLocaleString('vi-VN') + ' đ' : '--'}
                  </span>
                </div>
                <div className="h-px bg-white/5"></div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-400">Thời gian thanh toán:</span>
                  <span className="text-gray-300">
                    {paymentData?.paidAt ? new Date(paymentData.paidAt).toLocaleString('vi-VN') : 'Vừa xong'}
                  </span>
                </div>
                <div className="h-px bg-white/5"></div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-400">Cổng thanh toán:</span>
                  <span className="text-white font-semibold uppercase">{paymentData?.provider || 'SePay'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/profile"
                  className="flex-1 py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 group"
                >
                  <User className="w-4 h-4" />
                  <span>Xem hồ sơ & gói cước</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/chatbox"
                  className="py-3.5 px-5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Trải nghiệm AI ngay</span>
                </Link>
              </div>
            </div>
          )}

          {/* TRẠNG THÁI: PENDING TIMEOUT (CHỜ XỬ LÝ LÂU HƠN) */}
          {status === 'pending_timeout' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-amber-500/20 border border-amber-500/40 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Clock className="w-10 h-10 text-amber-400" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                Giao dịch đang được xử lý
              </h2>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                Ngân hàng hoặc SePay đang xử lý thông báo thanh toán. Vui lòng nhấn <strong>Kiểm tra lại</strong> hoặc quay lại kiểm tra tại Hồ sơ cá nhân sau ít phút.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-xs text-gray-400 font-mono">
                Mã đơn hàng: {orderId}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => checkPaymentStatus(true)}
                  className="flex-1 py-3.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Kiểm tra lại ngay
                </button>
                <button
                  onClick={handleSimulateDirectly}
                  className="py-3.5 px-4 bg-white/10 hover:bg-white/15 border border-white/10 text-cyan-300 hover:text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>[DEV] Kích hoạt ngay</span>
                </button>
                <Link
                  to="/profile"
                  className="py-3.5 px-5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Hồ sơ
                </Link>
              </div>
            </div>
          )}

          {/* TRẠNG THÁI: THẤT BẠI HOẶC LỖI */}
          {(status === 'failed' || status === 'error') && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-rose-500/20 border border-rose-500/40 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-rose-400" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                {status === 'failed' ? 'Thanh toán chưa thành công' : 'Không thể xác thực giao dịch'}
              </h2>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                {errorMessage || 'Giao dịch chưa được hoàn tất hoặc đã bị hủy từ phía cổng thanh toán.'}
              </p>

              {orderId && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-6 text-xs text-gray-400 font-mono">
                  Mã đơn: {orderId}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/pricing"
                  className="flex-1 py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Thử lại nâng cấp gói
                </Link>
                <Link
                  to="/"
                  className="py-3.5 px-5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Về trang chủ
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

export default PaymentSuccess;
