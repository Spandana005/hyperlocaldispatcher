import React from "react";
import { Settings, Save, AlertCircle } from "lucide-react";

const BusinessSettings = () => {
  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Business Settings
          </h1>
          <p className="text-slate-550 mt-1.5 text-xs font-semibold">
            Global platform configuration and business rules.
          </p>
        </div>
      </div>

      {/* Placeholder Settings Form */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50/50 border border-blue-100 text-blue-800 rounded-2xl text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <p>These settings affect all shops and riders across the platform.</p>
        </div>

        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          
          {/* Section: Platform Fees */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Platform Fees & Commissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Default Platform Commission (%)
                </label>
                <input
                  type="number"
                  disabled
                  defaultValue="15"
                  className="w-full border border-slate-200 p-3 rounded-xl outline-none text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Rider Base Fare (₹)
                </label>
                <input
                  type="number"
                  disabled
                  defaultValue="30"
                  className="w-full border border-slate-200 p-3 rounded-xl outline-none text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section: Operational Rules */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Operational Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Max Delivery Radius (km)
                </label>
                <input
                  type="number"
                  disabled
                  defaultValue="10"
                  className="w-full border border-slate-200 p-3 rounded-xl outline-none text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Auto-Assign Timeout (seconds)
                </label>
                <input
                  type="number"
                  disabled
                  defaultValue="120"
                  className="w-full border border-slate-200 p-3 rounded-xl outline-none text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled
              className="bg-slate-300 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 cursor-not-allowed"
            >
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessSettings;
