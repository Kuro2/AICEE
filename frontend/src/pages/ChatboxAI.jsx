import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Send, User, Bot, Home, Menu, X, Sparkles,
  AlertCircle, CheckCircle, Info, Paperclip, File, Trash2,
} from 'lucide-react';
import { chatAPI, uploadAPI } from '@/services/api';

// Tạo session ID duy nhất cho mỗi tab
const SESSION_ID = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const ChatboxAI = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: 'Xin chào! Tôi là trợ lý AI của **AICEE** 🛡️\n\nTôi có thể giúp bạn:\n🔗 Kiểm tra độ an toàn website\n📧 Phân tích email lừa đảo\n📱 Xác minh số điện thoại\n🛡️ Tư vấn an ninh mạng\n📁 Phân tích file\n\nHãy gửi nội dung cần kiểm tra cho tôi!',
      status: 'info',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const fileData = files.map((file) => ({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setSelectedFiles((prev) => [...prev, ...fileData]);
    // Reset input để có thể chọn lại cùng file
    e.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => {
      const next = [...prev];
      if (next[index].preview) URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && selectedFiles.length === 0) return;
    setError(null);

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputText,
      files: selectedFiles.length > 0 ? [...selectedFiles] : null,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setSelectedFiles([]);
    setIsTyping(true);

    try {
      let aiResponse;

      if (userMessage.files && userMessage.files.length > 0) {
        // Upload files và phân tích
        const fileList = userMessage.files.map((f) => f.file);
        const result = await uploadAPI.analyze(fileList);

        if (result.success) {
          const combined = result.data.analyses
            .map((a) => `**${a.fileName}**:\n${a.text}`)
            .join('\n\n---\n\n');
          aiResponse = {
            text: combined,
            status: result.data.overallStatus,
            recommendations: [],
          };
        } else {
          throw new Error(result.message);
        }
      } else {
        // Gửi text tới AI
        const result = await chatAPI.send(currentInput, SESSION_ID);
        if (result.success) {
          aiResponse = result.data;
        } else {
          throw new Error(result.message);
        }
      }

      const aiMessage = {
        id: messages.length + 2,
        type: 'ai',
        text: aiResponse.message || aiResponse.text || '',
        status: aiResponse.status || 'info',
        recommendations: aiResponse.recommendations || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      if (err.data && err.data.isLimitReached) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 2,
            type: 'ai',
            text: `⚠️ **Giới hạn gói cước:**\n${err.message}`,
            action: { label: 'Nâng cấp Gói cước', to: '/pricing' },
            status: 'warning',
            timestamp: new Date(),
          },
        ]);
      } else if (err.message && err.message.includes('401') || (err.data && err.data.message === 'Vui lòng đăng nhập để sử dụng tính năng Quét.')) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 2,
            type: 'ai',
            text: '🔒 **Yêu cầu đăng nhập:**\nBạn cần đăng nhập tài khoản (miễn phí) để trò chuyện với tôi và sử dụng tính năng quét rủi ro.',
            action: { label: 'Đi tới Đăng nhập', to: '/login' },
            status: 'warning',
            timestamp: new Date(),
          },
        ]);
      } else {
        setError('Không thể kết nối tới server. Vui lòng thử lại.');
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 2,
            type: 'ai',
            text: '❌ Xin lỗi, tôi gặp sự cố kết nối. Vui lòng thử lại sau.',
            status: 'info',
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    chatAPI.clearHistory(SESSION_ID).catch(() => {});
    setMessages([
      {
        id: 1,
        type: 'ai',
        text: 'Cuộc trò chuyện đã được làm mới. Tôi có thể giúp gì cho bạn? 🛡️',
        status: 'info',
        timestamp: new Date(),
      },
    ]);
  };

  const quickActions = [
    { icon: '🔗', text: 'Kiểm tra website', prompt: 'Kiểm tra website này: ' },
    { icon: '📧', text: 'Phân tích email', prompt: 'Phân tích email lừa đảo: ' },
    { icon: '📱', text: 'Xác minh số điện thoại', prompt: 'Xác minh số điện thoại: ' },
    { icon: '🛡️', text: 'Mẹo bảo vệ an toàn', prompt: 'Cho tôi các mẹo bảo vệ an toàn trực tuyến' },
    { icon: '📋', text: 'Tôi bị lừa đảo?', prompt: 'Tôi vừa nhận được tin nhắn đáng ngờ, phải làm gì?' },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'danger': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return 'border-green-500/30 bg-green-500/5';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'danger': return 'border-red-500/30 bg-red-500/5';
      default: return 'border-slate-700 bg-slate-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = { safe: 'An toàn', warning: 'Cảnh báo', danger: 'Nguy hiểm', info: 'Thông tin' };
    return labels[status] || 'Thông tin';
  };

  // Render markdown-like formatting (bold, newlines)
  const renderText = (text) => {
    return text
      .split('\n')
      .map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={i}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
            {i < text.split('\n').length - 1 && <br />}
          </span>
        );
      });
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-blue-700/30 backdrop-blur-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-white p-1 rounded"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex items-center space-x-3">
                <img src="/logo-aicee.png" alt="AICEE" className="w-16 h-16 object-contain" />
                <div>
                  <h1 className="text-lg font-bold text-white">AICEE AI Assistant</h1>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-xs text-gray-400">Trợ lý AI đang hoạt động</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={clearChat}
                className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-lg transition-all text-sm"
                title="Xóa lịch sử chat"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Xóa chat</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
                data-testid="chatbox-home-btn"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-red-900/30 border-b border-red-700/50 px-4 py-2 text-red-300 text-sm text-center flex items-center justify-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-300">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        {/* Sidebar */}
        <aside
          className={`${
            isMobileMenuOpen ? 'block' : 'hidden'
          } md:block w-full md:w-60 bg-slate-900/50 border-r border-slate-800 p-4 overflow-y-auto flex-shrink-0`}
        >
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2 text-sm">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Gợi ý nhanh</span>
          </h3>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputText(action.prompt);
                  setIsMobileMenuOpen(false);
                  textareaRef.current?.focus();
                }}
                className="w-full text-left px-3 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 rounded-lg text-gray-300 transition-all flex items-center space-x-2 group text-sm"
              >
                <span className="text-lg flex-shrink-0">{action.icon}</span>
                <span className="group-hover:text-cyan-400 transition-colors leading-tight">{action.text}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 p-3 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-400 text-xs font-semibold">Mẹo</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Gửi link, email hoặc số điện thoại để AI kiểm tra ngay lập tức.
            </p>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-3 max-w-3xl ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-full ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white'
                        : `border ${getStatusColor(message.status)} text-gray-200`
                    }`}
                  >
                    {/* Status badge — chỉ cho AI message có status */}
                    {message.type === 'ai' && message.status && message.status !== 'info' && (
                      <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-700/50">
                        {getStatusIcon(message.status)}
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {getStatusLabel(message.status)}
                        </span>
                      </div>
                    )}

                    {/* File attachments */}
                    {message.files && message.files.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {message.files.map((fileData, idx) =>
                          fileData.preview ? (
                            <img
                              key={idx}
                              src={fileData.preview}
                              alt={fileData.name}
                              className="max-w-xs rounded-lg border border-white/20"
                            />
                          ) : (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg text-sm"
                            >
                              <File className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{fileData.name}</span>
                              <span className="opacity-70 flex-shrink-0">
                                ({(fileData.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Text */}
                    {message.text && (
                      <p className="whitespace-pre-line text-sm leading-relaxed">
                        {renderText(message.text)}
                      </p>
                    )}

                    {/* Recommendations */}
                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-700/50">
                        <p className="text-xs text-gray-400 font-semibold mb-1.5">💡 Khuyến nghị:</p>
                        <ul className="space-y-1">
                          {message.recommendations.map((r, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-start space-x-1">
                              <span className="text-cyan-400 flex-shrink-0">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Button */}
                    {message.action && (
                      <div className="mt-4">
                        <Link 
                          to={message.action.to} 
                          className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-400 hover:to-blue-400 font-medium transition shadow"
                        >
                          {message.action.label}
                        </Link>
                      </div>
                    )}

                    <span className="text-xs opacity-50 mt-2 block">
                      {message.timestamp.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 bg-slate-800 rounded-2xl border border-slate-700">
                    <div className="flex space-x-1.5 items-center h-4">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Area ── */}
          <div className="border-t border-slate-800 bg-slate-900/70 p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              {/* File Preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedFiles.map((fileData, idx) => (
                    <div key={idx} className="relative group">
                      {fileData.preview ? (
                        <div className="relative">
                          <img
                            src={fileData.preview}
                            alt={fileData.name}
                            className="w-16 h-16 object-cover rounded-lg border-2 border-slate-700"
                          />
                          <button
                            onClick={() => removeFile(idx)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-lg">
                          <File className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="text-xs text-gray-300 max-w-[120px] truncate">{fileData.name}</span>
                          <button
                            onClick={() => removeFile(idx)}
                            className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center flex-shrink-0"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end space-x-2">
                {/* File upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/40 text-gray-400 hover:text-cyan-400 rounded-xl transition-all flex-shrink-0"
                  title="Đính kèm file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* Textarea */}
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn, URL, email hoặc số điện thoại cần kiểm tra..."
                    rows={1}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none text-sm"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                    data-testid="chatbox-input"
                  />
                </div>

                {/* Send */}
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputText.trim() && selectedFiles.length === 0) || isTyping}
                  className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 flex-shrink-0"
                  data-testid="chatbox-send-btn"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">Gửi</span>
                </button>
              </div>

              <p className="text-xs text-gray-600 mt-2 text-center">
                Enter để gửi · Shift+Enter xuống dòng · Hỗ trợ: Ảnh, PDF, DOC, TXT (tối đa 10MB)
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatboxAI;