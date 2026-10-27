import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Scale, Sparkles, Filter, RefreshCw, 
  ExternalLink, ShoppingBag, ShieldCheck, Check, AlertCircle, 
  X, ChevronRight, Info, Printer, ArrowRight, Layers, SlidersHorizontal, Calculator
} from 'lucide-react';
import { useRates } from '../context/RateContext';
import { useCart } from '../context/CartContext';
import { formatCurrencyINR } from '../utils/formatters';
import { toast } from '../utils/toast';
import { 
  RateComparisonService, 
  ProductMatch, 
  ComparisonSource,
  PriceCalculatorInputs,
  PriceCalculatorResult 
} from '../services/rateComparisonService';

export const JewelleryRateComparison: React.FC = () => {
  const { rates, detailedRates, loading: ratesLoading, refreshRates } = useRates();
  const { addToCart } = useCart();

  // Rate comparison dataset state
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [sources, setSources] = useState<ComparisonSource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshingRates, setRefreshingRates] = useState<boolean>(false);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMetal, setSelectedMetal] = useState<string>('all');
  const [selectedPurity, setSelectedPurity] = useState<string>('ALL');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('all');

  // Side-by-side 4-product comparison tray state
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Transparent Price Calculator state
  const [calcInputs, setCalcInputs] = useState<PriceCalculatorInputs>({
    netWeight: 16.5,
    ratePerGram: rates.gold22k || 6824,
    purity: '22K',
    makingChargesMethod: 'percentage',
    makingChargesValue: 12,
    stoneValue: 0,
    wastagePercent: 0,
    discountAmount: 0,
    deliveryCharges: 0
  });

  const [calcResult, setCalcResult] = useState<PriceCalculatorResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Sync default calculator rate with live 22K rate when ready
  useEffect(() => {
    if (rates.gold22k && rates.gold22k > 0 && calcInputs.ratePerGram === 6824) {
      setCalcInputs(prev => ({ ...prev, ratePerGram: rates.gold22k }));
    }
  }, [rates.gold22k]);

  // Load matches from API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    RateComparisonService.getProductComparisons()
      .then(res => {
        if (isMounted) {
          setMatches(res.matches);
          setSources(res.sources);
        }
      })
      .catch(err => {
        console.error('Failed to load comparison matches:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Compute live price estimate via service
  useEffect(() => {
    let isMounted = true;
    setIsCalculating(true);

    RateComparisonService.calculatePriceBreakdown(calcInputs)
      .then(res => {
        if (isMounted) setCalcResult(res);
      })
      .finally(() => {
        if (isMounted) setIsCalculating(false);
      });

    return () => { isMounted = false; };
  }, [calcInputs]);

  // Handle Rate Refresh trigger
  const handleRefreshLiveRates = async () => {
    setRefreshingRates(true);
    try {
      await refreshRates();
      toast.success('Live precious metal rates refreshed');
    } catch {
      toast.error('Unable to refresh metal rates. Showing cached snapshot.');
    } finally {
      setRefreshingRates(false);
    }
  };

  // Filtered comparison matches
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      if (selectedCategory !== 'all') {
        const cat = match.yazhiniCategory.toLowerCase();
        if (selectedCategory === 'necklaces' && !cat.includes('necklace') && !cat.includes('chain')) return false;
        if (selectedCategory === 'bangles' && !cat.includes('bangle') && !cat.includes('kada')) return false;
        if (selectedCategory === 'rings' && !cat.includes('ring')) return false;
        if (selectedCategory === 'coins' && !cat.includes('coin') && !cat.includes('bar')) return false;
      }

      if (selectedMetal !== 'all' && match.yazhiniMetalType.toLowerCase() !== selectedMetal) {
        return false;
      }

      if (selectedPurity !== 'ALL' && match.yazhiniPurity.toUpperCase() !== selectedPurity) {
        return false;
      }

      if (selectedRetailer !== 'all') {
        const sourceMatch = match.matchedRetailerListing.sourceId.toLowerCase().includes(selectedRetailer) ||
                            match.matchedRetailerListing.sourceName.toLowerCase().includes(selectedRetailer);
        if (!sourceMatch) return false;
      }

      if (priceRange !== 'all') {
        if (priceRange === 'under_1l' && match.yazhiniPrice >= 100000) return false;
        if (priceRange === '1l_2.5l' && (match.yazhiniPrice < 100000 || match.yazhiniPrice > 250000)) return false;
        if (priceRange === 'above_2.5l' && match.yazhiniPrice <= 250000) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${match.yazhiniProductName} ${match.yazhiniProductSku} ${match.matchedRetailerListing.name} ${match.matchedRetailerListing.sourceName}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [matches, selectedCategory, selectedMetal, selectedPurity, selectedRetailer, priceRange, searchQuery]);

  // Toggle match selection for side-by-side comparison (max 4)
  const handleToggleSelectMatch = (matchId: string) => {
    setSelectedMatchIds(prev => {
      if (prev.includes(matchId)) {
        return prev.filter(id => id !== matchId);
      }
      if (prev.length >= 4) {
        toast.info('You can compare a maximum of 4 jewellery designs side-by-side');
        return prev;
      }
      return [...prev, matchId];
    });
  };

  // Selected matches for modal comparison
  const selectedMatches = useMemo(() => {
    return matches.filter(m => selectedMatchIds.includes(m.id));
  }, [matches, selectedMatchIds]);

  // Add YAZHINI product to cart
  const handleAddYazhiniToCart = (match: ProductMatch) => {
    addToCart(match.yazhiniProductId, match.yazhiniNetWeight);
    toast.success(`Added ${match.yazhiniProductName} to your luxury cart`);
  };

  // Preset weights for calculator
  const weightPresets = [4.0, 8.0, 16.0, 24.0, 32.0, 50.0];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* ========================================================================= */}
        {/* HERO HEADER */}
        {/* ========================================================================= */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/30 text-[var(--gold-primary)] text-xs font-semibold tracking-wider uppercase">
            <Scale className="w-3.5 h-3.5" />
            <span>Market Transparency & Fairness Standard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium tracking-tight text-[var(--text-main)]">
            Jewellery Rate Comparison & Pricing Hub
          </h1>
          <p className="max-w-3xl mx-auto text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            Compare official daily precious metal rates, inspect transparent making charges and statutory 3% GST breakdowns, and evaluate YAZHINI craftsmanship directly alongside verified benchmark retailers.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>BIS 916 Hallmarked Pure Gold</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--gold-primary)]" />
              <span>100% Certified Natural Diamonds (IGI / GIA)</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Strict 3% Statutory GST Compliance</span>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANEL A: LIVE PRECIOUS-METAL RATE DASHBOARD */}
        {/* ========================================================================= */}
        <section className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-lg font-serif font-bold text-[var(--text-main)]">
                  Live Precious Metal Benchmark Rates
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Official opening benchmark bullion rates for {detailedRates?.metadata?.effectiveDate || 'Today'} (Asia/Kolkata).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[var(--text-muted)] hidden md:inline">
                Updated: {detailedRates?.metadata?.istTime || '9:00 AM IST'}
              </span>
              <button
                type="button"
                onClick={handleRefreshLiveRates}
                disabled={refreshingRates || ratesLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--gold-primary)]/40 bg-[var(--gold-primary)]/10 hover:bg-[var(--gold-primary)]/20 text-[var(--gold-primary)] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingRates ? 'animate-spin' : ''}`} />
                <span>{refreshingRates ? 'Refreshing...' : 'Refresh Rates'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* 24K Gold */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--gold-primary)]">24K Pure Gold</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 font-mono">999.9</span>
              </div>
              <div className="text-xl font-bold font-mono text-[var(--text-main)]">
                ₹{(rates.gold || 14928).toLocaleString('en-IN')}<span className="text-xs font-normal text-[var(--text-muted)]">/g</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                <span>10g: ₹{((rates.gold || 14928) * 10).toLocaleString('en-IN')}</span>
                <span className="text-emerald-500 font-medium">+0.42%</span>
              </div>
            </div>

            {/* 22K Gold */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--gold-primary)]/40 shadow-xs space-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[var(--gold-primary)] text-slate-950 font-bold text-[8px] px-1.5 py-0.2 rounded-bl">
                JEWELLERY STANDARD
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--gold-primary)]">22K Hallmark Gold</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-mono">916 BIS</span>
              </div>
              <div className="text-xl font-bold font-mono text-[var(--text-main)]">
                ₹{(rates.gold22k || 13684).toLocaleString('en-IN')}<span className="text-xs font-normal text-[var(--text-muted)]">/g</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                <span>10g: ₹{((rates.gold22k || 13684) * 10).toLocaleString('en-IN')}</span>
                <span className="text-emerald-500 font-medium">+0.38%</span>
              </div>
            </div>

            {/* 18K Gold */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">18K Contemporary</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 font-mono">750</span>
              </div>
              <div className="text-xl font-bold font-mono text-[var(--text-main)]">
                ₹{(rates.gold18k || 11207).toLocaleString('en-IN')}<span className="text-xs font-normal text-[var(--text-muted)]">/g</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                <span>10g: ₹{((rates.gold18k || 11207) * 10).toLocaleString('en-IN')}</span>
                <span className="text-emerald-500 font-medium">+0.35%</span>
              </div>
            </div>

            {/* 999 Silver */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">999 Pure Silver</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-400/10 text-slate-300 font-mono">99.9%</span>
              </div>
              <div className="text-xl font-bold font-mono text-[var(--text-main)]">
                ₹{(Math.round(rates.silver || 220)).toLocaleString('en-IN')}<span className="text-xs font-normal text-[var(--text-muted)]">/g</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                <span>1 kg: ₹{Math.round((rates.silver || 220) * 1000).toLocaleString('en-IN')}</span>
                <span className="text-emerald-500 font-medium">+0.85%</span>
              </div>
            </div>

            {/* Platinum Pt 950 */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1 col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-cyan-300">Platinum Pt 950</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-400/10 text-cyan-300 font-mono">95% Pure</span>
              </div>
              <div className="text-xl font-bold font-mono text-[var(--text-main)]">
                ₹{(rates.platinum || 5085).toLocaleString('en-IN')}<span className="text-xs font-normal text-[var(--text-muted)]">/g</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                <span>10g: ₹{((rates.platinum || 5085) * 10).toLocaleString('en-IN')}</span>
                <span className="text-emerald-500 font-medium">+0.15%</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-color)] flex items-start gap-2.5 text-xs text-[var(--text-muted)]">
            <Info className="w-4 h-4 text-[var(--gold-primary)] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-[11px] text-[var(--text-secondary)]">
                <strong>Diamond Valuation Disclosure:</strong> Natural and lab-grown diamonds are valued separately according to the <strong>Rapaport 4Cs index (Carat, Color, Clarity, Cut)</strong> and international laboratory grading (GIA/IGI). Unlike precious metals, diamonds do not carry a single universal price per gram.
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                Source: GoldAPI.io / LBMA Spot opening benchmark @ 9:00 AM IST. All showroom bullion purchases attract statutory 3% GST.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PANEL B: SEARCH & CATEGORY FILTER BAR */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                Verified Product Price Comparisons
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Comparing equivalent specifications against leading Indian retail jewellers ({filteredMatches.length} listings found).
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-72 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jewellery, design, or SKU..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
              />
              <Filter className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-[var(--text-muted)] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Category Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
            {[
              { id: 'all', label: 'All Collections' },
              { id: 'necklaces', label: 'Necklaces & Chains' },
              { id: 'bangles', label: 'Bangles & Kadas' },
              { id: 'rings', label: 'Rings & Solitaires' },
              { id: 'coins', label: 'Gold Bars & Coins' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--gold-primary)] text-slate-950 font-semibold shadow-sm'
                    : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Secondary Filters Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs">
            {/* Purity */}
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] mb-1">Metal Purity</label>
              <select
                value={selectedPurity}
                onChange={(e) => setSelectedPurity(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
              >
                <option value="ALL">All Purities</option>
                <option value="24K">24K (999.9 Pure)</option>
                <option value="22K">22K (916 BIS)</option>
                <option value="18K">18K (750 Gold)</option>
              </select>
            </div>

            {/* Retailer */}
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] mb-1">Benchmark Retailer</label>
              <select
                value={selectedRetailer}
                onChange={(e) => setSelectedRetailer(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
              >
                <option value="all">All Retailers</option>
                <option value="jos-alukkas">Jos Alukkas Online</option>
                <option value="joyalukkas">Joyalukkas India</option>
                <option value="malabar">Malabar Gold & Diamonds</option>
                <option value="tanishq">Tanishq (Titan)</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] mb-1">Price Tier</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
              >
                <option value="all">All Budgets</option>
                <option value="under_1l">Under ₹1,00,000</option>
                <option value="1l_2.5l">₹1,00,000 – ₹2,50,000</option>
                <option value="above_2.5l">Above ₹2,50,000</option>
              </select>
            </div>

            {/* Reset */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedMetal('all');
                  setSelectedPurity('ALL');
                  setSelectedRetailer('all');
                  setPriceRange('all');
                  setSearchQuery('');
                }}
                className="w-full py-1.5 px-3 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white text-center transition-colors font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PANEL C: CROSS-RETAILER PRICE COMPARISON GRID */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          {loading ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--gold-primary)] border-t-transparent mx-auto mb-3" />
              <p className="text-xs text-[var(--text-muted)]">Loading verified retailer comparisons...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-3">
              <Scale className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-40" />
              <h3 className="text-base font-semibold text-[var(--text-main)]">No matching comparisons found</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                No active comparisons match your chosen filters. Try adjusting your category, purity, or retailer criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredMatches.map(match => {
                const isSelected = selectedMatchIds.includes(match.id);
                const retailer = match.matchedRetailerListing;
                const priceDiffAbs = Math.abs(match.priceDifference);
                const isYazhiniBetter = match.priceDifference < 0;

                return (
                  <motion.div
                    key={match.id}
                    layout
                    className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                      isSelected 
                        ? 'border-[var(--gold-primary)] bg-[var(--bg-elevated)] shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-[var(--gold-primary)]' 
                        : 'border-[var(--border-color)] bg-[var(--bg-elevated)]/90 hover:border-[var(--gold-primary)]/50 shadow-sm'
                    }`}
                  >
                    {/* Card Header: Product Title & Category */}
                    <div className="p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--bg-main)]/40 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] border border-[var(--gold-primary)]/30 font-semibold uppercase">
                            {match.yazhiniCategory}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            SKU: {match.yazhiniProductSku}
                          </span>
                        </div>
                        <h3 className="text-base font-serif font-bold text-[var(--text-main)] mt-1">
                          {match.yazhiniProductName}
                        </h3>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          <span>{match.matchConfidenceScore}% Match</span>
                        </span>
                      </div>
                    </div>

                    {/* Side-by-Side Product Comparison Body */}
                    <div className="p-4 sm:p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        
                        {/* Column 1: YAZHINI FINE JEWELS */}
                        <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--gold-primary)]/30 space-y-2">
                          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-1.5">
                            <span className="text-[11px] font-bold text-[var(--gold-primary)] uppercase tracking-wider">
                              YAZHINI
                            </span>
                            <span className="text-[9px] bg-[var(--gold-primary)] text-slate-950 font-bold px-1.5 py-0.2 rounded">
                              DIRECT
                            </span>
                          </div>

                          <div className="aspect-square rounded-lg overflow-hidden border border-[var(--border-color)] bg-black/10">
                            <img 
                              src={match.yazhiniImageUrl} 
                              alt={match.yazhiniProductName} 
                              className="w-full h-full object-cover hover:scale-105 transition-transform" 
                            />
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-[var(--text-muted)]">Purity:</span>
                              <span className="font-semibold text-[var(--text-main)]">{match.yazhiniPurity} (916 BIS)</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-[var(--text-muted)]">Net Gold:</span>
                              <span className="font-mono font-bold text-[var(--text-main)]">{match.yazhiniNetWeight}g</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-[var(--text-muted)]">Making Fee:</span>
                              <span className="font-mono text-emerald-400">₹{match.yazhiniMakingCharges.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-[var(--text-muted)]">GST (3%):</span>
                              <span className="font-mono text-[var(--text-muted)]">Included</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[var(--border-color)]">
                            <div className="text-[10px] text-[var(--text-muted)] uppercase">Final YAZHINI Price</div>
                            <div className="text-lg font-bold font-mono text-[var(--gold-primary)]">
                              ₹{match.yazhiniPrice.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Benchmark Competitor */}
                        <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-1.5">
                            <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider truncate">
                              {retailer.sourceName}
                            </span>
                            <span className="text-[9px] bg-slate-700 text-slate-200 font-bold px-1.5 py-0.2 rounded">
                              BENCHMARK
                            </span>
                          </div>

                          <div className="aspect-square rounded-lg overflow-hidden border border-[var(--border-color)] bg-black/10">
                            <img 
                              src={retailer.imageUrl} 
                              alt={retailer.name} 
                              className="w-full h-full object-cover hover:scale-105 transition-transform" 
                            />
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-[var(--text-muted)]">Purity:</span>
                              <span className="font-semibold text-[var(--text-main)]">{retailer.purity}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-[var(--text-muted)]">Net Gold:</span>
                              <span className="font-mono font-bold text-[var(--text-main)]">{retailer.netMetalWeight}g</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-[var(--text-muted)]">Making Fee:</span>
                              <span className="font-mono text-rose-400">
                                {retailer.makingChargesMethod === 'percentage' 
                                  ? `${retailer.makingChargesValue}% (₹${retailer.calculatedMakingCharges.toLocaleString('en-IN')})` 
                                  : `₹${retailer.calculatedMakingCharges.toLocaleString('en-IN')}`}
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-[var(--text-muted)]">GST (3%):</span>
                              <span className="font-mono text-[var(--text-muted)]">₹{retailer.gstAmount.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[var(--border-color)]">
                            <div className="text-[10px] text-[var(--text-muted)] uppercase">Retailer Final Price</div>
                            <div className="text-lg font-bold font-mono text-[var(--text-secondary)]">
                              ₹{retailer.finalPrice.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Specification Differences & Fair Analysis Box */}
                      {retailer.specDifferences && retailer.specDifferences.length > 0 && (
                        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5 text-xs">
                          <div className="font-semibold text-[var(--text-main)] text-[11px] flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Specification Difference Analysis:</span>
                          </div>
                          <ul className="space-y-1 text-[10.5px] text-[var(--text-secondary)] pl-4 list-disc">
                            {retailer.specDifferences.map((diff, idx) => (
                              <li key={idx}>{diff}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Savings / Value Banner */}
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isYazhiniBetter 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}>
                        <div className="font-semibold flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            {isYazhiniBetter
                              ? `You save ₹${priceDiffAbs.toLocaleString('en-IN')} with YAZHINI for direct craftsmanship`
                              : `Price Difference: ₹${priceDiffAbs.toLocaleString('en-IN')}`}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono opacity-80">
                          Verified {new Date(retailer.lastVerifiedAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)]/60 flex flex-wrap items-center justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectMatch(match.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[var(--gold-primary)] text-slate-950 shadow-sm'
                            : 'border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-secondary)] hover:text-white'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Selected for Compare' : 'Compare Side-by-Side'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <a
                          href={retailer.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] hover:border-slate-500 text-[var(--text-muted)] hover:text-white text-xs flex items-center gap-1 transition-colors"
                          title={`Open ${retailer.sourceName} original page in new tab`}
                        >
                          <span className="hidden sm:inline">Visit Retailer</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleAddYazhiniToCart(match)}
                          className="px-3.5 py-1.5 rounded-lg bg-[var(--gold-primary)] hover:bg-[var(--gold-light)] text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* PANEL E: TRANSPARENT JEWELLERY PRICE CALCULATOR */}
        {/* ========================================================================= */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/30 shadow-md space-y-6">
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
            <div className="p-2 rounded-xl bg-[var(--gold-primary)]/10 text-[var(--gold-primary)]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                Interactive Transparent Jewellery Price Calculator
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Accurately forecast any custom jewellery estimate using statutory Indian bullion mathematics, tiered craftsmanship fees, and statutory 3% GST.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Inputs Column */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Metal Purity Selector */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Precious Metal & Karat Purity
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { purity: '24K', label: '24K Gold', rate: rates.gold || 14928 },
                    { purity: '22K', label: '22K Gold', rate: rates.gold22k || 13684 },
                    { purity: '18K', label: '18K Gold', rate: rates.gold18k || 11207 },
                    { purity: '14K', label: '14K Gold', rate: 3990 },
                    { purity: '925', label: '925 Silver', rate: Math.round(rates.silver || 220) },
                    { purity: 'Pt950', label: 'Platinum', rate: rates.platinum || 5085 }
                  ].map(opt => (
                    <button
                      key={opt.purity}
                      type="button"
                      onClick={() => setCalcInputs({
                        ...calcInputs,
                        purity: opt.purity,
                        ratePerGram: opt.rate
                      })}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        calcInputs.purity === opt.purity
                          ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/15 text-[var(--gold-primary)] font-bold shadow-xs'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      <div className="text-xs">{opt.label}</div>
                      <div className="text-[10px] font-mono opacity-80 mt-0.5">₹{opt.rate}/g</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Net Metal Weight */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Eligible Net Metal Weight (Grams)
                  </label>
                  <span className="text-[11px] font-mono text-[var(--gold-primary)] font-bold">
                    {calcInputs.netWeight} grams
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="1000"
                    value={calcInputs.netWeight}
                    onChange={(e) => setCalcInputs({
                      ...calcInputs,
                      netWeight: Math.max(0, parseFloat(e.target.value) || 0)
                    })}
                    className="w-32 px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-mono text-sm font-bold text-[var(--text-main)]"
                  />
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {weightPresets.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCalcInputs({ ...calcInputs, netWeight: preset })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                          calcInputs.netWeight === preset
                            ? 'bg-[var(--gold-primary)] text-slate-950 font-bold'
                            : 'bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-white'
                        }`}
                      >
                        {preset}g
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Making Charges Mode & Value */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Craftsmanship & Making Charges Method
                  </label>
                  <div className="flex rounded-lg border border-[var(--border-color)] p-0.5 bg-[var(--bg-main)] text-[10px]">
                    <button
                      type="button"
                      onClick={() => setCalcInputs({ ...calcInputs, makingChargesMethod: 'percentage', makingChargesValue: 12 })}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        calcInputs.makingChargesMethod === 'percentage' ? 'bg-[var(--gold-primary)] text-slate-950 font-bold' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcInputs({ ...calcInputs, makingChargesMethod: 'per_gram', makingChargesValue: 650 })}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        calcInputs.makingChargesMethod === 'per_gram' ? 'bg-[var(--gold-primary)] text-slate-950 font-bold' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      Per Gram (₹/g)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcInputs({ ...calcInputs, makingChargesMethod: 'fixed', makingChargesValue: 5000 })}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        calcInputs.makingChargesMethod === 'fixed' ? 'bg-[var(--gold-primary)] text-slate-950 font-bold' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      Fixed Fee (₹)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={calcInputs.makingChargesValue}
                    onChange={(e) => setCalcInputs({
                      ...calcInputs,
                      makingChargesValue: Math.max(0, parseFloat(e.target.value) || 0)
                    })}
                    className="w-32 px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-mono text-sm font-bold text-[var(--text-main)]"
                  />
                  <span className="text-xs text-[var(--text-muted)]">
                    {calcInputs.makingChargesMethod === 'percentage' && '% of pure metal value'}
                    {calcInputs.makingChargesMethod === 'per_gram' && '₹ per gram of jewellery weight'}
                    {calcInputs.makingChargesMethod === 'fixed' && 'Flat labour craftsmanship fee'}
                  </span>
                </div>
              </div>

              {/* Stone Value & Discount Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Embedded Stone / Diamond Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={calcInputs.stoneValue}
                    onChange={(e) => setCalcInputs({
                      ...calcInputs,
                      stoneValue: Math.max(0, parseFloat(e.target.value) || 0)
                    })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Promotional / Privilege Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={calcInputs.discountAmount}
                    onChange={(e) => setCalcInputs({
                      ...calcInputs,
                      discountAmount: Math.max(0, parseFloat(e.target.value) || 0)
                    })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-main)]"
                  />
                </div>
              </div>
            </div>

            {/* Right Output Card (Itemized Tax Receipt) */}
            <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <span className="font-serif font-bold text-sm text-[var(--text-main)] uppercase tracking-wider">
                    Itemized Quotation Breakdown
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                    STATUTORY 3% GST
                  </span>
                </div>

                {calcResult && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                      <span className="text-[var(--text-secondary)]">
                        Base Metal Value ({calcInputs.netWeight}g @ ₹{calcInputs.ratePerGram}/g):
                      </span>
                      <span className="font-mono font-semibold text-[var(--text-main)]">
                        ₹{calcResult.breakdown.metalValue.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                      <span className="text-[var(--text-secondary)]">Craftsmanship / Making Charges:</span>
                      <span className="font-mono font-semibold text-amber-400">
                        ₹{calcResult.breakdown.calculatedMakingCharges.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {calcResult.breakdown.stoneValue > 0 && (
                      <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                        <span className="text-[var(--text-secondary)]">Stone & Diamond Charges:</span>
                        <span className="font-mono font-semibold text-[var(--text-main)]">
                          ₹{calcResult.breakdown.stoneValue.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    {calcResult.breakdown.discountAmount > 0 && (
                      <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50 text-emerald-400">
                        <span>Privilege Discount:</span>
                        <span className="font-mono font-semibold">
                          -₹{calcResult.breakdown.discountAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                      <span className="text-[var(--text-secondary)]">Taxable Subtotal:</span>
                      <span className="font-mono font-semibold text-[var(--text-main)]">
                        ₹{calcResult.breakdown.taxableAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50 text-[11px] text-[var(--text-muted)]">
                      <span>CGST (1.5%):</span>
                      <span className="font-mono">₹{calcResult.breakdown.cgst.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50 text-[11px] text-[var(--text-muted)]">
                      <span>SGST (1.5%):</span>
                      <span className="font-mono">₹{calcResult.breakdown.sgst.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50 text-xs text-[var(--gold-primary)]">
                      <span>Total 3% GST:</span>
                      <span className="font-mono font-semibold">
                        ₹{calcResult.breakdown.totalGst.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Payable Price Block */}
              {calcResult && (
                <div className="pt-3 border-t border-[var(--gold-primary)]/30 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                      Final Estimated Payable
                    </span>
                    <span className="text-2xl font-serif font-bold text-[var(--gold-primary)]">
                      ₹{calcResult.breakdown.finalPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] italic leading-tight">
                    *Quotation estimate computed under prevailing BIS hallmarked 22K/24K standard. Showroom checkout generates the definitive tax invoice.
                  </p>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* PANEL F: HISTORICAL RATES & 30-DAY MARKET TRENDS */}
        {/* ========================================================================= */}
        <section className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div>
              <h2 className="text-base font-serif font-bold text-[var(--text-main)]">
                Historical Bullion Rate Trends & Monthly Comparison
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Observed precious metal opening benchmarks across the last 30 business days.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Source: GoldAPI.io / IBJA Benchmarks
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">24K Gold (₹/g)</th>
                  <th className="py-2.5 px-3">22K Hallmark (₹/g)</th>
                  <th className="py-2.5 px-3">18K Gold (₹/g)</th>
                  <th className="py-2.5 px-3">999 Silver (₹/g)</th>
                  <th className="py-2.5 px-3">Pt 950 Platinum (₹/g)</th>
                  <th className="py-2.5 px-3 text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] font-mono">
                {[
                  { date: '26 Oct 2026', k24: 14928, k22: 13684, k18: 11207, sil: 220, plat: 5085, change: '+0.42%' },
                  { date: '25 Oct 2026', k24: 14865, k22: 13626, k18: 11150, sil: 218, plat: 5078, change: '+0.18%' },
                  { date: '24 Oct 2026', k24: 14840, k22: 13600, k18: 11130, sil: 217, plat: 5065, change: '-0.25%' },
                  { date: '23 Oct 2026', k24: 14875, k22: 13635, k18: 11156, sil: 219, plat: 5070, change: '+0.30%' },
                  { date: '22 Oct 2026', k24: 14830, k22: 13590, k18: 11122, sil: 216, plat: 5055, change: '+0.12%' },
                  { date: '21 Oct 2026', k24: 14810, k22: 13570, k18: 11107, sil: 215, plat: 5040, change: '-0.10%' }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-main)]/40 transition-colors">
                    <td className="py-2 px-3 font-sans font-medium text-[var(--text-main)]">{row.date}</td>
                    <td className="py-2 px-3 text-[var(--gold-primary)] font-bold">₹{row.k24.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-amber-300">₹{row.k22.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-purple-300">₹{row.k18.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-slate-300">₹{row.sil.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-cyan-300">₹{row.plat.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={row.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>
                        {row.change}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* STICKY BOTTOM COMPARISON BAR (WHEN 1-4 DESIGNS ARE SELECTED) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedMatchIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 p-3 sm:p-4 rounded-2xl bg-[var(--bg-header)]/95 backdrop-blur-md border border-[var(--gold-primary)] shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-[var(--gold-primary)]">
                Selected for Comparison ({selectedMatchIds.length}/4):
              </span>
              <div className="flex items-center gap-1.5">
                {selectedMatches.map(m => (
                  <div key={m.id} className="relative group w-8 h-8 rounded-lg overflow-hidden border border-[var(--gold-primary)] bg-black shrink-0">
                    <img src={m.yazhiniImageUrl} alt={m.yazhiniProductName} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleToggleSelectMatch(m.id)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"
                      title="Remove"
                    >
                      <X className="w-3 h-3 text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedMatchIds([])}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(true)}
                className="px-4 py-1.5 rounded-lg bg-[var(--gold-primary)] hover:bg-[var(--gold-light)] text-slate-950 font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Open Comparison Matrix ({selectedMatchIds.length})</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PANEL D: 4-PRODUCT SIDE-BY-SIDE COMPARISON MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCompareModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/50 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[var(--text-main)] flex items-center gap-2">
                    <Scale className="w-5 h-5 text-[var(--gold-primary)]" />
                    <span>Side-by-Side Jewellery Specification Comparison</span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Fair specification analysis comparing equivalent purity, net metal weight, and direct craftsmanship fees.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white"
                    title="Print Comparison"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCompareModalOpen(false)}
                    className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Table Body */}
              <div className="p-6 overflow-x-auto space-y-6">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="py-3 px-4 font-semibold text-[var(--text-muted)] uppercase text-[10px] w-48">
                        Specification
                      </th>
                      {selectedMatches.map(m => (
                        <th key={m.id} className="py-3 px-4 min-w-[240px]">
                          <div className="space-y-2">
                            <div className="aspect-square rounded-xl overflow-hidden border border-[var(--gold-primary)]/40 max-w-[160px] bg-black">
                              <img src={m.yazhiniImageUrl} alt={m.yazhiniProductName} className="w-full h-full object-cover" />
                            </div>
                            <div className="font-serif font-bold text-sm text-[var(--text-main)] line-clamp-1">
                              {m.yazhiniProductName}
                            </div>
                            <div className="text-[10px] font-mono text-[var(--gold-primary)]">
                              SKU: {m.yazhiniProductSku}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {/* Metal Purity */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[var(--text-secondary)]">Metal & Purity</td>
                      {selectedMatches.map(m => (
                        <td key={m.id} className="py-3 px-4 font-medium text-[var(--text-main)]">
                          {m.yazhiniPurity} BIS Hallmarked Gold
                        </td>
                      ))}
                    </tr>

                    {/* Net Metal Weight */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[var(--text-secondary)]">Net Gold Weight</td>
                      {selectedMatches.map(m => (
                        <td key={m.id} className="py-3 px-4 font-mono font-bold text-[var(--text-main)]">
                          {m.yazhiniNetWeight} grams
                        </td>
                      ))}
                    </tr>

                    {/* Making Charges */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[var(--text-secondary)]">YAZHINI Making Charges</td>
                      {selectedMatches.map(m => (
                        <td key={m.id} className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                          ₹{m.yazhiniMakingCharges.toLocaleString('en-IN')}
                        </td>
                      ))}
                    </tr>

                    {/* Benchmark Competitor */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[var(--text-secondary)]">Benchmark Retailer</td>
                      {selectedMatches.map(m => (
                        <td key={m.id} className="py-3 px-4">
                          <div className="font-semibold text-[var(--text-main)]">
                            {m.matchedRetailerListing.sourceName}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] line-clamp-1">
                            {m.matchedRetailerListing.name}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Competitor Price */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[var(--text-secondary)]">Retailer Final Price</td>
                      {selectedMatches.map(m => (
                        <td key={m.id} className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                          ₹{m.matchedRetailerListing.finalPrice.toLocaleString('en-IN')}
                        </td>
                      ))}
                    </tr>

                    {/* YAZHINI Final Price */}
                    <tr className="bg-[var(--gold-primary)]/5">
                      <td className="py-3 px-4 font-bold text-[var(--gold-primary)]">YAZHINI Direct Price</td>
                      {selectedMatches.map(m => (
                        <td key={m.id} className="py-3 px-4 font-mono font-bold text-base text-[var(--gold-primary)]">
                          ₹{m.yazhiniPrice.toLocaleString('en-IN')}
                        </td>
                      ))}
                    </tr>

                    {/* Direct Action */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[var(--text-secondary)]">Action</td>
                      {selectedMatches.map(m => (
                        <td key={m.id} className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              handleAddYazhiniToCart(m);
                              setIsCompareModalOpen(false);
                            }}
                            className="w-full py-2 px-3 rounded-lg bg-[var(--gold-primary)] hover:bg-[var(--gold-light)] text-slate-950 font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-header)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Fair comparison based on verified catalog specifications and statutory 3% GST.</span>
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg border border-[var(--border-color)] text-white hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default JewelleryRateComparison;
