import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  RefreshCw,
  Edit3,
  ExternalLink,
  BookOpen,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { adminAPI } from '@/services/api';

const AdminQuiz = () => {
  const navigate = useNavigate();

  // Danh sách chủ đề Quiz
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getQuizTopics({
        search: searchQuery || undefined,
        category: selectedCategory || undefined
      });
      if (res.success && res.data) {
        setTopics(res.data.topics || []);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải danh sách chủ đề Quiz', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [searchQuery, selectedCategory]);

  const handleDeleteTopic = async (topicId, topicTitle) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chủ đề "${topicTitle}" không?`)) return;
    try {
      const res = await adminAPI.deleteQuizTopic(topicId);
      if (res.success) {
        showToast('Đã xóa chủ đề thành công');
        fetchTopics();
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa chủ đề', 'error');
    }
  };

  const totalQuestions = topics.reduce((sum, t) => sum + (t.questionCount || 0), 0);

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'email':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">Email Phishing</span>;
      case 'url':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-400 border border-amber-800">Website Giả Mạo</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-950 text-blue-400 border border-blue-800">Tình Huống Scam</span>;
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'hard':
        return <span className="text-[11px] font-semibold text-rose-400">Độ khó: Nâng cao</span>;
      case 'easy':
        return <span className="text-[11px] font-semibold text-emerald-400">Độ khó: Cơ bản</span>;
      default:
        return <span className="text-[11px] font-semibold text-amber-400">Độ khó: Trung bình</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans bg-[#090d16] text-white">
      {/* Toast Alert (Solid flat design) */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl border flex items-center space-x-3 shadow-xl ${
          toastMessage.type === 'error'
            ? 'bg-[#7f1d1d] border-red-500 text-red-100'
            : 'bg-[#064e3b] border-emerald-500 text-emerald-100'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-300 shrink-0" /> : <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Hệ thống Quản Trị Đào Tạo An Ninh Mạng</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Quản Lý Chủ Đề Trắc Nghiệm (Quiz Topics)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý các chủ đề bài thi trắc nghiệm. Mỗi chủ đề sở hữu một đường link riêng (ví dụ: <code className="text-cyan-400 font-mono">/quiz/luadao</code>, <code className="text-cyan-400 font-mono">/quiz/email</code>).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/quiz"
            target="_blank"
            className="px-4 py-2.5 bg-[#1e293b] hover:bg-[#283548] border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-colors"
          >
            <span>Trang Quiz Học Viên</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/admin/quiz/create"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Chủ Đề Mới</span>
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards (Flat solid colors, no gradient) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5">
          <div className="p-3 bg-blue-950 border border-blue-800 rounded-xl text-blue-400">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Tổng số chủ đề</span>
            <span className="text-xl font-bold text-white font-mono">{topics.length}</span>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5">
          <div className="p-3 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Tổng số câu hỏi</span>
            <span className="text-xl font-bold text-white font-mono">{totalQuestions}</span>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Chủ đề đang mở</span>
            <span className="text-xl font-bold text-white font-mono">{topics.length}</span>
          </div>
        </div>
      </div>

      {/* Main Content: Topics List */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">Danh Sách Chủ Đề Đang Hoạt Động</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
              {topics.length} chủ đề
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-[#0f172a] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">Tất cả thể loại</option>
              <option value="scenario">Tình huống lừa đảo</option>
              <option value="email">Email Phishing</option>
              <option value="url">Website & Liên kết</option>
            </select>

            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên hoặc /quiz/slug..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0f172a] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={fetchTopics}
              className="p-2 bg-[#0f172a] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              title="Tải lại danh sách"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            Đang tải danh sách chủ đề...
          </div>
        ) : topics.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <p>Chưa có chủ đề nào phù hợp với tìm kiếm.</p>
            <Link
              to="/admin/quiz/create"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Chủ Đề Mới Ngay</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((t) => (
              <div
                key={t.id}
                className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    {getCategoryBadge(t.category)}
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      /quiz/{t.slug}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5 leading-snug">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {t.description || 'Chủ đề rèn luyện nhận thức an ninh mạng và phòng chống lừa đảo.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-mono font-bold text-slate-300">
                      {t.questionCount} câu
                    </span>
                    <span>•</span>
                    {getDifficultyBadge(t.difficulty)}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/quiz/${t.slug}`}
                      target="_blank"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Làm thử bài thi này"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      to={`/admin/quiz/edit/${t.id}`}
                      className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Sửa bộ đề
                    </Link>

                    <button
                      onClick={() => handleDeleteTopic(t.id, t.title)}
                      className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                      title="Xóa chủ đề"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQuiz;
