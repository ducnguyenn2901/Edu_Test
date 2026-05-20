import React, { useState, useRef, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Menu, X, Bell, Search, ShieldCheck, ChevronDown, User as UserIcon, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { cn } from '../../lib/utils';
import { NotificationBell } from './NotificationBell';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../common/ConfirmModal';

export function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
    setIsUserMenuOpen(false);
  };

  const confirmLogout = () => {
    logout();
    navigate('/');
    setIsLogoutModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 flex flex-col md:flex-row font-sans selection:bg-brand/10 selection:text-brand">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2.5 text-brand font-black text-xl tracking-tighter">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/30 text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span>EduAdmin<span className="text-gray-900 dark:text-white">Pro</span></span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 z-40 md:hidden backdrop-blur-sm transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-500 ease-in-out md:relative md:translate-x-0 shadow-2xl md:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-10 py-5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex-1 max-w-lg">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
              <input 
                type="text" 
                placeholder="Tìm kiếm hệ thống (Ctrl + K)..." 
                className="w-full pl-12 pr-6 py-3.5 bg-gray-100/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-medium transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <NotificationBell />

            <div className="h-10 w-px bg-gray-100 dark:bg-slate-800 mx-1"></div>
            
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-4 pl-2 group"
              >
                <div className="text-right hidden xl:block">
                  <p className="text-sm font-black text-gray-900 dark:text-slate-50 group-hover:text-brand transition-colors">{user?.name}</p>
                  <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-0.5">Administrator</p>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-brand p-[2px] shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=1A56DB&color=fff&size=128`}
                      alt="Avatar" 
                      className="w-full h-full rounded-[14px] border-2 border-white dark:border-slate-900 object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-gray-400 group-hover:text-brand transition-all", isUserMenuOpen && "rotate-180")} />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-800 mb-2">
                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-0.5">{user?.email}</p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      navigate('/admin/profile');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-6 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-brand transition-all font-bold text-sm"
                  >
                    <UserIcon className="w-4 h-4" />
                    Hồ sơ cá nhân
                  </button>
                  
                  <button 
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-6 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-brand transition-all font-bold text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Cài đặt hệ thống
                  </button>
                  
                  <div className="h-px bg-gray-50 dark:bg-slate-800 my-2 mx-4"></div>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-6 py-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all font-black text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar">
          <div className="p-6 md:p-10 lg:p-12 max-w-screen-2xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị không?"
      />
    </div>
  );
}
