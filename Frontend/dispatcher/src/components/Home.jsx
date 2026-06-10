import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import {
  Package,
  MapPin,
  CircleDollarSign,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
} from "lucide-react";

const Home = () => {
  const features = [
    {
      icon: Package,
      title: "Dispatch Board",
      description: "Create, assign, and manage delivery orders with real-time status tracking.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: MapPin,
      title: "Live Operations Hub",
      description: "Track riders and deliveries on an interactive map with GPS coordinates.",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: CircleDollarSign,
      title: "Earnings & Analytics",
      description: "Riders monitor payouts; admins view KPIs and delivery performance metrics.",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const stats = [
    { value: "99.2%", label: "On-time delivery rate" },
    { value: "< 30s", label: "Average dispatch time" },
    { value: "24/7", label: "Live tracking uptime" },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <section className="relative overflow-hidden df-card p-10 md:p-16 text-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <Logo size="lg" />
          <p className="df-caption mt-4 text-blue-600">
            Enterprise Logistics Platform
          </p>

          <h1 className="df-display mt-6 max-w-3xl">
            Orchestrate local deliveries with{" "}
            <span className="text-blue-600">precision</span> and{" "}
            <span className="text-emerald-600">speed</span>
          </h1>

          <p className="df-body mt-4 max-w-2xl text-base">
            DispatchFlow gives store operators and delivery teams a unified command
            center — from order creation to live GPS tracking and earnings
            reconciliation.
          </p>

          <div className="flex flex-wrap gap-4 mt-8 justify-center">
            <Link to="/login" className="df-btn-primary px-6 py-3 flex items-center gap-2">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="df-btn-secondary px-6 py-3 flex items-center gap-2"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {stats.map((stat) => (
          <div key={stat.label} className="df-card p-5 text-center">
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="df-caption mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <section className="mt-12">
        <div className="text-center mb-8">
          <h2 className="df-heading-1">Built for modern dispatch teams</h2>
          <p className="df-body mt-2">
            Everything you need to run hyper-local delivery operations at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description, color }) => (
            <div key={title} className="df-card p-6 hover:shadow-lg transition-shadow group">
              <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="df-heading-2 text-base">{title}</h3>
              <p className="df-body mt-2 text-xs leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="mt-12 df-card p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-bold text-slate-900 text-sm">Role-based access control</p>
              <p className="text-xs text-slate-500">Separate admin and rider portals with secure JWT auth.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="font-bold text-slate-900 text-sm">Real-time Socket.IO sync</p>
              <p className="text-xs text-slate-500">Live order and location updates across all dashboards.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <div>
              <p className="font-bold text-slate-900 text-sm">Operations analytics</p>
              <p className="text-xs text-slate-500">KPI dashboards, rider performance, and earnings reports.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
