import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, ShieldCheck, Loader, Search, ExternalLink, Check, Copy, Building, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resourceAPI } from '@/services/api';

const SafeList = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const res = await resourceAPI.getResources(true);
        if (res.success) {
          setResources(res.data);
        } else {
          setError(res.message);
        }
      } catch (err) {
        setError('Lỗi khi tải dữ liệu từ máy chủ.');
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredResources = resources.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/3 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-5xl">
          {/* Back Button */}
          <Link 
            to="/resources" 
            className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-emerald-400 mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Quay lại Trung tâm Tài nguyên
          </Link>

          {/* Banner Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-emerald-950/40 via-slate-900/40 to-slate-950/60 border border-emerald-500/30 backdrop-blur-2xl shadow-2xl mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="flex items-center space-x-4">
                <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <ShieldCheck className="w-9 h-9" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Whitelist Đã Thẩm Định
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Danh Sách An Toàn
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-semibold text-emerald-400">
                  {resources.length} Tổ chức
                </span>
              </div>
            </div>

            <p className="text-gray-300 text-base leading-relaxed mt-6 max-w-3xl">
              Tập hợp danh bạ các website, tổ chức tài chính, cổng dịch vụ công và doanh nghiệp đã được xác thực an toàn chính thức bởi AICEE Security cùng các cơ quan chức năng.
            </p>

            {/* Search Input */}
            <div className="mt-8 relative max-w-xl">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên tổ chức, tên miền (VD: vcb, gov.vn)..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              />
            </div>
          </div>

          {/* Content List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
              <p className="text-gray-400 text-sm">Đang tải danh bạ an toàn...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResources.map((item) => (
                <div
                  key={item._id}
                  className="group p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-emerald-500/40 backdrop-blur-xl transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {item.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Check className="w-3 h-3" />
                          Chính thức
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {item.description || 'Đơn vị đã được chứng thực số an toàn.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end md:self-center">
                    <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 flex items-center space-x-2 font-mono text-xs text-emerald-300">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate max-w-[200px]">{item.address}</span>
                    </div>

                    <button
                      onClick={() => handleCopy(item.address, item._id)}
                      title="Sao chép tên miền"
                      className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-gray-300 hover:text-emerald-300 transition-colors"
                    >
                      {copiedId === item._id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <a
                      href={item.address?.startsWith('http') ? item.address : `https://${item.address}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Mở liên kết"
                      className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-gray-300 hover:text-emerald-300 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}

              {filteredResources.length === 0 && (
                <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10">
                  <ShieldCheck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Không tìm thấy tổ chức nào phù hợp với từ khóa.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SafeList;
