import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle, Loader, Sparkles, ArrowLeft } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import { authAPI } from '@/services/api';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setMessage(null);
        const result = await authAPI.googleLogin(tokenResponse.access_token);
        if (result.success) {
          setMessage({ type: 'success', text: 'Đăng nhập Google thành công!' });
          setTimeout(() => navigate('/'), 1000);
        } else {
          setMessage({ type: 'error', text: result.message || 'Lỗi đăng nhập Google' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Lỗi kết nối server' });
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Đăng nhập Google thất bại' });
    }
  });

  const responseFacebook = async (response) => {
    if (response.accessToken) {
      try {
        setIsLoading(true);
        setMessage(null);
        const result = await authAPI.facebookLogin(response.accessToken);
        if (result.success) {
          setMessage({ type: 'success', text: 'Đăng nhập Facebook thành công!' });
          setTimeout(() => navigate('/'), 1000);
        } else {
          setMessage({ type: 'error', text: result.message || 'Lỗi đăng nhập Facebook' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Lỗi kết nối server' });
      } finally {
        setIsLoading(false);
      }
    } else {
      setMessage({ type: 'error', text: 'Đăng nhập Facebook thất bại hoặc bị hủy' });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage(null);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ email và mật khẩu.' });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', text: 'Email không đúng định dạng.' });
      return false;
    }
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      let result;
      if (isRegisterMode) {
        result = await authAPI.register(formData.email, formData.password, formData.name);
      } else {
        result = await authAPI.login(formData.email, formData.password);
      }

      if (result.success) {
        setMessage({
          type: 'success',
          text: isRegisterMode ? 'Đăng ký thành công! Đang chuyển hướng...' : 'Đăng nhập thành công!',
        });
        setTimeout(() => navigate('/'), 1000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Có lỗi xảy ra.' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Không thể kết nối tới server. Vui lòng thử lại.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Dynamic ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Sleek Top Brand Logo */}
        <Link to="/" className="flex flex-col items-center justify-center group mb-8">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-cyan-500/30 blur-xl rounded-full group-hover:bg-cyan-500/50 transition-colors" />
            <img
              src="/logo-aicee.png"
              alt="AICEE Logo"
              className="w-16 h-16 object-contain relative z-10 group-hover:scale-105 transition-transform"
            />
          </div>
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 tracking-wider">
            AICEE
          </span>
          <span className="text-[11px] font-semibold text-cyan-400 tracking-widest uppercase">
            AI Cyber Defense
          </span>
        </Link>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                !isRegisterMode
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                isRegisterMode
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Đăng ký
            </button>
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-white">
              {isRegisterMode ? 'Tạo Tài Khoản Mới' : 'Chào Mừng Trở Lại'}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {isRegisterMode ? 'Đăng ký để nhận 5 lượt quét AI miễn phí mỗi ngày' : 'Đăng nhập vào hệ thống phòng vệ AICEE'}
            </p>
          </div>

          {/* Alert Message */}
          {message && (
            <div
              className={`flex items-center space-x-3 p-3.5 rounded-xl mb-6 text-xs sm:text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name input (only for register) */}
            {isRegisterMode && (
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-semibold text-gray-300">
                  Họ và tên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
            )}

            {/* Email input */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-gray-300">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="name@example.com"
                  data-testid="login-email-input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-gray-300">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-11 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder={isRegisterMode ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu'}
                  data-testid="login-password-input"
                  autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember / Forgot (Login only) */}
            {!isRegisterMode && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-gray-400 hover:text-gray-300">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded bg-black/40 border-white/20 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span>Ghi nhớ tôi</span>
                </label>
                <button type="button" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              data-testid="login-submit-btn"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>{isRegisterMode ? 'Đang khởi tạo...' : 'Đang xác thực...'}</span>
                </>
              ) : (
                <span>{isRegisterMode ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập An Toàn'}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-slate-900 text-gray-500 uppercase tracking-widest font-mono">Hoặc</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="space-y-3">
            <button 
              type="button"
              onClick={() => loginWithGoogle()}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl transition-all flex items-center justify-center space-x-3 text-xs font-semibold"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.8 6.9 9.2 5 12 5z" />
                <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3l3.6 2.8c2.1-1.9 3.3-4.7 3.3-8.1z" />
                <path fill="#FBBC05" d="M5.9 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1L2.2 7.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.7-2.8z" />
                <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5L2.2 16.9C4 20.5 7.7 23 12 23z" />
              </svg>
              <span>Tiếp tục với Google</span>
            </button>

            <FacebookLogin
              appId={process.env.REACT_APP_FACEBOOK_APP_ID || "1234567890"}
              autoLoad={false}
              isMobile={false}
              fields="name,email,picture"
              callback={responseFacebook}
              render={renderProps => (
                <button
                  type="button"
                  onClick={renderProps.onClick}
                  className="w-full py-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-white rounded-xl transition-all flex items-center justify-center space-x-3 text-xs font-semibold"
                >
                  <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Tiếp tục với Facebook</span>
                </button>
              )}
            />
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-xs font-semibold text-gray-400 hover:text-cyan-400 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
            Trở về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;