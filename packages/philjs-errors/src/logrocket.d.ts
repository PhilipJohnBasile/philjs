/**
 * PhilJS LogRocket Integration
 *
 * Session replay and error tracking with LogRocket.
 */
import type { ErrorTracker, TrackerOptions } from './index';
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
/**
 * Create a LogRocket error tracker
 */
export declare function createLogRocketTracker(): ErrorTracker;
/**
 * Get LogRocket session URL
 */
export declare function getSessionURL(): Promise<string | null>;
/**
 * Track custom event
 */
export declare function trackEvent(name: string, properties?: Record<string, unknown>): void;
/**
 * Redact sensitive data
 */
export declare function redact(selector: string): void;
export default createLogRocketTracker;
//# sourceMappingURL=logrocket.d.ts.map