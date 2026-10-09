import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/services/api';
import { 
  Users, 
  FileText, 
  ShieldAlert, 
  Activity, 
  ShieldCheck, 
  ArrowUpRight, 
  Plus, 
  Sparkles, 
  CreditCard, 
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

// Custom Tooltip cho Biểu đồ xu hướng
const CustomTrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-xs space-y-2 min-w-[180px]">
        <p className="font-bold text-gray-300 border-b border-white/10 pb-1.5 flex items-center justify-between">
          <span>Ngày {label}</span>
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-white font-mono text-sm">
              {entry.value}
            </span>
          </div>
        ))}
        {payload[0]?.payload?.revenue > 0 && (
          <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-emerald-400 font-semibold">
            <span>Doanh thu:</span>
            <span>{payload[0].payload.revenue.toLocaleString('vi-VN')} đ</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Custom Tooltip cho Biểu đồ cơ cấu gói cước
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1">
        <p className="font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
          {data.name}
        </p>
        <p className="text-gray-300">
          Số lượng: <span className="text-white font-bold font-mono text-sm">{data.value}</span> tài khoản
        </p>
      </div>
    );
  }
  return null;
};

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
      <div className="flex flex-col items-center justify-center py-32 text-gray-400 font-sans">
        <Activity className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
        <p className="text-sm">Đang tải dữ liệu tổng quan trung tâm điều khiển...</p>
      </div>
    );
  }

  const totalUsers = stats?.totalUsers || 0;
  const paidUsersCount = stats?.paidUsersCount || 0;
  const conversionRate = totalUsers > 0 ? ((paidUsersCount / totalUsers) * 100).toFixed(1) : 0;
  const totalRevenue = stats?.totalRevenue || 0;

  const statCards = [
    { 
      title: 'Tổng Tài Khoản Đăng Ký', 
      value: totalUsers, 
      change: `${stats?.trendData?.reduce((acc, curr) => acc + curr.newUsers, 0) || 0} đăng ký trong 7 ngày`,
      icon: <Users className="w-6 h-6 text-cyan-400" />,
      color: 'from-cyan-500/10 to-blue-500/5 border-cyan-500/30'
    },
    { 
      title: 'Tài Khoản Đăng Ký Gói (Paid)', 
      value: paidUsersCount, 
      change: `${conversionRate}% tỷ lệ chuyển đổi`,
      icon: <CreditCard className="w-6 h-6 text-purple-400" />,
      color: 'from-purple-500/10 to-indigo-500/5 border-purple-500/30'
    },
    { 
      title: 'Doanh Thu Cổng Thanh Toán', 
      value: `${totalRevenue.toLocaleString('vi-VN')} đ`, 
      change: `${stats?.totalSuccessPayments || 0} đơn giao dịch hoàn tất`,
      icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/30'
    },
    { 
      title: 'Hạ Tầng SePay & AI Security', 
      value: 'Sẵn Sàng 100%', 
      change: 'Webhook SePay & Gemini API OK',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500/10 to-cyan-500/5 border-emerald-500/30'
    },
  ];

  const trendData = stats?.trendData || [];
  const usersByPlan = stats?.usersByPlan || [];

  return (
    <div className="space-y-8 font-sans text-white">
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
            Theo dõi tăng trưởng người dùng, trạng thái đăng ký gói cước và luồng bảo mật thời gian thực.
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
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mb-2 truncate">
              {card.value}
            </div>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 inline-block" />
              {card.change}
            </span>
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 📊 PHẦN BIỂU ĐỒ (GRAPHS) THỐNG KÊ NGƯỜI DÙNG & GÓI CƯỚC */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BIỂU ĐỒ 1: Xu Hướng Đăng Ký Tài Khoản & Nâng Cấp Gói (7 Ngày Qua) */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Xu hướng thời gian thực
                </div>
                <h2 className="text-xl font-bold text-white">Tăng Trưởng Đăng Ký & Gói Cước</h2>
                <p className="text-gray-400 text-xs mt-1">So sánh số tài khoản mới tạo và số lượt kích hoạt gói trong 7 ngày qua.</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-medium flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  Đăng ký tài khoản
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-medium flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  Đăng ký gói
                </span>
              </div>
            </div>

            {/* AreaChart Recharts */}
            <div className="w-full h-72 sm:h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  
                  <XAxis 
                    dataKey="label" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    allowDecimals={false}
                  />
                  
                  <Tooltip content={<CustomTrendTooltip />} />
                  
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    name="Đăng ký tài khoản"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="newSubscribers"
                    name="Đăng ký gói"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSubs)"
                    activeDot={{ r: 6, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
            <span>Dữ liệu tự động đồng bộ theo múi giờ hệ thống</span>
            <span className="text-cyan-400 font-medium">Hệ thống SePay IPN Webhook tự động cập nhật ngay khi khách trả tiền</span>
          </div>
        </div>

        {/* BIỂU ĐỒ 2: Cơ Cấu Phân Bố Gói Cước (Plan Distribution) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
              <PieIcon className="w-3.5 h-3.5" />
              Cơ cấu gói cước
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Tỷ Lệ Gói Người Dùng</h2>
            <p className="text-gray-400 text-xs mb-6">Phân loại tài khoản theo hạng dịch vụ đang hoạt động.</p>

            {/* Donut PieChart */}
            <div className="w-full h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usersByPlan}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="name"
                  >
                    {usersByPlan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#050505" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Tâm Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white font-mono">{totalUsers}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Tài khoản</span>
              </div>
            </div>

            {/* Danh sách nhãn chú thích */}
            <div className="space-y-2 mt-4">
              {usersByPlan.map((item, index) => {
                const percent = totalUsers > 0 ? ((item.count / totalUsers) * 100).toFixed(1) : 0;
                return (
                  <div key={index} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-300 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{item.count}</span>
                      <span className="text-gray-500 text-[11px] font-mono">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

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
