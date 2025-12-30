/**
 * Error Tracking Integration
 *
 * Comprehensive error tracking and monitoring:
 * - Automatic error capture
 * - Integration with Sentry, Bugsnag, Rollbar, etc.
 * - Custom error boundaries
 * - Source map support
 * - User context and breadcrumbs
 * - Performance impact tracking
 */

import { signal, type Signal } from './signals.js';

// ============================================================================
// Types
// ============================================================================

export interface ErrorTrackingOptions {
  /**
   * Enable error tracking
   */
  enabled?: boolean;

  /**
   * Error tracking service
   */
  service?: 'sentry' | 'bugsnag' | 'rollbar' | 'custom';

  /**
   * DSN/API key for the service
   */
  dsn?: string;

  /**
   * Environment (development, staging, production)
   */
  environment?: string;

  /**
   * Release/version
   */
  release?: string;

  /**
   * Sample rate (0-1)
   */
  sampleRate?: number;

  /**
   * Ignore errors matching these patterns
   */
  ignoreErrors?: (string | RegExp)[];

  /**
   * Allow URLs for source maps
   */
  allowUrls?: string[];

  /**
   * Before send hook
   */
  beforeSend?: (error: ErrorEvent) => ErrorEvent | null;

  /**
   * Custom error handler
   */
  onError?: (error: ErrorEvent) => void;

  /**
   * Enable breadcrumbs
   */
  breadcrumbs?: boolean;

  /**
   * Max breadcrumbs
   */
  maxBreadcrumbs?: number;
}

export interface ErrorEvent {
  /**
   * Error message
   */
  message: string;

  /**
   * Error stack trace
   */
  stack?: string;

  /**
   * Error type
   */
  type: string;

  /**
   * Timestamp
   */
  timestamp: number;

  /**
   * User context
   */
  user?: UserContext;

  /**
   * Tags
   */
  tags?: Record<string, string>;

  /**
   * Extra data
   */
  extra?: Record<string, any>;

  /**
   * Breadcrumbs
   */
  breadcrumbs?: Breadcrumb[];

  /**
   * Request context
   */
  request?: RequestContext;

  /**
   * Component stack
   */
  componentStack?: string;

  /**
   * Error level
   */
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  ipAddress?: string;
  [key: string]: any;
}

export interface Breadcrumb {
  type: 'navigation' | 'http' | 'console' | 'user' | 'error' | 'default';
  category: string;
  message: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  timestamp: number;
  data?: Record<string, any>;
}

export interface RequestContext {
  url: string;
  method: string;
  headers?: Record<string, string>;
  data?: any;
}

export interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
  recent: ErrorEvent[];
}

// ============================================================================
// Error Tracker
// ============================================================================

export class ErrorTracker {
  private options: ErrorTrackingOptions;
  private breadcrumbs: Breadcrumb[] = [];
  private user: UserContext | null = null;
  private tags: Map<string, string> = new Map();
  private context: Map<string, any> = new Map();
  private errors: ErrorEvent[] = [];

  public errorCount = signal(0);
  public lastError = signal<ErrorEvent | null>(null);

  constructor(options: ErrorTrackingOptions = {}) {
    this.options = {
      enabled: true,
      breadcrumbs: true,
      maxBreadcrumbs: 100,
      sampleRate: 1.0,
      environment: 'production',
      ignoreErrors: [],
      ...options,
    };

    if (this.options.enabled) {
      this.init();
    }
  }

