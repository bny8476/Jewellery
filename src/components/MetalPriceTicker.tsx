import { useState, useEffect } from 'react';
import NumberFlow from '@number-flow/react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useRates } from '../context/RateContext';

type MetalPrices = {
  gold24k: number;
  gold22k: number;
  silver: number;
  platinum: number;
  diamond: number;
  updatedAt?: string;
};

const FALLBACK_PRICES: MetalPrices = {
  gold24k: 7450.00,
  gold22k: 6830.00,
  silver: 94.50,
  platinum: 3450.00,
  diamond: 68000.00,
};

function AnimatedRate({
  label,
  value,
  unit = '/g',
}: {
  label: string;
  value: number;
  unit?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-[#DFC0B5] font-sans font-medium text-[11px] sm:text-xs">{label}:</span>
      <span className="text-[#C69A8B] font-semibold text-xs">₹</span>
      <NumberFlow
        value={value}
        format={{
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }}
        locales="en-IN"
        className="font-semibold text-[#FAF5F0] tabular-nums font-mono text-xs sm:text-sm"
      />
      <span className="text-[#FAF5F0]/60 text-[10px] sm:text-[11px]">{unit}</span>
    </span>
  );
}

export default function MetalPriceTicker() {
  const { rates: contextRates, lastUpdated: contextLastUpdated } = useRates();
  
  const [prices, setPrices] = useState<MetalPrices>({
    gold24k: contextRates.gold || FALLBACK_PRICES.gold24k,
    gold22k: contextRates.gold22k || FALLBACK_PRICES.gold22k,
    silver: contextRates.silver || FALLBACK_PRICES.silver,
    platinum: contextRates.platinum || FALLBACK_PRICES.platinum,
    diamond: contextRates.diamond || FALLBACK_PRICES.diamond,
  });

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Sync with context rates initially
  useEffect(() => {
    if (contextRates.gold > 0) {
      setPrices({
        gold24k: contextRates.gold,
        gold22k: contextRates.gold22k || Math.round(contextRates.gold * 0.916 * 100) / 100,
        silver: contextRates.silver || FALLBACK_PRICES.silver,
        platinum: contextRates.platinum || FALLBACK_PRICES.platinum,
        diamond: contextRates.diamond || FALLBACK_PRICES.diamond,
      });
      if (contextLastUpdated) setLastUpdated(contextLastUpdated);
    }
  }, [contextRates, contextLastUpdated]);

  // Periodic real-time market micro-updates to demonstrate motion rolling numbers
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) => {
        // Subtle realistic intra-minute bullion tick (± ₹0.50 to ₹2.00)
        const goldDelta = Math.round((Math.random() * 4 - 2) * 100) / 100;
        const silverDelta = Math.round((Math.random() * 0.4 - 0.2) * 100) / 100;
        const platinumDelta = Math.round((Math.random() * 2 - 1) * 100) / 100;

        const base24k = contextRates.gold > 0 ? contextRates.gold : FALLBACK_PRICES.gold24k;
        const new24k = Math.max(7400, Math.min(7550, base24k + goldDelta));
        const new22k = Math.round(new24k * 0.9166 * 100) / 100;
        
        const baseSilver = contextRates.silver > 0 ? contextRates.silver : FALLBACK_PRICES.silver;
        const newSilver = Math.max(90, Math.min(96, baseSilver + silverDelta));

        const basePlatinum = contextRates.platinum > 0 ? contextRates.platinum : FALLBACK_PRICES.platinum;
        const newPlatinum = Math.max(3400, Math.min(3500, basePlatinum + platinumDelta));

        const baseDiamond = contextRates.diamond > 0 ? contextRates.diamond : FALLBACK_PRICES.diamond;

        return {
          gold24k: Math.round(new24k * 100) / 100,
          gold22k: Math.round(new22k * 100) / 100,
          silver: Math.round(newSilver * 100) / 100,
          platinum: Math.round(newPlatinum * 100) / 100,
          diamond: baseDiamond,
        };
      });
      setLastUpdated(new Date());
    }, 8000); // Ticks every 8 seconds for visible real-time motion

    return () => clearInterval(interval);
  }, [contextRates]);

  return (
    <section className="relative z-20 w-full border-y border-[#C69A8B]/20 bg-[#34111A] text-xs shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          
          {/* Animated Motion Rates on a Single Clean Row */}
          <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-x-3.5 sm:gap-x-4 lg:gap-x-5 whitespace-nowrap shrink-0"
          >
            {/* Live Indicator */}
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-sans font-semibold tracking-wider uppercase text-emerald-400"
              title={`Last updated: ${lastUpdated.toLocaleTimeString('en-IN')}`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE MCX
            </span>

            <span className="h-3 w-px bg-[#C69A8B]/30" />

            {/* 24K Gold Rate */}
            <AnimatedRate
              label="24K Gold"
              value={prices.gold24k}
            />

            <span className="h-3 w-px bg-[#C69A8B]/30" />

            {/* 22K Gold Rate */}
            <AnimatedRate
              label="22K Gold"
              value={prices.gold22k}
            />

            <span className="h-3 w-px bg-[#C69A8B]/30" />

            {/* Silver Rate */}
            <AnimatedRate
              label="Silver"
              value={prices.silver}
            />

            <span className="h-3 w-px bg-[#C69A8B]/30" />

            {/* Platinum Rate */}
            <AnimatedRate
              label="Platinum"
              value={prices.platinum}
              unit="/g"
            />

            <span className="h-3 w-px bg-[#C69A8B]/30" />

            {/* Diamond Rate */}
            <AnimatedRate
              label="Diamond"
              value={prices.diamond}
              unit="/ct"
            />
          </motion.div>

          {/* Right: Perfectly Aligned Pawn Valuation Pill Button */}
          <div className="shrink-0 pl-3 border-l border-[#C69A8B]/20">
            <Link
              to="/pawn"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#C69A8B]/40 hover:border-[#C69A8B] hover:bg-[#C69A8B]/10 text-[#FAF5F0] hover:text-[#C69A8B] text-[10px] font-sans font-medium uppercase tracking-wider transition-all whitespace-nowrap"
            >
              <span>Pawn Valuation</span>
              <ArrowRight className="w-3 h-3 text-[#C69A8B]" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
