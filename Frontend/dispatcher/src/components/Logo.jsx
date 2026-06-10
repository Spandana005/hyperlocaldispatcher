import React from "react";

/**
 * Brand logo icon mark for DispatchFlow.
 * Represents a delivery route, location pin, and speed/movement.
 */
export const LogoMark = ({ className = "h-8 w-8", ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      {...props}
    >
      {/* Background glow path */}
      <path
        d="M20 75 C 35 75, 45 45, 60 45 C 75 45, 80 25, 80 25"
        stroke="url(#route-glow)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.15"
      />
      
      {/* Active Route Path */}
      <path
        d="M20 75 C 35 75, 45 45, 60 45 C 75 45, 80 25, 80 25"
        stroke="url(#route-gradient)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 4"
        className="animate-[dash_2s_linear_infinite]"
      />
      
      {/* Connection dots (Dispatch Network) */}
      <circle cx="20" cy="75" r="4" fill="#64748B" />
      <circle cx="42.5" cy="60" r="3" fill="#64748B" />
      <circle cx="57.5" cy="45" r="3" fill="#64748B" />

      {/* Speed Lines */}
      <line x1="12" y1="71" x2="6" y2="71" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
      <line x1="15" y1="77" x2="8" y2="77" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />

      {/* Location Pin at destination */}
      <g transform="translate(80, 25) scale(0.95)">
        {/* Pin Drop Shadow */}
        <ellipse cx="0" cy="12" rx="6" ry="2" fill="#0F172A" opacity="0.25" />
        
        {/* Pin Body */}
        <path
          d="M0 -15 C -8 -15, -10 -7, 0 10 C 10 -7, 8 -15, 0 -15 Z"
          fill="url(#pin-gradient)"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        {/* Pin Inner Hole */}
        <circle cx="0" cy="-6" r="3.5" fill="#FFFFFF" />
      </g>

      <defs>
        {/* Route Gradient */}
        <linearGradient id="route-gradient" x1="20" y1="75" x2="80" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Route Glow */}
        <linearGradient id="route-glow" x1="20" y1="75" x2="80" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Pin Gradient */}
        <linearGradient id="pin-gradient" x1="0" y1="-15" x2="0" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </svg>
  );
};

/**
 * Combined LogoMark + Wordmark brand component.
 */
export const Logo = ({ size = "md", light = false, ...props }) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textClasses = {
    sm: "text-lg font-bold tracking-tight",
    md: "text-2xl font-black tracking-tight",
    lg: "text-4xl font-black tracking-tight",
  };

  const textStyle = light ? "text-white" : "text-slate-900";

  return (
    <div className="flex items-center gap-2 select-none" {...props}>
      <LogoMark className={sizeClasses[size]} />
      <span className={`${textClasses[size]} ${textStyle}`}>
        Dispatch<span className="text-blue-600">Flow</span>
      </span>
    </div>
  );
};

export default Logo;
