import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/services/api';
import { Shield, ShieldAlert, Trash2, Loader, Mail } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers(1, 100);
      if (res.success) {
        setUsers(res.data.users);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Bạn có chắc muốn cấp quyền ${newRole} cho người dùng này?`)) return;
    
    try {
      const res = await adminAPI.changeUserRole(id, newRole);
      if (res.success) {
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cảnh báo: Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa tài khoản này?')) return;
    try {
      const res = await adminAPI.deleteUser(id);
      if (res.success) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  if (loading) return <div className="text-white text-center py-20"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Quản lý Người dùng</h1>
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-gray-400 text-sm border-b border-slate-700">
                <th className="p-4 font-medium">Người dùng</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Quyền</th>
                <th className="p-4 font-medium">Đăng nhập từ</th>
                <th className="p-4 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`} 
                      alt="" 
                      className="w-10 h-10 rounded-full bg-slate-800" 
                    />
                    <span className="text-white font-medium">{user.name}</span>
                  </td>
                  <td className="p-4 text-gray-400">{user.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-gray-400 border border-slate-700'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {user.googleId ? 'Google' : user.facebookId ? 'Facebook' : 'Mặc định (Email)'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleRoleChange(user.id, user.role)}
                        className="p-2 bg-slate-800 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 rounded-lg transition-colors"
                        title={user.role === 'admin' ? "Hạ xuống User" : "Nâng lên Admin"}
                      >
                        {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 bg-slate-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                        title="Xóa tài khoản"
                      >
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
    </div>
  );
};

export default AdminUsers;
