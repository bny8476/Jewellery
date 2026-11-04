import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ModalPortalProps {
  isOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Universal Modal Portal for Yazhini Fine Jewels.
 * - Mounts directly into `document.body` to escape parent CSS stacking contexts (transforms, filters, sticky headers).
 * - Locks background page scrolling while open, and cleanly restores it on unmount or close.
 * - Guarantees full-screen viewport coverage above sticky headers (AdminTopNav z-30, CustomerAccountHeader z-40).
 */
export const ModalPortal: React.FC<ModalPortalProps> = ({ isOpen = true, children }) => {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    // Track active modal count to safely support nested or sequential modals
    const currentCount = parseInt(document.body.dataset.activeModals || '0', 10);
    document.body.dataset.activeModals = (currentCount + 1).toString();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      const remainingCount = parseInt(document.body.dataset.activeModals || '1', 10) - 1;
      if (remainingCount <= 0) {
        delete document.body.dataset.activeModals;
        document.body.style.overflow = originalOverflow === 'hidden' ? '' : originalOverflow;
      } else {
        document.body.dataset.activeModals = remainingCount.toString();
      }
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(children, document.body);
};

export default ModalPortal;
