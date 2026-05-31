import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeRiders: 0,
    deliveredOrders: 0,
    totalEarnings: 0,
    recentOrders: [],
    ridersList: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      const res = await API.get("/api/admin/stats");
      setStats(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Heading */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            Real-time delivery operations, order assignments, and rider monitoring.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/create-order")}
          className="self-start md:self-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          + Create Order
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              📦 Total Active Orders
            </h2>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 text-xl">📋</span>
          </div>
          <p className="text-4xl font-black text-gray-900 mt-4">
            {stats.totalOrders}
          </p>
        </div>

        {/* Active Riders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              🛵 Active Riders
            </h2>
            <span className="p-2 rounded-lg bg-green-50 text-green-600 text-xl">⚡</span>
          </div>
          <p className="text-4xl font-black text-gray-900 mt-4">
            {stats.activeRiders}
          </p>
        </div>

        {/* Delivered Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              ✅ Delivered Orders
            </h2>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600 text-xl">🎉</span>
          </div>
          <p className="text-4xl font-black text-gray-900 mt-4">
            {stats.deliveredOrders}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Delivered Orders Log
            </h2>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-5xl mb-4">📦</span>
              <p className="text-lg font-medium text-gray-500">No Orders Delivered Yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Rider</th>
                    <th className="pb-3">Delivery Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                  {stats.recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-mono text-gray-500">#{order._id.slice(-5)}</td>
                      <td className="py-4 font-semibold text-gray-900">{order.customerName}</td>
                      <td className="py-4 text-gray-500 font-semibold">{order.assignedRider?.name || "Unassigned"}</td>
                      <td className="py-4 text-gray-500 font-medium">
                        {order.deliveredAt 
                          ? new Date(order.deliveredAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                          : new Date(order.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Riders Quick Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Riders Status
            </h2>
            <Link to="/admin/riders" className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline">
              Manage
            </Link>
          </div>

          {stats.ridersList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-5xl mb-4">🛵</span>
              <p className="text-lg font-medium text-gray-500">No Riders Registered</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.ridersList.map((rider) => (
                <div key={rider._id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                      {rider.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{rider.name}</p>
                      <p className="text-xs text-gray-500">{rider.phone || "No phone"}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                    ${!rider.isActive ? "bg-red-50 text-red-700 border border-red-200" : ""}
                    ${rider.isActive && rider.isAvailable ? "bg-green-50 text-green-700 border border-green-200" : ""}
                    ${rider.isActive && !rider.isAvailable ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : ""}
                  `}>
                    {!rider.isActive ? "Blocked" : rider.isAvailable ? "Available" : "Busy"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;