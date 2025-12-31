import { signal, effect } from '@philjs/core';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

/**
 * Toast Component
 *
 * Individual toast notification with auto-dismiss and actions.
 */
export function ToastItem({ toast, onDismiss }: ToastProps) {
  const isVisible = signal(true);

  // Auto-dismiss after duration
  effect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        isVisible.set(false);
        setTimeout(() => onDismiss(toast.id), 300); // Wait for animation
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  });

  const colors = {
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: '#3b82f6',
      icon: 'ℹ',
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: '#10b981',
      icon: '✓',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: '#f59e0b',
      icon: '⚠',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: '#ef4444',
      icon: '✕',
    },
  };

  const color = colors[toast.type];

  return (
    <div
      style={{
        display: isVisible() ? 'flex' : 'none',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem',
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderLeft: `4px solid ${color.border}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        minWidth: '300px',
        maxWidth: '500px',
        animation: isVisible() ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-out',
        pointerEvents: 'auto',
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div
        style={{
          fontSize: '1.25rem',
          flexShrink: 0,
          marginTop: '0.125rem',
        }}
      >
        {color.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--color-text)' }}>
        {toast.message}
      </div>

      {/* Action */}
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          style={{
            padding: '0.25rem 0.75rem',
            background: 'transparent',
            border: `1px solid ${color.border}`,
            borderRadius: '4px',
            color: color.border,
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {toast.action.label}
        </button>
      )}

      {/* Dismiss */}
      <button
        onClick={() => {
          isVisible.set(false);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        style={{
          width: '1.5rem',
          height: '1.5rem',
          padding: 0,
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-tertiary)',
          fontSize: '1.25rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'all var(--transition-fast)',
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

/**
 * ToastContainer Component
 *
 * Container for managing multiple toast notifications.
 */
export function ToastContainer({
  position = 'bottom-right',
}: {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
} = {}) {
  const toasts = signal<Toast[]>([]);

  const dismiss = (id: string) => {
    toasts.set(toasts().filter((t) => t.id !== id));
  };

  const positionStyles: Record<string, any> = {
    'top-left': { top: '2rem', left: '2rem' },
    'top-right': { top: '2rem', right: '2rem' },
    'bottom-left': { bottom: '2rem', left: '2rem' },
    'bottom-right': { bottom: '2rem', right: '2rem' },
    'top-center': { top: '2rem', left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: '2rem', left: '50%', transform: 'translateX(-50%)' },
  };

  // Expose methods globally for easy access
  if (typeof window !== 'undefined') {
    (window as any).__toastContainer = {
      add: (toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        toasts.set([...toasts(), { ...toast, id, duration: toast.duration ?? 5000 }]);
      },
      dismiss,
      clear: () => toasts.set([]),
    };
  }

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-atomic={false}
    >
      {toasts().map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

/**
 * Toast API - Imperative toast notifications
 */
export const toast = {
  info: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
    (window as any).__toastContainer?.add({ message, type: 'info', ...options });
  },
  success: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
    (window as any).__toastContainer?.add({ message, type: 'success', ...options });
  },
  warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
    (window as any).__toastContainer?.add({ message, type: 'warning', ...options });
  },
  error: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
    (window as any).__toastContainer?.add({ message, type: 'error', ...options });
  },
  dismiss: (id: string) => {
    (window as any).__toastContainer?.dismiss(id);
  },
  clear: () => {
    (window as any).__toastContainer?.clear();
  },
};

/**
 * Hook for toast notifications
 */
export function useToast() {
  return {
    info: toast.info,
    success: toast.success,
    warning: toast.warning,
    error: toast.error,
    dismiss: toast.dismiss,
    clear: toast.clear,
  };
}

/**
 * Add toast animations to global CSS
 */
if (typeof document !== 'undefined') {
  const styleId = 'toast-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        @keyframes slideInRight {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Example usage:
 *
 * Add ToastContainer to your app root:
 * <ToastContainer position="bottom-right" />
 *
 * Then use toast API anywhere:
 * toast.success('Changes saved!');
 * toast.error('Failed to save changes');
 * toast.info('New version available', {
 *   duration: 10000,
 *   action: {
 *     label: 'Reload',
 *     onClick: () => window.location.reload()
 *   }
 * });
 *
 * Or use the hook in components:
 * const { success, error } = useToast();
 * success('Operation completed!');
 */
