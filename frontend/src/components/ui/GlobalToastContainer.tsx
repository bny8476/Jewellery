import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { subscribeToToasts, ToastItem, toast } from '../../utils/toast';
import { NotificationCard } from './NotificationCard';

/**
 * GlobalToastContainer
 * Responsive toast notification portal positioned:
 * - Desktop: top-right corner
 * - Mobile: top-center below header
 *
 * Provides smooth framer-motion slide-in and fade-out transitions
 * and multi-toast non-overlapping vertical stacking.
 */
export const GlobalToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div
      className="fixed top-3 inset-x-3 sm:inset-x-auto sm:top-5 sm:right-5 z-[9999] flex flex-col gap-2.5 sm:gap-3 pointer-events-none items-center sm:items-end max-w-full sm:max-w-[390px] w-full"
      role="region"
      aria-label="Global Notifications"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: -18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 0.9, 
              y: -10, 
              transition: { duration: 0.18, ease: 'easeOut' } 
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="pointer-events-auto w-full max-w-[380px]"
          >
            <NotificationCard
              id={item.id}
              type={item.type}
              title={item.title}
              message={item.message}
              timestamp={item.timestamp}
              duration={item.duration}
              persistent={item.persistent}
              onClose={() => toast.dismiss(item.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GlobalToastContainer;
