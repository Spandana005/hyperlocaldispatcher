import React from "react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800">
      <div className="text-center">
        <h1 className="text-sm font-bold text-white tracking-wider uppercase">
          Dispatch<span className="text-blue-500">Flow</span>
        </h1>
        <p className="text-[10px] text-slate-500 mt-1">
          Smart Local Delivery Operations Platform • High-Performance Logistics
        </p>
        <p className="text-[10px] text-slate-650 mt-3 font-semibold">
          © {new Date().getFullYear()} DispatchFlow. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;