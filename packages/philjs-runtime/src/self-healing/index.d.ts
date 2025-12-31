/**
 * PhilJS Self-Healing Runtime
 *
 * UNIQUE INNOVATION: No other framework provides this level of automatic error recovery.
 *
 * Features:
 * - Automatic error recovery with smart retry strategies
 * - Graceful degradation to fallback components
 * - Circuit breaker pattern for failing services
 * - Hot-patching components in production without reload
 * - Automatic state checkpoint and restore
 * - Predictive failure detection using ML patterns
 * - Self-correcting memory management
 *
 * @packageDocumentation
 */
export type HealingStrategy = 'retry' | 'fallback' | 'isolate' | 'restore' | 'degrade' | 'hot-patch' | 'circuit-break';
export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export interface HealingConfig {
    /** Enable self-healing features */
    enabled: boolean;
    /** Maximum retry attempts */
    maxRetries: number;
    /** Base delay for exponential backoff (ms) */
    baseDelay: number;
    /** Maximum delay cap (ms) */
    maxDelay: number;
    /** Enable automatic checkpointing */
    enableCheckpoints: boolean;
    /** Checkpoint interval (ms) */
    checkpointInterval: number;
    /** Enable predictive failure detection */
    enablePrediction: boolean;
    /** Circuit breaker threshold (failures before opening) */
    circuitBreakerThreshold: number;
    /** Circuit breaker reset timeout (ms) */
    circuitBreakerTimeout: number;
    /** Enable hot-patching */
    enableHotPatch: boolean;
    /** Log healing events */
    logEvents: boolean;
    /** Custom healing strategies per error type */
    strategies: Map<string, HealingStrategy>;
}
export interface ErrorContext {
    /** Error that occurred */
    error: Error;
    /** Component that threw the error */
    componentId: string;
    /** Component name */
    componentName: string;
    /** Error severity */
    severity: ErrorSeverity;
    /** Error timestamp */
    timestamp: number;
    /** Stack trace */
    stack?: string;
    /** Component state at time of error */
    componentState?: unknown;
    /** Number of times this error has occurred */
    occurrences: number;
    /** Additional context */
    metadata?: Record<string, unknown>;
}
export interface HealingResult {
    /** Whether healing was successful */
    success: boolean;
    /** Strategy that was applied */
    strategy: HealingStrategy;
    /** Time taken to heal (ms) */
    duration: number;
    /** Any data returned from healing */
    data?: unknown;
    /** Error if healing failed */
    error?: Error;
    /** Number of retries performed */
    retries: number;
}
export interface Checkpoint {
    /** Unique checkpoint ID */
    id: string;
    /** Timestamp */
    timestamp: number;
    /** Component states */
    states: Map<string, unknown>;
    /** DOM snapshot (lightweight) */
    domHash?: string;
    /** Router state */
    routerState?: unknown;
    /** Custom data */
    metadata?: Record<string, unknown>;
}
export interface CircuitBreakerState {
    /** Current state */
    state: 'closed' | 'open' | 'half-open';
    /** Failure count */
    failures: number;
    /** Last failure timestamp */
    lastFailure: number;
    /** When circuit opened */
    openedAt?: number;
    /** Success count in half-open state */
    halfOpenSuccesses: number;
}
export interface FailurePrediction {
    /** Probability of failure (0-1) */
    probability: number;
    /** Predicted time to failure (ms) */
    timeToFailure?: number;
    /** Suggested preemptive action */
    suggestedAction: HealingStrategy;
    /** Confidence score (0-1) */
    confidence: number;
    /** Factors contributing to prediction */
    factors: string[];
}
export type HealingEventType = 'error-detected' | 'healing-started' | 'healing-succeeded' | 'healing-failed' | 'checkpoint-created' | 'checkpoint-restored' | 'circuit-opened' | 'circuit-closed' | 'hot-patch-applied' | 'prediction-warning';
export interface HealingEvent {
    type: HealingEventType;
    timestamp: number;
    componentId?: string;
    strategy?: HealingStrategy;
    error?: Error;
    result?: HealingResult;
    prediction?: FailurePrediction;
}
export type HealingEventHandler = (event: HealingEvent) => void;
export declare class SelfHealingRuntime {
    private config;
    private errorHistory;
    private checkpoints;
    private circuitBreakers;
    private fallbackComponents;
    private componentStates;
    private eventHandlers;
    private checkpointTimer?;
    private failurePatterns;
    private hotPatches;
    constructor(config?: Partial<HealingConfig>);
    /**
     * Handle an error with automatic healing
     */
    handleError(error: Error, context: Partial<ErrorContext>): Promise<HealingResult>;
    /**
     * Register a fallback component
     */
    registerFallback(componentId: string, fallback: () => unknown): void;
    /**
     * Register a hot-patch for a component
     */
    registerHotPatch(componentId: string, patch: Function): void;
    /**
     * Save component state for potential restoration
     */
    saveState(componentId: string, state: unknown): void;
    /**
     * Create a manual checkpoint
     */
    createCheckpoint(metadata?: Record<string, unknown>): Checkpoint;
    /**
     * Restore from a checkpoint
     */
    restoreCheckpoint(checkpointId?: string): Promise<boolean>;
    /**
     * Predict potential failures using pattern analysis
     */
    predictFailure(componentId: string): FailurePrediction;
    /**
     * Subscribe to healing events
     */
    onEvent(handler: HealingEventHandler): () => void;
    /**
     * Get healing statistics
     */
    getStats(): {
        totalErrors: number;
        healedErrors: number;
        circuitBreakerStates: Map<string, CircuitBreakerState>;
        checkpointCount: number;
        hotPatchCount: number;
    };
    /**
     * Cleanup
     */
    destroy(): void;
    private createErrorContext;
    private determineSeverity;
    private recordError;
    private determineStrategy;
    private applyStrategy;
    private retryWithBackoff;
    private useFallback;
    private isolateComponent;
    private restoreFromCheckpoint;
    private gracefullyDegrade;
    private applyHotPatch;
    private openCircuitBreaker;
    private isCircuitOpen;
    private incrementCircuitBreaker;
    private resetCircuitBreaker;
    private attemptRecovery;
    private startCheckpointTimer;
    private setupGlobalErrorHandler;
    private emit;
    private sleep;
}
/**
 * Initialize the self-healing runtime
 */
export declare function initSelfHealing(config?: Partial<HealingConfig>): SelfHealingRuntime;
/**
 * Get the global self-healing runtime
 */
export declare function getSelfHealingRuntime(): SelfHealingRuntime | null;
/**
 * Reset the global runtime (for testing)
 */
export declare function resetSelfHealing(): void;
/**
 * Hook to make a component self-healing
 */
export declare function useSelfHealing(componentId: string, options?: {
    fallback?: () => unknown;
    onError?: (error: Error) => void;
    onHealed?: (result: HealingResult) => void;
}): {
    saveState: (state: unknown) => void;
    handleError: (error: Error) => Promise<HealingResult>;
    predict: () => FailurePrediction;
};
/**
 * Higher-order function to wrap a component with self-healing
 */
export declare function withSelfHealing<T extends (...args: any[]) => any>(component: T, componentId: string, fallback?: () => ReturnType<T>): T;
/**
 * Create a self-healing error boundary
 */
export declare function createHealingErrorBoundary(options?: {
    fallback?: () => unknown;
    onError?: (error: Error, context: ErrorContext) => void;
    strategies?: Map<string, HealingStrategy>;
}): {
    componentId: string;
    catch: (error: Error, componentId: string) => Promise<HealingResult>;
    getFallback: () => unknown;
};
//# sourceMappingURL=index.d.ts.map