import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isInitialized) {
    return <LoadingSpinner fullScreen label="Verifying authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
