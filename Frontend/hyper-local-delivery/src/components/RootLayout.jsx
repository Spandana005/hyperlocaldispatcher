import React, { useState, useEffect } from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";

import useAuthStore from "../store/authstore";
import useTrackingStore from "../store/trackingstore";
import API from "../api";
import { motion } from "framer-motion";
import { ShieldAlert, Clock } from "lucide-react";

const RootLayout = () => {

  const user =
    useAuthStore((state) => state.user);

  const checkAuth = useAuthStore((state) => state.checkAuth);

  const logout = useAuthStore((state) => state.logout);

  const startTracking = useTrackingStore((state) => state.startTracking);
  const stopTracking = useTrackingStore((state) => state.stopTracking);
  const isTracking = useTrackingStore((state) => state.isTracking);

  const location = useLocation();

  const [isBlocked, setIsBlocked] = useState(false);

  // Trigger checkAuth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Global Rider Live Geolocation Tracking Manager
  useEffect(() => {
    let isSubscribed = true;

    const checkActiveDelivery = async () => {
      // 1. If user is not logged in or is not a rider, ensure we are not tracking
      if (!user || user.role !== "rider") {
        if (isTracking) {
          console.log("[ROOT TRACKING MANAGER] User is not a rider. Stopping background tracking.");
          stopTracking();
        }
        return;
      }

      // 2. Fetch rider's orders to check if any are in 'dispatched' (Out for delivery) status
      try {
        console.log("[ROOT TRACKING MANAGER] Querying active dispatch tasks for rider location sync...");
        const res = await API.get("/api/rider/my-orders");
        if (!isSubscribed) return;

        const dispatchedOrder = res.data.find(order => order.status === "dispatched");

        if (dispatchedOrder) {
          console.log(`[ROOT TRACKING MANAGER] Dispatched order found: ${dispatchedOrder._id}. Resuming tracking.`);
          startTracking(dispatchedOrder._id);
        } else {
          console.log("[ROOT TRACKING MANAGER] No active dispatched orders found.");
          if (isTracking) {
            console.log("[ROOT TRACKING MANAGER] Live tracking active but no dispatched order found in DB. Stopping.");
            stopTracking();
          }
        }
      } catch (err) {
        console.error("[ROOT TRACKING MANAGER] Sync query failed:", err.message);
      }
    };

    // Run check on mount/updates
    checkActiveDelivery();

    // Poll every 15 seconds to ensure sync is maintained
    const interval = setInterval(checkActiveDelivery, 15000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [user, isTracking, startTracking, stopTracking]);

  // Handle expired session event
  useEffect(() => {
    const handleAuthExpired = () => {
      stopTracking();
      logout();
    };
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, [logout, stopTracking]);

  useEffect(() => {
    if (user && (user.isBlocked || user.isActive === false) && user.role === "rider") {
      setIsBlocked(true);
    } else {
      setIsBlocked(false);
    }
  }, [user]);

  useEffect(() => {
    const handleBlockedEvent = () => {
      setIsBlocked(true);
    };
    window.addEventListener("rider-blocked", handleBlockedEvent);
    return () => {
      window.removeEventListener("rider-blocked", handleBlockedEvent);
    };
  }, []);


  // AUTH PAGES
  const hideSidebarRoutes = [
    "/",
    "/login",
    "/register",
  ];


  const hideSidebar =
    hideSidebarRoutes.includes(
      location.pathname
    );


  return (

    <div className="min-h-screen flex flex-col bg-gray-100 relative">

      {/* BLOCKED MODAL FOR RESTRICTED RIDERS */}
      {isBlocked && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 select-none">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-100 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border-2 border-red-100 shadow-md">
              <ShieldAlert className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Account Blocked</h2>
              <p className="text-sm font-semibold text-gray-500">Account blocked by admin.</p>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Your rider dashboard and active tracking access privileges have been revoked due to administrative restrictions. You cannot perform any delivery operations.
              </p>
            </div>
            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-50 text-xs font-bold text-red-700 flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4" /> Please contact support to resolve this issue.
            </div>
            <button 
              onClick={() => {
                setIsBlocked(false);
                stopTracking();
                logout();
              }}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md"
            >
              Sign Out
            </button>
          </motion.div>
        </div>
      )}

      {/* HEADER ALWAYS */}

      <Header />


      {/* MAIN */}

      <div className="flex flex-1">

        {/* SIDEBAR ONLY AFTER LOGIN */}

        {
          user &&
          !hideSidebar &&
          <Sidebar />
        }


        {/* PAGE */}

        <main className="flex-1 p-5 overflow-y-auto">

          <Outlet />

        </main>

      </div>


      {/* FOOTER ALWAYS */}

      <Footer />

    </div>

  );

};

export default RootLayout;