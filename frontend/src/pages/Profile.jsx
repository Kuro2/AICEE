import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { User, Mail, Shield, Calendar, LogOut, Loader, ArrowLeft, Lock, Crown, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authAPI } from '@/services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Thử lấy từ cache trước để hiển thị nhanh
    const cachedUser = localStorage.getItem('aicee_user');
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
    }

    // Gọi API để lấy dữ liệu mới nhất
    const fetchProfile = async () => {
      try {
        const result = await authAPI.getMe();
        if (result.success && result.data && result.data.user) {
          setUser(result.data.user);
          // Cập nhật lại cache
          localStorage.setItem('aicee_user', JSON.stringify(result.data.user));
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

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Bạn chưa đăng nhập</h2>
        <Link to="/login" className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition">
          Đi tới Đăng nhập
        </Link>
      </div>
    );
  }

  // Format date
  const joinDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Gần đây';

  return (
    <div className="min-h-screen bg-[#f3f7f8] flex flex-col">
      <Header />
      <main className="flex-grow pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Trở về Trang chủ
          </Link>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header / Banner */}
            <div className="h-32 bg-gradient-to-r from-blue-900 to-cyan-800 relative"></div>
            
            <div className="px-8 pb-8 relative">
              <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 mb-8 space-y-4 md:space-y-0 md:space-x-6 relative z-10">
                {/* Avatar */}
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-5xl font-bold shadow-md shrink-0 overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                
                {/* Info section */}
                <div className="flex-grow text-center md:text-left pt-2 md:pt-0">
                  <h1 className="text-3xl font-bold text-gray-900">{user.name || 'Người dùng AICEE'}</h1>
                  <p className="text-gray-500 flex items-center justify-center md:justify-start mt-1">
                    <Mail className="w-4 h-4 mr-2" />
                    {user.email}
                  </p>
                </div>

                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition flex items-center shrink-0"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Subscription Plan Card */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  user.isPremium || user.plan === 'premium'
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                    : 'bg-gray-50 border-gray-100'
                }`}>
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg mr-4 ${
                      user.isPremium || user.plan === 'premium'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      <Crown className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gói dịch vụ</p>
                      <p className="font-bold text-gray-900 flex items-center space-x-1">
                        <span>{user.isPremium || user.plan === 'premium' ? 'AICEE Premium' : 'Gói Miễn Phí'}</span>
                        {user.isPremium || user.plan === 'premium' ? (
                          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded">VIP</span>
                        ) : null}
                      </p>
                      {user.planExpiry && (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Hạn: {new Date(user.planExpiry).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/pricing"
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                      user.isPremium || user.plan === 'premium'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {user.isPremium || user.plan === 'premium' ? 'Gia hạn' : 'Nâng cấp'}
                  </Link>
                </div>

                {/* Role Card */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vai trò</p>
                    <p className="font-bold text-gray-900 uppercase">
                      {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                    </p>
                  </div>
                </div>

                {/* Joined Date Card */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center">
                  <div className="p-3 bg-teal-100 text-teal-600 rounded-lg mr-4">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ngày tham gia</p>
                    <p className="font-bold text-gray-900">
                      {joinDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tùy chọn bảo mật / Cài đặt */}
              <div className="mt-10 border-t border-gray-100 pt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Cài đặt bảo mật</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                    <div className="flex items-center">
                      <Lock className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="font-medium text-gray-700">Đổi mật khẩu</span>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-400 transform rotate-180" />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="font-medium text-gray-700">Cập nhật thông tin</span>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-400 transform rotate-180" />
                  </div>
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
