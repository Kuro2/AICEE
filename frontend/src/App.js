import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import ChatboxAI from '@/pages/ChatboxAI';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chatbox" element={<ChatboxAI />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;