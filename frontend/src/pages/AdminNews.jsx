import React, { useState, useEffect, useRef } from 'react';
import { adminAPI, newsAPI, uploadAPI } from '@/services/api';
import { 
  Trash2, Edit, Plus, Loader, Eye, X, FileText, 
  Upload, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Image upload states
  const [imageInputMode, setImageInputMode] = useState('file'); // 'file' | 'url'
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Cập nhật sản phẩm',
    image: '',
    excerpt: '',
    content: '',
    tags: ''
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await newsAPI.getAll(1, 100);
      if (res.success) {
        setNews(res.data.news);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP, GIF)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setImageError('Kích thước ảnh tối đa là 15MB');
      return;
    }

    setImageError('');
    setUploadingImage(true);

    try {
      // 1. Thử upload trực tiếp lên backend
      const res = await uploadAPI.uploadImage(file);
      if (res.success && res.data?.url) {
        setFormData(prev => ({ ...prev, image: res.data.url }));
        setUploadingImage(false);
        return;
      }
    } catch (err) {
      console.warn('Backend upload không khả dụng, chuyển sang xử lý tối ưu trên máy:', err);
    }

    // 2. Dự phòng: Tối ưu ảnh qua HTML5 Canvas và chuyển thành DataURL bền vững
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const optimizedUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, image: optimizedUrl }));
        setUploadingImage(false);
      };
      img.onerror = () => {
        setImageError('Không thể nạp file hình ảnh này');
        setUploadingImage(false);
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setImageError('Lỗi đọc file từ máy tính');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.image || !formData.image.trim()) {
      setImageError('Vui lòng chọn ảnh bìa từ máy hoặc nhập link ảnh!');
      return;
    }

    const dataToSend = {
      ...formData,
      tags: typeof formData.tags === 'string' 
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : formData.tags
    };

    try {
      if (editingId) {
        const res = await adminAPI.updateNews(editingId, dataToSend);
        if (res.success) {
          setNews(news.map(n => n.id === editingId ? res.data : n));
        }
      } else {
        const res = await adminAPI.createNews(dataToSend);
        if (res.success) {
          setNews([res.data, ...news]);
        }
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      alert('Lỗi lưu bài viết');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Chắc chắn xóa bài viết này?')) return;
    try {
      const res = await adminAPI.deleteNews(id);
      if (res.success) {
        setNews(news.filter(n => n.id !== id));
      }
    } catch (error) {
      alert('Lỗi xóa bài viết');
    }
  };

  const openEdit = (item) => {
    setFormData({
      title: item.title,
      category: item.category,
      image: item.image,
      excerpt: item.excerpt,
      content: item.content,
      tags: item.tags ? item.tags.join(', ') : ''
    });
    setEditingId(item.id);
    setImageError('');
    setImageInputMode(item.image?.startsWith('data:') ? 'file' : (item.image?.startsWith('http') ? 'url' : 'file'));
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: '', category: 'Cập nhật sản phẩm', image: '', excerpt: '', content: '', tags: '' });
    setEditingId(null);
    setImageError('');
    setImageInputMode('file');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) return <div className="text-white text-center py-20"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Quản lý Tin tức</h1>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Viết bài mới
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map(item => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col group">
            <div className="h-48 relative overflow-hidden">
              <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute top-2 left-2 bg-white/5 backdrop-blur-md text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {item.category}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{item.title}</h3>
              <p className="text-gray-400 text-sm line-clamp-2 flex-1">{item.excerpt}</p>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <div className="text-gray-500 text-xs">{item.date}</div>
                <div className="flex gap-2">
                  <Link to={`/news/${item.id}`} target="_blank" className="p-2 bg-white/10 hover:bg-white/10 text-gray-400 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button onClick={() => openEdit(item)} className="p-2 bg-white/10 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-cyan-500/40 rounded-3xl w-full max-w-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-[0_25px_80px_rgba(0,0,0,0.95)] relative z-50">
            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? 'Sửa bài viết' : 'Viết bài mới'}
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">Tiêu đề bài viết</label>
                  <input 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    type="text" 
                    placeholder="Nhập tiêu đề tin tức..."
                    className="w-full p-3.5 bg-[#1e293b] border border-slate-700/80 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">Danh mục</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3.5 bg-[#1e293b] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm"
                  >
                    <option className="bg-slate-900 text-white">Cảnh báo lừa đảo</option>
                    <option className="bg-slate-900 text-white">Cập nhật sản phẩm</option>
                    <option className="bg-slate-900 text-white">Kiến thức an toàn</option>
                    <option className="bg-slate-900 text-white">Báo cáo bảo mật</option>
                    <option className="bg-slate-900 text-white">Cảnh báo mới</option>
                    <option className="bg-slate-900 text-white">Hướng dẫn</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">Thẻ Tags (cách nhau dấu phẩy)</label>
                  <input 
                    value={formData.tags} 
                    onChange={e => setFormData({...formData, tags: e.target.value})} 
                    type="text" 
                    className="w-full p-3.5 bg-[#1e293b] border border-slate-700/80 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm" 
                    placeholder="AI, Bảo mật, Cảnh báo..." 
                  />
                </div>

                {/* ── KHU VỰC ẢNH BÌA: TẢI TỪ MÁY HOẶC NHẬP URL ── */}
                <div className="col-span-2 bg-[#0b1329]/80 border border-slate-800 p-4 rounded-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
                      Ảnh Bìa Bài Viết (Cover Image)
                      <span className="text-red-400">*</span>
                    </label>

                    <div className="flex bg-[#1e293b] p-1 rounded-xl border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('file')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          imageInputMode === 'file'
                            ? 'bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Tải ảnh từ máy
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          imageInputMode === 'url'
                            ? 'bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        🔗 Dán link URL
                      </button>
                    </div>
                  </div>

                  {imageError && (
                    <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{imageError}</span>
                    </div>
                  )}

                  {imageInputMode === 'file' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      {!formData.image ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 bg-[#1e293b]/60 hover:bg-[#1e293b] rounded-xl p-6 text-center cursor-pointer transition-all group"
                        >
                          {uploadingImage ? (
                            <div className="flex flex-col items-center justify-center py-2">
                              <Loader className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                              <p className="text-sm text-cyan-300 font-semibold">Đang xử lý và tải ảnh bìa...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                                <Upload className="w-6 h-6" />
                              </div>
                              <p className="text-sm text-white font-semibold mb-1">
                                Nhấp vào đây để chọn ảnh từ máy tính của bạn
                              </p>
                              <p className="text-xs text-gray-400">
                                Hỗ trợ PNG, JPG, JPEG, WEBP, GIF (Tối đa 15MB)
                              </p>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div>
                      <input 
                        value={formData.image} 
                        onChange={e => {
                          setFormData({...formData, image: e.target.value});
                          setImageError('');
                        }} 
                        type="text" 
                        className="w-full p-3.5 bg-[#1e293b] border border-slate-700/80 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm mb-1" 
                        placeholder="https://images.unsplash.com/photo-..." 
                      />
                      <p className="text-xs text-gray-400 mt-1">Dán liên kết ảnh trực tiếp từ internet (Unsplash, Imgur, Cloudinary...)</p>
                    </div>
                  )}

                  {/* Xem trước ảnh bìa (Cover Image Preview) */}
                  {formData.image && (
                    <div className="mt-3 p-3 bg-[#1e293b] border border-cyan-500/30 rounded-xl flex items-center gap-4">
                      <div className="w-28 h-18 sm:w-32 sm:h-20 rounded-lg overflow-hidden border border-slate-700 bg-black/40 shrink-0 relative">
                        <img 
                          src={formData.image} 
                          alt="Cover preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Ảnh bìa đã chọn thành công</span>
                        </div>
                        <p className="text-xs text-gray-300 truncate">
                          {formData.image.startsWith('data:') 
                            ? 'Ảnh tải trực tiếp từ máy tính (Đã nén tối ưu hiển thị)' 
                            : formData.image}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setImageInputMode('file');
                            setTimeout(() => fileInputRef.current?.click(), 50);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-700 hover:border-cyan-500/40"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Đổi ảnh
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({...formData, image: ''});
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                          title="Xóa ảnh bìa"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">Đoạn tóm tắt (Excerpt)</label>
                  <textarea 
                    required 
                    rows={3}
                    value={formData.excerpt} 
                    onChange={e => setFormData({...formData, excerpt: e.target.value})} 
                    placeholder="Tóm tắt ngắn gọn nội dung bài viết..."
                    className="w-full p-3.5 bg-[#1e293b] border border-slate-700/80 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm" 
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">Nội dung chi tiết</label>
                  <textarea 
                    required 
                    rows={7}
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})} 
                    placeholder="Nội dung bài viết đầy đủ..."
                    className="w-full p-3.5 bg-[#1e293b] border border-slate-700/80 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm" 
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 p-3.5 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl font-semibold transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 p-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/25 transition-all"
                >
                  Lưu Bài Viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNews;
