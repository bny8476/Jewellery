import React, { useState } from 'react';
import { RefreshCw, TrendingUp, Sparkles } from 'lucide-react';
import { useRates } from '../context/RateContext';
import { Link } from 'react-router-dom';

interface LiveRateCardProps {
  onClose?: () => void;
  className?: string;
  showExtended?: boolean;
}

export const LiveRateCard: React.FC<LiveRateCardProps> = ({
  onClose,
  className = '',
  showExtended = true,
}) => {
  const { rates, refreshRates, loading } = useRates();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Benchmark values dynamically reactive to live RateContext updates
  const buyRate24k = rates?.gold ? Math.round(rates.gold) : 14928;
  const sellRate24k = rates?.sellBack24k ? Math.round(rates.sellBack24k) : (Math.round(buyRate24k * 0.9728) || 14522);
  const rate22k = rates?.gold22k ? Math.round(rates.gold22k) : 13684;
  const rateSilver = rates?.silver ? Math.round(rates.silver) : 220;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRates();
    } catch (e) {
      console.warn('Rate refresh failed:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#4A0A19] via-[#380612] to-[#25030C] border border-[#C6A15B]/40 shadow-2xl p-5 text-white select-none ${className}`}
      style={{
        boxShadow: '0 12px 36px -6px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(198, 161, 91, 0.25)',
      }}
    >
      {/* Subtle gold sheen overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C6A15B]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-center justify-between text-xs text-[#E8D5D0] mb-1.5 font-sans">
        <span className="uppercase tracking-[0.09em] font-semibold text-[11px] flex items-center gap-2 text-stone-100">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34D399]" />
          </span>
          <span className="tracking-wider">LIVE 24K 999.9 GOLD</span>
        </span>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={loading || isRefreshing}
          className="text-stone-300 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 active:scale-95 disabled:opacity-50"
          title="Refresh Live Market Benchmark Rates"
          aria-label="Refresh live rates"
        >
          <RefreshCw className={`w-4 h-4 text-stone-200 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Rate Value */}
      <div className="text-3xl sm:text-4xl text-white font-inter tracking-tight font-bold my-1 flex items-baseline gap-1">
        <span>₹{buyRate24k.toLocaleString('en-IN')}</span>
        <span className="text-sm font-sans font-normal text-[#E8D5D0]/80">/g</span>
      </div>

      {/* Sell-back and GST Row */}
      <div className="flex items-center justify-between text-xs text-[#FAF7F2]/90 pt-1 border-t border-white/10 font-sans">
        <span className="flex items-center gap-1 font-light">
          <span>Sell-back:</span>
          <strong className="font-semibold text-white">₹{sellRate24k.toLocaleString('en-IN')}</strong>/g
        </span>
        <span className="text-[#34D399] font-semibold text-xs tracking-wide">
          +3% GST
        </span>
      </div>

      {/* Extended Metals & Quick Actions */}
      {showExtended && (
        <div className="mt-4 pt-3 border-t border-[#C6A15B]/25 space-y-2.5">
          {/* Secondary Metals Strip */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-black/30 rounded-lg p-2 border border-white/10">
              <span className="text-stone-300 block text-[10px] uppercase tracking-wider">22K 916 BIS Gold</span>
              <span className="font-semibold text-amber-300 text-sm">₹{rate22k.toLocaleString('en-IN')}/g</span>
            </div>
            <div className="bg-black/30 rounded-lg p-2 border border-white/10">
              <span className="text-stone-300 block text-[10px] uppercase tracking-wider">999 Fine Silver</span>
              <span className="font-semibold text-stone-100 text-sm">₹{Math.round(rateSilver)}/g</span>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/live-rates"
              onClick={onClose}
              className="flex-1 py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-center text-xs font-medium text-stone-100 transition-colors flex items-center justify-center gap-1 border border-white/15"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#D8B878]" />
              <span>Full Analytics</span>
            </Link>
            <Link
              to="/auragold"
              onClick={onClose}
              className="flex-1 py-1.5 px-3 rounded-lg bg-[#C6A15B] hover:bg-[#D8B878] text-center text-xs font-bold text-[#2A050F] transition-colors flex items-center justify-center gap-1 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buy 24K Vault</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
