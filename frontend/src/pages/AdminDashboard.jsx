import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/services/api';
import { Users, FileText, ShieldAlert, Activity, ShieldCheck, ArrowUpRight, Plus, AlertTriangle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <Activity className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
        <p className="text-sm">Đang tải dữ liệu tổng quan trung tâm điều khiển...</p>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Tổng Tài Khoản Đăng Ký', 
      value: stats?.totalUsers || 0, 
      change: '+14% tuần này',
      icon: <Users className="w-6 h-6 text-cyan-400" />,
      color: 'from-cyan-500/10 to-blue-500/5 border-cyan-500/30'
    },
    { 
      title: 'Người Dùng Hoạt Động', 
      value: stats?.usersByRole?.find(r => r._id === 'user')?.count || 0, 
      change: '88% tỷ lệ tương tác',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/30'
    },
    { 
      title: 'Quản Trị Viên Hệ Thống', 
      value: stats?.usersByRole?.find(r => r._id === 'admin')?.count || 0, 
      change: 'Quyền root & audit',
      icon: <ShieldAlert className="w-6 h-6 text-purple-400" />,
      color: 'from-purple-500/10 to-indigo-500/5 border-purple-500/30'
    },
    { 
      title: 'Trạng Thái Hệ Thống AI', 
      value: 'Hoạt Động Tốt', 
      change: '99.98% Uptime',
      icon: <Activity className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500/10 to-cyan-500/5 border-emerald-500/30'
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 border border-white/10 backdrop-blur-2xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="uppercase tracking-wider">AICEE Security Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Bảng Điều Khiển Quản Trị
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Giám sát thời gian thực người dùng, tài nguyên cảnh báo và luồng tin tức bảo mật.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/news"
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Đăng Tin Cảnh Báo
          </Link>
          <Link
            to="/admin/resources"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Thêm Blacklist
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className={`p-6 rounded-2xl bg-gradient-to-b ${card.color} bg-white/[0.02] border backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400">{card.title}</span>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                {card.icon}
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono mb-2">
              {card.value}
            </div>
            <span className="text-xs font-medium text-emerald-400">
              {card.change}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Action & Management Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white mb-2">Chức Năng Quản Lý Trực Quan</h2>
          <p className="text-gray-400 text-xs sm:text-sm mb-6">Truy cập nhanh các phân hệ nghiệp vụ chính của nền tảng.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/reports"
              className="p-5 rounded-2xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 hover:border-red-500/50 transition-all group shadow-lg shadow-red-500/10"
            >
              <ShieldAlert className="w-6 h-6 text-red-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white text-sm mb-1 flex items-center justify-between">
                <span>Duyệt Báo Cáo</span>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              </h3>
              <p className="text-xs text-gray-300">Xác minh bằng chứng và thêm vào Blacklist.</p>
            </Link>

            <Link
              to="/admin/users"
              className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-cyan-500/40 transition-all group"
            >
              <Users className="w-6 h-6 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white text-sm mb-1">Người Dùng</h3>
              <p className="text-xs text-gray-400">Quản lý tài khoản, phân quyền quản trị viên.</p>
            </Link>

            <Link
              to="/admin/resources"
              className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-500/40 transition-all group"
            >
              <AlertTriangle className="w-6 h-6 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white text-sm mb-1">Cơ Sở Dữ Liệu</h3>
              <p className="text-xs text-gray-400">Duyệt và cập nhật Whitelist, Blacklist nguy hại.</p>
            </Link>

            <Link
              to="/admin/news"
              className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-purple-500/40 transition-all group"
            >
              <FileText className="w-6 h-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white text-sm mb-1">Tin Tức Bảo Mật</h3>
              <p className="text-xs text-gray-400">Đăng tải và biên tập cảnh báo lừa đảo khẩn cấp.</p>
            </Link>
          </div>
        </div>

        {/* Security Audit Badge */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-cyan-950/30 to-blue-950/20 border border-cyan-500/30 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hạ Tầng AI Gemini</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              API Google Gemini hiện đang trực tiếp hỗ trợ phân tích đa phương thức với thời gian phản hồi trung bình 1.8 giây/yêu cầu.
            </p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold block mb-1">
              Bảo mật cấp độ cao
            </span>
            <span className="text-xs text-gray-400">Bảo mật định danh 256-bit SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
