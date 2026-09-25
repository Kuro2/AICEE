import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { QrCode, CheckCircle, XCircle, Shield, AlertTriangle, Loader } from 'lucide-react';
import { paymentAPI } from '@/services/api';

const CheckoutSimulator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || `AICEE_${Date.now()}`;
  const amount = searchParams.get('amount') || 49000;
  const plan = searchParams.get('plan') || 'premium_monthly';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSimulate = async (status) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentAPI.simulate(orderId, status);
      if (status === 'success') {
        navigate(`/payment/success?orderId=${orderId}&amount=${amount}&plan=${plan}`);
      } else {
        navigate(`/payment/failed?orderId=${orderId}&code=USER_CANCELLED`);
      }
    } catch (err) {
      setError(err.message || 'Lỗi xử lý thanh toán');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white flex flex-col">
      <Header />

      <main className="flex-grow pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md text-center">
          <div className="flex items-center justify-center space-x-2 text-amber-400 text-sm font-semibold mb-3 bg-amber-400/10 py-1.5 px-3 rounded-full border border-amber-400/20">
            <AlertTriangle className="w-4 h-4" />
            <span>Môi trường Thử nghiệm Thanh toán</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">Cổng Thanh Toán AICEE Pay</h1>
          <p className="text-gray-400 text-sm mb-6">
            Mô phỏng thanh toán trực tuyến bảo mật cho gói AICEE Premium
          </p>

          {/* QR & Bank mockup */}
          <div className="bg-white text-slate-900 rounded-2xl p-6 mb-6 shadow-inner">
            <div className="w-48 h-48 mx-auto bg-slate-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 mb-4 p-2">
              <QrCode className="w-36 h-36 text-slate-800" />
              <span className="text-[10px] text-gray-500 font-mono mt-1">Quét mã VietQR / VNPay</span>
            </div>
            <div className="space-y-1.5 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Số tiền:</span>
                <span className="font-bold text-base text-blue-600">
                  {Number(amount).toLocaleString('vi-VN')} VND
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nội dung:</span>
                <span className="font-medium text-gray-700">Nang cap AICEE Premium</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-200 text-xs mb-4">
              {error}
            </div>
          )}

          {/* Simulation Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleSimulate('success')}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Xác Nhận Đã Thanh Toán Thành Công</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleSimulate('failed')}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-medium transition-all text-sm flex items-center justify-center space-x-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Hủy Bỏ / Mô Phỏng Thất Bại</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutSimulator;
