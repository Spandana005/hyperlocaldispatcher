import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useRiderStore from "../store/riderstore";
import useAuthStore from "../store/authstore";
import { 
  Compass, 
  ArrowRight, 
  ShieldAlert, 
  Loader2 
} from "lucide-react";
import { toast } from "react-hot-toast";

const JoinShop = () => {
  const navigate = useNavigate();
  const joinShop = useRiderStore((state) => state.joinShop);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const logout = useAuthStore((state) => state.logout);

  const [shopCode, setShopCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopCode.trim()) {
      toast.error("Please enter a shop code");
      return;
    }

    setLoading(true);
    try {
      await joinShop(shopCode.trim());
      toast.success("Join request submitted!");
      // Re-evaluate auth state to update riderProfile in state
      await checkAuth();
      navigate("/pending-approval");
    } catch (err) {
      toast.error(err.message || "Invalid shop code. Check and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-6 bg-slate-50/50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-8 sm:p-10 space-y-8 animate-scaleUp relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center mx-auto border border-green-100 shadow-sm animate-pulse">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Join a Shop</h1>
          <p className="text-slate-500 text-xs font-semibold max-w-xs mx-auto leading-relaxed">
            Enter the unique Shop Code provided by your shop owner to request authorization into the dispatch network.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Code Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
              Shop Code
            </label>
            <input
              type="text"
              placeholder="SHOP-XXXXXX"
              value={shopCode}
              onChange={(e) => setShopCode(e.target.value.toUpperCase())}
              className="w-full border border-slate-200 hover:border-slate-300 focus:border-green-600 focus:ring-2 focus:ring-green-100 p-3.5 rounded-xl outline-none text-sm font-mono tracking-wider transition-all bg-slate-50/50 text-center uppercase"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <span>Submit Request</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex justify-center border-t border-slate-100 pt-4">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold hover:underline transition-all cursor-pointer"
          >
            Sign Out Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinShop;
