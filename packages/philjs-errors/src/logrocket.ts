/**
 * PhilJS LogRocket Integration
 *
 * Session replay and error tracking with LogRocket.
 */

import type {
  ErrorTracker,
  TrackerOptions,
  ErrorContext,
  UserContext,
  Breadcrumb,
  Span,
} from './index';

export interface LogRocketOptions extends TrackerOptions {
  /** App ID (replaces dsn) */
  appId: string;
  /** Upload interval in ms */
  uploadInterval?: number;
  /** Network sanitization */
  network?: {
    requestSanitizer?: (request: any) => any;
    responseSanitizer?: (response: any) => any;
  };
  /** DOM sanitization */
  dom?: {
    inputSanitizer?: boolean;
    textSanitizer?: (text: string) => string;
  };
  /** Console logging */
  console?: {
    isEnabled?: boolean;
    shouldAggregateConsoleErrors?: boolean;
  };
}

let LogRocket: any = null;

/**
 * Create a LogRocket error tracker
 */
export function createLogRocketTracker(): ErrorTracker {
  return {
    init(options: LogRocketOptions) {
      const initLogRocket = async () => {
        if (typeof window !== 'undefined') {
          LogRocket = (await import('logrocket')).default;

          LogRocket.init(options.appId || options.dsn, {
            release: options.release,
            console: {
              isEnabled: options.console?.isEnabled ?? true,
              shouldAggregateConsoleErrors: options.console?.shouldAggregateConsoleErrors ?? true,
            },
            network: {
              requestSanitizer: options.network?.requestSanitizer,
              responseSanitizer: options.network?.responseSanitizer,
            },
            dom: {
              inputSanitizer: options.dom?.inputSanitizer ?? true,
              textSanitizer: options.dom?.textSanitizer,
            },
          });

          // Add PhilJS context
          LogRocket.track('PhilJS Initialized', {
            version: '0.1.0',
            environment: options.environment,
          });

          console.log('[PhilJS] LogRocket initialized');
        }
      };

      initLogRocket().catch(console.error);
    },

    captureError(error: Error, context?: ErrorContext) {
      if (!LogRocket) {
        console.error('[LogRocket not initialized]', error);
        return;
      }

      LogRocket.captureException(error, {
        tags: {
          component: context?.component,
          signal: context?.signal,
          route: context?.route,
          ...context?.tags,
        },
        extra: context?.extra,
      });
    },

    captureMessage(message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext) {
      if (!LogRocket) {
        console.log('[LogRocket not initialized]', message);
        return;
      }

      LogRocket.track(message, {
        level: level || 'info',
        ...context?.extra,
        ...context?.tags,
      });
    },

    setUser(user: UserContext | null) {
      if (!LogRocket) return;

      if (user) {
        LogRocket.identify(user.id || 'anonymous', {
          email: user.email,
          name: user.username,
          ...user,
        });
      }
    },

    addBreadcrumb(breadcrumb: Breadcrumb) {
      if (!LogRocket) return;

      LogRocket.track(breadcrumb.message || breadcrumb.category || 'breadcrumb', {
        type: breadcrumb.type,
        category: breadcrumb.category,
        level: breadcrumb.level,
        ...breadcrumb.data,
      });
    },

    startSpan(name: string, op: string): Span {
      const start = performance.now();

      return {
        name,
        op,
        finish() {
          if (LogRocket) {
            LogRocket.track(`${op}:${name}`, {
              duration: performance.now() - start,
            });
          }
        },
        setTag(key: string, value: string) {
          // LogRocket doesn't have span tags, track as event
        },
        setData(key: string, value: unknown) {
          // LogRocket doesn't have span data, track as event
        },
      };
    },

    async flush(): Promise<boolean> {
      // LogRocket auto-flushes
      return true;
    },
  };
}

/**
 * Get LogRocket session URL
 */
export function getSessionURL(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!LogRocket) {
      resolve(null);
      return;
    }

    LogRocket.getSessionURL((url: string) => {
      resolve(url);
    });
  });
}

/**
 * Track custom event
 */
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (LogRocket) {
    LogRocket.track(name, properties);
  }
}

/**
 * Redact sensitive data
 */
export function redact(selector: string) {
  if (LogRocket) {
    LogRocket.redactElement(selector);
  }
}

export default createLogRocketTracker;
