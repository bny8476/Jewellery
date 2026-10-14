import React, { useState, useEffect } from 'react';
import { Gem, Search, Plus, Sparkles } from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';
import { calculateDiamondPriceEstimate } from '../../services/diamondService';
import { toast } from '../../utils/toast';
import { logAuditEvent } from '../../utils/rbac';

export interface CertifiedDiamondRecord {
  id: string;
  sku: string;
  origin: 'natural' | 'lab_grown';
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  cut: string;
  cert_lab: 'GIA' | 'IGI' | 'HRD' | 'SGL' | 'Non-Certified';
  cert_number: string;
  purchase_cost: number;
  rapaport_benchmark_inr: number;
  selling_price: number;
  status: 'available' | 'mounted' | 'sold';
  linked_jewelry_id?: string;
  created_at: string;
}

export const DiamondGemSection: React.FC = () => {
  const [diamonds, setDiamonds] = useState<CertifiedDiamondRecord[]>([]);
  const [search, setSearch] = useState('');
  const [originFilter, setOriginFilter] = useState<'all' | 'natural' | 'lab_grown'>('all');
  
  // Quick Valuation Calculator State
  const [calcOrigin, setCalcOrigin] = useState<'natural' | 'lab_grown'>('natural');
  const [calcCarat, setCalcCarat] = useState<number>(1.0);
  const [calcShape, setCalcShape] = useState<string>('round');
  const [calcColor, setCalcColor] = useState<string>('F');
  const [calcClarity, setCalcClarity] = useState<string>('VS1');
  const [calcCut, setCalcCut] = useState<string>('Excellent');
  const [calcCert, setCalcCert] = useState<string>('GIA');
  const [calculatedEstimate, setCalculatedEstimate] = useState<any>(null);

  // New Stone Modal
  const [isNewStoneOpen, setIsNewStoneOpen] = useState(false);
  const [newCertNumber, setNewCertNumber] = useState('');
  const [newPurchaseCost, setNewPurchaseCost] = useState<number>(0);
  const [newSellingPrice, setNewSellingPrice] = useState<number>(0);

  useEffect(() => {
    loadDiamonds();
    updateValuation();
  }, []);

  useEffect(() => {
    updateValuation();
  }, [calcOrigin, calcCarat, calcShape, calcColor, calcClarity, calcCut, calcCert]);

  const loadDiamonds = () => {
    try {
      const raw = localStorage.getItem('rcb_certified_diamonds');
      if (raw) {
        setDiamonds(JSON.parse(raw));
      } else {
        const defaults: CertifiedDiamondRecord[] = [
          {
            id: 'dia-1',
            sku: 'DIA-GIA-8921',
            origin: 'natural',
            shape: 'Round Brilliant',
            carat: 1.05,
            color: 'E',
            clarity: 'VVS2',
            cut: 'Excellent',
            cert_lab: 'GIA',
            cert_number: '2489102941',
            purchase_cost: 420000,
            rapaport_benchmark_inr: 512000,
            selling_price: 545000,
            status: 'available',
            created_at: '2024-01-12T00:00:00.000Z'
          },
          {
            id: 'dia-2',
            sku: 'DIA-IGI-4412',
            origin: 'natural',
            shape: 'Oval',
            carat: 0.85,
            color: 'F',
            clarity: 'VS1',
            cut: 'Very Good',
            cert_lab: 'IGI',
            cert_number: '592019482',
            purchase_cost: 210000,
            rapaport_benchmark_inr: 265000,
            selling_price: 285000,
            status: 'mounted',
            created_at: '2024-01-18T00:00:00.000Z'
          },
          {
            id: 'dia-3',
            sku: 'DIA-CVD-1092',
            origin: 'lab_grown',
            shape: 'Emerald Cut',
            carat: 2.10,
            color: 'D',
            clarity: 'VVS1',
            cut: 'Ideal',
            cert_lab: 'IGI',
            cert_number: 'LG58291048',
            purchase_cost: 75000,
            rapaport_benchmark_inr: 105000,
            selling_price: 115000,
            status: 'available',
            created_at: '2024-02-05T00:00:00.000Z'
          }
        ];
        setDiamonds(defaults);
        localStorage.setItem('rcb_certified_diamonds', JSON.stringify(defaults));
      }
    } catch {
      // Ignore
    }
  };

  const updateValuation = () => {
    try {
      const res = calculateDiamondPriceEstimate({
        origin: calcOrigin,
        carat: calcCarat,
        shape: calcShape,
        color: calcColor,
        clarity: calcClarity,
        cut: calcCut,
        cert: calcCert
      });
      const est = {
        estimated_inr: res.estimate.totalPrice,
        price_per_carat_inr: res.estimate.pricePerCarat,
        market_range: {
          low: Math.round(res.estimate.totalPrice * 0.95),
          high: Math.round(res.estimate.totalPrice * 1.08)
        },
        raw: res
      };
      setCalculatedEstimate(est);
      if (newSellingPrice === 0) {
        setNewSellingPrice(est.estimated_inr || 0);
      }
    } catch {
      // Fallback
    }
  };

  const handleSaveStone = () => {
    if (!newCertNumber.trim()) {
      toast.error('Laboratory certificate number is required');
      return;
    }

    const newStone: CertifiedDiamondRecord = {
      id: `dia-${Date.now()}`,
      sku: `DIA-${calcCert}-${Math.floor(1000 + Math.random() * 9000)}`,
      origin: calcOrigin,
      shape: calcShape,
      carat: calcCarat,
      color: calcColor,
      clarity: calcClarity,
      cut: calcCut,
      cert_lab: calcCert as any,
      cert_number: newCertNumber.trim(),
      purchase_cost: newPurchaseCost || Math.round((calculatedEstimate?.estimated_inr || 100000) * 0.8),
      rapaport_benchmark_inr: calculatedEstimate?.estimated_inr || 100000,
      selling_price: newSellingPrice || calculatedEstimate?.estimated_inr || 100000,
      status: 'available',
      created_at: new Date().toISOString()
    };

    const updated = [newStone, ...diamonds];
    setDiamonds(updated);
    localStorage.setItem('rcb_certified_diamonds', JSON.stringify(updated));

    logAuditEvent(
      'DIAMOND_INVENTORY_ADDED',
      'diamonds',
      `Registered ${calcCarat}ct ${calcShape} (${calcCert} #${newCertNumber}) valued at ₹${newStone.selling_price.toLocaleString('en-IN')}`,
      'admin@luxury.com',
      'admin',
      'info'
    );

    toast.success(`Certified diamond ${newStone.sku} added to vault`);
    setIsNewStoneOpen(false);
    setNewCertNumber('');
    setNewPurchaseCost(0);
  };

  const filtered = diamonds.filter(d => {
    const matchSearch = d.sku.toLowerCase().includes(search.toLowerCase()) ||
                        d.cert_number.includes(search) ||
                        d.shape.toLowerCase().includes(search.toLowerCase());
    const matchOrigin = originFilter === 'all' || d.origin === originFilter;
    return matchSearch && matchOrigin;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] text-xs font-semibold mb-2">
            <Gem className="w-3.5 h-3.5" />
            <span>Certified Solitaire &amp; Gemstone Vault</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">Diamonds, Solitaires &amp; Precious Gemstones</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Rapaport-calibrated commercial valuation matrix for Natural &amp; Lab-Grown certified stones.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewStoneOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[var(--gold-primary)] text-black rounded-lg hover:brightness-105 transition-all shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Certified Stone</span>
          </button>
        </div>
      </div>

      {/* Top Split: Live Valuation Matrix Benchmark Tool */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--gold-primary)]" />
            <span>Rapaport 4Cs Live Valuation Calculator</span>
          </h3>
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">International Benchmark Calibration</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
          <div>
            <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Origin</label>
            <select
              value={calcOrigin}
              onChange={(e) => setCalcOrigin(e.target.value as any)}
              className="w-full px-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
            >
              <option value="natural">Natural Mined</option>
              <option value="lab_grown">Lab-Grown (CVD/HPHT)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Carat Weight</label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              value={calcCarat}
              onChange={(e) => setCalcCarat(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)]"
            />
          </div>

          <div>
            <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Shape</label>
            <select
              value={calcShape}
              onChange={(e) => setCalcShape(e.target.value)}
              className="w-full px-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
            >
              <option value="round">Round Brilliant</option>
              <option value="oval">Oval Cut</option>
              <option value="princess">Princess Cut</option>
              <option value="cushion">Cushion Cut</option>
              <option value="emerald">Emerald Cut</option>
              <option value="pear">Pear Shape</option>
              <option value="radiant">Radiant Cut</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Color Grade</label>
            <select
              value={calcColor}
              onChange={(e) => setCalcColor(e.target.value)}
              className="w-full px-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
            >
              {['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Clarity Grade</label>
            <select
              value={calcClarity}
              onChange={(e) => setCalcClarity(e.target.value)}
              className="w-full px-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
            >
              {['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Cut Standard</label>
            <select
              value={calcCut}
              onChange={(e) => setCalcCut(e.target.value)}
              className="w-full px-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
            >
              <option value="Ideal">Ideal / Super Ideal</option>
              <option value="Excellent">Excellent</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Laboratory</label>
            <select
              value={calcCert}
              onChange={(e) => setCalcCert(e.target.value)}
              className="w-full px-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
            >
              <option value="GIA">GIA (Gemological Inst)</option>
              <option value="IGI">IGI International</option>
              <option value="HRD">HRD Antwerp</option>
              <option value="SGL">SGL Certified</option>
            </select>
          </div>
        </div>

        {/* Calculated Benchmark Output */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/30 gap-4 mt-2">
          <div>
            <p className="text-[11px] text-[var(--text-secondary)]">Estimated Rapaport Fair Value (India Wholesale + Margin)</p>
            <p className="text-xl font-bold font-mono text-[var(--gold-primary)] mt-0.5">
              {formatCurrencyINR(calculatedEstimate?.estimated_inr || 0)}
              <span className="text-xs font-normal text-[var(--text-secondary)] ml-2">
                (≈ {formatCurrencyINR(calculatedEstimate?.price_per_carat_inr || 0)} / carat)
              </span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[var(--text-secondary)] block">Market Range:</span>
            <span className="text-xs font-mono font-semibold text-[var(--text-main)]">
              {formatCurrencyINR(calculatedEstimate?.market_range?.low || 0)} - {formatCurrencyINR(calculatedEstimate?.market_range?.high || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Certified Stone Inventory Table */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search by SKU, certificate number or shape..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as any)}
              className="px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
            >
              <option value="all">All Origins</option>
              <option value="natural">Natural Diamonds</option>
              <option value="lab_grown">Lab-Grown Diamonds</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase text-[10px] tracking-wider border-b border-[var(--border-color)]">
              <tr>
                <th className="py-3 px-4">SKU / Origin</th>
                <th className="py-3 px-4">Shape &amp; 4Cs</th>
                <th className="py-3 px-4">Certification</th>
                <th className="py-3 px-4 text-right">Cost (₹)</th>
                <th className="py-3 px-4 text-right">Benchmark (₹)</th>
                <th className="py-3 px-4 text-right">Selling Price (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-[var(--bg-elevated)]/50">
                  <td className="py-3 px-4">
                    <p className="font-mono font-bold text-[var(--text-main)]">{d.sku}</p>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold mt-0.5 ${
                      d.origin === 'natural' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'
                    }`}>
                      {d.origin.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[var(--text-main)]">{d.carat}ct • {d.shape}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono">
                      Color: {d.color} | Clarity: {d.clarity} | Cut: {d.cut}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-[var(--gold-primary)]">{d.cert_lab}</p>
                    <p className="text-[10px] font-mono text-[var(--text-secondary)]">#{d.cert_number}</p>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">{formatCurrencyINR(d.purchase_cost)}</td>
                  <td className="py-3 px-4 text-right font-mono text-[var(--text-main)]">{formatCurrencyINR(d.rapaport_benchmark_inr)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[var(--gold-primary)]">{formatCurrencyINR(d.selling_price)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      d.status === 'available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Diamond Modal */}
      {isNewStoneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-serif font-bold text-[var(--text-main)]">Register Certified Diamond in Vault</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Adding {calcCarat}ct {calcShape} ({calcOrigin}) evaluated at {formatCurrencyINR(calculatedEstimate?.estimated_inr || 0)}.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Laboratory Certificate Number *</label>
                <input
                  type="text"
                  value={newCertNumber}
                  onChange={(e) => setNewCertNumber(e.target.value)}
                  placeholder="e.g. GIA 2489102941"
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Wholesale Purchase Cost (₹)</label>
                <input
                  type="number"
                  value={newPurchaseCost}
                  onChange={(e) => setNewPurchaseCost(Number(e.target.value))}
                  placeholder="Optional cost"
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Retail Selling Price (₹) *</label>
                <input
                  type="number"
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--gold-primary)] font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewStoneOpen(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStone}
                className="px-4 py-2 bg-[var(--gold-primary)] text-black rounded-lg text-xs font-bold hover:brightness-105"
              >
                Save Stone to Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiamondGemSection;
