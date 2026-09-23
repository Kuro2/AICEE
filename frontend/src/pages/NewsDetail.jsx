import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, Calendar, User, Tag, Loader, AlertTriangle } from 'lucide-react';
import { newsAPI } from '@/services/api';

const NewsDetail = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Cảnh báo lừa đảo': return 'bg-red-500';
      case 'Cập nhật sản phẩm': return 'bg-cyan-500';
      case 'Kiến thức an toàn': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      <main className="flex-grow pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          
          <Link to="/news" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại trang Tin tức
          </Link>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
              <p className="text-gray-400">Đang tải bài viết...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Đã xảy ra lỗi</h2>
              <p className="text-red-400">{error}</p>
              <Link to="/news" className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                Trở về trang Tin tức
              </Link>
            </div>
          ) : news ? (
            <article className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              {/* Cover Image */}
              <div className="w-full h-[400px] relative">
                <img 
                  src={news.image} 
                  alt={news.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                
                {/* Category Badge on Image */}
                <div className="absolute bottom-6 left-6 md:left-12">
                  <span className={`inline-block ${getCategoryColor(news.category)} text-white text-xs font-bold px-4 py-1.5 rounded-full`}>
                    {news.category}
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-12 md:pt-8">
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
                  {news.title}
                </h1>
                
                {/* Meta data */}
                <div className="flex flex-wrap items-center text-gray-400 text-sm mb-8 gap-4 border-b border-slate-800 pb-8">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {news.date}
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    {news.author || 'AICEE Team'}
                  </div>
                </div>

                {/* Excerpt */}
                <div className="text-xl text-gray-300 font-medium leading-relaxed mb-8 italic border-l-4 border-cyan-500 pl-6">
                  {news.excerpt}
                </div>

                {/* Main Content */}
                <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-loose">
                  {/* Since the content might be plain text from the database, we split by newlines and render paragraphs */}
                  {news.content.split('\n').map((paragraph, index) => (
                    paragraph.trim() ? <p key={index} className="mb-6">{paragraph}</p> : null
                  ))}
                </div>

                {/* Tags */}
                {news.tags && news.tags.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-slate-800">
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <Tag className="w-5 h-5 mr-2 text-cyan-500" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {news.tags.map((tag) => (
                        <span key={tag} className="bg-slate-800 text-gray-300 px-4 py-2 rounded-xl text-sm border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-default">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
