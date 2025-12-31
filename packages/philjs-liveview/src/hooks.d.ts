/**
 * PhilJS LiveView - Client Hooks
 *
 * Hooks provide client-side JavaScript interop for LiveView elements.
 * They're triggered by lifecycle events on elements with phx-hook attribute.
 */
import type { HookDefinition, Hooks, ClientHook } from './types.js';
/**
 * Register hooks globally
 */
export declare function registerHooks(hooks: Hooks): void;
/**
 * Get a registered hook
 */
export declare function getHook(name: string): HookDefinition | undefined;
/**
 * Get all registered hooks
 */
export declare function getAllHooks(): Hooks;
/**
 * Mount a hook on an element
 */
export declare function mountHook(element: HTMLElement, hookName: string, context: {
    pushEvent: (event: string, payload: any, target?: string) => void;
    pushEventTo: (selector: string, event: string, payload: any) => void;
    handleEvent: (event: string, callback: (payload: any) => void) => void;
    upload: (name: string, files: FileList) => void;
}): void;
/**
 * Update a hook (call beforeUpdate and updated)
 */
export declare function updateHook(element: HTMLElement): void;
/**
 * Destroy a hook
 */
export declare function destroyHook(element: HTMLElement): void;
/**
 * Notify hooks of disconnection
 */
export declare function disconnectHooks(): void;
/**
 * Notify hooks of reconnection
 */
export declare function reconnectHooks(): void;
/**
 * Infinite scroll hook
 */
export declare const InfiniteScroll: HookDefinition;
/**
 * Focus hook - focuses element on mount/update
 */
export declare const Focus: HookDefinition;
/**
 * Clipboard hook - copy to clipboard
 */
export declare const Clipboard: HookDefinition;
/**
 * Local time hook - converts UTC to local time
 */
export declare const LocalTime: HookDefinition;
/**
 * Sortable hook - drag and drop sorting
 */
export declare const Sortable: HookDefinition;
/**
 * Debounce hook - adds debounce to any element
 */
export declare const Debounce: HookDefinition;
/**
 * Countdown hook - countdown timer
 */
export declare const Countdown: HookDefinition;
export type { HookDefinition, Hooks, ClientHook };
//# sourceMappingURL=hooks.d.ts.map