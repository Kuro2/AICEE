import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
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
  Save,
  FileText,
  ShieldAlert,
  Edit3,
  ExternalLink,
  Minus,
  Check,
  ListChecks,
  LayoutList,
  Table,
  Copy,
  Lightbulb
} from 'lucide-react';
import { adminAPI, newsAPI, reportAPI } from '@/services/api';

const AdminQuizEditor = () => {
  const { id } = useParams(); // Nếu có id -> Chế độ Chỉnh sửa; Nếu không -> Tạo mới
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  // Chế độ xem câu hỏi: 'card' (thẻ dọc rộng rãi, dễ đọc) | 'table' (bảng ngang thu gọn)
  const [viewMode, setViewMode] = useState('card');

  // Form Thông Tin Chủ Đề
  const [topicForm, setTopicForm] = useState({
    title: '',
    slug: '',
    description: '',
    category: 'scenario',
    difficulty: 'medium',
    status: 'published'
  });

  // Bảng tính câu hỏi
  const [gridQuestions, setGridQuestions] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Nguồn Sinh Đề AI
  const [activeSourceTab, setActiveSourceTab] = useState('news'); // 'news' | 'report' | 'text'
  const [newsList, setNewsList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [loadingSources, setLoadingSources] = useState(false);

  // Tìm kiếm bài báo / báo cáo nguồn
  const [sourceSearchQuery, setSourceSearchQuery] = useState('');
  const [selectedNewsId, setSelectedNewsId] = useState('');
  const [selectedReportId, setSelectedReportId] = useState('');
  const [rawTextContent, setRawTextContent] = useState('');

  // Số lượng câu hỏi (Dễ dàng chỉnh sửa, giới hạn 1 - 10 câu)
  const [aiCount, setAiCount] = useState(3);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Tải dữ liệu ban đầu nếu là chế độ Sửa
  useEffect(() => {
    if (isEditing) {
      const fetchTopicDetail = async () => {
        setLoadingInitial(true);
        try {
          const res = await adminAPI.getQuizTopic(id);
          if (res.success && res.data?.topic) {
            const t = res.data.topic;
            setTopicForm({
              title: t.title || '',
              slug: t.slug || '',
              description: t.description || '',
              category: t.category || 'scenario',
              difficulty: t.difficulty || 'medium',
              status: t.status || 'published'
            });

            const mapped = (t.questions || []).map((q, idx) => ({
              tempId: idx + 1,
              title: q.title || '',
              type: q.type || 'scenario',
              difficulty: q.difficulty || 'medium',
              explanation: q.explanation || '',
              options: (q.options || []).map(o => ({
                text: o.text || '',
                isCorrect: o.isCorrect === true
              }))
            }));

            setGridQuestions(mapped);
          } else {
            showToast('Không tìm thấy chủ đề', 'error');
            navigate('/admin/quiz');
          }
        } catch (err) {
          showToast(err.message || 'Lỗi khi tải dữ liệu chủ đề', 'error');
        } finally {
          setLoadingInitial(false);
        }
      };
      fetchTopicDetail();
    } else {
      // Mặc định tạo mới: thêm 1 dòng câu hỏi trắng
      setGridQuestions([createEmptyRow(1)]);
    }
  }, [id, isEditing]);

  // Cảnh báo người dùng nếu vô tình F5 hoặc tắt tab khi đã có nội dung
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasContent = gridQuestions.some(q => q.title && q.title.trim().length > 0);
      if (hasContent) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gridQuestions]);

  // 2. Tải danh sách bài báo & báo cáo nguồn để tìm kiếm
  useEffect(() => {
    const fetchSources = async () => {
      setLoadingSources(true);
      try {
        const [newsRes, reportsRes] = await Promise.allSettled([
          newsAPI.getAll(1, 50),
          reportAPI.getAll({ limit: 50 })
        ]);

        if (newsRes.status === 'fulfilled' && newsRes.value?.success) {
          const list = newsRes.value.data?.news || [];
          setNewsList(list);

          const sourceParam = searchParams.get('sourceNewsId');
          if (sourceParam && !isEditing) {
            setSelectedNewsId(sourceParam);
            const selected = list.find(n => (n._id || n.id) === sourceParam);
            if (selected) {
              handleTitleChange(`Nhận diện: ${selected.title}`);
              setTopicForm(prev => ({
                ...prev,
                description: selected.summary || selected.content?.slice(0, 150) || ''
              }));
            }
          }
        }
        if (reportsRes.status === 'fulfilled' && reportsRes.value?.success) {
          setReportsList(reportsRes.value.data?.reports || []);
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách nguồn sinh đề:', err.message);
      } finally {
        setLoadingSources(false);
      }
    };
    fetchSources();
  }, []);

  // Helper tạo 1 dòng trống
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
    setGridQuestions(prev => [...prev, createEmptyRow(Date.now())]);
  };

  const handleRemoveRow = (idx) => {
    setGridQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDuplicateRow = (idx) => {
    setGridQuestions(prev => {
      const target = prev[idx];
      const clone = {
        ...target,
        tempId: Date.now(),
        title: target.title ? `${target.title} (Bản sao)` : '',
        options: (target.options || []).map(o => ({ ...o }))
      };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
    showToast('Đã nhân bản câu hỏi');
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

  // Điều chỉnh số lượng câu hỏi với giới hạn nghiêm ngặt [1 - 10]
  const handleCountChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setAiCount(1);
    } else {
      setAiCount(Math.min(Math.max(num, 1), 10));
    }
  };

  // Tự động sinh slug từ tiêu đề
  const handleTitleChange = (newTitle) => {
    setTopicForm(prev => {
      // Chỉ tự động cập nhật slug nếu slug đang trống hoặc người dùng chưa chỉnh sửa riêng
      const autoSlug = newTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 35);

      return {
        ...prev,
        title: newTitle,
        slug: isEditing ? prev.slug : (prev.slug ? prev.slug : autoSlug)
      };
    });
  };

  // Lọc bài báo theo từ khóa tìm kiếm
  const filteredNews = newsList.filter(n => {
    if (!sourceSearchQuery.trim()) return true;
    const q = sourceSearchQuery.toLowerCase();
    return (
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.category && n.category.toLowerCase().includes(q)) ||
      (n.summary && n.summary.toLowerCase().includes(q))
    );
  });

  // Lọc báo cáo theo từ khóa tìm kiếm
  const filteredReports = reportsList.filter(r => {
    if (!sourceSearchQuery.trim()) return true;
    const q = sourceSearchQuery.toLowerCase();
    return (
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.target && r.target.toLowerCase().includes(q)) ||
      (r.type && r.type.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  });

  // Sinh câu hỏi bằng AI
  const handleGenerateAI = async () => {
    if (activeSourceTab === 'news' && !selectedNewsId) {
      showToast('Vui lòng chọn 1 bài báo nguồn từ danh sách tìm kiếm', 'error');
      return;
    }
    if (activeSourceTab === 'report' && !selectedReportId) {
      showToast('Vui lòng chọn 1 vụ việc báo cáo nguồn từ danh sách', 'error');
      return;
    }
    if (activeSourceTab === 'text' && !rawTextContent.trim()) {
      showToast('Vui lòng nhập nội dung vụ việc cần AI phân tích', 'error');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const payload = {
        newsId: activeSourceTab === 'news' ? selectedNewsId : null,
        reportId: activeSourceTab === 'report' ? selectedReportId : null,
        rawContent: activeSourceTab === 'text' ? rawTextContent : null,
        count: aiCount
      };

      const res = await adminAPI.generateQuiz(payload);
      if (res.success && Array.isArray(res.data?.questions)) {
        const newQuestions = res.data.questions.map((q, idx) => {
          const rawOpts = q.options || [];
          const normalizedOpts = [0, 1, 2, 3].map(i => ({
            text: rawOpts[i]?.text || '',
            isCorrect: rawOpts[i]?.isCorrect === true
          }));
          if (!normalizedOpts.some(o => o.isCorrect)) {
            normalizedOpts[0].isCorrect = true;
          }
          return {
            tempId: Date.now() + idx,
            title: q.title || '',
            type: q.type || 'scenario',
            difficulty: q.difficulty || 'medium',
            explanation: q.explanation || '',
            options: normalizedOpts
          };
        });

        setGridQuestions(prev => {
          // Nếu bảng chỉ có 1 câu trắng thì thay thế, ngược lại thêm vào cuối
          if (prev.length === 1 && !prev[0].title.trim()) {
            return newQuestions;
          }
          return [...prev, ...newQuestions];
        });

        showToast(`AI đã phân tích nội dung và sinh thành công ${newQuestions.length} câu hỏi vào bảng tính!`);

        // Tự động gợi ý tên chủ đề nếu form tiêu đề đang để trống
        if (!topicForm.title) {
          if (activeSourceTab === 'news') {
            const selectedItem = newsList.find(n => (n._id || n.id) === selectedNewsId);
            if (selectedItem) handleTitleChange(selectedItem.title);
          } else if (activeSourceTab === 'report') {
            const selectedItem = reportsList.find(r => (r._id || r.id) === selectedReportId);
            if (selectedItem) handleTitleChange(`Cảnh giác: ${selectedItem.title || selectedItem.target}`);
          }
        }
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi gọi AI sinh câu hỏi', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Nhập từ file Excel
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

  // Xuất Excel
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

  // Lưu Chủ đề & Toàn bộ câu hỏi
  const handleSaveTopic = async () => {
    if (!topicForm.title.trim()) {
      showToast('Vui lòng nhập tên chủ đề trắc nghiệm', 'error');
      return;
    }
    if (!topicForm.slug.trim()) {
      showToast('Vui lòng nhập đường dẫn tên miền riêng (ví dụ: luadao, email)', 'error');
      return;
    }

    const validQuestions = gridQuestions.filter(q => {
      const hasTitle = q.title && q.title.trim().length > 0;
      const validOptions = (q.options || []).filter(o => o.text && o.text.trim().length > 0);
      const hasCorrect = validOptions.some(o => o.isCorrect === true);
      return hasTitle && validOptions.length >= 2 && hasCorrect;
    });

    if (validQuestions.length === 0) {
      showToast('Cần ít nhất 1 câu hỏi hợp lệ (có nội dung, tối thiểu 2 phương án và chọn 1 đáp án đúng)', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...topicForm,
        sourceNewsId: selectedNewsId || null,
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

      if (isEditing) {
        await adminAPI.updateQuizTopic(id, payload);
        showToast('Cập nhật chủ đề thành công!');
      } else {
        await adminAPI.createQuizTopic(payload);
        showToast('Tạo mới chủ đề trắc nghiệm thành công!');
      }

      // Điều hướng về trang danh sách chủ đề
      setTimeout(() => {
        navigate('/admin/quiz');
      }, 1000);
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu chủ đề', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="p-12 text-center text-slate-400 bg-[#090d16] min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
        Đang tải thông tin chủ đề...
      </div>
    );
  }

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

      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <Link
            to="/admin/quiz"
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-cyan-400 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Quay lại danh sách Chủ Đề
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <span>{isEditing ? 'Chỉnh Sửa Bộ Đề Chủ Đề' : 'Tạo Chủ Đề Trắc Nghiệm Mới'}</span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-800 text-cyan-400">
              {gridQuestions.length} câu trên bảng
            </span>
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-[#111827] hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Xuất Excel</span>
          </button>

          <label className="px-3 py-2 rounded-xl bg-[#111827] hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center space-x-1.5 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nạp Excel</span>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>


      {/* ── KHỐI 1: THÔNG TIN CHỦ ĐỀ VÀ TÊN MIỀN RIÊNG ── */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
          <span>1. Thiết Lập Chủ Đề & Tên Miền Truy Cập</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Tên Chủ Đề <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={topicForm.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ví dụ: Nhận Diện Bẫy Lừa Đảo Việc Làm Thao Túng Tâm Lý"
              className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Tên Miền Truy Cập Riêng <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-slate-900 border border-r-0 border-slate-800 rounded-l-xl text-xs font-mono text-slate-400">
                /quiz/
              </span>
              <input
                type="text"
                value={topicForm.slug}
                onChange={(e) => setTopicForm({ ...topicForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                placeholder="luadao, email, vieclam..."
                className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-800 rounded-r-xl text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Học viên sẽ truy cập bài thi tại: http://localhost:3000/quiz/{topicForm.slug || '[slug]'}
            </p>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Mô Tả Chủ Đề</label>
            <input
              type="text"
              value={topicForm.description}
              onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
              placeholder="Tóm tắt ngắn gọn các kỹ năng học viên sẽ được rèn luyện trong chủ đề này..."
              className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Thể Loại</label>
              <select
                value={topicForm.category}
                onChange={(e) => setTopicForm({ ...topicForm, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="scenario">Tình huống lừa đảo</option>
                <option value="email">Email Phishing</option>
                <option value="url">Website & Liên kết</option>
                <option value="general">Tổng hợp</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Độ Khó</label>
              <select
                value={topicForm.difficulty}
                onChange={(e) => setTopicForm({ ...topicForm, difficulty: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="easy">Cơ bản</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Nâng cao</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── KHỐI 2: CÔNG CỤ SINH ĐỀ AI VỚI TÌM KIẾM NGUỒN & ĐIỀU CHỈNH SỐ CÂU ── */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>2. Công Cụ Sinh Đề Tự Động Bằng AI</span>
          </h2>

          {/* Tab chọn loại nguồn */}
          <div className="flex items-center space-x-1 bg-[#0f172a] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSourceTab('news')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                activeSourceTab === 'news'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bài Báo Tin Tức</span>
            </button>

            <button
              onClick={() => setActiveSourceTab('report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                activeSourceTab === 'report'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Báo Cáo Lừa Đảo</span>
            </button>

            <button
              onClick={() => setActiveSourceTab('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                activeSourceTab === 'text'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Dán Nội Dung Tự Do</span>
            </button>
          </div>
        </div>

        {/* Nguồn 1: Tìm kiếm trong danh sách bài báo */}
        {activeSourceTab === 'news' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={sourceSearchQuery}
                onChange={(e) => setSourceSearchQuery(e.target.value)}
                placeholder="Gõ từ khóa để tìm kiếm bài báo (ví dụ: Deep learning, việc làm, ngân hàng, VNeID)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Danh sách bài báo có thể cuộn và click chọn trực quan */}
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1 border border-slate-800/80 rounded-xl p-2 bg-[#0a0f1d]">
              {filteredNews.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Không tìm thấy bài báo nào khớp với từ khóa "{sourceSearchQuery}".
                </div>
              ) : (
                filteredNews.map((n) => {
                  const isSelected = selectedNewsId === (n._id || n.id);
                  return (
                    <div
                      key={n._id || n.id}
                      onClick={() => setSelectedNewsId(n._id || n.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 text-white'
                          : 'bg-[#111827] border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 uppercase">
                            {n.category || 'Tin tức'}
                          </span>
                          <span className="text-xs font-bold text-white line-clamp-1">
                            {n.title}
                          </span>
                        </div>
                        {n.summary && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {n.summary}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 pt-1">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-700" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Nguồn 2: Tìm kiếm trong danh sách báo cáo lừa đảo */}
        {activeSourceTab === 'report' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={sourceSearchQuery}
                onChange={(e) => setSourceSearchQuery(e.target.value)}
                placeholder="Tìm kiếm vụ việc báo cáo theo đối tượng, số điện thoại, website lừa đảo..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="max-h-52 overflow-y-auto space-y-2 pr-1 border border-slate-800/80 rounded-xl p-2 bg-[#0a0f1d]">
              {filteredReports.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Chưa có báo cáo nào khớp với tìm kiếm.
                </div>
              ) : (
                filteredReports.map((r) => {
                  const isSelected = selectedReportId === (r._id || r.id);
                  return (
                    <div
                      key={r._id || r.id}
                      onClick={() => setSelectedReportId(r._id || r.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-rose-950/40 border-rose-500 text-white'
                          : 'bg-[#111827] border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-rose-400">
                            {r.type}
                          </span>
                          <span className="text-xs font-bold text-white line-clamp-1">
                            {r.title || r.target}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {r.description}
                        </p>
                      </div>

                      <div className="shrink-0 pt-1">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-700" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Nguồn 3: Nhập văn bản tự do */}
        {activeSourceTab === 'text' && (
          <div className="space-y-2">
            <textarea
              rows={4}
              value={rawTextContent}
              onChange={(e) => setRawTextContent(e.target.value)}
              placeholder="Dán nội dung bài báo, tài liệu tập huấn hoặc tình huống lừa đảo thực tế vào đây để AI phân tích..."
              className="w-full p-3.5 bg-[#0f172a] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        {/* ── BỘ ĐIỀU CHỈNH SỐ LƯỢNG CÂU HỎI & NÚT SINH ĐỀ AI ── */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
              Số câu hỏi cần tạo:
            </span>

            {/* Stepper điều chỉnh số câu dễ dàng */}
            <div className="flex items-center border border-slate-700 rounded-xl bg-[#0f172a] overflow-hidden">
              <button
                type="button"
                onClick={() => handleCountChange(aiCount - 1)}
                disabled={aiCount <= 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
                title="Giảm 1 câu"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                type="number"
                min="1"
                max="10"
                value={aiCount}
                onChange={(e) => handleCountChange(e.target.value)}
                className="w-12 text-center bg-transparent text-sm font-bold font-mono text-cyan-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleCountChange(aiCount + 1)}
                disabled={aiCount >= 10}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
                title="Tăng 1 câu"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Các phím chọn nhanh số câu */}
            <div className="flex items-center space-x-1.5">
              {[2, 3, 5, 8, 10].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAiCount(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    aiCount === preset
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {preset} câu
                </button>
              ))}
            </div>

            <span className="text-[11px] text-slate-500 hidden md:inline">
              (Giới hạn: 1 - 10 câu/lần)
            </span>
          </div>

          <button
            disabled={isGeneratingAi}
            onClick={handleGenerateAI}
            className="w-full sm:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 shadow-md shrink-0"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI Đang Phân Tích & Sinh {aiCount} Câu...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>⚡ SINH {aiCount} CÂU HỎI VÀO BẢNG TÍNH</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── KHỐI 3: DANH SÁCH CHI TIẾT CÂU HỎI & ĐÁP ÁN (DẠNG THẺ DỌC MỞ RỘNG) ── */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
              <ListChecks className="w-4 h-4 text-cyan-400" />
              <span>3. Tinh Chỉnh Chi Tiết Từng Câu Hỏi &amp; Đáp Án</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300">
                {gridQuestions.length} câu
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Mỗi câu hỏi được hiển thị theo từng khối dọc rộng rãi giúp bạn dễ dàng đọc toàn bộ tình huống và chỉnh sửa.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bộ chuyển đổi chế độ xem */}
            <div className="flex items-center bg-[#0f172a] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                  viewMode === 'card'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Dạng khối thẻ rộng rãi, dễ đọc và chỉnh sửa"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Thẻ Dọc (Chi Tiết)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Dạng bảng tính Excel thu gọn"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Bảng Ngang</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddRow}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 border border-cyan-500 text-xs font-bold text-white rounded-xl flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Câu Hỏi</span>
            </button>
          </div>
        </div>

        {/* 1. CHẾ ĐỘ THẺ DỌC MỞ RỘNG (MẶC ĐỊNH - DỄ ĐỌC & SỬA NHẤT) */}
        {viewMode === 'card' ? (
          <div className="space-y-6">
            {gridQuestions.map((row, qIdx) => (
              <div
                key={row.tempId || qIdx}
                className="bg-[#0b1120] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 sm:p-6 space-y-5 transition-all shadow-lg"
              >
                {/* Header Thẻ: Số thứ tự + Thể loại + Độ khó + Nút Xóa/Nhân bản */}
                <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-800/80 gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-700/60 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm shadow-sm">
                      {qIdx + 1}
                    </span>
                    <span className="text-sm font-bold text-white">
                      Câu Hỏi #{qIdx + 1}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Thể loại */}
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                      <span>Loại:</span>
                      <select
                        value={row.type}
                        onChange={(e) => handleQuestionChange(qIdx, 'type', e.target.value)}
                        className="px-2.5 py-1.5 bg-[#111827] border border-slate-700 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="scenario">Tình huống thực tế</option>
                        <option value="email">Email Phishing</option>
                        <option value="url">Website / URL</option>
                        <option value="general">Kiến thức chung</option>
                      </select>
                    </div>

                    {/* Độ khó */}
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                      <span>Độ khó:</span>
                      <select
                        value={row.difficulty || 'medium'}
                        onChange={(e) => handleQuestionChange(qIdx, 'difficulty', e.target.value)}
                        className="px-2.5 py-1.5 bg-[#111827] border border-slate-700 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="easy">Cơ bản</option>
                        <option value="medium">Trung bình</option>
                        <option value="hard">Nâng cao</option>
                      </select>
                    </div>

                    {/* Nhân bản câu hỏi */}
                    <button
                      type="button"
                      onClick={() => handleDuplicateRow(qIdx)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Nhân bản câu hỏi này"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Xóa câu hỏi */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(qIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 1. TÌNH HUỐNG / NỘI DUNG CÂU HỎI (Rộng toàn màn hình, rows=3-4) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>Nội Dung Tình Huống / Câu Hỏi</span>
                    <span className="text-[11px] font-normal text-slate-500 lowercase">
                      {row.title?.length || 0} ký tự
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={row.title}
                    onChange={(e) => handleQuestionChange(qIdx, 'title', e.target.value)}
                    placeholder="Nhập tình huống hoặc câu hỏi đầy đủ (ví dụ: Bạn nhận được cuộc gọi từ số lạ tự xưng là cán bộ công an yêu cầu chuyển tiền vào tài khoản bảo chứng để kiểm tra...)"
                    className="w-full p-3.5 bg-[#111827] border border-slate-700/80 rounded-xl text-sm leading-relaxed text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500 resize-y"
                  />
                </div>

                {/* 2. CÁC PHƯƠNG ÁN LỰA CHỌN (Lưới 2 cột hoặc 1 cột thoáng đãng) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Các Phương Án Lựa Chọn &amp; Đáp Án Đúng:
                    </label>
                    <span className="text-[11px] text-cyan-400">
                      (Bấm vào nút tròn để chọn phương án làm đáp án đúng)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((optIdx) => {
                      const opt = row.options?.[optIdx] || { text: '', isCorrect: false };
                      const optLetter = String.fromCharCode(65 + optIdx);
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                          className={`p-3.5 rounded-xl border transition-all flex items-start space-x-3 cursor-pointer ${
                            opt.isCorrect
                              ? 'bg-[#064e3b]/30 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
                              : 'bg-[#111827] border-slate-700/80 hover:border-slate-600 text-slate-300'
                          }`}
                        >
                          <div className="pt-0.5 shrink-0 flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={opt.isCorrect}
                              onChange={() => handleSetCorrectOption(qIdx, optIdx)}
                              className="w-4 h-4 accent-emerald-500 cursor-pointer"
                              title="Đặt làm đáp án đúng"
                            />
                            <span className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center ${
                              opt.isCorrect
                                ? 'bg-emerald-500 text-black font-extrabold'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {optLetter}
                            </span>
                          </div>

                          <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              rows={2}
                              value={opt.text}
                              onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                              placeholder={`Nội dung phương án ${optLetter}...`}
                              className="w-full bg-transparent border-none text-xs sm:text-sm text-white focus:outline-none resize-none leading-relaxed placeholder-slate-600"
                            />
                          </div>

                          {opt.isCorrect && (
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              Đáp án đúng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. LỜI GIẢI THÍCH CHI TIẾT (Full width, thoáng đãng) */}
                <div className="space-y-2 pt-1 border-t border-slate-800/60">
                  <label className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Giải Thích Chi Tiết &amp; Lời Khuyên An Ninh Mạng:</span>
                  </label>
                  <textarea
                    rows={2}
                    value={row.explanation}
                    onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                    placeholder="Giải thích vì sao phương án trên là đúng, chỉ rõ dấu hiệu lừa đảo và cách phòng tránh để học viên hiểu sâu..."
                    className="w-full p-3 bg-[#111827] border border-slate-700/80 rounded-xl text-xs sm:text-sm leading-relaxed text-slate-300 focus:outline-none focus:border-cyan-500 placeholder-slate-600 resize-y"
                  />
                </div>
              </div>
            ))}

            {/* Nút to thêm câu hỏi ở cuối danh sách thẻ */}
            <button
              type="button"
              onClick={handleAddRow}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/60 hover:bg-slate-900/40 text-slate-400 hover:text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Câu Hỏi Mới</span>
            </button>
          </div>
        ) : (
          /* 2. CHẾ ĐỘ BẢNG NGANG THU GỌN (CHO AI MUỐN XEM TỔNG QUAN) */
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0a0f1d]">
            <div className="overflow-x-auto max-h-[600px]">
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

                      <td className="p-2">
                        <textarea
                          rows={2}
                          value={row.title}
                          onChange={(e) => handleQuestionChange(qIdx, 'title', e.target.value)}
                          placeholder="Nhập tình huống / câu hỏi..."
                          className="w-full p-2 bg-[#111827] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      </td>

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

                      <td className="p-2">
                        <textarea
                          rows={2}
                          value={row.explanation}
                          onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                          placeholder="Vì sao đáp án đúng, dấu hiệu cảnh báo..."
                          className="w-full p-2 bg-[#111827] border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
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
        )}

        {/* Thanh tác vụ Lưu Chủ đề */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/admin/quiz"
            className="text-xs font-semibold text-slate-400 hover:text-white"
          >
            ← Hủy và quay lại danh sách
          </Link>

          <button
            disabled={isSaving}
            onClick={handleSaveTopic}
            className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-md disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang Lưu Vào CSDL...</span>
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
  );
};

export default AdminQuizEditor;
