import React, { useState, useEffect } from 'react';
import { 
  reportAPI, 
  resourceAPI 
} from '@/services/api';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye, 
  ExternalLink, 
  FileText, 
  Search, 
  Filter, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Loader, 
  Check, 
  Copy, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  Building2, 
  HelpCircle,
  MessageSquare,
  X
} from 'lucide-react';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ totalAll: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [activeReport, setActiveReport] = useState(null); // Chi tiết báo cáo xem trong modal
  const [previewMediaUrl, setPreviewMediaUrl] = useState(null); // Lightbox xem ảnh lớn
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [page, selectedStatus, selectedType]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportAPI.getAll({
        page,
        limit: 15,
        status: selectedStatus,
        type: selectedType,
        search: searchTerm
      });

      if (res.success) {
        setReports(res.data.reports);
        setTotalPages(Math.ceil((res.data.total || 1) / (res.data.limit || 15)));
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách báo cáo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Duyệt báo cáo -> thêm vào Blacklist
  const handleApprove = async () => {
    if (!activeReport) return;
    try {
      setActionLoading(true);
      const res = await reportAPI.approve(activeReport._id, adminNote);
      if (res.success) {
        alert('Đã duyệt báo cáo và TỰ ĐỘNG THÊM vào Danh Sách Cảnh Báo Đen thành công!');
        setIsApproveModalOpen(false);
        setActiveReport(null);
        setAdminNote('');
        fetchReports();
      } else {
        alert(res.message || 'Lỗi khi duyệt báo cáo');
      }
    } catch (err) {
      alert(err.message || 'Lỗi server khi duyệt báo cáo');
    } finally {
      setActionLoading(false);
    }
  };

  // Từ chối báo cáo
  const handleReject = async () => {
    if (!activeReport) return;
    try {
      setActionLoading(true);
      const res = await reportAPI.reject(activeReport._id, adminNote);
      if (res.success) {
        alert('Đã từ chối báo cáo.');
        setIsRejectModalOpen(false);
        setActiveReport(null);
        setAdminNote('');
        fetchReports();
      } else {
        alert(res.message || 'Lỗi khi từ chối báo cáo');
      }
    } catch (err) {
      alert(err.message || 'Lỗi server khi từ chối');
    } finally {
      setActionLoading(false);
    }
  };

  // Xóa báo cáo
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo này khỏi cơ sở dữ liệu?')) return;
    try {
      const res = await reportAPI.delete(id);
      if (res.success) {
        setReports(reports.filter(r => r._id !== id));
        fetchReports();
      } else {
        alert(res.message || 'Lỗi khi xóa');
      }
    } catch (err) {
      alert(err.message || 'Lỗi server khi xóa');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Website': return <Globe className="w-3.5 h-3.5 text-blue-400" />;
      case 'SĐT': return <Phone className="w-3.5 h-3.5 text-yellow-400" />;
      case 'Email': return <Mail className="w-3.5 h-3.5 text-purple-400" />;
      case 'Tổ chức giả mạo':
      case 'Tổ chức': return <Building2 className="w-3.5 h-3.5 text-red-400" />;
      default: return <HelpCircle className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            Đã thêm Blacklist
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            Đã từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            Chờ duyệt
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Quản Trị Báo Cáo Người Dùng
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Kiểm Duyệt Báo Cáo Lừa Đảo
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Xác minh bằng chứng và phê duyệt thêm vào Danh Sách Cảnh Báo Đen (Unsafe List) cho toàn hệ thống.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng Báo Cáo</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalAll}</p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Chờ Kiểm Duyệt</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{stats.pending}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 animate-pulse">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Đã Thêm Blacklist</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.approved}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-red-300 uppercase tracking-wider">Đã Từ Chối</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.rejected}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chờ duyệt' },
            { id: 'approved', label: 'Đã duyệt' },
            { id: 'rejected', label: 'Đã từ chối' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setSelectedStatus(tab.id); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedStatus === tab.id
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type Filter & Search Form */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">Mọi thể loại</option>
            <option value="Website">Website</option>
            <option value="SĐT">Số điện thoại</option>
            <option value="Email">Email</option>
            <option value="Tổ chức giả mạo">Tổ chức</option>
            <option value="Khác">Khác</option>
          </select>

          <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mục tiêu, từ khóa..."
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </form>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader className="w-8 h-8 text-red-500 animate-spin mb-3" />
            <p className="text-xs">Đang tải danh sách báo cáo...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Không tìm thấy báo cáo nào phù hợp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-5">Mục tiêu báo cáo</th>
                  <th className="py-4 px-5">Thể loại</th>
                  <th className="py-4 px-5">Bằng chứng</th>
                  <th className="py-4 px-5">Người báo cáo</th>
                  <th className="py-4 px-5">Thời gian</th>
                  <th className="py-4 px-5">Trạng thái</th>
                  <th className="py-4 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-white/[0.03] transition-colors">
                    {/* Target & Title */}
                    <td className="py-4 px-5 max-w-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-white font-semibold truncate" title={report.target}>
                          {report.target}
                        </span>
                        <button
                          onClick={() => handleCopy(report.target, report._id)}
                          className="text-gray-500 hover:text-white transition-colors"
                          title="Sao chép"
                        >
                          {copiedId === report._id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-gray-400 text-[11px] truncate" title={report.title || report.description}>
                        {report.title || report.description}
                      </p>
                    </td>

                    {/* Type */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-[11px] font-medium">
                        {getTypeIcon(report.type)}
                        {report.type}
                      </span>
                    </td>

                    {/* Evidence Files Count & Preview */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {report.evidenceFiles?.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[11px] font-semibold">
                            {report.evidenceFiles.length} tệp
                          </span>
                          <button
                            onClick={() => setActiveReport(report)}
                            className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Xem tệp bằng chứng"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-[11px]">Không có</span>
                      )}
                    </td>

                    {/* Reporter */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <p className="text-white font-medium">{report.reporterName || 'Ẩn danh'}</p>
                      {report.reporterEmail && (
                        <p className="text-gray-500 text-[10px] truncate">{report.reporterEmail}</p>
                      )}
                    </td>

                    {/* CreatedAt */}
                    <td className="py-4 px-5 whitespace-nowrap text-gray-400 text-[11px]">
                      {new Date(report.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 whitespace-nowrap text-right space-x-1.5">
                      <button
                        onClick={() => setActiveReport(report)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 font-medium text-[11px] transition-colors"
                      >
                        Chi tiết
                      </button>

                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setActiveReport(report);
                              setAdminNote('Xác minh lừa đảo - Tự động thêm vào Blacklist');
                              setIsApproveModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white font-semibold text-[11px] transition-all shadow-sm"
                            title="Duyệt & Thêm vào Blacklist"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              setActiveReport(report);
                              setAdminNote('Thông tin chưa đủ căn cứ xác minh.');
                              setIsRejectModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:text-white font-medium text-[11px] transition-all"
                            title="Từ chối báo cáo"
                          >
                            Từ chối
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDelete(report._id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Xóa báo cáo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx + 1)}
              className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all ${
                page === idx + 1
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {activeReport && !isApproveModalOpen && !isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-950 border border-white/20 rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              onClick={() => setActiveReport(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Chi Tiết Báo Cáo Lừa Đảo</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(activeReport.status)}
                  <span className="text-xs text-gray-400">Mã: {activeReport._id}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Mục tiêu:</span>
                  <span className="font-mono text-red-400 font-bold select-all">{activeReport.target}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Thể loại:</span>
                  <span className="text-white font-semibold">{activeReport.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tiêu đề:</span>
                  <span className="text-white">{activeReport.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Thời gian gửi:</span>
                  <span className="text-gray-300">{new Date(activeReport.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-300 uppercase tracking-wider text-[11px] mb-1.5">
                  Mô tả hành vi lừa đảo của đối tượng:
                </p>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-xs leading-relaxed whitespace-pre-wrap">
                  {activeReport.description}
                </div>
              </div>

              {/* Bằng chứng file */}
              <div>
                <p className="font-semibold text-gray-300 uppercase tracking-wider text-[11px] mb-1.5">
                  Tệp bằng chứng đính kèm ({activeReport.evidenceFiles?.length || 0}):
                </p>
                {activeReport.evidenceFiles?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeReport.evidenceFiles.map((file, i) => {
                      const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.url);
                      return (
                        <div key={i} className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                          {isImage ? (
                            <div 
                              onClick={() => setPreviewMediaUrl(file.url)}
                              className="h-24 rounded-lg overflow-hidden bg-black/40 mb-2 cursor-pointer group relative"
                            >
                              <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          ) : (
                            <a 
                              href={file.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="h-24 rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center text-red-400 mb-2 hover:bg-red-500/20 transition-colors"
                            >
                              <FileText className="w-8 h-8 mb-1" />
                              <span className="text-[10px] font-bold">Mở xem PDF/DOC</span>
                            </a>
                          )}
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold text-cyan-400 hover:underline truncate block"
                          >
                            {file.name || `Tệp ${i + 1}`}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Không có tệp bằng chứng nào được tải lên.</p>
                )}
              </div>

              {/* Thông tin người báo cáo */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] mb-2">Người gửi báo cáo:</p>
                <div className="grid grid-cols-3 gap-2 text-gray-300">
                  <div>Tên: <strong className="text-white">{activeReport.reporterName}</strong></div>
                  <div>Email: <strong className="text-white">{activeReport.reporterEmail || 'N/A'}</strong></div>
                  <div>SĐT: <strong className="text-white">{activeReport.reporterPhone || 'N/A'}</strong></div>
                </div>
              </div>

              {activeReport.adminNote && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  <p className="font-bold text-[11px] mb-1">Ghi chú của Quản Trị Viên:</p>
                  <p>{activeReport.adminNote}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
              {activeReport.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setAdminNote('Xác minh lừa đảo - Thêm vào Blacklist');
                      setIsApproveModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Duyệt & Thêm vào Blacklist
                  </button>
                  <button
                    onClick={() => {
                      setAdminNote('Báo cáo chưa đủ căn cứ xác minh.');
                      setIsRejectModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-600/30 hover:border-red-600 text-red-300 hover:text-white font-bold text-xs transition-all"
                  >
                    Từ chối
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveReport(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      {isApproveModalOpen && activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Xác Nhận Phê Duyệt & Thêm Vào Blacklist
            </h3>
            <p className="text-gray-300 text-xs leading-relaxed mb-4">
              Hành động này sẽ duyệt báo cáo và <span className="text-emerald-400 font-semibold">tự động tạo một mục mới trong Danh Sách Cảnh Báo Đen (Unsafe List)</span> với địa chỉ:
              <br />
              <strong className="text-red-400 font-mono text-sm block mt-1">{activeReport.target}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Ghi chú kiểm định của Admin
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Nhập lý do xác minh hoặc kết quả điều tra..."
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApprove}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Xác Nhận & Thêm Blacklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {isRejectModalOpen && activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-950 border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Từ Chối Báo Cáo Này?
            </h3>
            <p className="text-gray-300 text-xs mb-4">
              Báo cáo này sẽ bị đánh dấu là "Đã từ chối" và không đưa vào danh sách cảnh báo.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Lý do từ chối (Ghi chú nội bộ / Phản hồi)
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ví dụ: Bằng chứng chưa rõ ràng, đối tượng là website chính thống..."
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReject}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR IMAGE PREVIEWS */}
      {previewMediaUrl && (
        <div 
          onClick={() => setPreviewMediaUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={previewMediaUrl} 
              alt="Bằng chứng kích thước lớn" 
              className="max-h-[85vh] max-w-full rounded-2xl border border-white/20 shadow-2xl object-contain"
            />
            <button
              onClick={() => setPreviewMediaUrl(null)}
              className="absolute -top-4 -right-4 p-2 bg-red-600 text-white rounded-full hover:bg-red-500 shadow-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
