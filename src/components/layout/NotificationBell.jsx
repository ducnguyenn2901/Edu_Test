import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Clock, Users, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { notificationApi } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext.jsx';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getAll();
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'student_request':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'class_approved':
        return <Check className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <Settings className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-brand rounded-2xl transition-all relative group shadow-soft hover:shadow-md border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
      >
        <Bell className="w-5 h-5 group-hover:animate-shake" />
        {unreadCount > 0 && (
          <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 top-full w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
              Thông báo
            </h3>
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-black text-brand uppercase tracking-tighter hover:underline"
                >
                  Đánh dấu tất cả
                </button>
              )}
              <span className="bg-brand/10 text-brand text-[10px] font-black px-2 py-0.5 rounded-full">
                {unreadCount} mới
              </span>
            </div>
          </div>

          <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={cn(
                      'p-5 transition-all group/item relative',
                      !notification.isRead
                        ? 'bg-brand/5 dark:bg-brand/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    )}
                  >
                    <div className="flex gap-4">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                          !notification.isRead
                            ? 'bg-white dark:bg-slate-800 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-900',
                        )}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={cn(
                              'text-sm tracking-tight line-clamp-1',
                              !notification.isRead
                                ? 'font-black text-slate-900 dark:text-white'
                                : 'font-bold text-slate-600 dark:text-slate-400',
                            )}
                          >
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification._id);
                            }}
                            className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </div>
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-1 group/btn"
                            >
                              Đã đọc{' '}
                              <Check className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {notification.link && (
                      <Link
                        to={notification.link}
                        onClick={() => {
                          handleMarkAsRead(notification._id);
                          setIsOpen(false);
                        }}
                        className="absolute inset-0 z-0"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                </div>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                  Không có thông báo nào
                </p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
              <button className="w-full py-2.5 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-brand transition-colors">
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
