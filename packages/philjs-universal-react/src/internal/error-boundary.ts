/**
 * React Error Boundary for Universal Component Protocol.
 * Catches errors in React component trees and provides fallback UI.
 */

import {
  Component,
  createElement,
  type ReactNode,
  type ErrorInfo,
  type ComponentType,
} from 'react';
import type { ErrorFallbackProps } from '../types.js';

/**
 * Props for the ErrorBoundary component.
 */
export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;

  /** Fallback component to render when an error occurs */
  fallback?: ComponentType<ErrorFallbackProps>;

  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /** Key to reset the error state when it changes */
  resetKey?: string | number;
}

/**
 * State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;

  /** The caught error */
  error: Error | null;

  /** Error info from React */
  errorInfo: ErrorInfo | null;
}

/**
 * Default error fallback component.
 */
function DefaultErrorFallback({
  error,
  resetError,
}: ErrorFallbackProps): ReactNode {
  return createElement(
    'div',
    {
      style: {
        padding: '16px',
        margin: '8px',
        border: '1px solid #ff6b6b',
        borderRadius: '4px',
        backgroundColor: '#fff5f5',
        color: '#c92a2a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
    },
    createElement(
      'h3',
      {
        style: {
          margin: '0 0 8px 0',
          fontSize: '16px',
          fontWeight: 600,
        },
      },
      'Something went wrong'
    ),
    createElement(
      'pre',
      {
        style: {
          margin: '8px 0',
          padding: '8px',
          backgroundColor: '#fff',
          border: '1px solid #ffc9c9',
          borderRadius: '2px',
          fontSize: '12px',
          overflow: 'auto',
          maxHeight: '200px',
        },
      },
      error.message
    ),
    createElement(
      'button',
      {
        onClick: resetError,
        style: {
          padding: '8px 16px',
          backgroundColor: '#fa5252',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        },
      },
      'Try Again'
    )
  );
}

/**
 * React Error Boundary class component.
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught during rendering.
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Called after an error has been thrown.
   * Used for side effects like logging.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
  }

  /**
   * Reset the error state when resetKey changes.
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.hasError &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  /**
   * Reset the error state.
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback: FallbackComponent } = this.props;

    if (hasError && error) {
      const Fallback = FallbackComponent || DefaultErrorFallback;
      return createElement(Fallback, {
        error,
        errorInfo: errorInfo || undefined,
        resetError: this.resetError,
      });
    }

    return children;
  }
}

/**
 * Create an error boundary wrapper with preconfigured options.
 */
export function createErrorBoundary(
  defaultOptions: Partial<ErrorBoundaryProps> = {}
): ComponentType<ErrorBoundaryProps> {
  return function ConfiguredErrorBoundary(props: ErrorBoundaryProps) {
    return createElement(ErrorBoundary, {
      ...defaultOptions,
      ...props,
    });
  };
}

/**
 * Higher-order component that wraps a component with an error boundary.
 */
export function withErrorBoundary<P extends Record<string, unknown>>(
  WrappedComponent: ComponentType<P>,
  options: Omit<ErrorBoundaryProps, 'children'> = {}
): ComponentType<P> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WithErrorBoundary(props: P): ReactNode {
    return createElement(
      ErrorBoundary,
      options,
      createElement(WrappedComponent, props)
    );
  }

  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}
