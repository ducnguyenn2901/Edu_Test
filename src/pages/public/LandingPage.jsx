import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, CheckCircle, Clock, Shield, Users, BarChart, 
  ArrowRight, Star, Menu, X, Facebook, Twitter, Linkedin, 
  Instagram, AlertTriangle, ChevronRight, Zap, GraduationCap, 
  School, Lock, Mail, User, Phone, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { cn } from '../../lib/utils';

export function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { login, register, isAuthenticated, user } = useAuth();
  const [showLogin, setShowLogin] = React.useState(false);
  const [isRegisterMode, setIsRegisterMode] = React.useState(false);
  
  // Form States
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState('student');
  const [grade, setGrade] = React.useState('');
  const [className, setClassName] = React.useState('');
  const [school, setSchool] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [authError, setAuthError] = React.useState('');
  const [authLoading, setAuthLoading] = React.useState(false);
  const [registerSuccess, setRegisterSuccess] = React.useState('');

  const handleOpenLogin = () => {
    setShowLogin(true);
    setIsRegisterMode(false);
    setAuthError('');
  };

  const handleOpenRegister = () => {
    setShowLogin(true);
    setIsRegisterMode(true);
    setAuthError('');
  };

  const handleCloseLogin = () => {
    if (authLoading) return;
    setShowLogin(false);
    setAuthError('');
    setRegisterSuccess('');
    // Clear fields
    setName(''); setEmail(''); setPassword(''); setConfirmPassword('');
    setGrade(''); setClassName(''); setSchool(''); setDepartment('');
    setPhone(''); setAddress(''); setDateOfBirth(''); setGender('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Vui lòng nhập email và mật khẩu');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError('');
      const loggedInUser = await login(email, password);
      const roles = { admin: '/admin', student: '/student', teacher: '/teacher', mod: '/teacher' };
      navigate(roles[loggedInUser.role] || '/');
      setShowLogin(false);
    } catch (error) {
      setAuthError(error?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword || !phone || !school || !grade || !className) {
      setAuthError('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError('');
      const response = await register({ 
        name, email, password, role, grade, className, school,
        department: role === 'teacher' ? department : undefined,
        phone, address, dateOfBirth, gender
      });
      
      if (response.status === 'pending') {
        setRegisterSuccess(response.message || 'Đăng ký thành công. Đang chờ phê duyệt.');
        return;
      }

      const roles = { admin: '/admin', student: '/student', teacher: '/teacher', mod: '/teacher' };
      navigate(roles[response.role] || '/');
      setShowLogin(false);
    } catch (error) {
      setAuthError(error?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-white selection:bg-brand/10 selection:text-brand">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2.5 text-brand font-black text-2xl tracking-tighter group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/30 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span>EduTest<span className="text-slate-900">Pro</span></span>
            </div>

            <div className="hidden md:flex items-center gap-10">
              {['Tính năng', 'Giải pháp', 'Bảng giá', 'Về chúng tôi'].map(item => (
                <a key={item} href="#" className="text-sm font-bold text-slate-500 hover:text-brand transition-colors">{item}</a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated && user ? (
                <button 
                  onClick={() => navigate(user.role === 'admin' ? '/admin' : user.role === 'student' ? '/student' : '/teacher')} 
                  className="px-6 py-3 bg-gradient-brand text-white rounded-2xl text-sm font-black hover:shadow-brand/40 transition-all shadow-xl shadow-brand/25 flex items-center gap-2 group"
                >
                  Bảng điều khiển
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button onClick={handleOpenLogin} className="text-sm font-black text-slate-900 hover:text-brand transition-colors px-4">Đăng nhập</button>
                  <button onClick={handleOpenRegister} className="px-7 py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-black transition-all shadow-xl shadow-black/10 transform hover:-translate-y-0.5 active:translate-y-0">
                    Bắt đầu miễn phí
                  </button>
                </>
              )}
            </div>

            <button className="md:hidden p-2 text-slate-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
                Chuyển đổi số <br/> 
                <span className="bg-gradient-brand bg-clip-text text-transparent">Giáo dục</span> toàn diện
              </h1>
              <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-lg">
                Nền tảng tổ chức thi và quản lý học tập thông minh dành cho Nhà trường & Giáo viên. Tối ưu quy trình, nâng cao chất lượng.
              </p>
              <div className="flex flex-col sm:flex-row gap-5">
                <button 
                  onClick={isAuthenticated ? () => navigate('/student') : handleOpenRegister}
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

      {/* Auth Modal - Split Screen Style */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 lg:p-8">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={handleCloseLogin}></div>
          
          <div className="relative w-full max-w-6xl bg-white md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full md:h-[min(90vh,800px)] animate-in fade-in zoom-in-95 duration-300">
            {/* Left Side: Abstract/3D Image */}
            <div className="hidden md:flex md:w-5/12 bg-gradient-brand relative p-12 flex-col justify-between overflow-hidden">
              <div className="absolute inset-0 bg-abstract-pattern opacity-10"></div>
              <div className="absolute top-[-10%] -right-[10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-10%] -left-[10%] w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 text-white font-black text-2xl tracking-tighter">
                  <BookOpen className="w-8 h-8" />
                  <span>EduTest Pro</span>
                </div>
              </div>

              <div className="relative z-10">
                <h2 className="text-4xl font-black text-white leading-tight mb-6">
                  {isRegisterMode ? "Bắt đầu hành trình giáo dục mới" : "Chào mừng bạn trở lại hệ thống"}
                </h2>
                <p className="text-blue-100 text-lg opacity-80">
                  {isRegisterMode 
                    ? "Tham gia cùng hàng ngàn giáo viên và học sinh trên toàn quốc để nâng tầm tri thức." 
                    : "Đăng nhập để tiếp tục quá trình giảng dạy và học tập của bạn."}
                </p>
              </div>

              <div className="relative z-10 flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center text-white">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center text-white">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center text-white">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto custom-scrollbar relative">
              <button 
                onClick={handleCloseLogin}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all z-20"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="max-w-md mx-auto">
                {registerSuccess ? (
                  <div className="text-center py-8 space-y-6">
                    <div className="w-20 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <Check className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900">Thành công!</h3>
                    <p className="text-gray-500 text-lg leading-relaxed">{registerSuccess}</p>
                    <button
                      onClick={() => { setRegisterSuccess(''); setIsRegisterMode(false); }}
                      className="w-full py-4 bg-brand text-white rounded-2xl font-black shadow-xl shadow-brand/20 hover:bg-brand-dark transition-all"
                    >
                      Quay lại Đăng nhập
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={cn("mb-8", isRegisterMode ? "mb-6" : "mb-10")}>
                      <h3 className="text-3xl font-black text-gray-900 mb-1">
                        {isRegisterMode ? "Tạo tài khoản" : "Đăng nhập"}
                      </h3>
                      <p className="text-gray-500 font-medium text-sm">
                        {isRegisterMode 
                          ? "Điền thông tin bên dưới để đăng ký." 
                          : "Nhập thông tin tài khoản của bạn."}
                      </p>
                    </div>

                    {authError && (
                      <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3 animate-shake">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {authError}
                      </div>
                    )}

                    <form onSubmit={isRegisterMode ? handleRegisterSubmit : handleLoginSubmit} className={cn("space-y-4", isRegisterMode ? "space-y-3" : "space-y-5")}>
                      {isRegisterMode && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và tên</label>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                              <input
                                type="text" required
                                value={name} onChange={(e) => setName(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-brand focus:bg-white rounded-xl outline-none transition-all font-bold text-sm"
                                placeholder="Nguyễn Văn A"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                            <div className="relative group">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                              <input
                                type="tel" required
                                value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-brand focus:bg-white rounded-xl outline-none transition-all font-bold text-sm"
                                placeholder="0901234567"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                          <input
                            type="email" required
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-brand focus:bg-white rounded-xl outline-none transition-all font-bold text-sm"
                            placeholder="name@example.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                          <input
                            type="password" required
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-brand focus:bg-white rounded-xl outline-none transition-all font-bold text-sm"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      {isRegisterMode && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                              <input
                                type="password" required
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-brand focus:bg-white rounded-xl outline-none transition-all font-bold text-sm"
                                placeholder="••••••••"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vai trò</label>
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { id: 'student', label: 'Học sinh', icon: GraduationCap },
                                { id: 'teacher', label: 'Giáo viên', icon: School }
                              ].map((r) => (
                                <button
                                  key={r.id} type="button"
                                  onClick={() => setRole(r.id)}
                                  className={cn(
                                    "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-black text-xs",
                                    role === r.id ? "border-brand bg-brand/5 text-brand" : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                                  )}
                                >
                                  <r.icon className="w-4 h-4" />
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Khối</label>
                              <input
                                type="text" required value={grade} onChange={(e) => setGrade(e.target.value)}
                                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-brand rounded-xl outline-none transition-all font-bold text-sm"
                                placeholder="Khối 12"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lớp</label>
                              <input
                                type="text" required value={className} onChange={(e) => setClassName(e.target.value)}
                                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-brand rounded-xl outline-none transition-all font-bold text-sm"
                                placeholder="12A1"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Trường học</label>
                            <input
                              type="text" required value={school} onChange={(e) => setSchool(e.target.value)}
                              className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-brand rounded-xl outline-none transition-all font-bold text-sm"
                              placeholder="THPT Nguyễn Trãi"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Địa chỉ</label>
                            <input
                              type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                              className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-brand rounded-xl outline-none transition-all font-bold text-sm"
                              placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày sinh</label>
                              <input
                                type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-brand rounded-xl outline-none transition-all font-bold text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giới tính</label>
                              <select
                                value={gender} onChange={(e) => setGender(e.target.value)}
                                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-brand rounded-xl outline-none transition-all font-bold text-sm"
                              >
                                <option value="">Chọn giới tính</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                              </select>
                            </div>
                          </div>

                          {role === 'teacher' && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tổ bộ môn</label>
                              <input
                                type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-brand rounded-xl outline-none transition-all font-bold text-sm"
                                placeholder="Toán - Tin"
                              />
                            </div>
                          )}
                        </>
                      )}

                      <button
                        type="submit" disabled={authLoading}
                        className="w-full py-4 bg-brand text-white rounded-2xl font-black text-base shadow-xl shadow-brand/30 hover:bg-brand-dark transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-2"
                      >
                        {authLoading ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : (isRegisterMode ? "Đăng ký ngay" : "Đăng nhập")}
                      </button>
                    </form>

                    <div className="mt-8 text-center">
                      <p className="text-gray-500 font-bold">
                        {isRegisterMode ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{' '}
                        <button 
                          onClick={() => setIsRegisterMode(!isRegisterMode)}
                          className="text-brand hover:underline underline-offset-4 decoration-2"
                        >
                          {isRegisterMode ? "Đăng nhập" : "Tạo tài khoản miễn phí"}
                        </button>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
