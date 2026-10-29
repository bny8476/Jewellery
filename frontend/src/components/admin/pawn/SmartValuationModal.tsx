import React, { useState } from 'react';
import { X, Calculator, Plus, Trash2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { formatCurrencyINR } from '../../../utils/formatters';
import { calculatePawnValuation } from '../../../services/pledgeService';
import { useRates } from '../../../context/RateContext';
import { toast } from '../../../utils/toast';

interface ValuationItemRow {
  item_description: string;
  category: string;
  gross_weight_grams: number;
  stone_weight_grams: number;
  purity: string;
  deduction_percentage: number;
}

interface SmartValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToNewLoan?: (items: any[]) => void;
}

export const SmartValuationModal: React.FC<SmartValuationModalProps> = ({
  isOpen,
  onClose,
  onApplyToNewLoan
}) => {
  const { rates } = useRates();

  const [items, setItems] = useState<ValuationItemRow[]>([
    {
      item_description: '22K Gold Traditional Necklace',
      category: 'necklace',
      gross_weight_grams: 35.0,
      stone_weight_grams: 2.5,
      purity: '22K',
      deduction_percentage: 2
    }
  ]);

  const [customRates, setCustomRates] = useState({
    gold22k: rates?.gold22k || 7250,
    gold24k: rates?.gold || 7910,
    silver: rates?.silver || 98
  });

  const [ltvCeiling, setLtvCeiling] = useState(75);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        item_description: '22K Gold Jewellery Article',
        category: 'other',
        gross_weight_grams: 10.0,
        stone_weight_grams: 0.0,
        purity: '22K',
        deduction_percentage: 2
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof ValuationItemRow, value: any) => {
    setItems(items.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const handleCompute = async () => {
    try {
      setLoading(true);
      const res = await calculatePawnValuation({
        items,
        live_rates: customRates,
        ltv_percentage: ltvCeiling
      });
      setResult(res);
      toast.success('Appraisal & LTV ceiling calculated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Valuation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#121212] rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Instant Gold &amp; Jewellery Appraisal Engine
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  RBI 75% LTV Ready
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-neutral-400">
                Accurate gross vs. stone weight deductions, purity adjustments, and statutory regulatory loan limits.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Rate Controls */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-neutral-900/40 border border-stone-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                22K Rate (₹/g)
              </label>
              <input
                type="number"
                value={customRates.gold22k}
                onChange={e => setCustomRates({ ...customRates, gold22k: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-700 text-sm font-semibold font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                24K Rate (₹/g)
              </label>
              <input
                type="number"
                value={customRates.gold24k}
                onChange={e => setCustomRates({ ...customRates, gold24k: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-700 text-sm font-semibold font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Silver Rate (₹/g)
              </label>
              <input
                type="number"
                value={customRates.silver}
                onChange={e => setCustomRates({ ...customRates, silver: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-700 text-sm font-semibold font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Max LTV Ceiling (%)
              </label>
              <input
                type="number"
                max={75}
                min={50}
                value={ltvCeiling}
                onChange={e => setLtvCeiling(Math.min(75, Math.max(10, Number(e.target.value))))}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-700 text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>

          {/* Collateral Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Pledged Articles Breakdown
              </h4>
              <button
                onClick={handleAddItem}
                type="button"
                className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Article</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-stone-200 dark:border-neutral-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800 text-stone-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Article Description</th>
                    <th className="p-3 w-32">Purity</th>
                    <th className="p-3 w-28 text-right">Gross Wt (g)</th>
                    <th className="p-3 w-28 text-right">Stone Wt (g)</th>
                    <th className="p-3 w-28 text-right">Deduction %</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-neutral-800">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-neutral-900/30">
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={it.item_description}
                          onChange={e => handleUpdateItem(idx, 'item_description', e.target.value)}
                          placeholder="e.g. 22K Bangle Pair"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-xs"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={it.purity}
                          onChange={e => handleUpdateItem(idx, 'purity', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-xs"
                        >
                          <option value="24K">24K (99.9% Pure)</option>
                          <option value="22K">22K (91.6% Hallmark)</option>
                          <option value="18K">18K (75.0% Fine)</option>
                          <option value="SILVER">Silver 925</option>
                        </select>
                      </td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={it.gross_weight_grams}
                          onChange={e => handleUpdateItem(idx, 'gross_weight_grams', Number(e.target.value))}
                          className="w-full text-right px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-xs font-mono"
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={it.stone_weight_grams}
                          onChange={e => handleUpdateItem(idx, 'stone_weight_grams', Number(e.target.value))}
                          className="w-full text-right px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-xs font-mono"
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.5"
                          value={it.deduction_percentage}
                          onChange={e => handleUpdateItem(idx, 'deduction_percentage', Number(e.target.value))}
                          className="w-full text-right px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-xs font-mono"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="p-1 text-stone-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results Summary Box */}
          {result && (
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Official Appraisal Summary
                </span>
                <span className="text-[11px] text-stone-400">
                  Calculated against {result.rate_source}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800">
                  <p className="text-[10px] uppercase font-bold text-stone-400">Gross Weight</p>
                  <p className="text-base font-bold font-mono text-stone-800 dark:text-stone-200 mt-0.5">
                    {result.total_gross_weight}g
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800">
                  <p className="text-[10px] uppercase font-bold text-stone-400">Net Pure Metal Wt</p>
                  <p className="text-base font-bold font-mono text-amber-500 mt-0.5">
                    {result.total_net_weight}g
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800">
                  <p className="text-[10px] uppercase font-bold text-stone-400">Appraised Valuation</p>
                  <p className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5">
                    {formatCurrencyINR(result.total_appraised_value)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                    Max 75% LTV Disbursal
                  </p>
                  <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatCurrencyINR(result.max_eligible_loan_amount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Strict compliance with RBI master directions on gold jewellery lending.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCompute}
              disabled={loading}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Calculator className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Evaluating...' : 'Appraise Valuation & LTV'}</span>
            </button>

            {result && onApplyToNewLoan && (
              <button
                onClick={() => onApplyToNewLoan(items)}
                type="button"
                className="px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-black dark:hover:bg-white text-white dark:text-black font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Create Loan with Appraisal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
