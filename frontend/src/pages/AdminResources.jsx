import React, { useState, useEffect } from 'react';
import { adminAPI, resourceAPI } from '@/services/api';
import { Trash2, Edit, Plus, Loader, X } from 'lucide-react';

const AdminResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    isSafe: true,
    type: 'Website',
    name: '',
    address: '',
    description: ''
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await resourceAPI.getResources();
      if (res.success) {
        setResources(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await adminAPI.updateResource(editingId, formData);
        if (res.success) {
          setResources(resources.map(r => r.id === editingId ? res.data : r));
        }
      } else {
        const res = await adminAPI.createResource(formData);
        if (res.success) {
          setResources([res.data, ...resources]);
        }
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      alert('Lỗi lưu dữ liệu');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Chắc chắn xóa?')) return;
    try {
      const res = await adminAPI.deleteResource(id);
      if (res.success) {
        setResources(resources.filter(r => r.id !== id));
      }
    } catch (error) {
      alert('Lỗi xóa dữ liệu');
    }
  };

  const openEdit = (resource) => {
    setFormData({
      isSafe: resource.isSafe,
      type: resource.type,
      name: resource.name,
      address: resource.address,
      description: resource.description
    });
    setEditingId(resource.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ isSafe: true, type: 'Website', name: '', address: '', description: '' });
    setEditingId(null);
  };

  if (loading) return <div className="text-white text-center py-20"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Quản lý Cảnh báo</h1>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Thêm mới
        </button>
      </div>
      
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 backdrop-blur-md text-gray-400 text-sm border-b border-white/10">
                <th className="p-4 font-medium">Phân loại</th>
                <th className="p-4 font-medium">Tên/Địa chỉ</th>
                <th className="p-4 font-medium">Loại</th>
                <th className="p-4 font-medium">Mô tả</th>
                <th className="p-4 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {resources.map(item => (
                <tr key={item.id} className="hover:bg-white/10/20 transition-colors">
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.isSafe ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {item.isSafe ? 'An toàn' : 'Lừa đảo'}
                    </span>
                  </td>
                  <td className="p-4 text-white">
                    <p className="font-medium">{item.name || item.address}</p>
                    {item.name && <p className="text-xs text-gray-500">{item.address}</p>}
                  </td>
                  <td className="p-4 text-gray-400">{item.type}</td>
                  <td className="p-4 text-gray-400 text-sm">{item.description}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="p-2 bg-white/10 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-cyan-500/40 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.95)] relative z-50">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Sửa thông tin' : 'Thêm dữ liệu mới'}
              </h2>
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
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Loại danh sách</label>
                <select 
                  value={formData.isSafe} 
                  onChange={(e) => setFormData({...formData, isSafe: e.target.value === 'true'})}
                  className="w-full p-3.5 bg-[#1e293b] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm"
                >
                  <option value="true">Danh sách An toàn</option>
                  <option value="false">Danh sách Cảnh báo (Lừa đảo)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Nền tảng</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full p-3.5 bg-[#1e293b] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm"
                >
                  <option>Website</option>
                  <option>Tổ chức</option>
                  <option>SĐT</option>
                  <option>Email</option>
                  <option>App</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Tên tổ chức (Tùy chọn)</label>
                <input 
                  required={formData.isSafe} 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  type="text" 
                  placeholder="VD: Cổng Dịch vụ công Quốc gia..."
                  className="w-full p-3.5 bg-[#1e293b] border border-slate-700/80 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Địa chỉ / Link / SĐT</label>
                <input 
                  required 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  type="text" 
                  placeholder="VD: dichvucong.gov.vn hoặc 090..."
                  className="w-full p-3.5 bg-[#1e293b] border border-slate-700/80 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Mô tả</label>
                <textarea 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Mô tả chi tiết hoặc cảnh báo lừa đảo..."
                  className="w-full p-3.5 bg-[#1e293b] border border-slate-700/80 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm h-24" 
                />
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
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResources;
