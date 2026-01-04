/**
 * PhilJS LiveView - Core LiveView Implementation
 */
import type { LiveViewDefinition, LiveViewState, LiveViewEvent, LiveViewParams, LiveSocket, ViewPatch } from './types.js';
/**
 * Create a new LiveView
 *
 * @example
 * ```typescript
 * const CounterView = createLiveView({
 *   mount: () => ({ count: 0 }),
 *
 *   handleEvent: (event, state) => {
 *     if (event.type === 'increment') {
 *       return { count: state.count + 1 };
 *     }
 *     return state;
 *   },
 *
 *   render: (state) => `
 *     <div>
 *       <span>Count: ${state.count}</span>
 *       <button phx-click="increment">+</button>
 *     </div>
 *   `,
 * });
 * ```
 */
export declare function createLiveView<S extends LiveViewState = LiveViewState>(definition: LiveViewDefinition<S>): LiveViewDefinition<S>;
export interface LiveViewInstance<S extends LiveViewState = LiveViewState> {
    /** Current state */
    state: S;
    /** Rendered HTML */
    html: string;
    /** Socket reference */
    socket: LiveSocket;
    /** Handle an event */
    handleEvent(event: LiveViewEvent): Promise<ViewPatch>;
    /** Handle an info message */
    handleInfo(info: any): Promise<ViewPatch>;
    /** Handle params change */
    handleParams(params: LiveViewParams, uri: string): Promise<ViewPatch>;
    /** Re-render the view */
    render(): string;
    /** Get the current diff from previous render */
    getDiff(): ViewPatch;
    /** Terminate the view */
    terminate(reason: string): void;
}
/**
 * Create a LiveView instance for a connected socket
 */
export declare function mountLiveView<S extends LiveViewState>(definition: LiveViewDefinition<S>, socket: LiveSocket): Promise<LiveViewInstance<S>>;
/**
 * Create a socket implementation
 */
export declare function createLiveSocket(id: string, initialState: LiveViewState, options: {
    session?: Record<string, any>;
    params?: LiveViewParams;
    clientId: string;
    onPush?: (event: string, payload: any) => void;
    onRedirect?: (to: string, replace: boolean) => void;
    onPatch?: (to: string, replace: boolean) => void;
}): LiveSocket;
/**
 * Extract PHX attributes from HTML
 */
export declare function extractPhxBindings(html: string): Map<string, PhxBinding[]>;
interface PhxBinding {
    type: string;
    modifiers: string[];
    value: string;
    raw: string;
}
/**
 * HTML template tag for syntax highlighting and escaping
 */
export declare function html(strings: TemplateStringsArray, ...values: any[]): string;
/**
 * Raw HTML (no escaping)
 */
export declare function raw(value: string): RawHtml;
declare class RawHtml {
    value: string;
    constructor(value: string);
    toString(): string;
}
/**
 * Conditionally render content
 */
export declare function when<T>(condition: boolean, content: T): T | '';
/**
 * Render a list with a template
 */
export declare function each<T>(items: T[], keyFn: (item: T, index: number) => string, template: (item: T, index: number) => string): string;
/**
 * Generate form input with phx bindings
 */
export declare function input(name: string, options?: {
    type?: string;
    value?: any;
    phxChange?: boolean;
    phxBlur?: boolean;
    phxDebounce?: number;
    class?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    [key: string]: any;
}): string;
/**
 * Render validation errors for a field
 */
export declare function errorTag(errors: Record<string, string[]>, field: string): string;
export {};
//# sourceMappingURL=live-view.d.ts.map