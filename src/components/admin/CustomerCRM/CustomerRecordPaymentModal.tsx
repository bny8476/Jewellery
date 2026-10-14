import React, { useState } from 'react';
import { X, CreditCard, Banknote, QrCode, ArrowRight, ShieldCheck } from 'lucide-react';
import type { Customer } from '../../../types/pawnshop';
import { recordCustomerPayment } from '../../../services/customerService';
import { formatCurrencyINR } from '../../../utils/formatters';
import { toast } from '../../../utils/toast';

interface CustomerRecordPaymentModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const CustomerRecordPaymentModal: React.FC<CustomerRecordPaymentModalProps> = ({
  isOpen,
  customer,
  onClose,
  onPaymentSuccess
}) => {
  const [targetType, setTargetType] = useState<'invoice' | 'pawn_loan'>('invoice');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'card' | 'bank_transfer'>('upi');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !customer) return null;

  const maxPayable = targetType === 'invoice' 
    ? (customer.outstanding_receivables || 0)
    : (customer.outstanding_pawn_principal || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      const paymentRef = reference.trim() || `RCP-${Date.now().toString().slice(-6)}`;
      await recordCustomerPayment(
        customer.id,
        amount,
        paymentMethod,
        paymentRef,
        targetType
      );
      toast.success(`Payment of ${formatCurrencyINR(amount)} recorded successfully`);
      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[var(--bg-card)] border border-[var(--gold-primary)]/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-main)]">Record Customer Payment</h3>
            <p className="text-xs text-[var(--text-secondary)]">{customer.full_name} ({customer.customer_code})</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Target Ledger Selection */}
          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Allocate Payment Towards</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetType('invoice');
                  setAmount(customer.outstanding_receivables || 0);
                }}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  targetType === 'invoice'
                    ? 'bg-[var(--gold-primary)]/15 border-[var(--gold-primary)] text-[var(--text-main)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)]'
                }`}
              >
                <span className="font-semibold block text-xs">Jewelry Invoice Debt</span>
                <span className="text-[11px] text-[var(--gold-primary)] font-mono mt-1 block">
                  Due: {formatCurrencyINR(customer.outstanding_receivables || 0)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetType('pawn_loan');
                  setAmount(customer.outstanding_pawn_principal || 0);
                }}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  targetType === 'pawn_loan'
                    ? 'bg-[var(--gold-primary)]/15 border-[var(--gold-primary)] text-[var(--text-main)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)]'
                }`}
              >
                <span className="font-semibold block text-xs">Pawn Loan Repayment</span>
                <span className="text-[11px] text-[var(--gold-primary)] font-mono mt-1 block">
                  Principal: {formatCurrencyINR(customer.outstanding_pawn_principal || 0)}
                </span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[var(--text-secondary)] font-medium">Payment Amount (₹) *</label>
              {maxPayable > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(maxPayable)}
                  className="text-[10px] text-[var(--gold-primary)] hover:underline"
                >
                  Pay Full Balance ({formatCurrencyINR(maxPayable)})
                </button>
              )}
            </div>
            <input
              type="number"
              min={1}
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] font-mono text-base focus:outline-none focus:border-[var(--gold-primary)]/60"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Payment Tender</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'upi', label: 'UPI / QR Code', icon: QrCode },
                { id: 'cash', label: 'Cash Tender', icon: Banknote },
                { id: 'card', label: 'Debit / Credit Card', icon: CreditCard },
                { id: 'bank_transfer', label: 'Bank NEFT / RTGS', icon: ArrowRight }
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs transition-colors ${
                      isSelected 
                        ? 'bg-[var(--gold-primary)]/20 border-[var(--gold-primary)] text-[var(--gold-primary)] font-medium' 
                        : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transaction Reference */}
          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1">UTR / Transaction Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UPI-248910294819"
              className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-primary)]/60"
            />
          </div>

          {/* Legal Compliance Disclaimer */}
          <div className="p-3 bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 rounded-xl text-[11px] text-[var(--text-main)] flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[var(--gold-primary)] mt-0.5" />
            <span>Statutory ledger receipt will be automatically generated and synced with Day Book cash reconciliations.</span>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-main)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="px-5 py-2 bg-[var(--gold-primary)] hover:brightness-105 text-stone-900 font-semibold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(198,161,91,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : `Confirm ${formatCurrencyINR(amount)}`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
