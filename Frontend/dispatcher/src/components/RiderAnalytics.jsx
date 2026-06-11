import React, { useState, useEffect } from "react";
import { getRiderAnalytics } from "../api";
import { 
  Users, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  CircleDollarSign, 
  Compass, 
  Clock, 
  Activity,
  Smile,
  AlertCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Calendar
} from "lucide-react";
import { toast } from "react-hot-toast";

const RiderAnalytics = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      const res = await getRiderAnalytics();
      if (res.data?.success && res.data?.analytics) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load rider performance analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Compute overall shop statistics
  const totalDeliveries = analytics.reduce((sum, r) => sum + r.completedDeliveries, 0);
  const totalEarnings = analytics.reduce((sum, r) => sum + r.totalEarnings, 0);
  const totalDistance = analytics.reduce((sum, r) => sum + r.totalDistance, 0);
  const avgAcceptanceRate = analytics.length > 0 
    ? Math.round(analytics.reduce((sum, r) => sum + r.acceptanceRate, 0) / analytics.length) 
    : 100;
  const avgCompletionRate = analytics.length > 0 
    ? Math.round(analytics.reduce((sum, r) => sum + r.completionRate, 0) / analytics.length) 
    : 100;
  const avgDeliveryTime = analytics.length > 0
    ? Math.round(analytics.reduce((sum, r) => sum + r.avgDeliveryTime, 0) / analytics.length)
    : 0;

  // Identify top and lowest performers
  const getPerformers = () => {
    if (analytics.length === 0) return { top: null, lowest: null };
    
    // Sort riders by completed deliveries desc, then acceptance rate desc
    const sorted = [...analytics].sort((a, b) => {
      if (b.completedDeliveries !== a.completedDeliveries) {
        return b.completedDeliveries - a.completedDeliveries;
      }
      return b.acceptanceRate - a.acceptanceRate;
    });

    return {
      top: sorted[0],
      lowest: sorted.length > 1 ? sorted[sorted.length - 1] : null
    };
  };

  const { top, lowest } = getPerformers();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-8 h-8 text-indigo-600" />
            Rider Performance Analytics
          </h1>
          <p className="text-slate-550 mt-1 text-xs font-semibold">
            Track metrics including acceptance, delivery speed, completed runs, and payouts across your rider network.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-650 animate-spin" />
        </div>
      ) : analytics.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <span className="text-6xl mb-4">📊</span>
          <h3 className="font-bold text-slate-700 text-sm">No Performance Data Logged</h3>
          <p className="text-[10px] text-slate-400 mt-1 max-w-xs text-center leading-relaxed">
            Approved riders and delivery stats will populate here once they begin accepting and executing shipments.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Analytics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
            {/* KPI 1: Completed Deliveries */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Shop runs</span>
                <div className="p-2.5 bg-green-50 text-green-600 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-4">{totalDeliveries}</p>
              <div className="mt-2 text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <span>Across all approved network couriers</span>
              </div>
            </div>

            {/* KPI 2: Total Distance */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Distance Traveled</span>
                <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-2xl">
                  <Compass className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-4">{totalDistance.toFixed(1)} km</p>
              <div className="mt-2 text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <span>Cumulative delivery log distance</span>
              </div>
            </div>

            {/* KPI 3: Shop Rider Payouts */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Rider Earnings</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-4">₹{totalEarnings}</p>
              <div className="mt-2 text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <span>Calculated via ₹30 base + ₹15/km</span>
              </div>
            </div>

            {/* KPI 4: Avg Speed/Acceptance */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Acceptance Rate</span>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-4">{avgAcceptanceRate}%</p>
              <div className="mt-2 text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <span>Average order acceptance probability</span>
              </div>
            </div>
          </div>

          {/* Performance Highlights Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
            {/* Top Performer Card */}
            {top && (
              <div className="bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                <div className="p-4 bg-indigo-100 text-indigo-650 rounded-2xl shrink-0">
                  <ThumbsUp className="w-6 h-6 animate-bounce" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-650 bg-indigo-100 px-2.5 py-0.5 rounded-full">Top Performer</span>
                  <h3 className="text-lg font-black text-slate-800 truncate mt-1.5">{top.name}</h3>
                  <div className="flex gap-4 text-xs font-semibold text-slate-500 pt-1">
                    <p>Deliveries: <strong className="text-slate-800">{top.completedDeliveries}</strong></p>
                    <p>Acceptance: <strong className="text-slate-800">{top.acceptanceRate}%</strong></p>
                    <p>Earnings: <strong className="text-indigo-600">₹{top.totalEarnings}</strong></p>
                  </div>
                </div>
              </div>
            )}

            {/* Lowest Performer Card */}
            {lowest && (
              <div className="bg-gradient-to-br from-slate-50/50 to-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                <div className="p-4 bg-slate-100 text-slate-500 rounded-2xl shrink-0">
                  <ThumbsDown className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">Needs Improvement</span>
                  <h3 className="text-lg font-black text-slate-800 truncate mt-1.5">{lowest.name}</h3>
                  <div className="flex gap-4 text-xs font-semibold text-slate-500 pt-1">
                    <p>Deliveries: <strong className="text-slate-800">{lowest.completedDeliveries}</strong></p>
                    <p>Acceptance: <strong className="text-slate-800">{lowest.acceptanceRate}%</strong></p>
                    <p>Avg Speed: <strong className="text-slate-800">{lowest.avgDeliveryTime}m</strong></p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rider Ranking Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-6">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Approved Rider Performance Rankings</h3>
              <p className="text-[10px] text-slate-450 font-semibold mt-0.5">Comparative ranking statistics across all linked shop riders.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-[9px] font-bold uppercase tracking-wider border-b border-slate-100 select-none">
                    <th className="p-4 pl-6">Rider Name</th>
                    <th className="p-4 text-center">Completed Deliveries</th>
                    <th className="p-4 text-center">Acceptance Rate</th>
                    <th className="p-4 text-center">Completion Rate</th>
                    <th className="p-4 text-center">Avg Delivery Time</th>
                    <th className="p-4 text-center">Distance Logs</th>
                    <th className="p-4 text-center">Active Days</th>
                    <th className="p-4 text-center">Customer Satisfaction</th>
                    <th className="p-4 text-right pr-6">Earnings Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-semibold">
                  {analytics.map((record, index) => (
                    <tr key={record.riderId || index} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-850">{record.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{record.vehicleType} &bull; {record.phone}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-slate-800 font-bold text-sm">
                        {record.completedDeliveries}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                            record.acceptanceRate >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            record.acceptanceRate >= 50 ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-rose-50 text-rose-700 border-rose-100"
                          }`}>
                            {record.acceptanceRate}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                            record.completionRate >= 90 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            record.completionRate >= 70 ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-rose-50 text-rose-700 border-rose-100"
                          }`}>
                            {record.completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-slate-650">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{record.avgDeliveryTime > 0 ? `${record.avgDeliveryTime} min` : "N/A"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-slate-650">
                        <div className="flex items-center justify-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-slate-400" />
                          <span>{record.totalDistance} km</span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-slate-650">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{record.activeDays} days</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-400 select-none">
                          <Smile className="w-4 h-4 text-indigo-500" />
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            100% (Ready)
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right pr-6 font-black text-emerald-650 text-sm">
                        ₹{record.totalEarnings}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RiderAnalytics;
