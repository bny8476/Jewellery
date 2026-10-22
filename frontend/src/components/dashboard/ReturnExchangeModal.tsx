import React, { useState } from 'react';
import { X, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from '../../utils/toast';

interface ReturnExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSubmit: (data: { orderId: string; type: 'return' | 'exchange' | 'service'; reason: string; notes: string }) => void;
}

export const ReturnExchangeModal: React.FC<ReturnExchangeModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmit
}) => {
  const [requestType, setRequestType] = useState<'exchange' | 'return' | 'service'>('exchange');
  const [reason, setReason] = useState('Ring / Bangle Sizing Exchange');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        orderId: order.order_number || order.id,
        type: requestType,
        reason,
        notes
      });
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success('Your service request has been registered with our Concierge Desk.');
    }, 600);
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[var(--border-color)] relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">
              Service Ticket Registered
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
              Ticket reference <span className="font-mono font-bold text-[var(--gold-primary)]">#REQ-{(order.order_number || order.id).slice(-6)}-SRV</span> has been routed to your Senior Patron Concierge. Our logistics team will contact you to schedule an insured doorstep pickup.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl bg-[var(--gold-primary)] text-black text-xs font-bold uppercase tracking-wider hover:brightness-105"
              >
                Close &amp; Return to Orders
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--gold-primary)]/15 border border-[var(--gold-primary)]/30 flex items-center justify-center text-[var(--gold-primary)]">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Patron Guarantee &amp; Exchange Desk
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Order #{order.order_number || order.id} • 14-Day Hassle-Free Exchange
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Type selector */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Request Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'exchange', label: 'Size / Design Exchange' },
                    { id: 'return', label: '14-Day Return' },
                    { id: 'service', label: 'Laser Re-polishing' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setRequestType(t.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        requestType === t.id
                          ? 'bg-[#702638] text-white border-[#702638] shadow-sm font-semibold'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <span className="block text-xs">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Reason for Request
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                >
                  <option value="Ring / Bangle Sizing Exchange">Ring / Bangle Sizing Exchange</option>
                  <option value="Exchange for Higher Caratage / Design Upgrade">Exchange for Higher Caratage / Design Upgrade</option>
                  <option value="Gifting Preference Exchange">Gifting Preference Exchange</option>
                  <option value="Complimentary Ultrasonic Cleaning & Re-Hallmarking">Complimentary Ultrasonic Cleaning &amp; Re-Hallmarking</option>
                  <option value="Other Patron Consultation">Other Patron Consultation</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Specific Requirements or Instructions
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Please state preferred replacement size, custom notes, or convenient times for insured courier pickup..."
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                />
              </div>

              <div className="bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-color)] flex items-start gap-2.5 text-[11px] text-[var(--text-secondary)]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  All exchanges and returns include 100% transit insurance cover and Sequel Armoured Courier tamper-evident pickup.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
