import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check, Sparkles } from 'lucide-react';

export interface FlyingFlight {
  id: string;
  imageUrl: string;
  productName: string;
  startX: number;
  startY: number;
  startWidth?: number;
  startHeight?: number;
  targetX: number;
  targetY: number;
  onComplete: () => void;
}

export interface FlyToCartOverlayProps {
  flights: FlyingFlight[];
  toastMessage: string | null;
  onDismissToast?: () => void;
}

export const FlyToCartOverlay: React.FC<FlyToCartOverlayProps> = ({ flights, toastMessage }) => {
  return (
    <>
      {/* 1. Flying Items Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden"
        aria-hidden="true"
      >
        <AnimatePresence>
          {flights.map((flight) => {
            const deltaX = flight.targetX - flight.startX;
            const startW = flight.startWidth ? Math.min(Math.max(flight.startWidth, 90), 200) : 110;
            const startH = flight.startHeight ? Math.min(Math.max(flight.startHeight, 90), 200) : 110;
            const halfW = startW / 2;
            const halfH = startH / 2;
            
            // Calculate natural, fluid vertical curve that never leaves top viewport
            const minY = Math.min(flight.startY, flight.targetY);
            const midY1 = flight.startY - (flight.startY - flight.targetY) * 0.40;
            const midY2 = flight.startY - (flight.startY - flight.targetY) * 0.74;
            const midY3 = flight.targetY + Math.max(14, (flight.startY - flight.targetY) * 0.12);

            const yKeyframes = flight.startY >= flight.targetY
              ? [
                  flight.startY - halfH,
                  midY1 - halfH * 0.9,
                  midY2 - halfH * 0.6,
                  midY3 - 24,
                  flight.targetY - 16,
                ]
              : [
                  flight.startY - halfH,
                  Math.max(20, minY - 24) - halfH,
                  minY + 24 - halfH * 0.6,
                  flight.targetY - 10 - 24,
                  flight.targetY - 16,
                ];

            return (
              <motion.div
                key={flight.id}
                initial={{
                  x: flight.startX - halfW,
                  y: flight.startY - halfH,
                  scale: 1,
                  opacity: 0.95,
                  rotate: 0,
                }}
                animate={{
                  x: [
                    flight.startX - halfW,
                    flight.startX + deltaX * 0.22 - halfW * 0.9,
                    flight.startX + deltaX * 0.58 - halfW * 0.65,
                    flight.startX + deltaX * 0.88 - 24,
                    flight.targetX - 16,
                  ],
                  y: yKeyframes,
                  scale: [1, 1.08, 0.92, 0.52, 0.18],
                  opacity: [0.95, 1, 1, 0.85, 0],
                  rotate: [0, -4, 5, -2, 0],
                }}
                transition={{
                  duration: 1.75,
                  ease: [0.22, 1, 0.36, 1],
                  times: [0, 0.22, 0.58, 0.86, 1],
                }}
                onAnimationComplete={flight.onComplete}
                className="absolute rounded-2xl bg-white/95 dark:bg-[#1A1215]/95 border-2 border-[#D8B878] shadow-[0_20px_50px_rgba(69,8,23,0.38),0_0_30px_rgba(216,184,120,0.5)] overflow-hidden flex items-center justify-center p-2.5 backdrop-blur-md"
                style={{
                  width: startW,
                  height: startH,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform, opacity',
                }}
              >
                {/* High Definition Crisp Jewellery Card Interior */}
                <div className="relative w-full h-full flex items-center justify-center bg-[#FAF9F8] dark:bg-[#20171A] rounded-xl overflow-hidden p-1 shadow-inner">
                  <img
                    src={flight.imageUrl}
                    alt={flight.productName}
                    loading="eager"
                    decoding="sync"
                    className="w-full h-full object-contain filter drop-shadow-sm select-none pointer-events-none"
                    style={{
                      imageRendering: '-webkit-optimize-contrast',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                    }}
                  />
                  {/* Subtle 24K Gold Hallmark Star Badge */}
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#450817] dark:bg-[#D8B878] flex items-center justify-center shadow-xs">
                    <Sparkles className="w-2.5 h-2.5 text-[#D8B878] dark:text-[#120D0F]" />
                  </div>
                </div>

                {/* Ambient Golden Halo Glow Ring */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-[#D8B878]/70 ring-inset pointer-events-none" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 2. Success Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 right-4 sm:right-8 z-[99998] max-w-sm flex items-center gap-3 px-4 py-3 rounded-xl bg-[#340F19]/95 dark:bg-[#1E080E]/95 text-[#FAF5F0] border border-[#C6A15B] shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(216,184,120,0.25)] backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            <div className="w-7 h-7 rounded-full bg-[#C6A15B]/20 border border-[#C6A15B] flex items-center justify-center text-[#D8B878] shrink-0">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0 pr-1">
              <p className="text-[10px] font-sans font-bold tracking-[0.2em] text-[#D8B878] uppercase">
                YAZHINI FINE JEWELS
              </p>
              <p className="text-xs font-serif text-[#FAF5F0] truncate font-medium mt-0.5">
                {toastMessage}
              </p>
            </div>
            <div className="pl-1 shrink-0 text-[#D8B878]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
