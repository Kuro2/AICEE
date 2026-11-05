import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  ShieldAlert, 
  Mail, 
  Globe, 
  Video, 
  ArrowRight, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { quizAPI } from '@/services/api';

const QuizHub = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    let isMounted = true;
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const res = await quizAPI.getTopics({
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchQuery || undefined
        });
        if (isMounted && res.success && res.data) {
          setTopics(res.data.topics || []);
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách chủ đề Quiz:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTopics();
    return () => { isMounted = false; };
  }, [selectedCategory, searchQuery]);

  const categories = [
    { id: 'all', label: 'Tất cả chủ đề' },
    { id: 'scenario', label: 'Tình huống lừa đảo' },
    { id: 'email', label: 'Email Phishing' },
    { id: 'url', label: 'Website & Liên kết' }
  ];

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'email':
        return <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">Email Phishing</span>;
      case 'url':
        return <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">Website Giả Mạo</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-950 text-blue-400 border border-blue-800">Tình Huống Scam</span>;
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
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          {/* Page Header (Flat, no gradient) */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">
              <BookOpen className="w-4 h-4" />
              <span>Thư viện Trắc nghiệm An ninh mạng</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              Chủ Đề Trắc Nghiệm Phòng Chống Lừa Đảo
            </h1>
            <p className="text-sm sm:text-base text-slate-400">
              Chọn một chủ đề bên dưới để luyện tập kỹ năng nhận diện thủ đoạn lừa đảo qua các tình huống thực tế.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm chủ đề..."
                className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Topic Cards Grid (Flat solid containers, no gradient) */}
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Đang tải danh sách chủ đề...</p>
            </div>
          ) : topics.length === 0 ? (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center">
              <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Không tìm thấy chủ đề phù hợp</h3>
              <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {topics.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#111827] border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {getCategoryBadge(t.category)}
                      <span className="text-xs font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        /quiz/{t.slug}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      {t.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {t.description || 'Rèn luyện khả năng phát hiện các dấu hiệu bất thường và bẫy tâm lý lừa đảo qua các câu hỏi tình huống.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <span className="font-semibold text-slate-300 font-mono">
                        {t.questionCount} câu hỏi
                      </span>
                      <span>•</span>
                      {getDifficultyBadge(t.difficulty)}
                    </div>

                    <Link
                      to={`/quiz/${t.slug}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl inline-flex items-center space-x-1.5 transition-colors"
                    >
                      <span>Làm bài</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuizHub;
