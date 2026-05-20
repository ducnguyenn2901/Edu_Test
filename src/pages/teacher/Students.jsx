import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, GraduationCap, School, Check, X, MoreHorizontal, UserCheck, UserX, Mail, Hash, ShieldCheck, ChevronRight } from 'lucide-react';
import { teacherApi, classroomApi } from '../../services/api';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function Students() {
  const [students, setStudents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'pending'
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchStudents = async () => {
    try {
      const teacherId = user?._id || user?.id;
      if (!teacherId) return;
      setLoading(true);
      setError('');
      
      // Fetch active students (via teacher's classes)
      const res = await teacherApi.getStudentsByTeacher(teacherId, {
        grade: gradeFilter || undefined,
        className: classFilter || undefined,
        school: schoolFilter || undefined,
      });
      setStudents(res.data || []);

      // Fetch pending requests for all teacher's classrooms
      const classroomsRes = await classroomApi.getAll({ teacherId: teacherId });
      const classrooms = classroomsRes.data || [];
      const allPending = [];
      
      classrooms.forEach(cls => {
        if (cls.pendingStudents && cls.pendingStudents.length > 0) {
          cls.pendingStudents.forEach(student => {
            allPending.push({
              ...student,
              classroomId: cls._id,
              classroomName: cls.name
            });
          });
        }
      });
      setPendingRequests(allPending);

    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Không thể tải danh sách học sinh. Vui lòng thử lại sau.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user?._id, user?.id, gradeFilter, classFilter, schoolFilter]);

  const handleApprove = async (classroomId, studentId, action) => {
    try {
      await classroomApi.approve(classroomId, studentId, action);
      showToast({
        type: 'success',
        title: 'Thành công',
        message: action === 'approve' ? 'Đã duyệt học sinh vào lớp' : 'Đã từ chối yêu cầu'
      });
      fetchStudents();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể thực hiện thao tác'
      });
    }
  };

  const grades = Array.from(
    new Set(students.map((s) => s.grade).filter(Boolean)),
  );
  const classes = Array.from(
    new Set(students.map((s) => s.className).filter(Boolean)),
  );
  const schools = Array.from(
    new Set(students.map((s) => s.school).filter(Boolean)),
  );

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      s.name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term);
    const matchesGrade = !gradeFilter || s.grade === gradeFilter;
    const matchesClass = !classFilter || s.className === classFilter;
    const matchesSchool = !schoolFilter || s.school === schoolFilter;
    return matchesSearch && matchesGrade && matchesClass && matchesSchool;
  });

  const totalStudents = students.length;
  const totalLocked = students.filter((s) => s.status?.toLowerCase() === 'locked').length;
  const gradeCounts = grades.map((g) => ({
    grade: g,
    count: students.filter((s) => s.grade === g).length,
  }));

  if (loading && students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách học sinh...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden rounded-4xl bg-gradient-brand p-8 text-white shadow-premium">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest border border-white/20 mb-4">
               <Users className="w-3 h-3" /> Cộng đồng học tập
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Học sinh của tôi</h1>
            <p className="mt-2 text-blue-100 max-w-xl font-medium">
              Quản lý danh sách học sinh, phê duyệt yêu cầu tham gia và theo dõi tiến độ học tập cá nhân.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="text-center px-4 border-r border-white/20">
              <p className="text-2xl font-black">{totalStudents}</p>
              <p className="text-[10px] text-blue-100 uppercase font-bold tracking-widest">Học sinh</p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl font-black text-warning-400">{pendingRequests.length}</p>
              <p className="text-[10px] text-blue-100 uppercase font-bold tracking-widest">Chờ duyệt</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover transition-all group overflow-hidden relative">
          <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-6 group-hover:rotate-6 transition-transform">
             <Users className="w-7 h-7" />
          </div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Tổng học sinh</p>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{totalStudents}</h3>
          <Users className="absolute -bottom-6 -right-6 w-24 h-24 text-slate-100 dark:text-slate-800/50 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover transition-all group overflow-hidden relative">
          <div className="w-14 h-14 bg-danger-50 dark:bg-danger-900/20 rounded-2xl flex items-center justify-center text-danger-600 dark:text-danger-400 mb-6 group-hover:rotate-6 transition-transform">
             <ShieldCheck className="w-7 h-7" />
          </div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Tài khoản khóa</p>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{totalLocked}</h3>
          <ShieldCheck className="absolute -bottom-6 -right-6 w-24 h-24 text-slate-100 dark:text-slate-800/50 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover transition-all group overflow-hidden relative">
          <div className="w-14 h-14 bg-accent-50 dark:bg-accent-900/20 rounded-2xl flex items-center justify-center text-accent-600 dark:text-accent-400 mb-6 group-hover:rotate-6 transition-transform">
             <GraduationCap className="w-7 h-7" />
          </div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Cơ cấu khối lớp</p>
          <div className="flex flex-wrap gap-2 mt-2">
             {gradeCounts.map(g => (
               <span key={g.grade} className="px-3 py-1 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 rounded-xl text-[10px] font-black border border-accent-100 dark:border-accent-800 uppercase tracking-tight">
                  {g.grade}: {g.count}
               </span>
             ))}
             {gradeCounts.length === 0 && <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Trống</span>}
          </div>
          <GraduationCap className="absolute -bottom-6 -right-6 w-24 h-24 text-slate-100 dark:text-slate-800/50 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
        {/* Modern Tabs */}
        <div className="flex items-center px-8 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              "px-8 py-6 text-[11px] font-black transition-all relative uppercase tracking-widest",
              activeTab === 'active' ? "text-brand-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Học sinh chính thức
            {activeTab === 'active' && <div className="absolute bottom-0 left-8 right-8 h-1 bg-brand-500 rounded-t-full shadow-lg shadow-brand-500/40" />}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              "px-8 py-6 text-[11px] font-black transition-all relative uppercase tracking-widest flex items-center gap-3",
              activeTab === 'pending' ? "text-brand-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Yêu cầu chờ duyệt
            {pendingRequests.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-warning-500 text-white text-[10px] font-black animate-pulse shadow-lg shadow-warning-500/20">
                {pendingRequests.length}
              </span>
            )}
            {activeTab === 'pending' && <div className="absolute bottom-0 left-8 right-8 h-1 bg-brand-500 rounded-t-full shadow-lg shadow-brand-500/40" />}
          </button>
        </div>

        {activeTab === 'active' ? (
          <>
            {/* Filters Section */}
            <div className="p-8 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 flex flex-col xl:flex-row gap-6">
              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm theo tên, email, trường..."
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all dark:text-white"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 text-slate-400 mr-2">
                  <Filter className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Bộ lọc thông minh:</span>
                </div>
                
                {[
                  { value: gradeFilter, onChange: setGradeFilter, options: grades, label: 'Tất cả khối' },
                  { value: classFilter, onChange: setClassFilter, options: classes, label: 'Tất cả lớp' },
                  { value: schoolFilter, onChange: setSchoolFilter, options: schools, label: 'Tất cả trường' },
                ].map((filter, i) => (
                  <select
                    key={i}
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all appearance-none cursor-pointer hover:bg-white dark:hover:bg-slate-700"
                  >
                    <option value="">{filter.label}</option>
                    {filter.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ))}
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase text-slate-400 font-black tracking-widest">
                    <th className="px-8 py-5">Học sinh</th>
                    <th className="px-8 py-5">Phân loại</th>
                    <th className="px-8 py-5">Trường học</th>
                    <th className="px-8 py-5">Trạng thái</th>
                    <th className="px-8 py-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center">
                         <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-slate-200" />
                         </div>
                         <h3 className="text-xl font-black text-slate-900 dark:text-white">Không có kết quả</h3>
                         <p className="text-slate-500 font-medium mt-2">Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn</p>
                      </td>
                    </tr>
                  ) : filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-14 h-14 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className={cn(
                              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm",
                              student.status?.toLowerCase() === 'locked' ? "bg-slate-400" : "bg-emerald-500"
                            )} />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                              {student.name || 'Học sinh'}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tight mt-1">
                               <Mail className="w-3.5 h-3.5" /> {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                           <span className="px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-[10px] font-black rounded-lg border border-brand-100 dark:border-brand-800 uppercase tracking-wider">
                             {student.grade || 'K/X'}
                           </span>
                           <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                             {student.className || 'Chưa lớp'}
                           </span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <School className="w-4 h-4 text-slate-300" />
                            <span className="line-clamp-1">{student.school || 'Chưa cập nhật'}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <span className={cn(
                           "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                           student.status?.toLowerCase() === 'locked'
                             ? "bg-slate-50 text-slate-500 border-slate-100"
                             : "bg-emerald-50 text-emerald-600 border-emerald-100"
                         )}>
                           {student.status?.toLowerCase() === 'locked' ? 'Bị khóa' : 'Hoạt động'}
                         </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                            <button className="p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-xl hover:bg-brand-600 hover:text-white transition-all shadow-sm">
                               <ChevronRight className="w-5 h-5" />
                            </button>
                            <button className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-all shadow-sm">
                               <MoreHorizontal className="w-5 h-5" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase text-slate-400 font-black tracking-widest">
                    <th className="px-8 py-5">Học sinh</th>
                    <th className="px-8 py-5">Lớp yêu cầu</th>
                    <th className="px-8 py-5">Trường học</th>
                    <th className="px-8 py-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center">
                       <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
                          <UserCheck className="w-12 h-12 text-slate-200" />
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 dark:text-white">Tuyệt vời!</h3>
                       <p className="text-slate-500 font-medium mt-2">Không có yêu cầu nào đang chờ xử lý.</p>
                    </td>
                  </tr>
                ) : pendingRequests.map((req) => (
                  <tr key={`${req.classroomId}-${req._id || req.id}`} className="hover:bg-warning-50/30 dark:hover:bg-warning-900/10 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-warning-50 dark:bg-warning-900/20 rounded-2xl flex items-center justify-center text-warning-600 font-black text-xl border-2 border-warning-100 dark:border-warning-900/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
                          {(req.name || 'H').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white group-hover:text-warning-600 transition-colors">{req.name || 'Học sinh'}</p>
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                             <Mail className="w-3.5 h-3.5" /> {req.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="space-y-1.5">
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{req.classroomName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.grade || '-'} • {req.className || '-'}</p>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                         <School className="w-4 h-4 text-slate-300" />
                         {req.school || '-'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => handleApprove(req.classroomId, req._id || req.id, 'reject')}
                          className="flex items-center gap-3 px-6 py-3 bg-danger-50 text-danger-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-danger-600 hover:text-white transition-all shadow-sm"
                        >
                          <UserX className="w-4 h-4" /> Từ chối
                        </button>
                        <button
                          onClick={() => handleApprove(req.classroomId, req._id || req.id, 'approve')}
                          className="flex items-center gap-3 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
                        >
                          <UserCheck className="w-4 h-4" /> Phê duyệt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
