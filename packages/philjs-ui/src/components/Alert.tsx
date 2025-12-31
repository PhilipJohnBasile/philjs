/**
 * PhilJS UI - Alert Component
 */
import { signal } from 'philjs-core';
import type { JSX } from 'philjs-core/jsx-runtime';

type AlertStatus = 'info' | 'success' | 'warning' | 'error';
type AlertVariant = 'subtle' | 'solid' | 'left-accent' | 'top-accent';

interface StatusStyle {
  subtle: string;
  solid: string;
  icon: string;
}

const statusStyles: Record<AlertStatus, StatusStyle> = {
  info: {
    subtle: 'bg-blue-50 text-blue-800 border-blue-500',
    solid: 'bg-blue-600 text-white',
    icon: 'text-blue-500',
  },
  success: {
    subtle: 'bg-green-50 text-green-800 border-green-500',
    solid: 'bg-green-600 text-white',
    icon: 'text-green-500',
  },
  warning: {
    subtle: 'bg-yellow-50 text-yellow-800 border-yellow-500',
    solid: 'bg-yellow-500 text-white',
    icon: 'text-yellow-500',
  },
  error: {
    subtle: 'bg-red-50 text-red-800 border-red-500',
    solid: 'bg-red-600 text-white',
    icon: 'text-red-500',
  },
};

const defaultIcons: Record<AlertStatus, JSX.Element> = {
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

export interface AlertProps {
  status?: AlertStatus;
  variant?: AlertVariant;
  title?: string;
  children?: JSX.Element | JSX.Element[] | string;
  icon?: JSX.Element;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function Alert(props: AlertProps): JSX.Element | null {
  const {
    status = 'info',
    variant = 'subtle',
    title,
    children,
    icon,
    showIcon = true,
    dismissible = false,
    onDismiss,
    className = '',
  } = props;

  const isDismissed = signal(false);

  const handleDismiss = (): void => {
    isDismissed.set(true);
    onDismiss?.();
  };

  if (isDismissed()) return null;

  const styles = statusStyles[status];
  const displayIcon = icon || (showIcon ? defaultIcons[status] : null);

  const variantClasses: Record<AlertVariant, string> = {
    subtle: styles.subtle,
    solid: styles.solid,
    'left-accent': `${styles.subtle} border-l-4`,
    'top-accent': `${styles.subtle} border-t-4`,
  };

  return (
    <div
      role="alert"
      className={`
        p-4 rounded-md
        ${variantClasses[variant]}
        ${className}
      `}
    >
      <div className="flex">
        {displayIcon && (
          <div className={`flex-shrink-0 ${variant === 'solid' ? 'text-white' : styles.icon}`}>
            {displayIcon}
          </div>
        )}
        <div className={`${displayIcon ? 'ml-3' : ''} flex-1`}>
          {title && <h3 className="font-medium">{title}</h3>}
          {children && (
            <div
              className={`${title ? 'mt-1' : ''} text-sm ${
                variant === 'solid' ? 'text-white/90' : 'opacity-90'
              }`}
            >
              {children}
            </div>
          )}
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={handleDismiss}
              className={`
                inline-flex rounded-md p-1.5
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${
                  variant === 'solid'
                    ? 'text-white/80 hover:text-white focus:ring-white'
                    : `${styles.icon} hover:opacity-75 focus:ring-current`
                }
              `}
              aria-label="Dismiss"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export interface AlertTitleProps {
  children: JSX.Element | JSX.Element[] | string;
}

/**
 * Alert Title
 */
export function AlertTitle(props: AlertTitleProps): JSX.Element {
  return <h3 className="font-medium">{props.children}</h3>;
}

export interface AlertDescriptionProps {
  children: JSX.Element | JSX.Element[] | string;
}

/**
 * Alert Description
 */
export function AlertDescription(props: AlertDescriptionProps): JSX.Element {
  return <div className="mt-1 text-sm opacity-90">{props.children}</div>;
}
