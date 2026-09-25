import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle, Loader } from 'lucide-react';
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
      setMessage({ type: 'error', text: 'Email không hợp lệ.' });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center px-4 py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse" />
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl bottom-1/4 right-1/4 animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center space-x-3 mb-8">
          <img
            src="/logo-aicee.png"
            alt="AICEE Logo"
            className="object-contain"
            style={{ width: '180px', height: '180px' }}
          />
          <span className="text-3xl font-bold text-white">AICEE</span>
        </Link>

        {/* Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700 p-8 shadow-2xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRegisterMode ? 'Đăng ký' : 'Đăng nhập'}
            </h1>
            <p className="text-gray-400">
              {isRegisterMode ? 'Tạo tài khoản mới để bắt đầu' : 'Chào mừng bạn trở lại!'}
            </p>
          </div>

          {/* Alert message */}
          {message && (
            <div
              className={`flex items-center space-x-3 p-3 rounded-xl mb-6 text-sm ${
                message.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name — chỉ hiện khi đăng ký */}
            {isRegisterMode && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-300">
                  Họ và tên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    placeholder="Nhập họ tên của bạn"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Nhập email của bạn"
                  data-testid="login-email-input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder={isRegisterMode ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu'}
                  data-testid="login-password-input"
                  autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember / Forgot — chỉ hiện khi đăng nhập */}
            {!isRegisterMode && (
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900/50 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-400">Ghi nhớ tôi</span>
                </label>
                <button type="button" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg hover:shadow-cyan-500/30 font-semibold text-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              data-testid="login-submit-btn"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>{isRegisterMode ? 'Đang đăng ký...' : 'Đang đăng nhập...'}</span>
                </>
              ) : (
                <span>{isRegisterMode ? 'Đăng ký ngay' : 'Đăng nhập'}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800 text-gray-400">Hoặc</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button 
              type="button"
              onClick={() => loginWithGoogle()}
              className="w-full py-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 text-white rounded-xl transition-all flex items-center justify-center space-x-3 text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Đăng nhập với Google</span>
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
                  className="w-full py-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/50 text-white rounded-xl transition-all flex items-center justify-center space-x-3 text-sm"
                >
                  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Đăng nhập với Facebook</span>
                </button>
              )}
            />
          </div>

          {/* Toggle mode */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              {isRegisterMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setMessage(null);
                  setFormData({ name: '', email: '', password: '' });
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                {isRegisterMode ? 'Đăng nhập' : 'Đăng ký ngay'}
              </button>
            </p>
          </div>
        </div>

        {/* Back */}
        <div className="text-center mt-6">
          <Link to="/" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
            ← Trở về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;