import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  PieChart as PieChartIcon,
  Activity,
  Award,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { adminApi } from '../../services/api';
import { cn } from '../../lib/utils';

export function Reports() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getReports({ range: timeRange });
        const backendData = res.data;

        // Map backend data to frontend structure
        const mappedData = {
          stats: {
            totalUsers: backendData.users.total,
            totalAttempts: backendData.attempts.total,
            totalQuestions: backendData.questions.total,
          },
          registrationData: (backendData.users.last30Days || []).map(item => ({
            date: item._id,
            count: item.count
          })),
          examActivity: (backendData.attempts.byDay || []).map(item => ({
            date: item.date,
            attempts: item.count
          })),
          subjectDistribution: Object.entries(backendData.attempts.bySubject || {}).map(([name, stat]) => ({
            name,
            value: Math.round((stat.count / backendData.attempts.total) * 100) || 0
          }))
        };

        setData(mappedData);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Đang tổng hợp báo cáo hệ thống...</p>
      </div>
    );
  }

  const { stats, registrationData, examActivity, subjectDistribution } = data || {};

  const COLORS = ['#0274cb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const metricCards = [
    { 
      label: 'Tổng người dùng', 
      value: stats?.totalUsers || 0, 
      change: '+12.5%', 
      isUp: true, 
      icon: Users, 
      color: 'text-brand-600', 
      bg: 'bg-brand-50' 
    },
    { 
      label: 'Lượt thi mới', 
      value: stats?.totalAttempts || 0, 
      change: '+8.2%', 
      isUp: true, 
      icon: Activity, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
    { 
      label: 'Câu hỏi hệ thống', 
      value: stats?.totalQuestions || 0, 
      change: '+24.1%', 
      isUp: true, 
      icon: BookOpen, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Tỷ lệ hoàn thành', 
      value: '94.2%', 
      change: '-1.5%', 
      isUp: false, 
      icon: Award, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest border border-brand/20">
             <BarChart3 className="w-3 h-3" /> Trung tâm dữ liệu
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Báo cáo & Thống kê</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Phân tích toàn diện hiệu suất và sự tăng trưởng của hệ thống EduTest.</p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 px-4 py-2 outline-none cursor-pointer"
          >
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="90d">90 ngày qua</option>
          </select>
          <button className="p-2 bg-brand text-white rounded-xl shadow-lg shadow-brand/20 hover:scale-105 transition-all">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover transition-all group overflow-hidden relative">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm", metric.bg, metric.color)}>
              <metric.icon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{metric.label}</p>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{metric.value}</h3>
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg",
                  metric.isUp ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" : "text-rose-600 bg-rose-50 dark:bg-rose-500/10"
                )}>
                  {metric.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {metric.change}
                </div>
              </div>
            </div>
            <metric.icon className="absolute -bottom-6 -right-6 w-24 h-24 text-slate-100 dark:text-slate-800/50 -rotate-12 transition-transform group-hover:scale-125 duration-700" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Registration Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-10 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Người dùng mới</h2>
              <p className="text-sm font-medium text-slate-400 mt-1">Số lượng tài khoản đăng ký theo thời gian</p>
            </div>
            <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center text-brand-600">
               <Users className="w-6 h-6" />
            </div>
          </div>
          
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationData}>
                <defs>
                  <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0274cb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0274cb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '16px'}}
                  itemStyle={{fontWeight: 800, fontSize: '12px'}}
                />
                <Area type="monotone" dataKey="count" stroke="#0274cb" strokeWidth={4} fillOpacity={1} fill="url(#colorReg)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-10 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium group">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cấu trúc ngân hàng</h2>
              <p className="text-sm font-medium text-slate-400 mt-1">Phân bổ câu hỏi theo môn</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
               <PieChartIcon className="w-6 h-6" />
            </div>
          </div>
          
          <div className="h-[300px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {subjectDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4">
            {subjectDistribution?.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center justify-between group/item cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover/item:text-brand transition-colors">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 rounded-[24px] flex items-center justify-center text-purple-600">
                <Activity className="w-7 h-7" />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Hoạt động thi cử</h2>
               <p className="text-sm font-medium text-slate-400 mt-1">Thống kê số lượt làm bài theo ngày</p>
             </div>
          </div>
          <div className="flex items-center gap-6 p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Lượt làm bài</span>
             </div>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={examActivity}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} />
              <Tooltip 
                cursor={{fill: '#f8fafc', radius: 12}}
                contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '16px'}}
                itemStyle={{fontWeight: 800, fontSize: '12px'}}
              />
              <Bar dataKey="attempts" fill="#8b5cf6" radius={[12, 12, 12, 12]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
