import React, { useEffect } from "react";
import useShopStore from "../store/shopstore";
import useApprovalStore from "../store/approvalstore";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Phone, 
  Mail, 
  ShieldAlert, 
  CheckCircle,
  Truck,
  Compass
} from "lucide-react";
import { toast } from "react-hot-toast";

const ShopRiders = () => {
  const { riders, fetchRiders } = useShopStore();
  const { pendingRequests, rejectedRequests, fetchRequests, approveRider, rejectRider } = useApprovalStore();

  useEffect(() => {
    fetchRiders();
    fetchRequests("Pending");
    fetchRequests("Rejected");
  }, []);

  const handleApprove = async (riderId) => {
    try {
      await approveRider(riderId);
      toast.success("Rider approved successfully!");
      fetchRiders();
    } catch (err) {
      toast.error(err.message || "Failed to approve rider");
    }
  };

  const handleReject = async (riderId) => {
    try {
      await rejectRider(riderId);
      toast.success("Rider request rejected.");
    } catch (err) {
      toast.error(err.message || "Failed to reject rider");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            Riders Hub
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-1">
            Authorize rider requests to join your delivery network and monitor active rider dispatch status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Approved Rider Network */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-650" />
              Approved Delivery Network ({riders.length})
            </h2>

            {riders.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                No approved riders in your network. Share your Shop Code to onboard riders.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {riders.map((rider) => (
                  <div key={rider._id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3 relative overflow-hidden flex flex-col justify-between">
                    <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      rider.isAvailable
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      {rider.isAvailable ? "Available" : "On Delivery"}
                    </span>

                    <div className="space-y-1 pr-16">
                      <h4 className="font-bold text-slate-800 text-sm">{rider.userId?.name}</h4>
                      <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{rider.vehicleType}</p>
                    </div>

                    <div className="space-y-1 text-[10px] text-slate-500 font-semibold border-t border-slate-100 pt-2.5">
                      <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {rider.userId?.phone || "No phone"}</p>
                      <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {rider.userId?.email}</p>
                    </div>

                    <div className="bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-50/50 flex justify-between text-[10px] font-bold text-indigo-650 mt-1">
                      <span>Total Earned: ₹{rider.earnings || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Pending & Rejected Requests */}
        <div className="space-y-6">
          {/* Pending requests */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-650" />
              Pending Requests ({pendingRequests.length})
            </h2>

            {pendingRequests.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                No pending requests.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingRequests.map((request) => (
                  <div key={request._id} className="py-3 flex flex-col gap-2.5 first:pt-0 last:pb-0">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{request.userId?.name}</h4>
                      <p className="text-[9px] text-slate-400 font-semibold">{request.userId?.email}</p>
                      <p className="text-[9px] text-slate-400 font-semibold">{request.userId?.phone || "No phone"}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReject(request._id)}
                        className="flex-1 py-1.5 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer text-center"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(request._id)}
                        className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[9px] font-bold uppercase shadow-sm transition-all cursor-pointer text-center"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rejected requests list */}
          {rejectedRequests.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <UserX className="w-5 h-5 text-rose-600" />
                Rejected ({rejectedRequests.length})
              </h2>

              <div className="divide-y divide-slate-100">
                {rejectedRequests.map((request) => (
                  <div key={request._id} className="py-3 flex items-center justify-between gap-2 first:pt-0 last:pb-0">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{request.userId?.name}</h4>
                      <p className="text-[9px] text-slate-400 font-semibold">{request.userId?.email}</p>
                    </div>
                    <span className="text-[9px] text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full font-bold uppercase">Rejected</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopRiders;
