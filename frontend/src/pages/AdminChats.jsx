import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminAPI } from '@/services/api';
import {
  MessageSquare,
  Search,
  Filter,
  Trash2,
  Eye,
  X,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Bot,
  Paperclip,
  FileText,
  RefreshCw,
  Copy,
  Check,
  Loader,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

const AdminChats = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId') || '';

  // Data states
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    totalDanger: 0,
    totalWarning: 0,
    totalFiles: 0
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('all'); // 'all' | 'user' | 'guest'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'danger' | 'warning' | 'safe'
  const [filterUserId, setFilterUserId] = useState(initialUserId);

  // Modal Detail states
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [conversationDetail, setConversationDetail] = useState(null);
  const [copiedSessionId, setCopiedSessionId] = useState(false);

  // Fetch conversations
  const fetchConversations = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.getChatConversations({
        page,
        limit: 12,
        search,
        userType: userType !== 'all' ? userType : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        userId: filterUserId || undefined
      });

      if (res.success) {
        setConversations(res.data.conversations || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách hội thoại:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType, statusFilter, filterUserId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchConversations(1);
  };

  // Xem chi tiết hội thoại
  const handleOpenDetail = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setDetailLoading(true);
    try {
      const res = await adminAPI.getChatConversationDetail(sessionId);
      if (res.success) {
        setConversationDetail(res.data);
      } else {
        alert(res.message || 'Không thể tải chi tiết cuộc hội thoại');
        setSelectedSessionId(null);
      }
    } catch (err) {
      alert('Lỗi tải cuộc hội thoại: ' + err.message);
      setSelectedSessionId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Xóa toàn bộ phiên
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Cảnh báo: Bạn chắc chắn muốn xóa toàn bộ lịch sử của phiên chat này? Hành động không thể hoàn tác.')) {
      return;
    }
    try {
      const res = await adminAPI.deleteChatSession(sessionId);
      if (res.success) {
        setConversations(conversations.filter(c => c.sessionId !== sessionId));
        if (selectedSessionId === sessionId) {
          setSelectedSessionId(null);
          setConversationDetail(null);
        }
        fetchConversations(pagination.page);
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert('Lỗi khi xóa phiên chat: ' + error.message);
    }
  };

  // Xóa 1 tin nhắn cụ thể trong modal
  const handleDeleteSingleMessage = async (messageId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;
    try {
      const res = await adminAPI.deleteChatMessage(messageId);
      if (res.success) {
        if (conversationDetail) {
          const updatedMessages = conversationDetail.messages.filter(m => m.id !== messageId);
          setConversationDetail({
            ...conversationDetail,
            messages: updatedMessages,
            messageCount: updatedMessages.length
          });
        }
        // Làm mới danh sách phía sau
        fetchConversations(pagination.page);
      }
    } catch (error) {
      alert('Lỗi khi xóa tin nhắn: ' + error.message);
    }
  };

  const handleCopySessionId = (sid) => {
    navigator.clipboard.writeText(sid);
    setCopiedSessionId(true);
    setTimeout(() => setCopiedSessionId(false), 2000);
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-3 h-3 shrink-0" />
            Lừa đảo / Nguy hiểm
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            Cảnh báo / Nghi vấn
          </span>
        );
      case 'safe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            An toàn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-gray-300 border border-slate-700">
            Tư vấn chung
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 border border-white/10 backdrop-blur-2xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="uppercase tracking-wider">AICEE Audit & Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-cyan-400" />
            Lịch Sử Tin Nhắn Chat AI
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Theo dõi và kiểm tra toàn bộ phiên đối thoại giữa người dùng và Trợ lý AI bảo mật.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchConversations(pagination.page)}
            className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center gap-2"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-cyan-500/20 shadow-lg">
          <span className="text-xs text-gray-400 font-medium block mb-1">Tổng Phiên Hội Thoại</span>
          <div className="text-2xl font-black text-white font-mono">{stats.totalConversations}</div>
          <span className="text-[11px] text-cyan-400 font-medium">Phiên chat được lưu</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-blue-500/20 shadow-lg">
          <span className="text-xs text-gray-400 font-medium block mb-1">Tổng Số Tin Nhắn</span>
          <div className="text-2xl font-black text-white font-mono">{stats.totalMessages}</div>
          <span className="text-[11px] text-blue-400 font-medium">Hỏi &amp; đáp bảo mật</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-red-500/30 shadow-lg">
          <span className="text-xs text-gray-400 font-medium block mb-1">Phát Hiện Lừa Đảo</span>
          <div className="text-2xl font-black text-red-400 font-mono">{stats.totalDanger}</div>
          <span className="text-[11px] text-red-400 font-medium">Tin nhắn mức Nguy hiểm</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-amber-500/30 shadow-lg">
          <span className="text-xs text-gray-400 font-medium block mb-1">Cảnh Báo Nghi Vấn</span>
          <div className="text-2xl font-black text-amber-400 font-mono">{stats.totalWarning}</div>
          <span className="text-[11px] text-amber-300 font-medium">Tin nhắn mức Cảnh báo</span>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên người dùng, email, sessionId hoặc nội dung tin nhắn..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1e293b] border border-slate-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Tìm Kiếm
            </button>
          </form>

          {/* Quick Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* User Type */}
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="px-3 py-2.5 bg-[#1e293b] border border-slate-700 rounded-xl text-xs font-semibold text-gray-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Tất cả đối tượng</option>
              <option value="user">Đã đăng ký (Tài khoản)</option>
              <option value="guest">Khách vãng lai (Guest)</option>
            </select>

            {/* Status Warning */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-[#1e293b] border border-slate-700 rounded-xl text-xs font-semibold text-gray-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="danger">🚨 Có tin nguy hiểm (Lừa đảo)</option>
              <option value="warning">⚠️ Có tin cảnh báo</option>
              <option value="safe">🛡️ An toàn</option>
            </select>
          </div>
        </div>

        {/* User Filter Indicator (if filterUserId is active) */}
        {filterUserId && (
          <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs text-purple-300">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Đang lọc theo tài khoản người dùng ID: <code className="bg-purple-900/60 px-1.5 py-0.5 rounded font-mono">{filterUserId}</code></span>
            </div>
            <button
              onClick={() => {
                setFilterUserId('');
                setSearchParams({});
              }}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Bỏ lọc người dùng
            </button>
          </div>
        )}
      </div>

      {/* ── Table List of Conversations ── */}
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400">
            <Loader className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
            <p className="text-sm">Đang tải danh sách lịch sử tin nhắn...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-500" />
            <p className="text-base font-semibold text-gray-300">Không tìm thấy phiên hội thoại nào</p>
            <p className="text-xs text-gray-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bỏ các bộ lọc trên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900/90 text-gray-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4 font-semibold">Người Gửi / Đối Tượng</th>
                  <th className="p-4 font-semibold">Nội Dung Gần Nhất</th>
                  <th className="p-4 font-semibold text-center">Đánh Giá An Ninh</th>
                  <th className="p-4 font-semibold text-center">Số Tin Nhắn</th>
                  <th className="p-4 font-semibold">Thời Gian</th>
                  <th className="p-4 font-semibold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {conversations.map((item) => {
                  const isUser = !!item.user;
                  const hasDanger = item.dangerCount > 0;
                  const hasWarning = item.warningCount > 0;

                  return (
                    <tr
                      key={item.sessionId}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Cột 1: Người dùng */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                            {isUser && item.user?.avatar ? (
                              <img src={item.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : isUser ? (
                              <div className="w-full h-full bg-cyan-600/30 text-cyan-300 flex items-center justify-center font-bold text-xs">
                                {item.user?.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            ) : (
                              <div className="w-full h-full bg-slate-700 text-gray-300 flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[200px]">
                            {isUser ? (
                              <>
                                <p className="font-semibold text-white truncate text-sm flex items-center gap-1.5">
                                  <span>{item.user.name}</span>
                                  {item.user.plan && item.user.plan !== 'free' && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      PRO
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{item.user.email}</p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold text-gray-300 text-sm flex items-center gap-1.5">
                                  <span>Khách vãng lai</span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-gray-400 border border-slate-700">
                                    Guest
                                  </span>
                                </p>
                                <p className="text-[11px] text-gray-500 font-mono truncate">
                                  {item.sessionId}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Tin nhắn gần nhất */}
                      <td className="p-4 max-w-xs md:max-w-md">
                        <div className="flex items-start gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5 ${
                            item.lastType === 'user' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {item.lastType === 'user' ? 'User' : 'AI'}
                          </span>
                          <p className="text-gray-300 text-xs line-clamp-2 leading-relaxed">
                            {item.lastMessage || 'Không có văn bản'}
                          </p>
                        </div>
                        {item.filesCount > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-cyan-400 mt-1">
                            <Paperclip className="w-3 h-3" />
                            <span>Đã tải lên {item.filesCount} tệp đính kèm</span>
                          </div>
                        )}
                      </td>

                      {/* Cột 3: Đánh giá an ninh */}
                      <td className="p-4 text-center">
                        {hasDanger ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {item.dangerCount} Nguy hiểm
                          </span>
                        ) : hasWarning ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {item.warningCount} Cảnh báo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            An toàn
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Số lượng tin nhắn */}
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-white text-sm font-mono">
                            {item.messageCount}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            ({item.userMessageCount} hỏi / {item.aiMessageCount} đáp)
                          </span>
                        </div>
                      </td>

                      {/* Cột 5: Thời gian */}
                      <td className="p-4 text-xs text-gray-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{formatTimestamp(item.lastActive)}</span>
                        </div>
                      </td>

                      {/* Cột 6: Thao tác */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetail(item.sessionId)}
                            className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                            title="Xem đầy đủ cuộc hội thoại"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem hội thoại</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSession(item.sessionId)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs transition"
                            title="Xóa toàn bộ phiên này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-slate-900 border-t border-slate-800 text-xs text-gray-400">
            <span>
              Hiển thị trang <strong>{pagination.page}</strong> / <strong>{pagination.totalPages}</strong> ({pagination.total} phiên hội thoại)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchConversations(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-gray-300 disabled:opacity-40 hover:bg-slate-700 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Trước
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchConversations(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-gray-300 disabled:opacity-40 hover:bg-slate-700 transition flex items-center gap-1"
              >
                Sau
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: CHI TIẾT CUỘC HỘI THOẠI ── */}
      {selectedSessionId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-cyan-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 truncate">
                    <span>Hội thoại:</span>
                    {conversationDetail?.user ? (
                      <span className="text-cyan-400 truncate">
                        {conversationDetail.user.name} ({conversationDetail.user.email})
                      </span>
                    ) : (
                      <span className="text-gray-300 font-mono text-sm truncate">
                        Khách vãng lai
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400 font-mono">
                      Session ID: {selectedSessionId}
                    </span>
                    <button
                      onClick={() => handleCopySessionId(selectedSessionId)}
                      className="text-gray-400 hover:text-cyan-400 transition"
                      title="Sao chép Session ID"
                    >
                      {copiedSessionId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteSession(selectedSessionId)}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  title="Xóa phiên này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xóa phiên</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedSessionId(null);
                    setConversationDetail(null);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white transition"
                  title="Đóng cửa sổ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Sub-Header Stats */}
            {conversationDetail?.stats && (
              <div className="px-6 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-gray-400 shrink-0">
                <span>Tổng tin nhắn: <strong className="text-white">{conversationDetail.messageCount}</strong></span>
                <span>Tin người dùng: <strong className="text-cyan-300">{conversationDetail.stats.userMessages}</strong></span>
                <span>Phản hồi AI: <strong className="text-purple-300">{conversationDetail.stats.aiMessages}</strong></span>
                {conversationDetail.stats.dangerCount > 0 && (
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {conversationDetail.stats.dangerCount} nguy hiểm
                  </span>
                )}
                {conversationDetail.stats.warningCount > 0 && (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {conversationDetail.stats.warningCount} cảnh báo
                  </span>
                )}
              </div>
            )}

            {/* Modal Body: Chat Dialog Messages */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#080d1a]/50">
              {detailLoading ? (
                <div className="py-24 text-center text-gray-400">
                  <Loader className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Đang tải toàn bộ nhật ký hội thoại...</p>
                </div>
              ) : !conversationDetail?.messages?.length ? (
                <div className="py-16 text-center text-gray-400">
                  <p>Không có tin nhắn nào trong phiên này.</p>
                </div>
              ) : (
                conversationDetail.messages.map((msg, index) => {
                  const isUser = msg.type === 'user';
                  const isDanger = msg.status === 'danger';
                  const isWarning = msg.status === 'warning';
                  const isSafe = msg.status === 'safe';

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}
                    >
                      {/* Avatar */}
                      <div className="shrink-0 mt-1">
                        {isUser ? (
                          <div className="w-9 h-9 rounded-full bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-xs shadow-md">
                            {conversationDetail.user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Bot className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      {/* Bubble Message Box */}
                      <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        {/* Sender Label & Timestamp */}
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${isUser ? 'text-cyan-400' : 'text-purple-400'}`}>
                            {isUser ? (conversationDetail.user?.name || 'Người Dùng') : 'AICEE Assistant AI'}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {formatTimestamp(msg.createdAt)}
                          </span>
                          <button
                            onClick={() => handleDeleteSingleMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition ml-1"
                            title="Xóa tin nhắn này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Message Container */}
                        <div
                          className={`p-4 rounded-2xl text-sm leading-relaxed ${
                            isUser
                              ? 'bg-cyan-600/20 border border-cyan-500/30 text-white rounded-tr-none'
                              : isDanger
                              ? 'bg-red-950/40 border border-red-500/50 text-gray-200 rounded-tl-none shadow-[0_0_25px_rgba(239,68,68,0.15)]'
                              : isWarning
                              ? 'bg-amber-950/40 border border-amber-500/50 text-gray-200 rounded-tl-none shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                              : 'bg-[#1e293b] border border-slate-700/80 text-gray-200 rounded-tl-none'
                          }`}
                        >
                          {/* AI Evaluation Status Badge */}
                          {!isUser && (
                            <div className="mb-3 pb-2 border-b border-white/10 flex items-center justify-between gap-2">
                              {getStatusBadge(msg.status)}
                            </div>
                          )}

                          {/* Text Body */}
                          <div className="whitespace-pre-wrap break-words">
                            {msg.text}
                          </div>

                          {/* Attached Files (if any) */}
                          {msg.files && msg.files.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                              <span className="text-xs font-semibold text-gray-300 block">
                                Tệp đính kèm phân tích:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {msg.files.map((file, fIdx) => (
                                  <div
                                    key={fIdx}
                                    className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3"
                                  >
                                    {file.preview ? (
                                      <img
                                        src={file.preview}
                                        alt={file.name}
                                        className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-slate-800 text-cyan-400 flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                                      <p className="text-[10px] text-gray-400">
                                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Tệp dữ liệu'}
                                      </p>
                                    </div>
                                    {file.preview && (
                                      <a
                                        href={file.preview}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-cyan-400 hover:underline shrink-0"
                                      >
                                        Mở
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommendations (if any) */}
                          {msg.recommendations && msg.recommendations.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                              <span className="text-xs font-bold text-cyan-300 block">
                                Khuyến nghị hành động từ AI:
                              </span>
                              <ul className="space-y-1">
                                {msg.recommendations.map((rec, rIdx) => (
                                  <li key={rIdx} className="text-xs text-gray-300 flex items-start gap-1.5">
                                    <span className="text-cyan-400 font-bold shrink-0">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedSessionId(null);
                  setConversationDetail(null);
                }}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChats;
