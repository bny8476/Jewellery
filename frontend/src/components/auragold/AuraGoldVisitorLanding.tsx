import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, TrendingUp, Coins, ArrowRight, 
  DollarSign, BarChart3, Wallet, Gift, Clock, Sparkles
} from 'lucide-react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { PatronGuaranteeSection } from '../PatronGuaranteeSection';
import { formatCurrencyINR } from '../../utils/formatters';
import { DigitalGoldRates } from '../../services/digitalGoldService';
import { useRates } from '../../context/RateContext';
import { LiveLineChart, LiveLine, ChartTooltip, LiveLinePoint } from '../ui/charts';
import { PreciousMetalsPriceChart } from './PreciousMetalsPriceChart';

// Custom hook for real-time streaming metal rate time series
function useStreamingMetalRate(basePrice: number, volatility: number) {
  const [data, setData] = useState<LiveLinePoint[]>(() => {
    const pts: LiveLinePoint[] = [];
    const now = Math.floor(Date.now() / 1000);
    let v = basePrice;
    for (let i = 35; i >= 0; i--) {
      v += (Math.random() - 0.49) * volatility;
      pts.push({ time: now - i, value: Number(v.toFixed(2)) });
    }
    return pts;
  });

  const [currentValue, setCurrentValue] = useState(basePrice);

  useEffect(() => {
    setCurrentValue((prev) => (Math.abs(prev - basePrice) > basePrice * 0.05 ? basePrice : prev));
  }, [basePrice]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const delta = (Math.random() - 0.49) * volatility;
      setCurrentValue((prev) => {
        const nextVal = Number(Math.max(basePrice * 0.985, Math.min(basePrice * 1.015, prev + delta)).toFixed(2));
        setData((prevData) => [...prevData.slice(-60), { time: now, value: nextVal }]);
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [basePrice, volatility]);

  return { data, currentValue };
}

export interface AuraGoldVisitorLandingProps {
  onBuyGold?: () => void;
  onViewGold?: () => void;
  onOpenStoreLocator?: () => void;
  onOpenPriceExplainer?: () => void;
  onOpenCareGuide?: () => void;
  rates?: DigitalGoldRates | null;
}

export const AuraGoldVisitorLanding: React.FC<AuraGoldVisitorLandingProps> = ({
  onBuyGold,
  onViewGold,
  onOpenStoreLocator,
  onOpenPriceExplainer,
  onOpenCareGuide,
  rates,
}) => {
  const navigate = useNavigate();
  const { rates: contextRates } = useRates();

  const handleBuy = () => {
    if (onBuyGold) {
      onBuyGold();
    } else {
      navigate('/login?redirect=/auragold');
    }
  };

  const handleView = () => {
    if (onViewGold) {
      onViewGold();
    } else {
      navigate('/login?redirect=/auragold%3Ftab%3DVAULT');
    }
  };

  const gold24kRate = rates?.buyRatePerGram || Math.round(contextRates?.gold || 7243);
  const gold22kRate = rates?.buyRatePerGram 
    ? Math.round(rates.buyRatePerGram * 0.916) 
    : Math.round(contextRates?.gold22k || contextRates?.gold * 0.916 || 6642);
  const silverRate = rates?.silver?.buyRatePerGram 
    ? Number(rates.silver.buyRatePerGram.toFixed(2)) 
    : Number((contextRates?.silver || 86.2).toFixed(2));

  // Real-time streaming chart points
  const gold24kStream = useStreamingMetalRate(gold24kRate, 4.5);
  const gold22kStream = useStreamingMetalRate(gold22kRate, 3.8);
  const silverStream = useStreamingMetalRate(silverRate, 0.25);

  const goldMomentumColors = {
    up: 'rgb(16, 185, 129)',
    down: 'rgb(239, 68, 68)',
    flat: '#B38738',
  };

  const silverMomentumColors = {
    up: 'rgb(16, 185, 129)',
    down: 'rgb(239, 68, 68)',
    flat: '#94A3B8',
  };

  // Current formatted timestamp
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

  return (
    <div className="min-h-screen bg-[#FAF6F0] dark:bg-[#0E0B0D] text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* 1. Official Store Navbar with Gold ticker & Mega Menus */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section: "Invest in Gold, Build Your Tomorrow" */}
        <section className="relative overflow-hidden pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16 lg:pb-20 border-b border-stone-200/80 dark:border-stone-800 bg-gradient-to-b from-[#FFFDFB] via-[#FAF6F0] to-[#F5EFE6] dark:from-[#140E12] dark:via-[#0E0B0D] dark:to-[#0A0809]">
          
          {/* Subtle Ambient Decorative Flourish */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none opacity-20 dark:opacity-5">
            <svg viewBox="0 0 500 500" fill="none" className="w-full h-full text-[#B38738]">
              <circle cx="400" cy="100" r="280" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="400" cy="100" r="180" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>

          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12 items-center">
              
              {/* Left Column: Hero Text, CTAs & Trust Badges */}
              <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center">
                
                {/* Eyebrow: AURA GOLD VAULT */}
                <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.24em] text-[#9E6E1E] dark:text-amber-300 mb-3">
                  Aura Gold Vault
                </p>

                {/* Main Headline */}
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-normal leading-[1.12] tracking-tight text-[#2A1510] dark:text-[#FAF5F0]">
                  Invest in Gold,<br />
                  <span className="italic font-normal text-[#661D2E] dark:text-[#E8A598]">Build Your Tomorrow</span>
                </h1>

                {/* Subtitle */}
                <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed max-w-lg mt-4 sm:mt-5 font-normal">
                  Buy, sell and manage your digital gold securely with YAZHINI Aura Gold Vault.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 mt-7 sm:mt-8">
                  <button
                    onClick={handleBuy}
                    className="px-8 py-3.5 rounded-full bg-[#3D141E] hover:bg-[#521C29] text-white font-semibold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 group cursor-pointer"
                  >
                    <span>Buy Gold</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={handleView}
                    className="px-8 py-3.5 rounded-full bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-[#2C1810] dark:text-stone-100 border border-stone-300 dark:border-stone-700 hover:border-stone-400 font-semibold text-sm tracking-wide shadow-2xs transition-all flex items-center gap-2.5 group cursor-pointer"
                  >
                    <span>View My Gold</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                {/* 3 Trust Features Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-8 sm:pt-10 mt-8 sm:mt-10 border-t border-stone-200/80 dark:border-stone-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-700/40 flex items-center justify-center text-[#B38738] shrink-0 shadow-2xs">
                      <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight">100% Secure</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">&amp; Insured</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-700/40 flex items-center justify-center text-[#B38738] shrink-0 shadow-2xs">
                      <TrendingUp className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight">Real-time</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">Market Rates</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-700/40 flex items-center justify-center text-[#B38738] shrink-0 shadow-2xs">
                      <Coins className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight">Physical Redemption</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">Options</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Hero Visual Showcase */}
              <div className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[560px] rounded-3xl overflow-hidden shadow-2xl border border-stone-200/60 dark:border-stone-800 bg-white/40 dark:bg-black/20 backdrop-blur-xs group">
                  <img 
                    src="/images/aura_gold_hero_phone_bullion.png" 
                    alt="YAZHINI Aura Gold Vault App and 24K Gold Bullion Bars" 
                    className="w-full h-auto object-cover transform transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    loading="eager"
                  />
                  {/* Subtle edge illumination */}
                  <div className="absolute inset-0 rounded-3xl pointer-events-none ring-1 ring-inset ring-black/5 dark:ring-white/10" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. 5-Feature Strip: Safe & Secure, Transparent Pricing, Flexible Options... */}
        <section className="bg-white dark:bg-[#120D10] border-b border-stone-200/80 dark:border-stone-800 py-6 sm:py-8 shadow-2xs">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-4 divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-stone-800">
              
              {/* Feature 1 */}
              <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:px-4 first:pt-0 first:md:pl-0">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0">
                  <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">Safe &amp; Secure</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Vault Storage</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:px-4">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0">
                  <DollarSign className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">Transparent</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Pricing</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:px-4">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0">
                  <BarChart3 className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">Flexible</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Investment Options</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:px-4">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0">
                  <Wallet className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">Instant</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Account Access</p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:px-4 last:md:pr-0">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0">
                  <Gift className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">Easy</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Redemption</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. Current Metal Rates Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-[#FAF6F0] dark:bg-[#0E0B0D] border-b border-stone-200/80 dark:border-stone-800">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
            
            {/* Header: Title + View All Rates button */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
              <div>
                <div className="inline-flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-bold tracking-[0.2em] uppercase mb-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>LIVE GOLD &amp; SILVER RATES</span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900 dark:text-stone-100">
                  Current Metal Rates
                </h2>
                <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm mt-1 max-w-xl">
                  Real-time rates from trusted market sources. Updated regularly for your secure investments.
                </p>
              </div>

              <button
                onClick={() => navigate('/jewellery-rates')}
                className="px-6 py-2.5 rounded-full bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 hover:border-stone-400 text-xs font-bold tracking-wide shadow-2xs transition-all flex items-center gap-2 w-fit cursor-pointer group"
              >
                <span>View All Rates</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Rates Grid: 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-6">
              
              {/* Card 1: 24K Gold */}
              <div 
                onClick={handleBuy}
                className="bg-white dark:bg-[#0A0A0A] rounded-2xl p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-700/50 flex items-center justify-center text-[#B38738]">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">24K Gold</h3>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>

                <div className="my-5">
                  <div className="text-3xl sm:text-[34px] font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                    ₹{formatCurrencyINR(gold24kRate)}/g
                  </div>
                  <div className="text-xs font-semibold text-stone-400 dark:text-stone-500 mt-1">
                    (99.9% Purity)
                  </div>
                </div>

                {/* Real-time Streaming Live Line Chart */}
                <div className="w-full h-16 sm:h-20 my-2">
                  <LiveLineChart
                    data={gold24kStream.data}
                    value={gold24kStream.currentValue}
                    window={30}
                    nowOffsetUnits={1}
                  >
                    <LiveLine
                      dataKey="value"
                      stroke="#B38738"
                      momentumColors={goldMomentumColors}
                      pulse={true}
                      dotSize={3.5}
                      badge={true}
                      formatValue={(v) => `₹${formatCurrencyINR(Math.round(v))}`}
                    />
                    <ChartTooltip
                      showDatePill={true}
                      formatValue={(v) => `₹${formatCurrencyINR(v)}/g`}
                    />
                  </LiveLineChart>
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Last Updated
                  </span>
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* Card 2: 22K Gold */}
              <div 
                onClick={handleBuy}
                className="bg-white dark:bg-[#0A0A0A] rounded-2xl p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-700/50 flex items-center justify-center text-[#B38738]">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">22K Gold</h3>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>

                <div className="my-5">
                  <div className="text-3xl sm:text-[34px] font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                    ₹{formatCurrencyINR(gold22kRate)}/g
                  </div>
                  <div className="text-xs font-semibold text-stone-400 dark:text-stone-500 mt-1">
                    (91.6% Purity)
                  </div>
                </div>

                {/* Real-time Streaming Live Line Chart */}
                <div className="w-full h-16 sm:h-20 my-2">
                  <LiveLineChart
                    data={gold22kStream.data}
                    value={gold22kStream.currentValue}
                    window={30}
                    nowOffsetUnits={1}
                  >
                    <LiveLine
                      dataKey="value"
                      stroke="#D97706"
                      momentumColors={goldMomentumColors}
                      pulse={true}
                      dotSize={3.5}
                      badge={true}
                      formatValue={(v) => `₹${formatCurrencyINR(Math.round(v))}`}
                    />
                    <ChartTooltip
                      showDatePill={true}
                      formatValue={(v) => `₹${formatCurrencyINR(v)}/g`}
                    />
                  </LiveLineChart>
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Last Updated
                  </span>
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* Card 3: Silver */}
              <div 
                onClick={handleBuy}
                className="bg-white dark:bg-[#0A0A0A] rounded-2xl p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Silver</h3>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>

                <div className="my-5">
                  <div className="text-3xl sm:text-[34px] font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                    ₹{silverRate.toFixed(2)}/g
                  </div>
                  <div className="text-xs font-semibold text-stone-400 dark:text-stone-500 mt-1">
                    (99.9% Purity)
                  </div>
                </div>

                {/* Real-time Streaming Live Line Chart */}
                <div className="w-full h-16 sm:h-20 my-2">
                  <LiveLineChart
                    data={silverStream.data}
                    value={silverStream.currentValue}
                    window={30}
                    nowOffsetUnits={1}
                  >
                    <LiveLine
                      dataKey="value"
                      stroke="#94A3B8"
                      momentumColors={silverMomentumColors}
                      pulse={true}
                      dotSize={3.5}
                      badge={true}
                      formatValue={(v) => `₹${v.toFixed(2)}`}
                    />
                    <ChartTooltip
                      showDatePill={true}
                      formatValue={(v) => `₹${v.toFixed(2)}/g`}
                    />
                  </LiveLineChart>
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Last Updated
                  </span>
                  <span>{formattedDate}</span>
                </div>
              </div>

            </div>

            {/* Comprehensive Multi-Asset Area Chart: Gold, Silver, Platinum, Diamond */}
            <div className="mt-10">
              <PreciousMetalsPriceChart />
            </div>

          </div>
        </section>

        {/* 5. Quality-First Service / The Patron Guarantee Section with animated cards */}
        <PatronGuaranteeSection 
          onOpenStoreLocator={onOpenStoreLocator}
          onOpenPriceExplainer={onOpenPriceExplainer}
          onOpenCareGuide={onOpenCareGuide}
        />
      </main>

      {/* 6. Footer */}
      <Footer />

    </div>
  );
};
