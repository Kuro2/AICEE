import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft, ShieldCheck, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resourceAPI } from '@/services/api';

const SafeList = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="min-h-screen bg-[#f3f7f8] flex flex-col">
      <Header />
      <main className="flex-grow pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link to="/resources" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Tài nguyên
          </Link>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center space-x-4 mb-8 pb-4 border-b border-gray-100">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Danh sách an toàn (Whitelist)</h1>
            </div>
            
            <div className="prose max-w-none text-gray-600">
              <p className="text-lg mb-6">
                Danh sách các tổ chức, website và số điện thoại đã được xác thực chính chủ. Bạn hoàn toàn có thể yên tâm khi giao dịch với các địa chỉ trong danh sách này.
              </p>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <p className="font-medium text-green-800 m-0">Đã xác minh: Dữ liệu được kiểm duyệt bởi đội ngũ chuyên gia bảo mật của AICEE và các cơ quan có thẩm quyền.</p>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader className="w-8 h-8 text-green-600 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500 font-medium">{error}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-3 px-4 font-semibold text-gray-700">Tổ chức</th>
                        <th className="py-3 px-4 font-semibold text-gray-700">Website chính thức</th>
                        <th className="py-3 px-4 font-semibold text-gray-700">Lĩnh vực</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((item) => (
                        <tr key={item._id} className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium">{item.name}</td>
                          <td className="py-3 px-4 text-green-600">{item.address}</td>
                          <td className="py-3 px-4">{item.description}</td>
                        </tr>
                      ))}
                      {resources.length === 0 && (
                        <tr>
                          <td colSpan="3" className="py-8 text-center text-gray-500">
                            Chưa có dữ liệu.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SafeList;
