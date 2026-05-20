import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  Eye,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import { examApi } from '../../services/api';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export function StudentExam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [examTitle, setExamTitle] = useState('');
  const [examCode, setExamCode] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem(`answers-${id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [flagged, setFlagged] = useState(() => {
    const saved = localStorage.getItem(`flagged-${id}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(`answers-${id}`, JSON.stringify(answers));
  }, [answers, id]);

  useEffect(() => {
    localStorage.setItem(`flagged-${id}`, JSON.stringify(Array.from(flagged)));
  }, [flagged, id]);

  const clearExamStorage = useCallback(() => {
    localStorage.removeItem(`answers-${id}`);
    localStorage.removeItem(`flagged-${id}`);
    localStorage.removeItem(`exam-start-${id}`);
  }, [id]);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [initialTime, setInitialTime] = useState(45 * 60);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [focusLossCount, setFocusLossCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnedFiveMinutes, setWarnedFiveMinutes] = useState(false);
  const [warnedOneMinute, setWarnedOneMinute] = useState(false);
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [scoringConfig, setScoringConfig] = useState({
    enabled: false,
    negativeMarkRatio: 0,
    passScore: 5,
  });

  const handleSubmit = useCallback(async () => {
    if (!questions.length) {
      navigate('/student/results');
      return;
    }

    let correctCount = 0;
    let totalWeight = 0;
    let rawScore = 0;
    const answersDetail = questions.map((q) => {
      const chosen = answers[q.id];
      const option = (q.answers || []).find((ans) => ans.id === chosen);
      const weight = typeof q.weight === 'number' && q.weight > 0 ? q.weight : 1;
      totalWeight += weight;
      if (option && option.isCorrect) {
        correctCount += 1;
        rawScore += weight;
      } else if (chosen && scoringConfig.enabled) {
        rawScore -= scoringConfig.negativeMarkRatio * weight;
      }
      return {
        questionId: q.questionId,
        answerId: chosen || null,
      };
    });

    const totalQuestions = questions.length;
    let normalizedScore;
    if (scoringConfig.enabled && totalWeight > 0) {
      const maxPossible = totalWeight;
      const safeRaw = Math.max(0, rawScore);
      normalizedScore = (safeRaw / maxPossible) * 10;
    } else {
      normalizedScore = (correctCount / totalQuestions) * 10;
    }
    const score = Number(normalizedScore.toFixed(1));
    const timeSpent = Math.max(0, initialTime - timeLeft);
    const submittedAt = new Date().toISOString();

    const latestResult = {
      examId: id,
      title: examTitle,
      subject: examSubject,
      score,
      totalQuestions,
      correctAnswers: correctCount,
      timeSpentSeconds: timeSpent,
      submittedAt,
    };

    setSubmitting(true);
    try {
      await examApi.submit(id, {
        score,
        correctCount,
        totalQuestions,
        timeSpent,
        answers: answersDetail,
      });
      clearExamStorage();
      showToast({
        type: 'success',
        title: 'Đã nộp bài',
        message: 'Bài làm của bạn đã được ghi nhận thành công.',
      });
    } catch (e) {
      console.error(e);
      showToast({
        type: 'error',
        title: 'Nộp bài thất bại',
        message: 'Không thể nộp bài. Vui lòng kiểm tra lại kết nối.',
      });
    } finally {
      setSubmitting(false);
    }

    navigate('/student/results', { state: { latestResult } });
  }, [
    answers,
    examSubject,
    examTitle,
    id,
    initialTime,
    navigate,
    questions,
    timeLeft,
    scoringConfig.enabled,
    scoringConfig.negativeMarkRatio,
    showToast,
  ]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await examApi.getById(id, { mode: 'attempt' });
        const exam = res.data;
        
        // Shuffle questions but maintain their data
        const shuffledQuestions = [...(exam.questions || [])].sort(
          () => Math.random() - 0.5,
        );
        
        const mappedQuestions = shuffledQuestions.map((q, idx) => {
          const shuffledAnswers = [...(q.answers || [])].sort(
            () => Math.random() - 0.5,
          );
          return {
            id: idx + 1,
            questionId: q._id,
            content: q.content,
            weight: typeof q.weight === 'number' ? q.weight : 1,
            answers: shuffledAnswers.map((a, aIdx) => ({
              id: String.fromCharCode(65 + aIdx),
              text: a.content,
              isCorrect: a.isCorrect,
              originalId: a._id // Keep original ID if needed
            })),
          };
        });
        setQuestions(mappedQuestions);
        setExamTitle(exam.title || 'Bài thi');
        setExamCode(exam._id ? exam._id.slice(-6).toUpperCase() : '');
        
        // Timer Logic
        const durationSeconds = (exam.duration || 45) * 60;
        const savedStartTime = localStorage.getItem(`exam-start-${id}`);
        let currentTimer;
        
        if (savedStartTime) {
          const startTime = parseInt(savedStartTime);
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          currentTimer = Math.max(0, durationSeconds - elapsed);
          
          if (currentTimer === 0) {
            // Time already expired
            setError('Thời gian làm bài này của bạn đã hết.');
            return;
          }
        } else {
          localStorage.setItem(`exam-start-${id}`, Date.now().toString());
          currentTimer = durationSeconds;
        }

        setExamSubject(exam.subject || '');
        setInitialTime(durationSeconds);
        setTimeLeft(currentTimer);
        
        if (exam.scoringConfig) {
          setScoringConfig({
            enabled: Boolean(exam.scoringConfig.enabled),
            negativeMarkRatio: exam.scoringConfig.negativeMarkRatio || 0,
            passScore:
              typeof exam.scoringConfig.passScore === 'number'
                ? exam.scoringConfig.passScore
                : 5,
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải đề thi. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !autoSubmitted) {
      setAutoSubmitted(true);
      showToast({
        type: 'warning',
        title: 'Hết thời gian',
        message: 'Bài làm của bạn sẽ được nộp tự động.',
      });
      handleSubmit();
    }
  }, [timeLeft, autoSubmitted, handleSubmit, showToast]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFocusLossCount((prev) => prev + 1);
      }
    };

    const handleBlur = () => {
      setFocusLossCount((prev) => prev + 1);
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (focusLossCount === 1) {
      showToast({
        type: 'warning',
        title: 'Cảnh báo',
        message:
          'Vui lòng không chuyển tab trong khi làm bài. Hệ thống sẽ tự động nộp bài nếu tiếp diễn.',
      });
    } else if (focusLossCount === 3 && !autoSubmitted) {
      showToast({
        type: 'error',
        title: 'Tự động nộp bài',
        message:
          'Bạn đã chuyển tab quá nhiều lần, hệ thống sẽ tự động nộp bài.',
      });
      setAutoSubmitted(true);
      handleSubmit();
    }
  }, [focusLossCount, autoSubmitted, handleSubmit, showToast]);

  useEffect(() => {
    if (timeLeft <= 300 && timeLeft > 0 && !warnedFiveMinutes) {
      setWarnedFiveMinutes(true);
      showToast({
        type: 'warning',
        title: 'Sắp hết giờ',
        message: 'Còn 5 phút làm bài. Vui lòng kiểm tra lại các câu hỏi.',
      });
    } else if (timeLeft <= 60 && timeLeft > 0 && !warnedOneMinute) {
      setWarnedOneMinute(true);
      showToast({
        type: 'warning',
        title: 'Chú ý',
        message: 'Chỉ còn 1 phút cuối cùng. Hãy nhanh chóng hoàn thành bài.',
      });
    }
  }, [timeLeft, warnedFiveMinutes, warnedOneMinute, showToast]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch(() => undefined);
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => undefined);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')} : ${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIdx];
  const isAnswered = (idx) => answers[idx + 1] !== undefined;
  const isFlagged = (idx) => flagged.has(idx + 1);
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Clock className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !questions.length) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <p className="text-gray-700 text-sm">
          {error || 'Đề thi hiện chưa có câu hỏi.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/student/exams')}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
        >
          Quay lại danh sách bài thi
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 z-30 shadow-sm relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-blue-200 shadow-md">
              <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-base md:text-lg font-bold text-gray-900 leading-tight line-clamp-1">
                {examTitle}
              </h1>
              <p className="text-xs text-gray-500">
                Mã đề: {examCode || 'Đang cập nhật'}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
           <div className={cn(
             "px-4 md:px-6 py-1.5 md:py-2 rounded-full flex items-center gap-2 md:gap-3 border shadow-sm transition-colors",
             timeLeft < 300 ? "bg-red-50 border-red-200 text-red-600 animate-pulse" : "bg-blue-50 border-blue-100 text-blue-700"
           )}>
            <Clock className={cn("w-4 h-4 md:w-5 md:h-5", timeLeft < 300 && "animate-bounce")} />
            <span className="text-lg md:text-xl font-bold font-mono tracking-wider">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-xs text-gray-500 uppercase font-semibold">Thí sinh</p>
            <p className="text-sm font-bold text-gray-900">{user?.name || 'Đang tải...'}</p>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>Thoát chế độ tập trung</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>Chế độ tập trung</span>
              </>
            )}
          </button>
          <button 
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 md:px-6 py-2 rounded-lg font-bold text-sm shadow-md shadow-blue-200 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          >
            <span className="hidden md:inline">Nộp bài</span>
            <span className="md:hidden">Nộp</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Overlay for Mobile */}
        {isSidebarOpen && (
          <button 
            type="button"
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Đóng danh sách câu hỏi"
          />
        )}

        {/* Navigation Sidebar */}
        <aside className={cn(
          "absolute md:relative z-20 h-full w-80 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 shadow-xl md:shadow-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden"
        )}>
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Danh sách câu hỏi</h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-1 hover:bg-gray-200 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex justify-between text-xs mb-2">
              <span className="font-semibold text-gray-600">
                Đã làm {answeredCount}/{questions.length} câu
              </span>
              <span className="text-blue-600 font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIdx(idx);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "aspect-square rounded-lg text-sm font-bold transition-all border shadow-sm flex items-center justify-center relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
                    currentIdx === idx 
                      ? "ring-2 ring-blue-500 ring-offset-2 border-blue-600 bg-blue-600 text-white z-10 scale-110"
                      : isFlagged(idx)
                        ? "bg-yellow-100 text-yellow-700 border-yellow-400 hover:bg-yellow-200"
                        : isAnswered(idx)
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  )}
                >
                  {q.id}
                  {isFlagged(idx) && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-500 rounded-full border border-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 space-y-2">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                <span>Đang chọn / Đã làm</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
                <span>Đã gắn cờ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white border border-gray-300 rounded-sm"></div>
                <span>Chưa làm</span>
              </div>
          </div>
        </aside>

        {/* Question Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/50 relative">
          {/* Toggle Sidebar Button (Desktop) */}
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-4 top-4 z-10 p-2 bg-white shadow-md border border-gray-200 rounded-lg hover:bg-gray-50 hidden md:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}

          <div className="flex-1 overflow-y-auto p-4 md:p-8 md:max-w-4xl md:mx-auto w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              {/* Question Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                   <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm shadow-blue-200">
                    Câu {currentQ.id}
                  </span>
              <span className="text-gray-400 text-sm">/ {questions.length}</span>
                </div>
               
                <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                  <Eye className="w-3.5 h-3.5" />
                  ID: {1000 + currentQ.id}
                </div>
              </div>

              {/* Question Content */}
              <div className="p-6 md:p-8">
                <h2 className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed mb-8">
                  {currentQ.content}
                </h2>
                
                {/* Image/Formula Placeholder */}
                <div className="bg-gray-900 rounded-xl p-8 flex flex-col items-center justify-center mb-8 shadow-inner border border-gray-800 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-50"></div>
                  <div className="relative z-10 text-center">
                     <p className="text-gray-500 font-mono text-sm mb-2 opacity-70">[Khu vực hiển thị công thức/hình ảnh]</p>
                     <p className="text-white font-serif text-2xl tracking-wider italic">\int_&#123;1&#125;^&#123;3&#125; f'(x) dx = f(3) - f(1)</p>
                  </div>
                </div>

                {/* Answers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQ.answers.map((ans) => (
                    <label 
                      key={ans.id}
                      className={cn(
                        "relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group overflow-hidden",
                        answers[currentQ.id] === ans.id
                          ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-lg transition-colors border",
                        answers[currentQ.id] === ans.id 
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                          : "bg-gray-100 text-gray-500 border-gray-200 group-hover:bg-white group-hover:border-blue-200"
                      )}>
                        {ans.id}
                      </div>
                      
                      <span className={cn(
                        "text-gray-700 font-medium text-lg flex-1",
                         answers[currentQ.id] === ans.id && "text-blue-900 font-bold"
                      )}>
                        {ans.text}
                      </span>

                      {answers[currentQ.id] === ans.id && (
                        <div className="absolute top-0 right-0 p-1.5 bg-blue-600 rounded-bl-xl shadow-sm">
                           <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                      
                      <input 
                        type="radio" 
                        name={`q-${currentQ.id}`} 
                        className="hidden"
                        checked={answers[currentQ.id] === ans.id}
                        onChange={() => setAnswers({...answers, [currentQ.id]: ans.id})}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button 
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden md:inline">Câu trước</span>
              </button>

              <button 
                onClick={() => {
                  const newSet = new Set(flagged);
                  if (newSet.has(currentQ.id)) newSet.delete(currentQ.id);
                  else newSet.add(currentQ.id);
                  setFlagged(newSet);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 md:px-6 py-2.5 border rounded-xl font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500",
                  flagged.has(currentQ.id) 
                    ? "bg-yellow-50 border-yellow-300 text-yellow-700 shadow-sm" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <Flag className={cn("w-5 h-5", flagged.has(currentQ.id) && "fill-current")} />
                <span className="hidden md:inline">{flagged.has(currentQ.id) ? 'Bỏ gắn cờ' : 'Gắn cờ'}</span>
              </button>

              <button 
                onClick={() =>
                  setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))
                }
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md shadow-blue-200 transition-all hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                <span className="hidden md:inline">Câu tiếp theo</span>
                <span className="md:hidden">Tiếp</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Xác nhận nộp bài?</h3>
            <p className="text-gray-500 text-center mb-6">
              Bạn đã hoàn thành{' '}
              <span className="font-bold text-gray-900">
                {Object.keys(answers).length}/{questions.length}
              </span>{' '}
              câu hỏi. 
              {questions.length - Object.keys(answers).length > 0 && (
                <span className="text-red-500 block mt-1">
                  Vẫn còn {questions.length - Object.keys(answers).length} câu
                  chưa trả lời.
                </span>
              )}
              <br/>Bạn có chắc chắn muốn nộp bài không?
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
              >
                Kiểm tra lại
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                {submitting ? 'Đang nộp...' : 'Nộp bài ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
