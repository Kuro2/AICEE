import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import QuizFake from '@/pages/QuizFake';
import QuizEmail from '@/pages/QuizEmail';

// Admin Pages
import AdminLayout from '@/components/AdminLayout';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUsers from '@/pages/AdminUsers';
import AdminResources from '@/pages/AdminResources';
import AdminNews from '@/pages/AdminNews';

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
            <Route path="/chatbox" element={<ChatboxAI />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/unsafe" element={<UnsafeList />} />
            <Route path="/resources/safe" element={<SafeList />} />
            <Route path="/resources/info" element={<UsefulInfo />} />
            <Route path="/resources/how-it-works" element={<HowItWorks />} />
            <Route path="/resources/terms" element={<TermsOfUse />} />
            <Route path="/resources/privacy" element={<PrivacyPolicy />} />
            <Route path="/quiz/fake" element={<QuizFake />} />
            <Route path="/quiz/email" element={<QuizEmail />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="resources" element={<AdminResources />} />
              <Route path="news" element={<AdminNews />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;