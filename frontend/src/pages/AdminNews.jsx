import React, { useState, useEffect } from 'react';
import { adminAPI, newsAPI } from '@/services/api';
import { Trash2, Edit, Plus, Loader, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
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
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: '', category: 'Cập nhật sản phẩm', image: '', excerpt: '', content: '', tags: '' });
    setEditingId(null);
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
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col group">
            <div className="h-48 relative overflow-hidden">
              <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {item.category}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{item.title}</h3>
              <p className="text-gray-400 text-sm line-clamp-2 flex-1">{item.excerpt}</p>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                <div className="text-gray-500 text-xs">{item.date}</div>
                <div className="flex gap-2">
                  <Link to={`/news/${item.id}`} target="_blank" className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-400 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button onClick={() => openEdit(item)} className="p-2 bg-slate-800 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-slate-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">{editingId ? 'Sửa bài viết' : 'Viết bài mới'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm text-gray-400 block mb-1">Tiêu đề bài viết</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} type="text" className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Danh mục</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option>Cảnh báo lừa đảo</option>
                    <option>Cập nhật sản phẩm</option>
                    <option>Kiến thức an toàn</option>
                    <option>Báo cáo bảo mật</option>
                    <option>Cảnh báo mới</option>
                    <option>Hướng dẫn</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Link Ảnh Bìa</label>
                  <input required value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} type="text" className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white" placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-400 block mb-1">Đoạn tóm tắt (Excerpt)</label>
                  <textarea required value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white h-20" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-400 block mb-1">Nội dung chi tiết</label>
                  <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white h-40" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-400 block mb-1">Thẻ Tags (cách nhau bằng dấu phẩy)</label>
                  <input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} type="text" className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white" placeholder="AI, Bảo mật, Lừa đảo..." />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-3 bg-slate-800 text-white rounded-xl">Hủy</button>
                <button type="submit" className="flex-1 p-3 bg-cyan-500 text-white rounded-xl font-bold">Lưu Bài Viết</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNews;
