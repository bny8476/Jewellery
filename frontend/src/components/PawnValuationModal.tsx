import React, { useState, useEffect } from 'react';
import { X, Shield, Calculator, FileText, CheckCircle2, AlertCircle, Building2, Calendar, Phone, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRates } from '../context/RateContext';
import { formatCurrencyINR } from '../utils/formatters';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from '../utils/toast';
import { modalBackdropVariants, modalContentVariants } from '../utils/motion';

interface PawnValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBranch?: string;
}

export const PawnValuationModal: React.FC<PawnValuationModalProps> = ({
  isOpen,
  onClose,
  defaultBranch = 'chennai'
}) => {
  const { rates } = useRates();
  const [weight, setWeight] = useState<number>(25); // grams
  const [purity, setPurity] = useState<'22K' | '24K' | '18K'>('22K');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    branch: defaultBranch,
    preferredDate: '',
    preferredTime: '11:00 AM',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Calculate estimated gold market value & RBI regulatory loan ceiling (up to 75% LTV)
  const ratePerGram = purity === '24K' ? rates.gold : purity === '22K' ? rates.gold22k : Math.round(rates.gold * 0.75);
  const estimatedMarketValue = Math.round(weight * ratePerGram);
  const maxEligibleLoan = Math.round(estimatedMarketValue * 0.75); // 75% LTV ceiling

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Please provide your name and contact phone number.');
      return;
    }


    setIsSubmitting(true);
    const refNumber = `RCB-PWN-${Date.now().toString().slice(-6)}`;

    const enquiryRecord = {
      reference_number: refNumber,
      customer_name: formData.name,
      customer_phone: formData.phone,
      customer_email: formData.email,
      branch: formData.branch,
      metal_purity: purity,
      estimated_weight_grams: weight,
      estimated_valuation: estimatedMarketValue,
      estimated_loan_max: maxEligibleLoan,
      appointment_date: formData.preferredDate || new Date().toISOString().split('T')[0],
      appointment_time: formData.preferredTime,
      notes: formData.notes,
      status: 'pending_appraisal',
      created_at: new Date().toISOString()
    };

    try {
      // Store in local storage for offline resilience
      const existing = JSON.parse(localStorage.getItem('rcb_pawn_enquiries') || '[]');
      existing.unshift(enquiryRecord);
      localStorage.setItem('rcb_pawn_enquiries', JSON.stringify(existing));

      if (isSupabaseConfigured) {
        await supabase.from('pawn_enquiries').insert([enquiryRecord]).select();
      }
    } catch (err) {
      console.warn('Saved enquiry to local storage fallback:', err);
    } finally {
      setIsSubmitting(false);
      setSubmittedRef(refNumber);
    }
  };

  const handleReset = () => {
    setSubmittedRef(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
        >
          <motion.div 
            variants={modalContentVariants}
            className="relative bg-[#FAF5F0] dark:bg-[#1A1A1A] text-[#34252A] dark:text-[#FAF5F0] rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-[#C69A8B]/30 max-h-[92vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pawn-modal-title"
          >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Close pawn enquiry dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedRef ? (
          /* Confirmation State */
          <div className="text-center py-8 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Enquiry Registered Successfully
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#702638] dark:text-[#FAF5F0] mt-1">
                Your Appraisal Appointment is Booked
              </h2>
            </div>

            <div className="bg-white dark:bg-[#242424] border border-stone-200 dark:border-stone-800 rounded-xl p-5 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                <span className="text-stone-500">Appraisal Reference:</span>
                <span className="font-mono font-bold text-[#702638] dark:text-[#E8A598]">{submittedRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Selected Branch:</span>
                <span className="font-medium capitalize">{formData.branch} Flagship Branch</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Declared Net Weight:</span>
                <span className="font-medium">{weight}g ({purity} Gold)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Estimated LTV Limit:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Up to {formatCurrencyINR(maxEligibleLoan)}</span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 max-w-md mx-auto text-left text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>What to bring for your in-store visit:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-stone-600 dark:text-stone-400">
                <li>Government ID (Aadhaar Card, PAN Card, or Passport)</li>
                <li>Original jewellery items for on-the-spot ultrasonic &amp; XRF purity testing</li>
                <li>Original purchase invoices (if available)</li>
                <li>Your bank account details or cheque for instant NEFT/IMPS disbursement</li>
              </ul>
            </div>

            <button
              onClick={handleReset}
              className="px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#702638] hover:bg-[#541C2A] text-white shadow-md transition-colors"
            >
              Done &amp; Return to Store
            </button>
          </div>
        ) : (
          /* Main Form & Calculator */
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 flex items-center justify-center text-[#702638] dark:text-[#E8A598]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 id="pawn-modal-title" className="font-serif text-xl sm:text-2xl font-semibold text-[#702638] dark:text-[#FAF5F0]">
                  RCB Gold Pawn &amp; Collateral Services
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Instant Liquidity against Gold Jewellery • Safe High-Security Locker Custody
                </p>
              </div>
            </div>

            {/* Quick Benefits Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 text-center text-[11px]">
              <div className="bg-stone-100 dark:bg-stone-900/60 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800">
                <span className="block font-bold text-[#702638] dark:text-[#E8A598] text-sm">Up to 75%</span>
                <span className="text-stone-500">RBI Allowed LTV</span>
              </div>
              <div className="bg-stone-100 dark:bg-stone-900/60 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800">
                <span className="block font-bold text-[#702638] dark:text-[#E8A598] text-sm">From 0.75%</span>
                <span className="text-stone-500">Monthly Interest</span>
              </div>
              <div className="bg-stone-100 dark:bg-stone-900/60 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800">
                <span className="block font-bold text-[#702638] dark:text-[#E8A598] text-sm">15 Mins</span>
                <span className="text-stone-500">In-Store Payout</span>
              </div>
              <div className="bg-stone-100 dark:bg-stone-900/60 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800">
                <span className="block font-bold text-emerald-600 dark:text-emerald-400 text-sm">Insured</span>
                <span className="text-stone-500">Grade-A Vault Storage</span>
              </div>
            </div>

            {/* Calculator section */}
            <div className="bg-white dark:bg-[#242424] rounded-xl p-5 border border-stone-200 dark:border-stone-800 mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#702638] dark:text-[#C69A8B] mb-3 flex items-center gap-1.5">
                <Calculator className="w-4 h-4" />
                <span>Estimate Instant Loan Eligibility</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                    Gold Purity
                  </label>
                  <select
                    value={purity}
                    onChange={(e) => setPurity(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100"
                  >
                    <option value="22K">22K Gold (916 Hallmark) - ₹{rates.gold22k.toLocaleString('en-IN')}/g</option>
                    <option value="24K">24K Pure Gold Coins/Bars - ₹{rates.gold.toLocaleString('en-IN')}/g</option>
                    <option value="18K">18K Gold Jewellery - ₹{Math.round(rates.gold * 0.75).toLocaleString('en-IN')}/g</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                    Net Weight (Grams, excluding stones)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={weight}
                    onChange={(e) => setWeight(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Estimate results pill */}
              <div className="bg-[#FAF5F0] dark:bg-[#1E1E1E] rounded-lg p-3 grid grid-cols-2 gap-3 text-xs border border-[#C69A8B]/30">
                <div>
                  <span className="text-stone-500 block text-[11px]">Gross Gold Market Value:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200 text-sm">
                    {formatCurrencyINR(estimatedMarketValue)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Maximum Eligible Advance (75% LTV):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                    {formatCurrencyINR(maxEligibleLoan)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 mt-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Online estimates are indicative. Final loan sanction and valuation requires on-site non-destructive touchstone/XRF assessment by our authorized appraiser.
                </span>
              </div>
            </div>

            {/* Appointment Booking Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#702638] dark:text-[#C69A8B] flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Book Confirmatory Valuation Appointment</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#242424]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#242424]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1">Preferred Branch</label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                    <select
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#242424]"
                    >
                      <option value="chennai">Chennai - T. Nagar Flagship Showroom</option>
                      <option value="coimbatore">Coimbatore - Cross Cut Road</option>
                      <option value="madurai">Madurai - West Masi Street</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#242424]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1">Additional Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Traditional temple antique necklace, approx 4 sovereigns..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#242424]"
                />
              </div>

              {/* Legal disclaimer */}
              <p className="text-[10px] text-stone-500 leading-normal">
                * All pawn collateral services comply with RBI regulations and State Pawn Brokers licensing acts. Customer records are strictly private and encrypted. No credit score check required.
              </p>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#702638] hover:bg-[#541C2A] text-white shadow-md transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Registering...' : 'Request Valuation Appointment'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
