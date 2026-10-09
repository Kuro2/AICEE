import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, Calendar, User, Tag, Loader, AlertTriangle, Share2, Sparkles, ShieldAlert, Check } from 'lucide-react';
import { newsAPI } from '@/services/api';

const NewsDetail = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        const res = await newsAPI.getById(id);
        if (res.success) {
          setNews(res.data.news);
        } else {
          setError(res.message);
        }
      } catch (err) {
        setError('Không thể tải bài viết. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchNewsDetail();
    }
  }, [id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Cảnh báo lừa đảo': return 'bg-red-500/80 text-red-100 border-red-500/40';
      case 'Cập nhật sản phẩm': return 'bg-cyan-500/80 text-cyan-100 border-cyan-500/40';
      case 'Kiến thức an toàn': return 'bg-emerald-500/80 text-emerald-100 border-emerald-500/40';
      default: return 'bg-blue-500/80 text-blue-100 border-blue-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/4 w-[600px] h-[500px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* Back button & Share */}
          <div className="flex items-center justify-between mb-8">
            <Link 
              to="/news" 
              className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-cyan-400 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Quay lại danh sách Tin tức
            </Link>

            <button
              onClick={handleShare}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? 'Đã sao chép link' : 'Chia sẻ bài viết'}</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
              <p className="text-gray-400 text-sm">Đang tải toàn bộ bài viết...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Đã xảy ra sự cố</h2>
              <p className="text-red-300 text-sm mb-6">{error}</p>
              <Link 
                to="/news" 
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Trở về trang Tin tức
              </Link>
            </div>
          ) : news ? (
            <article className="rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden">
              {/* Cover Image with gradient overlay */}
              <div className="w-full h-72 sm:h-96 relative overflow-hidden">
                <img 
                  src={news.image} 
                  alt={news.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute bottom-6 left-6 sm:left-10">
                  <span className={`inline-block ${getCategoryColor(news.category)} text-xs font-bold px-4 py-1.5 rounded-full border backdrop-blur-md`}>
                    {news.category}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-12">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
                  {news.title}
                </h1>
                
                {/* Meta details */}
                <div className="flex flex-wrap items-center text-gray-400 text-xs sm:text-sm mb-8 gap-4 border-b border-white/10 pb-6">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>{news.date}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <User className="w-4 h-4 text-purple-400" />
                    <span>{news.author || 'Chuyên gia an ninh AICEE'}</span>
                  </div>
                </div>

                {/* Excerpt Lead */}
                <div className="text-base sm:text-lg text-gray-200 font-medium leading-relaxed mb-8 italic border-l-4 border-cyan-400 pl-6 bg-cyan-500/[0.03] py-4 rounded-r-2xl">
                  {news.excerpt}
                </div>

                {/* Main Content Body */}
                <div className="space-y-6 text-gray-300 leading-relaxed text-sm sm:text-base">
                  {news.content.split('\n').map((paragraph, index) => (
                    paragraph.trim() ? <p key={index}>{paragraph}</p> : null
                  ))}
                </div>

                {/* Tags */}
                {news.tags && news.tags.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-white/10">
                    <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-cyan-400" />
                      Từ khóa liên quan
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {news.tags.map((tag) => (
                        <span key={tag} className="bg-white/5 text-gray-300 px-3.5 py-1.5 rounded-xl text-xs font-medium border border-white/10">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Callout Support Box */}
                <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-slate-900/60 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      Nghi ngờ bạn đang là nạn nhân?
                    </h4>
                    <p className="text-gray-300 text-xs sm:text-sm">
                      Gửi ngay bằng chứng hoặc tin nhắn nghi ngờ tới Trợ lý AI để được hướng dẫn xử lý khẩn cấp.
                    </p>
                  </div>
                  <Link
                    to="/chatbox"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0"
                  >
                    Kiểm tra với AI
                  </Link>
                </div>

              </div>
            </article>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewsDetail;
