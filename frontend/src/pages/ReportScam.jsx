import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  ShieldAlert, 
  Globe, 
  Phone, 
  Mail, 
  Building2, 
  HelpCircle, 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  ArrowLeft, 
  Info, 
  Lock,
  ExternalLink
} from 'lucide-react';
import { reportAPI, authAPI } from '@/services/api';

const REPORT_TYPES = [
  { id: 'Website', label: 'Website / Link độc', icon: Globe, placeholder: 'Ví dụ: https://nganhang-fake-otp.com hoặc domain lừa đảo' },
  { id: 'SĐT', label: 'Số Điện Thoại', icon: Phone, placeholder: 'Ví dụ: 0987654321 hoặc +84...' },
  { id: 'Email', label: 'Email Giả Mạo', icon: Mail, placeholder: 'Ví dụ: support@fake-apple-security.com' },
  { id: 'Tổ chức giả mạo', label: 'Tổ Chức Giả Mạo', icon: Building2, placeholder: 'Ví dụ: Tên công ty, sàn đầu tư tiền ảo lừa đảo, quỹ mạo danh' },
  { id: 'Khác', label: 'Hình Thức Khác', icon: HelpCircle, placeholder: 'Nhập thông tin nhận diện tài khoản, mạng xã hội lừa đảo...' },
];

