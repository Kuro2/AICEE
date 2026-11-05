import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import ChatboxAI from '@/pages/ChatboxAI';
import News from '@/pages/News';
import NewsDetail from '@/pages/NewsDetail';
import Resources from '@/pages/Resources';
import UnsafeList from '@/pages/UnsafeList';
import SafeList from '@/pages/SafeList';
import UsefulInfo from '@/pages/UsefulInfo';
import HowItWorks from '@/pages/HowItWorks';
import TermsOfUse from '@/pages/TermsOfUse';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Profile from '@/pages/Profile';
import QuizHub from '@/pages/QuizHub';
import QuizTopicPlayer from '@/pages/QuizTopicPlayer';
import QuizFake from '@/pages/QuizFake';
import QuizEmail from '@/pages/QuizEmail';
import Pricing from '@/pages/Pricing';
import AiHistory from '@/pages/AiHistory';
import ReportScam from '@/pages/ReportScam';
import PaymentSuccess from '@/pages/PaymentSuccess';
import PaymentFailed from '@/pages/PaymentFailed';

// Admin Pages
import AdminLayout from '@/components/AdminLayout';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUsers from '@/pages/AdminUsers';
import AdminResources from '@/pages/AdminResources';
import AdminNews from '@/pages/AdminNews';
import AdminReports from '@/pages/AdminReports';
import AdminChats from '@/pages/AdminChats';
import AdminQuiz from '@/pages/AdminQuiz';
import AdminQuizEditor from '@/pages/AdminQuizEditor';

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-client-id-here'}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* User Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />
            <Route path="/payment/cancel" element={<PaymentFailed />} />
            <Route path="/payment/error" element={<PaymentFailed />} />
            <Route path="/chatbox" element={<ChatboxAI />} />
            <Route path="/ai-history" element={<AiHistory />} />
            <Route path="/report" element={<ReportScam />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/unsafe" element={<UnsafeList />} />
            <Route path="/resources/safe" element={<SafeList />} />
            <Route path="/resources/info" element={<UsefulInfo />} />
            <Route path="/resources/how-it-works" element={<HowItWorks />} />
            <Route path="/resources/terms" element={<TermsOfUse />} />
            <Route path="/resources/privacy" element={<PrivacyPolicy />} />
            {/* Quiz Topic Routes (Chủ đề Quiz & Tên miền riêng) */}
            <Route path="/quiz" element={<QuizHub />} />
            <Route path="/quiz/:slug" element={<QuizTopicPlayer />} />
            <Route path="/quiz-fake" element={<Navigate to="/quiz/luadao" replace />} />
            <Route path="/quiz-email" element={<Navigate to="/quiz/email" replace />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="resources" element={<AdminResources />} />
              <Route path="news" element={<AdminNews />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="chats" element={<AdminChats />} />
              <Route path="quiz" element={<AdminQuiz />} />
              <Route path="quiz/create" element={<AdminQuizEditor />} />
              <Route path="quiz/edit/:id" element={<AdminQuizEditor />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;