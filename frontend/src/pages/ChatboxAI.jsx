import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Send, User, Bot, Home, Menu, X, Sparkles,
  AlertCircle, CheckCircle, Info, Paperclip, File, Trash2,
  Crown, Plus, MessageSquare, Edit2, Check, Clock, ExternalLink
} from 'lucide-react';
import { chatAPI, uploadAPI, authAPI } from '@/services/api';

const generateNewSessionId = () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaultGreeting = {
  id: 1,
  type: 'ai',
  text: 'Xin chào! Tôi là trợ lý AI của **AICEE** 🛡️\n\nTôi có thể giúp bạn:\n🔗 Kiểm tra độ an toàn website\n📧 Phân tích email lừa đảo\n📱 Xác minh số điện thoại\n🛡️ Tư vấn an ninh mạng\n📁 Phân tích file\n\nHãy gửi nội dung cần kiểm tra cho tôi!',
  status: 'info',
  timestamp: new Date(),
};

const ChatboxAI = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(authAPI.getCurrentUser());
  const [currentSessionId, setCurrentSessionId] = useState(generateNewSessionId);
  const [messages, setMessages] = useState([defaultGreeting]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);

  // Premium Chat History State
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [sidebarTab, setSidebarTab] = useState('history'); // 'history' | 'suggestions'

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const isPremium = currentUser?.isPremium || currentUser?.plan === 'premium';

  // Lấy profile mới nhất
  useEffect(() => {
    if (authAPI.isLoggedIn()) {
      authAPI.getMe().then((res) => {
        if (res.success && res.data?.user) {
          setCurrentUser(res.data.user);
          localStorage.setItem('aicee_user', JSON.stringify(res.data.user));
        }
      }).catch(() => {});
    }
  }, []);

  // Tải danh sách các phiên chat của Premium
  const loadSessions = useCallback(async () => {
    if (!isPremium) return;
    setIsLoadingSessions(true);
    try {
      const res = await chatAPI.getSessions();
      if (res.success && res.data?.sessions) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.error('Không thể tải danh sách phiên chat:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [isPremium]);

  useEffect(() => {
    if (isPremium) {
      loadSessions();
    }
  }, [isPremium, loadSessions]);

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

  // Bắt đầu cuộc trò chuyện mới
  const handleNewChat = () => {
    setCurrentSessionId(generateNewSessionId());
    setMessages([defaultGreeting]);
    setInputText('');
    setSelectedFiles([]);
    setError(null);
  };

  // Chọn một phiên chat từ lịch sử
  const handleSelectSession = async (sessionItem) => {
    if (sessionItem.sessionId === currentSessionId) return;
    try {
      const res = await chatAPI.getSessionDetail(sessionItem.sessionId);
      if (res.success && res.data?.session) {
        const loadedMessages = res.data.session.messages.map((m, idx) => ({
          id: idx + 1,
          type: m.role === 'user' ? 'user' : 'ai',
          text: m.text,
          status: m.status || 'info',
          recommendations: m.recommendations || [],
          timestamp: new Date(m.timestamp)
        }));

        setMessages(loadedMessages.length > 0 ? loadedMessages : [defaultGreeting]);
        setCurrentSessionId(sessionItem.sessionId);
        setIsMobileMenuOpen(false);
      }
    } catch (err) {
      setError('Không thể mở lại cuộc trò chuyện này.');
    }
  };

  // Đổi tên phiên chat
  const handleSaveRename = async (sessionId) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      const res = await chatAPI.renameSession(sessionId, editingTitle.trim());
      if (res.success) {
        setSessions((prev) =>
          prev.map((s) => (s.sessionId === sessionId ? { ...s, title: editingTitle.trim() } : s))
        );
      }
    } catch (err) {
      console.error('Lỗi đổi tên phiên:', err);
    } finally {
      setEditingSessionId(null);
      setEditingTitle('');
    }
  };

  // Xóa phiên chat
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này khỏi lịch sử?')) return;
    try {
      const res = await chatAPI.deleteSession(sessionId);
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Lỗi khi xóa session:', err);
    }
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
        const result = await chatAPI.send(currentInput, currentSessionId);
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

      // Nếu là Premium, refresh lại danh sách session để cập nhật tiêu đề/thời gian
      if (isPremium) {
        loadSessions();
      }
    } catch (err) {
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
    chatAPI.clearHistory(currentSessionId).catch(() => {});
    handleNewChat();
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

  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
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
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-white p-1 rounded"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex items-center space-x-3">
                <img src="/logo-aicee.png" alt="AICEE" className="w-14 h-14 object-contain" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg font-bold text-white">AICEE AI Assistant</h1>
                    {isPremium ? (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20">
                        <Crown className="w-3 h-3 fill-current" />
                        <span>PREMIUM</span>
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-gray-400 border border-slate-700">
                        Free
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-xs text-gray-400">Trợ lý AI đang hoạt động</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!isPremium && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all animate-pulse"
                >
                  <Crown className="w-3.5 h-3.5 fill-current" />
                  <span>Nâng cấp VIP</span>
                </button>
              )}

              <button
                onClick={clearChat}
                className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-lg transition-all text-sm"
                title="Làm mới cuộc trò chuyện"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Mới</span>
              </button>

              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all text-sm"
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
          } md:block w-full md:w-72 bg-slate-900/80 border-r border-slate-800 p-3 overflow-y-auto flex-shrink-0 flex flex-col justify-between`}
        >
          <div className="space-y-3">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center space-x-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Cuộc trò chuyện mới</span>
            </button>

            {/* Sidebar Tabs if Premium */}
            {isPremium ? (
              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
                <button
                  onClick={() => setSidebarTab('history')}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1.5 transition-colors ${
                    sidebarTab === 'history' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Lịch sử chat</span>
                </button>
                <button
                  onClick={() => setSidebarTab('suggestions')}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1.5 transition-colors ${
                    sidebarTab === 'suggestions' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gợi ý</span>
                </button>
              </div>
            ) : null}

            {/* Tab: History (Premium Only) */}
            {isPremium && sidebarTab === 'history' ? (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-gray-400 px-1 mb-2">
                  <span>Hội thoại đã lưu ({sessions.length})</span>
                  {isLoadingSessions && <span className="animate-spin text-cyan-400">⌛</span>}
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs">
                    Chưa có cuộc trò chuyện nào được lưu. Bắt đầu chat để lưu tự động!
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
                    {sessions.map((s) => {
                      const isActive = s.sessionId === currentSessionId;
                      return (
                        <div
                          key={s.sessionId}
                          onClick={() => handleSelectSession(s)}
                          className={`group relative flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all border ${
                            isActive
                              ? 'bg-slate-800 text-white border-cyan-500/50'
                              : 'text-gray-300 hover:bg-slate-800/60 border-transparent hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-gray-500'}`} />
                            {editingSessionId === s.sessionId ? (
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(s.sessionId);
                                  if (e.key === 'Escape') setEditingSessionId(null);
                                }}
                                onBlur={() => handleSaveRename(s.sessionId)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-950 text-white px-1.5 py-0.5 rounded border border-cyan-500 outline-none w-full"
                              />
                            ) : (
                              <span className="truncate">{s.title || 'Cuộc trò chuyện'}</span>
                            )}
                          </div>

                          <div className="hidden group-hover:flex items-center space-x-1 pl-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSessionId(s.sessionId);
                                setEditingTitle(s.title);
                              }}
                              className="p-1 hover:text-cyan-400 text-gray-400"
                              title="Đổi tên"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteSession(e, s.sessionId)}
                              className="p-1 hover:text-red-400 text-gray-400"
                              title="Xóa"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {/* Quick Actions / Suggestions */}
            {(!isPremium || sidebarTab === 'suggestions') && (
              <div className="space-y-1.5">
                <h3 className="text-gray-400 font-semibold mb-2 flex items-center space-x-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gợi ý bảo mật nhanh</span>
                </h3>
                <div className="space-y-1.5">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputText(action.prompt);
                        setIsMobileMenuOpen(false);
                        textareaRef.current?.focus();
                      }}
                      className="w-full text-left px-2.5 py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 rounded-lg text-gray-300 transition-all flex items-center space-x-2 text-xs"
                    >
                      <span className="text-base flex-shrink-0">{action.icon}</span>
                      <span className="truncate">{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Upgrade Banner for Free Users */}
          {!isPremium && (
            <div className="mt-4 p-3 bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/30 rounded-xl text-left">
              <div className="flex items-center space-x-1.5 mb-1 text-amber-400 text-xs font-bold">
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>Nâng Cấp Premium</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-snug mb-2.5">
                Tự động lưu trữ và mở lại toàn bộ lịch sử các cuộc hội thoại không giới hạn.
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center space-x-1"
              >
                <span>Xem gói cước</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
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
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-500 shadow-md shadow-cyan-500/20'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-purple-500/20'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  <div
                    className={`px-4 py-3 rounded-2xl max-w-full ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                        : `border ${getStatusColor(message.status)} text-gray-200`
                    }`}
                  >
                    {message.type === 'ai' && message.status && message.status !== 'info' && (
                      <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-700/50">
                        {getStatusIcon(message.status)}
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {getStatusLabel(message.status)}
                        </span>
                      </div>
                    )}

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

                    {message.text && (
                      <p className="whitespace-pre-line text-sm leading-relaxed">
                        {renderText(message.text)}
                      </p>
                    )}

                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-700/50">
                        <p className="text-xs text-gray-400 font-semibold mb-1.5">💡 Khuyến nghị:</p>
                        <ul className="space-y-1">
                          {message.recommendations.map((r, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-start space-x-1">
                              <span className="text-cyan-400 mr-1">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl flex items-center space-x-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Selected Files preview bar */}
          {selectedFiles.length > 0 && (
            <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center space-x-2 overflow-x-auto">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-xs text-gray-300 flex-shrink-0"
                >
                  <File className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-gray-500 hover:text-red-400 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-slate-900/80 border-t border-slate-800/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto flex items-end space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-cyan-400 rounded-xl transition-all flex-shrink-0 border border-slate-700"
                title="Đính kèm tệp tin"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="flex-1 bg-slate-800/70 border border-slate-700 rounded-xl focus-within:border-cyan-500/60 transition-all flex items-center px-3 py-1">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Nhập nội dung cần phân tích, link website, SĐT hoặc câu hỏi..."
                  rows={1}
                  className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none text-sm py-2"
                />
              </div>

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputText.trim() && selectedFiles.length === 0}
                className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatboxAI;