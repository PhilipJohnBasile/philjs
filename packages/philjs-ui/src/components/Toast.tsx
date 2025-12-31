/**
 * PhilJS UI - Toast Component
 */
import { signal } from 'philjs-core';
import type { JSX } from 'philjs-core/jsx-runtime';

export type ToastStatus = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right';

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  status?: ToastStatus;
  duration?: number;
  isClosable?: boolean;
  position?: ToastPosition;
  render?: (props: { onClose: () => void }) => JSX.Element | JSX.Element[] | null;
}

interface ToastState {
  id: string;
  title: string;
  description: string;
  status: ToastStatus;
  duration: number;
  isClosable: boolean;
  position: ToastPosition;
  render?: ToastOptions['render'];
}

// Global toast state
const toasts = signal<ToastState[]>([]);
let toastIdCounter = 0;

export interface ToastApi {
  (options: ToastOptions): string;
  success: (options: Omit<ToastOptions, 'status'>) => string;
  error: (options: Omit<ToastOptions, 'status'>) => string;
  warning: (options: Omit<ToastOptions, 'status'>) => string;
  info: (options: Omit<ToastOptions, 'status'>) => string;
  close: (id: string) => void;
  closeAll: () => void;
}

export const toast: ToastApi = ((options: ToastOptions): string => {
  const id = options.id || `toast-${++toastIdCounter}`;

  const newToast: ToastState = {
    id,
    title: options.title || '',
    description: options.description || '',
    status: options.status || 'info',
    duration: options.duration ?? 5000,
    isClosable: options.isClosable ?? true,
    position: options.position || 'top-right',
    render: options.render,
  };

  toasts.set([...toasts(), newToast]);

  if (newToast.duration > 0) {
    setTimeout(() => {
      toast.close(id);
    }, newToast.duration);
  }

  return id;
}) as ToastApi;

toast.success = (options) => toast({ ...options, status: 'success' });
toast.error = (options) => toast({ ...options, status: 'error' });
toast.warning = (options) => toast({ ...options, status: 'warning' });
toast.info = (options) => toast({ ...options, status: 'info' });

toast.close = (id: string): void => {
  toasts.set(toasts().filter((t) => t.id !== id));
};

toast.closeAll = (): void => {
  toasts.set([]);
};

/**
 * Toast Container - Renders all active toasts
 */
export function ToastContainer(): JSX.Element {
  const positions: ToastPosition[] = [
    'top',
    'top-left',
    'top-right',
    'bottom',
    'bottom-left',
    'bottom-right',
  ];

  const positionClasses: Record<ToastPosition, string> = {
    top: 'top-4 left-1/2 -translate-x-1/2',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    bottom: 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <>
      {positions.map((position) => {
        const positionToasts = toasts().filter((t) => t.position === position);
        if (positionToasts.length === 0) return null;

        return (
          <div
            className={`fixed z-50 ${positionClasses[position]} flex flex-col gap-2`}
            aria-live="polite"
            key={position}
          >
            {positionToasts.map((t) => (
              <ToastItem toast={t} key={t.id} />
            ))}
          </div>
        );
      })}
    </>
  );
}

const statusStyles: Record<ToastStatus, { bg: string; border: string; icon: string }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    icon: 'text-blue-500',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    icon: 'text-yellow-500',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    icon: 'text-red-500',
  },
};

const statusIcons: Record<ToastStatus, JSX.Element> = {
  info: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

function ToastItem(props: { toast: ToastState }): JSX.Element | null {
  const { toast: t } = props;
  const styles = statusStyles[t.status];

  const handleClose = (): void => {
    toast.close(t.id);
  };

  // Custom render
  if (t.render) {
    return t.render({ onClose: handleClose }) as JSX.Element;
  }

  return (
    <div
      role="alert"
      className={`
        min-w-[300px] max-w-md
        ${styles.bg}
        border-l-4 ${styles.border}
        rounded-md shadow-lg
        p-4
        animate-[toast-enter_0.2s_ease-out]
      `}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${styles.icon}`}>{statusIcons[t.status]}</div>
        <div className="ml-3 flex-1">
          {t.title && <p className="text-sm font-medium text-gray-900">{t.title}</p>}
          {t.description && (
            <p className={`text-sm text-gray-600 ${t.title ? 'mt-1' : ''}`}>
              {t.description}
            </p>
          )}
        </div>
        {t.isClosable && (
          <button
            type="button"
            onClick={handleClose}
            className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * useToast hook for easier access
 */
export function useToast(): ToastApi {
  return toast;
}
