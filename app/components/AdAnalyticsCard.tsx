"use client";

import React from "react";
import { type Promotion, trackClick } from "@/lib/promotions";
import { 
  BarChart3, 
  MousePointer2, 
  Eye, 
  TrendingUp,
  ExternalLink,
  Target
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${promotion.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                {promotion.title}
              </h4>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                {promotion.location.replace(/_/g, " ")}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
             <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
               promotion.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
             }`}>
               {promotion.isActive ? 'Active' : 'Completed'}
             </span>
             {promotion.isExternal && (
                <span className="flex items-center gap-1 text-[10px] text-blue-500 font-medium">
                  <ExternalLink className="w-3 h-3" /> External
                </span>
             )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-tight">Views</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {promotion.currentImpressions.toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              <MousePointer2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-tight">Clicks</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {promotion.currentClicks.toLocaleString()}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-tight">CTR</span>
            </div>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {ctr}%
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-xs font-medium text-slate-500">Campaign Progress</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {promotion.targetImpressions > 0 
                ? `${promotion.currentImpressions.toLocaleString()} / ${promotion.targetImpressions.toLocaleString()}` 
                : 'Unlimited'}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 italic">
          <Target className="w-3.5 h-3.5" />
          {promotion.targetImpressions > 0 
            ? `${(promotion.targetImpressions - promotion.currentImpressions).toLocaleString()} remaining`
            : 'Continuous campaign'}
        </div>
        <button 
          onClick={() => window.open(promotion.linkUrl, '_blank')}
          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
        >
          Preview <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
