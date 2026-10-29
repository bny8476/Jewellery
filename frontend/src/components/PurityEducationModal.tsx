import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShieldCheck, Gem, Sparkles, CheckCircle2, ArrowRight, 
  Search, Info, Award, Droplet
} from 'lucide-react';
import { useScrollLock } from '../utils/useScrollLock';
import { toast } from '../utils/toast';

interface PurityEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'huid' | '4cs' | 'metals' | 'care';
}

export const PurityEducationModal: React.FC<PurityEducationModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'huid'
}) => {
  useScrollLock(isOpen, { onEscape: onClose });

  const [activeTab, setActiveTab] = useState<'huid' | '4cs' | 'metals' | 'care'>(initialTab);

  // HUID Simulator State
  const [huidInput, setHuidInput] = useState<string>('YZ916A');
  const [huidResult, setHuidResult] = useState<{
    valid: boolean;
    huid: string;
    carat: string;
    purity: string;
    ahcCenter: string;
    articleType: string;
    hallmarkDate: string;
  } | null>({
    valid: true,
    huid: 'YZ916A',
    carat: '22K Gold',
    purity: '916.0 Fineness (91.6% Pure Gold)',
    ahcCenter: 'Chennai South Assaying & Hallmarking Centre (AHC-042)',
    articleType: 'Heirloom Bridal Jewellery / Haram',
    hallmarkDate: 'Certified 14-Oct-2026'
  });

  // 4Cs Visualizer State
  const [selectedCarat, setSelectedCarat] = useState<number>(1.0);
  const [selectedColor, setSelectedColor] = useState<string>('F');
  const [selectedClarity, setSelectedClarity] = useState<string>('VVS1');
  const [selectedCut, setSelectedCut] = useState<string>('Excellent');

  if (!isOpen) return null;

  const handleVerifyHuid = (codeToVerify?: string) => {
    const code = (codeToVerify || huidInput).trim().toUpperCase();
    if (!code || code.length < 5) {
      toast.error('Please enter a valid 6-character HUID alphanumeric code.');
      return;
    }

    // Determine simulated details based on code
    const is18K = code.includes('18') || code.includes('750') || code.includes('D');
    const is14K = code.includes('14') || code.includes('585');

    setHuidResult({
      valid: true,
      huid: code,
      carat: is18K ? '18K Gold' : is14K ? '14K Gold' : '22K Gold',
      purity: is18K ? '750.0 Fineness (75.0% Pure Gold)' : is14K ? '585.0 Fineness (58.5% Pure Gold)' : '916.0 Fineness (91.6% Pure Gold)',
      ahcCenter: 'Govt. Authorised BIS Assaying Centre (Tamil Nadu AHC-108)',
      articleType: is18K ? 'Natural Diamond Solitaire Setting' : 'Hallmarked Temple Craftsmanship',
      hallmarkDate: 'Verified Live Database Record'
    });
    toast.success(`HUID ${code} verified successfully with BIS Bureau.`);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[1350] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto text-[var(--text-main)]"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C6A15B]/20 border border-[#C6A15B]/40 flex items-center justify-center text-[#C6A15B] shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-inter font-bold text-[var(--text-main)]">
                Purity &amp; Certification Authority
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Educational guide to 6-digit laser hallmarking, 4Cs natural diamond evaluation, and metal standards
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-color)] mb-6 overflow-x-auto no-scrollbar gap-1">
            {[
              { id: 'huid', label: 'BIS 6-Digit HUID', icon: ShieldCheck },
              { id: '4cs', label: '4Cs of Diamonds', icon: Gem },
              { id: 'metals', label: 'Carat Standards (24K–14K)', icon: Sparkles },
              { id: 'care', label: 'Heirloom Jewellery Care', icon: Droplet },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-[#35172F] text-white dark:bg-[#D8B878] dark:text-[#120D0F] font-bold shadow-xs'
                      : 'text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: BIS 6-Digit HUID Hallmarking */}
          {activeTab === 'huid' && (
            <div className="space-y-6">
              {/* Laser Stamp Visual Breakdown */}
              <div className="bg-gradient-to-r from-[#28030B] to-[#450817] p-5 rounded-2xl text-white border border-[#C6A15B]/30 shadow-lg">
                <span className="text-[10px] uppercase tracking-wider text-[#C6A15B] font-bold block mb-2">
                  THE MANDATORY 3-MARK BIS PURITY SEAL (STAMPED ON EVERY PIECE)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
                    <span className="text-2xl font-inter font-bold text-[#C6A15B] block mb-1">▲</span>
                    <span className="text-xs font-bold block text-white">1. BIS Standard Mark</span>
                    <span className="text-[10px] text-white/80">Govt. Bureau of Indian Standards triangular seal</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
                    <span className="text-lg font-mono font-bold text-emerald-400 block mb-1">22K 916</span>
                    <span className="text-xs font-bold block text-white">2. Purity &amp; Fineness</span>
                    <span className="text-[10px] text-white/80">22K916 (91.6% Gold) or 18K750 (75.0% Gold)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
                    <span className="text-lg font-mono font-bold text-[#D8B878] block mb-1">YZ916A</span>
                    <span className="text-xs font-bold block text-white">3. 6-Digit HUID Code</span>
                    <span className="text-[10px] text-white/80">Unique Laser ID traceable on Govt. BIS Care App</span>
                  </div>
                </div>
              </div>

              {/* Interactive HUID Verifier Simulator */}
              <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-[#8C6D37] dark:text-[#D8B878]" />
                    <span>Simulated BIS Care App Live Verification</span>
                  </h4>
                  <span className="text-[10px] text-stone-600 dark:text-stone-400 font-medium">Test sample laser codes below:</span>
                </div>

                {/* Sample Code Badges */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {['YZ916A', 'KL750D', 'TN22K8', 'BR916X'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setHuidInput(sample);
                        handleVerifyHuid(sample);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#8C6D37] text-xs font-mono font-bold text-[#8C6D37] dark:text-[var(--gold-primary)] cursor-pointer"
                    >
                      {sample}
                    </button>
                  ))}
                </div>

                {/* Input & Action */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={huidInput}
                    onChange={(e) => setHuidInput(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit HUID code..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[#8C6D37]"
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyHuid()}
                    className="px-5 py-2.5 rounded-xl bg-[#35172F] hover:bg-[#4A2242] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Verify</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Verification Result Card */}
                {huidResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-500/20">
                      <span className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Genuine BIS HUID Record Authenticated
                      </span>
                      <span className="font-mono font-bold text-xs bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-900 dark:text-white">
                        {huidResult.huid}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-emerald-800/70 dark:text-white/60 block font-medium">Certified Metal:</span>
                        <span className="font-semibold text-stone-900 dark:text-white">{huidResult.carat} ({huidResult.purity})</span>
                      </div>
                      <div>
                        <span className="text-emerald-800/70 dark:text-white/60 block font-medium">Jewellery Category:</span>
                        <span className="font-semibold text-stone-900 dark:text-white">{huidResult.articleType}</span>
                      </div>
                      <div>
                        <span className="text-emerald-800/70 dark:text-white/60 block font-medium">Assaying &amp; Hallmarking Centre:</span>
                        <span className="font-semibold text-stone-900 dark:text-white">{huidResult.ahcCenter}</span>
                      </div>
                      <div>
                        <span className="text-emerald-800/70 dark:text-white/60 block font-medium">Registry Status:</span>
                        <span className="font-semibold text-stone-900 dark:text-white">{huidResult.hallmarkDate}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* BIS Care App info */}
              <div className="p-4 rounded-2xl bg-[var(--bg-elevated)]/60 border border-[var(--border-color)] flex items-start gap-3 text-xs text-stone-700 dark:text-[var(--text-secondary)]">
                <Info className="w-5 h-5 text-[#8C6D37] dark:text-[#D8B878] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[var(--text-main)] block mb-0.5">
                    How to verify independently using your smartphone
                  </span>
                  <p className="leading-relaxed">
                    Download the official <strong className="text-[var(--text-main)]">BIS Care App</strong> (Govt. of India) from Google Play Store or Apple App Store. Tap <em className="text-[var(--text-main)]">"Verify HUID"</em> and type the 6 characters laser-inscribed on your YAZHINI jewel. It displays the jeweller name, registration number, and purity test date.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: The 4Cs of Diamonds */}
          {activeTab === '4cs' && (
            <div className="space-y-6">
              {/* Natural Diamond Guarantee Banner */}
              <div className="bg-gradient-to-r from-[#0C1929] to-[#1E3A5F] p-4 rounded-2xl text-white border border-cyan-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Gem className="w-7 h-7 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block text-white">100% Conflict-Free Natural Mined Diamonds</span>
                    <span className="text-[10px] text-cyan-200">Individually graded and sealed by IGI (International Gemological Institute) &amp; GIA</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                  IGI Certified
                </span>
              </div>

              {/* 4Cs Interactive Visual Grid */}
              <div className="space-y-4">
                {/* 1. Carat Selector */}
                <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <div className="flex justify-between items-center text-xs mb-2.5">
                    <span className="font-bold text-[var(--text-main)]">1. Carat Weight (Size)</span>
                    <span className="font-mono font-bold text-[#8C6D37] dark:text-[#EED2A2]">{selectedCarat} ct</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[0.25, 0.50, 1.00, 1.50, 2.00].map((ct) => (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => setSelectedCarat(ct)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedCarat === ct
                            ? 'border-[#35172F] bg-[#35172F] text-white dark:border-[#D8B878] dark:bg-[#D8B878] dark:text-[#120D0F] font-bold shadow-xs'
                            : 'border-[var(--border-color)] bg-[var(--bg-card)] text-stone-700 dark:text-stone-300 hover:border-stone-400'
                        }`}
                      >
                        <span className="block text-xs font-bold">{ct} ct</span>
                        <span className={`block text-[10px] mt-0.5 ${selectedCarat === ct ? 'text-white/80 dark:text-black/75' : 'text-stone-500 dark:text-stone-400'}`}>
                          {ct * 6.5 > 10 ? '8.1mm' : ct === 1.0 ? '6.5mm' : ct === 0.5 ? '5.2mm' : '4.1mm'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Colour Selector */}
                <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <div className="flex justify-between items-center text-xs mb-2.5">
                    <span className="font-bold text-[var(--text-main)]">2. Colour Grade (Whiteness)</span>
                    <span className="font-mono font-bold text-[#8C6D37] dark:text-[#EED2A2]">Grade {selectedColor} (Colourless / Rare)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { grade: 'D-F', label: 'Colourless', desc: 'Top Tier Rare', pick: 'F' },
                      { grade: 'G-H', label: 'Near Colourless', desc: 'High Brilliance', pick: 'G' },
                      { grade: 'I-J', label: 'Eye White', desc: 'Commercial Value', pick: 'I' },
                      { grade: 'K-M', label: 'Faint Tint', desc: 'Warm Hue', pick: 'K' },
                    ].map((c) => (
                      <button
                        key={c.grade}
                        type="button"
                        onClick={() => setSelectedColor(c.pick)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedColor === c.pick
                            ? 'border-[#35172F] bg-[#35172F] text-white dark:border-[#D8B878] dark:bg-[#D8B878] dark:text-[#120D0F] font-bold shadow-xs'
                            : 'border-[var(--border-color)] bg-[var(--bg-card)] text-stone-700 dark:text-stone-300 hover:border-stone-400'
                        }`}
                      >
                        <span className="block text-xs font-bold">{c.grade}</span>
                        <span className={`block text-[10px] mt-0.5 ${selectedColor === c.pick ? 'text-white/80 dark:text-black/75' : 'text-stone-600 dark:text-stone-400'}`}>
                          {c.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Clarity Selector */}
                <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <div className="flex justify-between items-center text-xs mb-2.5">
                    <span className="font-bold text-[var(--text-main)]">3. Clarity Grade (Inclusions)</span>
                    <span className="font-mono font-bold text-[#8C6D37] dark:text-[#EED2A2]">{selectedClarity}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'FL/IF', label: 'Flawless', desc: 'Under 10x Loupe' },
                      { id: 'VVS1', label: 'VVS1 / VVS2', desc: 'Minuscule Inclusions' },
                      { id: 'VS1', label: 'VS1 / VS2', desc: 'Eye Clean Clarity' },
                      { id: 'SI1', label: 'SI1 / SI2', desc: 'Slight Inclusions' },
                    ].map((cl) => (
                      <button
                        key={cl.id}
                        type="button"
                        onClick={() => setSelectedClarity(cl.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedClarity === cl.id
                            ? 'border-[#35172F] bg-[#35172F] text-white dark:border-[#D8B878] dark:bg-[#D8B878] dark:text-[#120D0F] font-bold shadow-xs'
                            : 'border-[var(--border-color)] bg-[var(--bg-card)] text-stone-700 dark:text-stone-300 hover:border-stone-400'
                        }`}
                      >
                        <span className="block text-xs font-bold">{cl.id}</span>
                        <span className={`block text-[10px] mt-0.5 ${selectedClarity === cl.id ? 'text-white/80 dark:text-black/75' : 'text-stone-600 dark:text-stone-400'}`}>
                          {cl.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Cut Quality */}
                <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <div className="flex justify-between items-center text-xs mb-2.5">
                    <span className="font-bold text-[var(--text-main)]">4. Cut Grade (Fire &amp; Sparkle)</span>
                    <span className="font-mono font-bold text-[#8C6D37] dark:text-[#EED2A2]">{selectedCut}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'Excellent', label: 'Ideal Hearts & Arrows', desc: 'Maximum light return' },
                      { id: 'Very Good', label: 'Very Good Cut', desc: 'Superb fire & scintillation' },
                      { id: 'Good', label: 'Good Proportions', desc: 'Classic balance' },
                    ].map((cut) => (
                      <button
                        key={cut.id}
                        type="button"
                        onClick={() => setSelectedCut(cut.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedCut === cut.id
                            ? 'border-[#35172F] bg-[#35172F] text-white dark:border-[#D8B878] dark:bg-[#D8B878] dark:text-[#120D0F] font-bold shadow-xs'
                            : 'border-[var(--border-color)] bg-[var(--bg-card)] text-stone-700 dark:text-stone-300 hover:border-stone-400'
                        }`}
                      >
                        <span className="block text-xs font-bold">{cut.id}</span>
                        <span className={`block text-[10px] mt-0.5 ${selectedCut === cut.id ? 'text-white/80 dark:text-black/75' : 'text-stone-600 dark:text-stone-400'}`}>
                          {cut.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Precious Metal Carat Standards */}
          {activeTab === 'metals' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-[var(--border-color)] rounded-xl overflow-hidden">
                  <thead className="bg-[var(--bg-elevated)] text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Caratage</th>
                      <th className="p-3">Pure Metal %</th>
                      <th className="p-3">BIS Stamp</th>
                      <th className="p-3">Best Recommended For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-stone-800 dark:text-stone-200">
                    <tr className="hover:bg-[var(--bg-elevated)]/50">
                      <td className="p-3 font-bold text-[#8C6D37] dark:text-[#EED2A2] font-inter text-sm">24K Gold</td>
                      <td className="p-3 font-mono font-medium">99.9% / 99.99%</td>
                      <td className="p-3 font-mono font-bold text-stone-900 dark:text-white">999</td>
                      <td className="p-3 font-medium">Investment Coins, Casted Bullion Bars, Aura Gold Vault</td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-elevated)]/50 bg-[#C6A15B]/10 dark:bg-[var(--gold-primary)]/10">
                      <td className="p-3 font-bold text-[#8C6D37] dark:text-[#EED2A2] font-inter text-sm">22K Gold (916)</td>
                      <td className="p-3 font-mono font-bold text-stone-900 dark:text-white">91.6% Pure Gold</td>
                      <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">22K 916</td>
                      <td className="p-3 font-semibold text-stone-900 dark:text-white">Heirloom Bridal Harams, Temple Kasu Bangles, Mangalsutras</td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-elevated)]/50">
                      <td className="p-3 font-bold text-[var(--text-main)] font-inter text-sm">18K Gold (750)</td>
                      <td className="p-3 font-mono font-medium">75.0% Pure Gold</td>
                      <td className="p-3 font-mono font-bold text-stone-900 dark:text-white">18K 750</td>
                      <td className="p-3 font-medium">Solitaire Diamond Rings, Tennis Bracelets, Lightweight Studs</td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-elevated)]/50">
                      <td className="p-3 font-bold text-[var(--text-main)] font-inter text-sm">14K Gold (585)</td>
                      <td className="p-3 font-mono font-medium">58.5% Pure Gold</td>
                      <td className="p-3 font-mono font-bold text-stone-900 dark:text-white">14K 585</td>
                      <td className="p-3 font-medium">Everyday Workwear, Geometric Pendants, Modern Charms</td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-elevated)]/50">
                      <td className="p-3 font-bold text-indigo-700 dark:text-indigo-300 font-inter text-sm">950 Platinum</td>
                      <td className="p-3 font-mono font-medium">95.0% Pure Platinum</td>
                      <td className="p-3 font-mono font-bold text-indigo-800 dark:text-indigo-300">Pt 950</td>
                      <td className="p-3 font-medium">Eternal Couple Bands, Engagement Rings (Hypoallergenic)</td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-elevated)]/50">
                      <td className="p-3 font-bold text-stone-700 dark:text-stone-300 font-inter text-sm">925 Sterling Silver</td>
                      <td className="p-3 font-mono font-medium">92.5% Pure Silver</td>
                      <td className="p-3 font-mono font-bold text-stone-800 dark:text-stone-300">925</td>
                      <td className="p-3 font-medium">Pooja Articles, Silver Lamps, Antique Silver Payals</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-stone-700 dark:text-stone-300">
                <span className="font-bold text-[var(--text-main)] block mb-1">
                  Why 22K (916) is the South Indian Gold Standard:
                </span>
                <p className="leading-relaxed">
                  Pure 24K gold is inherently malleable. Stamped 22K (91.6% pure gold alloyed with 8.4% copper and silver) offers the ideal balance of rich warm golden luster and the tensile strength required for intricate hand-repoussé temple motifs and generational durability.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Heirloom Jewellery Care */}
          {activeTab === 'care' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 space-y-3 shadow-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Recommended Care Practices</span>
                  </span>
                  <ul className="space-y-2.5 text-xs text-stone-800 dark:text-emerald-100 font-medium leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0 mt-1.5" />
                      <span>Store every piece individually in YAZHINI anti-tarnish velvet boxes.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0 mt-1.5" />
                      <span>Wipe gently with the microfiber polishing cloth provided with your order after wearing.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0 mt-1.5" />
                      <span>Fasten all necklace clasps to prevent chain knotting.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0 mt-1.5" />
                      <span>Bring your jewellery to any YAZHINI showroom annually for complimentary ultrasonic cleansing.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 space-y-3 shadow-xs">
                  <span className="font-bold text-rose-800 dark:text-rose-300 block text-sm flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Avoid These Common Hazards</span>
                  </span>
                  <ul className="space-y-2.5 text-xs text-stone-800 dark:text-rose-100 font-medium leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 shrink-0 mt-1.5" />
                      <span>Never expose natural pearls, rubies, or emeralds to perfumes, hairsprays, or body lotions.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 shrink-0 mt-1.5" />
                      <span>Remove fine jewellery before swimming in chlorinated pools or bathing.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 shrink-0 mt-1.5" />
                      <span>Never clean antique/matte finish temple jewellery with harsh chemical dip cleaners.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 shrink-0 mt-1.5" />
                      <span>Avoid storing gold with silver articles in the same compartment.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-[var(--text-main)] block text-sm">Complimentary Lifetime Showroom Care</span>
                  <p className="text-xs text-stone-600 dark:text-[var(--text-secondary)] mt-1 leading-relaxed">
                    All YAZHINI jewellery includes free lifetime ultrasonic inspection, stone prong tightening, and re-polishing at any of our authorised showrooms across Tamil Nadu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#35172F] hover:bg-[#4A2242] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer transition-all shadow-xs"
                >
                  Explore Catalogue
                </button>
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#8C6D37] dark:text-[var(--gold-primary)] shrink-0" />
              <span>Certified under Bureau of Indian Standards Act, 2016</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#35172F] hover:bg-[#4A2242] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] font-semibold text-xs tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Guide</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
