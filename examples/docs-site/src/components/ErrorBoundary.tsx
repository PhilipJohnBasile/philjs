import { signal } from 'philjs-core';

export interface ErrorInfo {
  error: Error;
  errorInfo?: any;
  timestamp: Date;
  componentStack?: string;
}

export interface ErrorBoundaryProps {
  children: any;
  fallback?: (error: ErrorInfo, reset: () => void) => any;
  onError?: (error: ErrorInfo) => void;
  /** Show error details in development */
  showDetails?: boolean;
}

/**
 * ErrorBoundary Component
 *
 * Catches and handles errors in child components gracefully.
 * Uses PhilJS signals for error state management.
 *
 * Note: Unlike React's ErrorBoundary, this relies on global error handlers
 * and manual error catching within components.
 */
export function ErrorBoundary({
  children,
  fallback,
  onError,
  showDetails = process.env.NODE_ENV === 'development',
}: ErrorBoundaryProps) {
  const error = signal<ErrorInfo | null>(null);

  const reset = () => {
    error.set(null);
  };

  const handleError = (err: Error, info?: any) => {
    const errorInfo: ErrorInfo = {
      error: err,
      errorInfo: info,
      timestamp: new Date(),
      componentStack: err.stack,
    };

    error.set(errorInfo);

    // Log to console in development
    if (showDetails) {
      console.error('Error caught by ErrorBoundary:', err);
      if (info) {
        console.error('Error info:', info);
      }
    }

    // Call user-provided error handler
    if (onError) {
      onError(errorInfo);
    }

    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, etc.
      // logErrorToService(errorInfo);
    }
  };

  // Set up global error handlers
  if (typeof window !== 'undefined') {
    window.onerror = (message, source, lineno, colno, err) => {
      if (err) {
        handleError(err);
      }
      return false; // Don't suppress default error handling
    };

    window.onunhandledrejection = (event) => {
      const err = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
      handleError(err);
    };
  }

  // If there's an error, show fallback
  if (error()) {
    if (fallback) {
      return fallback(error()!, reset);
    }
    return <DefaultErrorFallback error={error()!} reset={reset} showDetails={showDetails} />;
  }

  // Render children normally
  try {
    return children;
  } catch (err) {
    // Catch synchronous errors in render
    handleError(err as Error);
    if (fallback) {
      return fallback(error()!, reset);
    }
    return <DefaultErrorFallback error={error()!} reset={reset} showDetails={showDetails} />;
  }
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({
  error,
  reset,
  showDetails,
}: {
  error: ErrorInfo;
  reset: () => void;
  showDetails: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '2rem',
        background: 'var(--color-bg-alt)',
        border: '2px solid var(--color-error)',
        borderRadius: '12px',
        margin: '2rem',
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Error icon */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-error)"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      </div>

      {/* Error heading */}
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '0.5rem',
        }}
      >
        Something went wrong
      </h2>

      {/* Error message */}
      <p
        style={{
          fontSize: '1rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '1.5rem',
          maxWidth: '500px',
          textAlign: 'center',
        }}
      >
        We encountered an unexpected error. Please try again or contact support if the problem persists.
      </p>

      {/* Error details (development only) */}
      {showDetails && (
        <details
          style={{
            width: '100%',
            maxWidth: '800px',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--color-bg-code)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: '0.5rem',
            }}
          >
            Error Details
          </summary>
          <div style={{ color: 'var(--color-error)', marginBottom: '0.5rem' }}>
            <strong>Message:</strong> {error.error.message}
          </div>
          {error.componentStack && (
            <pre
              style={{
                overflow: 'auto',
                padding: '0.75rem',
                background: 'var(--color-bg)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                lineHeight: '1.5',
                color: 'var(--color-text-secondary)',
              }}
            >
              {error.componentStack}
            </pre>
          )}
          <div style={{ marginTop: '0.5rem', color: 'var(--color-text-tertiary)' }}>
            <strong>Time:</strong> {error.timestamp.toLocaleString()}
          </div>
        </details>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--color-brand)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

/**
 * Hook to catch errors in async operations
 */
export function useErrorHandler() {
  const error = signal<ErrorInfo | null>(null);

  const handleError = (err: Error) => {
    error.set({
      error: err,
      timestamp: new Date(),
      componentStack: err.stack,
    });
  };

  const clearError = () => {
    error.set(null);
  };

  return {
    error,
    handleError,
    clearError,
  };
}

/**
 * Wrapper function to catch errors in async functions
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  onError?: (error: Error) => void
): T {
  return ((...args: any[]) => {
    return fn(...args).catch((error: Error) => {
      console.error('Async error caught:', error);
      if (onError) {
        onError(error);
      }
      throw error; // Re-throw to maintain promise chain
    });
  }) as T;
}

/**
 * Error logging utilities
 */
export const ErrorLogger = {
  /**
   * Log error to console with formatted output
   */
  logError(error: ErrorInfo): void {
    console.group('🚨 Error Report');
    console.error('Message:', error.error.message);
    console.error('Time:', error.timestamp.toLocaleString());
    if (error.componentStack) {
      console.error('Stack:', error.componentStack);
    }
    if (error.errorInfo) {
      console.error('Info:', error.errorInfo);
    }
    console.groupEnd();
  },

  /**
   * Send error to remote logging service
   * Replace with your actual logging service
   */
  async sendToService(error: ErrorInfo): Promise<void> {
    try {
      // Example: Send to your logging service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     message: error.error.message,
      //     stack: error.error.stack,
      //     timestamp: error.timestamp,
      //     url: window.location.href,
      //     userAgent: navigator.userAgent,
      //   }),
      // });
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  },

  /**
   * Store error in local storage for debugging
   */
  storeLocally(error: ErrorInfo): void {
    try {
      const errors = this.getStoredErrors();
      errors.push({
        message: error.error.message,
        stack: error.error.stack,
        timestamp: error.timestamp.toISOString(),
      });

      // Keep only last 10 errors
      const recentErrors = errors.slice(-10);
      localStorage.setItem('philjs-errors', JSON.stringify(recentErrors));
    } catch (storageError) {
      console.error('Failed to store error locally:', storageError);
    }
  },

  /**
   * Get stored errors from local storage
   */
  getStoredErrors(): any[] {
    try {
      const stored = localStorage.getItem('philjs-errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Clear stored errors
   */
  clearStoredErrors(): void {
    try {
      localStorage.removeItem('philjs-errors');
    } catch (error) {
      console.error('Failed to clear stored errors:', error);
    }
  },
};

/**
 * Example usage:
 *
 * ```tsx
 * // Wrap your app or components
 * <ErrorBoundary
 *   onError={(error) => {
 *     console.log('Error occurred:', error);
 *     // Send to error tracking service
 *   }}
 *   fallback={(error, reset) => (
 *     <div>
 *       <h1>Custom Error UI</h1>
 *       <button onClick={reset}>Try Again</button>
 *     </div>
 *   )}
 * >
 *   <App />
 * </ErrorBoundary>
 *
 * // Use error handler in components
 * const { error, handleError, clearError } = useErrorHandler();
 *
 * async function fetchData() {
 *   try {
 *     const data = await fetch('/api/data');
 *     return data.json();
 *   } catch (err) {
 *     handleError(err as Error);
 *   }
 * }
 *
 * // Wrap async functions
 * const safeFetch = withErrorHandler(fetchData, (error) => {
 *   console.error('Fetch failed:', error);
 * });
 * ```
 */
