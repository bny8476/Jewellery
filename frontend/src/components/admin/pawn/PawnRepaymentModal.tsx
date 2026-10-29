import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrencyINR } from '../../../utils/formatters';
import { repayPawnLoan } from '../../../services/pledgeService';
import { calculateAccruedInterest } from '../../../utils/pawnCalculationEngine';
import { toast } from '../../../utils/toast';

interface PawnRepaymentModalProps {
  pledge: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PawnRepaymentModal: React.FC<PawnRepaymentModalProps> = ({
  pledge,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [paymentType, setPaymentType] = useState<'interest_only' | 'principal_only' | 'combined'>('combined');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !pledge) return null;

  const totalPaidPrincipal = (pledge.part_payments || []).reduce((sum: number, p: any) => sum + (Number(p.principal_paid) || 0), 0);
  const currentPrincipal = Math.max(0, Number(pledge.loan_amount) - totalPaidPrincipal);

  // Compute accrued interest
  const accrual = calculateAccruedInterest({
    principal: currentPrincipal,
    interest_rate: Number(pledge.interest_rate) || 1.5,
    interest_type: pledge.interest_type || 'monthly',
    start_date: pledge.pledge_date || pledge.created_at,
    due_date: pledge.due_date
  });

  const suggestedInterest = accrual.accrued_interest;

  const handleSelectType = (type: 'interest_only' | 'principal_only' | 'combined') => {
    setPaymentType(type);
    if (type === 'interest_only') {
      setPaymentAmount(String(suggestedInterest));
    } else if (type === 'combined') {
      setPaymentAmount(String(suggestedInterest + Math.round(currentPrincipal * 0.1)));
    } else {
      setPaymentAmount(String(Math.round(currentPrincipal * 0.2)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(paymentAmount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid positive payment amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await repayPawnLoan({
        pledge_id: pledge.id,
        payment_amount: numAmount,
        payment_mode: paymentMode,
        payment_type: paymentType,
        notes: notes.trim() || undefined
      });
      toast.success(`Payment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record repayment');
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
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Collect Payment / Repayment
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
          {/* Balance Summary Card */}
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-100 dark:border-neutral-800 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-stone-400">Principal Balance</p>
              <p className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm mt-0.5">
                {formatCurrencyINR(currentPrincipal)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-stone-400">Accrued Interest ({accrual.days_elapsed}d)</p>
              <p className="font-mono font-bold text-amber-500 text-sm mt-0.5">
                {formatCurrencyINR(suggestedInterest)}
              </p>
            </div>
          </div>

          {/* Payment Type Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-neutral-400">
              Payment Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'interest_only', label: 'Interest Only' },
                { id: 'combined', label: 'Interest + Principal' },
                { id: 'principal_only', label: 'Principal Only' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectType(opt.id as any)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    paymentType === opt.id
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold'
                      : 'border-stone-200 dark:border-neutral-800 text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-neutral-400">
              Payment Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">₹</span>
              <input
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                step="any"
                required
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-black text-sm font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-neutral-400">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="cash">Vault Cash in Hand</option>
              <option value="upi">UPI / QR Code</option>
              <option value="bank_transfer">HDFC Bank Transfer / RTGS</option>
              <option value="card">Debit / Credit Card</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-neutral-400">
              Cashier Notes / Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Monthly interest paid at counter"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-black text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-amber-500"
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
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment & Issue Receipt'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
