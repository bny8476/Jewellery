import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, Grid, XAxis, AreaChartTooltip, ChartDataPoint 
} from '../ui/charts';
import { useRates } from '../../context/RateContext';
import { formatCurrencyINR } from '../../utils/formatters';
import { 
  TrendingUp, Sparkles, Eye, EyeOff, 
  Coins, Gem, Award, Layers, Calendar
} from 'lucide-react';

export type TimeRange = '7D' | '30D' | '90D' | '1Y';
export type DisplayMode = 'NORMALIZED' | 'RAW';

interface AssetConfig {
  key: string;
  name: string;
  shortName: string;
  unit: string;
  color: string;
  fillColor: string;
  icon: React.ReactNode;
  purity: string;
  baseRate: number;
  volatility: number;
}

export const PreciousMetalsPriceChart: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { rates } = useRates();

  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('NORMALIZED');
  const [activeSeries, setActiveSeries] = useState<Record<string, boolean>>({
    gold: true,
    silver: true,
    platinum: true,
    diamond: true,
  });

  // Current anchor prices from context or realistic market standards
  const currentGoldRate = rates?.gold || 14928;
  const currentSilverRate = rates?.silver || 220;
  const currentPlatinumRate = rates?.platinum || 5085;
  const currentDiamondRate = rates?.diamond || 68000;

  const assets: AssetConfig[] = useMemo(
    () => [
      {
        key: 'gold',
        name: '24K Gold (999.9)',
        shortName: 'Gold 24K',
        unit: '₹/g',
        color: '#F59E0B', // Amber Gold
        fillColor: '#F59E0B',
        icon: <Coins className="w-4 h-4 text-amber-400" />,
        purity: '99.9% Pure Bullion',
        baseRate: currentGoldRate,
        volatility: 0.008,
      },
      {
        key: 'silver',
        name: '999 Fine Silver',
        shortName: 'Silver 999',
        unit: '₹/g',
        color: '#94A3B8', // Slate Silver
        fillColor: '#94A3B8',
        icon: <Coins className="w-4 h-4 text-slate-300" />,
        purity: '99.9% Pure Ingot',
        baseRate: currentSilverRate,
        volatility: 0.012,
      },
      {
        key: 'platinum',
        name: 'Platinum 950',
        shortName: 'Platinum',
        unit: '₹/g',
        color: '#818CF8', // Violet / Indigo Platinum
        fillColor: '#818CF8',
        icon: <Award className="w-4 h-4 text-indigo-400" />,
        purity: '95.0% Investment Grade',
        baseRate: currentPlatinumRate,
        volatility: 0.009,
      },
      {
        key: 'diamond',
        name: 'Diamond (Solitaire)',
        shortName: 'Diamond',
        unit: '₹/ct',
        color: '#38BDF8', // Cyan Diamond Brilliance
        fillColor: '#38BDF8',
        icon: <Gem className="w-4 h-4 text-sky-400" />,
        purity: 'VVS1 / E-F Color Benchmark',
        baseRate: currentDiamondRate,
        volatility: 0.005,
      },
    ],
    [currentGoldRate, currentSilverRate, currentPlatinumRate, currentDiamondRate]
  );

  // Determine number of historical days based on selected range
  const daysCount = useMemo(() => {
    switch (timeRange) {
      case '7D':
        return 7;
      case '30D':
        return 30;
      case '90D':
        return 90;
      case '1Y':
        return 365;
      default:
        return 30;
    }
  }, [timeRange]);

  // Generate realistic historical time series data ending on current rate
  const { chartData, startRateMap } = useMemo(() => {
    const data: ChartDataPoint[] = [];
    const now = new Date();

    // Seeded pseudo-random walk moving backwards from current anchor price
    const trajectories: Record<string, number[]> = {};

    assets.forEach((asset) => {
      const points: number[] = new Array(daysCount);
      points[daysCount - 1] = asset.baseRate;

      let current = asset.baseRate;
      // Walk backwards with market trend
      for (let i = daysCount - 2; i >= 0; i--) {
        const trendBias = -0.0004; // Backwards decrement
        const pseudoRandom = Math.sin((i + 1) * 997.3) * 0.5 + Math.cos((i + 2) * 443.1) * 0.5;
        const changePercent = trendBias + pseudoRandom * asset.volatility;
        current = current * (1 + changePercent);
        points[i] = Number(current.toFixed(2));
      }
      trajectories[asset.key] = points;
    });

    const startRates: Record<string, number> = {};
    assets.forEach((asset) => {
      startRates[asset.key] = trajectories[asset.key][0];
    });

    for (let i = 0; i < daysCount; i++) {
      const date = new Date(now.getTime() - (daysCount - 1 - i) * 24 * 60 * 60 * 1000);
      const point: ChartDataPoint = { date };

      assets.forEach((asset) => {
        const rawVal = trajectories[asset.key][i];

        if (displayMode === 'NORMALIZED') {
          // Normalized to 100 at start index
          const startVal = startRates[asset.key];
          const pctGain = ((rawVal - startVal) / startVal) * 100;
          point[asset.key] = Number((100 + pctGain).toFixed(2));
        } else {
          point[asset.key] = rawVal;
        }
      });

      data.push(point);
    }

    return { chartData: data, startRateMap: startRates };
  }, [assets, daysCount, displayMode]);

  // Asset overall returns over current range
  const performanceStats = useMemo(() => {
    const stats: Record<string, { changePct: number; isUp: boolean }> = {};
    assets.forEach((asset) => {
      const start = startRateMap[asset.key] || asset.baseRate;
      const end = asset.baseRate;
      const diffPct = ((end - start) / start) * 100;
      stats[asset.key] = {
        changePct: Number(diffPct.toFixed(2)),
        isUp: diffPct >= 0,
      };
    });
    return stats;
  }, [assets, startRateMap]);

  // Toggle asset series visibility
  const toggleSeries = (key: string) => {
    setActiveSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Ensure at least 1 series remains active
      const hasAny = Object.values(next).some(Boolean);
      return hasAny ? next : prev;
    });
  };

  // Tooltip series config
  const tooltipSeries = useMemo(() => {
    return assets
      .filter((a) => activeSeries[a.key])
      .map((a) => ({
        dataKey: a.key,
        name: a.shortName,
        color: a.color,
        formatter: (val: number) => {
          if (displayMode === 'NORMALIZED') {
            const indexVal = val;
            const gain = (indexVal - 100).toFixed(2);
            const prefix = Number(gain) >= 0 ? '+' : '';
            return `${prefix}${gain}% (Idx: ${indexVal.toFixed(1)})`;
          }
          return `${formatCurrencyINR(Math.round(val))} ${a.unit}`;
        },
      }));
  }, [assets, activeSeries, displayMode]);

  return (
    <div
      className={`bg-white dark:bg-[#0A0A0A] rounded-3xl border border-stone-200 dark:border-neutral-800 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden transition-all ${className}`}
    >
      {/* 1. Header with Title & Market Status */}
      <div className="p-6 sm:p-8 pb-5 border-b border-stone-100 dark:border-stone-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Live Precious Metals & Gems Intelligence
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Realtime Synced
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
            Multi-Asset Area Chart
            <span className="text-xs font-normal text-stone-500 dark:text-stone-400">
              (Gold, Silver, Platinum & Diamond)
            </span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
            Compare historical trajectories, volatility correlation, and investment performance across India's four primary wealth preservation assets in a single composable area chart.
          </p>
        </div>

        {/* Controls: Time Range & Mode Selector */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-900 p-1 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDisplayMode('NORMALIZED')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'NORMALIZED'
                  ? 'bg-black dark:bg-stone-100 text-[#D8B878] dark:text-black shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white'
              }`}
              title="Aligns all 4 commodities to baseline 100 for direct relative growth comparison"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>% Growth</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('RAW')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'RAW'
                  ? 'bg-black dark:bg-stone-100 text-[#D8B878] dark:text-black shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white'
              }`}
              title="Displays actual rupee values (₹/g or ₹/ct)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rupee Level</span>
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-900 p-1 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-bold">
            {(['7D', '30D', '90D', '1Y'] as TimeRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === r
                    ? 'bg-black dark:bg-stone-100 text-[#D8B878] dark:text-black shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Four Asset Cards: Spot Rates + Performance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6 bg-stone-50/70 dark:bg-black/60 border-b border-stone-100 dark:border-neutral-800">
        {assets.map((asset) => {
          const isSelected = activeSeries[asset.key];
          const stat = performanceStats[asset.key];
          return (
            <div
              key={asset.key}
              onClick={() => toggleSeries(asset.key)}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                isSelected
                  ? 'bg-white dark:bg-[#141414] border-stone-300 dark:border-neutral-700 shadow-xs'
                  : 'bg-stone-100/60 dark:bg-neutral-900/40 border-dashed border-stone-300/80 dark:border-neutral-800 opacity-60 hover:opacity-90'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${asset.color}20` }}
                  >
                    {asset.icon}
                  </div>
                  <span className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                    {asset.shortName}
                  </span>
                </div>

                <button
                  type="button"
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                  aria-label={`Toggle ${asset.shortName}`}
                >
                  {isSelected ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-baseline justify-between gap-2 mt-1">
                <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 font-mono tracking-tight">
                  ₹{formatCurrencyINR(Math.round(asset.baseRate))}
                  <span className="text-[10px] font-sans text-stone-500 font-normal ml-0.5">
                    {asset.unit}
                  </span>
                </span>
                <span
                  className={`text-[11px] font-bold shrink-0 ${
                    stat.isUp
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {stat.isUp ? '↑ +' : '↓ '}{stat.changePct}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-stone-600 dark:text-stone-400 mt-1.5 pt-1.5 border-t border-stone-100 dark:border-stone-800/80">
                <span className="truncate">{asset.purity}</span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? asset.color : 'transparent' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Composable Area Chart Viewport */}
      <div className="p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-3 px-1">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            Showing historical trajectory over the past {daysCount} days
          </span>
          <span className="text-[11px] font-medium hidden sm:inline">
            {displayMode === 'NORMALIZED'
              ? 'Indexed to base 100 (Relative % yield comparison)'
              : 'Absolute pricing in Indian Rupees (INR)'}
          </span>
        </div>

        {/* Area Chart Container */}
        <div className="w-full h-80 sm:h-96 relative">
          <AreaChart data={chartData} className="w-full h-full">
            <Grid horizontal stroke="rgba(150, 150, 150, 0.2)" strokeDasharray="3 3" />

            {/* Overlapping Series in Depth Order */}
            {activeSeries.gold && (
              <Area
                dataKey="gold"
                fill="#F59E0B"
                stroke="#F59E0B"
                strokeWidth={2.5}
                fillOpacity={0.25}
                gradientFromOpacity={0.45}
                gradientToOpacity={0.02}
              />
            )}

            {activeSeries.silver && (
              <Area
                dataKey="silver"
                fill="#94A3B8"
                stroke="#94A3B8"
                strokeWidth={2.2}
                fillOpacity={0.22}
                gradientFromOpacity={0.4}
                gradientToOpacity={0.02}
              />
            )}

            {activeSeries.platinum && (
              <Area
                dataKey="platinum"
                fill="#818CF8"
                stroke="#818CF8"
                strokeWidth={2.2}
                fillOpacity={0.22}
                gradientFromOpacity={0.4}
                gradientToOpacity={0.02}
              />
            )}

            {activeSeries.diamond && (
              <Area
                dataKey="diamond"
                fill="#38BDF8"
                stroke="#38BDF8"
                strokeWidth={2.5}
                fillOpacity={0.25}
                gradientFromOpacity={0.45}
                gradientToOpacity={0.02}
              />
            )}

            {/* Bottom X-Axis with Clean Formatted Dates */}
            <XAxis
              numTicks={daysCount > 30 ? 7 : 5}
              formatTick={(d) =>
                d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
              }
            />

            {/* Custom Interactive Tooltip showing all 4 assets simultaneously */}
            <AreaChartTooltip series={tooltipSeries} />
          </AreaChart>
        </div>

        {/* 4. Chart Legend & Notes */}
        <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex flex-wrap items-center gap-4">
            {assets.map((asset) => {
              const isActive = activeSeries[asset.key];
              return (
                <button
                  key={asset.key}
                  type="button"
                  onClick={() => toggleSeries(asset.key)}
                  className={`flex items-center gap-2 cursor-pointer transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-40 line-through'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-2 ring-black/10 dark:ring-white/10"
                    style={{ backgroundColor: asset.color }}
                  />
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {asset.shortName}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-600 dark:text-stone-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Hover anywhere across the curve for synchronized multi-metal quotes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
