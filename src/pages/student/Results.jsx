import React, { useEffect, useState } from 'react';
import {
  Trophy,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle,
  ChevronRight,
  BarChart2,
  AlertCircle,
  FileText,
  Target,
  Award,
  BookOpen,
  Activity,
  ArrowRight,
  Star,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { examApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function StudentResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const latestResult = location.state?.latestResult;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | subject

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '00:00';
    const s = Math.max(0, seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await examApi.getMyAttempts();
        const data = (res.data || []).map((item, idx) => ({
          id: `${item.examId}-${idx}`,
          examId: item.examId,
          attemptId: item.attemptId,
          title: item.title,
          subject: item.subject,
          score: item.score,
          totalQuestions: item.totalQuestions || 0,
          correctAnswers: item.correctCount || 0,
          timeSpentSeconds: item.timeSpent || 0,
          submittedAt: item.submittedAt,
        }));
        setResults(data);
      } catch (_err) {
        showToast({
          type: 'error',
          title: 'Lỗi',
          message: 'Không thể tải lịch sử làm bài. Vui lòng thử lại sau.',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const averageScore =
    results.length > 0
      ? (results.reduce((acc, curr) => acc + (curr.score || 0), 0) / results.length).toFixed(1)
      : '0.0';

  const totalTimeSeconds = results.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0);

  const formatHours = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const subjectStats = results.reduce((acc, curr) => {
    const key = curr.subject || 'Khác';
    if (!acc[key]) {
      acc[key] = { count: 0, totalScore: 0 };
    }
    acc[key].count += 1;
    acc[key].totalScore += curr.score || 0;
    return acc;
  }, {});

  const subjectList = Object.entries(subjectStats).map(([subject, info]) => ({
    subject,
    count: info.count,
    avgScore: info.count ? (info.totalScore / info.count).toFixed(1) : '0.0',
  }));

  const sortedByTime = [...results].sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt),
  );

  const examSummaryMap = results.reduce((acc, curr) => {
    const key = curr.examId;
    if (!acc[key]) {
      acc[key] = {
        examId: curr.examId,
        title: curr.title,
        best: curr,
        latest: curr,
      };
    } else {
      if (curr.score > acc[key].best.score) {
        acc[key].best = curr;
      }
      if (new Date(curr.submittedAt) > new Date(acc[key].latest.submittedAt)) {
        acc[key].latest = curr;
      }
    }
    return acc;
  }, {});

  const examSummaryList = Object.values(examSummaryMap);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="h-20 w-full bg-gray-200 dark:bg-slate-800 rounded-4xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-slate-800 rounded-4xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 w-full bg-gray-200 dark:bg-slate-800 rounded-4xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest border border-brand/20">
            <Activity className="w-3 h-3" /> Nhật ký năng lực
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Kết quả học tập
          </h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">
            Phân tích sâu và theo dõi sự tiến bộ của bạn qua từng kỳ thi.
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700">
          {[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'subject', label: 'Theo môn học' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-brand shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-slate-300',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {latestResult && (
        <div className="relative overflow-hidden rounded-4xl bg-gradient-brand p-8 md:p-10 text-white shadow-2xl shadow-brand/20">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                <BarChart2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-brand-light text-[10px] font-black uppercase tracking-widest">
                  Vừa hoàn thành
                </p>
                <h2 className="text-2xl font-black tracking-tight mt-1">{latestResult.title}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-xs font-bold opacity-80">
                    <BookOpen className="w-3.5 h-3.5" /> {latestResult.subject}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold opacity-80">
                    <Clock className="w-3.5 h-3.5" /> {formatTime(latestResult.timeSpentSeconds)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8 bg-white/10 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/20">
              <div className="text-center">
                <p className="text-[10px] font-black text-brand-light uppercase tracking-widest mb-1">
                  Điểm số
                </p>
                <p className="text-4xl font-black">{latestResult.score}</p>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="text-center">
                <p className="text-[10px] font-black text-brand-light uppercase tracking-widest mb-1">
                  Độ chính xác
                </p>
                <p className="text-4xl font-black">
                  {Math.round((latestResult.correctAnswers / latestResult.totalQuestions) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' ? (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/40 dark:shadow-none group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Target className="w-20 h-20 text-brand" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand mb-6">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                  Điểm trung bình
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                    {averageScore}
                  </h3>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    ↗ +0.2
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/40 dark:shadow-none group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Award className="w-20 h-20 text-indigo-500" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-6">
                  <Trophy className="w-6 h-6" />
                </div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                  Bài thi hoàn thành
                </p>
                <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                  {results.length}
                </h3>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/40 dark:shadow-none group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Clock className="w-20 h-20 text-rose-500" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                  Thời gian ôn tập
                </p>
                <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                  {formatHours(totalTimeSeconds)}
                </h3>
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="bg-white dark:bg-slate-900 rounded-4xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/30 dark:shadow-none overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand" /> Lịch sử chi tiết
              </h3>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {results.length} bản ghi
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-800/30">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Tên bài thi & Môn học
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">
                      Kết quả
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Thời gian làm
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">
                      Ngày nộp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {sortedByTime.map((res) => (
                    <tr
                      key={res.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/student/results/${res.examId}/${res.attemptId}`)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-brand font-black group-hover:bg-brand group-hover:text-white transition-all duration-300 border border-gray-100 dark:border-slate-700">
                            {(res.subject || 'EX').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white group-hover:text-brand transition-colors line-clamp-1">
                              {res.title}
                            </p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                              {res.subject}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={cn(
                              'px-4 py-1.5 rounded-xl text-sm font-black border shadow-sm',
                              res.score >= 8
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : res.score >= 5
                                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                                  : 'bg-rose-50 text-rose-600 border-rose-100',
                            )}
                          >
                            {res.score}
                          </span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {res.correctAnswers}/{res.totalQuestions} đúng
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                          <Clock className="w-4 h-4 text-brand" />{' '}
                          {formatTime(res.timeSpentSeconds)}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {new Date(res.submittedAt).toLocaleDateString('vi-VN')}
                          </p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {new Date(res.submittedAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/40 dark:shadow-none">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-2 uppercase tracking-tight">
              <BarChart2 className="w-5 h-5 text-brand" /> Thống kê theo môn
            </h3>
            <div className="space-y-6">
              {subjectList.map((item, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        {item.subject}
                      </p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {item.count} bài thi
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-brand">{item.avgScore}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Điểm TB
                      </p>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-brand rounded-full transition-all duration-1000"
                      style={{ width: `${(parseFloat(item.avgScore) / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {subjectList.length === 0 && (
                <p className="text-center text-gray-400 font-bold py-12">Chưa có dữ liệu môn học</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/40 dark:shadow-none">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-2 uppercase tracking-tight">
              <Trophy className="w-5 h-5 text-brand" /> Thành tích cao nhất
            </h3>
            <div className="space-y-4">
              {examSummaryList
                .sort((a, b) => b.best.score - a.best.score)
                .slice(0, 5)
                .map((summary, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-5 bg-gray-50/50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-800 group hover:bg-brand/5 transition-all"
                  >
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-brand font-black shadow-sm border border-gray-100 dark:border-slate-700">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-brand transition-colors">
                        {summary.title}
                      </p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                        {summary.best.subject} • {summary.best.correctAnswers}/
                        {summary.best.totalQuestions} câu
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-brand">{summary.best.score}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Điểm
                      </p>
                    </div>
                  </div>
                ))}
              {examSummaryList.length === 0 && (
                <p className="text-center text-gray-400 font-bold py-12">
                  Chưa có dữ liệu thành tích
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
