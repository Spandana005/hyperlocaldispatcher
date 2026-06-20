import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useShopStore from "../store/shopstore";
import useAuthStore from "../store/authstore";
import { 
  Store, 
  MapPin, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  Copy, 
  Check, 
  Loader2 
} from "lucide-react";
import { toast } from "react-hot-toast";

const CreateShop = () => {
  const navigate = useNavigate();
  const createShop = useShopStore((state) => state.createShop);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  const [formData, setFormData] = useState({
    shopName: "",
    address: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [createdShop, setCreatedShop] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.shopName || !formData.address || !formData.phone) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await createShop(formData);
      setCreatedShop(res.shop);
      toast.success("Shop registered successfully!");
      // Sync auth state to update shopProfile cached in localStorage/Zustand
      await checkAuth();
    } catch (err) {
      toast.error(err.message || "Failed to create shop. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (createdShop?.shopCode) {
      navigator.clipboard.writeText(createdShop.shopCode);
      setCopied(true);
      toast.success("Shop code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-6 bg-slate-50/50">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-8 sm:p-10 space-y-8 animate-scaleUp relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {!createdShop ? (
          <>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-sm animate-pulse">
                <Store className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Set Up Your Shop</h1>
              <p className="text-slate-500 text-xs font-semibold max-w-sm mx-auto leading-relaxed">
                Create your shop to start dispatching orders and managing delivery riders in your local area.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Shop Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" /> Shop Name
                </label>
                <input
                  type="text"
                  name="shopName"
                  placeholder="e.g. Fresh Grocers"
                  value={formData.shopName}
                  onChange={handleChange}
                  className="w-full border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 p-3.5 rounded-xl outline-none text-sm transition-all bg-slate-50/50"
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Address
                </label>
                <textarea
                  name="address"
                  placeholder="Full physical store address..."
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 p-3.5 rounded-xl outline-none text-sm transition-all bg-slate-50/50 h-24 resize-none"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 p-3.5 rounded-xl outline-none text-sm transition-all bg-slate-50/50"
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-450 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Shop...</span>
                  </>
                ) : (
                  <>
                    <span>Initialize Shop</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-8 animate-scaleUp text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Shop Created Successfully!</h2>
              <p className="text-slate-450 text-xs font-semibold leading-relaxed max-w-sm mx-auto">
                Share this unique Shop Code with your riders so they can join your delivery network.
              </p>
            </div>

            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/30 flex flex-col items-center justify-center space-y-3 relative overflow-hidden max-w-sm mx-auto">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Unique Shop Code</span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-indigo-950 font-mono tracking-widest selection:bg-indigo-100">
                  {createdShop.shopCode}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-100/50 rounded-lg transition-colors cursor-pointer"
                  title="Copy Shop Code"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate("/shop/dashboard")}
              className="w-full max-w-sm bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mx-auto"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateShop;
