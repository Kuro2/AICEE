import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';

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
    { name: 'Gói Cước', path: '/pricing' },
    { name: 'Bảng xếp hạng', path: '#' },
    { name: 'Truyền thông', path: '#' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-blue-700/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <img 
                src="/logo-aicee.png" 
                alt="AICEE Logo" 
                className="w-16 h-16 object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-2xl font-bold text-white tracking-wider">AICEE</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="text-gray-300 hover:text-cyan-400 transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-red-400 hover:text-red-300 transition-colors font-medium">
              • Trực tiếp
            </button>
            <button 
              onClick={() => navigate('/chatbox')}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg hover:shadow-cyan-500/50 font-medium"
            >
              AI Tư vấn
            </button>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/profile" 
                  title="Xem trang cá nhân"
                  className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform overflow-hidden"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                  )}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-300 hover:text-red-400 transition-colors font-medium border border-transparent hover:border-red-500/30 rounded-lg"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
              >
                Đăng nhập
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="block text-gray-300 hover:text-cyan-400 transition-colors py-2"
              >
                {item.name}
              </Link>
            ))}
            <button 
              onClick={() => navigate('/chatbox')}
              className="w-full px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all"
            >
              AI Tư vấn
            </button>
            {user ? (
              <button 
                onClick={handleLogout}
                className="w-full px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Đăng xuất ({user.email})
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
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