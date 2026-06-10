import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useAuthStore from "../store/authstore";
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Users,
  MapPin,
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
  Settings,
  ShieldCheck,
  UserCheck
} from "lucide-react";

const Sidebar = () => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Helper to check if a route is active
  const isActive = (path) => location.pathname === path;

  // Active styles helper
  const linkStyle = (path, role) => {
    const baseStyle =
      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative group overflow-hidden ";
    const activeStyle =
      role === "admin"
        ? "bg-blue-50 text-blue-600 shadow-sm"
        : "bg-green-50 text-green-700 shadow-sm";
    const inactiveStyle = "text-slate-650 hover:bg-slate-50 hover:text-slate-900";

    return baseStyle + (isActive(path) ? activeStyle : inactiveStyle);
  };

  return (
    <aside
      className={`min-h-[calc(100vh-70px)] bg-white border-r border-slate-100 flex flex-col justify-between transition-all duration-300 relative ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Sidebar Top */}
      <div className="p-4 space-y-6">
        {/* Collapse toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-white border border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-800 h-6 w-6 rounded-full flex items-center justify-center shadow-sm hover:shadow transition-all cursor-pointer z-20"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Navigation list */}
        <div className="flex flex-col gap-1.5 mt-2">
          {/* Admin Sidebar Navigation */}
          {user?.role === "admin" && (
            <>
              <Link to="/admin/dashboard" className={linkStyle("/admin/dashboard", "admin")}>
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>Dashboard</span>}
                {isCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                    Dashboard
                  </span>
                )}
              </Link>

              <Link to="/admin/create-order" className={linkStyle("/admin/create-order", "admin")}>
                <PlusCircle className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>Create Order</span>}
                {isCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                    Create Order
                  </span>
                )}
              </Link>

              <Link to="/admin/orders" className={linkStyle("/admin/orders", "admin")}>
                <Package className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>Orders Log</span>}
                {isCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                    Orders Log
                  </span>
                )}
              </Link>

              <Link to="/admin/riders" className={linkStyle("/admin/riders", "admin")}>
                <Users className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>Riders Hub</span>}
                {isCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                    Riders Hub
                  </span>
                )}
              </Link>

              <Link to="/admin/tracking" className={linkStyle("/admin/tracking", "admin")}>
                <MapPin className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>Operations Hub</span>}
                {isCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                    Operations Hub
                  </span>
                )}
              </Link>
              
              <Link to="/admin/shop-setup" className={linkStyle("/admin/shop-setup", "admin")}>
                <Settings className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>Business Settings</span>}
                {isCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                    Business Settings
                  </span>
                )}
              </Link>
            </>
          )}

          {/* Rider Sidebar Navigation */}
          {user?.role === "rider" && (
            <>
              <Link to="/rider/dashboard" className={linkStyle("/rider/dashboard", "rider")}>
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>Dashboard</span>}
                {isCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                    Dashboard
                  </span>
                )}
              </Link>

              <Link to="/rider/orders" className={linkStyle("/rider/orders", "rider")}>
                <Package className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>My Orders</span>}
                {isCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                    My Orders
                  </span>
                )}
              </Link>

              <Link to="/rider/earnings" className={linkStyle("/rider/earnings", "rider")}>
                <CircleDollarSign className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>Earnings Summary</span>}
                {isCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                    Earnings Summary
                  </span>
                )}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Sidebar Footer - User Profile Section */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md relative shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "User Account"}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {user?.role === "admin" ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Admin</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-green-700" />
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Rider</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;