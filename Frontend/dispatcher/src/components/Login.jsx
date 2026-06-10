import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/authstore";
import { Logo } from "./Logo";
import { 
  MapPin, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Eye, 
  EyeOff,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { toast } from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();

  // Zustand Login Function
  const login = useAuthStore((state) => state.login);

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle Change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend Login API
      const response = await login(formData);
      toast.success(`Welcome back, ${response.user.name}!`);

      // Redirect Based On Role
      if (response.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/rider/dashboard");
      }
    } catch (error) {
      toast.error(error.message || "Failed to sign in. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-xl max-w-6xl mx-auto my-4 animate-scaleUp">
      {/* Left panel: Product Highlights (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Decorative background vectors */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Header */}
        <div className="z-10">
          <Logo size="lg" light={true} />
          <p className="text-xs font-semibold text-slate-400 mt-2 tracking-wider uppercase">
            Smart Local Delivery Operations Platform
          </p>
        </div>

        {/* Content Highlights */}
        <div className="space-y-8 z-10 max-w-md">
          <h2 className="text-3xl font-black leading-tight tracking-tight">
            Streamline local operations, dispatch orders, track in real-time.
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Real-time GPS Tracking</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Monitor rider locations, speeds, and delivery status updates live on OpenStreetMap.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl mt-0.5">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Automated Payout Ledgers</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Rider earnings calculated dynamically based on shop-to-customer GPS distance.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl mt-0.5">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Rider Operations Panel</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Simple tools for riders to manage assignments, view nearby orders, and accept requests.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="z-10 flex items-center gap-2 border-t border-slate-800 pt-6">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-400">
            Enterprise Grade Security & Auth Policies Active.
          </span>
        </div>
      </div>

      {/* Right panel: Login Form */}
      <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <div className="lg:hidden mb-6">
              <Logo size="md" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Sign In
            </h1>
            <p className="text-slate-500 text-xs mt-1.5 font-semibold">
              Enter your credential details below to access the console dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3.5 rounded-xl outline-none text-sm transition-all bg-slate-50/50"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3.5 rounded-xl outline-none text-sm transition-all bg-slate-50/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-xs text-slate-500 font-semibold mt-4">
            Don't have an account?
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 ml-1.5 font-bold hover:underline"
            >
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;