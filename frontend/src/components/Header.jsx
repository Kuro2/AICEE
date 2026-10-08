import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Menu, X, Sparkles, ShieldAlert } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const storedUser = localStorage.getItem('aicee_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [location.pathname]); // Update khi route thay đổi

  const handleLogout = () => {
    localStorage.removeItem('aicee_user');
    localStorage.removeItem('aicee_token');
    setUser(null);
    navigate('/login');
  };

  const menuItems = [
    { name: 'Tin tức', path: '/news' },
    { name: 'Tài nguyên', path: '/resources' },
    { name: 'Gói Cước', path: '/pricing' }
  ];

  const getAvatarFrameStyle = (plan) => {
    switch(plan) {
      case 'premium':
        return 'bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-600 p-[3px] shadow-[0_0_15px_rgba(234,179,8,0.6)]';
      case 'business':
        return 'bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-600 p-[3px] shadow-[0_0_15px_rgba(168,85,247,0.6)]';
      case 'platform-api':
        return 'bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 p-[3px] shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse';
      default:
        return 'bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/70 backdrop-blur-2xl border-b border-white/10 transition-all duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full group-hover:bg-cyan-500/40 transition-colors duration-500"></div>
              <img 
                src="/logo-aicee.png" 
                alt="AICEE Logo" 
                className="w-12 h-12 object-contain relative z-10 group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-wider">AICEE</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300 font-medium text-sm"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Nút Báo Cáo phong cách nổi bật như nút Đăng nhập */}
            <Link
              to="/report"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-[1.02] active:scale-95 font-semibold text-sm flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              Báo Cáo
            </Link>

            <button 
              onClick={() => navigate('/chatbox')}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-95 transition-all font-semibold text-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI Tư vấn
            </button>
            {user ? (
              <div className="flex items-center space-x-3 border-l border-white/10 pl-3">
                <Link 
                  to="/profile" 
                  title="Xem trang cá nhân"
                  className={`w-10 h-10 rounded-full ${getAvatarFrameStyle(user?.plan)} hover:scale-105 transition-transform`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#111]">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                        {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-3.5 py-2 text-gray-300 hover:text-red-400 transition-colors font-medium border border-transparent hover:border-red-500/30 rounded-lg text-sm"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-95 font-semibold text-sm"
              >
                Đăng nhập
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-white/10 pt-4 animate-in slide-in-from-top-2 duration-300">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="block text-gray-300 hover:text-white hover:bg-white/5 transition-colors py-2 px-4 rounded-lg font-medium"
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/report"
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all font-semibold flex justify-center items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Báo Cáo Lừa Đảo
            </Link>
            <button 
              onClick={() => navigate('/chatbox')}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl transition-all font-semibold flex justify-center items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI Tư vấn
            </button>
            {user ? (
              <button 
                onClick={handleLogout}
                className="w-full px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold rounded-xl transition-colors mt-2"
              >
                Đăng xuất ({user.email})
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors mt-2"
              >
                Đăng nhập
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;