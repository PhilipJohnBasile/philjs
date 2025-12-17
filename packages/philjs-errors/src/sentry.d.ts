/**
 * PhilJS Sentry Integration
 *
 * Full Sentry integration with error tracking, performance monitoring,
 * and session replay support.
 */
import type { ErrorTracker, TrackerOptions } from './index';
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
/**
 * Create a Sentry error tracker
 */
export declare function createSentryTracker(): ErrorTracker;
/**
 * PhilJS-specific Sentry utilities
 */
/** Track signal value changes */
export declare function trackSignalWithSentry<T>(name: string, getValue: () => T, setValue: (v: T) => void): {
    get: () => T;
    set: (value: T) => void;
};
/** Track component renders */
export declare function trackComponentWithSentry(componentName: string): {
    onMount(): void;
    onUnmount(): void;
    onError(error: Error): void;
};
/** Track route changes */
export declare function trackRouteWithSentry(from: string, to: string): void;
/** Create Sentry feedback widget */
export declare function showSentryFeedback(): void;
export default createSentryTracker;
//# sourceMappingURL=sentry.d.ts.map