  /**
   * Initialize error tracking
   */
  private init(): void {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        type: 'uncaught',
        message: event.message,
        stack: event.error?.stack,
      });
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandledrejection',
        message: String(event.reason),
      });
    });

    // Initialize service integration
    this.initService();
  }

  /**
   * Initialize error tracking service
   */
  private initService(): void {
    const { service, dsn } = this.options;

    if (!service || !dsn) return;

    switch (service) {
      case 'sentry':
        this.initSentry();
        break;
      case 'bugsnag':
        this.initBugsnag();
        break;
      case 'rollbar':
        this.initRollbar();
        break;
    }
  }

  /**
   * Initialize Sentry
   */
  private initSentry(): void {
    if (typeof window === 'undefined' || !(window as any).Sentry) return;

    const Sentry = (window as any).Sentry;

    Sentry.init({
      dsn: this.options.dsn,
      environment: this.options.environment,
      release: this.options.release,
      sampleRate: this.options.sampleRate,
      ignoreErrors: this.options.ignoreErrors,
      beforeSend: this.options.beforeSend as any,
    });
  }

  /**
   * Initialize Bugsnag
   */
  private initBugsnag(): void {
    if (typeof window === 'undefined' || !(window as any).Bugsnag) return;

    const Bugsnag = (window as any).Bugsnag;

    Bugsnag.start({
      apiKey: this.options.dsn,
      releaseStage: this.options.environment,
      appVersion: this.options.release,
    });
  }

  /**
   * Initialize Rollbar
   */
  private initRollbar(): void {
    if (typeof window === 'undefined' || !(window as any).Rollbar) return;

    const Rollbar = (window as any).Rollbar;

    Rollbar.init({
      accessToken: this.options.dsn,
      captureUncaught: true,
      captureUnhandledRejections: true,
      payload: {
        environment: this.options.environment,
        client: {
          javascript: {
            code_version: this.options.release,
          },
        },
      },
    });
  }

  /**
   * Capture error
   */
  public captureError(
    error: Error | string,
    context?: Partial<ErrorEvent>
  ): void {
    // Sample check
    if (Math.random() > (this.options.sampleRate || 1)) {
      return;
    }

    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Check ignore patterns
    if (this.shouldIgnore(errorObj.message)) {
      return;
    }

    const errorEvent: ErrorEvent = {
      message: errorObj.message,
      ...(errorObj.stack != null && { stack: errorObj.stack }),
      type: context?.type || 'Error',
      timestamp: Date.now(),
      tags: Object.fromEntries(this.tags),
      extra: Object.fromEntries(this.context),
      breadcrumbs: this.breadcrumbs.slice(-20),
      level: context?.level || 'error',
      ...(this.user != null && { user: this.user }),
      ...(context?.user != null && { user: context.user }),
      ...(context?.request != null && { request: context.request }),
      ...(context?.componentStack != null && { componentStack: context.componentStack }),
    };

    // Before send hook
    if (this.options.beforeSend) {
      const modified = this.options.beforeSend(errorEvent);
      if (!modified) return;
      Object.assign(errorEvent, modified);
    }

    // Store error
    this.errors.push(errorEvent);
    if (this.errors.length > 100) {
      this.errors.shift();
    }

    // Update signals
    this.errorCount.set(this.errorCount() + 1);
    this.lastError.set(errorEvent);

    // Send to service
    this.sendToService(errorEvent);

    // Call custom handler
    if (this.options.onError) {
      this.options.onError(errorEvent);
    }
  }

  /**
   * Capture exception
   */
  public captureException(error: Error, context?: Partial<ErrorEvent>): void {
    this.captureError(error, { ...context, level: 'error' });
  }

  /**
   * Capture message
   */
  public captureMessage(
    message: string,
    level: ErrorEvent['level'] = 'info',
    context?: Partial<ErrorEvent>
  ): void {
    this.captureError(message, { ...context, level });
  }

  /**
   * Add breadcrumb
   */
  public addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    if (!this.options.breadcrumbs) return;

    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Limit breadcrumbs
    if (this.breadcrumbs.length > (this.options.maxBreadcrumbs || 100)) {
      this.breadcrumbs.shift();
    }

    // Send to service
    if (this.options.service === 'sentry' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb(fullBreadcrumb);
    }
  }

  /**
   * Set user context
   */
  public setUser(user: UserContext | null): void {
    this.user = user;

    if (this.options.service === 'sentry' && (window as any).Sentry) {
      (window as any).Sentry.setUser(user);
    }

    if (this.options.service === 'bugsnag' && (window as any).Bugsnag) {
      (window as any).Bugsnag.setUser(user?.id, user?.email, user?.username);
    }
  }

  /**
   * Set tag
   */
  public setTag(key: string, value: string): void {
    this.tags.set(key, value);

    if (this.options.service === 'sentry' && (window as any).Sentry) {
      (window as any).Sentry.setTag(key, value);
    }
  }

  /**
   * Set context
   */
  public setContext(key: string, value: any): void {
    this.context.set(key, value);

    if (this.options.service === 'sentry' && (window as any).Sentry) {
      (window as any).Sentry.setContext(key, value);
    }
  }

  /**
   * Check if error should be ignored
   */
  private shouldIgnore(message: string): boolean {
    const { ignoreErrors = [] } = this.options;

    return ignoreErrors.some(pattern => {
      if (typeof pattern === 'string') {
        return message.includes(pattern);
      }
      return pattern.test(message);
    });
  }

  /**
   * Send error to service
   */
  private sendToService(errorEvent: ErrorEvent): void {
    const { service } = this.options;

    if (!service) return;

    try {
      switch (service) {
        case 'sentry':
          if ((window as any).Sentry) {
            (window as any).Sentry.captureException(new Error(errorEvent.message), {
              level: errorEvent.level,
              tags: errorEvent.tags,
              extra: errorEvent.extra,
            });
          }
          break;

        case 'bugsnag':
          if ((window as any).Bugsnag) {
            (window as any).Bugsnag.notify(new Error(errorEvent.message), (event: any) => {
              event.severity = errorEvent.level;
              event.addMetadata('custom', errorEvent.extra);
            });
          }
          break;

        case 'rollbar':
          if ((window as any).Rollbar) {
            (window as any).Rollbar[errorEvent.level](errorEvent.message, {
              ...errorEvent.extra,
              tags: errorEvent.tags,
            });
          }
          break;
      }
    } catch (error) {
      console.error('[Error Tracking] Failed to send error:', error);
    }
  }

  /**
   * Get error statistics
   */
  public getStats(): ErrorStats {
    const byType: Record<string, number> = {};
    const byLevel: Record<string, number> = {};

    for (const error of this.errors) {
      byType[error.type] = (byType[error.type] || 0) + 1;
      byLevel[error.level] = (byLevel[error.level] || 0) + 1;
    }

    return {
      total: this.errors.length,
      byType,
      byLevel,
      recent: this.errors.slice(-10),
    };
  }

  /**
   * Get all errors
   */
  public getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  /**
   * Clear errors
   */
  public clear(): void {
    this.errors.length = 0;
    this.breadcrumbs.length = 0;
    this.errorCount.set(0);
    this.lastError.set(null);
  }
}

