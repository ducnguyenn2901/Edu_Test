import React, { useEffect, useState } from 'react';
import {
  Bell,
  Search,
  Clock,
  CheckCircle,
  Calendar,
  TrendingUp,
  ChevronRight,
  Star,
  Trophy,
  Loader2,
  Users,
  Send,
  Target,
  BookOpen,
  GraduationCap,
  ArrowRight,
  School,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { examApi, classroomApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function StudentDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [data, setData] = useState({
    stats: {
      completedExamsCount: 0,
      averageScore: 0,
      studyHours: 0,
      classRank: { rank: '-', total: '-', topPercentage: 0 },
      totalUpcoming: 0,
    },
    upcomingExams: [],
    recentResults: [],
    scoreHistory: [],
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await examApi.getStudentDashboardStats();
      // Generate some mock history data if none exists for better UI
      const results = res.data.recentResults || [];
      const scoreHistory = results
        .slice()
        .reverse()
        .map((r) => ({
          name: r.title.substring(0, 10) + '...',
          score: r.score,
        }));

      setData({
        ...res.data,
        scoreHistory:
          scoreHistory.length > 0
            ? scoreHistory
            : [
                { name: 'Bài 1', score: 0 },
                { name: 'Bài 2', score: 0 },
                { name: 'Bài 3', score: 0 },
              ],
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!classCode.trim()) return;

    try {
      setJoining(true);
      const res = await classroomApi.join(classCode.trim());
      showToast({
        type: 'success',
        title: 'Thành công',
        message: res.data.message,
      });
      setClassCode('');
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Thất bại',
        message: err.response?.data?.message || 'Không thể gửi yêu cầu tham gia',
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-brand animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">
          Đang tải dữ liệu tổng quan...
        </p>
      </div>
    );
  }

  const { stats, upcomingExams, recentResults, scoreHistory } = data;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-brand p-12 md:p-20 text-white shadow-2xl shadow-brand/20 dark:shadow-none border border-white/10 group">
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-abstract-pattern opacity-[0.03] mix-blend-overlay"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center px-5 py-2 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 text-[10px] font-black uppercase tracking-[0.25em] shadow-lg shadow-black/5">
              ✨ Chào mừng trở lại
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
              Sẵn sàng chinh phục <br /> thử thách mới?
            </h1>
            <p className="text-brand-50/90 text-xl font-medium leading-relaxed max-w-xl">
              Chào{' '}
              <span className="text-white font-black underline decoration-brand-200 decoration-2 underline-offset-8">
                {user?.name}
              </span>
              ! Hiện có{' '}
              <span className="text-white font-black underline decoration-amber-400 decoration-2 underline-offset-8">
                {stats.totalUpcoming} kỳ thi
              </span>{' '}
              đang chờ bạn khám phá. Hãy bắt đầu ngay thôi!
            </p>
            <div className="flex flex-wrap gap-6 pt-4">
              <Link
                to="/student/exams"
                className="px-10 py-5 bg-white text-brand-700 rounded-3xl font-black hover:bg-amber-400 hover:text-gray-900 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-brand-900/20 flex items-center gap-3 group/btn"
              >
                Bắt đầu học ngay
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center group-hover/btn:bg-white transition-colors">
                  <ArrowRight className="w-5 h-5 text-brand-600 group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </Link>
              <button
                onClick={() => document.getElementById('join-class-input')?.focus()}
                className="px-10 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-3xl font-black hover:bg-white/20 transition-all flex items-center gap-3"
              >
                <School className="w-5 h-5" />
                Tham gia lớp học
              </button>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="w-72 h-72 bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/20 transform rotate-6 animate-float flex items-center justify-center shadow-2xl relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-400/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"></div>
              <Trophy className="w-36 h-36 text-amber-300 drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)] group-hover/card:scale-110 transition-transform duration-700" />
            </div>
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-emerald-500 rounded-[2rem] border-8 border-white dark:border-slate-900 transform -rotate-12 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <Star className="w-16 h-16 text-white fill-current animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {/* Stat 1: Progress Chart */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/10 dark:shadow-none flex flex-col justify-between group overflow-hidden relative transition-all hover:shadow-2xl hover:shadow-brand/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div className="w-16 h-16 bg-brand/10 dark:bg-brand/20 rounded-2xl flex items-center justify-center text-brand shadow-lg shadow-brand/5 group-hover:rotate-3 transition-transform">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-2">
                  Tiến độ tổng thể
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Đang tăng trưởng ✨
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-10">
              <div>
                <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                  Bài thi hoàn thành
                </h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    {stats.completedExamsCount}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700 font-black text-3xl">
                    / 20
                  </span>
                </div>
              </div>
              <div className="flex-1 h-[120px] pb-2 relative min-w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreHistory}>
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#1a56db"
                      strokeWidth={5}
                      fill="#1a56db"
                      fillOpacity={0.05}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-4">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden p-1 shadow-inner">
                <div
                  className="h-full bg-gradient-brand rounded-xl transition-all duration-1000 ease-out shadow-lg shadow-brand/20 relative overflow-hidden"
                  style={{ width: `${Math.min((stats.completedExamsCount / 20) * 100, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-bar-stripes_1s_linear_infinite]"></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-none">
                  Cấp độ 4
                </p>
                <p className="text-[11px] font-black text-brand uppercase tracking-widest leading-none">
                  Hoàn thành {Math.round((stats.completedExamsCount / 20) * 100)}% mục tiêu
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat 2: Score Card */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/10 dark:shadow-none hover:shadow-2xl hover:shadow-brand/5 transition-all duration-500 group flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-[1.25rem] flex items-center justify-center text-amber-500 mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-amber-500/5">
            <Star className="w-8 h-8 fill-current" />
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Điểm trung bình
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                {stats.averageScore}
              </h3>
              <span className="text-xl font-black text-slate-300 dark:text-slate-700">/10</span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl w-fit">
              <TrendingUp className="w-3 h-3" />
              +0.5 so với tháng trước
            </div>
          </div>
        </div>

        {/* Stat 3: Study Hours */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/10 dark:shadow-none hover:shadow-2xl hover:shadow-brand/5 transition-all duration-500 group flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-2xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="w-16 h-16 bg-brand/10 dark:bg-brand/20 rounded-[1.25rem] flex items-center justify-center text-brand mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-brand/5">
            <Clock className="w-8 h-8" />
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Thời gian ôn luyện
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                {stats.studyHours}
              </h3>
              <span className="text-xl font-black text-slate-300 dark:text-slate-700">Giờ</span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-brand uppercase tracking-wider bg-brand/5 dark:bg-brand/10 px-3 py-1.5 rounded-xl w-fit">
              <Target className="w-3 h-3" />
              Đã đạt 80% mục tiêu tuần
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Upcoming Exams Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200/20 dark:shadow-none">
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Lịch thi sắp tới
              </h2>
            </div>
            <Link
              to="/student/exams"
              className="group flex items-center gap-2 text-sm font-black text-brand"
            >
              Xem tất cả{' '}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingExams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="flex flex-col h-full gap-8">
                  <div className="flex items-start justify-between">
                    <div className="w-16 h-16 bg-brand/5 dark:bg-brand/10 rounded-[24px] flex items-center justify-center text-brand font-black text-2xl shadow-inner group-hover:bg-brand group-hover:text-white transition-all duration-500">
                      {(exam.subject || 'EX').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-amber-100 dark:border-amber-500/20">
                      Hot 🔥
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-2 group-hover:text-brand transition-colors leading-tight">
                      {exam.title}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                        <Clock className="w-3.5 h-3.5" /> {exam.duration}m
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                        <Calendar className="w-3.5 h-3.5" />{' '}
                        {new Date(exam.endAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/exam-focus/${exam._id}`}
                    className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-brand transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                  >
                    Bắt đầu ngay
                  </Link>
                </div>
              </div>
            ))}

            {upcomingExams.length === 0 && (
              <div className="md:col-span-2 text-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Tất cả đã hoàn thành!
                </h3>
                <p className="text-slate-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">
                  Bạn không có lịch thi nào trong hôm nay
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Results & Social */}
        <div className="space-y-10">
          {/* Recent Results List */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                  <CheckCircle className="w-5 h-5" />
                </div>
                Kết quả mới
              </h3>
              <Link
                to="/student/results"
                className="text-[10px] font-black text-brand uppercase tracking-widest hover:underline"
              >
                Tất cả
              </Link>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {recentResults.map((result) => (
                <div
                  key={result.id}
                  className="p-8 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm line-clamp-1 group-hover:text-brand transition-colors">
                      {result.title}
                    </p>
                    <div
                      className={cn(
                        'flex items-center justify-center w-12 h-12 rounded-2xl font-black text-lg shadow-sm border-2',
                        result.score >= 5
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          : 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
                      )}
                    >
                      {result.score}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand bg-brand/5 dark:bg-brand/10 px-2 py-1 rounded-md border border-brand/10">
                      {result.subject}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">
                      {new Date(result.submittedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action: Join Class */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 text-white shadow-2xl shadow-brand/10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-abstract-pattern opacity-5" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-brand backdrop-blur-md border border-white/10 group-hover:rotate-6 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-black text-xl tracking-tight">Vào lớp học</h3>
              </div>
              <p className="text-slate-400 text-[10px] mb-8 font-black leading-relaxed uppercase tracking-widest">
                Nhập mã lớp để tham gia cùng bạn bè
              </p>
              <form onSubmit={handleJoinClass} className="space-y-5">
                <input
                  id="join-class-input"
                  type="text"
                  placeholder="VD: CLASS-123"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-slate-500 font-bold focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                />
                <button
                  disabled={joining}
                  className="w-full py-4 bg-brand hover:bg-brand-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                >
                  {joining ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Gửi yêu cầu
                      <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
