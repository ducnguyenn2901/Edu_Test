import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Shield,
  Users,
  BarChart,
  ArrowRight,
  Star,
  Menu,
  X,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  AlertTriangle,
  ChevronRight,
  Zap,
  GraduationCap,
  School,
  Lock,
  Mail,
  User,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-white selection:bg-brand/10 selection:text-brand">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-20">
            <div
              className="flex items-center gap-2.5 text-brand font-black text-2xl tracking-tighter group cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/30 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span>
                EduTest<span className="text-slate-900">Pro</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-10">
              {['Tính năng', 'Giải pháp', 'Bảng giá', 'Về chúng tôi'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm font-bold text-slate-500 hover:text-brand transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated && user ? (
                <button
                  onClick={() =>
                    navigate(
                      user.role === 'admin'
                        ? '/admin'
                        : user.role === 'student'
                          ? '/student'
                          : '/teacher',
                    )
                  }
                  className="px-6 py-3 bg-gradient-brand text-white rounded-2xl text-sm font-black hover:shadow-brand/40 transition-all shadow-xl shadow-brand/25 flex items-center gap-2 group"
                >
                  Bảng điều khiển
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm font-black text-slate-900 hover:text-brand transition-colors px-4"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => navigate('/login?mode=register')}
                    className="px-7 py-3.5 bg-gradient-brand text-white rounded-3xl font-black text-lg hover:shadow-brand/40 transition-all transform hover:scale-105 shadow-2xl shadow-brand/30 flex items-center justify-center gap-3"
                  >
                    Bắt đầu miễn phí
                  </button>
                </>
              )}
            </div>

            <button
              className="md:hidden p-2 text-slate-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-transparent opacity-70"></div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand/5 text-brand text-xs font-black mb-8 border border-brand/10">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                HỆ THỐNG QUẢN LÝ THI THẾ HỆ MỚI
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
                Chuyển đổi số <br />
                <span className="bg-gradient-brand bg-clip-text text-transparent">
                  Giáo dục
                </span>{' '}
              </h1>
              <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-lg">
                Nền tảng tổ chức thi và quản lý học tập thông minh dành cho Nhà trường & Giáo viên.
                Tối ưu quy trình, nâng cao chất lượng.
              </p>
              <div className="flex flex-col sm:flex-row gap-5">
                <button
                  onClick={() =>
                    isAuthenticated ? navigate('/student') : navigate('/login?mode=register')
                  }
                  className="px-10 py-5 bg-gradient-brand text-white rounded-3xl font-black text-lg hover:shadow-brand/40 transition-all transform hover:scale-105 shadow-2xl shadow-brand/30 flex items-center justify-center gap-3"
                >
                  Thử nghiệm ngay
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button className="px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-3xl font-black text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                  <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
                  Xem bản Demo
                </button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-10 bg-gradient-to-tr from-brand/20 to-purple-200/30 blur-3xl rounded-full opacity-50"></div>
              <div className="relative bg-white/40 backdrop-blur-md border border-white/50 rounded-[3rem] p-4 shadow-2xl animate-float">
                <img
                  src="https://img.freepik.com/free-vector/abstract-3d-background-with-shining-geometrical-shapes_1217-2514.jpg"
                  alt="EduTest Dashboard"
                  className="rounded-[2.5rem] shadow-sm w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
