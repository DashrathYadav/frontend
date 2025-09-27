import toast from 'react-hot-toast';
import { extractErrorMessage } from './errorHandler';

// Toast configuration
const toastOptions = {
  duration: 4000,
  style: {
    borderRadius: '8px',
    background: '#fff',
    color: '#374151',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
};

// Success toast
export const showSuccess = (message: string) => {
  toast.success(message, {
    ...toastOptions,
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
  });
};

// Error toast
export const showError = (error: unknown | string) => {
  const message = typeof error === 'string' ? error : extractErrorMessage(error).message;

  toast.error(message, {
    ...toastOptions,
    duration: 6000, // Longer duration for errors
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  });
};

// Warning toast
export const showWarning = (message: string) => {
  toast(message, {
    ...toastOptions,
    icon: '⚠️',
    style: {
      ...toastOptions.style,
      borderLeft: '4px solid #f59e0b',
    },
  });
};

// Info toast
export const showInfo = (message: string) => {
  toast(message, {
    ...toastOptions,
    icon: 'ℹ️',
    style: {
      ...toastOptions.style,
      borderLeft: '4px solid #3b82f6',
    },
  });
};

// Loading toast
export const showLoading = (message: string) => {
  return toast.loading(message, {
    ...toastOptions,
  });
};

// Promise toast - automatically handles loading, success, and error states
export const showPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: (error) => {
        const errorMessage = typeof messages.error === 'function'
          ? messages.error(error)
          : messages.error;
        return extractErrorMessage(error).message || errorMessage;
      },
    },
    toastOptions
  );
};

// Dismiss all toasts
export const dismissAll = () => {
  toast.dismiss();
};

// Form-specific toast helpers
export const formToast = {
  created: (entityName: string) =>
    showSuccess(`${entityName} created successfully!`),

  updated: (entityName: string) =>
    showSuccess(`${entityName} updated successfully!`),

  deleted: (entityName: string) =>
    showSuccess(`${entityName} deleted successfully!`),

  validationError: () =>
    showError('Please correct the validation errors below.'),

  networkError: () =>
    showError('Network error. Please check your connection and try again.'),

  unauthorizedError: () =>
    showError('You are not authorized to perform this action.'),
};