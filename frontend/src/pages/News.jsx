import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Calendar, ArrowRight, BookOpen, Search, Loader, AlertCircle, Tag, RefreshCw } from 'lucide-react';
import { newsAPI } from '@/services/api';

const News = () => {
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
  const [selectedNews, setSelectedNews] = useState(null); // chi tiết bài đọc

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

  // Màu sắc category
  const categoryColors = {
    'Cảnh báo lừa đảo': 'bg-red-500/90',
    'Cập nhật sản phẩm': 'bg-cyan-500/90',
    'Kiến thức an toàn': 'bg-green-500/90',
    'Báo cáo bảo mật': 'bg-purple-500/90',
    'Cảnh báo mới': 'bg-orange-500/90',
    'Hướng dẫn': 'bg-blue-500/90',
  };

  const getCategoryColor = (cat) => categoryColors[cat] || 'bg-slate-500/90';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 pt-24 flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tin tức &amp; Sự kiện
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Cập nhật thông tin mới nhất về an ninh mạng, cảnh báo lừa đảo và các tính năng mới của AICEE.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm tin tức..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-medium transition-colors"
            >
              Tìm
            </button>
            {(searchQuery || selectedCategory) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchInput('');
                  setSelectedCategory(null);
                }}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Reset</span>
              </button>
            )}
          </form>

          {/* Category filters */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  !selectedCategory
                    ? 'bg-cyan-500 border-cyan-500 text-white'
                    : 'bg-transparent border-slate-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-400'
                }`}
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 border-cyan-500 text-white'
                      : 'bg-transparent border-slate-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* News Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-4">
              <Loader className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
              <p className="text-gray-400">Đang tải tin tức...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-red-400 text-lg">{error}</p>
            <button
              onClick={fetchNews}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : newsItems.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Không tìm thấy tin tức phù hợp.</p>
            <button
              onClick={() => { setSearchQuery(''); setSearchInput(''); setSelectedCategory(null); }}
              className="mt-4 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Xem tất cả tin tức →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
            {newsItems.map((news) => (
              <article
                key={news.id}
                className="bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-cyan-500/50 transition-all group flex flex-col cursor-pointer"
                onClick={() => setSelectedNews(news)}
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className={`absolute top-4 left-4 ${getCategoryColor(news.category)} text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm`}>
                    {news.category}
                  </div>
                  {news.views && (
                    <div className="absolute bottom-3 right-3 bg-black/50 text-gray-300 text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                      👁 {news.views.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center text-gray-500 text-xs mb-3 space-x-3">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{news.date}</span>
                    </span>
                    {news.author && (
                      <span className="flex items-center space-x-1">
                        <span>•</span>
                        <span>{news.author}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {news.title}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4 flex-grow line-clamp-3">
                    {news.excerpt}
                  </p>

                  {/* Tags */}
                  {news.tags && news.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {news.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="flex items-center space-x-1 text-xs bg-slate-800 text-gray-400 px-2 py-0.5 rounded-full border border-slate-700">
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <button className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors font-medium text-sm mt-auto">
                    Đọc tiếp <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Article Modal */}
        {selectedNews && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedNews(null)}
          >
            <div
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedNews.image}
                alt={selectedNews.title}
                className="w-full h-56 object-cover rounded-t-2xl"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="p-6">
                <div className={`inline-block ${getCategoryColor(selectedNews.category)} text-white text-xs font-bold px-3 py-1 rounded-full mb-4`}>
                  {selectedNews.category}
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">{selectedNews.title}</h2>
                <div className="flex items-center text-gray-500 text-xs mb-4 space-x-3">
                  <span>{selectedNews.date}</span>
                  {selectedNews.author && <><span>•</span><span>{selectedNews.author}</span></>}
                </div>
                <p className="text-gray-300 leading-relaxed">{selectedNews.excerpt}</p>
                <p className="text-gray-400 mt-4 leading-relaxed">{selectedNews.content}</p>
                <button
                  onClick={() => setSelectedNews(null)}
                  className="mt-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscribe Section */}
        <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-8 text-center md:text-left">
            <h3 className="text-3xl font-bold text-white mb-2">Đăng ký nhận bản tin</h3>
            <p className="text-gray-300 text-lg">Không bỏ lỡ bất kỳ cảnh báo bảo mật quan trọng nào.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto flex-col gap-3">
            <div className="flex">
              <input
                type="email"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                placeholder="Nhập email của bạn..."
                className="px-5 py-4 rounded-l-xl bg-slate-800/80 border border-slate-600 text-white focus:outline-none focus:border-cyan-500 w-full md:w-72"
              />
              <button
                type="submit"
                disabled={subscribeLoading}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-700 text-white px-6 py-4 rounded-r-xl font-bold transition-colors flex items-center"
              >
                {subscribeLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Đăng ký'}
              </button>
            </div>
            {subscribeMsg && (
              <p className={`text-sm text-center ${subscribeMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {subscribeMsg.text}
              </p>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;
