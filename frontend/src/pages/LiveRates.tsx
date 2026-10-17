import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Clock, 
  Calculator, 
  Gem, 
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Award
} from 'lucide-react';
import { useRates } from '../context/RateContext';
import { fetchMetalRatesHistory, type MetalHistoryPoint } from '../services/metalRateService';
import { fetchDiamondPriceEstimate, type DiamondCalculationResult } from '../services/diamondService';
import { formatCurrencyINR } from '../utils/formatters';

export default function LiveRates() {
  const { rates, detailedRates, loading, lastUpdated, istTime, isLive, isStale, refreshRates } = useRates();

  // Unit toggles
  const [goldUnit, setGoldUnit] = useState<'gram' | '10gram'>('gram');
  const [silverUnit, setSilverUnit] = useState<'gram' | 'kg'>('gram');
  const [platinumUnit, setPlatinumUnit] = useState<'gram' | '10gram' | 'kg'>('gram');

  // History state
  const [history, setHistory] = useState<MetalHistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeChartMetal, setActiveChartMetal] = useState<'gold24k' | 'gold22k' | 'silver' | 'platinum'>('gold24k');

  // Jewellery Making Calculator state
  const [calcMetal, setCalcMetal] = useState<'gold24k' | 'gold22k' | 'gold18k' | 'silver' | 'platinum'>('gold22k');
  const [calcWeight, setCalcWeight] = useState<number>(10.0);
  const [calcMakingType, setCalcMakingType] = useState<'percent' | 'perGram'>('percent');
  const [calcMakingValue, setCalcMakingValue] = useState<number>(12); // 12% making charge

  // Diamond Calculator state
  const [diamondOrigin, setDiamondOrigin] = useState<'natural' | 'lab_grown'>('natural');
  const [diamondCarat, setDiamondCarat] = useState<number>(1.0);
  const [diamondShape, setDiamondShape] = useState<string>('Round');
  const [diamondCut, setDiamondCut] = useState<string>('Excellent');
  const [diamondColor, setDiamondColor] = useState<string>('G');
  const [diamondClarity, setDiamondClarity] = useState<string>('VS1');
  const [diamondCert, setDiamondCert] = useState<string>('GIA');
  const [diamondResult, setDiamondResult] = useState<DiamondCalculationResult | null>(null);
  const [diamondLoading, setDiamondLoading] = useState<boolean>(false);

  // Load history
  useEffect(() => {
    async function loadHistory() {
      try {
        setHistoryLoading(true);
        const res = await fetchMetalRatesHistory(7);
        if (res && res.history) {
          setHistory(res.history);
        }
      } catch (err) {
        console.warn('Failed to load history:', err);
      } finally {
        setHistoryLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Calculate Diamond Estimate
  useEffect(() => {
    let isCancelled = false;
    async function calculateDiamond() {
      setDiamondLoading(true);
      try {
        const res = await fetchDiamondPriceEstimate({
          origin: diamondOrigin,
          carat: diamondCarat,
          shape: diamondShape,
          cut: diamondCut,
          color: diamondColor,
          clarity: diamondClarity,
          cert: diamondCert
        });
        if (!isCancelled) {
          setDiamondResult(res);
        }
      } catch (err) {
        console.warn('Diamond estimation error:', err);
      } finally {
        if (!isCancelled) setDiamondLoading(false);
      }
    }

    calculateDiamond();
    return () => { isCancelled = true; };
  }, [diamondOrigin, diamondCarat, diamondShape, diamondCut, diamondColor, diamondClarity, diamondCert]);

  // Price change helpers
  const gold24kChange = detailedRates?.gold?.k24?.change24h ?? 0;
  const gold24kChangePct = detailedRates?.gold?.k24?.changePercent24h ?? 0;

  const gold22kChange = detailedRates?.gold?.k22?.change24h ?? 0;
  const gold22kChangePct = detailedRates?.gold?.k22?.changePercent24h ?? 0;

  const silverChange = detailedRates?.silver?.change24h ?? 0;
  const silverChangePct = detailedRates?.silver?.changePercent24h ?? 0;

  const platChange = detailedRates?.platinum?.change24h ?? 0;
  const platChangePct = detailedRates?.platinum?.changePercent24h ?? 0;

  // Compute Jewellery invoice estimate
  const getSelectedMetalRate = () => {
    switch (calcMetal) {
      case 'gold24k': return rates.gold;
      case 'gold22k': return rates.gold22k;
      case 'gold18k': return rates.gold18k || (rates.gold * 0.750);
      case 'silver': return rates.silver;
      case 'platinum': return rates.platinum;
      default: return rates.gold22k;
    }
  };

  const selectedRate = getSelectedMetalRate();
  const rawMetalCost = calcWeight * selectedRate;
  const makingChargesAmount = calcMakingType === 'percent'
    ? (rawMetalCost * (calcMakingValue / 100))
    : (calcWeight * calcMakingValue);
  const taxableSubtotal = rawMetalCost + makingChargesAmount;
  const gstAmount = taxableSubtotal * 0.03; // 3% standard Indian GST
  const estimatedTotalInvoice = taxableSubtotal + gstAmount;

  return (
    <div className="min-h-screen bg-[#0A0705] text-[#F9F4EB] font-sans pb-24 selection:bg-[#C9A46A] selection:text-[#100C09]">
      
      {/* Header Banner */}
      <section className="relative overflow-hidden border-b border-[#C9A46A]/20 bg-gradient-to-b from-[#160E0A] via-[#100A07] to-[#0A0705] pt-12 pb-14 px-4 sm:px-6 lg:px-12">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-[#C9A46A]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-[#8C6239]/5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          {/* Top Wordmark & Breadcrumb */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#C9A46A]/15">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-8 h-8 text-[#C9A46A]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9l4-6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3L7 9l5 12 5-12-4-6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 9h20" />
              </svg>
              <div>
                <span className="font-serif text-lg tracking-[0.22em] text-[#F8F1E5] uppercase block font-medium">
                  YAZHINI
                </span>
                <span className="font-sans text-[9px] font-bold tracking-[0.36em] text-[#C9A46A] uppercase block">
                  FINE JEWELS
                </span>
                <span className="text-[8px] font-medium tracking-[0.28em] text-[#D8B478]/80 uppercase block mt-0.5">
                  TRADITION &bull; CRAFTED TO SHINE
                </span>
              </div>
            </div>

            {/* Live Feed Status & Time */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A120D] border border-[#C9A46A]/40 text-xs shadow-xs">
                <span className={`w-2 h-2 rounded-full ${isLive && !isStale ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-[#EFE5D5] font-medium tracking-wide">
                  {detailedRates?.metadata?.displayNotice || `Rates last updated on ${detailedRates?.metadata?.effectiveDate || new Date().toISOString().split('T')[0]} at 9:00 AM IST`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#EFE3D0]/70 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#C9A46A]" />
                <span>{istTime || (lastUpdated ? lastUpdated.toLocaleTimeString('en-IN') + ' IST' : '9:00 AM IST')}</span>
              </div>

              <button
                onClick={() => refreshRates()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#241710] hover:bg-[#322016] text-[#E5C388] border border-[#C9A46A]/50 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
                title="Refresh Daily Stored Rates"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Checking...' : 'Check Rates'}</span>
              </button>
            </div>
          </div>

          {/* Stale Warning Banner if offline or API limit fallback */}
          {isStale && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <div>
                <span className="font-semibold block text-amber-200">Daily Benchmark Notice (Stale Data Warning)</span>
                <span>
                  The 9:00 AM IST daily rates update is pending or the external provider was unreachable. Displaying previous valid rates from {detailedRates?.metadata?.effectiveDate || 'prior session'}.
                </span>
              </div>
            </div>
          )}

          {/* Headline & Editorial intro */}
          <div className="pt-8 max-w-3xl">
            <span className="text-[10px] sm:text-xs font-sans tracking-[0.3em] uppercase font-semibold text-[#C9A46A] block mb-2">
              BULLION &amp; DIAMOND INTELLIGENCE
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FAF5ED] leading-tight">
              Live Precious Metal &amp; Diamond Rates
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#D7C9B8] font-light leading-relaxed pt-3">
              Official real-time spot benchmarks and indicative Indian retail jeweller prices for 24K, 22K, 18K Gold, Fine Silver, Platinum, and certified Solitaires in Indian Rupees (₹).
            </p>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-10 space-y-12">
        
        {/* =================================================================== */}
        {/* SECTION 1: 4 HERO LIVE PRICE CARDS                                  */}
        {/* =================================================================== */}
        <section>
          <div className="flex items-center justify-between pb-5">
            <h2 className="font-serif text-xl sm:text-2xl text-[#FAF5ED] font-normal tracking-wide flex items-center gap-2.5">
              <span>Today’s Bullion Spot Rates</span>
              <span className="text-xs font-sans text-[#C9A46A] font-semibold tracking-widest uppercase bg-[#C9A46A]/10 px-2.5 py-0.5 rounded-full border border-[#C9A46A]/20">
                Live (India)
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. GOLD CARD */}
            <div className="relative rounded-2xl bg-gradient-to-b from-[#1C120C] to-[#120B07] border border-[#C9A46A]/40 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between group hover:border-[#C9A46A]/70 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#C9A46A]/15">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E5C388] shadow-[0_0_8px_#E5C388]" />
                    <h3 className="font-serif text-lg font-medium text-[#FAF5ED]">Gold (XAU)</h3>
                  </div>
                  {/* Unit Toggle */}
                  <div className="inline-flex rounded-lg bg-[#2A1C14] p-0.5 text-[10px] font-semibold text-[#D7C9B8]">
                    <button
                      onClick={() => setGoldUnit('gram')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${goldUnit === 'gram' ? 'bg-[#C9A46A] text-[#100C09]' : 'hover:text-white'}`}
                    >
                      1g
                    </button>
                    <button
                      onClick={() => setGoldUnit('10gram')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${goldUnit === '10gram' ? 'bg-[#C9A46A] text-[#100C09]' : 'hover:text-white'}`}
                    >
                      10g
                    </button>
                  </div>
                </div>

                {/* Main 24K Rate */}
                <div className="pt-4 pb-3">
                  <span className="text-[10px] font-sans font-semibold tracking-wider uppercase text-[#C9A46A]">
                    24K PURE (999)
                  </span>
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-2xl sm:text-3xl rate-financial text-[#FAF5ED]">
                      {formatCurrencyINR(goldUnit === 'gram' ? rates.gold : rates.gold * 10)}
                    </span>
                    <span className="text-xs text-[#D7C9B8]/70">/{goldUnit === 'gram' ? 'g' : '10g'}</span>
                  </div>

                  {/* 24h Price Change */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    {gold24kChange >= 0 ? (
                      <span className="inline-flex items-center text-emerald-400 font-semibold gap-0.5 rate-financial">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{gold24kChangePct.toFixed(2)}% (+{formatCurrencyINR(goldUnit === 'gram' ? gold24kChange : gold24kChange * 10)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-rose-400 font-semibold gap-0.5 rate-financial">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {gold24kChangePct.toFixed(2)}% ({formatCurrencyINR(goldUnit === 'gram' ? gold24kChange : gold24kChange * 10)})
                      </span>
                    )}
                    <span className="text-[10px] text-[#A69584]">24h change</span>
                  </div>
                </div>

                {/* Sub-purities (22K & 18K) */}
                <div className="space-y-2 pt-2 border-t border-[#C9A46A]/15 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#C9A46A] font-medium">22K Hallmarked (916):</span>
                    <div className="text-right">
                      <span className="rate-financial text-[#FAF5ED]">
                        {formatCurrencyINR(goldUnit === 'gram' ? rates.gold22k : rates.gold22k * 10)}
                      </span>
                      <span className={`text-[10px] ml-1.5 rate-financial ${gold22kChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {gold22kChange >= 0 ? '+' : ''}{gold22kChangePct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#C9A46A]/80 font-medium">18K Jewellery (750):</span>
                    <span className="rate-financial text-[#FAF5ED]">
                      {formatCurrencyINR(goldUnit === 'gram' ? (rates.gold18k || rates.gold * 0.75) : (rates.gold18k || rates.gold * 0.75) * 10)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#C9A46A]/15 text-[10px] text-[#A69584] flex items-center justify-between">
                <span>BIS 916 Standard</span>
                <span>IDC Spot</span>
              </div>
            </div>

            {/* 2. SILVER CARD */}
            <div className="relative rounded-2xl bg-gradient-to-b from-[#1C120C] to-[#120B07] border border-[#C9A46A]/40 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between group hover:border-[#C9A46A]/70 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#C9A46A]/15">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-[0_0_8px_#CBD5E1]" />
                    <h3 className="font-serif text-lg font-medium text-[#FAF5ED]">Silver (XAG)</h3>
                  </div>
                  {/* Unit Toggle */}
                  <div className="inline-flex rounded-lg bg-[#2A1C14] p-0.5 text-[10px] font-semibold text-[#D7C9B8]">
                    <button
                      onClick={() => setSilverUnit('gram')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${silverUnit === 'gram' ? 'bg-[#C9A46A] text-[#100C09]' : 'hover:text-white'}`}
                    >
                      1g
                    </button>
                    <button
                      onClick={() => setSilverUnit('kg')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${silverUnit === 'kg' ? 'bg-[#C9A46A] text-[#100C09]' : 'hover:text-white'}`}
                    >
                      1kg
                    </button>
                  </div>
                </div>

                {/* Main Silver Rate */}
                <div className="pt-4 pb-3">
                  <span className="text-[10px] font-sans font-semibold tracking-wider uppercase text-slate-300">
                    FINE SILVER 999
                  </span>
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-2xl sm:text-3xl rate-financial text-[#FAF5ED]">
                      {formatCurrencyINR(silverUnit === 'gram' ? rates.silver : rates.silver * 1000)}
                    </span>
                    <span className="text-xs text-[#D7C9B8]/70">/{silverUnit === 'gram' ? 'g' : 'kg'}</span>
                  </div>

                  {/* 24h Price Change */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    {silverChange >= 0 ? (
                      <span className="inline-flex items-center text-emerald-400 font-semibold gap-0.5 rate-financial">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{silverChangePct.toFixed(2)}% (+{formatCurrencyINR(silverUnit === 'gram' ? silverChange : silverChange * 1000)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-rose-400 font-semibold gap-0.5 rate-financial">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {silverChangePct.toFixed(2)}% ({formatCurrencyINR(silverUnit === 'gram' ? silverChange : silverChange * 1000)})
                      </span>
                    )}
                    <span className="text-[10px] text-[#A69584]">24h change</span>
                  </div>
                </div>

                {/* Breakdowns */}
                <div className="space-y-2 pt-2 border-t border-[#C9A46A]/15 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#D7C9B8]/80 font-medium">100g Bar:</span>
                    <span className="rate-financial text-[#FAF5ED]">
                      {formatCurrencyINR(rates.silver * 100)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#D7C9B8]/80 font-medium">1 Kilogram (1000g):</span>
                    <span className="rate-financial text-[#FAF5ED]">
                      {formatCurrencyINR(rates.silver * 1000)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#C9A46A]/15 text-[10px] text-[#A69584] flex items-center justify-between">
                <span>99.9% Purity</span>
                <span>Bullion Quality</span>
              </div>
            </div>

            {/* 3. PLATINUM CARD */}
            <div className="relative rounded-2xl bg-gradient-to-b from-[#1C120C] to-[#120B07] border border-[#C9A46A]/40 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between group hover:border-[#C9A46A]/70 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#C9A46A]/15">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67E8F9]" />
                    <h3 className="font-serif text-lg font-medium text-[#FAF5ED]">Platinum (XPT)</h3>
                  </div>
                  {/* Unit Toggle */}
                  <div className="inline-flex rounded-lg bg-[#2A1C14] p-0.5 text-[10px] font-semibold text-[#D7C9B8]">
                    <button
                      onClick={() => setPlatinumUnit('gram')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${platinumUnit === 'gram' ? 'bg-[#C9A46A] text-[#100C09]' : 'hover:text-white'}`}
                    >
                      1g
                    </button>
                    <button
                      onClick={() => setPlatinumUnit('10gram')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${platinumUnit === '10gram' ? 'bg-[#C9A46A] text-[#100C09]' : 'hover:text-white'}`}
                    >
                      10g
                    </button>
                  </div>
                </div>

                {/* Main Platinum Rate */}
                <div className="pt-4 pb-3">
                  <span className="text-[10px] font-sans font-semibold tracking-wider uppercase text-cyan-300">
                    FINE PLATINUM 950
                  </span>
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-2xl sm:text-3xl rate-financial text-[#FAF5ED]">
                      {formatCurrencyINR(platinumUnit === 'gram' ? rates.platinum : rates.platinum * 10)}
                    </span>
                    <span className="text-xs text-[#D7C9B8]/70">/{platinumUnit === 'gram' ? 'g' : '10g'}</span>
                  </div>

                  {/* 24h Price Change */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    {platChange >= 0 ? (
                      <span className="inline-flex items-center text-emerald-400 font-semibold gap-0.5 rate-financial">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{platChangePct.toFixed(2)}% (+{formatCurrencyINR(platinumUnit === 'gram' ? platChange : platChange * 10)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-rose-400 font-semibold gap-0.5 rate-financial">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {platChangePct.toFixed(2)}% ({formatCurrencyINR(platinumUnit === 'gram' ? platChange : platChange * 10)})
                      </span>
                    )}
                    <span className="text-[10px] text-[#A69584]">24h change</span>
                  </div>
                </div>

                {/* Sub-breakdowns */}
                <div className="space-y-2 pt-2 border-t border-[#C9A46A]/15 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#D7C9B8]/80 font-medium">10g Ingot:</span>
                    <span className="rate-financial text-[#FAF5ED]">
                      {formatCurrencyINR(rates.platinum * 10)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#D7C9B8]/80 font-medium">1 Kilogram:</span>
                    <span className="rate-financial text-[#FAF5ED]">
                      {formatCurrencyINR(rates.platinum * 1000)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#C9A46A]/15 text-[10px] text-[#A69584] flex items-center justify-between">
                <span>95% Pure Pt</span>
                <span>International Spot</span>
              </div>
            </div>

            {/* 4. DIAMOND BENCHMARK CARD */}
            <div className="relative rounded-2xl bg-gradient-to-b from-[#1C120C] to-[#120B07] border border-[#C9A46A]/40 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between group hover:border-[#C9A46A]/70 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#C9A46A]/15">
                  <div className="flex items-center gap-2">
                    <Gem className="w-4 h-4 text-[#C9A46A]" />
                    <h3 className="font-serif text-lg font-medium text-[#FAF5ED]">Solitaire Benchmark</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-[#C9A46A] uppercase px-2 py-0.5 rounded bg-[#2A1C14]">
                    Rapaport Matrix
                  </span>
                </div>

                <div className="pt-4 pb-3">
                  <span className="text-[10px] font-sans font-semibold tracking-wider uppercase text-[#C9A46A]">
                    1.00ct Natural (G / VS1)
                  </span>
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-2xl sm:text-3xl rate-financial text-[#FAF5ED]">
                      ₹4,40,000
                    </span>
                    <span className="text-xs text-[#D7C9B8]/70">/ct</span>
                  </div>
                  <p className="text-[11px] text-[#D7C9B8]/70 pt-1">
                    Indicative baseline for 1ct Round GIA-certified diamond.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#C9A46A]/15 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#D7C9B8]/80 font-medium">1.00ct Lab-Grown:</span>
                    <span className="rate-financial text-emerald-400">
                      ₹88,000 /ct
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#A69584]">
                    <span>Lab-Grown Value Index:</span>
                    <span className="number-promotion text-emerald-400">80% Savings</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#C9A46A]/15">
                <a
                  href="#diamond-calculator"
                  className="w-full py-2 px-3 rounded-lg bg-[#2A1C14] hover:bg-[#3A281E] text-[#E5C388] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Launch Diamond Calculator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </section>


        {/* =================================================================== */}
        {/* SECTION 2: 7-DAY HISTORICAL SPOT TREND CHART                        */}
        {/* =================================================================== */}
        <section className="rounded-3xl bg-[#140D09] border border-[#C9A46A]/30 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#C9A46A]/15">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#C9A46A]">
                7-Day Price Movement
              </span>
              <h3 className="font-serif text-2xl text-[#FAF5ED] font-normal pt-1">
                Historical Bullion Performance
              </h3>
            </div>

            {/* Metal selector for chart */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <button
                onClick={() => setActiveChartMetal('gold24k')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${activeChartMetal === 'gold24k' ? 'bg-[#C9A46A] text-[#100C09] font-bold' : 'bg-[#21160F] text-[#D7C9B8] hover:bg-[#2F1F15]'}`}
              >
                Gold 24K
              </button>
              <button
                onClick={() => setActiveChartMetal('gold22k')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${activeChartMetal === 'gold22k' ? 'bg-[#C9A46A] text-[#100C09] font-bold' : 'bg-[#21160F] text-[#D7C9B8] hover:bg-[#2F1F15]'}`}
              >
                Gold 22K
              </button>
              <button
                onClick={() => setActiveChartMetal('silver')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${activeChartMetal === 'silver' ? 'bg-[#C9A46A] text-[#100C09] font-bold' : 'bg-[#21160F] text-[#D7C9B8] hover:bg-[#2F1F15]'}`}
              >
                Silver
              </button>
              <button
                onClick={() => setActiveChartMetal('platinum')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${activeChartMetal === 'platinum' ? 'bg-[#C9A46A] text-[#100C09] font-bold' : 'bg-[#21160F] text-[#D7C9B8] hover:bg-[#2F1F15]'}`}
              >
                Platinum
              </button>
            </div>
          </div>

          {/* SVG Sparkline / Trend visualization */}
          <div className="pt-6">
            {historyLoading ? (
              <div className="h-48 flex items-center justify-center text-xs text-[#A69584]">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#C9A46A]" />
                <span>Loading historical market snapshots...</span>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-4">
                {/* SVG Polyline */}
                <div className="relative h-48 w-full">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 700 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C9A46A" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#C9A46A" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {(() => {
                      const vals = history.map(h => h[activeChartMetal]);
                      const min = Math.min(...vals) * 0.998;
                      const max = Math.max(...vals) * 1.002;
                      const range = max - min || 1;

                      const coords = vals.map((v, idx) => {
                        const x = (idx / (vals.length - 1)) * 680 + 10;
                        const y = 150 - ((v - min) / range) * 130;
                        return { x, y, val: v };
                      });

                      const pointsStr = coords.map(c => `${c.x},${c.y}`).join(' ');
                      const areaStr = `${coords[0].x},160 ` + pointsStr + ` ${coords[coords.length - 1].x},160`;

                      return (
                        <>
                          <polygon points={areaStr} fill="url(#chartGradient)" />
                          <polyline
                            fill="none"
                            stroke="#E5C388"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={pointsStr}
                          />
                          {coords.map((c, i) => (
                            <g key={i}>
                              <circle cx={c.x} cy={c.y} r="4" fill="#140D09" stroke="#E5C388" strokeWidth="2" />
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Day labels along X-axis */}
                <div className="grid grid-cols-7 text-center text-[11px] text-[#A69584] pt-2 border-t border-[#C9A46A]/10">
                  {history.map((h, i) => (
                    <div key={i} className="space-y-0.5">
                      <p className="font-semibold text-[#D7C9B8]">{h.dayLabel.split(',')[0]}</p>
                      <p className="text-[10px] text-[#8C7B6D]">{formatCurrencyINR(h[activeChartMetal])}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-[#A69584] py-8">Historical data currently synchronizing with IDC/LBMA.</p>
            )}
          </div>
        </section>


        {/* =================================================================== */}
        {/* SECTION 3: INDIAN JEWELLERY MAKING CHARGE & GST ESTIMATOR           */}
        {/* =================================================================== */}
        <section className="rounded-3xl bg-gradient-to-b from-[#180F0A] to-[#100906] border border-[#C9A46A]/40 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#C9A46A]/15">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#C9A46A] font-semibold tracking-wider uppercase mb-1">
                <Calculator className="w-4 h-4" />
                <span>Transparent Consumer Invoice Estimator</span>
              </div>
              <h3 className="font-serif text-2xl text-[#FAF5ED] font-normal">
                Indian Jewellery Price Calculator
              </h3>
            </div>
            <span className="text-xs text-[#A69584] font-light max-w-xs">
              Computes transparent break-up of pure bullion cost, making charges, and 3% statutory jewellery GST.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
            
            {/* Input Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Metal selection */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#C9A46A] font-semibold mb-2">
                  Select Precious Metal &amp; Purity
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'gold22k', label: 'Gold 22K (916)', sub: 'Bridal Jewellery' },
                    { id: 'gold24k', label: 'Gold 24K (999)', sub: 'Bullion / Coins' },
                    { id: 'gold18k', label: 'Gold 18K (750)', sub: 'Diamond Ornaments' },
                    { id: 'silver',  label: 'Fine Silver',    sub: 'Pooja / Articles' },
                    { id: 'platinum',label: 'Platinum 950',   sub: 'Luxury Bands' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setCalcMetal(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${calcMetal === item.id ? 'bg-[#2B1B12] border-[#C9A46A] text-[#FAF5ED] shadow-sm' : 'bg-[#140D09] border-[#C9A46A]/20 text-[#A69584] hover:border-[#C9A46A]/40'}`}
                    >
                      <p className="text-xs font-semibold text-[#FAF5ED] leading-tight">{item.label}</p>
                      <p className="text-[10px] text-[#C9A46A]/75 mt-0.5">{item.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight in Grams */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <label className="uppercase tracking-wider text-[#C9A46A] font-semibold">
                    Net Weight (Grams)
                  </label>
                  <span className="text-[#FAF5ED] font-mono font-bold">{calcWeight.toFixed(2)} g</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.5"
                    max="100"
                    step="0.5"
                    value={calcWeight}
                    onChange={e => setCalcWeight(parseFloat(e.target.value))}
                    className="flex-1 accent-[#C9A46A] cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0.1"
                    max="1000"
                    step="0.1"
                    value={calcWeight}
                    onChange={e => setCalcWeight(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    className="w-24 px-3 py-1.5 rounded-lg bg-[#140D09] border border-[#C9A46A]/40 text-[#FAF5ED] text-sm text-center font-mono focus:outline-none focus:border-[#C9A46A]"
                  />
                </div>
              </div>

              {/* Making Charges */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <label className="uppercase tracking-wider text-[#C9A46A] font-semibold">
                    Making Charges (Wastage / Craftsmanship)
                  </label>
                  <div className="inline-flex rounded-lg bg-[#140D09] p-0.5 text-[11px] font-semibold border border-[#C9A46A]/30">
                    <button
                      onClick={() => { setCalcMakingType('percent'); setCalcMakingValue(12); }}
                      className={`px-2 py-0.5 rounded-md ${calcMakingType === 'percent' ? 'bg-[#C9A46A] text-[#100C09]' : 'text-[#D7C9B8]'}`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      onClick={() => { setCalcMakingType('perGram'); setCalcMakingValue(600); }}
                      className={`px-2 py-0.5 rounded-md ${calcMakingType === 'perGram' ? 'bg-[#C9A46A] text-[#100C09]' : 'text-[#D7C9B8]'}`}
                    >
                      ₹ per Gram
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max={calcMakingType === 'percent' ? 35 : 5000}
                    step={calcMakingType === 'percent' ? 0.5 : 50}
                    value={calcMakingValue}
                    onChange={e => setCalcMakingValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-[#140D09] border border-[#C9A46A]/40 text-[#FAF5ED] text-sm font-mono focus:outline-none focus:border-[#C9A46A]"
                    placeholder={calcMakingType === 'percent' ? 'e.g. 12%' : 'e.g. ₹600/g'}
                  />
                  <span className="text-xs text-[#A69584] whitespace-nowrap">
                    {calcMakingType === 'percent' ? '% of metal value' : '₹ per gram'}
                  </span>
                </div>
              </div>

            </div>

            {/* Estimated Invoice Ticket (5 cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-[#0E0805] border-2 border-[#C9A46A]/50 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#C9A46A]/20 pb-3">
                    <span className="text-xs uppercase font-serif tracking-[0.2em] text-[#C9A46A]">
                      ESTIMATE BREAK-UP
                    </span>
                    <span className="text-[10px] text-[#A69584] font-mono">GST 3.0% APPLIED</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#A69584]">Selected Spot Rate:</span>
                      <span className="rate-financial text-[#FAF5ED]">{formatCurrencyINR(selectedRate)}/g</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#A69584]">Net Weight:</span>
                      <span className="number-supporting text-[#FAF5ED]">{calcWeight.toFixed(2)} g</span>
                    </div>
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-[#D7C9B8]">Bullion Raw Value:</span>
                      <span className="rate-financial text-[#FAF5ED]">{formatCurrencyINR(rawMetalCost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#A69584]">Making Charges ({calcMakingType === 'percent' ? `${calcMakingValue}%` : `₹${calcMakingValue}/g`}):</span>
                      <span className="number-supporting text-[#E5C388] font-medium">+{formatCurrencyINR(makingChargesAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#C9A46A]/15">
                      <span className="text-[#A69584]">Subtotal (Taxable):</span>
                      <span className="rate-financial text-[#FAF5ED]">{formatCurrencyINR(taxableSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#A69584]">GST (1.5% CGST + 1.5% SGST):</span>
                      <span className="number-supporting text-[#FAF5ED]">+{formatCurrencyINR(gstAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t-2 border-[#C9A46A]/40">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#C9A46A] block font-semibold">
                        ESTIMATED TOTAL INVOICE
                      </span>
                      <span className="text-2xl sm:text-3xl price-total text-[#E5C388]">
                        {formatCurrencyINR(estimatedTotalInvoice)}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#A69584] text-right font-light">
                      Incl. 3% GST
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* =================================================================== */}
        {/* SECTION 4: RAPAPORT-CALIBRATED DIAMOND PRICING MODULE               */}
        {/* =================================================================== */}
        <section id="diamond-calculator" className="rounded-3xl bg-[#140D09] border border-[#C9A46A]/40 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#C9A46A]/15">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#C9A46A] font-semibold tracking-wider uppercase mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Legitimate Rapaport Benchmark Specification</span>
              </div>
              <h3 className="font-serif text-2xl text-[#FAF5ED] font-normal">
                Diamond &amp; Solitaire Pricing Module
              </h3>
            </div>
            <div className="text-xs text-[#A69584] max-w-sm">
              Values calculated using authentic wholesale 4Cs pricing matrices. Transparently differentiates between Natural Mined and Lab-Grown CVD/HPHT diamonds.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
            
            {/* Calculator Inputs (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Origin: Natural vs Lab Grown */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#C9A46A] font-semibold mb-2">
                  Diamond Origin
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDiamondOrigin('natural')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${diamondOrigin === 'natural' ? 'bg-[#2A1B12] border-[#C9A46A] text-[#FAF5ED]' : 'bg-[#100A07] border-[#C9A46A]/20 text-[#A69584] hover:border-[#C9A46A]/40'}`}
                  >
                    <p className="text-xs font-bold text-[#FAF5ED] flex items-center gap-1.5">
                      <span>Natural Mined Diamond</span>
                      <Award className="w-3.5 h-3.5 text-[#C9A46A]" />
                    </p>
                    <p className="text-[10px] text-[#A69584] mt-1">100% Earth-mined heirloom investment value</p>
                  </button>

                  <button
                    onClick={() => setDiamondOrigin('lab_grown')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${diamondOrigin === 'lab_grown' ? 'bg-[#2A1B12] border-emerald-400 text-[#FAF5ED]' : 'bg-[#100A07] border-[#C9A46A]/20 text-[#A69584] hover:border-[#C9A46A]/40'}`}
                  >
                    <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span>Lab-Grown (CVD / HPHT)</span>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    </p>
                    <p className="text-[10px] text-emerald-300/80 mt-1">Identical optical 4Cs at ~80% wholesale savings</p>
                  </button>
                </div>
              </div>

              {/* Carat weight */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <label className="uppercase tracking-wider text-[#C9A46A] font-semibold">
                    Carat Weight
                  </label>
                  <span className="text-[#FAF5ED] font-mono font-bold">{diamondCarat.toFixed(2)} Carats</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.30"
                    max="5.00"
                    step="0.05"
                    value={diamondCarat}
                    onChange={e => setDiamondCarat(parseFloat(e.target.value))}
                    className="flex-1 accent-[#C9A46A] cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0.10"
                    max="10.00"
                    step="0.05"
                    value={diamondCarat}
                    onChange={e => setDiamondCarat(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    className="w-24 px-3 py-1.5 rounded-lg bg-[#100A07] border border-[#C9A46A]/40 text-[#FAF5ED] text-sm text-center font-mono focus:outline-none focus:border-[#C9A46A]"
                  />
                </div>
              </div>

              {/* Shape */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#C9A46A] font-semibold mb-2">
                  Shape
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {['Round', 'Princess', 'Cushion', 'Oval', 'Emerald', 'Pear', 'Marquise', 'Radiant'].map(shape => (
                    <button
                      key={shape}
                      onClick={() => setDiamondShape(shape)}
                      className={`py-2 px-1 text-center rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${diamondShape === shape ? 'bg-[#C9A46A] text-[#100C09] font-bold border-[#C9A46A]' : 'bg-[#100A07] border-[#C9A46A]/20 text-[#D7C9B8] hover:border-[#C9A46A]/40'}`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color & Clarity grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Color */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#C9A46A] font-semibold mb-2">
                    Color Grade (D - K)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(col => (
                      <button
                        key={col}
                        onClick={() => setDiamondColor(col)}
                        className={`py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${diamondColor === col ? 'bg-[#C9A46A] text-[#100C09] border-[#C9A46A]' : 'bg-[#100A07] border-[#C9A46A]/20 text-[#D7C9B8] hover:border-[#C9A46A]/40'}`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clarity */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#C9A46A] font-semibold mb-2">
                    Clarity Grade
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['FL_IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'].map(cla => (
                      <button
                        key={cla}
                        onClick={() => setDiamondClarity(cla)}
                        className={`py-1.5 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${diamondClarity === cla ? 'bg-[#C9A46A] text-[#100C09] border-[#C9A46A]' : 'bg-[#100A07] border-[#C9A46A]/20 text-[#D7C9B8] hover:border-[#C9A46A]/40'}`}
                      >
                        {cla.replace('_', '/')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cut & Certification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cut */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#C9A46A] font-semibold mb-2">
                    Cut Grade
                  </label>
                  <select
                    value={diamondCut}
                    onChange={e => setDiamondCut(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#100A07] border border-[#C9A46A]/40 text-[#FAF5ED] text-xs focus:outline-none focus:border-[#C9A46A]"
                  >
                    <option value="Ideal">Ideal (Triple Ex Hearts &amp; Arrows)</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                {/* Certification */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#C9A46A] font-semibold mb-2">
                    Grading Certification
                  </label>
                  <select
                    value={diamondCert}
                    onChange={e => setDiamondCert(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#100A07] border border-[#C9A46A]/40 text-[#FAF5ED] text-xs focus:outline-none focus:border-[#C9A46A]"
                  >
                    <option value="GIA">GIA (Gemological Institute of America)</option>
                    <option value="IGI">IGI (International Gemological Institute)</option>
                    <option value="SGL">SGL (Solitaire Gemmological Laboratories)</option>
                    <option value="HRD">HRD Antwerp</option>
                    <option value="None">Non-Certified</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Results Presentation Box (5 cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-[#0E0805] border-2 border-[#C9A46A]/50 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#C9A46A]/20 pb-3">
                    <span className="text-xs uppercase font-serif tracking-[0.2em] text-[#C9A46A]">
                      RAPAPORT VALUATION
                    </span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${diamondOrigin === 'natural' ? 'bg-[#C9A46A]/20 text-[#E5C388]' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {diamondOrigin === 'natural' ? 'Natural Mined' : 'Lab-Grown CVD'}
                    </span>
                  </div>

                  {diamondLoading ? (
                    <div className="py-12 text-center text-xs text-[#A69584]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#C9A46A] mb-2" />
                      <span>Computing 4Cs Rapaport Matrix...</span>
                    </div>
                  ) : diamondResult ? (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#A69584]">Specification:</span>
                        <span className="font-semibold text-[#FAF5ED]">
                          {diamondResult.inputs.carat}ct {diamondResult.inputs.shape} ({diamondResult.inputs.color}/{diamondResult.inputs.clarity})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#A69584]">Cut &amp; Lab Cert:</span>
                        <span className="font-semibold text-[#FAF5ED]">
                          {diamondResult.inputs.cut} • {diamondResult.inputs.cert}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[#C9A46A]/15">
                        <span className="text-[#A69584]">Rate per Carat:</span>
                        <span className="rate-financial text-[#E5C388] font-bold">
                          {formatCurrencyINR(diamondResult.estimate.pricePerCarat)} /ct
                        </span>
                      </div>

                      {/* If Lab Grown, show Savings compared to Natural */}
                      {diamondOrigin === 'lab_grown' && diamondResult.estimate.naturalEquivalentPrice && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-emerald-300">
                            <span>Natural Equivalent:</span>
                            <span className="line-through opacity-75 number-supporting">{formatCurrencyINR(diamondResult.estimate.naturalEquivalentPrice)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                            <span>Client Savings:</span>
                            <span className="number-promotion">{formatCurrencyINR(diamondResult.estimate.savingsAmount || 0)} ({diamondResult.estimate.savingsPercent}%)</span>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 text-[10px] text-[#8C7B6D] leading-relaxed">
                        {diamondResult.disclosure.disclaimer}
                      </div>
                    </div>
                  ) : null}
                </div>

                {diamondResult && (
                  <div className="pt-6 mt-4 border-t-2 border-[#C9A46A]/40">
                    <span className="text-[10px] uppercase tracking-wider text-[#C9A46A] block font-semibold">
                      ESTIMATED VALUATION
                    </span>
                    <span className="text-2xl sm:text-3xl price-total text-[#E5C388]">
                      {formatCurrencyINR(diamondResult.estimate.totalPrice)}
                    </span>
                    <span className="text-[10px] text-[#A69584] block pt-0.5">
                      Wholesale reference benchmark • Valid as of {diamondResult.disclosure.asOfDate}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Footer Credentials */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-16 text-center text-xs text-[#8C7B6D] space-y-2">
        <p className="font-serif tracking-widest text-[#C9A46A]/80 uppercase">
          YAZHINI FINE JEWELS • TRADITION • CRAFTED TO SHINE
        </p>
        <p className="text-[11px]">
          Live spot rates sourced via authenticated GoldAPI.io IDC/LBMA real-time data feeds. Retail jewellery rates are indicative guidelines and include 3% GST. Diamond valuations follow calibrated Rapaport industry benchmarks.
        </p>
      </footer>

    </div>
  );
}
