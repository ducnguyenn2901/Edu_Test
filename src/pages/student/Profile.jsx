import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Shield, Key, Bell, Loader2, CheckCircle2, AlertCircle, X, ShieldCheck, Calendar, Hash, School, GraduationCap, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext.jsx';
import { cn } from '../../lib/utils';

export function StudentProfile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    gender: user?.gender || '',
    grade: user?.grade || '',
    className: user?.className || '',
    school: user?.school || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authApi.updateProfile(formData);
      localStorage.setItem('user', JSON.stringify(res.data));
      showToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: 'Thông tin cá nhân đã được cập nhật.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: err.response?.data?.message || 'Đã có lỗi xảy ra.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast({ type: 'error', title: 'Lỗi', message: 'Mật khẩu mới không khớp.' });
      return;
    }
    try {
      setLoading(true);
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showToast({ type: 'success', title: 'Thành công', message: 'Mật khẩu đã được thay đổi.' });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Thất bại',
        message: err.response?.data?.message || 'Mật khẩu hiện tại không chính xác.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest border border-brand/20">
             <User className="w-3 h-3" /> Trung tâm tài khoản
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Quản lý thông tin định danh và bảo mật của bạn.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden group">
            <div className="h-32 bg-gradient-brand relative">
               <div className="absolute inset-0 bg-abstract-pattern opacity-20"></div>
            </div>
            <div className="px-8 pb-8 flex flex-col items-center text-center -mt-16 relative z-10">
              <div className="relative group/avatar mb-6">
                <div className="w-32 h-32 rounded-4xl bg-white dark:bg-slate-800 p-1.5 shadow-2xl transition-transform group-hover/avatar:scale-105 duration-500">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1A56DB&color=fff&size=256`}
                    alt={user.name}
                    className="w-full h-full rounded-[28px] object-cover border-4 border-white dark:border-slate-900"
                  />
                </div>
                <button className="absolute bottom-0 right-0 p-3 bg-brand text-white rounded-2xl hover:bg-brand-600 transition-all shadow-xl shadow-brand/30 border-2 border-white dark:border-slate-900">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                 <span className="px-3 py-1 bg-brand/5 text-brand text-[10px] font-black uppercase tracking-widest rounded-lg border border-brand/10">
                    {user.role === 'student' ? 'Học sinh' : user.role}
                 </span>
                 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                    Active
                 </span>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full mt-8">
                 <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-50 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Khối lớp</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{user.grade || 'K/X'}</p>
                 </div>
                 <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-50 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lớp học</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{user.className || 'Chưa có'}</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-brand" /> Thông tin hệ thống
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                   <Calendar className="w-4 h-4 text-slate-400" />
                   <span className="text-xs font-bold text-slate-500">Ngày gia nhập</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                   <Hash className="w-4 h-4 text-slate-400" />
                   <span className="text-xs font-bold text-slate-500">Mã định danh</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  #{String(user._id || user.id).slice(-6).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Info Form */}
          <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                 <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
                    <User className="w-5 h-5" />
                 </div>
                 Thông tin định danh
               </h3>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên đầy đủ</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand transition-colors" />
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand transition-colors" />
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày sinh</label>
                  <div className="relative group">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand transition-colors" />
                    <input 
                      type="date" 
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giới tính</label>
                  <select 
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <GraduationCap className="w-3 h-3" /> Khối học
                  </label>
                  <input 
                    type="text" 
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    placeholder="Ví dụ: 12"
                    className="w-full px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <Hash className="w-3 h-3" /> Lớp học
                  </label>
                  <input 
                    type="text" 
                    value={formData.className}
                    onChange={(e) => setFormData({...formData, className: e.target.value})}
                    placeholder="Ví dụ: 12A1"
                    className="w-full px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <School className="w-3 h-3" /> Trường đang học
                  </label>
                  <div className="relative group">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand transition-colors" />
                    <input 
                      type="text" 
                      value={formData.school}
                      onChange={(e) => setFormData({...formData, school: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <MapPin className="w-3 h-3" /> Địa chỉ
                  </label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                    className="w-full px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-10 py-4 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-600 transition-all shadow-xl shadow-brand/30 disabled:opacity-50 flex items-center gap-3 active:scale-95"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Cập nhật ngay
                </button>
              </div>
            </form>
          </div>

          {/* Account Settings */}
          <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none">
             <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 mb-8">
               <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Shield className="w-5 h-5" />
               </div>
               Bảo mật & Trải nghiệm
             </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-brand/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Key className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white">Đổi mật khẩu</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Bảo vệ tài khoản</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-brand/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Bell className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white">Thông báo</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cài đặt nhận tin</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-4xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Đổi mật khẩu bảo mật</h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                 <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                  <input 
                    type="password" 
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
                  <input 
                    type="password" 
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-dark transition-all shadow-xl shadow-brand/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Xác nhận đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
