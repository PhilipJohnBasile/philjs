/**
 * Island - Core island implementation using Web Components
 */
import type { IslandConfig, HydrationStrategy } from './types.js';
/**
 * PhilJS Island Web Component
 * Custom element that provides selective hydration
 */
export declare class Island extends HTMLElement {
    private _instance;
    private _observer;
    private _idleCallback;
    private _mediaQuery;
    private _boundInteractionHandler;
    static get observedAttributes(): string[];
    get name(): string;
    get strategy(): HydrationStrategy;
    get props(): Record<string, unknown>;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
    private _createInstance;
    private _setupHydrationTrigger;
    private _setupVisibleTrigger;
    private _setupIdleTrigger;
    private _setupInteractionTrigger;
    private _setupMediaTrigger;
    private _removeInteractionListeners;
    private _cleanup;
}
/**
 * Define an island component
 */
export declare function defineIsland(config: IslandConfig): void;
/**
 * Create an island element programmatically
 */
export declare function createIsland(name: string, props?: Record<string, unknown>, strategy?: HydrationStrategy): Island;
//# sourceMappingURL=island.d.ts.map