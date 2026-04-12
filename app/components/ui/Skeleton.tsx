import React from "react";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div 
      className={`relative overflow-hidden bg-white/5 rounded-lg ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
    </div>
  );
}

export function SkeletonCircle({ size = "w-10 h-10" }: { size?: string }) {
  return <Skeleton className={`${size} rounded-full`} />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number, className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} 
        />
      ))}
    </div>
  );
}
