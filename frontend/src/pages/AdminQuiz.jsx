import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  HelpCircle, 
  Sparkles, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Search, 
  RefreshCw, 
  Edit3, 
  Save, 
  X, 
  Check, 
  FileText, 
  Link as LinkIcon, 
  Mail, 
  ShieldAlert, 
  BookOpen 
} from 'lucide-react';
import { adminAPI, newsAPI } from '@/services/api';

const AdminQuiz = () => {
  // Danh sách ngân hàng câu hỏi trong DB
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, byType: {} });
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Danh sách tin tức để chọn làm nguồn cho AI
  const [newsList, setNewsList] = useState([]);
  const [selectedNewsId, setSelectedNewsId] = useState('');
  const [searchParams] = useSearchParams();
  const [rawTextContent, setRawTextContent] = useState('');
  const [aiCount, setAiCount] = useState(2);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Trạng thái Bảng tương tác (Interactive Grid / Spreadsheet Builder)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [activeSourceTab, setActiveSourceTab] = useState('news'); // 'news' | 'text' | 'excel'
  const [gridQuestions, setGridQuestions] = useState([]);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // File upload input ref
  const fileInputRef = useRef(null);

  // Modal chỉnh sửa 1 câu hỏi có sẵn
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Hiển thị thông báo Toast nhanh
  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Tải danh sách Quiz từ DB
  const fetchQuizzes = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.getQuizzes({
        page,
        limit: 12,
        type: filterType || undefined,
        search: searchQuery || undefined
      });
      if (res.success) {
        setQuizzes(res.data.quizzes || []);
        setTotalCount(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setStats(res.data.stats || { total: 0, byType: {} });
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải ngân hàng câu hỏi', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách bài báo làm nguồn
  const fetchNewsList = async () => {
    try {
      const res = await newsAPI.getAll(1, 30);
      if (res.success && res.data?.news) {
        setNewsList(res.data.news);
        const sourceParam = searchParams.get('sourceNewsId');
        if (sourceParam) {
          setSelectedNewsId(sourceParam);
          setIsBuilderOpen(true);
          setActiveSourceTab('news');
        } else if (res.data.news.length > 0) {
          setSelectedNewsId(res.data.news[0]._id || res.data.news[0].id);
        }
      }
    } catch (err) {
      console.warn('Chưa thể tải danh sách bài báo:', err);
    }
  };

  useEffect(() => {
    fetchQuizzes(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterType]);

  useEffect(() => {
    fetchNewsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchQuizzes(1);
  };

  // ── XỬ LÝ GENERATE TỪ AI ──────────────────────────────────────
  const handleGenerateAI = async () => {
    setIsGeneratingAi(true);
    try {
      const payload = {
        count: parseInt(aiCount, 10) || 2
      };

      if (activeSourceTab === 'news') {
        if (!selectedNewsId) throw new Error('Vui lòng chọn một bài viết nguồn');
        payload.newsId = selectedNewsId;
      } else {
        if (!rawTextContent.trim()) throw new Error('Vui lòng nhập nội dung văn bản');
        payload.rawContent = rawTextContent.trim();
      }

      const res = await adminAPI.generateQuiz(payload);
      if (res.success && res.data?.questions) {
        // Đổ dữ liệu vào bảng Interactive Grid
        setGridQuestions(prev => [...res.data.questions, ...prev]);
        setIsBuilderOpen(true);
        showToast(res.message || 'AI đã sinh câu hỏi thành công! Vui lòng xem và chỉnh sửa trên bảng.');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi sinh câu hỏi bằng AI', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // ── XỬ LÝ IMPORT TỪ EXCEL ─────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await adminAPI.importQuizExcel(file);
      if (res.success && res.data?.questions) {
        setGridQuestions(prev => [...res.data.questions, ...prev]);
        setIsBuilderOpen(true);
        showToast(`Đã nạp thành công ${res.data.questions.length} câu hỏi từ file Excel vào bảng!`);
        if (res.data.errors && res.data.errors.length > 0) {
          console.warn('Một số cảnh báo từ file Excel:', res.data.errors);
        }
      }
    } catch (err) {
      showToast(err.message || 'Lỗi đọc file Excel', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── THAO TÁC TRÊN BẢNG SPREADSHEET ────────────────────────────
  const handleUpdateGridCell = (index, field, value) => {
    setGridQuestions(prev => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  };

  const handleUpdateGridOption = (qIndex, optIndex, newText) => {
    setGridQuestions(prev => {
      const clone = [...prev];
      const options = [...clone[qIndex].options];
      options[optIndex] = { ...options[optIndex], text: newText };
      clone[qIndex] = { ...clone[qIndex], options };
      return clone;
    });
  };

  const handleSetCorrectOption = (qIndex, optIndex) => {
    setGridQuestions(prev => {
      const clone = [...prev];
      const options = clone[qIndex].options.map((opt, i) => ({
        ...opt,
        isCorrect: i === optIndex
      }));
      clone[qIndex] = { ...clone[qIndex], options };
      return clone;
    });
  };

  const handleAddGridRow = () => {
    setGridQuestions(prev => [
      ...prev,
      {
        title: '',
        type: 'scenario',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ],
        explanation: '',
        difficulty: 'medium'
      }
    ]);
  };

  const handleDeleteGridRow = (index) => {
    setGridQuestions(prev => prev.filter((_, i) => i !== index));
  };

  // ── LƯU HÀNG LOẠT VÀO CSDL ───────────────────────────────────
  const handleBulkSave = async () => {
    if (gridQuestions.length === 0) {
      showToast('Bảng chưa có câu hỏi nào để lưu', 'error');
      return;
    }

    setIsSavingBulk(true);
    try {
      const res = await adminAPI.bulkSaveQuiz(gridQuestions);
      if (res.success) {
        showToast(res.message || 'Đã lưu toàn bộ câu hỏi vào CSDL thành công!');
        setGridQuestions([]);
        setIsBuilderOpen(false);
        fetchQuizzes(1);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu câu hỏi vào CSDL', 'error');
    } finally {
      setIsSavingBulk(false);
    }
  };

  // ── XUẤT RA EXCEL ─────────────────────────────────────────────
  const handleExportCurrentGrid = async () => {
    try {
      if (gridQuestions.length === 0) {
        showToast('Bảng không có dữ liệu để xuất file', 'error');
        return;
      }
      await adminAPI.exportQuizExcel(gridQuestions);
      showToast('Đã xuất file Excel thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi xuất file Excel', 'error');
    }
  };

  const handleExportAll = async () => {
    try {
      await adminAPI.exportQuizExcel([]);
      showToast('Đã tải xuống file Excel toàn bộ ngân hàng câu hỏi!');
    } catch (err) {
      showToast(err.message || 'Lỗi xuất file Excel', 'error');
    }
  };

  // ── XÓA CÂU HỎI TRONG DB ─────────────────────────────────────
  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng đề?')) return;
    try {
      const res = await adminAPI.deleteQuiz(id);
      if (res.success) {
        showToast('Đã xóa câu hỏi thành công');
        fetchQuizzes(currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa câu hỏi', 'error');
    }
  };

  // ── LƯU CHỈNH SỬA 1 CÂU HỎI ──────────────────────────────────
  const handleSaveSingleEdit = async () => {
    if (!editingQuiz) return;
    setIsSavingEdit(true);
    try {
      const res = await adminAPI.updateQuiz(editingQuiz._id, editingQuiz);
      if (res.success) {
        showToast('Cập nhật câu hỏi thành công');
        setEditingQuiz(null);
        fetchQuizzes(currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu thay đổi', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'url':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><LinkIcon className="w-3 h-3" /> Website / URL</span>;
      case 'email':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20"><Mail className="w-3 h-3" /> Email Phishing</span>;
      case 'scenario':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><ShieldAlert className="w-3 h-3" /> Tình huống lừa đảo</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><BookOpen className="w-3 h-3" /> Chung</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 font-sans selection:bg-cyan-500/30">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center space-x-3 transition-all transform animate-in slide-in-from-bottom-5 ${
          toastMessage.type === 'error'
            ? 'bg-red-950/90 border-red-500/50 text-red-200 shadow-red-900/30'
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-900/30'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400 shrink-0" /> : <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300">
              Ngân Hàng Câu Hỏi & Tạo Đề Trắc Nghiệm
            </h1>
          </div>
          <p className="text-sm text-gray-400">
            Tạo câu hỏi tự động từ bài báo bằng AI, chỉnh sửa trên bảng tương tác trực tuyến và xuất/nhập file Excel chuẩn Kahoot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsBuilderOpen(!isBuilderOpen)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isBuilderOpen ? 'Thu Gọn Trình Tạo' : 'Mở Trình Tạo Đề (AI / Excel)'}</span>
          </button>

          <button
            onClick={handleExportAll}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-gray-300 hover:text-white font-semibold text-xs tracking-wider transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Xuất Toàn Bộ Excel</span>
          </button>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
          <span className="text-xs text-gray-400 block mb-1">Tổng câu hỏi trong CSDL</span>
          <span className="text-2xl font-black text-cyan-400 font-mono">{stats.total || totalCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
          <span className="text-xs text-gray-400 block mb-1">Website / URL giả</span>
          <span className="text-2xl font-black text-blue-400 font-mono">{stats.byType?.url || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
          <span className="text-xs text-gray-400 block mb-1">Email Phishing</span>
          <span className="text-2xl font-black text-purple-400 font-mono">{stats.byType?.email || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
          <span className="text-xs text-gray-400 block mb-1">Tình huống lừa đảo</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">{(stats.byType?.scenario || 0) + (stats.byType?.general || 0)}</span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          KHU VỰC BẢNG CHỈNH SỬA TRỰC TUYẾN (INTERACTIVE GRID BUILDER)
      ──────────────────────────────────────────────────────────── */}
      {isBuilderOpen && (
        <div className="p-6 rounded-3xl bg-slate-950/90 border border-cyan-500/40 shadow-2xl backdrop-blur-2xl space-y-6 transition-all animate-in fade-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Trình Biên Tập Trắc Nghiệm Thông Minh</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {gridQuestions.length} câu trên bảng
                  </span>
                </h2>
                <p className="text-xs text-gray-400">Sinh câu hỏi bằng AI hoặc tải Excel lên, sau đó click chuột trực tiếp vào từng ô để chỉnh sửa.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => adminAPI.downloadQuizTemplate()}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs text-gray-300 hover:text-white flex items-center space-x-1.5"
                title="Tải template Excel chuẩn để tự soạn"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tải File Mẫu (.xlsx)</span>
              </button>

              <label className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs text-gray-300 hover:text-white flex items-center space-x-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nạp Từ Excel</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
              </label>

              <button
                onClick={() => setIsBuilderOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chọn nguồn dữ liệu cho AI */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
              <span className="text-xs font-semibold text-gray-400 mr-2 uppercase tracking-wider">Nguồn sinh đề:</span>
              <button
                onClick={() => setActiveSourceTab('news')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                  activeSourceTab === 'news'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Chọn Bài Báo Có Sẵn</span>
              </button>

              <button
                onClick={() => setActiveSourceTab('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                  activeSourceTab === 'text'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Nhập Đoạn Văn Bản / Vụ Việc Mới</span>
              </button>
            </div>

            {/* Tab: Chọn từ bài báo có sẵn */}
            {activeSourceTab === 'news' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <select
                    value={selectedNewsId}
                    onChange={(e) => setSelectedNewsId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    {newsList.map((n) => (
                      <option key={n._id || n.id} value={n._id || n.id}>
                        [{n.category || 'Tin tức'}] {n.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400 shrink-0">Số câu:</span>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="1">1 câu</option>
                    <option value="2">2 câu</option>
                    <option value="3">3 câu</option>
                    <option value="5">5 câu</option>
                  </select>

                  <button
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAi}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center space-x-2 shrink-0 shadow-lg shadow-cyan-500/20"
                  >
                    {isGeneratingAi ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isGeneratingAi ? 'AI Đang Đọc & Tạo...' : '⚡ AI Tạo Câu Hỏi'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Nhập văn bản tùy ý */}
            {activeSourceTab === 'text' && (
              <div className="space-y-3">
                <textarea
                  value={rawTextContent}
                  onChange={(e) => setRawTextContent(e.target.value)}
                  placeholder="Dán nội dung vụ việc lừa đảo, tin nhắn mạo danh hoặc bài viết bên ngoài vào đây để AI phân tích..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-cyan-500 focus:outline-none placeholder-gray-500"
                />
                <div className="flex justify-end items-center space-x-3">
                  <span className="text-xs text-gray-400">Số câu:</span>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="1">1 câu</option>
                    <option value="2">2 câu</option>
                    <option value="3">3 câu</option>
                  </select>

                  <button
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAi || !rawTextContent.trim()}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center space-x-2 shadow-lg shadow-cyan-500/20"
                  >
                    {isGeneratingAi ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isGeneratingAi ? 'AI Đang Xử Lý...' : '⚡ AI Phân Tích & Tạo'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BẢNG SPREADSHEET TƯƠNG TÁC (INTERACTIVE TABLE) */}
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950">
            <div className="overflow-x-auto max-h-[460px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-900 border-b border-white/10 z-10 text-gray-300 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3 min-w-[260px]">Tình huống / Câu hỏi</th>
                    <th className="p-3 min-w-[120px]">Thể loại</th>
                    <th className="p-3 min-w-[180px]">Phương án A</th>
                    <th className="p-3 min-w-[180px]">Phương án B</th>
                    <th className="p-3 min-w-[180px]">Phương án C</th>
                    <th className="p-3 min-w-[180px]">Phương án D</th>
                    <th className="p-3 min-w-[220px]">Giải thích dấu hiệu</th>
                    <th className="p-3 w-20 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {gridQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-500">
                        Chưa có câu hỏi nào trên bảng. Hãy chọn một bài báo và bấm <span className="text-cyan-400 font-semibold">"⚡ AI Tạo Câu Hỏi"</span> hoặc bấm nút <span className="text-cyan-400 font-semibold">"+ Thêm Dòng"</span> bên dưới.
                      </td>
                    </tr>
                  ) : (
                    gridQuestions.map((q, qIdx) => (
                      <tr key={qIdx} className="hover:bg-white/[0.02] transition-colors group">
                        {/* STT */}
                        <td className="p-3 text-center text-gray-500 font-mono">{qIdx + 1}</td>

                        {/* Câu hỏi */}
                        <td className="p-2">
                          <textarea
                            value={q.title}
                            onChange={(e) => handleUpdateGridCell(qIdx, 'title', e.target.value)}
                            rows={2}
                            placeholder="Nhập tình huống / câu hỏi..."
                            className="w-full p-2 rounded-lg bg-slate-900/80 border border-white/10 focus:border-cyan-500 focus:outline-none text-xs text-white"
                          />
                        </td>

                        {/* Thể loại */}
                        <td className="p-2">
                          <select
                            value={q.type || 'scenario'}
                            onChange={(e) => handleUpdateGridCell(qIdx, 'type', e.target.value)}
                            className="w-full p-2 rounded-lg bg-slate-900/80 border border-white/10 focus:border-cyan-500 focus:outline-none text-xs text-white"
                          >
                            <option value="url">Website / URL</option>
                            <option value="email">Email Phishing</option>
                            <option value="scenario">Tình huống lừa đảo</option>
                            <option value="general">Kiến thức chung</option>
                          </select>
                        </td>

                        {/* Phương án 1 (A) */}
                        <td className="p-2">
                          <div className={`p-1.5 rounded-lg border flex items-center space-x-1.5 ${q.options?.[0]?.isCorrect ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-slate-900/80'}`}>
                            <input
                              type="radio"
                              name={`correct-opt-${qIdx}`}
                              checked={Boolean(q.options?.[0]?.isCorrect)}
                              onChange={() => handleSetCorrectOption(qIdx, 0)}
                              className="accent-emerald-400 cursor-pointer"
                              title="Tích chọn nếu đây là đáp án đúng"
                            />
                            <input
                              type="text"
                              value={q.options?.[0]?.text || ''}
                              onChange={(e) => handleUpdateGridOption(qIdx, 0, e.target.value)}
                              placeholder="Phương án A..."
                              className="w-full bg-transparent text-xs text-white focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* Phương án 2 (B) */}
                        <td className="p-2">
                          <div className={`p-1.5 rounded-lg border flex items-center space-x-1.5 ${q.options?.[1]?.isCorrect ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-slate-900/80'}`}>
                            <input
                              type="radio"
                              name={`correct-opt-${qIdx}`}
                              checked={Boolean(q.options?.[1]?.isCorrect)}
                              onChange={() => handleSetCorrectOption(qIdx, 1)}
                              className="accent-emerald-400 cursor-pointer"
                              title="Tích chọn nếu đây là đáp án đúng"
                            />
                            <input
                              type="text"
                              value={q.options?.[1]?.text || ''}
                              onChange={(e) => handleUpdateGridOption(qIdx, 1, e.target.value)}
                              placeholder="Phương án B..."
                              className="w-full bg-transparent text-xs text-white focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* Phương án 3 (C) */}
                        <td className="p-2">
                          <div className={`p-1.5 rounded-lg border flex items-center space-x-1.5 ${q.options?.[2]?.isCorrect ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-slate-900/80'}`}>
                            <input
                              type="radio"
                              name={`correct-opt-${qIdx}`}
                              checked={Boolean(q.options?.[2]?.isCorrect)}
                              onChange={() => handleSetCorrectOption(qIdx, 2)}
                              className="accent-emerald-400 cursor-pointer"
                              title="Tích chọn nếu đây là đáp án đúng"
                            />
                            <input
                              type="text"
                              value={q.options?.[2]?.text || ''}
                              onChange={(e) => handleUpdateGridOption(qIdx, 2, e.target.value)}
                              placeholder="Phương án C (tùy chọn)..."
                              className="w-full bg-transparent text-xs text-white focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* Phương án 4 (D) */}
                        <td className="p-2">
                          <div className={`p-1.5 rounded-lg border flex items-center space-x-1.5 ${q.options?.[3]?.isCorrect ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-slate-900/80'}`}>
                            <input
                              type="radio"
                              name={`correct-opt-${qIdx}`}
                              checked={Boolean(q.options?.[3]?.isCorrect)}
                              onChange={() => handleSetCorrectOption(qIdx, 3)}
                              className="accent-emerald-400 cursor-pointer"
                              title="Tích chọn nếu đây là đáp án đúng"
                            />
                            <input
                              type="text"
                              value={q.options?.[3]?.text || ''}
                              onChange={(e) => handleUpdateGridOption(qIdx, 3, e.target.value)}
                              placeholder="Phương án D (tùy chọn)..."
                              className="w-full bg-transparent text-xs text-white focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* Giải thích */}
                        <td className="p-2">
                          <textarea
                            value={q.explanation || ''}
                            onChange={(e) => handleUpdateGridCell(qIdx, 'explanation', e.target.value)}
                            rows={2}
                            placeholder="Giải thích vì sao đúng/sai..."
                            className="w-full p-2 rounded-lg bg-slate-900/80 border border-white/10 focus:border-cyan-500 focus:outline-none text-xs text-white"
                          />
                        </td>

                        {/* Nút xóa */}
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleDeleteGridRow(qIdx)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Xóa dòng này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Thanh công cụ chân bảng */}
            <div className="p-3 bg-slate-900 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleAddGridRow}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Thêm Dòng Trống</span>
              </button>

              <div className="flex items-center space-x-2.5">
                <button
                  onClick={handleExportCurrentGrid}
                  disabled={gridQuestions.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50"
                  title="Xuất bảng hiện tại ra file Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Xuất File Excel</span>
                </button>

                <button
                  onClick={handleBulkSave}
                  disabled={isSavingBulk || gridQuestions.length === 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center space-x-2"
                >
                  {isSavingBulk ? <Loader className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4 text-black" />}
                  <span>{isSavingBulk ? 'Đang Lưu...' : `💾 Lưu ${gridQuestions.length} Câu Vào CSDL`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          DANH SÁCH CÂU HỎI HIỆN CÓ TRONG CƠ SỞ DỮ LIỆU
      ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Bộ lọc và tìm kiếm */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm câu hỏi, tình huống, dấu hiệu..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
          </form>

          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Tất cả thể loại</option>
              <option value="url">Website / URL</option>
              <option value="email">Email Phishing</option>
              <option value="scenario">Tình huống lừa đảo</option>
              <option value="general">Kiến thức chung</option>
            </select>

            <button
              onClick={() => fetchQuizzes(currentPage)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-gray-400 hover:text-white"
              title="Tải lại danh sách"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bảng danh sách câu hỏi */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
              <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm">Đang tải ngân hàng câu hỏi...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="py-16 text-center text-gray-500 space-y-3">
              <HelpCircle className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-sm">Chưa có câu hỏi nào trong ngân hàng đề.</p>
              <button
                onClick={() => setIsBuilderOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold"
              >
                + Bắt Đầu Tạo Câu Hỏi
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {quizzes.map((quiz, index) => (
                <div key={quiz._id} className="p-5 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-500">#{(currentPage - 1) * 12 + index + 1}</span>
                      {getTypeBadge(quiz.type)}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        quiz.difficulty === 'hard'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : quiz.difficulty === 'medium'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {quiz.difficulty === 'hard' ? 'Khó' : quiz.difficulty === 'medium' ? 'Trung bình' : 'Dễ'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">
                      {quiz.title}
                    </h3>

                    {/* Danh sách các phương án */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {quiz.options?.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl text-xs flex items-center space-x-2 border ${
                            opt.isCorrect
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-semibold'
                              : 'bg-slate-950/60 text-gray-400 border-white/5'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            opt.isCorrect ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-gray-400'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="truncate">{opt.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Lời giải thích */}
                    {quiz.explanation && (
                      <div className="text-xs text-gray-400 bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                        <span className="text-cyan-400 font-semibold">💡 Dấu hiệu nhận biết: </span>
                        <span>{quiz.explanation}</span>
                      </div>
                    )}
                  </div>

                  {/* Nút hành động */}
                  <div className="flex md:flex-col items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditingQuiz(quiz)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                      title="Chỉnh sửa câu hỏi"
                    >
                      <Edit3 className="w-4 h-4 text-cyan-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz._id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-400 transition-colors"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
              <span>Trang {currentPage} / {totalPages} (Tổng số {totalCount} câu hỏi)</span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
                >
                  Trước
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          MODAL CHỈNH SỬA CÂU HỎI ĐỘC LẬP
      ──────────────────────────────────────────────────────────── */}
      {editingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Chỉnh Sửa Câu Hỏi</span>
              </h3>
              <button onClick={() => setEditingQuiz(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tình huống / Nội dung câu hỏi:</label>
                <textarea
                  value={editingQuiz.title}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Thể loại:</label>
                  <select
                    value={editingQuiz.type}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="url">Website / URL</option>
                    <option value="email">Email Phishing</option>
                    <option value="scenario">Tình huống lừa đảo</option>
                    <option value="general">Kiến thức chung</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Độ khó:</label>
                  <select
                    value={editingQuiz.difficulty}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, difficulty: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
              </div>

              {/* Các lựa chọn */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Các phương án (Tích chọn tròn để đặt làm đáp án đúng):</label>
                <div className="space-y-2">
                  {editingQuiz.options?.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="edit-correct-opt"
                        checked={opt.isCorrect}
                        onChange={() => {
                          const updated = editingQuiz.options.map((o, i) => ({
                            ...o,
                            isCorrect: i === idx
                          }));
                          setEditingQuiz({ ...editingQuiz, options: updated });
                        }}
                        className="accent-emerald-400 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...editingQuiz.options];
                          updated[idx] = { ...updated[idx], text: e.target.value };
                          setEditingQuiz({ ...editingQuiz, options: updated });
                        }}
                        className="flex-1 p-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Giải thích chi tiết dấu hiệu lừa đảo:</label>
                <textarea
                  value={editingQuiz.explanation || ''}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, explanation: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end items-center space-x-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setEditingQuiz(null)}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveSingleEdit}
                disabled={isSavingEdit}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider flex items-center space-x-2"
              >
                {isSavingEdit ? <Loader className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4 text-black" />}
                <span>{isSavingEdit ? 'Đang Lưu...' : 'Cập Nhật Câu Hỏi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuiz;
