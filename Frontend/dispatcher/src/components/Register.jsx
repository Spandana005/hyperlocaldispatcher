import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authstore";
import { Logo } from "./Logo";
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  User,
  Activity,
  CreditCard
} from "lucide-react";
import { toast } from "react-hot-toast";

const Register = () => {
  const navigate = useNavigate();

  // Zustand Register Function
  const register = useAuthStore((state) => state.register);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "rider",
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
      // Backend Register API
      await register(formData);
      toast.success("Account registered successfully! Please sign in.");
      navigate("/login");
    } catch (error) {
      toast.error(error.message || "Registration failed. Check details.");
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
            Register your profile and join the dispatch network.
          </h2>

          <div className="space-y-5">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl mt-0.5">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">For Business Administrators</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Manage store setups, coordinates, order creation forms, and assign packages to riders nearby.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl mt-0.5">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">For Delivery Riders</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Receive orders, track dispatch status, and automatically claim payouts based on trip distance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="z-10 flex items-center gap-2 border-t border-slate-800 pt-6">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-400">
            Secure GDPR compliant credentials storage.
          </span>
        </div>
      </div>

      {/* Right panel: Register Form */}
      <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div>
            <div className="lg:hidden mb-4">
              <Logo size="md" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Create Account
            </h1>
            <p className="text-slate-500 text-xs mt-1.5 font-semibold">
              Get started with your delivery operations account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-xl outline-none text-sm transition-all bg-slate-50/50"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-xl outline-none text-sm transition-all bg-slate-50/50"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-xl outline-none text-sm transition-all bg-slate-50/50"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-xl outline-none text-sm transition-all bg-slate-50/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Role select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
                Account Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-xl outline-none text-sm transition-all bg-slate-50/50 cursor-pointer"
              >
                <option value="rider">Delivery Rider (GPS Location & Earnings)</option>
                <option value="admin">Operations Admin (Dispatching & Monitoring)</option>
              </select>
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-xs text-slate-500 font-semibold mt-4">
            Already have an account?
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 ml-1.5 font-bold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;