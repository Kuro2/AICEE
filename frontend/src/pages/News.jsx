import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Calendar, ArrowRight, BookOpen, Search, Loader, AlertCircle, Tag, RefreshCw, Sparkles, TrendingUp, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { newsAPI } from '@/services/api';

const News = () => {
  const navigate = useNavigate();
  const [newsItems, setNewsItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeMsg, setSubscribeMsg] = useState(null);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  // Lấy tin tức từ API
  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await newsAPI.getAll(1, 10, selectedCategory, searchQuery || null);
      if (res.success) {
        setNewsItems(res.data.news);
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải tin tức. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy categories
  const fetchCategories = async () => {
    try {
      const res = await newsAPI.getCategories();
      if (res.success) setCategories(res.data.categories);
    } catch {
      // Bỏ qua lỗi categories
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, searchQuery]);

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  // Đăng ký bản tin
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subscribeEmail) return;

    setSubscribeLoading(true);
    setSubscribeMsg(null);
    try {
      const res = await newsAPI.subscribe(subscribeEmail);
      setSubscribeMsg({ type: res.success ? 'success' : 'error', text: res.message });
      if (res.success) setSubscribeEmail('');
    } catch (err) {
      setSubscribeMsg({ type: 'error', text: 'Có lỗi xảy ra. Vui lòng thử lại.' });
    } finally {
      setSubscribeLoading(false);
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Cảnh báo lừa đảo': return 'bg-red-500/80 text-red-100 border-red-500/40';
      case 'Cập nhật sản phẩm': return 'bg-cyan-500/80 text-cyan-100 border-cyan-500/40';
      case 'Kiến thức an toàn': return 'bg-emerald-500/80 text-emerald-100 border-emerald-500/40';
      case 'Báo cáo bảo mật': return 'bg-purple-500/80 text-purple-100 border-purple-500/40';
      default: return 'bg-blue-500/80 text-blue-100 border-blue-500/40';
    }
  };

  const featuredNews = newsItems.length > 0 ? newsItems[0] : null;
  const regularNews = newsItems.length > 1 ? newsItems.slice(1) : newsItems;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 relative overflow-hidden flex flex-col font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/4 w-[600px] h-[500px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />

      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 relative z-10 max-w-7xl">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              Trung Tâm Tin Tức &amp; Tình Báo Mối Đe Dọa
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Tin Tức An Ninh Mạng
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Cập nhật diễn biến mới nhất về các chiến dịch lừa đảo trực tuyến, cảnh báo an toàn từ các chuyên gia AICEE và chính sách công nghệ.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-12 max-w-3xl mx-auto space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm tin tức, thủ đoạn lừa đảo..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 text-sm transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0"
            >
              Tìm Kiếm
            </button>
            {(searchQuery || selectedCategory) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchInput('');
                  setSelectedCategory(null);
                }}
                className="px-4 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl transition-colors flex items-center space-x-1.5 text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </form>

          {/* Category Chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  !selectedCategory
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                }`}
              >
                Tất cả chủ đề
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Loading & Error States */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Đang tải bản tin an ninh...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-red-400 text-base">{error}</p>
            <button
              onClick={fetchNews}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : newsItems.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-base">Không tìm thấy tin tức phù hợp.</p>
            <button
              onClick={() => { setSearchQuery(''); setSearchInput(''); setSelectedCategory(null); }}
              className="mt-3 text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors"
            >
              Xem tất cả bài viết →
            </button>
          </div>
        ) : (
          <div className="space-y-12 mb-16">
            {/* Featured Article Card (if no search filter) */}
            {!searchQuery && !selectedCategory && featuredNews && (
              <div
                onClick={() => navigate(`/news/${featuredNews.id}`)}
                className="group relative rounded-3xl bg-gradient-to-b from-cyan-950/30 to-slate-900/40 border border-cyan-500/30 backdrop-blur-2xl p-6 sm:p-8 overflow-hidden cursor-pointer hover:border-cyan-500/60 transition-all duration-300 hover:shadow-[0_0_40px_rgba(6,182,212,0.2)]"
              >
                <div className="grid lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 h-64 sm:h-80 rounded-2xl overflow-hidden relative">
                    <img
                      src={featuredNews.image}
                      alt={featuredNews.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Tiêu Điểm
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center space-x-3 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{featuredNews.date}</span>
                        </span>
                        {featuredNews.category && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryColor(featuredNews.category)}`}>
                            {featuredNews.category}
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {featuredNews.title}
                      </h2>

                      <p className="text-gray-400 text-sm sm:text-base leading-relaxed mt-3 line-clamp-3">
                        {featuredNews.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                      <span>Đọc toàn bộ bài phân tích</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Regular Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(searchQuery || selectedCategory ? newsItems : regularNews).map((news) => (
                <article
                  key={news.id}
                  onClick={() => navigate(`/news/${news.id}`)}
                  className="group relative rounded-3xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md border ${getCategoryColor(news.category)}`}>
                        {news.category}
                      </span>
                    </div>
                    {news.views && (
                      <div className="absolute bottom-3 right-3 bg-black/60 text-gray-300 text-xs px-2.5 py-1 rounded-full backdrop-blur-md">
                        👁 {news.views.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center text-gray-500 text-xs mb-3 space-x-3">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{news.date}</span>
                      </span>
                      {news.author && (
                        <span>• {news.author}</span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {news.title}
                    </h3>

                    <p className="text-gray-400 text-xs sm:text-sm mb-4 flex-grow line-clamp-3 leading-relaxed">
                      {news.excerpt}
                    </p>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform mt-auto">
                      <span>Chi tiết bài viết</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Newsletter Subscription Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900/70 to-cyan-950/60 border border-cyan-500/30 p-8 sm:p-12 backdrop-blur-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center lg:text-left">
            <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Bản Tin Cảnh Báo An Ninh
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Nhận Cảnh Báo Sớm Trực Tiếp Qua Email
            </h3>
            <p className="text-gray-300 text-sm max-w-xl">
              Không bỏ lỡ bất kỳ biến thể mã độc hay thủ đoạn lừa đảo ngân hàng mới nào đang nhắm vào người dùng tại Việt Nam.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 shrink-0">
            <input
              type="email"
              value={subscribeEmail}
              onChange={(e) => setSubscribeEmail(e.target.value)}
              placeholder="Nhập địa chỉ email của bạn..."
              className="px-5 py-3.5 rounded-2xl bg-black/40 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 w-full sm:w-80"
            />
            <button
              type="submit"
              disabled={subscribeLoading}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-60 flex items-center justify-center shrink-0"
            >
              {subscribeLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Đăng Ký Nhận Tin'}
            </button>
          </form>
        </div>

        {subscribeMsg && (
          <div className={`mt-4 p-3 rounded-xl text-center text-xs font-semibold ${
            subscribeMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {subscribeMsg.text}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default News;
