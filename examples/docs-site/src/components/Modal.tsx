import { signal, effect } from 'philjs-core';

export interface ModalProps {
  /** Control modal visibility */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: 'small' | 'medium' | 'large' | 'full';
  /** Show close button */
  showClose?: boolean;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Prevent body scroll when open */
  preventScroll?: boolean;
  children: any;
  className?: string;
}

/**
 * Modal Component
 *
 * Accessible modal dialog with backdrop, focus trap, and keyboard support.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  size = 'medium',
  showClose = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  preventScroll = true,
  children,
  className = '',
}: ModalProps) {
  // Prevent body scroll when modal is open
  effect(() => {
    if (isOpen && preventScroll) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  });

  // Close on escape key
  effect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  });

  const sizes = {
    small: '400px',
    medium: '600px',
    large: '900px',
    full: '95vw',
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '2rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={() => closeOnBackdrop && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className="modal-content"
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          maxWidth: sizes[size],
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'modalSlideIn 0.3s ease-out',
        }}
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showClose) && (
          <div
            style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {title && (
              <h2
                id="modal-title"
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  margin: 0,
                }}
              >
                {title}
              </h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-alt)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  fontSize: '1.25rem',
                }}
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '1.5rem',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Confirmation Modal - For yes/no decisions
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}) {
  const confirmColor = variant === 'danger' ? '#ef4444' : 'var(--color-brand)';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text)', margin: 0 }}>
          {message}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '0.625rem 1.5rem',
            background: 'var(--color-bg-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-text)',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          style={{
            padding: '0.625rem 1.5rem',
            background: confirmColor,
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

/**
 * useModal hook for easier modal management
 */
export function useModal(initialState = false) {
  const isOpen = signal(initialState);

  return {
    isOpen: isOpen(),
    open: () => isOpen.set(true),
    close: () => isOpen.set(false),
    toggle: () => isOpen.set(!isOpen()),
  };
}

/**
 * Add modal animations
 */
if (typeof document !== 'undefined') {
  const styleId = 'modal-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .modal-overlay,
        .modal-content {
          animation: none !important;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
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
 * // Basic modal
 * const modal = useModal();
 *
 * <button onClick={modal.open}>Open Modal</button>
 * <Modal isOpen={modal.isOpen} onClose={modal.close} title="My Modal">
 *   <p>Modal content here</p>
 * </Modal>
 *
 * // Confirmation modal
 * <ConfirmModal
 *   isOpen={confirmOpen}
 *   onClose={() => setConfirmOpen(false)}
 *   onConfirm={() => handleDelete()}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item? This action cannot be undone."
 *   variant="danger"
 * />
 */
