/**
 * PhilJS UI - Modal Component
 */

import { JSX, signal, effect, onMount, onCleanup } from 'philjs-core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: JSX.Element;
  title?: string;
  size?: ModalSize;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  initialFocus?: HTMLElement | null;
  className?: string;
  overlayClassName?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

export function Modal(props: ModalProps) {
  const {
    isOpen,
    onClose,
    children,
    title,
    size = 'md',
    closeOnOverlay = true,
    closeOnEscape = true,
    showCloseButton = true,
    initialFocus,
    className = '',
    overlayClassName = '',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
  } = props;

  const modalId = `modal-${Math.random().toString(36).slice(2, 9)}`;
  const titleId = title ? `${modalId}-title` : undefined;
  let modalRef: HTMLDivElement | null = null;
  let previousActiveElement: Element | null = null;

  // Handle escape key
  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  // Focus management
  effect(() => {
    if (isOpen) {
      previousActiveElement = document.activeElement;
      document.body.style.overflow = 'hidden';

      // Focus initial element or modal
      setTimeout(() => {
        if (initialFocus) {
          initialFocus.focus();
        } else if (modalRef) {
          const focusable = modalRef.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          focusable?.focus();
        }
      }, 0);
    } else {
      document.body.style.overflow = '';

      // Restore focus
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    }
  });

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      onClose();
    }
  };

  // Trap focus within modal
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef) return;

    const focusableElements = modalRef.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50
        flex items-center justify-center
        p-4
        ${overlayClassName}
      `}
      role="presentation"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={(el) => (modalRef = el)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId || ariaLabel}
        aria-describedby={ariaDescribedBy}
        onKeyDown={handleKeyDown}
        className={`
          relative w-full ${sizeStyles[size]}
          bg-white rounded-lg shadow-xl
          transform transition-all
          ${className}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h2
                id={titleId}
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close modal"
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/**
 * Modal Header
 */
export function ModalHeader(props: { children: JSX.Element; className?: string }) {
  return (
    <div className={`px-4 pt-4 pb-2 ${props.className || ''}`}>
      {props.children}
    </div>
  );
}

/**
 * Modal Body
 */
export function ModalBody(props: { children: JSX.Element; className?: string }) {
  return (
    <div className={`px-4 py-2 ${props.className || ''}`}>
      {props.children}
    </div>
  );
}

/**
 * Modal Footer
 */
export function ModalFooter(props: { children: JSX.Element; className?: string }) {
  return (
    <div className={`px-4 pt-2 pb-4 flex justify-end gap-2 ${props.className || ''}`}>
      {props.children}
    </div>
  );
}

/**
 * Confirmation Dialog
 */
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'info' | 'warning' | 'danger';
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const {
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'info',
  } = props;

  const variantStyles = {
    info: 'bg-blue-600 hover:bg-blue-700',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
    danger: 'bg-red-600 hover:bg-red-700',
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title={title}>
      <div>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
