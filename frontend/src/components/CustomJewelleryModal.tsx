import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, Sparkles, Upload, CheckCircle2, 
  Calendar, ShieldCheck, MessageCircle, ArrowRight
} from 'lucide-react';
import { useScrollLock } from '../utils/useScrollLock';
import { toast } from '../utils/toast';
import { supabase } from '../lib/supabase';

interface CustomJewelleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookShowroomVisit?: () => void;
}

export const CustomJewelleryModal: React.FC<CustomJewelleryModalProps> = ({
  isOpen,
  onClose,
  onBookShowroomVisit,
}) => {
  useScrollLock(isOpen, { onEscape: onClose });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState('Necklace / Choker');
  const [metalType, setMetalType] = useState('22K Yellow Gold (BIS 916)');
  const [stoneType, setStoneType] = useState('Natural Certified Diamonds');
  const [budgetTier, setBudgetTier] = useState('₹1,50,000 - ₹3,00,000');
  const [approxWeight, setApproxWeight] = useState('30');
  const [designNotes, setDesignNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Patron Contact Details
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredStore, setPreferredStore] = useState('T. Nagar Flagship, Chennai');
  const [targetDate, setTargetDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedRefId, setSubmittedRefId] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Design image file must be smaller than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast.error('Please provide your name and contact phone number');
      return;
    }

    setSubmitting(true);
    const refId = `BESPOKE-${Date.now().toString().slice(-6)}`;

    try {
      // 1. Try persisting into Supabase store_appointments
      const { error } = await supabase.from('store_appointments').insert([
        {
          id: refId,
          store_name: preferredStore,
          service_type: 'Bespoke Custom Jewellery & 3D CAD',
          customer_name: fullName.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim() || null,
          preferred_date: targetDate || new Date().toISOString().split('T')[0],
          time_slot: '11:00 AM - 01:00 PM',
          notes: `[Bespoke Order] Cat: ${category} | Metal: ${metalType} | Stones: ${stoneType} | Weight: ~${approxWeight}g | Budget: ${budgetTier} | Details: ${designNotes || 'None'}`,
          status: 'confirmed'
        }
      ]);

      if (error) {
        // Fallback to local storage if DB constraint or offline
        console.warn('Supabase insert note, storing locally:', error);
      }
    } catch (err) {
      console.warn('Custom order DB error, falling back locally:', err);
    }

    // Always persist to local bespoke enquiries
    try {
      const existing = JSON.parse(localStorage.getItem('yazhini_bespoke_orders') || '[]');
      existing.unshift({
        id: refId,
        category,
        metalType,
        stoneType,
        approxWeight,
        budgetTier,
        fullName,
        phone,
        email,
        preferredStore,
        targetDate,
        designNotes,
        hasImage: !!imagePreview,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('yazhini_bespoke_orders', JSON.stringify(existing));
    } catch (e) {
      void e;
    }

    setSubmittedRefId(refId);
    setSubmitting(false);
    setStep(3);
    toast.success('Bespoke design request submitted to Master Craftsmen!');
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[1300] overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bespoke-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative bg-[#FAF5F0] dark:bg-[#1A1215] text-[#34252A] dark:text-[#FAF5F0] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#C6A15B]/30 max-h-[92vh] overflow-y-auto flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          aria-label="Close custom studio"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#C6A15B]/20 pb-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#702638] to-[#450817] flex items-center justify-center text-[#D8B878] shadow-md">
            <Sparkles className="w-5 h-5 text-[#C6A15B]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans tracking-[0.25em] text-[#C6A15B] font-semibold block">
              Haute Joaillerie Atelier
            </span>
            <h2 id="bespoke-modal-title" className="font-inter text-xl sm:text-2xl font-bold text-[#702638] dark:text-[#E8A598]">
              Customise Your Dream Jewellery
            </h2>
          </div>
        </div>

        {/* Step Indicator */}
        {step < 3 && (
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 1 ? 'bg-[#702638] text-white' : 'bg-emerald-600 text-white'
              }`}>
                {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </span>
              <span className="text-xs font-semibold text-[#702638] dark:text-[#E8A598]">Design Specifications</span>
            </div>
            <div className="flex-1 h-0.5 mx-3 bg-[#C6A15B]/30" />
            <div className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 2 ? 'bg-[#702638] text-white' : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
              }`}>
                2
              </span>
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">Patron Consultation</span>
            </div>
          </div>
        )}

        {/* Step 1: Design Specifications */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1.5 uppercase tracking-wider">
                Jewellery Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
              >
                <option>Necklace / Choker</option>
                <option>Temple Antique Haram</option>
                <option>Bangles &amp; Kadas (Pair)</option>
                <option>Bridal Trousseau Set</option>
                <option>Solitaire Diamond Ring</option>
                <option>Jhumkas &amp; Chandbalis</option>
                <option>Traditional Mangalsutra / Thali</option>
                <option>Men's Designer Bracelet / Kada</option>
                <option>Other Bespoke Creation</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1.5 uppercase tracking-wider">
                  Precious Metal &amp; Purity
                </label>
                <select
                  value={metalType}
                  onChange={(e) => setMetalType(e.target.value)}
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                >
                  <option>22K Yellow Gold (BIS 916)</option>
                  <option>18K Rose Gold (BIS 750)</option>
                  <option>18K White Gold (BIS 750)</option>
                  <option>950 Pure Platinum</option>
                  <option>92.5 Sterling Silver</option>
                  <option>Two-Tone (22K Gold + Platinum)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1.5 uppercase tracking-wider">
                  Gemstone &amp; Diamonds
                </label>
                <select
                  value={stoneType}
                  onChange={(e) => setStoneType(e.target.value)}
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                >
                  <option>Natural Certified Diamonds (VVS-EF)</option>
                  <option>Uncut Polki &amp; Basra Pearls</option>
                  <option>Burmese Rubies &amp; Zambian Emeralds</option>
                  <option>Natural Navaratna Gemstones</option>
                  <option>Pure Solid Metal (Zero Gemstones)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1.5 uppercase tracking-wider">
                  Target Budget Tier
                </label>
                <select
                  value={budgetTier}
                  onChange={(e) => setBudgetTier(e.target.value)}
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                >
                  <option>₹50,000 - ₹1,50,000</option>
                  <option>₹1,50,000 - ₹3,00,000</option>
                  <option>₹3,00,000 - ₹5,00,000</option>
                  <option>₹5,00,000 - ₹10,00,000</option>
                  <option>₹10,00,000+ (Royal Bridal Masterpiece)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1.5 uppercase tracking-wider">
                  Approx. Target Weight (Grams)
                </label>
                <input
                  type="number"
                  min="4"
                  max="500"
                  value={approxWeight}
                  onChange={(e) => setApproxWeight(e.target.value)}
                  placeholder="e.g. 35"
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                />
              </div>
            </div>

            {/* Design Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1.5 uppercase tracking-wider">
                Upload Reference Sketch or Image (Optional)
              </label>
              <div className="border-2 border-dashed border-[#C6A15B]/40 rounded-xl p-4 text-center bg-white/50 dark:bg-[#20161A]/50 hover:bg-[#FAF5F0] dark:hover:bg-[#281B20] transition-colors relative">
                {imagePreview ? (
                  <div className="flex items-center justify-center gap-3">
                    <img 
                      src={imagePreview} 
                      alt="Design Preview" 
                      className="w-16 h-16 object-cover rounded-lg border border-[#C6A15B]/40 shadow-sm"
                    />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sketch uploaded successfully
                      </p>
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="text-[11px] text-rose-500 hover:underline cursor-pointer mt-1"
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-6 h-6 text-[#C6A15B] mx-auto mb-1 opacity-80" />
                    <span className="text-xs font-medium text-stone-700 dark:text-stone-300 block">
                      Click to browse or drop jewellery sketch / photo
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">PNG, JPG, WEBP up to 5MB</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Artisan Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1.5 uppercase tracking-wider">
                Special Customisation Notes for Karigars
              </label>
              <textarea
                rows={2}
                value={designNotes}
                onChange={(e) => setDesignNotes(e.target.value)}
                placeholder="Mention specific motifs (e.g. peacock, mango mala, antique nakshi polish, screw vs clip mechanism)..."
                className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-[#FAF5F0] font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer mt-2"
            >
              <span>Continue to Consultation Details</span>
              <ArrowRight className="w-4 h-4 text-[#D8B878]" />
            </button>
          </div>
        )}

        {/* Step 2: Patron Consultation Details */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Our Senior Master Karigar &amp; 3D CAD designer will review your concept, generate a 3D digital render, and calculate live metal estimates before casting begins.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1 uppercase tracking-wider">
                Patron Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Meenakshi Sundaram"
                className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1 uppercase tracking-wider">
                  Mobile Number (for WhatsApp CAD updates) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98400 12345"
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1 uppercase tracking-wider">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. patron@example.com"
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1 uppercase tracking-wider">
                  Preferred Showroom Consultation
                </label>
                <select
                  value={preferredStore}
                  onChange={(e) => setPreferredStore(e.target.value)}
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                >
                  <option>T. Nagar Flagship, Chennai</option>
                  <option>Cathedral Road Boutique, Chennai</option>
                  <option>Cross Cut Road, Coimbatore</option>
                  <option>West Masi Street, Madurai</option>
                  <option>Thillai Nagar, Trichy</option>
                  <option>Jayanagar 4th Block, Bangalore</option>
                  <option>Virtual Video Consultation (Pan-India)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1 uppercase tracking-wider">
                  Target Occasion / Delivery Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-[#FAF5F0] font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? (
                  <span>Submitting to Atelier...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#D8B878]" />
                    <span>Submit Bespoke Design Order</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#C6A15B] font-bold block mb-1">
                Ref ID: {submittedRefId}
              </span>
              <h3 className="font-inter text-2xl font-bold text-[#702638] dark:text-[#E8A598]">
                Bespoke Design Registered!
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto mt-2 leading-relaxed">
                Thank you, <strong>{fullName}</strong>. Our Chief Jewellery Architect and Karigar Council at <strong>{preferredStore}</strong> have received your custom <strong>{category}</strong> request.
              </p>
            </div>

            <div className="bg-white dark:bg-[#24191D] border border-[#C6A15B]/30 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Metal &amp; Purity:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">{metalType}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Gemstones:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">{stoneType}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Target Net Weight:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">~{approxWeight} Grams</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Budget Tier:</span>
                <span className="font-semibold text-[#702638] dark:text-[#E8A598]">{budgetTier}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`https://wa.me/919840012345?text=${encodeURIComponent(`Hello YAZHINI Atelier, I submitted Bespoke Order Ref ${submittedRefId} for a custom ${category} (${metalType}). Can I discuss the 3D CAD design?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Master Karigar on WhatsApp</span>
              </a>

              {onBookShowroomVisit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBookShowroomVisit();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C6A15B] to-[#996515] text-[#28030B] text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book In-Person Showroom Visit</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

export default CustomJewelleryModal;
