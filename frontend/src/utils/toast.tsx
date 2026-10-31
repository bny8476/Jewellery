export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number; // 5000ms by default
  persistent?: boolean;
  createdAt: number;
  timestamp?: string;
}

export interface CustomToastOptions {
  title?: string;
  autoClose?: number | false;
  duration?: number;
  persistent?: boolean;
  id?: string;
  dedupe?: boolean;
  [key: string]: any;
}

type ToastListener = (toasts: ToastItem[]) => void;

// Smart title resolution based on message keywords
export const resolveTitle = (
  message: string, 
  type: ToastType, 
  customTitle?: string
): string => {
  if (customTitle) return customTitle;

  const lower = (message || '').toLowerCase();
  if (lower.includes('all notifications marked as read') || lower.includes('notification')) {
    return 'Notifications';
  }
  if (lower.includes('cart') || lower.includes('bag') || lower.includes('wishlist') || lower.includes('ensemble')) {
    return 'Shopping Bag';
  }
  if (lower.includes('order') || lower.includes('dispatch') || lower.includes('transit') || lower.includes('delivery')) {
    return 'Orders & Logistics';
  }
  if (lower.includes('profile') || lower.includes('password') || lower.includes('address') || lower.includes('member') || lower.includes('account')) {
    return 'Account Update';
  }
  if (lower.includes('payment') || lower.includes('invoice') || lower.includes('coupon') || lower.includes('card') || lower.includes('ledger') || lower.includes('repayment') || lower.includes('billing')) {
    return 'Billing & Payments';
  }
  if (lower.includes('rate') || lower.includes('gold') || lower.includes('bullion') || lower.includes('silver') || lower.includes('platinum')) {
    return 'Precious Metal Rates';
  }
  if (lower.includes('pawn') || lower.includes('pledge') || lower.includes('loan') || lower.includes('appraisal')) {
    return 'Pawn Vault Services';
  }
  if (lower.includes('kyc') || lower.includes('aadhaar') || lower.includes('pan') || lower.includes('verification')) {
    return 'KYC Compliance';
  }
  if (lower.includes('appointment') || lower.includes('concierge') || lower.includes('advisor') || lower.includes('vip')) {
    return 'VIP Concierge';
  }

  switch (type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Notice';
    case 'info':
      return 'Update';
    case 'warning':
      return 'Attention';
    default:
      return 'Notification';
  }
};

/**
 * Global Toast Manager Store
 * Handles toast queue, deduplication, 5-second countdowns, and listeners.
 */
class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners = new Set<ToastListener>();
  private recentFingerprints = new Map<string, number>();
  private dedupeWindowMs = 1500;

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = [...this.toasts];
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[ToastManager] listener error:', err);
      }
    });
  }

  show(
    message: string, 
    type: ToastType = 'info', 
    options?: CustomToastOptions | string
  ): string {
    const normalizedOptions: CustomToastOptions =
      typeof options === 'string' ? { title: options } : options || {};

    const rawMsg = typeof message === 'string' ? message : String(message || '');
    const title = resolveTitle(rawMsg, type, normalizedOptions.title);

    // Deduplication check: suppress identical notifications within 1.5 seconds
    if (normalizedOptions.dedupe !== false) {
      const fingerprint = `${type}::${title.trim()}::${rawMsg.trim()}`;
      const now = Date.now();
      const lastSeen = this.recentFingerprints.get(fingerprint);
      if (lastSeen && now - lastSeen < this.dedupeWindowMs) {
        // Duplicate within debounce window - ignore
        return '';
      }
      this.recentFingerprints.set(fingerprint, now);

      // Clean up old fingerprints
      if (this.recentFingerprints.size > 50) {
        for (const [key, timestamp] of this.recentFingerprints.entries()) {
          if (now - timestamp > 10000) {
            this.recentFingerprints.delete(key);
          }
        }
      }
    }

    const isPersistent =
      normalizedOptions.persistent === true ||
      normalizedOptions.autoClose === false ||
      normalizedOptions.duration === 0;

    // Standard auto-dismiss duration: exactly 5000ms (5 seconds)
    const duration = isPersistent
      ? 0
      : (typeof normalizedOptions.duration === 'number'
          ? normalizedOptions.duration
          : typeof normalizedOptions.autoClose === 'number'
            ? normalizedOptions.autoClose
            : 5000);

    const id = normalizedOptions.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const newToast: ToastItem = {
      id,
      type,
      title,
      message: rawMsg,
      duration,
      persistent: isPersistent,
      createdAt: Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Keep max 5 active notifications on screen to prevent viewport clogging
    this.toasts = [...this.toasts.slice(-4), newToast];
    this.notify();
    return id;
  }

  dismiss(id?: string) {
    if (!id) {
      this.dismissAll();
      return;
    }
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  dismissAll() {
    this.toasts = [];
    this.notify();
  }

  getToasts(): ToastItem[] {
    return [...this.toasts];
  }
}

export const toastManager = new ToastManager();

// Subscription helper for React components
export const subscribeToToasts = (listener: ToastListener) => {
  return toastManager.subscribe(listener);
};

export const getActiveToasts = () => {
  return toastManager.getToasts();
};

// Backwards compatibility helper
export const initToast = (_toastFunction?: any) => {
  // Retained for backwards compatibility with legacy init callers
};

// Global toast interface
export const toast = {
  success: (message: string, options?: CustomToastOptions | string) => {
    return toastManager.show(message, 'success', options);
  },
  error: (message: string, options?: CustomToastOptions | string) => {
    return toastManager.show(message, 'error', options);
  },
  info: (message: string, options?: CustomToastOptions | string) => {
    return toastManager.show(message, 'info', options);
  },
  warning: (message: string, options?: CustomToastOptions | string) => {
    return toastManager.show(message, 'warning', options);
  },
  dismiss: (id?: string) => {
    toastManager.dismiss(id);
  },
  dismissAll: () => {
    toastManager.dismissAll();
  },
  custom: (renderFn: any, options?: CustomToastOptions) => {
    return toastManager.show(typeof renderFn === 'string' ? renderFn : 'Custom alert', 'info', options);
  },
};

// Confirmation dialog utility
export const confirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const result = typeof window !== 'undefined' ? window.confirm(message) : true;
    resolve(result);
  });
};

export default toast;
