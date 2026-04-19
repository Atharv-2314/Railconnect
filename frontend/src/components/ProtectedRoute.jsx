import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // ADMIN is a super-user — never block them from any protected route.
  // Only block a non-admin from an admin-only route.
  if (roleRequired && user.role !== roleRequired && user.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
