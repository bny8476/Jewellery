import { NotificationCard } from '../components/ui/NotificationCard';

// Toast notification utility integrated with react-toastify
let toastImpl: any = null;

// Initialize toast - called from main.tsx
export const initToast = (toastFunction: any) => {
  toastImpl = toastFunction;
};

export interface CustomToastOptions {
  title?: string;
  autoClose?: number;
  [key: string]: any;
}

const resolveTitle = (message: string, type: 'success' | 'error' | 'info' | 'warning', customTitle?: string): string => {
  if (customTitle) return customTitle;

  const lower = message.toLowerCase();
  if (lower.includes('all notifications marked as read') || lower.includes('notification')) {
    return 'Notifications';
  }
  if (lower.includes('order') || lower.includes('dispatch') || lower.includes('transit') || lower.includes('delivery')) {
    return 'Orders & Logistics';
  }
  if (lower.includes('profile') || lower.includes('password') || lower.includes('address') || lower.includes('member')) {
    return 'Account Update';
  }
  if (lower.includes('payment') || lower.includes('invoice') || lower.includes('coupon') || lower.includes('card') || lower.includes('ledger') || lower.includes('repayment')) {
    return 'Billing & Payments';
  }
  if (lower.includes('rate') || lower.includes('gold') || lower.includes('bullion')) {
    return 'Precious Metal Rates';
  }
  if (lower.includes('appointment') || lower.includes('concierge') || lower.includes('advisor')) {
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

const formatToast = (
  message: string, 
  type: 'success' | 'error' | 'info' | 'warning', 
  options?: CustomToastOptions | string
) => {
  const normalizedOptions: CustomToastOptions = typeof options === 'string' ? { title: options } : (options || {});

  if (toastImpl) {
    const title = resolveTitle(message, type, normalizedOptions.title);

    toastImpl(
      ({ closeToast }: { closeToast?: () => void }) => (
        <NotificationCard
          title={title}
          message={message}
          onClose={closeToast}
        />
      ),
      {
        autoClose: normalizedOptions.autoClose || 4000,
        hideProgressBar: true,
        closeButton: false,
        icon: false,
        ...normalizedOptions,
      }
    );
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};

// Toast functions
export const toast = {
  success: (message: string, options?: CustomToastOptions | string) => {
    formatToast(message, 'success', options);
  },
  error: (message: string, options?: CustomToastOptions | string) => {
    formatToast(message, 'error', options);
  },
  info: (message: string, options?: CustomToastOptions | string) => {
    formatToast(message, 'info', options);
  },
  warning: (message: string, options?: CustomToastOptions | string) => {
    formatToast(message, 'warning', options);
  },
};

// Confirmation dialog utility
export const confirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const result = window.confirm(message);
    resolve(result);
  });
};

export default toast;
