import React, { useEffect, useState } from 'react';
import {
  Download,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Activity,
  Clock,
  ArrowLeft,
  Award,
  Users,
  FileText
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { examApi, categoryApi } from '../../services/api';

export function ExamResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exam, setExam] = useState(null);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        setError(
          'Vui lòng vào mục "Kỳ thi" và chọn "Xem thống kê" cho một đề cụ thể.',
        );
        return;
      }

      try {
        setLoading(true);
        setError('');
        const [statRes, catRes] = await Promise.all([
          examApi.getStats(id),
          categoryApi.getAll().catch(() => ({ data: [] })),
        ]);
        setExam(statRes.data.exam);
        setStats(statRes.data.stats);
        setCategories(catRes.data || []);
      } catch (e) {
        const message =
          e?.response?.data?.message ||
          'Không thể tải thống kê kỳ thi. Vui lòng thử lại sau.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const getCategoryName = (categoryId) => {
    if (!categoryId) {
      return 'Chưa gán';
    }
    const c = categories.find((item) => item._id === String(categoryId));
    return c ? c.name : 'Chưa gán';
  };

  const formatTime = (seconds) => {
    const s = Number.isFinite(seconds) ? seconds : 0;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m.toString().padStart(2, '0')}:${rem
      .toString()
      .padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 text-brand animate-spin" />
      </div>
    );
  }

  if (error || !exam || !stats) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error || 'Không tìm thấy thống kê cho kỳ thi này.'}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/teacher/exams')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách kỳ thi
        </button>
      </div>
    );
  }

  const easyQuestions = stats.perQuestion.filter(
    (q) => q.difficultyFlag === 'too_easy',
  );
  const hardQuestions = stats.perQuestion.filter(
    (q) => q.difficultyFlag === 'too_hard',
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-4xl bg-gradient-brand p-8 text-white shadow-premium">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <button 
                onClick={() => navigate('/teacher/exams')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md border border-white/20 transition-all group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest border border-white/20">
                <BarChart3 className="w-3 h-3" /> Phân tích kết quả
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight truncate">{exam.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-blue-100 font-medium text-sm">
              <span className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/10">{exam.subject}</span>
              <span className="w-1 h-1 rounded-full bg-blue-300" />
              <span>{exam.totalQuestions} câu hỏi</span>
              <span className="w-1 h-1 rounded-full bg-blue-300" />
              <span>{exam.duration} phút</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="group relative inline-flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
              <Download className="w-4 h-4" /> Xuất báo cáo
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="group relative inline-flex items-center gap-2 px-6 py-4 bg-white text-brand text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 overflow-hidden"
            >
              <RefreshCw className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Làm mới</span>
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Điểm trung bình', value: stats.averageScore, suffix: '/10', icon: Activity, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Tỷ lệ đạt (≥ 5)', value: stats.passRate, suffix: '%', icon: Award, color: 'text-accent-600', bg: 'bg-accent-50', sub: `${stats.passCount} đạt • ${stats.failCount} trượt` },
          { label: 'Số lượt nộp', value: stats.totalAttempts, suffix: '', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Thời gian TB', value: formatTime(stats.averageTimeSeconds), suffix: '', icon: Clock, color: 'text-warning-600', bg: 'bg-warning-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover transition-all group overflow-hidden relative">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", stat.bg, stat.color)}>
              <stat.icon className="w-7 h-7" />
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
              {stat.suffix && <span className="text-sm font-bold text-slate-400">{stat.suffix}</span>}
            </div>
            {stat.sub && <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">{stat.sub}</p>}
            <stat.icon className="absolute -bottom-6 -right-6 w-24 h-24 text-slate-100 dark:text-slate-800/50 -rotate-12 transition-transform group-hover:scale-125 duration-700" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Score Distribution Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-400">
               <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Phân phối điểm số</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {stats.scoreDistribution.map((bucket, i) => (
              <div key={bucket.range} className="relative p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 group hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-3xl" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{bucket.range}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{bucket.count}</span>
                  <span className="text-xs font-bold text-slate-400">bài</span>
                </div>
                {stats.totalAttempts > 0 && (
                  <div className="mt-4 w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-brand rounded-full transition-all duration-1000"
                      style={{ width: `${(bucket.count / stats.totalAttempts) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Insight Section: Easy/Hard Questions */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
               <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Câu hỏi cần lưu ý</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Câu quá dễ (Tỷ lệ đúng ≥ 90%)
              </p>
              <div className="space-y-3">
                {easyQuestions.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-center">Không có câu nào quá dễ</p>
                ) : easyQuestions.map((q) => (
                  <div key={q.questionId} className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest">Câu {q.index}</span>
                      <span className="text-[10px] font-black text-emerald-600 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-emerald-100">{Math.round((q.correctRate || 0) * 100)}% đúng</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{q.content}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Câu quá khó (Tỷ lệ đúng ≤ 20%)
              </p>
              <div className="space-y-3">
                {hardQuestions.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-center">Không có câu nào quá khó</p>
                ) : hardQuestions.map((q) => (
                  <div key={q.questionId} className="p-4 bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-rose-700 dark:text-rose-500 uppercase tracking-widest">Câu {q.index}</span>
                      <span className="text-[10px] font-black text-rose-600 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-rose-100">{Math.round((q.correctRate || 0) * 100)}% đúng</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{q.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm border border-slate-100 dark:border-slate-800">
               <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Chi tiết từng câu hỏi</h2>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase text-slate-400 font-black tracking-widest">
                <th className="px-8 py-5">Câu hỏi</th>
                <th className="px-8 py-5">Nội dung</th>
                <th className="px-8 py-5">Chủ đề</th>
                <th className="px-8 py-5">Độ khó</th>
                <th className="px-8 py-5 text-right">Hiệu suất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {stats.perQuestion.map((q) => (
                <tr key={q.questionId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-5">
                    <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">Câu {q.index}</span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-1 group-hover:text-brand-600 transition-colors">{q.content}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">{getCategoryName(q.category)}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      q.difficulty === 'Dễ' || q.difficulty === 'Nhận biết' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      q.difficulty === 'Khó' || q.difficulty === 'Vận dụng' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      'bg-warning-50 text-warning-700 border-warning-100'
                    )}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={cn(
                        "text-lg font-black tracking-tighter",
                        q.difficultyFlag === 'too_easy' ? 'text-emerald-500' :
                        q.difficultyFlag === 'too_hard' ? 'text-rose-500' :
                        'text-slate-900 dark:text-white'
                      )}>
                        {Math.round((q.correctRate || 0) * 100)}%
                      </span>
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            q.difficultyFlag === 'too_easy' ? 'bg-emerald-500' :
                            q.difficultyFlag === 'too_hard' ? 'bg-rose-500' :
                            'bg-brand-500'
                          )}
                          style={{ width: `${(q.correctRate || 0) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
