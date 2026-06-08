import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Users,
  Award,
  BookOpen,
  Lock,
  Filter,
  Download,
  MoreHorizontal,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext.jsx';

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    grade: '',
    className: '',
    school: '',
    department: '',
  });
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await adminApi.getUsers();
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
        setError('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const totalUsers = users.length;
  const totalTeachers = users.filter((u) => u.role?.toLowerCase() === 'teacher').length;
  const totalStudents = users.filter((u) => u.role?.toLowerCase() === 'student').length;
  const totalLocked = users.filter((u) => u.status === 'Locked').length;
  const totalPending = users.filter((u) => u.status === 'Pending').length;

  const getRoleLabel = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Quản trị viên';
      case 'teacher':
        return 'Giáo viên';
      case 'mod':
        return 'Điều phối';
      case 'student':
        return 'Học sinh';
      default:
        return 'Người dùng';
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'purple';
      case 'teacher':
        return 'blue';
      case 'mod':
        return 'indigo';
      default:
        return 'orange';
    }
  };

  const handleOpenCreate = () => {
    setCreateForm({
      name: '',
      email: '',
      password: '',
      role: 'teacher',
      grade: '',
      className: '',
      school: '',
      department: '',
    });
    setCreateError('');
    setIsCreateOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateError('Vui lòng nhập đầy đủ họ tên, email và mật khẩu');
      return;
    }
    try {
      setIsCreating(true);
      setCreateError('');
      const response = await adminApi.createUser({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        grade: createForm.grade,
        className: createForm.className,
        school: createForm.school,
        department: createForm.department,
      });
      const newUser = response.data;
      setUsers((prev) => [
        {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          roleColor: getRoleColor(newUser.role),
          joinedDate: new Date().toISOString(),
          status: newUser.status || 'active',
          grade: newUser.grade || '',
          className: newUser.className || '',
          school: newUser.school || '',
          department: newUser.department || '',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            newUser.name || newUser.email,
          )}&background=random`,
        },
        ...prev,
      ]);
      setIsCreateOpen(false);
      showToast({
        type: 'success',
        title: 'Tạo tài khoản',
        message: 'Tạo tài khoản người dùng mới thành công.',
      });
    } catch (err) {
      console.error('Failed to create user', err);
      const message =
        err?.response?.data?.message || 'Không thể tạo tài khoản mới. Vui lòng thử lại.';
      setCreateError(message);
      showToast({
        type: 'error',
        title: 'Tạo tài khoản thất bại',
        message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Users className="w-8 h-8 text-blue-600 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">{error}</div>
    );
  }

  const handleChangeRole = async (user) => {
    const currentRole = user.role?.toLowerCase() || 'student';

    const newRole = window.prompt(
      'Nhập role mới cho người dùng (student, teacher, admin, mod):',
      currentRole,
    );

    if (!newRole || !['student', 'teacher', 'admin', 'mod'].includes(newRole.toLowerCase())) {
      return;
    }

    const normalizedRole = newRole.toLowerCase();

    try {
      setActionLoadingId(user.id);
      await adminApi.updateUser(user.id, { role: normalizedRole });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, role: normalizedRole, roleColor: getRoleColor(normalizedRole) }
            : u,
        ),
      );
      showToast({
        type: 'success',
        title: 'Cập nhật role',
        message: 'Cập nhật quyền truy cập thành công.',
      });
    } catch (err) {
      console.error('Failed to update user role', err);
      showToast({
        type: 'error',
        title: 'Cập nhật role thất bại',
        message: 'Không thể cập nhật role. Vui lòng thử lại.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleLock = async (user) => {
    try {
      setActionLoadingId(user.id);
      const response = await adminApi.toggleLockUser(user.id);
      const nextStatus = response.data.status === 'locked' ? 'Locked' : 'Active';

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                status: nextStatus,
              }
            : u,
        ),
      );
      showToast({
        type: 'success',
        title: 'Cập nhật trạng thái',
        message: nextStatus === 'Locked' ? 'Tài khoản đã được khóa.' : 'Tài khoản đã được mở khóa.',
      });
    } catch (err) {
      console.error('Failed to toggle user lock', err);
      showToast({
        type: 'error',
        title: 'Cập nhật trạng thái thất bại',
        message: 'Không thể cập nhật trạng thái tài khoản. Vui lòng thử lại.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa người dùng "${user.name || user.email}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(user.id);
      await adminApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast({
        type: 'success',
        title: 'Xóa người dùng',
        message: 'Đã xóa người dùng thành công.',
      });
    } catch (err) {
      console.error('Failed to delete user', err);
      showToast({
        type: 'error',
        title: 'Xóa người dùng thất bại',
        message: 'Không thể xóa người dùng. Vui lòng thử lại.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveUser = async (user) => {
    try {
      setActionLoadingId(user.id);
      await adminApi.updateUser(user.id, { status: 'active' });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                status: 'Active',
              }
            : u,
        ),
      );
      showToast({
        type: 'success',
        title: 'Duyệt tài khoản',
        message: 'Tài khoản giáo viên đã được duyệt thành công.',
      });
    } catch (err) {
      console.error('Failed to approve user', err);
      showToast({
        type: 'error',
        title: 'Duyệt thất bại',
        message: 'Không thể duyệt tài khoản. Vui lòng thử lại.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = search.trim().toLowerCase();
    if (term) {
      const haystack = `${user.name || ''} ${user.email || ''} ${
        user.school || ''
      } ${user.className || ''} ${user.grade || ''}`.toLowerCase();
      if (!haystack.includes(term)) {
        return false;
      }
    }
    if (filterSchool && (user.school || '').toLowerCase() !== filterSchool.toLowerCase()) {
      return false;
    }
    if (filterGrade && (user.grade || '').toLowerCase() !== filterGrade.toLowerCase()) {
      return false;
    }
    if (filterClass && (user.className || '').toLowerCase() !== filterClass.toLowerCase()) {
      return false;
    }
    return true;
  });

  const distinctSchools = Array.from(
    new Set(users.map((u) => (u.school || '').trim()).filter(Boolean)),
  );
  const distinctGrades = Array.from(
    new Set(users.map((u) => (u.grade || '').trim()).filter(Boolean)),
  );
  const distinctClasses = Array.from(
    new Set(users.map((u) => (u.className || '').trim()).filter(Boolean)),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-4xl bg-gradient-brand p-8 text-white shadow-premium">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest border border-white/20 mb-4">
              <Lock className="w-3 h-3" /> Hệ thống quản trị
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Quản lý người dùng</h1>
            <p className="mt-2 text-blue-100 max-w-xl font-medium">
              Kiểm soát quyền truy cập, quản lý tài khoản giáo viên và học sinh trên toàn hệ thống.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-200 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm thông minh..."
                className="pl-12 pr-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-sm text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 w-full sm:w-80 transition-all"
              />
            </div>
            <button
              onClick={handleOpenCreate}
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-brand text-sm font-black rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-widest overflow-hidden"
            >
              <div className="absolute inset-0 bg-brand/5 group-hover:bg-brand/10 transition-colors" />
              <Plus className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Thêm người dùng</span>
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[
          {
            label: 'Tổng số',
            value: totalUsers,
            icon: Users,
            color: 'text-brand-600',
            bg: 'bg-brand-50',
          },
          {
            label: 'Giáo viên',
            value: totalTeachers,
            icon: Award,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            label: 'Học sinh',
            value: totalStudents,
            icon: BookOpen,
            color: 'text-warning-600',
            bg: 'bg-warning-50',
          },
          {
            label: 'Bị khóa',
            value: totalLocked,
            icon: Lock,
            color: 'text-danger-600',
            bg: 'bg-danger-50',
          },
          {
            label: 'Chờ duyệt',
            value: totalPending,
            icon: Users,
            color: 'text-accent-600',
            bg: 'bg-accent-50',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover transition-all group overflow-hidden relative"
          >
            <div
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6',
                stat.bg,
                stat.color,
              )}
            >
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <stat.icon className="absolute -bottom-4 -right-4 w-20 h-20 text-slate-100 dark:text-slate-800/50 -rotate-12 transition-transform group-hover:scale-125 duration-700" />
          </div>
        ))}
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
        {/* Table Filters */}
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-400">
              <Filter className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Bộ lọc nhanh:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                {
                  value: filterSchool,
                  onChange: setFilterSchool,
                  options: distinctSchools,
                  label: 'Tất cả trường',
                },
                {
                  value: filterGrade,
                  onChange: setFilterGrade,
                  options: distinctGrades,
                  label: 'Tất cả khối',
                },
                {
                  value: filterClass,
                  onChange: setFilterClass,
                  options: distinctClasses,
                  label: 'Tất cả lớp',
                },
              ].map((filter, idx) => (
                <select
                  key={idx}
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Hiển thị <span className="text-brand-600">{filteredUsers.length}</span> người dùng
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase text-slate-400 font-black tracking-widest">
                <th className="px-8 py-5">Người dùng</th>
                <th className="px-8 py-5">Vai trò</th>
                <th className="px-8 py-5">Liên hệ</th>
                <th className="px-8 py-5">Lớp / Khối</th>
                <th className="px-8 py-5">Trường</th>
                <th className="px-8 py-5">Trạng thái</th>
                <th className="px-8 py-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm"
                        />
                        <div
                          className={cn(
                            'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm',
                            user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400',
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                          {user.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          ID: {user.id.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm',
                        user.role?.toLowerCase() === 'admin'
                          ? 'bg-purple-500 text-white'
                          : user.role?.toLowerCase() === 'teacher'
                            ? 'bg-brand-500 text-white'
                            : user.role?.toLowerCase() === 'mod'
                              ? 'bg-indigo-500 text-white'
                              : 'bg-warning-500 text-white',
                      )}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {user.email}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-widest">
                      {user.joinedDate
                        ? new Date(user.joinedDate).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {user.className || '—'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {user.grade || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                        {user.school || '—'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px]">
                        {user.department || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm',
                        user.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : user.status === 'Pending'
                            ? 'bg-warning-50 text-warning-700 border-warning-100 animate-pulse'
                            : 'bg-slate-100 text-slate-600 border-slate-200',
                      )}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      {user.status === 'Pending' && (
                        <button
                          disabled={actionLoadingId === user.id}
                          onClick={() => handleApproveUser(user)}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                        >
                          Duyệt
                        </button>
                      )}
                      <button
                        disabled={actionLoadingId === user.id}
                        onClick={() => handleChangeRole(user)}
                        className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-all"
                        title="Thay đổi quyền"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        disabled={actionLoadingId === user.id}
                        onClick={() => handleToggleLock(user)}
                        className={cn(
                          'p-2.5 rounded-xl transition-all',
                          user.status === 'Locked'
                            ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            : 'text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-900/20',
                        )}
                        title={user.status === 'Locked' ? 'Mở khóa' : 'Khóa tài khoản'}
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                      <button
                        disabled={actionLoadingId === user.id}
                        onClick={() => handleDeleteUser(user)}
                        className="p-2.5 text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-xl transition-all"
                        title="Xóa người dùng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modern Pagination */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Trang 1 trên 257
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-50">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1">
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-500 text-white text-xs font-black shadow-lg shadow-brand-500/30">
                1
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all">
                2
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all">
                3
              </button>
            </div>
            <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsCreateOpen(false)}
          />
          <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-2xl max-w-lg w-full relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-brand p-8 text-white">
              <h2 className="text-2xl font-black tracking-tight">Thêm người dùng mới</h2>
              <p className="text-blue-100 text-sm mt-1 font-medium">
                Tạo tài khoản giáo viên hoặc học sinh
              </p>
            </div>

            <form className="p-8 space-y-6" onSubmit={handleCreateUser}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Họ tên
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Vai trò
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white appearance-none"
                  >
                    <option value="teacher">Giáo viên</option>
                    <option value="student">Học sinh</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Email đăng nhập
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white"
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Mật khẩu tạm
                </label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white"
                  placeholder="Ít nhất 6 ký tự"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Khối lớp
                  </label>
                  <input
                    type="text"
                    value={createForm.grade}
                    onChange={(e) => setCreateForm({ ...createForm, grade: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white"
                    placeholder="VD: 12"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Tên lớp
                  </label>
                  <input
                    type="text"
                    value={createForm.className}
                    onChange={(e) => setCreateForm({ ...createForm, className: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white"
                    placeholder="VD: 12A1"
                  />
                </div>
              </div>

              {createError && (
                <div className="p-4 bg-danger-50 border border-danger-100 rounded-2xl text-danger-600 text-xs font-bold animate-shake">
                  {createError}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-4 bg-gradient-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 disabled:translate-y-0"
                >
                  {isCreating ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
