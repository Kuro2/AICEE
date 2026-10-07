import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  User, Mail, Shield, Calendar, LogOut, Loader, ArrowLeft, 
  Lock, Sparkles, CheckCircle2, ShieldAlert, Award, ExternalLink, Zap
} from 'lucide-react';
import { authAPI, subscriptionAPI } from '@/services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
                <div className={`w-32 h-32 rounded-full ${getAvatarFrameStyle(user?.plan)} shrink-0 transition-all hover:scale-105 duration-300`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 flex items-center justify-center text-white text-4xl font-extrabold">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
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

                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center shrink-0 hover:scale-105 active:scale-95"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </button>
              </div>

              {/* Security Status Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center space-x-3.5">
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-medium">Điểm An Toàn</span>
                    <p className="text-xl font-extrabold text-emerald-400">98 / 100</p>
                  </div>
                </div>

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
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-cyan-500/40 hover:bg-white/[0.04] transition cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="font-semibold text-sm text-white block">Đổi mật khẩu</span>
                        <span className="text-xs text-gray-500">Cập nhật mật khẩu định kỳ để an toàn</span>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-400 transform rotate-180" />
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

      <Footer />
    </div>
  );
};

export default Profile;
