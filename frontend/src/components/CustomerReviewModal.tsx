import React, { useState } from 'react';
import { X, Star, CheckCircle2, User, MessageSquare } from 'lucide-react';

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
  const [hoverStars, setHoverStars] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !quote.trim()) {
      alert('Please fill out your name and your review message.');
      return;
    }

    const newReview = {
      author: city.trim() ? `${author.trim()}, ${city.trim()}` : author.trim(),
      quote: quote.trim(),
      stars,
      itemPurchased: itemPurchased.trim() || 'Hallmarked Jewellery',
      date: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    };

    // Save to local storage
    try {
      const stored = JSON.parse(localStorage.getItem('rcb_user_reviews') || '[]');
      stored.unshift(newReview);
      localStorage.setItem('rcb_user_reviews', JSON.stringify(stored));
    } catch {
      // ignore storage error
    }

    onReviewSubmitted(newReview);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
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
            <h3 className="font-serif text-2xl font-semibold text-[#702638] dark:text-[#FAF5F0]">
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
                <h2 id="review-modal-title" className="font-serif text-xl font-semibold text-[#702638] dark:text-[#FAF5F0]">
                  Share Your Experience
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Write a genuine review for RCB Jewelry &amp; Pawn Shop
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star rating selector */}
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1.5">
                  Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverStars(star)}
                      onMouseLeave={() => setHoverStars(0)}
                      onClick={() => setStars(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                      aria-label={`${star} star rating`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          (hoverStars || stars) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-300 dark:text-stone-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-stone-500 ml-2 font-medium">
                    {stars === 5 ? 'Excellent' : stars === 4 ? 'Very Good' : stars === 3 ? 'Average' : 'Needs Improvement'}
                  </span>
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
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#242424]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#242424]"
                  />
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
                  onChange={(e) => setItemPurchased(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#242424]"
                />
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
                  onChange={(e) => setQuote(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#242424]"
                />
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
                  className="px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#702638] hover:bg-[#541C2A] text-white transition-colors shadow-md"
                >
                  Submit Verified Review
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
