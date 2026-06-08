import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const roleRedirect = {
  admin: '/admin',
  student: '/student',
  teacher: '/teacher',
  mod: '/teacher',
};

export function RequireRole({ roles, children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-brand animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || (roles && !roles.includes(user.role))) {
    return <Navigate to={roleRedirect[user?.role] || '/'} replace />;
  }

  return children;
}
