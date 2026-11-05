import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  RotateCcw, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  Loader2, 
  BookOpen,
  Share2
} from 'lucide-react';
import { quizAPI } from '@/services/api';

const QuizTopicPlayer = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);

  // Tải chi tiết chủ đề và câu hỏi từ Backend
  useEffect(() => {
    let isMounted = true;
    const fetchTopic = async () => {
      setLoading(true);
      setError(null);
      try {
        // Hỗ trợ alias: nếu slug là fake hoặc email từ router cũ
        const querySlug = slug === 'fake' ? 'luadao' : slug;
        const res = await quizAPI.getTopicBySlug(querySlug);
        if (isMounted) {
          if (res.success && res.data) {
            setTopic(res.data);
            setCurrentIdx(0);
            setSelectedOptionIdx(null);
            setIsAnswered(false);
            setScore(0);
            setIsCompleted(false);
            setUserAnswers([]);
          } else {
            setError(res.message || 'Không tìm thấy chủ đề');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Không thể kết nối tới máy chủ');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTopic();
    return () => { isMounted = false; };
  }, [slug]);

  const questions = topic?.questions || [];
  const currentQ = questions[currentIdx];

  const handleSelectOption = (idx) => {
    if (isAnswered) return;
    setSelectedOptionIdx(idx);
    setIsAnswered(true);

    const isCorrect = currentQ.options[idx]?.isCorrect === true;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setUserAnswers(prev => [
      ...prev,
      {
        questionIdx: currentIdx,
        selectedOptionIdx: idx,
        isCorrect
      }
    ]);
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOptionIdx(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOptionIdx(null);
    setIsAnswered(false);
    setScore(0);
    setIsCompleted(false);
    setUserAnswers([]);
  };

  // 1. Loading State (Flat design, no gradient)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white flex flex-col font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-4">
          <div className="text-center p-8 bg-[#111827] border border-slate-800 rounded-2xl max-w-md w-full">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-1">Đang tải chủ đề trắc nghiệm...</h2>
            <p className="text-sm text-slate-400">Đang chuẩn bị bộ câu hỏi từ hệ thống an ninh mạng AICEE</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Error State
  if (error || !topic || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white flex flex-col font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-4">
          <div className="text-center p-8 bg-[#111827] border border-slate-800 rounded-2xl max-w-md w-full">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Chủ đề chưa sẵn sàng</h2>
            <p className="text-sm text-slate-300 mb-6">{error || 'Chủ đề này hiện chưa có câu hỏi nào được xuất bản.'}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/quiz" 
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Danh sách Chủ đề
              </Link>
              <Link 
                to="/resources" 
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
              >
                Về Tài nguyên
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-3xl">
          {/* Top navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              to="/quiz" 
              className="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tất cả chủ đề Quiz
            </Link>

            <span className="text-xs font-mono px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
              /quiz/{topic.slug}
            </span>
          </div>

          {!isCompleted ? (
            /* Quiz Active Card - STRICT FLAT DESIGN (No gradient) */
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              {/* Topic Header & Progress */}
              <div className="pb-6 mb-6 border-b border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                      Chủ đề trắc nghiệm
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                      {topic.title}
                    </h1>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 block">Tiến độ</span>
                    <span className="text-lg font-bold text-cyan-400 font-mono">
                      {currentIdx + 1} / {questions.length}
                    </span>
                  </div>
                </div>

                {/* Progress bar (Solid flat color) */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-full transition-all duration-300" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Question Box */}
              <div className="mb-8">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Câu hỏi {currentIdx + 1}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {currentQ.title}
                </h2>
              </div>

              {/* Options List - Clean Flat Buttons */}
              <div className="space-y-3 mb-6">
                {currentQ.options?.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = selectedOptionIdx === oIdx;
                  
                  let optionStyle = 'bg-[#1e293b] hover:bg-[#283548] border-slate-700 text-slate-200';
                  let letterBadge = 'bg-slate-700 text-slate-300';

                  if (isAnswered) {
                    if (opt.isCorrect) {
                      optionStyle = 'bg-[#064e3b] border-emerald-500 text-emerald-100 font-semibold';
                      letterBadge = 'bg-emerald-500 text-black font-bold';
                    } else if (isSelected && !opt.isCorrect) {
                      optionStyle = 'bg-[#7f1d1d] border-red-500 text-red-100 font-semibold';
                      letterBadge = 'bg-red-500 text-white font-bold';
                    } else {
                      optionStyle = 'bg-[#0f172a] border-slate-800 text-slate-500 opacity-60';
                      letterBadge = 'bg-slate-800 text-slate-600';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-start space-x-3.5 ${optionStyle}`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${letterBadge}`}>
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base leading-snug pt-0.5">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Box (Flat solid, no gradient) */}
              {isAnswered && (
                <div className={`p-5 rounded-xl border mb-6 ${
                  currentQ.options[selectedOptionIdx]?.isCorrect
                    ? 'bg-[#064e3b] border-emerald-500 text-emerald-200'
                    : 'bg-[#7f1d1d] border-red-500 text-red-200'
                }`}>
                  <div className="flex items-center space-x-2 font-bold text-sm sm:text-base mb-2">
                    {currentQ.options[selectedOptionIdx]?.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Chính xác! Bạn nhận được +1 điểm.</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span>Chưa chính xác! Hãy đọc kỹ giải thích dưới đây:</span>
                      </>
                    )}
                  </div>
                  
                  {currentQ.explanation && (
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-7">
                      {currentQ.explanation}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                    <button
                      onClick={handleNext}
                      className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-bold text-sm transition-colors"
                    >
                      {currentIdx + 1 < questions.length ? 'Câu tiếp theo →' : 'Xem kết quả tổng kết'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Result Screen - STRICT FLAT DESIGN (No gradient) */
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-8 sm:p-10 text-center shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8" />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-2">
                Hoàn thành chủ đề
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                {topic.title}
              </h2>

              <div className="my-8 p-6 rounded-2xl bg-[#0f172a] border border-slate-800 max-w-sm mx-auto">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Kết quả đạt được
                </span>
                <div className="text-4xl font-extrabold text-cyan-400 font-mono mb-2">
                  {score} / {questions.length}
                </div>
                <p className="text-sm text-slate-300">
                  {score === questions.length 
                    ? 'Xuất sắc! Bạn nắm rất vững các thủ đoạn an ninh mạng trong chủ đề này.'
                    : score >= Math.ceil(questions.length / 2)
                    ? 'Khá tốt! Bạn đã phát hiện được đa số các tình huống đáng ngờ.'
                    : 'Cần chú ý thêm! Hãy cẩn trọng hơn với các tình huống yêu cầu tiền bạc và link lạ.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleRestart}
                  className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm lại chủ đề này</span>
                </button>

                <Link
                  to="/quiz"
                  className="px-6 py-3 rounded-xl bg-[#1e293b] hover:bg-[#283548] border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center space-x-2 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Chọn chủ đề khác</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuizTopicPlayer;
