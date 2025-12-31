/**
 * PhilJS Rocket Fairing
 *
 * Rocket fairings for PhilJS integration.
 * Fairings are Rocket's middleware equivalent, providing hooks into
 * the request/response lifecycle.
 */
import type { FairingContext, FairingResponse, FairingHooks } from './types.js';
/**
 * Base fairing class for PhilJS Rocket integration
 */
export declare abstract class PhilJsFairing {
    /** Fairing name */
    abstract readonly name: string;
    /** Called on rocket ignite */
    onIgnite?(): void | Promise<void>;
    /** Called on rocket liftoff */
    onLiftoff?(): void | Promise<void>;
    /** Called on request */
    onRequest?(ctx: FairingContext): FairingResponse | void | Promise<FairingResponse | void>;
    /** Called on response */
    onResponse?(ctx: FairingContext, status: number): FairingResponse | void | Promise<FairingResponse | void>;
    /** Called on shutdown */
    onShutdown?(): void | Promise<void>;
    /**
     * Generate Rust trait implementation
     */
    abstract toRustCode(): string;
}
/**
 * Configuration for SSR fairing
 */
export interface SSRFairingConfig {
    /** Enable streaming SSR */
    streaming?: boolean;
    /** Inject hydration scripts */
    hydration?: boolean;
    /** Base template path */
    templatePath?: string;
    /** Default document title */
    defaultTitle?: string;
    /** Static assets path */
    staticPath?: string;
}
/**
 * SSR Fairing for server-side rendering
 */
export declare class SSRFairing extends PhilJsFairing {
    readonly name = "PhilJS SSR";
    private config;
    constructor(config?: SSRFairingConfig);
    onIgnite(): void;
    onRequest(ctx: FairingContext): FairingResponse | void;
    onResponse(ctx: FairingContext, status: number): FairingResponse | void;
    toRustCode(): string;
    getConfig(): SSRFairingConfig;
}
/**
 * Configuration for LiveView fairing
 */
export interface LiveViewFairingConfig {
    /** WebSocket path */
    wsPath?: string;
    /** Heartbeat interval in ms */
    heartbeatInterval?: number;
    /** Connection timeout in ms */
    timeout?: number;
    /** Maximum connections */
    maxConnections?: number;
    /** Enable compression */
    compression?: boolean;
}
/**
 * LiveView Fairing for real-time updates
 */
export declare class LiveViewFairing extends PhilJsFairing {
    readonly name = "PhilJS LiveView";
    private config;
    constructor(config?: LiveViewFairingConfig);
    onIgnite(): void;
    onLiftoff(): void;
    toRustCode(): string;
    getConfig(): LiveViewFairingConfig;
}
/**
 * Configuration for state fairing
 */
export interface StateFairingConfig {
    /** Initial state */
    initialState?: Record<string, unknown>;
    /** State persistence */
    persist?: boolean;
    /** Persistence path */
    persistPath?: string;
}
/**
 * State Fairing for application state management
 */
export declare class StateFairing extends PhilJsFairing {
    readonly name = "PhilJS State";
    private config;
    constructor(config?: StateFairingConfig);
    onIgnite(): void;
    onShutdown(): void;
    toRustCode(): string;
    getConfig(): StateFairingConfig;
}
/**
 * Configuration for metrics fairing
 */
export interface MetricsFairingConfig {
    /** Enable metrics collection */
    enabled?: boolean;
    /** Metrics endpoint path */
    path?: string;
    /** Include request timing */
    timing?: boolean;
    /** Include memory stats */
    memory?: boolean;
    /** Custom labels */
    labels?: Record<string, string>;
}
/**
 * Metrics Fairing for observability
 */
export declare class MetricsFairing extends PhilJsFairing {
    readonly name = "PhilJS Metrics";
    private config;
    constructor(config?: MetricsFairingConfig);
    onIgnite(): void;
    onRequest(ctx: FairingContext): void;
    onResponse(ctx: FairingContext, status: number): void;
    toRustCode(): string;
    getConfig(): MetricsFairingConfig;
}
/**
 * Build a custom fairing from hooks
 */
export declare function createFairing(name: string, hooks: FairingHooks): CustomFairing;
/**
 * Custom Fairing class
 */
export declare class CustomFairing extends PhilJsFairing {
    readonly name: string;
    private hooks;
    constructor(name: string, hooks: FairingHooks);
    toRustCode(): string;
}
/**
 * Compose multiple fairings together
 */
export declare class FairingComposer {
    private fairings;
    /**
     * Add a fairing
     */
    use(fairing: PhilJsFairing): this;
    /**
     * Add SSR fairing
     */
    withSSR(config?: SSRFairingConfig): this;
    /**
     * Add LiveView fairing
     */
    withLiveView(config?: LiveViewFairingConfig): this;
    /**
     * Add State fairing
     */
    withState(config?: StateFairingConfig): this;
    /**
     * Add Metrics fairing
     */
    withMetrics(config?: MetricsFairingConfig): this;
    /**
     * Get all fairings
     */
    getFairings(): PhilJsFairing[];
    /**
     * Generate Rust code for all fairings
     */
    toRustCode(): string;
    /**
     * Generate Rocket attach code
     */
    toRocketAttach(): string;
}
/**
 * Create a new fairing composer
 */
export declare function composeFairings(): FairingComposer;
//# sourceMappingURL=fairing.d.ts.map