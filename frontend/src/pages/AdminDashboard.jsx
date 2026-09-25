import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/services/api';
import { Users, FileText, ShieldAlert, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error('Lỗi tải thống kê:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-white text-center py-20">Đang tải dữ liệu...</div>;
  }

  const statCards = [
    { title: 'Tổng người dùng', value: stats?.totalUsers || 0, icon: <Users className="w-8 h-8 text-cyan-500" /> },
    { title: 'Người dùng thường', value: stats?.usersByRole?.find(r => r._id === 'user')?.count || 0, icon: <Users className="w-8 h-8 text-blue-500" /> },
    { title: 'Quản trị viên', value: stats?.usersByRole?.find(r => r._id === 'admin')?.count || 0, icon: <ShieldAlert className="w-8 h-8 text-purple-500" /> },
    { title: 'Trạng thái hệ thống', value: 'Hoạt động tốt', icon: <Activity className="w-8 h-8 text-green-500" /> },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Tổng quan Hệ thống</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">{card.title}</p>
              <h3 className="text-3xl font-bold text-white">{card.value}</h3>
            </div>
            <div className="p-4 bg-slate-800 rounded-xl">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Chào mừng đến với Bảng điều khiển</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Tại đây bạn có thể quản lý người dùng, duyệt danh sách cảnh báo lừa đảo và đăng tải tin tức mới.
          Sử dụng thanh công cụ bên trái để truy cập các chức năng.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