// ============================================================================
// Global Instance
// ============================================================================

let globalTracker: ErrorTracker | null = null;

/**
 * Initialize error tracking
 */
export function initErrorTracking(options: ErrorTrackingOptions = {}): ErrorTracker {
  if (!globalTracker) {
    globalTracker = new ErrorTracker(options);
  }
  return globalTracker;
}

/**
 * Get error tracker
 */
export function getErrorTracker(): ErrorTracker {
  if (!globalTracker) {
    globalTracker = initErrorTracking();
  }
  return globalTracker;
}

// ============================================================================
// High-Level API
// ============================================================================

/**
 * Capture error
 */
export function captureError(error: Error | string, context?: Partial<ErrorEvent>): void {
  getErrorTracker().captureError(error, context);
}

/**
 * Capture exception
 */
export function captureException(error: Error, context?: Partial<ErrorEvent>): void {
  getErrorTracker().captureException(error, context);
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level?: ErrorEvent['level'],
  context?: Partial<ErrorEvent>
): void {
  getErrorTracker().captureMessage(message, level, context);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  getErrorTracker().addBreadcrumb(breadcrumb);
}

/**
 * Set user context
 */
export function setUser(user: UserContext | null): void {
  getErrorTracker().setUser(user);
}

/**
 * Set tag
 */
export function setTag(key: string, value: string): void {
  getErrorTracker().setTag(key, value);
}

/**
 * Set context
 */
export function setContext(key: string, value: any): void {
  getErrorTracker().setContext(key, value);
}

/**
 * Get error statistics
 */
export function getErrorStats(): ErrorStats {
  return getErrorTracker().getStats();
}

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => any>(
  fn: T,
  context?: Partial<ErrorEvent>
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error as Error, context);
      throw error;
    }
  }) as T;
}

/**
 * Error boundary hook
 */
export function useErrorBoundary(componentName: string) {
  return {
    onError: (error: Error, errorInfo: any) => {
      captureException(error, {
        componentStack: errorInfo.componentStack,
        tags: { component: componentName },
      });
    },
  };
}
