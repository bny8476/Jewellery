import React from 'react';
import { Sparkles } from 'lucide-react';

export const TabLoadingSkeleton: React.FC = () => {
  return (
    <div 
      className="space-y-6 animate-pulse" 
      role="status" 
      aria-label="Loading patron section"
    >
      {/* Top Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-[#222733]">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#E5E7EB] dark:bg-[#222733] rounded-lg relative overflow-hidden" />
          <div className="h-3.5 w-72 bg-[#F3F4F6] dark:bg-[#181B22] rounded-md" />
        </div>
        <div className="h-9 w-32 bg-[#E5E7EB] dark:bg-[#222733] rounded-lg" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div 
            key={n} 
            className="bg-white dark:bg-[#13151A] rounded-xl border border-[#E5E7EB] dark:border-[#222733] p-5 space-y-4 relative overflow-hidden shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] dark:bg-[#181B22] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#8792A2]/40 dark:text-[#8D96A5]/40" />
              </div>
              <div className="h-4 w-16 bg-[#F3F4F6] dark:bg-[#181B22] rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-[#F3F4F6] dark:bg-[#181B22] rounded-md" />
              <div className="h-6 w-1/2 bg-[#E5E7EB] dark:bg-[#222733] rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white dark:bg-[#13151A] rounded-xl border border-[#E5E7EB] dark:border-[#222733] p-6 space-y-4 shadow-xs">
        <div className="h-5 w-40 bg-[#E5E7EB] dark:bg-[#222733] rounded-md" />
        <div className="space-y-3 pt-2">
          <div className="h-14 w-full bg-[#F3F4F6] dark:bg-[#181B22] rounded-lg" />
          <div className="h-14 w-full bg-[#F3F4F6] dark:bg-[#181B22] rounded-lg" />
          <div className="h-14 w-full bg-[#F3F4F6] dark:bg-[#181B22] rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default TabLoadingSkeleton;
