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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#13151A] rounded-xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#E5E7EB] dark:border-[#222733] relative max-h-[90vh] overflow-y-auto transition-colors">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
              Service Request Logged
            </h3>
            <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] max-w-sm mx-auto leading-relaxed">
              Ticket reference <span className="font-mono font-bold text-[#25282D] dark:text-[#F7F8FA]">#REQ-{(order.order_number || order.id).slice(-6)}-SRV</span> has been routed to our concierge team. Our armoured courier will arrange a secure pickup.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 rounded-lg bg-[#25282D] hover:bg-black dark:bg-[#1C2029] dark:hover:bg-[#252A36] text-white text-xs font-semibold transition-colors cursor-pointer dark:border dark:border-[#C9A45C]/40"
              >
                Close &amp; Return
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6 border-b border-[#E5E7EB] dark:border-[#222733] pb-4">
              <div className="w-10 h-10 rounded-lg bg-[#25282D] dark:bg-[#181B22] flex items-center justify-center text-[#C9A45C]">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
                  Patron Guarantee &amp; Exchange Desk
                </h3>
                <p className="text-xs text-[#8792A2] dark:text-[#8D96A5]">
                  Order #{order.order_number || order.id.slice(-6).toUpperCase()} • 14-Day Hassle-Free Exchange
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Type selector */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider mb-1.5">
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
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                        requestType === t.id
                          ? 'bg-[#25282D] dark:bg-[#1C2029] text-white border-[#25282D] dark:border-[#C9A45C]/40 shadow-xs font-semibold'
                          : 'bg-[#F3F4F6] dark:bg-[#181B22] border-[#E5E7EB] dark:border-[#222733] text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA]'
                      }`}
                    >
                      <span className="block text-xs">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider mb-1.5">
                  Reason for Request
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] rounded-lg px-3 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] focus:outline-none focus:border-[#25282D] dark:focus:border-[#C9A45C]"
                >
                  <option value="Ring / Bangle Sizing Exchange">Ring / Bangle Sizing Exchange</option>
                  <option value="Exchange for Higher Caratage / Design Upgrade">Exchange for Higher Caratage / Design Upgrade</option>
                  <option value="Gifting Preference Exchange">Gifting Preference Exchange</option>
                  <option value="Complimentary Ultrasonic Cleaning & Re-Hallmarking">Complimentary Ultrasonic Cleaning &amp; Re-Hallmarking</option>
                  <option value="Other Patron Consultation">Other Consultation</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider mb-1.5">
                  Specific Requirements or Instructions
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="State preferred replacement size, instructions, or pickup timing..."
                  className="w-full bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] focus:outline-none focus:border-[#25282D] dark:focus:border-[#C9A45C]"
                />
              </div>

              <div className="bg-[#F3F4F6] dark:bg-[#181B22] p-3 rounded-lg border border-[#E5E7EB] dark:border-[#222733] flex items-start gap-2.5 text-[11px] text-[#8792A2] dark:text-[#8D96A5]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  All exchanges and returns include 100% transit insurance cover and tamper-evident courier pickup.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB] dark:border-[#222733]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-[#222733] text-xs font-semibold text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#25282D] hover:bg-black dark:bg-[#1C2029] dark:hover:bg-[#252A36] text-white text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer dark:border dark:border-[#C9A45C]/40"
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

export default ReturnExchangeModal;
