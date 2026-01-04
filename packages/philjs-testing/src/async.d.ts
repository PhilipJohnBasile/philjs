/**
 * PhilJS Testing - Async Utilities
 */
export interface WaitForOptions {
    timeout?: number;
    interval?: number;
    onTimeout?: (error: Error) => Error;
}
/**
 * Wait for a condition to be true
 */
export declare function waitFor<T>(callback: () => T | Promise<T>, options?: WaitForOptions): Promise<T>;
/**
 * Wait for an element to be removed from the DOM
 */
export declare function waitForElementToBeRemoved<T extends Element>(callback: (() => T | T[] | null) | T | T[], options?: WaitForOptions): Promise<void>;
/**
 * Find element by role (async)
 */
export declare function findByRole(container: HTMLElement, role: string, options?: {
    name?: string | RegExp;
    timeout?: number;
}): Promise<HTMLElement>;
/**
 * Find element by text (async)
 */
export declare function findByText(container: HTMLElement, text: string | RegExp, options?: {
    exact?: boolean;
    timeout?: number;
}): Promise<HTMLElement>;
/**
 * Wait for loading to finish
 */
export declare function waitForLoadingToFinish(container?: HTMLElement, options?: {
    timeout?: number;
}): Promise<void>;
/**
 * Wait for network requests to settle
 */
export declare function waitForNetworkIdle(options?: {
    timeout?: number;
    idleTime?: number;
}): Promise<void>;
/**
 * Delay execution
 */
export declare function delay(ms: number): Promise<void>;
//# sourceMappingURL=async.d.ts.map