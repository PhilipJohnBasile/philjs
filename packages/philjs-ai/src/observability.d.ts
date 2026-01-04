/**
 * PhilJS AI - Observability and Telemetry
 *
 * Track token usage, costs, latency, and errors across AI operations.
 * Supports multiple export destinations and alerting.
 */
import type { AIProvider, CompletionOptions } from './types.js';
export interface AIMetrics {
    /** Total number of API calls */
    totalCalls: number;
    /** Total input tokens used */
    inputTokens: number;
    /** Total output tokens used */
    outputTokens: number;
    /** Total tokens used */
    totalTokens: number;
    /** Total cost in USD */
    totalCost: number;
    /** Average latency in ms */
    avgLatency: number;
    /** Number of errors */
    errors: number;
    /** Number of cache hits */
    cacheHits: number;
    /** Number of cache misses */
    cacheMisses: number;
    /** Cost by model */
    costByModel: Record<string, number>;
    /** Tokens by model */
    tokensByModel: Record<string, number>;
    /** Calls by model */
    callsByModel: Record<string, number>;
}
export interface AIEvent {
    type: 'call' | 'stream' | 'error' | 'cache_hit' | 'cache_miss';
    timestamp: number;
    provider: string;
    model: string;
    prompt?: string;
    response?: string;
    inputTokens?: number;
    outputTokens?: number;
    cost?: number;
    latencyMs?: number;
    error?: Error;
    metadata?: Record<string, unknown>;
}
export interface AIBudget {
    /** Maximum daily spend in USD */
    dailyLimit?: number;
    /** Maximum monthly spend in USD */
    monthlyLimit?: number;
    /** Maximum tokens per request */
    maxTokensPerRequest?: number;
    /** Maximum tokens per day */
    dailyTokenLimit?: number;
    /** Callback when approaching limit (80%) */
    onWarning?: (usage: AIMetrics, limit: string) => void;
    /** Callback when limit exceeded */
    onLimitExceeded?: (usage: AIMetrics, limit: string) => void;
}
export interface TelemetryExporter {
    export(events: AIEvent[]): Promise<void>;
    flush(): Promise<void>;
}
export interface ObservabilityConfig {
    /** Enable detailed logging */
    debug?: boolean;
    /** Budget configuration */
    budget?: AIBudget;
    /** Event exporters */
    exporters?: TelemetryExporter[];
    /** Sample rate for logging (0-1, default 1.0) */
    sampleRate?: number;
    /** Whether to include prompt/response in logs */
    includeContent?: boolean;
    /** Batch size for exporting (default 100) */
    batchSize?: number;
    /** Flush interval in ms (default 10000) */
    flushInterval?: number;
}
/**
 * Cost per 1M tokens for different models
 */
export declare const MODEL_COSTS: Record<string, {
    input: number;
    output: number;
}>;
/**
 * Calculate cost for a given model and token usage
 */
export declare function calculateCost(model: string, inputTokens: number, outputTokens: number): number;
export declare class ObservableAIProvider implements AIProvider {
    name: string;
    private provider;
    private config;
    private events;
    private metrics;
    private dailyMetrics;
    private monthlyMetrics;
    private lastDayReset;
    private lastMonthReset;
    private flushTimer?;
    constructor(provider: AIProvider, config?: ObservabilityConfig);
    private createEmptyMetrics;
    private getStartOfDay;
    private getStartOfMonth;
    private maybeResetPeriods;
    private shouldSample;
    private checkBudget;
    private recordEvent;
    private updateMetrics;
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
    generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string>;
    /**
     * Flush pending events to exporters
     */
    flush(): Promise<void>;
    /**
     * Get current metrics
     */
    getMetrics(): AIMetrics;
    /**
     * Get daily metrics
     */
    getDailyMetrics(): AIMetrics;
    /**
     * Get monthly metrics
     */
    getMonthlyMetrics(): AIMetrics;
    /**
     * Reset all metrics
     */
    resetMetrics(): void;
    /**
     * Stop the provider and flush remaining events
     */
    stop(): Promise<void>;
    /**
     * Get the underlying provider
     */
    getProvider(): AIProvider;
}
export declare class BudgetExceededError extends Error {
    constructor(message: string);
}
/**
 * Console exporter for development
 */
export declare class ConsoleExporter implements TelemetryExporter {
    export(events: AIEvent[]): Promise<void>;
    flush(): Promise<void>;
}
/**
 * HTTP exporter for sending to observability platforms
 */
export declare class HttpExporter implements TelemetryExporter {
    private endpoint;
    private headers;
    private pending;
    constructor(endpoint: string, headers?: Record<string, string>);
    export(events: AIEvent[]): Promise<void>;
    flush(): Promise<void>;
}
/**
 * File exporter for local logging
 */
export declare class FileExporter implements TelemetryExporter {
    private filePath;
    private buffer;
    constructor(filePath: string);
    export(events: AIEvent[]): Promise<void>;
    flush(): Promise<void>;
}
/**
 * Create an observable AI provider
 *
 * @example
 * ```typescript
 * const provider = createObservableProvider(anthropicProvider, {
 *   debug: true,
 *   budget: {
 *     dailyLimit: 10, // $10/day
 *     onWarning: (usage) => console.warn('Approaching budget limit'),
 *     onLimitExceeded: (usage) => console.error('Budget exceeded!'),
 *   },
 *   exporters: [new ConsoleExporter()],
 * });
 *
 * // Use as normal
 * const response = await provider.generateCompletion('Hello');
 *
 * // Check usage
 * const metrics = provider.getMetrics();
 * console.log(`Total cost: $${metrics.totalCost.toFixed(2)}`);
 * ```
 */
export declare function createObservableProvider(provider: AIProvider, config?: ObservabilityConfig): ObservableAIProvider;
//# sourceMappingURL=observability.d.ts.map