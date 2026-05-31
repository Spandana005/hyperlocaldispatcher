import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authstore.js";
import useTrackingStore from "../store/trackingstore.js";

const Header = () => {

  const navigate = useNavigate();

  // Zustand Store
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const stopTracking = useTrackingStore((state) => state.stopTracking);

  // Logout Function
  const handleLogout = () => {

    stopTracking();
    localStorage.clear();
    logout();
    navigate("/");
  
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">

      <div className="flex items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold"
        >
          🚚 HyperLocal Dispatcher
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">

          {/* User Name */}
          {user && (
            <p className="font-medium">
              Welcome, {user.name}
            </p>
          )}

          {/* Login Button */}
          {!user && (
            <Link
              to="/login"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100"
            >
              Login
            </Link>
          )}

          {/* Logout Button */}
          {user && (
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          )}

        </div>

      </div>

    </header>
  );
};

export default Header;