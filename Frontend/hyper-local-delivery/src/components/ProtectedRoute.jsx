import React from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authstore";

const ProtectedRoute = ({ children, role }) => {

  // Zustand Store
  const user = useAuthStore((state) => state.user);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  // Show a premium glassmorphic loader while checking session
  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white/95 border border-gray-100 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-xs w-full text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div>
            <h3 className="font-extrabold text-gray-800 text-lg">Securing Session</h3>
            <p className="text-xs text-gray-400 font-medium mt-1">Please wait while verifying credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  // If User Not Logged In
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If Wrong Role
  if (user.role !== role) {
    return <Navigate to="/" replace />;
  }

  // If Authorized
  return children;
};

export default ProtectedRoute;