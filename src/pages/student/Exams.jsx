import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Filter,
  Search,
  ChevronRight,
  PlayCircle,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Trophy,
  LayoutGrid,
  List,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { examApi } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';

export function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, completed
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [attemptSummary, setAttemptSummary] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await examApi.getAll();
        const now = new Date();
        const mapped = (response.data || []).map((exam) => {
          const startAt = exam.startAt ? new Date(exam.startAt) : null;
          const endAt = exam.endAt ? new Date(exam.endAt) : null;

          let status = 'upcoming';
          if (startAt && now < startAt) {
            status = 'upcoming';
          } else if (endAt && now > endAt) {
            status = 'completed';
          } else {
            status = 'ongoing';
          }

          const startTime = startAt || exam.createdAt || new Date().toISOString();

          return {
            id: exam._id,
            subject: exam.subject,
            title: exam.title,
            duration: exam.duration,
            questions: Array.isArray(exam.questions) ? exam.questions.length : 0,
            startTime,
            status,
            difficulty: 'Trung bình',
            rawStatus: exam.status,
            maxAttempts: exam.maxAttempts,
            description: exam.description,
          };
        });
        setExams(mapped);
      } catch (error) {
        console.error('Failed to fetch exams', error);
        setError('Không thể tải danh sách bài thi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      await fetchExams();
      try {
        const attemptsRes = await examApi.getMyAttempts();
        const summary = {};
        (attemptsRes.data || []).forEach((a) => {
          const examId = a.examId;
          if (!summary[examId]) {
            summary[examId] = {
              count: 0,
              bestScore: a.score,
              latestScore: a.score,
              latestSubmittedAt: a.submittedAt,
            };
          }
          summary[examId].count += 1;
          if (a.score > summary[examId].bestScore) {
            summary[examId].bestScore = a.score;
          }
          if (new Date(a.submittedAt) > new Date(summary[examId].latestSubmittedAt)) {
            summary[examId].latestScore = a.score;
            summary[examId].latestSubmittedAt = a.submittedAt;
          }
        });
        setAttemptSummary(summary);
      } catch {
        setAttemptSummary({});
      }
    };

    fetchData();
  }, []);

  const filteredExams = exams.filter((exam) => {
    if (exam.rawStatus !== 'Published') {
      return false;
    }

    const matchesFilter =
      filter === 'all' ||
      (filter === 'upcoming' && (exam.status === 'upcoming' || exam.status === 'ongoing')) ||
      (filter === 'completed' && (exam.status === 'completed' || exam.status === 'missed'));

    const matchesSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-slate-800 rounded-full animate-pulse" />
            <div className="h-10 w-64 bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-12 w-48 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-12 w-32 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 bg-white dark:bg-slate-900 rounded-4xl border border-gray-100 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">{error}</div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest border border-brand/20">
            <Calendar className="w-3 h-3" /> Lịch trình cá nhân
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Kỳ thi & Kiểm tra
          </h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">
            Khám phá và hoàn thành các bài đánh giá năng lực từ giáo viên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc môn học..."
              className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700">
            {['all', 'upcoming', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  filter === f
                    ? 'bg-white dark:bg-slate-700 text-brand shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-slate-300',
                )}
              >
                {f === 'all' ? 'Tất cả' : f === 'upcoming' ? 'Sắp tới' : 'Đã kết thúc'}
              </button>
            ))}
          </div>

          <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-xl transition-all',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-brand shadow-sm'
                  : 'text-gray-400',
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-xl transition-all',
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-brand shadow-sm'
                  : 'text-gray-400',
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {filteredExams.length === 0 ? (
        <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-4xl border-2 border-dashed border-gray-100 dark:border-slate-800">
          <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <BookOpen className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">
            Không tìm thấy bài thi nào
          </h3>
          <p className="text-gray-500 dark:text-slate-400 mt-2 font-medium max-w-sm mx-auto">
            {searchTerm
              ? `Không có kết quả nào cho "${searchTerm}"`
              : 'Hiện tại không có bài thi nào được đăng cho bạn.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-8 text-brand font-black text-sm uppercase tracking-widest hover:underline"
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8'
              : 'flex flex-col gap-4',
          )}
        >
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className={cn(
                'group bg-white dark:bg-slate-900 rounded-4xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/40 dark:shadow-none overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col',
                viewMode === 'list' && 'md:flex-row md:items-center',
              )}
            >
              {/* Header/Badge Area */}
              <div
                className={cn(
                  'p-8 pb-4 flex flex-col gap-6',
                  viewMode === 'list' && 'md:flex-1 md:pb-8',
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center text-brand font-black text-xl border border-brand/10 group-hover:bg-brand group-hover:text-white transition-all duration-500">
                    {(exam.subject || 'EX').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm',
                        exam.status === 'upcoming'
                          ? 'bg-blue-50 text-blue-600 border-blue-100'
                          : exam.status === 'ongoing'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse'
                            : exam.status === 'completed'
                              ? 'bg-gray-50 text-gray-500 border-gray-100'
                              : 'bg-rose-50 text-rose-600 border-rose-100',
                      )}
                    >
                      {exam.status === 'upcoming'
                        ? 'Sắp diễn ra'
                        : exam.status === 'ongoing'
                          ? 'Đang diễn ra'
                          : exam.status === 'completed'
                            ? 'Đã hoàn thành'
                            : 'Đã kết thúc'}
                    </span>
                    {attemptSummary[exam.id] && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-lg">
                        <Trophy className="w-2.5 h-2.5" /> Cao nhất:{' '}
                        {attemptSummary[exam.id].bestScore}đ
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-brand transition-colors line-clamp-2">
                    {exam.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 uppercase tracking-widest border border-gray-100 dark:border-slate-700">
                      {exam.subject}
                    </span>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 uppercase tracking-widest border border-indigo-100">
                      Độ khó: {exam.difficulty}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Clock className="w-4 h-4 text-brand" /> {exam.duration} phút
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <FileText className="w-4 h-4 text-brand" /> {exam.questions} câu hỏi
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div
                className={cn(
                  'mt-auto p-8 pt-0 flex flex-col gap-4',
                  viewMode === 'list' && 'md:mt-0 md:pt-8 md:w-72',
                )}
              >
                <div className="h-px w-full bg-gray-50 dark:bg-slate-800" />
                <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Hạn thi</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(exam.startTime).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/exam-focus/${exam.id}`)}
                  disabled={exam.status === 'upcoming'}
                  className={cn(
                    'w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg',
                    exam.status === 'upcoming'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-gray-900 dark:bg-slate-800 text-white hover:bg-brand hover:shadow-brand/30',
                  )}
                >
                  {exam.status === 'upcoming' ? 'Chưa mở' : 'Bắt đầu ngay'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
