import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  User, Mail, Calendar, LogOut, Loader, ArrowLeft, 
  Lock, Sparkles, CheckCircle2, ShieldAlert, Shield, Award, Zap,
  Edit3, Camera, Save, X, Eye, EyeOff, AlertCircle, Check, Upload
} from 'lucide-react';
import { authAPI, subscriptionAPI } from '@/services/api';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&auto=format&fit=crop&q=80',
];

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // State cho Modal Chỉnh sửa thông tin
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('info'); // 'info' | 'password'

  // Form thông tin cá nhân
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [infoSuccess, setInfoSuccess] = useState('');

  // Form đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  useEffect(() => {
    // Thử lấy từ cache trước để hiển thị nhanh
    const cachedUser = localStorage.getItem('aicee_user');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (!parsed.plan) parsed.plan = 'free';
        setUser(parsed);
      } catch (e) {
        console.error('Lỗi parse cached user:', e);
      }
    }

    // Gọi API để lấy dữ liệu mới nhất (gồm thông tin user và gói cước/lượt quét)
    const fetchProfile = async () => {
      try {
        const [meRes, subRes] = await Promise.allSettled([
          authAPI.getMe(),
          subscriptionAPI.getSubscription()
        ]);

        let currentUser = null;
        if (meRes.status === 'fulfilled' && meRes.value?.success && meRes.value?.data?.user) {
          currentUser = meRes.value.data.user;
        }

        if (currentUser) {
          const subData = (subRes.status === 'fulfilled' && subRes.value?.success) ? subRes.value.data : null;
          const mergedUser = {
            ...currentUser,
            plan: (subData?.plan || currentUser.plan || 'free').toLowerCase(),
            scanCount: subData?.scanCount ?? currentUser.scanCount ?? 0,
            subscriptionExpires: subData?.subscriptionExpires || currentUser.subscriptionExpires
          };
          setUser(mergedUser);
          localStorage.setItem('aicee_user', JSON.stringify(mergedUser));
        }
      } catch (error) {
        console.error('Không thể tải thông tin profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const openEditModal = (tab = 'info') => {
    setModalTab(tab);
    setEditName(user?.name || '');
    setEditAvatar(user?.avatar || '');
    setInfoError('');
    setInfoSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPassError('');
    setPassSuccess('');
    setIsEditModalOpen(true);
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setInfoError('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 400;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setEditAvatar(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileInfo = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setInfoError('Họ và tên không được để trống');
      return;
    }
    setIsSavingInfo(true);
    setInfoError('');
    setInfoSuccess('');
    try {
      const res = await authAPI.updateProfile({
        name: editName.trim(),
        avatar: editAvatar.trim() || null
      });
      if (res.success && res.data?.user) {
        setUser(prev => ({
          ...prev,
          name: res.data.user.name,
          avatar: res.data.user.avatar
        }));
        setInfoSuccess('Đã cập nhật thông tin cá nhân thành công!');
        setTimeout(() => {
          setIsEditModalOpen(false);
          setInfoSuccess('');
        }, 1200);
      } else {
        setInfoError(res.message || 'Cập nhật thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      setInfoError(err.message || 'Lỗi kết nối khi cập nhật thông tin');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPassError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Mật khẩu xác nhận không khớp');
      return;
    }
    setIsChangingPass(true);
    setPassError('');
    setPassSuccess('');
    try {
      const payload = { newPassword };
      if (user?.hasPassword !== false) {
        payload.currentPassword = currentPassword;
      }
      const res = await authAPI.changePassword(payload);
      if (res.success) {
        setPassSuccess(res.message || 'Thao tác thành công!');
        setUser(prev => ({ ...prev, hasPassword: true }));
        const cached = localStorage.getItem('aicee_user');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            parsed.hasPassword = true;
            localStorage.setItem('aicee_user', JSON.stringify(parsed));
          } catch (e) {}
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsEditModalOpen(false);
          setPassSuccess('');
        }, 1500);
      } else {
        setPassError(res.message || 'Thao tác không thành công');
      }
    } catch (err) {
      setPassError(err.message || 'Lỗi khi xử lý mật khẩu');
    } finally {
      setIsChangingPass(false);
    }
  };

  const currentPlan = (user?.plan || 'free').toLowerCase();
  const isFree = currentPlan === 'free';

  const getAvatarFrameStyle = (plan) => {
    const p = (plan || 'free').toLowerCase();
    switch(p) {
      case 'premium':
        return 'bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-600 p-[4px] shadow-[0_0_25px_rgba(234,179,8,0.7)]';
      case 'business':
        return 'bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-600 p-[4px] shadow-[0_0_25px_rgba(168,85,247,0.7)]';
      case 'platform-api':
      case 'api':
        return 'bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 p-[4px] shadow-[0_0_30px_rgba(6,182,212,0.7)] animate-pulse';
      default:
        return 'bg-gradient-to-br from-cyan-500 to-blue-600 p-1 shadow-lg shadow-cyan-500/20';
    }
  };

  const getPlanBadge = (plan) => {
    const p = (plan || 'free').toLowerCase();
    switch(p) {
      case 'premium':
        return {
          title: 'Premium VIP',
          bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/40',
          dot: 'bg-yellow-400',
        };
      case 'business':
        return {
          title: 'Business Enterprise',
          bg: 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-300 border-purple-500/40',
          dot: 'bg-purple-400',
        };
      case 'platform-api':
      case 'api':
        return {
          title: 'Platform API Developer',
          bg: 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
        };
      default:
        return {
          title: 'Tài khoản Free',
          bg: 'bg-white/10 text-gray-300 border-white/20',
          dot: 'bg-gray-400',
        };
    }
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader className="w-10 h-10 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white px-4">
        <ShieldAlert className="w-16 h-16 text-cyan-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Bạn chưa đăng nhập</h2>
        <p className="text-gray-400 text-sm mb-6">Đăng nhập để xem thông tin hồ sơ và quản lý gói cước bảo vệ.</p>
        <Link 
          to="/login" 
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition"
        >
          Đi tới Đăng nhập
        </Link>
      </div>
    );
  }

  const joinDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Gần đây';

  const planBadge = getPlanBadge(user.plan);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/4 w-[600px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* Back button */}
          <Link 
            to="/" 
            className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-cyan-400 mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Trở về Trang chủ
          </Link>

          {/* Profile Card Container */}
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Holographic Top Banner */}
            <div className="h-44 bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-purple-950/80 border-b border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 cyber-grid-bg opacity-30" />
              <div className="absolute top-4 right-6 flex items-center space-x-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${planBadge.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${planBadge.dot} animate-pulse`} />
                  {planBadge.title}
                </span>
              </div>
            </div>

            <div className="px-6 sm:px-10 pb-10 relative">
              {/* Avatar + Main Identity */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-20 mb-8 space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
                {/* Large Tier-Framed Avatar */}
                <div className={`w-32 h-32 rounded-full ${getAvatarFrameStyle(user?.plan)} shrink-0 transition-all hover:scale-105 duration-300 relative group`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 flex items-center justify-center text-white text-4xl font-extrabold">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  {/* Quick Edit Avatar Overlay */}
                  <button 
                    onClick={() => openEditModal('info')}
                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-cyan-300 transition-opacity backdrop-blur-[2px] cursor-pointer"
                    title="Thay đổi ảnh đại diện"
                  >
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Đổi ảnh</span>
                  </button>
                </div>

                {/* Info Text */}
                <div className="flex-grow text-center sm:text-left">
                  <h1 className="text-3xl font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
                    {user.name || 'Người dùng AICEE'}
                    {user.role === 'admin' && (
                      <span className="text-xs uppercase tracking-wider font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </h1>
                  <p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start mt-1">
                    <Mail className="w-4 h-4 mr-2 text-cyan-400" />
                    {user.email}
                  </p>
                </div>

                {/* Action Buttons: Edit Info + Logout */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
                  <button 
                    onClick={() => openEditModal('info')}
                    className="px-4 py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 hover:text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:scale-105 active:scale-95"
                  >
                    <Edit3 className="w-4 h-4 mr-2 text-cyan-400" />
                    Thay đổi thông tin
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center shrink-0 hover:scale-105 active:scale-95"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </button>
                </div>
              </div>

              {/* Security Status Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center space-x-3.5">
                  <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-medium">Lượt Quét Hôm Nay</span>
                    <p className="text-xl font-extrabold text-cyan-300">
                      {isFree ? `${user?.scanCount || 0} / 5 Lượt` : 'Không giới hạn'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {isFree ? `Còn ${Math.max(0, 5 - (user?.scanCount || 0))} lượt quét hôm nay` : 'Bảo vệ nâng cao không giới hạn'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center space-x-3.5">
                  <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-medium">Ngày Tham Gia</span>
                    <p className="text-sm font-bold text-white truncate max-w-[140px]">{joinDate}</p>
                  </div>
                </div>
              </div>

              {/* Plan Card Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-3.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Gói Dịch Vụ Đang Dùng</span>
                    <h3 className="text-xl font-bold text-white">
                      {currentPlan === 'premium' ? 'Gói Premium (Bảo vệ nâng cao)' :
                       currentPlan === 'business' ? 'Gói Business (Tổ chức & Trường học)' :
                       (currentPlan === 'platform-api' || currentPlan === 'api') ? 'Platform API (Doanh nghiệp)' :
                       'Gói Free (Cá nhân cơ bản - 5 lượt/ngày)'}
                    </h3>
                  </div>
                </div>

                <Link 
                  to="/pricing" 
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0"
                >
                  {isFree ? 'Nâng cấp Gói Pro' : 'Quản lý Gói cước'}
                </Link>
              </div>

              {/* Admin Panel Quick Access */}
              {user.role === 'admin' && (
                <div className="mb-8">
                  <Link 
                    to="/admin" 
                    className="w-full flex items-center justify-center p-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white rounded-2xl hover:opacity-95 transition-all shadow-lg font-bold text-sm"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Truy Cập Trang Quản Trị Hệ Thống (Admin Panel)
                  </Link>
                </div>
              )}

              {/* Account & Security Settings */}
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Cài Đặt &amp; Bảo Mật Tài Khoản</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => openEditModal('password')}
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-cyan-500/40 hover:bg-white/[0.04] transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                      <div>
                        <span className="font-semibold text-sm text-white block">
                          {user?.hasPassword === false ? 'Thiết lập mật khẩu' : 'Đổi mật khẩu'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {user?.hasPassword === false 
                            ? 'Tạo mật khẩu để đăng nhập trực tiếp bằng email' 
                            : 'Cập nhật mật khẩu định kỳ để an toàn'}
                        </span>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transform rotate-180 transition-colors" />
                  </div>

                  <Link 
                    to="/ai-history"
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-cyan-500/40 hover:bg-white/[0.04] transition"
                  >
                    <div className="flex items-center space-x-3">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      <div>
                        <span className="font-semibold text-sm text-white block">Nhật ký tư vấn AI</span>
                        <span className="text-xs text-gray-500">Xem lại các URL và tệp tin đã phân tích</span>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-400 transform rotate-180" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* ── Modal Thay Đổi Thông Tin / Đổi Mật Khẩu ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div 
            className="relative w-full max-w-lg bg-[#0a0f18] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-cyan-400" />
                Cập Nhật Tài Khoản
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Thay đổi thông tin hồ sơ hiển thị và quản lý bảo mật mật khẩu của bạn.
              </p>
            </div>

            {/* Tabs Switcher */}
            <div className="flex border-b border-white/10 mb-6">
              <button
                type="button"
                onClick={() => setModalTab('info')}
                className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
                  modalTab === 'info'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <User className="w-4 h-4" />
                Thông tin cá nhân
              </button>
              <button
                type="button"
                onClick={() => setModalTab('password')}
                className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
                  modalTab === 'password'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Lock className="w-4 h-4" />
                {user?.hasPassword === false ? 'Thiết lập mật khẩu' : 'Đổi mật khẩu'}
              </button>
            </div>

            {/* ── TAB 1: THÔNG TIN CÁ NHÂN ── */}
            {modalTab === 'info' && (
              <form onSubmit={handleSaveProfileInfo} className="space-y-5">
                {infoError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{infoError}</span>
                  </div>
                )}
                {infoSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{infoSuccess}</span>
                  </div>
                )}

                {/* Avatar Preview & Picker */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Ảnh đại diện (Avatar)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full shrink-0 ${getAvatarFrameStyle(user?.plan)}`}>
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center text-white text-xl font-bold">
                        {editAvatar ? (
                          <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          editName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-gray-200 cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        Tải ảnh từ máy
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarFileChange} 
                        />
                      </label>
                      <p className="text-[11px] text-gray-400">
                        Hỗ trợ PNG, JPG, GIF (sẽ tự động tối ưu hóa kích thước).
                      </p>
                    </div>
                  </div>

                  {/* Preset Avatars Selector */}
                  <div className="mt-3">
                    <span className="text-[11px] text-gray-400 block mb-1.5">Hoặc chọn nhanh avatar mẫu:</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {PRESET_AVATARS.map((presetUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditAvatar(presetUrl)}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform shrink-0 ${
                            editAvatar === presetUrl ? 'border-cyan-400 scale-110 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <img src={presetUrl} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nhập họ và tên của bạn..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                      required
                    />
                  </div>
                </div>

                {/* Email Read-only */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Địa chỉ Email <span className="text-[10px] text-gray-500 font-normal lowercase">(không thể đổi)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-gray-400 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingInfo}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
                  >
                    {isSavingInfo ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── TAB 2: ĐỔI MẬT KHẨU / THIẾT LẬP MẬT KHẨU ── */}
            {modalTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passError}</span>
                  </div>
                )}
                {passSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passSuccess}</span>
                  </div>
                )}

                {/* Banner giải thích cho tài khoản mạng xã hội chưa có mật khẩu */}
                {user?.hasPassword === false && (
                  <div className="p-3.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl flex items-start gap-3 text-cyan-200 text-xs leading-relaxed">
                    <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block mb-0.5">
                        Tài khoản liên kết {user?.socialProvider || 'Google / Facebook'}
                      </span>
                      Tài khoản của bạn hiện chưa có mật khẩu riêng. Bạn có thể thiết lập mật khẩu tại đây để đăng nhập được bằng cả Email và Mật khẩu!
                    </div>
                  </div>
                )}

                {/* Current Password — Chỉ hiển thị khi tài khoản đã có mật khẩu */}
                {user?.hasPassword !== false && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại..."
                        className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                        required={user?.hasPassword !== false}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    {user?.hasPassword === false ? 'Mật khẩu mới cần tạo' : 'Mật khẩu mới'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự..."
                      className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                      required
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
                  >
                    {isChangingPass ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        {user?.hasPassword === false ? 'Đang tạo...' : 'Đang đổi...'}
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        {user?.hasPassword === false ? 'Thiết lập mật khẩu' : 'Cập nhật mật khẩu'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Profile;
