import React, { useEffect, useState } from "react";
import API from "../api";
import useTrackingStore from "../store/trackingstore";
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Map, 
  CheckCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  Package, 
  ChevronRight,
  ShieldCheck,
  Compass,
  AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);

  const startTracking = useTrackingStore((state) => state.startTracking);
  const stopTracking = useTrackingStore((state) => state.stopTracking);

  useEffect(() => {
    fetchOrders();
    fetchAvailableOrders();
    const interval = setInterval(() => {
      fetchOrders();
      fetchAvailableOrders();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/api/rider/my-orders");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      const res = await API.get("/api/rider/available-orders");
      setAvailableOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const respondOrder = async (orderId, action) => {
    try {
      await API.put(`/api/rider/respond-order/${orderId}`, { action });
      if (action === "accept") {
        toast.success("Order accepted! Shipments added to assignments.");
      } else {
        toast.error("Order request rejected.");
      }
      fetchOrders();
      fetchAvailableOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to respond to order");
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await API.put(`/api/rider/update-status/${orderId}`, { status });
      toast.success(`Shipment marked as ${status}!`);

      // Geolocation live tracking reaction
      if (status === "dispatched") {
        console.log(`[MY ORDERS] Order ${orderId} dispatched. Starting location tracking.`);
        startTracking(orderId);
      } else if (status === "delivered") {
        console.log(`[MY ORDERS] Order ${orderId} delivered. Stopping location tracking.`);
        await stopTracking();
      }

      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Orders Board
          </h1>
          <p className="text-slate-550 mt-1 text-xs font-semibold">
            Claim available local requests and manage active dispatched orders.
          </p>
        </div>
      </div>

      {/* AVAILABLE ORDERS (Nearby requests) */}
      {availableOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-amber-600 flex items-center gap-1.5 px-1 animate-pulse">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Nearby Dispatch Alerts ({availableOrders.length})
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-3xl p-6 border-2 border-amber-200 shadow-xl flex flex-col justify-between relative overflow-hidden"
              >
                {/* Visual badge */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <h3 className="font-extrabold text-slate-800 text-sm">{order.customerName}</h3>
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                      Request
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
                    <div className="space-y-2">
                      <p>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Phone</span>
                        <span className="text-slate-800">{order.phone}</span>
                      </p>
                      <p>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Items Details</span>
                        <span className="text-slate-800 italic">{order.orderDetails}</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Locality Address</span>
                        <span className="text-slate-700 leading-relaxed block">
                          {order.address?.building}, {order.address?.area}, {order.address?.city}
                        </span>
                      </p>
                      {order.address?.landmark && (
                        <p>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Landmark</span>
                          <span className="text-slate-750">{order.address.landmark}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 mt-6 border-t border-slate-50 pt-4 select-none">
                  <button
                    onClick={() => respondOrder(order._id, "accept")}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => respondOrder(order._id, "reject")}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASSIGNED ACTIVE LISTS */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-800 px-1">My Active Assignments</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.length === 0 ? (
            <div className="col-span-2 bg-white rounded-3xl p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
              <span className="text-6xl mb-4">📦</span>
              <h3 className="font-bold text-slate-700 text-sm">No Active Shipments Assigned</h3>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs text-center leading-relaxed">
                Accepted orders and active dispatcher task workloads will display here.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <h3 className="font-extrabold text-slate-800 text-sm">{order.customerName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border
                      ${order.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-100" : ""}
                      ${order.status === "dispatched" ? "bg-purple-50 text-purple-700 border-purple-100" : ""}
                      ${order.status === "delivered" ? "bg-green-50 text-green-700 border-green-100" : ""}
                      ${["assigned", "accepted"].includes(order.status) ? "bg-blue-50 text-blue-700 border-blue-100" : ""}
                    `}>
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
                    <div className="space-y-2">
                      <p>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Contact Phone</span>
                        <span className="text-slate-800 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {order.phone}
                        </span>
                      </p>
                      <p>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Description</span>
                        <span className="text-slate-800 italic">{order.orderDetails}</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Locality address</span>
                        <span className="text-slate-700 leading-relaxed block">
                          {order.address?.building}, {order.address?.area}, {order.address?.city}
                        </span>
                      </p>
                      {order.address?.landmark && (
                        <p>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Landmark</span>
                          <span className="text-slate-750">{order.address.landmark}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-6 border-t border-slate-50 pt-4 select-none">
                  {order.status === "accepted" && (
                    <button
                      onClick={() => updateStatus(order._id, "dispatched")}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Compass className="w-3.5 h-3.5" /> Start Delivery
                    </button>
                  )}
                  {order.status === "dispatched" && (
                    <button
                      onClick={() => updateStatus(order._id, "delivered")}
                      className="bg-green-650 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Delivered
                    </button>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation?.lat || 0},${order.deliveryLocation?.lng || 0}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Map className="w-3.5 h-3.5" /> Open Maps
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* STATUS GUIDE */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-600" /> Delivery Status Guide
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
          <div className="space-y-1">
            <h3 className="font-extrabold text-amber-600 uppercase tracking-wide">🟡 Assigned</h3>
            <p className="text-slate-500 leading-relaxed">
              Order dispatch registered by admin. Waiting for courier review and approval.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-blue-600 uppercase tracking-wide">🔵 Dispatched</h3>
            <p className="text-slate-500 leading-relaxed">
              Rider is on trip. Live GPS broadcast is syncing route updates to administrative hub.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-green-600 uppercase tracking-wide">🟢 Delivered</h3>
            <p className="text-slate-500 leading-relaxed">
              Shipment completed successfully. Payout earnings are automatically credited to ledger history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;