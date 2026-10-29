import React, { useState } from 'react';
import { X, Receipt, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrencyINR } from '../../../utils/formatters';
import { redeemPawnLoan } from '../../../services/pledgeService';
import { calculateAccruedInterest } from '../../../utils/pawnCalculationEngine';
import { toast } from '../../../utils/toast';

interface PawnRedemptionModalProps {
  pledge: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PawnRedemptionModal: React.FC<PawnRedemptionModalProps> = ({
  pledge,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !pledge) return null;

  const totalPaidPrincipal = (pledge.part_payments || []).reduce((sum: number, p: any) => sum + (Number(p.principal_paid) || 0), 0);
  const remainingPrincipal = Math.max(0, Number(pledge.loan_amount) - totalPaidPrincipal);

  const accrual = calculateAccruedInterest({
    principal: remainingPrincipal,
    interest_rate: Number(pledge.interest_rate) || 1.5,
    interest_type: pledge.interest_type || 'monthly',
    start_date: pledge.pledge_date || pledge.created_at,
    due_date: pledge.due_date
  });

  const totalPayoff = accrual.total_payoff_amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await redeemPawnLoan({
        pledge_id: pledge.id,
        total_amount: totalPayoff,
        payment_mode: paymentMode,
        notes: notes.trim() || undefined
      });
      toast.success(`Pledge #${pledge.pledge_number || pledge.pledge_no} settled in full. Ready for vault release.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to settle and redeem loan');
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
        className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-2xl w-full max-w-lg overflow-hidden my-auto"
      >
        <div className="p-5 border-b border-stone-100 dark:border-neutral-800 flex items-center justify-between bg-stone-50/50 dark:bg-black/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Pledge Redemption & Full Settlement
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-neutral-400">
                Pledge #{pledge.pledge_number || pledge.pledge_no} • {pledge.customer?.full_name || pledge.customer_name}
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
          {/* Final Settlement Breakdown */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-200 dark:border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600 dark:text-neutral-400">
              <span>Remaining Principal Balance:</span>
              <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">{formatCurrencyINR(remainingPrincipal)}</span>
            </div>
            <div className="flex justify-between text-stone-600 dark:text-neutral-400">
              <span>Accrued Interest ({accrual.days_elapsed} days):</span>
              <span className="font-mono font-semibold text-amber-500">{formatCurrencyINR(accrual.accrued_interest)}</span>
            </div>
            {accrual.penalty_interest > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>Overdue Penalty ({accrual.days_overdue} days):</span>
                <span className="font-mono font-semibold">{formatCurrencyINR(accrual.penalty_interest)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-200 dark:border-neutral-700 flex justify-between items-center text-sm font-bold">
              <span className="text-stone-900 dark:text-stone-100">Total Settlement Payable:</span>
              <span className="text-base font-mono text-emerald-600 dark:text-emerald-400">{formatCurrencyINR(totalPayoff)}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-neutral-400">
              Payment Settlement Mode
            </label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="cash">Vault Cash in Hand</option>
              <option value="upi">UPI / Instant QR Payment</option>
              <option value="bank_transfer">HDFC Bank Transfer / RTGS</option>
              <option value="card">Debit / Credit Card</option>
            </select>
          </div>

          {/* Custody Release Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Next Step: Collateral Release
            </p>
            <p className="text-[11px] leading-relaxed">
              Recording this settlement marks the loan as closed. You can then immediately authorize release of the jewellery from{' '}
              <strong>{pledge.vault_locker_no || 'Vault A'}</strong> in the contract modal.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-neutral-400">
              Settlement Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Full redemption at boutique counter"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-black text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-neutral-800">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-neutral-800 text-xs font-semibold text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> {isSubmitting ? 'Settling...' : 'Confirm Full Settlement & Redeem'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
