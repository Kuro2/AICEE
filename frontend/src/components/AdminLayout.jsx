import React from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, FileText, LayoutDashboard, ShieldAlert, LogOut, ArrowLeft, Sparkles, ShieldCheck, Flag } from 'lucide-react';
import { authAPI } from '@/services/api';

const AdminLayout = () => {
  const user = authAPI.getCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();

  // Bảo vệ route: Chỉ admin mới được vào
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Duyệt Báo Cáo', path: '/admin/reports', icon: <Flag className="w-4 h-4" /> },
    { name: 'Người dùng', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { name: 'Tin tức', path: '/admin/news', icon: <FileText className="w-4 h-4" /> },
    { name: 'Tài nguyên', path: '/admin/resources', icon: <ShieldAlert className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans selection:bg-cyan-500/30">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950/80 border-r border-white/10 backdrop-blur-2xl flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/30 blur-md rounded-full group-hover:bg-cyan-500/50 transition-colors" />
              <img 
                src="/logo-aicee.png" 
                alt="AICEE Logo" 
                className="w-10 h-10 object-contain relative z-10 group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-wider">
                AICEE
              </span>
              <span className="block text-[10px] font-bold text-cyan-400 tracking-widest uppercase -mt-0.5">
                Admin Panel
              </span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 block mb-2">
            Điều Hướng
          </span>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-6">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 block mb-2">
              Lối Tắt
            </span>
            <Link
              to="/"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang Người Dùng</span>
            </Link>
            <Link
              to="/chatbox"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Thử Nghiệm Chatbox AI</span>
            </Link>
          </div>
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shrink-0">
              <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-xs font-bold">
                {user.avatar ? (
                  <img src={user.avatar} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  user.name?.[0]?.toUpperCase() || 'A'
                )}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-bold truncate">{user.name}</p>
              <p className="text-gray-500 text-[11px] truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-colors text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="p-8 max-w-7xl mx-auto relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
