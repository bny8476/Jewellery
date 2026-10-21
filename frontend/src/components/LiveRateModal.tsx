import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LiveRateCard } from './LiveRateCard';
import { modalBackdropVariants, modalContentVariants } from '../utils/motion';
import { useScrollLock } from '../utils/useScrollLock';

interface LiveRateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveRateModal: React.FC<LiveRateModalProps> = ({ isOpen, onClose }) => {
  useScrollLock(isOpen, { onEscape: onClose });

  if (typeof document === 'undefined' || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        variants={modalBackdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[1400] overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          variants={modalContentVariants}
          className="relative w-full max-w-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-rate-modal-title"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            type="button"
            className="absolute -top-11 right-0 sm:-right-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close live rates modal"
          >
            <X className="w-5 h-5" />
          </button>

          <LiveRateCard onClose={onClose} showExtended={true} />
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
