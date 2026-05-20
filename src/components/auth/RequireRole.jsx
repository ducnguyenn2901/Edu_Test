import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RequireRole({ roles, children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!user || (roles && !roles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
}

