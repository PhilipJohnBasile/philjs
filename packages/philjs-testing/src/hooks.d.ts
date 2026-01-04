/**
 * PhilJS Testing - Hook Testing Utilities
 */
export interface HookResult<T> {
    result: {
        current: T;
    };
    rerender: (newProps?: any) => void;
    unmount: () => void;
    waitForNextUpdate: () => Promise<void>;
}
interface RenderHookOptions<P> {
    initialProps?: P;
    wrapper?: (props: {
        children: any;
    }) => any;
}
/**
 * Render a hook for testing
 */
export declare function renderHook<T, P = unknown>(callback: (props: P) => T, options?: RenderHookOptions<P>): HookResult<T>;
/**
 * Run code that triggers state updates inside act()
 */
export declare function act(callback: () => void | Promise<void>): Promise<void>;
/**
 * Cleanup all mounted hooks
 */
export declare function cleanupHooks(): void;
export {};
//# sourceMappingURL=hooks.d.ts.map