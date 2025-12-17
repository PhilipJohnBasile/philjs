/**
 * PhilJS Sentry Integration
 *
 * Full Sentry integration with error tracking, performance monitoring,
 * and session replay support.
 */

import type {
  ErrorTracker,
  TrackerOptions,
  ErrorContext,
  UserContext,
  Breadcrumb,
  Span,
  ErrorEvent,
} from './index';

export interface SentryOptions extends TrackerOptions {
  /** Enable performance monitoring */
  tracing?: boolean;
  /** Traces sample rate (0-1) */
  tracesSampleRate?: number;
  /** Enable session replay */
  replays?: boolean;
  /** Replays sample rate (0-1) */
  replaysSessionSampleRate?: number;
  /** Replays error sample rate (0-1) */
  replaysOnErrorSampleRate?: number;
  /** Enable profiling */
  profiling?: boolean;
  /** Profiles sample rate (0-1) */
  profilesSampleRate?: number;
  /** Integrations to include */
  integrations?: string[];
}

let Sentry: any = null;

/**
 * Create a Sentry error tracker
 */
export function createSentryTracker(): ErrorTracker {
  let currentTransaction: any = null;

  return {
    init(options: SentryOptions) {
      // Dynamic import to avoid bundling if not used
      const initSentry = async () => {
        if (typeof window !== 'undefined') {
          Sentry = await import('@sentry/browser');

          const integrations: any[] = [];

          // Add tracing integration
          if (options.tracing) {
            const { BrowserTracing } = await import('@sentry/browser');
            integrations.push(new BrowserTracing());
          }

          // Add replay integration
          if (options.replays) {
            const { Replay } = await import('@sentry/browser');
            integrations.push(new Replay());
          }

          Sentry.init({
            dsn: options.dsn,
            environment: options.environment || 'production',
            release: options.release,
            debug: options.debug || false,
            sampleRate: options.sampleRate ?? 1.0,
            tracesSampleRate: options.tracesSampleRate ?? 0.1,
            replaysSessionSampleRate: options.replaysSessionSampleRate ?? 0.1,
            replaysOnErrorSampleRate: options.replaysOnErrorSampleRate ?? 1.0,
            profilesSampleRate: options.profilesSampleRate ?? 0.1,
            integrations,
            ignoreErrors: options.ignoreErrors,
            beforeSend(event: any) {
              if (options.beforeSend) {
                const result = options.beforeSend({
                  message: event.message,
                  error: event.exception?.values?.[0]?.value,
                  timestamp: Date.now(),
                  level: event.level,
                });
                return result ? event : null;
              }
              return event;
            },
          });

          // Add PhilJS-specific context
          Sentry.setTag('framework', 'philjs');
          Sentry.setContext('philjs', {
            version: '0.1.0',
          });

          console.log('[PhilJS] Sentry initialized');
        }
      };

      initSentry().catch(console.error);
    },

    captureError(error: Error, context?: ErrorContext) {
      if (!Sentry) {
        console.error('[Sentry not initialized]', error);
        return;
      }

      Sentry.withScope((scope: any) => {
        if (context?.component) {
          scope.setTag('component', context.component);
        }
        if (context?.signal) {
          scope.setTag('signal', context.signal);
        }
        if (context?.route) {
          scope.setTag('route', context.route);
        }
        if (context?.userId) {
          scope.setUser({ id: context.userId });
        }
        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }
        if (context?.extra) {
          scope.setExtras(context.extra);
        }

        Sentry.captureException(error);
      });
    },

    captureMessage(message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext) {
      if (!Sentry) {
        console.log('[Sentry not initialized]', message);
        return;
      }

      Sentry.withScope((scope: any) => {
        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }
        if (context?.extra) {
          scope.setExtras(context.extra);
        }

        Sentry.captureMessage(message, level || 'info');
      });
    },

    setUser(user: UserContext | null) {
      if (!Sentry) return;

      if (user) {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.username,
          ...user,
        });
      } else {
        Sentry.setUser(null);
      }
    },

    addBreadcrumb(breadcrumb: Breadcrumb) {
      if (!Sentry) return;

      Sentry.addBreadcrumb({
        type: breadcrumb.type,
        category: breadcrumb.category,
        message: breadcrumb.message,
        data: breadcrumb.data,
        level: breadcrumb.level,
        timestamp: breadcrumb.timestamp || Date.now() / 1000,
      });
    },

    startSpan(name: string, op: string): Span {
      if (!Sentry) {
        return createFallbackSpan(name, op);
      }

      const transaction = Sentry.startTransaction({
        name,
        op,
      });

      currentTransaction = transaction;

      return {
        name,
        op,
        finish() {
          transaction.finish();
          if (currentTransaction === transaction) {
            currentTransaction = null;
          }
        },
        setTag(key: string, value: string) {
          transaction.setTag(key, value);
        },
        setData(key: string, value: unknown) {
          transaction.setData(key, value);
        },
      };
    },

    async flush(timeout?: number): Promise<boolean> {
      if (!Sentry) return true;
      return Sentry.flush(timeout);
    },
  };
}

function createFallbackSpan(name: string, op: string): Span {
  const start = performance.now();
  return {
    name,
    op,
    finish() {
      console.log(`[Span] ${name}: ${(performance.now() - start).toFixed(2)}ms`);
    },
    setTag() {},
    setData() {},
  };
}

/**
 * PhilJS-specific Sentry utilities
 */

/** Track signal value changes */
export function trackSignalWithSentry<T>(
  name: string,
  getValue: () => T,
  setValue: (v: T) => void
) {
  return {
    get: () => {
      try {
        return getValue();
      } catch (error) {
        if (Sentry) {
          Sentry.captureException(error, {
            tags: { type: 'signal-read', signal: name },
          });
        }
        throw error;
      }
    },
    set: (value: T) => {
      try {
        setValue(value);
        if (Sentry) {
          Sentry.addBreadcrumb({
            category: 'signal',
            message: `Signal "${name}" updated`,
            data: { value },
            level: 'info',
          });
        }
      } catch (error) {
        if (Sentry) {
          Sentry.captureException(error, {
            tags: { type: 'signal-write', signal: name },
          });
        }
        throw error;
      }
    },
  };
}

/** Track component renders */
export function trackComponentWithSentry(componentName: string) {
  return {
    onMount() {
      if (Sentry) {
        Sentry.addBreadcrumb({
          category: 'component',
          message: `Component "${componentName}" mounted`,
          level: 'info',
        });
      }
    },
    onUnmount() {
      if (Sentry) {
        Sentry.addBreadcrumb({
          category: 'component',
          message: `Component "${componentName}" unmounted`,
          level: 'info',
        });
      }
    },
    onError(error: Error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: { component: componentName },
        });
      }
    },
  };
}

/** Track route changes */
export function trackRouteWithSentry(from: string, to: string) {
  if (Sentry) {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated from "${from}" to "${to}"`,
      level: 'info',
    });
  }
}

/** Create Sentry feedback widget */
export function showSentryFeedback() {
  if (Sentry?.showReportDialog) {
    Sentry.showReportDialog();
  }
}

export default createSentryTracker;
