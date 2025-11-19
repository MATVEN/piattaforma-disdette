/**
 * Toast Helper Functions
 * Wrapper semplificato per react-hot-toast con icone custom
 */

import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { createElement } from 'react';

/**
 * Toast di successo
 */
export const showSuccess = (message: string) => {
  return toast.success(message, {
    icon: createElement(CheckCircle2, {
      className: 'h-5 w-5 text-success-600',
    }),
  });
};

/**
 * Toast di errore
 */
export const showError = (message: string) => {
  return toast.error(message, {
    icon: createElement(XCircle, {
      className: 'h-5 w-5 text-danger-600',
    }),
  });
};

/**
 * Toast di warning
 */
export const showWarning = (message: string) => {
  return toast(message, {
    icon: createElement(AlertCircle, {
      className: 'h-5 w-5 text-warning-600',
    }),
    style: {
      background: '#fef3c7',
      border: '1px solid #f59e0b',
    },
  });
};

/**
 * Toast informativo
 */
export const showInfo = (message: string) => {
  return toast(message, {
    icon: createElement(Info, {
      className: 'h-5 w-5 text-primary-600',
    }),
    style: {
      background: '#e0e7ff',
      border: '1px solid #6366f1',
    },
  });
};

/**
 * Toast di loading con promessa
 * Mostra loading → success/error automaticamente
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      loading: {
        icon: createElement(Loader2, {
          className: 'h-5 w-5 text-primary-600 animate-spin',
        }),
      },
      success: {
        icon: createElement(CheckCircle2, {
          className: 'h-5 w-5 text-success-600',
        }),
      },
      error: {
        icon: createElement(XCircle, {
          className: 'h-5 w-5 text-danger-600',
        }),
      },
    }
  );
};

/**
 * Chiudi tutti i toast
 */
export const dismissAll = () => {
  toast.dismiss();
};

/**
 * Toast custom con componente React
 */
export const showCustom = (component: JSX.Element, options?: any) => {
  return toast.custom(component, options);
};