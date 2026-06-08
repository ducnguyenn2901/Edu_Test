import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, GraduationCap, School, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../services/api.js';

const roleRedirect = {
  admin: '/admin',
  student: '/student',
  teacher: '/teacher',
  mod: '/teacher',
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user, isAuthenticated, loading: authLoading } = useAuth();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [grade, setGrade] = useState('');
  const [className, setClassName] = useState('');
  const [school, setSchool] = useState('');
  const [department, setDepartment] = useState('');

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      navigate(roleRedirect[user.role] || '/');
    }
  }, [authLoading, isAuthenticated, navigate, user]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setSubjectsLoading(true);
        const response = await authApi.getSubjects();
        setSubjects(response.data || []);
      } catch (err) {
        console.error('Lỗi tải danh sách môn học:', err);
        setSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    const oauth = searchParams.get('oauth');
    if (!oauth) return;

    if (oauth === 'success') {
      setSuccess('Đăng nhập Google thành công');
      setError('');
      return;
    }

    if (oauth === 'pending') {
      setError('Tài khoản của bạn đang chờ quản trị viên phê duyệt.');
      setSuccess('');
      return;
    }

    if (oauth === 'locked') {
      setError('Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên.');
      setSuccess('');
      return;
    }

    setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
    setSuccess('');
  }, [searchParams]);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const switchMode = (nextMode) => {
    if (loading) return;
    setMode(nextMode);
    resetMessages();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      const loggedInUser = await login(email, password);
      navigate(roleRedirect[loggedInUser.role] || '/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!name || !email || !password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (role === 'teacher' && !department) {
      setError('Vui lòng chọn môn học');
      return;
    }

    try {
      setLoading(true);
      const response = await register({
        name,
        email,
        password,
        role,
        grade,
        className,
        school,
        department: role === 'teacher' ? department : undefined,
      });

      if (response.status === 'pending') {
        setSuccess(response.message || 'Đăng ký thành công. Đang chờ phê duyệt.');
        return;
      }

      navigate(roleRedirect[response.role] || '/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex">
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-brand text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-2.5 font-black text-2xl tracking-tighter">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <span>EduTest Pro</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black leading-tight">
            {mode === 'login' ? 'Chào mừng bạn trở lại' : 'Bắt đầu miễn phí'}
          </h1>
          <p className="text-blue-100/90 text-lg">
            {mode === 'login'
              ? 'Đăng nhập để tiếp tục quá trình giảng dạy và học tập của bạn.'
              : 'Tạo tài khoản để quản lý thi và học tập thông minh.'}
          </p>
        </div>

        <div className="text-blue-100/80 text-sm">
          <button onClick={() => navigate('/')} className="hover:text-white transition-colors">
            Quay về trang chủ
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <div className="lg:hidden flex items-center gap-2.5 font-black text-xl tracking-tighter">
              <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <span>EduTest Pro</span>
            </div>

            <div className="flex items-center rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={cn(
                  'px-4 py-2 rounded-2xl text-sm font-black transition-colors',
                  mode === 'login'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:text-slate-900',
                )}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={cn(
                  'px-4 py-2 rounded-2xl text-sm font-black transition-colors',
                  mode === 'register'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:text-slate-900',
                )}
              >
                Đăng ký
              </button>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-semibold">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm font-semibold">
              {success}
            </div>
          ) : null}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-12 py-3.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    className="w-full rounded-2xl border border-slate-200 px-12 py-3.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full rounded-2xl py-3.5 font-black text-white bg-gradient-brand shadow-xl shadow-brand/25 transition-all flex items-center justify-center gap-2',
                  loading ? 'opacity-70' : 'hover:shadow-brand/40',
                )}
              >
                <span>Đăng nhập</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!loading) window.location.href = `${apiOrigin}/api/auth/google`;
                }}
                disabled={loading}
                className={cn(
                  'w-full rounded-2xl py-3.5 font-black border border-slate-200 text-slate-900 bg-white transition-colors',
                  loading ? 'opacity-70' : 'hover:bg-slate-50',
                )}
              >
                Đăng nhập với Google
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700">Họ và tên</label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-12 py-3.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-12 py-3.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      className="w-full rounded-2xl border border-slate-200 px-12 py-3.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">Xác nhận</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      className="w-full rounded-2xl border border-slate-200 px-12 py-3.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700">Bạn là</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-sm font-black flex items-center justify-center gap-2 transition-colors',
                      role === 'student'
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-slate-200 hover:bg-slate-50',
                    )}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Học sinh
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-sm font-black flex items-center justify-center gap-2 transition-colors',
                      role === 'teacher'
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-slate-200 hover:bg-slate-50',
                    )}
                  >
                    <School className="w-4 h-4" />
                    Giáo viên
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">Khối</label>
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Khối 12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">Lớp</label>
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="12A1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700">Trường</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="THPT ..."
                />
              </div>

              {role === 'teacher' ? (
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">Tổ bộ môn</label>
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand bg-white"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={subjectsLoading}
                  >
                    <option value="">-- Chọn môn học --</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full rounded-2xl py-3.5 font-black text-white bg-gradient-brand shadow-xl shadow-brand/25 transition-all',
                  loading ? 'opacity-70' : 'hover:shadow-brand/40',
                )}
              >
                Tạo tài khoản
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
