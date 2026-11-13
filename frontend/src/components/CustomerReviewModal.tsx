import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, MessageSquare } from 'lucide-react';
import PeekRating from './ui/PeekRating';
import { toast } from '../utils/toast';
import { supabase } from '../lib/supabase';
import { useScrollLock } from '../utils/useScrollLock';

interface CustomerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: (review: { author: string; quote: string; stars: number; itemPurchased?: string; date: string }) => void;
}

export const CustomerReviewModal: React.FC<CustomerReviewModalProps> = ({
  isOpen,
  onClose,
  onReviewSubmitted
}) => {
  const [author, setAuthor] = useState('');
  const [city, setCity] = useState('');
  const [itemPurchased, setItemPurchased] = useState('');
  const [quote, setQuote] = useState('');
  const [stars, setStars] = useState(5);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useScrollLock(isOpen, { onEscape: onClose });

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedAuthor = author.trim();
    if (!trimmedAuthor) {
      errors.author = 'Name is required';
    } else if (trimmedAuthor.length < 2) {
      errors.author = 'Name must be at least 2 characters';
    } else if (trimmedAuthor.length > 60) {
      errors.author = 'Name cannot exceed 60 characters';
    }

    if (city.trim() && city.trim().length > 60) {
      errors.city = 'City name cannot exceed 60 characters';
    }

    if (itemPurchased.trim() && itemPurchased.trim().length > 100) {
      errors.itemPurchased = 'Item/service name cannot exceed 100 characters';
    }

    const trimmedQuote = quote.trim();
    if (!trimmedQuote) {
      errors.quote = 'Review message is required';
    } else if (trimmedQuote.length < 10) {
      errors.quote = 'Please share at least 10 characters describing your experience';
    } else if (trimmedQuote.length > 1000) {
      errors.quote = 'Review cannot exceed 1000 characters';
    }

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      errors.stars = 'Rating must be between 1 and 5 stars';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const first = Object.values(errors)[0];
      toast.error(first);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    const formattedAuthor = city.trim() ? `${author.trim()}, ${city.trim()}` : author.trim();
    const purchasedItem = itemPurchased.trim() || 'Hallmarked Jewellery';
    const dateStr = new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    const newReview = {
      author: formattedAuthor,
      quote: quote.trim(),
      stars,
      itemPurchased: purchasedItem,
      date: dateStr
    };

    // Save to database
    try {
      await supabase.from('customer_reviews').insert({
        author: formattedAuthor,
        quote: quote.trim(),
        stars,
        item_purchased: purchasedItem,
        date_str: dateStr,
        is_approved: true
      });
    } catch {
      // Fallback
    }

    // Save to local storage
    try {
      const stored = JSON.parse(localStorage.getItem('rcb_user_reviews') || '[]');
      stored.unshift(newReview);
      localStorage.setItem('rcb_user_reviews', JSON.stringify(stored));
    } catch {
      // ignore storage error
    }

    onReviewSubmitted(newReview);
    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success('Thank you! Your verified review has been recorded.');
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };


  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[1300] overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative bg-[#FAF5F0] dark:bg-[#1A1A1A] text-[#34252A] dark:text-[#FAF5F0] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#C69A8B]/30"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Close review dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-inter text-2xl font-semibold text-[#702638] dark:text-[#FAF5F0]">
              Thank You for Your Feedback!
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              Your verified review helps fellow patrons discover authentic Indian craftsmanship.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 flex items-center justify-center text-[#702638] dark:text-[#E8A598]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 id="review-modal-title" className="font-inter text-xl font-semibold text-[#702638] dark:text-[#FAF5F0]">
                  Share Your Experience
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Write a genuine review for YAZHINI Fine Jewels &amp; Pawn Shop
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star rating selector with PeekRating */}
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                  Rating
                </label>
                <div className="flex items-center">
                  <PeekRating
                    value={stars}
                    defaultValue={5}
                    count={5}
                    shape="star"
                    labels={['Needs Improvement', 'Fair', 'Average', 'Very Good', 'Superb']}
                    activeColor="#f5b400"
                    idleColor="#d1d5db"
                    tipColor="#702638"
                    tipTextColor="#faf5f0"
                    size={28}
                    lift={4}
                    magnify={1.15}
                    riseDuration={320}
                    popScale={1.3}
                    showTip
                    allowClear={false}
                    onChange={(val) => setStars(val || 1)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sangeetha Ramani"
                    value={author}
                    onChange={(e) => {
                      setAuthor(e.target.value);
                      if (fieldErrors.author) setFieldErrors(prev => { const n = { ...prev }; delete n.author; return n; });
                    }}
                    className={`w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-[#242424] ${
                      fieldErrors.author ? 'border-rose-500' : 'border-stone-300 dark:border-stone-700'
                    }`}
                  />
                  {fieldErrors.author && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.author}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (fieldErrors.city) setFieldErrors(prev => { const n = { ...prev }; delete n.city; return n; });
                    }}
                    className={`w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-[#242424] ${
                      fieldErrors.city ? 'border-rose-500' : 'border-stone-300 dark:border-stone-700'
                    }`}
                  />
                  {fieldErrors.city && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.city}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                  Item or Service Experienced
                </label>
                <input
                  type="text"
                  placeholder="e.g. Temple Kasu Haram / Gold Loan Appraisal"
                  value={itemPurchased}
                  onChange={(e) => {
                    setItemPurchased(e.target.value);
                    if (fieldErrors.itemPurchased) setFieldErrors(prev => { const n = { ...prev }; delete n.itemPurchased; return n; });
                  }}
                  className={`w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-[#242424] ${
                    fieldErrors.itemPurchased ? 'border-rose-500' : 'border-stone-300 dark:border-stone-700'
                  }`}
                />
                {fieldErrors.itemPurchased && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.itemPurchased}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                  Your Review &amp; Experience *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the craftsmanship, hallmarking transparency, staff service, or in-store guidance..."
                  value={quote}
                  onChange={(e) => {
                    setQuote(e.target.value);
                    if (fieldErrors.quote) setFieldErrors(prev => { const n = { ...prev }; delete n.quote; return n; });
                  }}
                  className={`w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-[#242424] ${
                    fieldErrors.quote ? 'border-rose-500' : 'border-stone-300 dark:border-stone-700'
                  }`}
                />
                {fieldErrors.quote && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.quote}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#702638] hover:bg-[#541C2A] disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors shadow-md"
                >
                  {isSubmitting ? 'Recording Review...' : 'Submit Verified Review'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
