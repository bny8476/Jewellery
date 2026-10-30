import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, ShoppingBag, ArrowRight, ShieldCheck, 
  Truck, Sparkles, ExternalLink 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyINR } from '../../utils/formatters';

interface MiniCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    name: string;
    image_url?: string;
  };
  purity: string;
  weight: number;
  size?: string;
  quantity: number;
  price: number;
  totalCartCount: number;
}

export const MiniCartDrawer: React.FC<MiniCartDrawerProps> = ({
  isOpen,
  onClose,
  product,
  purity,
  weight,
  size,
  quantity,
  price,
  totalCartCount
}) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1350] bg-black/60 backdrop-blur-xs"
          />

          {/* Slide-Over Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 bottom-0 z-[1360] w-full max-w-md bg-white dark:bg-[#170E12] border-l border-[#E7DEC8] dark:border-[#3E2D34] shadow-2xl flex flex-col justify-between p-6 select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E7DEC8] dark:border-[#3E2D34]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                  <Check className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-serif text-sm font-bold text-[#5B1022] dark:text-[#C49A50]">
                    Added to Your Shopping Bag
                  </h3>
                  <span className="text-[10px] text-[#716A6C] dark:text-[#B5ABB0]">
                    {totalCartCount} {totalCartCount === 1 ? 'creation' : 'creations'} currently in bag
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#FAF7F1] dark:bg-[#201519] hover:bg-black/5 dark:hover:bg-white/10 text-[#716A6C] dark:text-[#B5ABB0] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Added Product Card */}
            <div className="flex-1 py-6 space-y-4 overflow-y-auto">
              <div className="p-4 rounded-2xl bg-[#FAF7F1] dark:bg-[#1F1418] border border-[#E7DEC8] dark:border-[#3E2D34] flex gap-4">
                <img
                  src={product.image_url || '/images/cat_gold.jpg'}
                  alt={product.name}
                  className="w-20 h-20 object-contain rounded-xl bg-white dark:bg-[#140E10] border border-[#E7DEC8]/50 dark:border-[#3E2D34]/50 shrink-0 p-1"
                />
                <div className="space-y-1 text-left flex-1 min-w-0">
                  <h4 className="font-serif text-sm font-bold text-[#252329] dark:text-[#FAF7F1] truncate">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[10.5px] text-[#716A6C] dark:text-[#B5ABB0] flex-wrap">
                    <span className="bg-white dark:bg-[#140E10] px-1.5 py-0.5 rounded border border-[#E7DEC8]/50">
                      {purity}
                    </span>
                    <span>{weight}g</span>
                    {size && <span>• Size {size}</span>}
                    <span>• Qty {quantity}</span>
                  </div>
                  <div className="font-serif text-base font-bold text-[#5B1022] dark:text-[#C49A50] pt-1">
                    {formatCurrencyINR(price * quantity)}
                  </div>
                </div>
              </div>

              {/* Security & Shipping Guarantees */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/50 to-amber-50/40 dark:from-emerald-950/20 dark:to-amber-950/20 border border-emerald-200/50 dark:border-emerald-800/40 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                  <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Complimentary Insured BlueDart / Sequel Courier</span>
                </div>
                <p className="text-[10px] text-[#716A6C] dark:text-[#B5ABB0] leading-relaxed">
                  Your piece is held safely under vault protection and will be dispatched in tamper-evident discreet packaging.
                </p>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-4 border-t border-[#E7DEC8] dark:border-[#3E2D34] space-y-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-[#716A6C] dark:text-[#B5ABB0]">Estimated Subtotal</span>
                <span className="font-serif text-lg font-bold text-[#5B1022] dark:text-[#C49A50]">
                  {formatCurrencyINR(price * quantity)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/checkout');
                  }}
                  className="w-full py-3 px-5 rounded-2xl bg-[#5B1022] hover:bg-[#7A1930] text-white dark:bg-[#C49A50] dark:hover:bg-[#D5AD63] dark:text-[#140E10] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>View Bag &amp; Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-5 rounded-2xl border border-[#E7DEC8] dark:border-[#3E2D34] text-[#252329] dark:text-[#FAF7F1] hover:bg-[#FAF7F1] dark:hover:bg-[#201519] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
