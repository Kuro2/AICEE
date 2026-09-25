import React from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, FileText, LayoutDashboard, ShieldAlert, LogOut } from 'lucide-react';
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
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Người dùng', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { name: 'Tin tức', path: '/admin/news', icon: <FileText className="w-5 h-5" /> },
    { name: 'Tài nguyên', path: '/admin/resources', icon: <ShieldAlert className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6">
          <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-cyan-500" />
            AICEE Admin
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                location.pathname === item.path
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`} 
              alt="Admin" 
              className="w-10 h-10 rounded-full"
            />
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-gray-500 text-xs truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
