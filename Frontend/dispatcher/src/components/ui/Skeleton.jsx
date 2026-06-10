import React from "react";

/**
 * Reusable loading skeleton primitives for DispatchFlow.
 */
export const Skeleton = ({ className = "", ...props }) => (
  <div className={`skeleton ${className}`} {...props} />
);

export const SkeletonText = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="skeleton skeleton-text"
        style={{ width: i === lines - 1 ? "70%" : "100%" }}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = "" }) => (
  <div className={`df-card p-6 space-y-4 ${className}`}>
    <div className="flex items-center gap-3">
      <div className="skeleton skeleton-avatar" />
      <div className="flex-1 space-y-2">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text w-1/3" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);

export const SkeletonKPI = () => (
  <div className="df-card p-6 space-y-4">
    <div className="flex justify-between">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton h-10 w-10 rounded-2xl" />
    </div>
    <div className="skeleton h-8 w-20" />
    <div className="skeleton h-3 w-32" />
  </div>
);

export default Skeleton;
