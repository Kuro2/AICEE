import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
  Loader2,
  Search,
  RefreshCw,
  Edit3,
  Save,
  X,
  Check,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { adminAPI, newsAPI } from '@/services/api';

const AdminQuiz = () => {
  const [searchParams] = useSearchParams();

  // Danh sách chủ đề Quiz
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [totalTopics, setTotalTopics] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Danh sách bài báo để chọn làm nguồn cho AI
  const [newsList, setNewsList] = useState([]);
  const [selectedNewsId, setSelectedNewsId] = useState('');
  const [rawTextContent, setRawTextContent] = useState('');
  const [aiCount, setAiCount] = useState(3);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Editor State cho Chủ Đề (Topic Builder)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState(null); // null = tạo mới, string = sửa
  const [topicForm, setTopicForm] = useState({
    title: '',
    slug: '',
    description: '',
    category: 'scenario',
    difficulty: 'medium',
    status: 'published'
  });
  const [gridQuestions, setGridQuestions] = useState([]);
  const [activeSourceTab, setActiveSourceTab] = useState('news'); // 'news' | 'text' | 'excel'
  const [isSavingTopic, setIsSavingTopic] = useState(false);

  // Toast alert
  const [toastMessage, setToastMessage] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Tải danh sách Chủ đề Quiz
  const fetchTopics = async () => {
    setLoadingTopics(true);
    try {
      const res = await adminAPI.getQuizTopics({
        search: searchQuery || undefined,
        category: selectedCategory || undefined
      });
      if (res.success && res.data) {
        setTopics(res.data.topics || []);
        setTotalTopics(res.data.pagination?.total || 0);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải danh sách chủ đề Quiz', 'error');
    } finally {
      setLoadingTopics(false);
    }
  };

  // 2. Tải danh sách bài báo tin tức
  const fetchNewsList = async () => {
    try {
      const res = await newsAPI.getAll(1, 40);
      if (res.success && res.data?.news) {
        setNewsList(res.data.news);
        const sourceParam = searchParams.get('sourceNewsId');
        if (sourceParam) {
          setSelectedNewsId(sourceParam);
          openCreateTopicFromNews(sourceParam, res.data.news);
        }
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách bài báo:', err.message);
    }
  };

  useEffect(() => {
    fetchTopics();
    fetchNewsList();
  }, [searchQuery, selectedCategory]);

  // Tự động mở form tạo chủ đề khi điều hướng từ trang tin tức
  const openCreateTopicFromNews = (newsId, list = newsList) => {
    const selected = list.find(n => n._id === newsId || n.id === newsId);
    const title = selected ? selected.title : 'Chủ đề từ tin tức';
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);

    setEditingTopicId(null);
    setTopicForm({
      title: `Nhận diện thủ đoạn: ${title}`,
      slug,
      description: selected ? (selected.summary || selected.content?.slice(0, 150)) : '',
      category: 'scenario',
      difficulty: 'medium',
      status: 'published'
    });
    setGridQuestions([]);
    setIsEditorOpen(true);
    setActiveSourceTab('news');
  };

  // 3. Mở Editor để sửa một chủ đề có sẵn
  const handleEditTopic = async (topicId) => {
    try {
      const res = await adminAPI.getQuizTopic(topicId);
      if (res.success && res.data?.topic) {
        const t = res.data.topic;
        setEditingTopicId(t._id || t.id);
        setTopicForm({
          title: t.title,
          slug: t.slug,
          description: t.description || '',
          category: t.category || 'scenario',
          difficulty: t.difficulty || 'medium',
          status: t.status || 'published'
        });

        // Nạp danh sách câu hỏi vào bảng tính
        const mapped = (t.questions || []).map((q, idx) => ({
          tempId: idx + 1,
          title: q.title,
          type: q.type || 'scenario',
          difficulty: q.difficulty || 'medium',
          explanation: q.explanation || '',
          options: (q.options || []).map(o => ({
            text: o.text || '',
            isCorrect: o.isCorrect === true
          }))
        }));

        setGridQuestions(mapped);
        setIsEditorOpen(true);
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }
    } catch (err) {
      showToast('Lỗi khi tải chi tiết chủ đề: ' + err.message, 'error');
    }
  };

  // 4. Mở Editor tạo chủ đề hoàn toàn mới
  const handleOpenCreateNew = () => {
    setEditingTopicId(null);
    setTopicForm({
      title: '',
      slug: '',
      description: '',
      category: 'scenario',
      difficulty: 'medium',
      status: 'published'
    });
    setGridQuestions([createEmptyRow(1)]);
    setIsEditorOpen(true);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // 5. Xóa chủ đề
  const handleDeleteTopic = async (topicId, topicTitle) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chủ đề "${topicTitle}" không?`)) return;
    try {
      const res = await adminAPI.deleteQuizTopic(topicId);
      if (res.success) {
        showToast('Đã xóa chủ đề thành công');
        fetchTopics();
        if (editingTopicId === topicId) {
          setIsEditorOpen(false);
        }
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa chủ đề', 'error');
    }
  };

  // Helper: Tạo 1 dòng câu hỏi trắng trong bảng
  const createEmptyRow = (tempId) => ({
    tempId,
    title: '',
    type: 'scenario',
    difficulty: 'medium',
    explanation: '',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  });

  const handleAddRow = () => {
    setGridQuestions(prev => [...prev, createEmptyRow(prev.length + 1)]);
  };

  const handleRemoveRow = (idx) => {
    setGridQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx, field, value) => {
    setGridQuestions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleOptionTextChange = (qIdx, optIdx, text) => {
    setGridQuestions(prev => {
      const next = [...prev];
      const nextOpts = [...next[qIdx].options];
      nextOpts[optIdx] = { ...nextOpts[optIdx], text };
      next[qIdx] = { ...next[qIdx], options: nextOpts };
      return next;
    });
  };

  const handleSetCorrectOption = (qIdx, optIdx) => {
    setGridQuestions(prev => {
      const next = [...prev];
      const nextOpts = next[qIdx].options.map((opt, i) => ({
        ...opt,
        isCorrect: i === optIdx
      }));
      next[qIdx] = { ...next[qIdx], options: nextOpts };
      return next;
    });
  };

  // 6. Dùng AI sinh câu hỏi từ bài báo hoặc văn bản
  const handleGenerateAI = async () => {
    if (activeSourceTab === 'news' && !selectedNewsId) {
      showToast('Vui lòng chọn 1 bài viết tin tức để AI phân tích', 'error');
      return;
    }
    if (activeSourceTab === 'text' && !rawTextContent.trim()) {
      showToast('Vui lòng nhập nội dung văn bản vụ việc để AI phân tích', 'error');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const payload = {
        newsId: activeSourceTab === 'news' ? selectedNewsId : null,
        rawContent: activeSourceTab === 'text' ? rawTextContent : null,
        count: Number(aiCount) || 3
      };

      const res = await adminAPI.generateQuiz(payload);
      if (res.success && Array.isArray(res.data?.questions)) {
        const newQuestions = res.data.questions.map((q, idx) => ({
          tempId: Date.now() + idx,
          title: q.title || '',
          type: q.type || 'scenario',
          difficulty: q.difficulty || 'medium',
          explanation: q.explanation || '',
          options: (q.options || []).map(o => ({
            text: o.text || '',
            isCorrect: o.isCorrect === true
          }))
        }));

        setGridQuestions(prev => [...prev, ...newQuestions]);
        showToast(`AI đã đọc bài viết và sinh thành công ${newQuestions.length} câu hỏi vào bảng tính!`);

        // Tự động điền tiêu đề nếu chủ đề đang để trống
        if (!topicForm.title) {
          const selected = newsList.find(n => n._id === selectedNewsId || n.id === selectedNewsId);
          if (selected) {
            const cleanTitle = selected.title;
            const autoSlug = cleanTitle
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd')
              .replace(/[^a-z0-9_-]/g, '-')
              .replace(/-+/g, '-')
              .slice(0, 30);

            setTopicForm(prev => ({
              ...prev,
              title: cleanTitle,
              slug: autoSlug,
              description: selected.summary || selected.content?.slice(0, 150)
            }));
          }
        }
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi gọi AI sinh câu hỏi', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // 7. Nhập từ file Excel
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await adminAPI.importQuizExcel(file);
      if (res.success && Array.isArray(res.data?.questions)) {
        const parsed = res.data.questions.map((q, idx) => ({
          tempId: Date.now() + idx,
          title: q.title,
          type: q.type || 'scenario',
          difficulty: q.difficulty || 'medium',
          explanation: q.explanation || '',
          options: q.options || []
        }));
        setGridQuestions(prev => [...prev, ...parsed]);
        showToast(`Đã nhập thành công ${parsed.length} câu hỏi từ file Excel vào bảng tính!`);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải file Excel', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // 8. Xuất các câu hỏi trên bảng tính ra Excel chuẩn Kahoot
  const handleExportExcel = async () => {
    if (gridQuestions.length === 0) {
      showToast('Bảng tính hiện chưa có câu hỏi nào để xuất', 'error');
      return;
    }
    try {
      await adminAPI.exportQuizExcel(gridQuestions);
      showToast('Đã xuất file Excel chuẩn Kahoot thành công');
    } catch (err) {
      showToast(err.message || 'Lỗi xuất file Excel', 'error');
    }
  };

  // 9. Lưu Chủ Đề Này (Kèm toàn bộ danh sách câu hỏi trên bảng tính)
  const handleSaveTopicAndQuestions = async () => {
    if (!topicForm.title.trim()) {
      showToast('Vui lòng nhập tên chủ đề trắc nghiệm', 'error');
      return;
    }
    if (!topicForm.slug.trim()) {
      showToast('Vui lòng nhập đường dẫn tên miền (ví dụ: luadao, email)', 'error');
      return;
    }

    // Lọc các câu hỏi hợp lệ
    const validQuestions = gridQuestions.filter(q => {
      const hasTitle = q.title && q.title.trim().length > 0;
      const validOptions = (q.options || []).filter(o => o.text && o.text.trim().length > 0);
      const hasCorrect = validOptions.some(o => o.isCorrect === true);
      return hasTitle && validOptions.length >= 2 && hasCorrect;
    });

    if (validQuestions.length === 0) {
      showToast('Chủ đề cần ít nhất 1 câu hỏi hợp lệ (có câu hỏi, tối thiểu 2 đáp án và chọn 1 đáp án đúng)', 'error');
      return;
    }

    setIsSavingTopic(true);
    try {
      const payload = {
        ...topicForm,
        questions: validQuestions.map(q => ({
          title: q.title.trim(),
          type: q.type || 'scenario',
          difficulty: q.difficulty || 'medium',
          explanation: q.explanation || '',
          options: q.options.filter(o => o.text.trim().length > 0).map(o => ({
            text: o.text.trim(),
            isCorrect: o.isCorrect === true
          }))
        }))
      };

      if (editingTopicId) {
        await adminAPI.updateQuizTopic(editingTopicId, payload);
        showToast(`Đã cập nhật chủ đề "${payload.title}" thành công!`);
      } else {
        await adminAPI.createQuizTopic(payload);
        showToast(`Đã lưu mới chủ đề "/quiz/${payload.slug}" với ${validQuestions.length} câu hỏi thành công!`);
      }

      fetchTopics();
      setIsEditorOpen(false);
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu chủ đề', 'error');
    } finally {
      setIsSavingTopic(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 font-sans bg-[#090d16] text-white">
      {/* Toast Alert (Solid flat, no gradient) */}
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

      {/* Page Title & Stats Bar (Flat design) */}
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
            Mỗi chủ đề là một bộ câu hỏi chuyên sâu theo một đường link riêng (ví dụ: <code className="text-cyan-400 font-mono">/quiz/luadao</code>, <code className="text-cyan-400 font-mono">/quiz/email</code>).
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

          <button
            onClick={handleOpenCreateNew}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Chủ Đề Mới</span>
          </button>
        </div>
      </div>

      {/* ── SECTION 1: DANH SÁCH CHỦ ĐỀ QUIZ (TOPICS LIST) ── */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">Danh Sách Chủ Đề Đang Hoạt Động</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
              {topics.length} chủ đề
            </span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm chủ đề..."
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

        {loadingTopics ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            Đang tải danh sách chủ đề...
          </div>
        ) : topics.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Chưa có chủ đề nào. Nhấn <strong>"Tạo Chủ Đề Mới"</strong> để bắt đầu soạn đề thi!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((t) => (
              <div 
                key={t.id} 
                className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      /quiz/{t.slug}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {t.questionCount} câu hỏi
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
                  <Link
                    to={`/quiz/${t.slug}`}
                    target="_blank"
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <span>Xem Quiz</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditTopic(t.id)}
                      className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Sửa bộ đề
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(t.id, t.title)}
                      className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                      title="Xóa chủ đề"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 2: TRÌNH BIÊN TẬP CHỦ ĐỀ VÀ BẢNG TÍNH CÂU HỎI ── */}
      {isEditorOpen && (
        <div className="bg-[#111827] border border-cyan-800/60 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Header Editor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>{editingTopicId ? 'Chỉnh Sửa Bộ Đề Chủ Đề' : 'Biên Tập Chủ Đề Trắc Nghiệm Mới'}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                    {gridQuestions.length} câu trên bảng
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Nhập thông tin chủ đề, sinh câu hỏi bằng AI từ bài báo hoặc gõ trực tiếp vào bảng tính bên dưới.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportExcel}
                className="px-3 py-1.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Xuất Excel</span>
              </button>

              <label className="px-3 py-1.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center space-x-1.5 cursor-pointer">
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
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form thông tin Chủ Đề (Tên miền, Tiêu đề, Mô tả) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-[#0f172a] border border-slate-800">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Tên Chủ Đề <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                placeholder="Ví dụ: Cảnh Giác Bẫy Lừa Đảo Việc Làm Online"
                className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Đường Dẫn Tên Miền <span className="text-cyan-400">(/quiz/...)</span> <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-900 border border-r-0 border-slate-800 rounded-l-xl text-xs font-mono text-slate-400">
                  /quiz/
                </span>
                <input
                  type="text"
                  value={topicForm.slug}
                  onChange={(e) => setTopicForm({ ...topicForm, slug: e.target.value })}
                  placeholder="luadao, email, vieclam..."
                  className="w-full px-3 py-2 bg-[#111827] border border-slate-800 rounded-r-xl text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Mô Tả Ngắn</label>
              <input
                type="text"
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                placeholder="Tóm tắt nội dung học viên sẽ được rèn luyện trong chủ đề này..."
                className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Thể Loại</label>
              <select
                value={topicForm.category}
                onChange={(e) => setTopicForm({ ...topicForm, category: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="scenario">Tình huống lừa đảo</option>
                <option value="email">Email Phishing</option>
                <option value="url">Website & Liên kết</option>
                <option value="general">Tổng hợp</option>
              </select>
            </div>
          </div>

          {/* AI Generator Panel (Flat style) */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">Nguồn sinh đề AI:</span>
              <button
                onClick={() => setActiveSourceTab('news')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                  activeSourceTab === 'news'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Chọn Bài Báo Có Sẵn</span>
              </button>

              <button
                onClick={() => setActiveSourceTab('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                  activeSourceTab === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Nhập Đoạn Văn Bản / Vụ Việc</span>
              </button>
            </div>

            {activeSourceTab === 'news' ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <select
                  value={selectedNewsId}
                  onChange={(e) => setSelectedNewsId(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Chọn bài viết tin tức để AI sinh câu hỏi --</option>
                  {newsList.map((n) => (
                    <option key={n._id || n.id} value={n._id || n.id}>
                      [{n.category}] {n.title}
                    </option>
                  ))}
                </select>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 whitespace-nowrap">Số câu:</span>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(e.target.value)}
                    className="px-3 py-2 bg-[#111827] border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="2">2 câu</option>
                    <option value="3">3 câu</option>
                    <option value="5">5 câu</option>
                  </select>

                  <button
                    disabled={isGeneratingAi || !selectedNewsId}
                    onClick={handleGenerateAI}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Đang Đọc & Tạo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tạo Thêm Bằng AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={rawTextContent}
                  onChange={(e) => setRawTextContent(e.target.value)}
                  placeholder="Dán nội dung bài báo, thủ đoạn lừa đảo hoặc tình huống thực tế vào đây..."
                  className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <div className="flex justify-end items-center space-x-3">
                  <span className="text-xs text-slate-400">Số câu hỏi:</span>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(e.target.value)}
                    className="px-3 py-1.5 bg-[#111827] border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="2">2 câu</option>
                    <option value="3">3 câu</option>
                    <option value="5">5 câu</option>
                  </select>
                  <button
                    disabled={isGeneratingAi || !rawTextContent.trim()}
                    onClick={handleGenerateAI}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 disabled:opacity-50 transition-colors"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Đang Đọc & Tạo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tạo Thêm Bằng AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── BẢNG TÍNH SPREADSHEET GRID (STRICT FLAT DESIGN - NO GRADIENT) ── */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0a0f1d]">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1e293b] text-slate-300 font-bold border-b border-slate-700 uppercase tracking-wider sticky top-0 z-10">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3 w-72">Tình Huống / Câu Hỏi</th>
                    <th className="p-3 w-32">Thể Loại</th>
                    <th className="p-3 min-w-[180px]">Phương Án A</th>
                    <th className="p-3 min-w-[180px]">Phương Án B</th>
                    <th className="p-3 min-w-[180px]">Phương Án C</th>
                    <th className="p-3 min-w-[180px]">Phương Án D</th>
                    <th className="p-3 w-64">Giải Thích Chi Tiết</th>
                    <th className="p-3 w-12 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {gridQuestions.map((row, qIdx) => (
                    <tr key={row.tempId || qIdx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                        {qIdx + 1}
                      </td>

                      {/* Title */}
                      <td className="p-2">
                        <textarea
                          rows={2}
                          value={row.title}
                          onChange={(e) => handleQuestionChange(qIdx, 'title', e.target.value)}
                          placeholder="Nhập tình huống / câu hỏi..."
                          className="w-full p-2 bg-[#111827] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      </td>

                      {/* Type */}
                      <td className="p-2">
                        <select
                          value={row.type}
                          onChange={(e) => handleQuestionChange(qIdx, 'type', e.target.value)}
                          className="w-full p-2 bg-[#111827] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="scenario">Tình huống</option>
                          <option value="email">Email</option>
                          <option value="url">URL</option>
                          <option value="general">Chung</option>
                        </select>
                      </td>

                      {/* Options A, B, C, D */}
                      {[0, 1, 2, 3].map((optIdx) => {
                        const opt = row.options?.[optIdx] || { text: '', isCorrect: false };
                        return (
                          <td key={optIdx} className="p-2">
                            <div className={`p-1.5 rounded-lg border flex items-center space-x-2 ${
                              opt.isCorrect
                                ? 'bg-emerald-950/40 border-emerald-500'
                                : 'bg-[#111827] border-slate-800'
                            }`}>
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={opt.isCorrect}
                                onChange={() => handleSetCorrectOption(qIdx, optIdx)}
                                className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer shrink-0"
                                title="Chọn làm đáp án đúng"
                              />
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                                placeholder={`Phương án ${String.fromCharCode(65 + optIdx)}...`}
                                className="w-full bg-transparent border-none text-xs text-white focus:outline-none"
                              />
                            </div>
                          </td>
                        );
                      })}

                      {/* Explanation */}
                      <td className="p-2">
                        <textarea
                          rows={2}
                          value={row.explanation}
                          onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                          placeholder="Vì sao đáp án đúng, dấu hiệu lừa đảo..."
                          className="w-full p-2 bg-[#111827] border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      </td>

                      {/* Delete row */}
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleRemoveRow(qIdx)}
                          className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer for Editor (Flat solid buttons) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
            <button
              onClick={handleAddRow}
              className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white rounded-xl flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Thêm Dòng Trống</span>
            </button>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Hủy Bỏ
              </button>

              <button
                disabled={isSavingTopic}
                onClick={handleSaveTopicAndQuestions}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-md disabled:opacity-50"
              >
                {isSavingTopic ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Lưu Chủ Đề...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>LƯU CHỦ ĐỀ NÀY (KÈM {gridQuestions.length} CÂU HỎI)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuiz;
