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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[var(--bg-elevated)] rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[var(--gold-primary)]/10 to-transparent" />
          </div>
          <div className="h-3.5 w-72 bg-[var(--bg-elevated)]/60 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-[var(--bg-elevated)] rounded-xl" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div 
            key={n} 
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[var(--gold-primary)]/30" />
              </div>
              <div className="h-4 w-16 bg-[var(--bg-elevated)] rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-[var(--bg-elevated)] rounded-md" />
              <div className="h-6 w-1/2 bg-[var(--bg-elevated)] rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-4">
        <div className="h-5 w-40 bg-[var(--bg-elevated)] rounded-lg" />
        <div className="space-y-3 pt-2">
          <div className="h-14 w-full bg-[var(--bg-elevated)] rounded-xl" />
          <div className="h-14 w-full bg-[var(--bg-elevated)] rounded-xl" />
          <div className="h-14 w-full bg-[var(--bg-elevated)] rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default TabLoadingSkeleton;
