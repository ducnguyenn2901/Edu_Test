import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, Clock, MoreHorizontal, Loader2, Users, FileText, School, TrendingUp, Calendar, ArrowRight, Plus } from 'lucide-react';
import { teacherApi } from '../../services/api';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useTheme } from '../../context/ThemeContext.jsx';

export function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await teacherApi.getDashboardStats();
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-brand animate-spin" />
      </div>
    );
  }

  const { stats, recentQuestions, monthlyStats } = data || { stats: {}, recentQuestions: [], monthlyStats: [] };

  const statCards = [
    { label: 'Tổng câu hỏi', value: stats.totalQuestions || 0, icon: BookOpen, gradient: 'from-brand-600 to-indigo-500', shadow: 'shadow-brand-500/20' },
    { label: 'Đã phê duyệt', value: stats.approvedQuestions || 0, icon: CheckCircle, gradient: 'from-emerald-500 to-teal-400', shadow: 'shadow-emerald-500/20' },
    { label: 'Tổng kỳ thi', value: stats.totalExams || 0, icon: FileText, gradient: 'from-purple-500 to-pink-400', shadow: 'shadow-purple-500/20' },
    { label: 'Lớp học', value: stats.totalClassrooms || 0, icon: School, gradient: 'from-amber-500 to-orange-400', shadow: 'shadow-amber-500/20' },
    { label: 'Học sinh', value: stats.totalStudents || 0, icon: Users, gradient: 'from-indigo-500 to-blue-400', shadow: 'shadow-indigo-500/20' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Xin chào giáo viên! <span className="inline-block animate-bounce origin-bottom">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Chào mừng bạn quay trở lại. Hãy xem các hoạt động mới nhất hôm nay.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none transition-all duration-300 hover:scale-105">
          <div className="bg-brand/10 dark:bg-brand/20 p-3 rounded-xl text-brand">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Hôm nay</p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {statCards.map((stat, idx) => (
          <div key={idx} className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/10 dark:shadow-none hover:shadow-2xl hover:shadow-brand/5 dark:hover:border-brand/20 transition-all duration-500 hover:-translate-y-1.5 overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-gradient-to-br ${stat.gradient} opacity-[0.03] group-hover:opacity-[0.08] rounded-full transition-all duration-700 group-hover:scale-150`} />
            
            <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg ${stat.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
              <stat.icon className="w-7 h-7" />
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">{stat.label}</p>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
            </div>

            <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
               <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/10 dark:shadow-none p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Hoạt động hệ thống</h2>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">Thống kê dữ liệu trong 6 tháng vừa qua</p>
            </div>
            <div className="flex items-center gap-6 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/20" />
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Câu hỏi</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-lg shadow-purple-500/20" />
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kỳ thi</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a56db" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1a56db" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} 
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderRadius: '24px',
                    border: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    padding: '16px'
                  }}
                  itemStyle={{fontWeight: 800, fontSize: '12px'}}
                  cursor={{stroke: '#1a56db', strokeWidth: 2, strokeDasharray: '5 5'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="questions" 
                  stroke="#1a56db" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorQ)" 
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="exams" 
                  stroke="#a855f7" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorE)" 
                  animationDuration={2000}
                  animationDelay={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-gradient-brand rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-2xl shadow-brand/20 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-abstract-pattern opacity-10" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-1000" />
          
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tight leading-tight">Thao tác<br/>nhanh</h2>
            <p className="text-brand-50/80 mt-3 font-medium text-sm leading-relaxed">Truy cập nhanh các chức năng quan trọng nhất để tối ưu thời gian giảng dạy.</p>
          </div>

          <div className="space-y-4 mt-10 relative z-10">
            <Link to="/teacher/questions/new" className="flex items-center justify-between p-5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group/btn backdrop-blur-xl border border-white/10 hover:border-white/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand shadow-lg group-hover/btn:scale-110 group-hover/btn:rotate-6 transition-all">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-sm tracking-wide">Tạo câu hỏi</p>
                  <p className="text-[10px] text-brand-50/60 uppercase tracking-widest font-black mt-0.5">Mới</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </Link>
            <Link to="/teacher/exams/new" className="flex items-center justify-between p-5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group/btn backdrop-blur-xl border border-white/10 hover:border-white/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-lg group-hover/btn:scale-110 group-hover/btn:rotate-6 transition-all">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-sm tracking-wide">Tạo kỳ thi</p>
                  <p className="text-[10px] text-brand-50/60 uppercase tracking-widest font-black mt-0.5">Mới</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Questions */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/10 dark:shadow-none overflow-hidden group">
          <div className="px-10 py-8 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Câu hỏi gần đây</h2>
              <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mt-1">Các câu hỏi bạn vừa chỉnh sửa hoặc tạo mới</p>
            </div>
            <Link to="/teacher/questions" className="flex items-center gap-2 text-xs font-black text-brand uppercase tracking-widest hover:bg-brand/5 px-5 py-3 rounded-2xl transition-all border border-transparent hover:border-brand/10">
              Xem tất cả
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
            {recentQuestions.length > 0 ? recentQuestions.map((q) => (
              <div key={q._id} className="px-10 py-6 flex items-start gap-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all group/item">
                <div className="w-14 h-14 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-400 dark:text-slate-500 flex-shrink-0 group-hover/item:bg-brand/10 group-hover/item:text-brand transition-all duration-500 group-hover/item:rotate-3">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-800 dark:text-slate-200 line-clamp-1 leading-snug group-hover/item:text-brand transition-colors">{q.content}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-brand/5 dark:bg-brand/10 text-brand px-3 py-1.5 rounded-lg border border-brand/10">{q.subject}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-lg">{q.grade}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                      q.difficulty === 'Dễ' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                      q.difficulty === 'Trung bình' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                      'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                    }`}>{q.difficulty}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 dark:text-slate-600 ml-auto uppercase tracking-tighter">
                      <Clock className="w-3 h-3" />
                      {new Date(q.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                <button className="p-3 text-gray-300 dark:text-slate-700 hover:text-gray-600 dark:hover:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            )) : (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-gray-300 dark:text-slate-700 mx-auto mb-4">
                  <FileText className="w-10 h-10" />
                </div>
                <p className="text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">Chưa có câu hỏi nào</p>
                <Link to="/teacher/questions/new" className="inline-block mt-4 text-brand font-black text-xs uppercase tracking-widest hover:underline underline-offset-8">Tạo câu hỏi đầu tiên</Link>
              </div>
            )}
          </div>
        </div>

        {/* System Messages/Tips */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/10 dark:shadow-none p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
               <TrendingUp className="w-32 h-32 text-brand" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Mẹo tăng hiệu suất</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-medium">Bạn có thể nhập câu hỏi từ tệp Excel hoặc Word để tiết kiệm thời gian hơn so với việc nhập thủ công từng câu.</p>
              <button className="mt-6 text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-2 group/tip">
                Tìm hiểu thêm <ArrowRight className="w-4 h-4 group-hover/tip:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <School className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black tracking-tight mb-4">Quản lý lớp học thông minh</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium mb-6">EduTest Pro cho phép bạn tạo mã QR để học sinh tham gia lớp học một cách nhanh chóng và an toàn.</p>
              <Link to="/teacher/classrooms" className="inline-flex items-center gap-3 px-6 py-3 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-105 transition-all">
                Đến lớp học
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
