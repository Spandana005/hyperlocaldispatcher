import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authstore.js";
import useTrackingStore from "../store/trackingstore.js";
import { Logo } from "./Logo.jsx";
import { 
  Bell, 
  Search, 
  Plus, 
  ChevronRight, 
  LogOut, 
  User, 
  CheckCircle,
  Clock,
  ShieldAlert,
  Sun,
  Moon
} from "lucide-react";
import { toast } from "react-hot-toast";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand Store
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const stopTracking = useTrackingStore((state) => state.stopTracking);

  // States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("df-theme") || "light");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("df-theme", next);
    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  // Mock Notifications for SaaS look
  const mockNotifications = [
    {
      id: 1,
      title: "New Dispatch Request",
      desc: "Incoming order for customer Rahul Verma needs rider assignment.",
      time: "2 mins ago",
      icon: <Clock className="w-4 h-4 text-blue-600" />,
      bg: "bg-blue-50"
    },
    {
      id: 2,
      title: "Delivery Completed",
      desc: "Order #84920 has been marked delivered by Rider Karan.",
      time: "15 mins ago",
      icon: <CheckCircle className="w-4 h-4 text-green-600" />,
      bg: "bg-green-50"
    },
    {
      id: 3,
      title: "Rider Signal Alert",
      desc: "Rider Varsha has entered busy zone near City Center.",
      time: "1 hour ago",
      icon: <ShieldAlert className="w-4 h-4 text-amber-500" />,
      bg: "bg-amber-50"
    }
  ];

  // Logout Function
  const handleLogout = () => {
    stopTracking();
    localStorage.clear();
    logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  // Breadcrumbs generation based on path
  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter((x) => x);
    if (paths.length === 0) return [{ label: "Home", path: "/" }];
    
    return paths.map((segment, index) => {
      const label = segment
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const path = "/" + paths.slice(0, index + 1).join("/");
      return { label, path };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 shadow-sm px-6 h-[70px] flex items-center justify-between">
      {/* Left section: Logo & Breadcrumbs */}
      <div className="flex items-center gap-6">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <Logo size="md" />
        </Link>
        
        {/* Divider */}
        {user && <span className="h-5 w-px bg-slate-200 hidden md:block"></span>}

        {/* Breadcrumb Navigation */}
        {user && (
          <nav className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to={user.role === "admin" ? "/admin/dashboard" : "/rider/dashboard"} className="hover:text-slate-800 transition-colors">
              App
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className={`${idx === breadcrumbs.length - 1 ? "text-slate-800 font-bold" : "hover:text-slate-700 transition-colors"}`}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}
      </div>

      {/* Middle section: Global Search Bar */}
      {user && (
        <div className="relative w-80 max-w-xs xl:max-w-md hidden lg:block">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search orders, riders, payouts..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 border border-transparent hover:border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs rounded-xl transition-all"
          />
        </div>
      )}

      {/* Right section: Actions, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-4">
        {/* Quick create order action for Admin */}
        {user?.role === "admin" && (
          <Link
            to="/admin/create-order"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Order</span>
          </Link>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4 text-slate-500" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {user ? (
          <>
            {/* Notification Bell with Simulation Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className={`p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all relative cursor-pointer ${
                  showNotifications ? "bg-slate-50 border-slate-200" : "bg-white"
                }`}
              >
                <Bell className="w-4 h-4 text-slate-650" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full border border-white"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-3 overflow-hidden animate-scaleUp">
                  <div className="px-4 pb-2 border-b border-slate-50 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-800">Notifications</span>
                    <button 
                      onClick={() => {
                        setShowNotifications(false);
                        toast.success("Cleared all notifications");
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:underline uppercase"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                    {mockNotifications.map((notif) => (
                      <div key={notif.id} className="p-3.5 hover:bg-slate-50/70 transition-colors flex gap-3 cursor-pointer">
                        <div className={`p-2.5 rounded-xl shrink-0 h-fit ${notif.bg}`}>
                          {notif.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-850 truncate">{notif.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{notif.desc}</p>
                          <span className="text-[9px] text-slate-400 font-semibold block mt-1">{notif.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-md">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden sm:block truncate max-w-[80px]">
                  {user.name.split(" ")[0]}
                </span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2 animate-scaleUp">
                  <div className="px-4 py-2 border-b border-slate-50">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">{user.role}</p>
                  </div>
                  
                  <Link
                    to={user.role === "admin" ? "/admin/shop-setup" : "/rider/dashboard"}
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-650 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    My Profile
                  </Link>
                  
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-650 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left border-t border-slate-50 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-650 hover:text-slate-900 px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;