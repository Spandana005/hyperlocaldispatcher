import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authstore";
import useTrackingStore from "../store/trackingstore";
import API from "../api";
import { toast } from "react-hot-toast";

const RiderDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    assignedCount: 0,
    completedCount: 0,
    activeCount: 0,
    earnings: 0,
  });
  const [completedHistory, setCompletedHistory] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);

  const startTracking = useTrackingStore((state) => state.startTracking);
  const stopTracking = useTrackingStore((state) => state.stopTracking);
  const isTracking = useTrackingStore((state) => state.isTracking);

  useEffect(() => {
    if (user?._id) {
      fetchRiderData();
      const interval = setInterval(fetchRiderData, 5000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [user?._id]);

  const fetchRiderData = async () => {
    try {
      // 1. Fetch assigned/active orders
      const ordersRes = await API.get("/api/rider/my-orders");
      const assigned = ordersRes.data;
      
      // Active orders are those with status "accepted" or "dispatched"
      const active = assigned.find(o => o.status === "accepted" || o.status === "dispatched");
      setActiveOrder(active);

      // 2. Fetch earnings info
      const earningsRes = await API.get(`/api/earnings/${user._id}`);
      
      setStats({
        assignedCount: assigned.length,
        completedCount: earningsRes.data.completedOrders,
        activeCount: active ? 1 : 0,
        earnings: earningsRes.data.totalEarnings,
      });
      setCompletedHistory(earningsRes.data.history || []);
    } catch (err) {
      console.error("Error fetching rider data:", err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await API.put(`/api/orders/status/${orderId}`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}!`);

      // Geolocation Live tracking reaction:
      if (newStatus === "dispatched") {
        console.log(`[RIDER DASHBOARD] Order ${orderId} dispatched. Starting location tracking.`);
        startTracking(orderId);
      } else if (newStatus === "delivered") {
        console.log(`[RIDER DASHBOARD] Order ${orderId} delivered. Stopping location tracking.`);
        await stopTracking();
      }

      fetchRiderData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Heading */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Rider Dashboard
          </h1>
          <p className="text-gray-500 mt-2">
            Welcome back, <strong className="text-gray-700">{user?.name}</strong>! Keep tracking your metrics and start delivery tasks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
            ${isTracking ? "bg-green-50 text-green-700 border border-green-200 animate-pulse" : "bg-gray-50 text-gray-500 border border-gray-200"}
          `}>
            <span className={`w-2 h-2 rounded-full ${isTracking ? "bg-green-600" : "bg-gray-400"}`}></span>
            {isTracking ? "GPS Tracking Active" : "GPS Tracking Inactive"}
          </span>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Assigned Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            📦 Assigned Orders
          </h2>
          <p className="text-4xl font-black text-blue-600 mt-4">
            {stats.assignedCount}
          </p>
        </div>

        {/* Deliveries Completed */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            ✅ Completed Deliveries
          </h2>
          <p className="text-4xl font-black text-green-600 mt-4">
            {stats.completedCount}
          </p>
        </div>

        {/* Active Delivery */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            🛵 Active Delivery
          </h2>
          <p className="text-4xl font-black text-orange-500 mt-4">
            {stats.activeCount}
          </p>
        </div>

        {/* Earnings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            💰 Your Earnings
          </h2>
          <p className="text-4xl font-black text-purple-600 mt-4">
            ₹{stats.earnings}
          </p>
        </div>
      </div>

      {/* Current Active Delivery */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Current Active Delivery
        </h2>

        {!activeOrder ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-6xl mb-4">📦</span>
            <p className="text-xl font-semibold text-gray-500">No Active Deliveries</p>
            <p className="text-gray-400 mt-1 text-sm">Go to "My Orders" tab to accept new incoming order dispatch tasks.</p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wider mr-2">
                  {activeOrder.status}
                </span>
                <span className="font-mono text-xs text-gray-400">Order ID: #{activeOrder._id.slice(-8)}</span>
              </div>
              <p className="text-sm text-gray-400">Assigned: {new Date(activeOrder.createdAt).toLocaleTimeString()}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div className="space-y-3">
                <p><strong className="text-gray-500 block uppercase text-xs">Customer Name</strong> <span className="text-base font-semibold text-gray-900">{activeOrder.customerName}</span></p>
                <p><strong className="text-gray-500 block uppercase text-xs">Contact Phone</strong> <span className="text-base font-semibold text-gray-900">{activeOrder.phone}</span></p>
                <p><strong className="text-gray-500 block uppercase text-xs">Order Description</strong> <span className="text-gray-800">{activeOrder.orderDetails}</span></p>
              </div>

              <div className="space-y-3">
                <p>
                  <strong className="text-gray-500 block uppercase text-xs">Delivery Address</strong>
                  <span className="text-gray-850 font-medium leading-relaxed block mt-0.5">
                    {activeOrder.address?.building}, {activeOrder.address?.area}, {activeOrder.address?.city}, {activeOrder.address?.state} - {activeOrder.address?.pincode}
                  </span>
                  {activeOrder.address?.landmark && (
                    <span className="text-xs text-gray-500 block mt-1 italic">Landmark: {activeOrder.address.landmark}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions for active order */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
              {activeOrder.status === "accepted" && (
                <button
                  onClick={() => handleUpdateStatus(activeOrder._id, "dispatched")}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                >
                  🚚 Start Delivery (Dispatch)
                </button>
              )}
              {activeOrder.status === "dispatched" && (
                <button
                  onClick={() => handleUpdateStatus(activeOrder._id, "delivered")}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                >
                  ✅ Mark as Delivered
                </button>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${activeOrder.deliveryLocation?.lat || 0},${activeOrder.deliveryLocation?.lng || 0}`}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
              >
                🗺️ Open in Google Maps
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Completed Deliveries History Tracker */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fadeIn">
        <div className="border-b border-gray-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              📊 Delivered Orders Track & Earnings
            </h2>
            <p className="text-gray-450 text-xs mt-1">Live statement of completed payouts and delivery distance log.</p>
          </div>
          <Link
            to="/rider/earnings"
            className="self-start px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs transition-all tracking-wide shadow-sm"
          >
            Full Statement ➔
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-4">Delivery Date</th>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Distance Logged</th>
                <th className="p-4">Credited Earning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-slate-700">
              {completedHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-2">💰</span>
                      <p className="text-sm font-semibold text-gray-500">No Payout Records Yet</p>
                      <p className="text-xs text-gray-400 mt-0.5">Earnings will auto-credit when you deliver orders based on shop-to-customer GPS distance.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                completedHistory.slice(0, 5).map((record, index) => (
                  <tr key={record._id || index} className="hover:bg-slate-50/30 transition-colors">
                    <td className="p-4 text-xs font-semibold text-slate-500">
                      {new Date(record.date).toLocaleDateString()} at {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400">
                      #{record.orderId?._id?.slice(-8) || record.orderId?.toString()?.slice(-8) || "N/A"}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {record.customerName}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-slate-650 font-extrabold text-xs">
                        🚀 {record.distance ? `${record.distance} km` : "N/A"}
                      </span>
                    </td>
                    <td className="p-4 font-black text-green-600">
                      +₹{record.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Navigation to Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">📋 Orders & Requests</h2>
            <p className="text-gray-500 text-sm mb-6">
              View your ongoing orders and check for nearby stores dispatching delivery requests.
            </p>
          </div>
          <Link
            to="/rider/orders"
            className="self-start px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-all"
          >
            Go to My Orders
          </Link>
        </div>

        {/* Navigation to Earnings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">💰 Earning History</h2>
            <p className="text-gray-500 text-sm mb-6">
              Review completed payouts, daily delivery splits, and long-term financial statements.
            </p>
          </div>
          <Link
            to="/rider/earnings"
            className="self-start px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-all"
          >
            Go to Earnings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;