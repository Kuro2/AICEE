import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Send, User, Bot, Home, Menu, X, Sparkles, AlertCircle, CheckCircle, Info, Paperclip, Image as ImageIcon, File } from 'lucide-react';

const ChatboxAI = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: 'Xin chào! Tôi là trợ lý AI của AICEE. Tôi có thể giúp bạn kiểm tra độ an toàn của các trang web, email, số điện thoại và tư vấn về an ninh mạng. Bạn cần giúp gì?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock AI responses
  const getAIResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('http') || lowerMessage.includes('www') || lowerMessage.includes('.com')) {
      return {
        text: '🔍 Đang kiểm tra độ an toàn của liên kết...\n\n✅ Kết quả: Trang web này an toàn!\n\n🛡️ Thông tin:\n• Không phát hiện phần mềm độc hại\n• Chứng chỉ SSL hợp lệ\n• Không nằm trong danh sách đen\n\nBạn muốn kiểm tra thêm không?',
        type: 'safe'
      };
    }
    
    if (lowerMessage.includes('email') || lowerMessage.includes('@')) {
      return {
        text: '📧 Đang phân tích email...\n\n⚠️ Kết quả: Cẩn thận!\n\nEmail này có dấu hiệu đáng ngờ:\n• Người gửi không xác thực\n• Chứa liên kết khả ngờ\n• Yêu cầu thông tin cá nhân\n\nKhông nên nhấp vào liên kết hoặc trả lời email này.',
        type: 'warning'
      };
    }
    
    if (lowerMessage.includes('số điện thoại') || lowerMessage.includes('sđt') || /\d{9,}/.test(lowerMessage)) {
      return {
        text: '📱 Đang kiểm tra số điện thoại...\n\n❌ Kết quả: Nguy hiểm!\n\nSố này đã được báo cáo nhiều lần về:\n• Lừa đảo qua điện thoại\n• Mạo danh ngân hàng\n• Yêu cầu chuyển tiền\n\nKhông nên trả lời hoặc cung cấp thông tin cá nhân.',
        type: 'danger'
      };
    }
    
    if (lowerMessage.includes('cách') || lowerMessage.includes('bảo vệ') || lowerMessage.includes('an toàn')) {
      return {
        text: '🛡️ Mẹo bảo vệ an toàn trực tuyến:\n\n1. 🔒 Sử dụng mật khẩu mạnh và duy nhất\n2. ✅ Kiểm tra URL trước khi nhấp\n3. 🚫 Không chia sẽ thông tin cá nhân\n4. 📱 Bật xác thực hai yếu tố\n5. 🔄 Cập nhật phần mềm thường xuyên\n\nBạn cần tư vấn thêm về điều gì không?',
        type: 'info'
      };
    }
    
    // Default response
    return {
      text: 'Tôi có thể giúp bạn:\n\n🔗 Kiểm tra độ an toàn của website\n📧 Phân tích email lừa đảo\n📱 Xác minh số điện thoại\n🛡️ Tư vấn an ninh mạng\n\nHãy gửi cho tôi liên kết, email, số điện thoại cần kiểm tra hoặc đặt câu hỏi của bạn!',
      type: 'info'
    };
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const fileData = files.map(file => ({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setSelectedFiles(prev => [...prev, ...fileData]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && selectedFiles.length === 0) return;

    // Add user message with files
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputText,
      files: selectedFiles.length > 0 ? [...selectedFiles] : null,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputText('');
    setSelectedFiles([]);
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      let aiResponse;
      if (userMessage.files && userMessage.files.length > 0) {
        const isImage = userMessage.files.some(f => f.type.startsWith('image/'));
        aiResponse = {
          text: isImage 
            ? '🖼️ Đang phân tích hình ảnh...\n\n✅ Kết quả: Không phát hiện nội dung nguy hiểm!\n\n🛡️ Thông tin:\n• Không có malware ẩn trong metadata\n• Không phát hiện phishing/scam\n• Hình ảnh an toàn để xem\n\nBạn muốn kiểm tra thêm không?'
            : '📄 Đang phân tích file...\n\n✅ Kết quả: File an toàn!\n\n🛡️ Thông tin:\n• Không phát hiện virus\n• Không có mã độc\n• File hợp lệ\n\nBạn muốn kiểm tra thêm không?',
          type: 'safe'
        };
      } else {
        aiResponse = getAIResponse(inputText);
      }
      
      const aiMessage = {
        id: messages.length + 2,
        type: 'ai',
        text: aiResponse.text,
        status: aiResponse.type,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { icon: '🔗', text: 'Kiểm tra website' },
    { icon: '📧', text: 'Phân tích email' },
    { icon: '📱', text: 'Xác minh số điện thoại' },
    { icon: '🛡️', text: 'Mẹo an toàn' },
  ];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'safe': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'danger': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-blue-700/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-white"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo-aicee.png" 
                  alt="AICEE Logo" 
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-white">AICEE AI Assistant</h1>
                  <p className="text-xs text-gray-400">Trợ lý ảo thông minh</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
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

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar - Quick Actions (Desktop) */}
        <aside className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-slate-900/50 border-r border-slate-800 p-4 overflow-y-auto`}>
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>Hành động nhanh</span>
          </h3>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputText(action.text);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-gray-300 transition-all flex items-center space-x-3 group"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="group-hover:text-cyan-400 transition-colors">{action.text}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
            <h4 className="text-cyan-400 font-semibold mb-2 flex items-center space-x-2">
              <Info className="w-4 h-4" />
              <span>Mẹo</span>
            </h4>
            <p className="text-gray-400 text-sm">
              Gửi liên kết, email hoặc số điện thoại để tôi kiểm tra ngay!
            </p>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${message.type === 'user' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
                    {message.type === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div
                    className={`px-4 py-3 rounded-2xl ${message.type === 'user' ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white' : 'bg-slate-800 text-gray-200 border border-slate-700'}`}
                  >
                    {message.status && (
                      <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-700">
                        {getStatusIcon(message.status)}
                        <span className="text-xs font-semibold uppercase">
                          {message.status === 'safe' && 'An toàn'}
                          {message.status === 'warning' && 'Cảnh báo'}
                          {message.status === 'danger' && 'Nguy hiểm'}
                          {message.status === 'info' && 'Thông tin'}
                        </span>
                      </div>
                    )}
                    
                    {/* Display uploaded files */}
                    {message.files && message.files.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {message.files.map((fileData, idx) => (
                          <div key={idx}>
                            {fileData.preview ? (
                              <img 
                                src={fileData.preview} 
                                alt={fileData.name}
                                className="max-w-xs rounded-lg border border-white/20"
                              />
                            ) : (
                              <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                                <File className="w-4 h-4" />
                                <span className="text-sm">{fileData.name}</span>
                                <span className="text-xs opacity-70">({(fileData.size / 1024).toFixed(1)} KB)</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {message.text && <p className="whitespace-pre-line">{message.text}</p>}
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="px-4 py-3 bg-slate-800 rounded-2xl border border-slate-700">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-800 bg-slate-900/50 p-4">
            <div className="container mx-auto max-w-4xl">
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
                            className="w-20 h-20 object-cover rounded-lg border-2 border-slate-700"
                          />
                          <button
                            onClick={() => removeFile(idx)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg">
                          <File className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-gray-300 max-w-[150px] truncate">{fileData.name}</span>
                          <button
                            onClick={() => removeFile(idx)}
                            className="ml-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-end space-x-2">
                {/* File Upload Button */}
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
                  className="px-3 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-gray-300 rounded-xl transition-all flex items-center justify-center"
                  title="Đính kèm file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn hoặc đính kèm file..."
                    rows="1"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                    data-testid="chatbox-input"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() && selectedFiles.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  data-testid="chatbox-send-btn"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Gửi</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Nhấn Enter để gửi, Shift+Enter để xuống dòng • Hỗ trợ: Ảnh, PDF, DOC, TXT
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatboxAI;