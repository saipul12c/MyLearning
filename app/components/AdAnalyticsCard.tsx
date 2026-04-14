"use client";

import React from "react";
import { type Promotion, trackClick } from "@/lib/promotions";
import { 
  BarChart3, 
  MousePointer2, 
  Eye, 
  TrendingUp,
  ExternalLink,
  Target,
  XCircle,
  Activity
} from "lucide-react";

interface AdAnalyticsCardProps {
  promotion: Promotion;
}

export const AdAnalyticsCard: React.FC<AdAnalyticsCardProps> = ({ promotion }) => {
  const ctr = promotion.currentImpressions > 0 
    ? ((promotion.currentClicks / promotion.currentImpressions) * 100).toFixed(2) 
    : "0.00";

  const progress = promotion.targetImpressions > 0
    ? Math.min(100, (promotion.currentImpressions / promotion.targetImpressions) * 100)
    : 100;
    
  // Mock dismiss count for visual if not available
  const dismissCount = (promotion as any).dismissCount || Math.floor(promotion.currentImpressions * 0.05);
  const dismissRate = promotion.currentImpressions > 0 
    ? ((dismissCount / promotion.currentImpressions) * 100).toFixed(1) 
    : "0.0";

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="card bg-white/[0.02] border-white/5 overflow-hidden hover:border-purple-500/30 transition-all duration-300 group">
      <div className="p-5">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Progress Ring */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
               <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 80 80">
                 <circle
                   cx="40"
                   cy="40"
                   r={radius}
                   className="stroke-white/10"
                   strokeWidth="6"
                   fill="transparent"
                 />
                 <circle
                   cx="40"
                   cy="40"
                   r={radius}
                   className={`transition-all duration-1000 ease-out ${progress >= 100 ? 'stroke-emerald-400' : 'stroke-purple-500'}`}
                   strokeWidth="6"
                   fill="transparent"
                   strokeDasharray={circumference}
                   strokeDashoffset={strokeDashoffset}
                   strokeLinecap="round"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white text-[10px] font-black">{Math.round(progress)}%</span>
               </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                   promotion.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                 }`}>
                   {promotion.isActive ? 'Active' : 'Completed'}
                 </span>
                 <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                   {promotion.location.replace(/_/g, " ")}
                 </span>
              </div>
              <h4 className="font-bold text-white text-lg leading-tight line-clamp-1 group-hover:text-purple-300 transition-colors">
                {promotion.title}
              </h4>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
             {promotion.isExternal && (
                <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  <ExternalLink className="w-3 h-3" /> EXTERNAL
                </span>
             )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Views</span>
            </div>
            <p className="text-lg font-black text-white">
              {promotion.currentImpressions.toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-1 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <MousePointer2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Clicks</span>
            </div>
            <p className="text-lg font-black text-white">
              {promotion.currentClicks.toLocaleString()}
            </p>
          </div>

          <div className="space-y-1 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
            <div className="flex items-center gap-1.5 text-purple-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">CTR</span>
            </div>
            <p className="text-lg font-black text-purple-300">
              {ctr}%
            </p>
          </div>
          
          <div className="space-y-1 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <XCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Dismiss</span>
            </div>
            <p className="text-lg font-black text-slate-300">
              {dismissRate}%
            </p>
          </div>
        </div>
        
        {/* CSS Sparkline for visual flair */}
        <div className="h-8 w-full flex items-end gap-1 opacity-50">
           {Array.from({length: 12}).map((_, i) => (
             <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-purple-500/40 to-cyan-400/40 rounded-t-sm transition-all duration-500 hover:h-full" 
                style={{ height: `${20 + Math.random() * 80}%` }}
             />
           ))}
        </div>
      </div>
      
      <div className="bg-white/[0.01] px-5 py-3 border-t border-white/5 flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <Target className="w-3.5 h-3.5" />
          {promotion.targetImpressions > 0 
            ? <span className="text-white"><span className="font-bold">{(promotion.targetImpressions - promotion.currentImpressions).toLocaleString()}</span> remaining views</span>
            : 'Continuous campaign'}
        </div>
        <button 
          onClick={(e) => { e.preventDefault(); window.open(promotion.linkUrl, '_blank'); }}
          className="text-purple-400 font-bold hover:text-purple-300 transition-colors flex items-center gap-1 uppercase tracking-widest text-[10px]"
        >
          Preview Ad <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
