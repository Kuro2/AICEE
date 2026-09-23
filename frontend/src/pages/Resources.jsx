import React from 'react';
import { ShieldAlert, ShieldCheck, Search, Settings, FileText, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Resources = () => {
  const resourcesList = [
    {
      title: 'Danh sách không an toàn',
      icon: <ShieldAlert className="w-5 h-5" />,
      path: '/resources/unsafe',
      color: 'bg-[#e5534b]', // Red
      hoverColor: 'hover:bg-[#d4433b]'
    },
    {
      title: 'Danh sách an toàn',
      icon: <ShieldCheck className="w-5 h-5" />,
      path: '/resources/safe',
      color: 'bg-[#29ab67]', // Green
      hoverColor: 'hover:bg-[#239358]'
    },
    {
      title: 'Thông tin hữu ích',
      icon: <Search className="w-5 h-5" />,
      path: '/resources/info',
      color: 'bg-[#1a2d33]', // Dark Slate
      hoverColor: 'hover:bg-[#243f47]'
    },
    {
      title: 'Cơ chế hoạt động',
      icon: <Settings className="w-5 h-5" />,
      path: '/resources/how-it-works',
      color: 'bg-[#1a2d33]',
      hoverColor: 'hover:bg-[#243f47]'
    },
    {
      title: 'Chính sách bảo mật',
      icon: <Lock className="w-5 h-5" />,
      path: '/resources/privacy',
      color: 'bg-[#1a2d33]',
      hoverColor: 'hover:bg-[#243f47]'
    },
    {
      title: 'Điều khoản sử dụng',
      icon: <FileText className="w-5 h-5" />,
      path: '/resources/terms',
      color: 'bg-[#1a2d33]',
      hoverColor: 'hover:bg-[#243f47]'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f3f7f8] flex flex-col">
      <Header />
      
      <main className="flex-grow pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-[#1a2d33] text-center mb-8">
            Tài nguyên tham khảo
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resourcesList.map((item, index) => {
              // Hai nút đầu tiên to hơn một chút
              const isPrimary = index < 2;
              
              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`flex items-center justify-between p-6 rounded-lg text-white transition-all duration-300 transform hover:-translate-y-1 shadow-md ${item.color} ${item.hoverColor} ${isPrimary ? 'md:col-span-1' : ''}`}
                  style={{ minHeight: isPrimary ? '100px' : '80px' }}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span className={`font-semibold ${isPrimary ? 'text-xl' : 'text-lg'}`}>
                      {item.title}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-70" />
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Resources;
