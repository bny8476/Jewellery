import React, { useState } from 'react';
import { X, RefreshCw, Calendar, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '../../../utils/formatters';
import { renewPawnLoan } from '../../../services/pledgeService';
import { toast } from '../../../utils/toast';

interface PawnRenewalModalProps {
  pledge: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PawnRenewalModal: React.FC<PawnRenewalModalProps> = ({
  pledge,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [extensionMonths, setExtensionMonths] = useState<number>(6);
  const [newInterestRate, setNewInterestRate] = useState<string>(String(pledge?.interest_rate || 1.5));
  const [renewalFee, setRenewalFee] = useState<number>(250);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !pledge) return null;

  const currentDue = pledge.due_date || pledge.pledge_date || new Date().toISOString().split('T')[0];
  const newDueDateObj = new Date(currentDue);
  newDueDateObj.setMonth(newDueDateObj.getMonth() + Number(extensionMonths));
  const computedNewDueDate = newDueDateObj.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await renewPawnLoan({
        pledge_id: pledge.id,
        extension_months: extensionMonths,
        new_interest_rate: Number(newInterestRate),
        renewal_fee: renewalFee,
        notes: notes.trim() || undefined
      });
      toast.success(`Pledge contract renewed until ${formatDate(computedNewDueDate)}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to renew contract');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-2xl w-full max-w-md overflow-hidden my-auto"
      >
        <div className="p-5 border-b border-stone-100 dark:border-neutral-800 flex items-center justify-between bg-stone-50/50 dark:bg-black/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Renew / Extend Pledge Contract
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-neutral-400">
                Pledge #{pledge.pledge_number || pledge.pledge_no}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-neutral-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-100 dark:border-neutral-800 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-stone-400">Current Due Date</p>
              <p className="font-mono font-bold text-stone-800 dark:text-stone-200 text-xs mt-0.5">
                {formatDate(currentDue)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-500">New Maturity Date</p>
              <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                {formatDate(computedNewDueDate)}
              </p>
            </div>
          </div>

          {/* Extension Tenure */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-neutral-400">
              Extension Tenure
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { months: 3, label: '3 Months' },
                { months: 6, label: '6 Months' },
                { months: 12, label: '12 Months' }
              ].map(opt => (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => setExtensionMonths(opt.months)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    extensionMonths === opt.months
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-stone-200 dark:border-neutral-800 text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Revised Interest Rate */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-neutral-400">
              Interest Rate (% / Month)
            </label>
            <input
              type="number"
              step="0.05"
              value={newInterestRate}
              onChange={e => setNewInterestRate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-mono font-bold text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Documentation / Renewal Fee */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-neutral-400">
              Documentation & Restructuring Fee (₹)
            </label>
            <input
              type="number"
              value={renewalFee}
              onChange={e => setRenewalFee(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-mono font-bold text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-neutral-400">
              Renewal Rationale / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Extended per customer request with fee waiver"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-black text-xs text-stone-800 dark:text-stone-200"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-neutral-800">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-neutral-800 text-xs font-semibold text-stone-600 dark:text-neutral-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> {isSubmitting ? 'Renewing...' : 'Approve Contract Renewal'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
