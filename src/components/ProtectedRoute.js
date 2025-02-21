import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const userId = localStorage.getItem('userId');
  
  // If there's no userId, redirect to login
  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  // If we have a userId, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
