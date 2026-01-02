/**
 * PhilJS UI - Drawer Component
 */
import { effect } from '@philjs/core';
import type { JSX } from '@philjs/core/jsx-runtime';

type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';
type DrawerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

const sizeStyles: Record<DrawerPlacement, Record<DrawerSize, string>> = {
  left: {
    xs: 'w-64',
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[32rem]',
    xl: 'w-[40rem]',
    full: 'w-screen',
  },
  right: {
    xs: 'w-64',
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[32rem]',
    xl: 'w-[40rem]',
    full: 'w-screen',
  },
  top: {
    xs: 'h-32',
    sm: 'h-48',
    md: 'h-64',
    lg: 'h-96',
    xl: 'h-[32rem]',
    full: 'h-screen',
  },
  bottom: {
    xs: 'h-32',
    sm: 'h-48',
    md: 'h-64',
    lg: 'h-96',
    xl: 'h-[32rem]',
    full: 'h-screen',
  },
};

interface PlacementStyle {
  container: string;
  panel: string;
  open: string;
  closed: string;
}

const placementStyles: Record<DrawerPlacement, PlacementStyle> = {
  left: {
    container: 'inset-y-0 left-0',
    panel: 'h-full',
    open: 'translate-x-0',
    closed: '-translate-x-full',
  },
  right: {
    container: 'inset-y-0 right-0',
    panel: 'h-full',
    open: 'translate-x-0',
    closed: 'translate-x-full',
  },
  top: {
    container: 'inset-x-0 top-0',
    panel: 'w-full',
    open: 'translate-y-0',
    closed: '-translate-y-full',
  },
  bottom: {
    container: 'inset-x-0 bottom-0',
    panel: 'w-full',
    open: 'translate-y-0',
    closed: 'translate-y-full',
  },
};

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: JSX.Element | JSX.Element[];
  placement?: DrawerPlacement;
  size?: DrawerSize;
  title?: string;
  showCloseButton?: boolean;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
}

export function Drawer(props: DrawerProps): JSX.Element | null {
  const {
    isOpen,
    onClose,
    children,
    placement = 'right',
    size = 'md',
    title,
    showCloseButton = true,
    closeOnOverlay = true,
    closeOnEscape = true,
    className = '',
    overlayClassName = '',
  } = props;

  let drawerRef: HTMLDivElement | null = null;

  // Handle escape key
  effect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Lock body scroll
  effect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  const handleOverlayClick = (): void => {
    if (closeOnOverlay) {
      onClose();
    }
  };

  const styles = placementStyles[placement];
  const sizeClass = sizeStyles[placement][size];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${overlayClassName}`}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className={`fixed ${styles.container}`}>
        <div
          ref={(el: HTMLDivElement | null) => (drawerRef = el)}
          className={`
            ${styles.panel}
            ${sizeClass}
            bg-white shadow-xl
            flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? styles.open : styles.closed}
            ${className}
          `}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              {title && (
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close drawer"
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
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export interface DrawerHeaderProps {
  children: JSX.Element | JSX.Element[] | string;
  className?: string;
}

/**
 * Drawer Header
 */
export function DrawerHeader(props: DrawerHeaderProps): JSX.Element {
  return (
    <div className={`px-4 py-3 border-b border-gray-200 ${props.className || ''}`}>
      {props.children}
    </div>
  );
}

export interface DrawerBodyProps {
  children: JSX.Element | JSX.Element[] | string;
  className?: string;
}

/**
 * Drawer Body
 */
export function DrawerBody(props: DrawerBodyProps): JSX.Element {
  return (
    <div className={`flex-1 overflow-y-auto px-4 py-3 ${props.className || ''}`}>
      {props.children}
    </div>
  );
}

export interface DrawerFooterProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

/**
 * Drawer Footer
 */
export function DrawerFooter(props: DrawerFooterProps): JSX.Element {
  return (
    <div
      className={`px-4 py-3 border-t border-gray-200 flex justify-end gap-2 ${
        props.className || ''
      }`}
    >
      {props.children}
    </div>
  );
}
