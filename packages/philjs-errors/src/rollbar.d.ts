/**
 * PhilJS Rollbar Integration
 */
import type { ErrorTracker, TrackerOptions } from './index';
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
export declare function createRollbarTracker(): ErrorTracker;
export default createRollbarTracker;
//# sourceMappingURL=rollbar.d.ts.map