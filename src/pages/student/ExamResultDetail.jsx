import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examApi } from '../../services/api';
import { Clock, ArrowLeft, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StudentExamResultDetail() {
  const { examId, attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await examApi.getAttemptDetail(examId, attemptId);
        setExam(res.data.exam);
        setAttempt(res.data.attempt);
      } catch {
        setError('Không thể tải chi tiết bài làm. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [examId, attemptId]);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '';
    const s = Math.max(0, seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        Đang tải chi tiết bài làm...
      </div>
    );
  }

  if (error || !exam || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-sm text-red-500">
          {error || 'Không tìm thấy dữ liệu bài làm.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/student/results')}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
        >
          Quay lại kết quả
        </button>
      </div>
    );
  }

  const answersMap = {};
  (attempt.answers || []).forEach((a) => {
    answersMap[a.questionId] = a.answerId;
  });

  const totalQuestions = attempt.totalQuestions || exam.questions.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/student/results')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại kết quả
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase">Điểm số</p>
            <p className="text-2xl font-bold text-gray-900">{attempt.score}</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 flex items-center justify-center text-blue-700 font-bold">
            {attempt.correctCount}/{totalQuestions}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase">
              Chi tiết bài làm
            </p>
            <h1 className="text-lg font-bold text-gray-900">{exam.title}</h1>
            <p className="text-xs text-gray-500">
              Môn {exam.subject} • {totalQuestions} câu hỏi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Thời gian làm: {formatTime(attempt.timeSpent)}</span>
          </div>
          <div className="text-xs text-gray-500">
            Nộp lúc{' '}
            {attempt.submittedAt
              ? new Date(attempt.submittedAt).toLocaleString('vi-VN')
              : ''}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {exam.questions.map((q, idx) => {
          const chosen = answersMap[q.id] || null;
          const hasAnswered = !!chosen;
          const correctAnswer = q.answers.find((a) => a.isCorrect);
          const isCorrect =
            hasAnswered &&
            correctAnswer &&
            correctAnswer.id &&
            correctAnswer.id === chosen;

          return (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                      Câu {idx + 1}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase',
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700',
                      )}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Đúng
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Sai
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {q.content}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.answers.map((ans) => {
                  const isChosen = chosen === ans.id;
                  const isAnsCorrect = ans.isCorrect;

                  return (
                    <div
                      key={ans.id}
                      className={cn(
                        'p-3 rounded-lg border text-sm flex items-start gap-3',
                        isAnsCorrect
                          ? 'border-emerald-500 bg-emerald-50'
                          : isChosen
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-white',
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                          isAnsCorrect
                            ? 'bg-emerald-500 text-white'
                            : isChosen
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-600',
                        )}
                      >
                        {ans.id}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800">{ans.text}</p>
                        {isAnsCorrect && (
                          <p className="mt-1 text-[11px] text-emerald-700">
                            Đáp án đúng
                          </p>
                        )}
                        {isChosen && !isAnsCorrect && (
                          <p className="mt-1 text-[11px] text-red-700">
                            Bạn đã chọn
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="mt-2 p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-700">
                  <span className="font-semibold text-gray-900">
                    Giải thích:
                  </span>{' '}
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

