import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';

export const GuestRoute: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  if (!isInitialized) {
    return <LoadingSpinner fullScreen label="Checking session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/market" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
