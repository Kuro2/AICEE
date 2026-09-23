import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuizEmail = () => {
  return (
    <div className="min-h-screen bg-[#f3f7f8] flex flex-col">
      <Header />
      <main className="flex-grow pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Trở về Trang chủ
          </Link>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Trắc nghiệm Email Lừa đảo</h1>
            <p className="text-gray-600 mb-8">Kiểm tra khả năng nhận diện các dấu hiệu lừa đảo trong Email.</p>
            
            <div className="py-12 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
              <p className="text-gray-500 italic">Tính năng đang được phát triển. Vui lòng quay lại sau!</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuizEmail;
