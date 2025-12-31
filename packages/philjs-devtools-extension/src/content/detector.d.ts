/**
 * PhilJS Detector Script
 *
 * Injected into every page to detect PhilJS and set up communication.
 */
export {};
declare global {
    interface Window {
        __PHILJS_DEVTOOLS__?: {
            signals: Map<string, unknown>;
            components: Map<string, unknown>;
            subscribe: (callback: () => void) => () => void;
        };
    }
}
//# sourceMappingURL=detector.d.ts.map