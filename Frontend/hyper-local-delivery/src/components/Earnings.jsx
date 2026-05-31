import React, { useEffect, useState } from "react";
import useAuthStore from "../store/authstore";
import API from "../api";

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Heading */}
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Earnings Summary
        </h1>
        <p className="text-gray-500 mt-2">
          Track your delivery statistics, payouts, and historical transaction statements.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          {/* Earnings Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Today Earnings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                💰 Today Earnings
              </h2>
              <p className="text-4xl font-black text-green-600 mt-4">
                ₹{earningsData.todayEarnings}
              </p>
            </div>

            {/* Weekly Earnings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                📅 Weekly Earnings
              </h2>
              {/* Approximately sum the last 7 days of history */}
              <p className="text-4xl font-black text-blue-600 mt-4">
                ₹{
                  earningsData.history
                    .filter(item => {
                      const date = new Date(item.date);
                      const diffTime = Math.abs(new Date() - date);
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays <= 7;
                    })
                    .reduce((sum, item) => sum + item.amount, 0)
                }
              </p>
            </div>

            {/* Total Earnings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                📈 Total Earnings
              </h2>
              <p className="text-4xl font-black text-purple-600 mt-4">
                ₹{earningsData.totalEarnings}
              </p>
            </div>

            {/* Completed Deliveries */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                ✅ Completed Deliveries
              </h2>
              <p className="text-4xl font-black text-orange-500 mt-4">
                {earningsData.completedOrders}
              </p>
            </div>
          </div>

          {/* Daily Delivery Track Breakdown */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mt-10">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                📅 Daily Completed Deliveries
              </h2>
              <p className="text-gray-500 text-xs mt-1">Summary of completed deliveries and total money earned on each calendar day.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Day</th>
                    <th className="p-4">Completed Deliveries</th>
                    <th className="p-4">Daily Earning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                  {getDailyBreakdown().length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-10 text-gray-400">
                        No deliveries recorded yet.
                      </td>
                    </tr>
                  ) : (
                    getDailyBreakdown().map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-semibold text-gray-900">{row.day}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {row.count} {row.count === 1 ? 'delivery' : 'deliveries'}
                          </span>
                        </td>
                        <td className="p-4 font-black text-green-600">₹{row.earnings}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Earnings History Logs */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mt-10">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                Earnings Logs
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Date</th>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Distance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Earning Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                  {earningsData.history.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-20 text-gray-400">
                        <div className="flex flex-col items-center">
                          <span className="text-6xl mb-4">💰</span>
                          <p className="text-lg font-semibold text-gray-500">No Earnings Record Yet</p>
                          <p className="text-gray-400 text-sm mt-1">Completed deliveries will credit earnings dynamically based on shop-to-customer distance (₹15/km, min ₹30).</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    earningsData.history.map((record, index) => (
                      <tr key={record._id || index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          {new Date(record.date).toLocaleDateString()} at {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 font-mono text-gray-500">
                          #{record.orderId?._id?.slice(-8) || record.orderId?.toString()?.slice(-8) || "N/A"}
                        </td>
                        <td className="p-4 font-semibold text-gray-900">
                          {record.customerName}
                        </td>
                        <td className="p-4 font-medium text-gray-600">
                          {record.distance ? `${record.distance} km` : "N/A"}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                            Delivered
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
        </>
      )}
    </div>
  );
};

export default Earnings;