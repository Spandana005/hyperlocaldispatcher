import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { 
  Package, 
  Users, 
  CheckCircle2, 
  CircleDollarSign, 
  Plus, 
  Clock, 
  TrendingUp,
  ChevronRight,
  TrendingDown,
  ShieldCheck
} from "lucide-react";
import { toast } from "react-hot-toast";
import { SkeletonKPI } from "./ui/Skeleton";

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
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Operations Console
          </h1>
          <p className="text-slate-550 mt-1.5 text-xs font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600 animate-spin" />
            Live dispatch stream active • Real-time coordinate sync enabled.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link
            to="/admin/tracking"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            🗺️ Live Dispatch Map
          </Link>
          <button
            onClick={() => navigate("/admin/create-order")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Order
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonKPI key={i} />)
        ) : (
        <>
        {/* KPI 1: Active Deliveries */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Deliveries
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900">{stats.totalOrders}</p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">Active in dispatch</p>
            </div>
            <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> +12%
            </span>
          </div>
        </div>

        {/* KPI 2: Available Drivers */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Available Drivers
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900">
                {stats.ridersList.filter(r => r.isActive && r.isAvailable).length}
              </p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">Ready for dispatch</p>
            </div>
            <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> Online
            </span>
          </div>
        </div>

        {/* KPI 3: Completed Orders */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Completed Orders
            </span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900">{stats.deliveredOrders}</p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">Delivered overall</p>
            </div>
            <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> +24%
            </span>
          </div>
        </div>

        {/* KPI 4: Revenue Today */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Platform Revenue
            </span>
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900">₹{stats.totalEarnings}</p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">Credited payouts</p>
            </div>
            <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> +8.5%
            </span>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3 width): Analytics Trends & Orders Log */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Analytics SVG Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Delivery Volume Trends</h3>
                <p className="text-[10px] text-slate-450 font-semibold mt-0.5">7-day performance diagnostics</p>
              </div>
              <div className="flex gap-4 text-[10px] font-bold text-slate-550">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> Dispatches</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Deliveries</span>
              </div>
            </div>

            {/* High fidelity SVG line chart */}
            <div className="w-full h-44 relative bg-slate-50/50 rounded-2xl border border-slate-100/50 p-2">
              <svg viewBox="0 0 700 150" className="w-full h-full">
                <defs>
                  <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                
                {/* Grid Lines */}
                <line x1="50" y1="20" x2="650" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="50" y1="60" x2="650" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="50" y1="100" x2="650" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                
                {/* Chart Area Fill */}
                <path
                  d="M 50 110 L 150 90 L 250 50 L 350 70 L 450 40 L 550 30 L 650 20 L 650 120 L 50 120 Z"
                  fill="url(#blue-gradient)"
                />
                
                {/* Dispatch line */}
                <path
                  d="M 50 110 L 150 90 L 250 50 L 350 70 L 450 40 L 550 30 L 650 20"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                
                {/* Dots */}
                <circle cx="50" cy="110" r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="150" cy="90" r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="250" cy="50" r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="350" cy="70" r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="450" cy="40" r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="550" cy="30" r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="650" cy="20" r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                
                {/* X Axis labels */}
                <text x="50" y="140" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">Mon</text>
                <text x="150" y="140" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">Tue</text>
                <text x="250" y="140" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">Wed</text>
                <text x="350" y="140" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">Thu</text>
                <text x="450" y="140" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">Fri</text>
                <text x="550" y="140" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">Sat</text>
                <text x="650" y="140" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">Sun</text>
              </svg>
            </div>
          </div>

          {/* Delivered Orders Log Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Delivered Orders Log</h3>
                <p className="text-[10px] text-slate-450 font-semibold mt-0.5">Historical statements of completed tasks</p>
              </div>
              <Link
                to="/admin/orders"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
              >
                View Dispatch Board
              </Link>
            </div>

            {stats.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <span className="text-5xl mb-3">📦</span>
                <p className="text-sm font-semibold text-slate-500">No Orders Completed Yet</p>
                <p className="text-[10px] text-slate-400 mt-1">Delivered dispatches will archive and populate here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="pb-3 pl-2">ID</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Assigned Rider</th>
                      <th className="pb-3 text-right pr-2">Delivered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                    {stats.recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 pl-2 font-mono text-[11px] text-slate-400">
                          #{order._id.slice(-5)}
                        </td>
                        <td className="py-3.5 font-bold text-slate-800">
                          {order.customerName}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center">
                              {order.assignedRider?.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                            <span className="font-semibold text-slate-750">
                              {order.assignedRider?.name || "Unassigned"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 text-right pr-2 font-semibold text-slate-500">
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
        </div>

        {/* Right Column (1/3 width): Drivers Overview */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Rider Status Directory</h3>
                <p className="text-[10px] text-slate-450 font-semibold mt-0.5">Roster profiles & signals</p>
              </div>
              <Link
                to="/admin/riders"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5"
              >
                Manage
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats.ridersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <span className="text-5xl mb-3">🛵</span>
                <p className="text-sm font-semibold text-slate-500">No Riders Registered</p>
                <p className="text-[10px] text-slate-400 mt-1">Rider logins will register automatically.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {stats.ridersList.map((rider) => (
                  <div 
                    key={rider._id} 
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {rider.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-850 text-xs truncate">{rider.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{rider.phone || "No phone contact"}</p>
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border
                      ${!rider.isActive 
                        ? "bg-rose-50 text-rose-700 border-rose-100" 
                        : rider.isAvailable 
                          ? "bg-green-50 text-green-700 border-green-100" 
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }
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
    </div>
  );
};

export default AdminDashboard;