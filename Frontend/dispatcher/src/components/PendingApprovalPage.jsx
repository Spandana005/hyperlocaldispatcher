import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authstore";
import useRiderStore from "../store/riderStore";
import { 
  Clock, 
  XCircle, 
  RefreshCw, 
  ArrowRight, 
  LogOut, 
  Compass 
} from "lucide-react";
import { toast } from "react-hot-toast";

const PendingApprovalPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const logout = useAuthStore((state) => state.logout);
  const joinShop = useRiderStore((state) => state.joinShop);

  const [checking, setChecking] = useState(false);
  const [shopCode, setShopCode] = useState("");
  const [loading, setLoading] = useState(false);

  const status = user?.riderProfile?.approvalStatus || "Pending";
  const shopName = user?.riderProfile?.shopId?.shopName || "Selected Shop";

  // Recheck approval status
  const handleRecheck = async () => {
    setChecking(true);
    try {
      await checkAuth();
      const updatedUser = useAuthStore.getState().user;
      if (updatedUser?.riderProfile?.approvalStatus === "Approved") {
        toast.success("Congratulations! Your account is approved!");
        navigate("/rider/dashboard");
      } else {
        toast.success("Status updated.");
      }
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setChecking(false);
    }
  };

  const handleJoinDifferent = async (e) => {
    e.preventDefault();
    if (!shopCode.trim()) {
      toast.error("Enter shop code");
      return;
    }
    setLoading(true);
    try {
      await joinShop(shopCode.trim());
      toast.success("Submitted new join request!");
      await checkAuth();
    } catch (err) {
      toast.error(err.message || "Invalid shop code");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-6 bg-slate-50/50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-8 sm:p-10 space-y-8 animate-scaleUp relative">
        
        {status === "Pending" ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-amber-550/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100 shadow-sm animate-bounce">
              <Clock className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Awaiting Shop Approval</h1>
              <p className="text-slate-550 text-xs font-semibold leading-relaxed">
                Your request to join <span className="text-indigo-650 font-bold">{shopName}</span> is pending review by the shop owner.
              </p>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/35 text-xs text-amber-750 font-medium leading-relaxed">
              Once the shop owner approves your request, you'll gain full access to nearby orders, live tracking, and earnings ledger.
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRecheck}
                disabled={checking}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-755 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
                <span>{checking ? "Checking Status..." : "Refresh Status"}</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-slate-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out Account</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
              <XCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Request Rejected</h1>
              <p className="text-slate-505 text-xs font-semibold leading-relaxed">
                Your request to join <span className="text-rose-600 font-bold">{shopName}</span> has been rejected.
              </p>
            </div>

            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/35 text-xs text-rose-750 font-medium">
              You can re-apply to a different shop by entering their Shop Code below.
            </div>

            <form onSubmit={handleJoinDifferent} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  New Shop Code
                </label>
                <input
                  type="text"
                  placeholder="SHOP-XXXXXX"
                  value={shopCode}
                  onChange={(e) => setShopCode(e.target.value.toUpperCase())}
                  className="w-full border border-slate-200 p-3.5 rounded-xl text-center font-mono outline-none text-sm transition-all bg-slate-50/50 uppercase"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>Submit Request</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <button
              onClick={handleLogout}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-slate-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovalPage;
