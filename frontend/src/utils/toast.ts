// Toast notification utility
// This will work with react-toastify once installed
// For now, it provides a fallback to console warnings

let toastImpl: any = null;

// Initialize toast - call this after react-toastify is installed
export const initToast = (toastFunction: any) => {
  toastImpl = toastFunction;
};

// Toast functions
export const toast = {
  success: (message: string) => {
    if (toastImpl?.success) {
      toastImpl.success(message);
    } else {
      console.log(`✓ ${message}`);
      // Fallback: show in console
    }
  },
  error: (message: string) => {
    if (toastImpl?.error) {
      toastImpl.error(message);
    } else {
      console.error(`✗ ${message}`);
      // Fallback: alert in development
      if (import.meta.env.DEV) {
        alert(`Error: ${message}`);
      }
    }
  },
  info: (message: string) => {
    if (toastImpl?.info) {
      toastImpl.info(message);
    } else {
      console.info(`ℹ ${message}`);
    }
  },
  warning: (message: string) => {
    if (toastImpl?.warning) {
      toastImpl.warning(message);
    } else {
      console.warn(`⚠ ${message}`);
    }
  },
};

// Confirmation dialog utility
export const confirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const result = window.confirm(message);
    resolve(result);
  });
};

