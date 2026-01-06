/**
 * PhilJS Rollbar Integration
 */

import type {
  ErrorTracker,
  TrackerOptions,
  ErrorContext,
  UserContext,
  Breadcrumb,
  Span,
} from './index.js';

export interface RollbarOptions extends TrackerOptions {
  /** Access token (replaces dsn) */
  accessToken: string;
  /** Capture uncaught errors */
  captureUncaught?: boolean;
  /** Capture unhandled rejections */
  captureUnhandledRejections?: boolean;
  /** Payload options */
  payload?: {
    client?: Record<string, unknown>;
    server?: Record<string, unknown>;
  };
}

let Rollbar: any = null;

export function createRollbarTracker(): ErrorTracker {
  return {
    init(options: RollbarOptions) {
      const initRollbar = async () => {
        if (typeof window !== 'undefined') {
          const RollbarLib = (await import('rollbar')).default;

          Rollbar = new RollbarLib({
            accessToken: options.accessToken || options.dsn,
            environment: options.environment || 'production',
            captureUncaught: options.captureUncaught ?? true,
            captureUnhandledRejections: options.captureUnhandledRejections ?? true,
            payload: {
              client: {
                javascript: {
                  code_version: options.release,
                  source_map_enabled: true,
                },
                ...options.payload?.client,
              },
              ...options.payload,
            },
          });

        }
      };

      initRollbar().catch(console.error);
    },

    captureError(error: Error, context?: ErrorContext) {
      if (!Rollbar) {
        console.error('[Rollbar not initialized]', error);
        return;
      }

      Rollbar.error(error, {
        component: context?.component,
        signal: context?.signal,
        route: context?.route,
        ...context?.tags,
        ...context?.extra,
      });
    },

    captureMessage(message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext) {
      if (!Rollbar) {
        console.log('[Rollbar not initialized]', message);
        return;
      }

      const rollbarLevel = level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info';
      Rollbar[rollbarLevel](message, context?.extra);
    },

    setUser(user: UserContext | null) {
      if (!Rollbar) return;

      if (user) {
        Rollbar.configure({
          payload: {
            person: {
              id: user.id,
              email: user.email,
              username: user.username,
            },
          },
        });
      }
    },

    addBreadcrumb(breadcrumb: Breadcrumb) {
      // Rollbar uses telemetry for breadcrumbs
      if (Rollbar) {
        Rollbar.log(breadcrumb.message || 'breadcrumb', breadcrumb.data);
      }
    },

    startSpan(name: string, op: string): Span {
      const start = performance.now();
      return {
        name,
        op,
        finish() {
          if (Rollbar) {
            Rollbar.debug(`Span: ${name}`, {
              operation: op,
              duration: performance.now() - start,
            });
          }
        },
        setTag() {},
        setData() {},
      };
    },

    async flush(): Promise<boolean> {
      return true;
    },
  };
}

export default createRollbarTracker;
