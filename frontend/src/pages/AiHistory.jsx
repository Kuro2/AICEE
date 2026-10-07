import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  Sparkles, Shield, AlertTriangle, AlertOctagon, CheckCircle2,
  Search, ArrowLeft, Trash2, ExternalLink, Calendar, Filter,
  Globe, Mail, Phone, FileText, Bot, RefreshCw, ChevronRight, Copy, Check
} from 'lucide-react';
import { chatAPI, authAPI } from '@/services/api';

const AiHistory = () => {
  const navigate = useNavigate();
  const user = authAPI.getCurrentUser();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, safe: 0, warning: 0, danger: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const getSessionId = () => {
    if (user && (user.id || user._id)) {
      return `user-${user.id || user._id}`;
    }
    return localStorage.getItem('aicee_guest_session_id') || 'guest';
  };

  const fetchHistoryFeed = async () => {
    setIsLoading(true);
    try {
      const res = await chatAPI.getFeed(getSessionId());
      if (res.success && res.data) {
        setItems(res.data.items || []);
        setStats(res.data.stats || { total: 0, safe: 0, warning: 0, danger: 0 });
      }
    } catch (err) {
      console.error('Lỗi tải nhật ký:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bản ghi phân tích này khỏi nhật ký?')) return;
    try {
      await chatAPI.deleteItem(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      // Cập nhật lại stats
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
    } catch (err) {
      alert('Không thể xóa mục nhật ký. Vui lòng thử lại.');
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenInChat = (item) => {
    navigate('/chatbox', {
      state: { initialPrompt: item.query }
    });
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    // Search filter
    const matchesSearch =
      !searchQuery.trim() ||
      item.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.response.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;

    // Status filter
    const matchesStatus =
      selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'safe':
        return {
          label: 'An Toàn',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
        };
      case 'warning':
        return {
          label: 'Cảnh Báo',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
        };
      case 'danger':
        return {
          label: 'Nguy Hiểm',
          icon: <AlertOctagon className="w-3.5 h-3.5" />,
          classes: 'bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]',
        };
      default:
        return {
          label: 'Thông Tin',
          icon: <Shield className="w-3.5 h-3.5" />,
          classes: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]',
        };
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'url':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'email':
        return <Mail className="w-4 h-4 text-purple-400" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'file':
        return <FileText className="w-4 h-4 text-amber-400" />;
      default:
        return <Bot className="w-4 h-4 text-sky-400" />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'url': return 'Website / URL';
      case 'email': return 'Email Nghi Vấn';
      case 'phone': return 'Số Điện Thoại';
      case 'file': return 'Tệp Tin / Ảnh';
      default: return 'Tư Vấn Chung';
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />

      <Header />

      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-6xl">
          {/* Breadcrumb / Back Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link 
              to="/profile" 
              className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-cyan-400 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Quay lại Hồ sơ cá nhân
            </Link>

            <button
              onClick={fetchHistoryFeed}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 hover:text-white transition"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Hero Banner */}
          <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 border border-white/10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kho Dữ Liệu Phân Tích Cá Nhân</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                NHẬT KÝ TƯ VẤN & PHÂN TÍCH AI
              </h1>
              <p className="text-gray-300 text-sm sm:text-base max-w-2xl font-light">
                Theo dõi dòng thời gian toàn bộ các liên kết, email nghi vấn, số điện thoại và tệp tin bạn đã đưa qua mô hình Google Gemini AI để thẩm định rủi ro an ninh.
              </p>
            </div>

            <Link
              to="/chatbox"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>Mở Trợ Lý Chatbox</span>
            </Link>
          </div>

          {/* Stats Summary HUD */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
              <span className="text-xs font-medium text-gray-400 block mb-1">Tổng Phân Tích</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{stats.total}</p>
              <span className="text-[11px] text-gray-500 mt-1 block">Lịch sử được lưu vĩnh viễn</span>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 backdrop-blur-xl">
              <span className="text-xs font-medium text-emerald-400 block mb-1">Đã Xác Minh An Toàn</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">{stats.safe}</p>
              <span className="text-[11px] text-emerald-400/70 mt-1 block">Tên miền & tệp tin hợp lệ</span>
            </div>

            <div className="p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 backdrop-blur-xl">
              <span className="text-xs font-medium text-amber-400 block mb-1">Cảnh Báo Đáng Ngờ</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">{stats.warning}</p>
              <span className="text-[11px] text-amber-400/70 mt-1 block">Có yếu tố rủi ro</span>
            </div>

            <div className="p-5 rounded-2xl bg-red-500/[0.04] border border-red-500/20 backdrop-blur-xl">
              <span className="text-xs font-medium text-red-400 block mb-1">Mối Nguy Độc Hại</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-red-400 font-mono">{stats.danger}</p>
              <span className="text-[11px] text-red-400/70 mt-1 block">Phát hiện lừa đảo & mã độc</span>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm nội dung câu hỏi, URL, từ khóa..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                  >
                    Xóa
                  </button>
                )}
              </div>

              {/* Status Select */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                >
                  <option value="all">Tất cả mức độ</option>
                  <option value="safe">✅ An Toàn</option>
                  <option value="warning">⚠️ Cảnh Báo</option>
                  <option value="danger">❌ Nguy Hiểm</option>
                  <option value="info">ℹ️ Thông Tin</option>
                </select>
              </div>
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'url', label: 'Website / URL', icon: Globe },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'phone', label: 'Số Điện Thoại', icon: Phone },
                { id: 'file', label: 'Tệp Tin / Ảnh', icon: FileText },
                { id: 'general', label: 'Tư Vấn Khác', icon: Bot },
              ].map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-gray-200'
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline Feed Content */}
          {isLoading ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-400 text-sm">Đang tải dòng thời gian nhật ký tư vấn...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 px-6 rounded-3xl bg-white/[0.01] border border-white/10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-lg">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Chưa Có Bản Ghi Nhật Ký Nào</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'Không tìm thấy kết quả phù hợp với bộ lọc hiện tại. Thử chọn bộ lọc khác hoặc xóa từ khóa.'
                  : 'Bắt đầu gửi URL, email hoặc câu hỏi tới Trợ lý AI để hệ thống tự động ghi nhật ký bảo mật cho bạn.'}
              </p>
              <Link
                to="/chatbox"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs uppercase tracking-wider hover:opacity-95 transition shadow-lg mt-2"
              >
                <span>Tư Vấn AI Ngay Bây Giờ</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredItems.map((item, idx) => {
                const statusBadge = getStatusBadge(item.status);
                const formattedDate = new Date(item.timestamp).toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={item.id || idx}
                    className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/30 transition-all duration-300 relative group"
                  >
                    {/* Top Row: Meta & Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                            {getCategoryLabel(item.category)}
                          </span>
                          <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formattedDate}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.classes}`}
                        >
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                          title="Xóa mục nhật ký này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* User Query Block */}
                    <div className="mb-4">
                      <span className="text-xs font-semibold text-gray-400 block mb-1">Nội dung đã kiểm tra:</span>
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 font-mono text-sm text-cyan-200 break-words leading-relaxed">
                        {item.query}
                      </div>

                      {/* Attached files preview if any */}
                      {item.files && item.files.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 mt-3">
                          {item.files.map((f, fIdx) => {
                            const imgSrc = f.preview
                              ? (f.preview.startsWith('http') || f.preview.startsWith('data:')
                                  ? f.preview
                                  : `http://localhost:5000${f.preview}`)
                              : null;
                            return imgSrc ? (
                              <div key={fIdx} className="group/thumb relative rounded-xl overflow-hidden border border-white/20 bg-black/40">
                                <img
                                  src={imgSrc}
                                  alt={f.name}
                                  className="w-20 h-20 object-cover group-hover/thumb:scale-105 transition-transform"
                                />
                                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-gray-300 px-1 py-0.5 truncate text-center">
                                  {f.name}
                                </span>
                              </div>
                            ) : (
                              <div key={fIdx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="truncate max-w-[180px]">{f.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* AI Analysis Response */}
                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-gray-400 block">Đánh giá từ AI:</span>
                      <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                        {item.response}
                      </div>

                      {/* Recommendations chips if any */}
                      {item.recommendations && item.recommendations.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                            Khuyến nghị an toàn:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {item.recommendations.map((rec, rIdx) => (
                              <div
                                key={rIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions inside Card */}
                    <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-white/5">
                      <button
                        onClick={() => handleCopy(item.id, `${item.query}\n\n---\nPhản hồi AI:\n${item.response}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 transition"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                            <span>Sao chép kết quả</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenInChat(item)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition shadow-sm"
                      >
                        <span>Hỏi tiếp trong Chatbox</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AiHistory;
