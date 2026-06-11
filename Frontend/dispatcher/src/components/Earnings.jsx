import React, { useEffect, useState } from "react";
import useAuthStore from "../store/authstore";
import API from "../api";
import { 
  CircleDollarSign, 
  CheckCircle, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  Clock, 
  MapPin,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";

const Earnings = () => {
  const user = useAuthStore((state) => state.user);
  const [earningsData, setEarningsData] = useState({
    completedOrders: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    history: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      fetchEarnings();
    }
  }, [user?._id]);

  const fetchEarnings = async () => {
    try {
      const res = await API.get(`/api/earnings/${user._id}`);
      setEarningsData(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching earnings:", err);
      setLoading(false);
    }
  };

  // Calculate daily completed deliveries breakdown
  const getDailyBreakdown = () => {
    const dailyMap = {};
    earningsData.history.forEach((record) => {
      const dateKey = new Date(record.date).toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          count: 0,
          earnings: 0,
        };
      }
      dailyMap[dateKey].count += 1;
      dailyMap[dateKey].earnings += record.amount;
    });

    return Object.entries(dailyMap).map(([day, stats]) => ({
      day,
      count: stats.count,
      earnings: stats.earnings,
    }));
  };

  // Calculate weekly sum
  const getWeeklyEarnings = () => {
    return earningsData.history
      .filter(item => {
        const date = new Date(item.date);
        const diffTime = Math.abs(new Date() - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      })
      .reduce((sum, item) => sum + item.amount, 0);
  };


  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Earnings Ledger
          </h1>
          <p className="text-slate-550 mt-1 text-xs font-semibold">
            Track daily completed shipments, dynamic distance payouts, and financial statement logs.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Today's Payouts */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today Earnings</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-600 mt-4">₹{earningsData.todayEarnings}</p>
            </div>

            {/* Weekly Payouts */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weekly Earnings</span>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-blue-600 mt-4">₹{getWeeklyEarnings()}</p>
            </div>

            {/* Total Payouts */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Earnings</span>
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-purple-600 mt-4">₹{earningsData.totalEarnings}</p>
            </div>

            {/* Completed deliveries */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deliveries Completed</span>
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-4">{earningsData.completedOrders}</p>
            </div>
          </div>

          {/* Double Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1 (2/3 width): Weekly payouts visual chart & Daily summary */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Inline SVG Chart */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Earnings Activity</h3>
                    <p className="text-[10px] text-slate-450 font-semibold mt-0.5">Visual representation of weekly distance payouts</p>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3.5 h-3.5" /> +15% Payout rate
                  </span>
                </div>

                <div className="w-full h-40 bg-slate-50/50 border border-slate-100/50 rounded-2xl p-2 relative">
                  <svg viewBox="0 0 600 120" className="w-full h-full">
                    {/* Grid Lines */}
                    <line x1="40" y1="20" x2="560" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="60" x2="560" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="100" x2="560" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                    
                    {/* Bar chart representing payouts weekly */}
                    {/* Mon */}
                    <rect x="75" y="40" width="18" height="60" fill="#10B981" rx="4" />
                    {/* Tue */}
                    <rect x="150" y="60" width="18" height="40" fill="#10B981" rx="4" />
                    {/* Wed */}
                    <rect x="225" y="30" width="18" height="70" fill="#10B981" rx="4" />
                    {/* Thu */}
                    <rect x="300" y="80" width="18" height="20" fill="#10B981" rx="4" />
                    {/* Fri */}
                    <rect x="375" y="25" width="18" height="75" fill="#10B981" rx="4" />
                    {/* Sat */}
                    <rect x="450" y="10" width="18" height="90" fill="#2563EB" rx="4" />
                    {/* Sun */}
                    <rect x="525" y="15" width="18" height="85" fill="#2563EB" rx="4" />
                    
                    {/* Axis Labels */}
                    <text x="84" y="115" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">M</text>
                    <text x="159" y="115" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">T</text>
                    <text x="234" y="115" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">W</text>
                    <text x="309" y="115" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">T</text>
                    <text x="384" y="115" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">F</text>
                    <text x="459" y="115" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">S</text>
                    <text x="534" y="115" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">S</text>
                  </svg>
                </div>
              </div>

              {/* Daily completed breakdown table */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                  <h3 className="font-bold text-slate-800 text-sm">Daily Deliveries Ledger</h3>
                  <p className="text-[10px] text-slate-450 font-semibold mt-0.5">Daily completed tasks and earnings breakdown</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50/70 text-slate-450 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="p-4 pl-6">Day Statement</th>
                        <th className="p-4">Completed Deliveries</th>
                        <th className="p-4 text-right pr-6">Daily Earning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-semibold">
                      {getDailyBreakdown().length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-10 text-slate-400">
                            No statements registered yet.
                          </td>
                        </tr>
                      ) : (
                        getDailyBreakdown().map((row, index) => (
                          <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-4 pl-6 text-slate-850 font-bold">{row.day}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-150">
                                {row.count} {row.count === 1 ? 'shipment' : 'shipments'}
                              </span>
                            </td>
                            <td className="p-4 text-right pr-6 font-black text-green-600">₹{row.earnings}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Column 2 (1/3 width): Historical statements list */}
            <div className="space-y-8">
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 max-h-[580px] overflow-y-auto pr-1">
                <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Payout History logs</h3>
                    <p className="text-[10px] text-slate-450 font-semibold mt-0.5">Chronological transaction ledgers</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {earningsData.history.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-[10px] font-semibold">No payout logs registered</div>
                  ) : (
                    earningsData.history.map((record, index) => (
                      <div 
                        key={record._id || index} 
                        className="p-3.5 border border-slate-50 bg-slate-50/30 hover:bg-slate-50 rounded-2xl flex flex-col gap-2 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{record.customerName}</p>
                            <span className="font-mono text-[9px] text-slate-400">Order ID: #{record.orderId?.toString().slice(-5)}</span>
                          </div>
                          <span className="font-black text-xs text-green-600">+₹{record.amount}</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold border-t border-slate-100/50 pt-2 mt-1">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {record.distance || "?"} km</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(record.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Earnings;