const ReportScam = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Form State
  const [targetType, setTargetType] = useState('Website');
  const [target, setTarget] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    const user = authAPI.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setReporterName(user.name || '');
      setReporterEmail(user.email || '');
    }
  }, []);

  // Xử lý chọn tệp đính kèm
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    if (files.length + selectedFiles.length > 5) {
      setErrorMessage('Chỉ được tải lên tối đa 5 tệp đính kèm.');
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of selectedFiles) {
      if (file.size > 15 * 1024 * 1024) {
        setErrorMessage(`Tệp "${file.name}" vượt quá giới hạn 15MB.`);
        return;
      }
      validFiles.push(file);

      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        newPreviews.push({ file, previewUrl, isImage: true });
      } else {
        newPreviews.push({ file, previewUrl: null, isImage: false });
      }
    }

    setErrorMessage('');
    setFiles(prev => [...prev, ...validFiles]);
    setFilePreviews(prev => [...prev, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    const previewToRemove = filePreviews[index];
    if (previewToRemove?.previewUrl) {
      URL.revokeObjectURL(previewToRemove.previewUrl);
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!target.trim()) {
      setErrorMessage('Vui lòng điền địa chỉ website, số điện thoại hoặc mục cần báo cáo.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Vui lòng mô tả chi tiết dấu hiệu hoặc hành vi lừa đảo (ít nhất 10 ký tự).');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('target', target.trim());
      formData.append('type', targetType);
      formData.append('title', title.trim() || `Báo cáo ${targetType}: ${target.trim()}`);
      formData.append('description', description.trim());
      formData.append('reporterName', reporterName.trim() || (currentUser?.name || 'Ẩn danh'));
      formData.append('reporterEmail', reporterEmail.trim());
      formData.append('reporterPhone', reporterPhone.trim());

      files.forEach((file) => {
        formData.append('evidenceFiles', file);
      });

      const res = await reportAPI.submit(formData);

      if (res.success) {
        setSubmittedData(res.data);
        setIsSuccessModalOpen(true);
        // Reset form
        setTarget('');
        setTitle('');
        setDescription('');
        setFiles([]);
        setFilePreviews([]);
      } else {
        setErrorMessage(res.message || 'Không thể gửi báo cáo. Vui lòng thử lại sau.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Đã xảy ra lỗi khi gửi báo cáo lên máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTypeObj = REPORT_TYPES.find(t => t.id === targetType) || REPORT_TYPES[0];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-red-500/30 relative overflow-hidden">
      {/* Background ambient neon glow */}
      <div className="absolute top-20 left-1/4 w-[600px] h-[500px] bg-red-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[180px] pointer-events-none" />

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* Back Link */}
          <div className="flex items-center justify-between mb-8">
            <Link 
              to="/resources/unsafe" 
              className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-red-400 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Xem Danh Sách Cảnh Báo Đen
            </Link>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bảo mật danh tính & mã hóa dữ liệu báo cáo</span>
            </div>
          </div>

          {/* Header Banner */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-red-950/40 via-slate-900/50 to-slate-950/80 border border-red-500/30 backdrop-blur-2xl shadow-2xl mb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  Trung Tâm Tiếp Nhận Tố Giác Lừa Đảo
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Báo Cáo Đối Tượng & Website Lừa Đảo
                </h1>
                <p className="text-gray-300 text-sm sm:text-base mt-2 leading-relaxed">
                  Chung tay cùng cộng đồng an ninh mạng AICEE bảo vệ người dùng Việt Nam. Mỗi báo cáo xác thực sẽ được quản trị viên duyệt và tự động đưa vào <span className="text-red-400 font-semibold">Danh Sách Không An Toàn</span> để ngăn chặn các nạn nhân tiếp theo.
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-950/60 border border-white/10 backdrop-blur-2xl shadow-2xl">
            {errorMessage && (
              <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Bước 1: Chọn Thể Loại */}
              <div>
                <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider mb-3">
                  1. Chọn thể loại cần báo cáo <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {REPORT_TYPES.map((type) => {
                    const IconComponent = type.icon;
                    const isSelected = targetType === type.id;
                    return (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setTargetType(type.id)}
                        className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-red-500/20 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <IconComponent className={`w-6 h-6 ${isSelected ? 'text-red-400' : 'text-gray-400'}`} />
                        <span className="text-xs font-semibold">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bước 2: Thông tin mục lừa đảo */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider mb-2">
                    2. Mục tiêu cần báo cáo ({targetType}) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder={activeTypeObj.placeholder}
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm font-mono"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Nhập chính xác đường link website, số điện thoại gọi đến hoặc địa chỉ email giả mạo.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider mb-2">
                    Tiêu đề ngắn gọn về vụ việc
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Giả mạo ngân hàng gửi link SMS thông báo khóa tài khoản"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider mb-2">
                    3. Mô tả chi tiết hành vi & thủ đoạn lừa đảo <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả cụ thể: Kẻ xấu liên hệ qua đâu? Chúng yêu cầu làm gì (nạp tiền, chuyển khoản, cung cấp mã OTP)? Có dẫn link giả mạo nào không?..."
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm leading-relaxed"
                  />
                </div>
              </div>

              {/* Bước 3: Tải bằng chứng (Hình ảnh PNG, PDF) */}
              <div>
                <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider mb-2">
                  4. Tải lên tệp bằng chứng (Ảnh chụp màn hình, PDF, Tài liệu)
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  Đính kèm bằng chứng như tin nhắn đe dọa, giao dịch chuyển khoản, email giả mạo hoặc biên lai (Hỗ trợ PNG, JPG, WEBP, PDF - Tối đa 5 file, mỗi file &le; 15MB).
                </p>

                {/* Drag / Select Box */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-red-500/50 rounded-2xl p-6 text-center cursor-pointer bg-white/[0.02] hover:bg-red-500/[0.03] transition-all group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept="image/png,image/jpeg,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-red-500/10 text-gray-400 group-hover:text-red-400 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-300 group-hover:text-white">
                      Bấm vào đây để chọn tệp bằng chứng từ máy tính
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF, DOCX (Tối đa 5 tệp)
                    </p>
                  </div>
                </div>

                {/* Previews List */}
                {filePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {filePreviews.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="relative group rounded-xl border border-white/15 bg-slate-900/80 p-2 overflow-hidden flex flex-col items-center text-center"
                      >
                        {item.isImage ? (
                          <div className="w-full h-24 rounded-lg overflow-hidden bg-black/40 mb-2">
                            <img 
                              src={item.previewUrl} 
                              alt={`Evidence ${idx + 1}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            />
                          </div>
                        ) : (
                          <div className="w-full h-24 rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center text-red-400 mb-2">
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">PDF / DOC</span>
                          </div>
                        )}

                        <span className="text-[11px] text-gray-300 font-medium truncate w-full px-1" title={item.file.name}>
                          {item.file.name}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition-colors shadow-md"
                          title="Xóa tệp này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bước 4: Thông tin người báo cáo */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                    5. Thông tin người gửi báo cáo (Không bắt buộc)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Họ và tên hoặc Biệt danh</label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Ẩn danh"
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Email nhận thông báo kết quả</label>
                    <input
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Số điện thoại liên hệ</label>
                    <input
                      type="tel"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      placeholder="09..."
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-base shadow-[0_0_30px_rgba(239,68,68,0.35)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang mã hóa & gửi báo cáo đến Admin...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      <span>Gửi Báo Cáo Lừa Đảo Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {isSuccessModalOpen && submittedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-950 border border-red-500/40 rounded-3xl p-8 max-w-lg w-full text-center relative shadow-[0_0_50px_rgba(239,68,68,0.25)]">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center mb-5 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-2">
              Báo Cáo Đã Được Tiếp Nhận!
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Cảm ơn bạn đã đóng góp thông tin quý báu cho cộng đồng. Báo cáo về đối tượng <span className="text-red-400 font-mono font-semibold">"{submittedData.target}"</span> đã được chuyển tới trung tâm kiểm định của Quản Trị Viên AICEE.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left mb-6 space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Mã định danh báo cáo:</span>
                <span className="font-mono text-cyan-400 font-bold">{submittedData._id}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Thể loại:</span>
                <span className="text-white font-medium">{submittedData.type}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Trạng thái:</span>
                <span className="text-yellow-400 font-semibold uppercase tracking-wider">Đang chờ Admin duyệt</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Số tệp bằng chứng đính kèm:</span>
                <span className="text-white">{submittedData.evidenceFiles?.length || 0} tệp</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
              >
                Gửi Báo Cáo Khác
              </button>
              <Link
                to="/resources/unsafe"
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30"
              >
                <span>Xem Blacklist</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ReportScam;
