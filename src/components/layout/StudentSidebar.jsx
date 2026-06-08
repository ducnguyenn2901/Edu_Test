import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { ConfirmModal } from '../common/ConfirmModal';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', to: '/student' },
  { icon: BookOpen, label: 'Lớp học của tôi', to: '/student/classrooms' },
  { icon: FileText, label: 'Kỳ thi & Kiểm tra', to: '/student/exams' },
  { icon: BarChart3, label: 'Kết quả học tập', to: '/student/results' },
];

export function StudentSidebar({ onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleNavClick = () => {
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/');
    handleNavClick();
    setIsLogoutModalOpen(false);
  };

  return (
    <aside className="w-72 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900 h-full flex flex-col relative z-50 transition-colors duration-300">
      <div className="p-8 pb-6">
        <div
          className="flex items-center gap-4 group cursor-pointer"
          onClick={() => navigate('/student')}
        >
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-950 shadow-sm animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              EduTest
            </span>
            <span className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mt-1.5 opacity-80">
              STUDENT
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
            Khu vực học tập
          </p>
        </div>

        {sidebarItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/student'}
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden',
                isActive
                  ? 'text-white translate-x-1'
                  : 'text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-brand hover:bg-brand/5 dark:hover:bg-brand/10',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-brand transition-opacity duration-300',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />

                <div className="flex items-center gap-3.5 relative z-10">
                  <item.icon
                    className={cn(
                      'w-5 h-5 transition-transform duration-500',
                      isActive ? 'scale-110 rotate-3' : 'group-hover:scale-110',
                    )}
                  />
                  <span className="tracking-tight">{item.label}</span>
                </div>

                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-all duration-300 relative z-10',
                    isActive
                      ? 'opacity-100'
                      : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0',
                  )}
                />
              </>
            )}
          </NavLink>
        ))}

        <div className="px-4 pt-8 pb-2">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
            Cá nhân
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-brand hover:bg-brand/5 dark:hover:bg-brand/10 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 transition-all group-hover:rotate-90 group-hover:scale-110" />
              ) : (
                <Moon className="w-5 h-5 transition-all group-hover:-rotate-12 group-hover:scale-110" />
              )}
            </div>
            <span className="tracking-tight">
              {theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
            </span>
          </div>
          <div
            className={cn(
              'w-10 h-6 rounded-full p-1 transition-colors duration-300 relative',
              theme === 'dark' ? 'bg-brand' : 'bg-slate-200',
            )}
          >
            <div
              className={cn(
                'w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm',
                theme === 'dark' ? 'translate-x-4' : 'translate-x-0',
              )}
            />
          </div>
        </button>

        <NavLink
          to="/student/profile"
          onClick={handleNavClick}
          className={({ isActive }) =>
            cn(
              'flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden',
              isActive
                ? 'text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-brand hover:bg-brand/5 dark:hover:bg-brand/10',
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-brand transition-opacity duration-300',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
              />
              <div className="flex items-center gap-3.5 relative z-10">
                <Settings
                  className={cn(
                    'w-5 h-5 transition-transform duration-500',
                    isActive ? 'rotate-90' : 'group-hover:rotate-45',
                  )}
                />
                <span className="tracking-tight">Tài khoản & Bảo mật</span>
              </div>
            </>
          )}
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all duration-300 group mt-2"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="tracking-tight">Đăng xuất</span>
        </button>
      </nav>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?"
      />
    </aside>
  );
}
