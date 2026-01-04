/**
 * PhilJS AI - Observability and Telemetry
 *
 * Track token usage, costs, latency, and errors across AI operations.
 * Supports multiple export destinations and alerting.
 */
// ============================================================================
// Cost Models
// ============================================================================
/**
 * Cost per 1M tokens for different models
 */
export const MODEL_COSTS = {
    // OpenAI
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4': { input: 30.00, output: 60.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'text-embedding-3-small': { input: 0.02, output: 0 },
    'text-embedding-3-large': { input: 0.13, output: 0 },
    // Anthropic
    'claude-opus-4-20250514': { input: 15.00, output: 75.00 },
    'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku-20241022': { input: 1.00, output: 5.00 },
    'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
    'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    // Google
    'gemini-1.5-pro': { input: 3.50, output: 10.50 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.0-pro': { input: 0.50, output: 1.50 },
};
/**
 * Calculate cost for a given model and token usage
 */
export function calculateCost(model, inputTokens, outputTokens) {
    const costs = MODEL_COSTS[model];
    if (!costs) {
        // Default to GPT-4 pricing for unknown models
        return (inputTokens * 30 + outputTokens * 60) / 1_000_000;
    }
    return (inputTokens * costs.input + outputTokens * costs.output) / 1_000_000;
}
// ============================================================================
// Observable AI Provider
// ============================================================================
export class ObservableAIProvider {
    name;
    provider;
    config;
    events = [];
    metrics = this.createEmptyMetrics();
    dailyMetrics = this.createEmptyMetrics();
    monthlyMetrics = this.createEmptyMetrics();
    lastDayReset = this.getStartOfDay();
    lastMonthReset = this.getStartOfMonth();
    flushTimer;
    constructor(provider, config = {}) {
        this.name = `observable-${provider.name}`;
        this.provider = provider;
        this.config = {
            sampleRate: 1.0,
            includeContent: false,
            batchSize: 100,
            flushInterval: 10000,
            ...config,
        };
        // Start flush timer
        if (this.config.exporters?.length) {
            this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
        }
    }
    createEmptyMetrics() {
        return {
            totalCalls: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            totalCost: 0,
            avgLatency: 0,
            errors: 0,
            cacheHits: 0,
            cacheMisses: 0,
            costByModel: {},
            tokensByModel: {},
            callsByModel: {},
        };
    }
    getStartOfDay() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    }
    getStartOfMonth() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }
    maybeResetPeriods() {
        const now = Date.now();
        // Reset daily metrics
        const startOfDay = this.getStartOfDay();
        if (startOfDay > this.lastDayReset) {
            this.dailyMetrics = this.createEmptyMetrics();
            this.lastDayReset = startOfDay;
        }
        // Reset monthly metrics
        const startOfMonth = this.getStartOfMonth();
        if (startOfMonth > this.lastMonthReset) {
            this.monthlyMetrics = this.createEmptyMetrics();
            this.lastMonthReset = startOfMonth;
        }
    }
    shouldSample() {
        return Math.random() < (this.config.sampleRate ?? 1.0);
    }
    checkBudget(model, inputTokens) {
        const budget = this.config.budget;
        if (!budget)
            return;
        this.maybeResetPeriods();
        // Check token limit per request
        if (budget.maxTokensPerRequest && inputTokens > budget.maxTokensPerRequest) {
            budget.onLimitExceeded?.(this.metrics, 'maxTokensPerRequest');
            throw new BudgetExceededError(`Request exceeds maximum tokens per request (${inputTokens} > ${budget.maxTokensPerRequest})`);
        }
        // Check daily token limit
        if (budget.dailyTokenLimit) {
            const projectedDaily = this.dailyMetrics.totalTokens + inputTokens;
            if (projectedDaily > budget.dailyTokenLimit) {
                budget.onLimitExceeded?.(this.dailyMetrics, 'dailyTokenLimit');
                throw new BudgetExceededError(`Would exceed daily token limit (${projectedDaily} > ${budget.dailyTokenLimit})`);
            }
            if (projectedDaily > budget.dailyTokenLimit * 0.8) {
                budget.onWarning?.(this.dailyMetrics, 'dailyTokenLimit');
            }
        }
        // Check daily cost limit
        if (budget.dailyLimit) {
            const estimatedCost = calculateCost(model, inputTokens, inputTokens * 2); // Estimate 2x output
            const projectedCost = this.dailyMetrics.totalCost + estimatedCost;
            if (this.dailyMetrics.totalCost >= budget.dailyLimit) {
                budget.onLimitExceeded?.(this.dailyMetrics, 'dailyLimit');
                throw new BudgetExceededError(`Daily budget exceeded ($${this.dailyMetrics.totalCost.toFixed(2)} >= $${budget.dailyLimit})`);
            }
            if (projectedCost > budget.dailyLimit * 0.8) {
                budget.onWarning?.(this.dailyMetrics, 'dailyLimit');
            }
        }
        // Check monthly cost limit
        if (budget.monthlyLimit) {
            if (this.monthlyMetrics.totalCost >= budget.monthlyLimit) {
                budget.onLimitExceeded?.(this.monthlyMetrics, 'monthlyLimit');
                throw new BudgetExceededError(`Monthly budget exceeded ($${this.monthlyMetrics.totalCost.toFixed(2)} >= $${budget.monthlyLimit})`);
            }
            if (this.monthlyMetrics.totalCost > budget.monthlyLimit * 0.8) {
                budget.onWarning?.(this.monthlyMetrics, 'monthlyLimit');
            }
        }
    }
    recordEvent(event) {
        // Update all metrics
        this.updateMetrics(this.metrics, event);
        this.updateMetrics(this.dailyMetrics, event);
        this.updateMetrics(this.monthlyMetrics, event);
        // Store event for export
        if (this.shouldSample()) {
            this.events.push(event);
            // Auto-flush if batch is full
            if (this.events.length >= (this.config.batchSize ?? 100)) {
                this.flush().catch(console.error);
            }
        }
        // Debug logging
        if (this.config.debug) {
            console.log('[AI Observability]', {
                type: event.type,
                model: event.model,
                tokens: event.inputTokens && event.outputTokens
                    ? `${event.inputTokens}/${event.outputTokens}`
                    : undefined,
                cost: event.cost ? `$${event.cost.toFixed(4)}` : undefined,
                latency: event.latencyMs ? `${event.latencyMs}ms` : undefined,
            });
        }
    }
    updateMetrics(metrics, event) {
        if (event.type === 'call' || event.type === 'stream') {
            metrics.totalCalls++;
            metrics.inputTokens += event.inputTokens || 0;
            metrics.outputTokens += event.outputTokens || 0;
            metrics.totalTokens += (event.inputTokens || 0) + (event.outputTokens || 0);
            metrics.totalCost += event.cost || 0;
            // Update model-specific metrics
            if (event.model) {
                metrics.costByModel[event.model] = (metrics.costByModel[event.model] || 0) + (event.cost || 0);
                metrics.tokensByModel[event.model] = (metrics.tokensByModel[event.model] || 0) +
                    (event.inputTokens || 0) + (event.outputTokens || 0);
                metrics.callsByModel[event.model] = (metrics.callsByModel[event.model] || 0) + 1;
            }
            // Update average latency
            if (event.latencyMs) {
                const totalLatency = metrics.avgLatency * (metrics.totalCalls - 1) + event.latencyMs;
                metrics.avgLatency = totalLatency / metrics.totalCalls;
            }
        }
        else if (event.type === 'error') {
            metrics.errors++;
        }
        else if (event.type === 'cache_hit') {
            metrics.cacheHits++;
        }
        else if (event.type === 'cache_miss') {
            metrics.cacheMisses++;
        }
    }
    async generateCompletion(prompt, options) {
        const model = options?.model || 'unknown';
        const startTime = Date.now();
        // Estimate input tokens (rough approximation: 4 chars per token)
        const estimatedInputTokens = Math.ceil((prompt.length + (options?.systemPrompt?.length || 0)) / 4);
        this.checkBudget(model, estimatedInputTokens);
        try {
            const response = await this.provider.generateCompletion(prompt, options);
            const latencyMs = Date.now() - startTime;
            // Estimate output tokens
            const estimatedOutputTokens = Math.ceil(response.length / 4);
            const cost = calculateCost(model, estimatedInputTokens, estimatedOutputTokens);
            this.recordEvent({
                type: 'call',
                timestamp: startTime,
                provider: this.provider.name,
                model,
                prompt: this.config.includeContent ? prompt : undefined,
                response: this.config.includeContent ? response : undefined,
                inputTokens: estimatedInputTokens,
                outputTokens: estimatedOutputTokens,
                cost,
                latencyMs,
            });
            return response;
        }
        catch (error) {
            this.recordEvent({
                type: 'error',
                timestamp: startTime,
                provider: this.provider.name,
                model,
                error: error,
                latencyMs: Date.now() - startTime,
            });
            throw error;
        }
    }
    async *generateStreamCompletion(prompt, options) {
        if (!this.provider.generateStreamCompletion) {
            throw new Error('Provider does not support streaming');
        }
        const model = options?.model || 'unknown';
        const startTime = Date.now();
        const estimatedInputTokens = Math.ceil((prompt.length + (options?.systemPrompt?.length || 0)) / 4);
        this.checkBudget(model, estimatedInputTokens);
        try {
            let fullResponse = '';
            for await (const chunk of this.provider.generateStreamCompletion(prompt, options)) {
                fullResponse += chunk;
                yield chunk;
            }
            const latencyMs = Date.now() - startTime;
            const estimatedOutputTokens = Math.ceil(fullResponse.length / 4);
            const cost = calculateCost(model, estimatedInputTokens, estimatedOutputTokens);
            this.recordEvent({
                type: 'stream',
                timestamp: startTime,
                provider: this.provider.name,
                model,
                inputTokens: estimatedInputTokens,
                outputTokens: estimatedOutputTokens,
                cost,
                latencyMs,
            });
        }
        catch (error) {
            this.recordEvent({
                type: 'error',
                timestamp: startTime,
                provider: this.provider.name,
                model,
                error: error,
                latencyMs: Date.now() - startTime,
            });
            throw error;
        }
    }
    /**
     * Flush pending events to exporters
     */
    async flush() {
        if (this.events.length === 0)
            return;
        const eventsToExport = [...this.events];
        this.events = [];
        for (const exporter of this.config.exporters ?? []) {
            try {
                await exporter.export(eventsToExport);
            }
            catch (error) {
                console.error('Failed to export AI events:', error);
            }
        }
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get daily metrics
     */
    getDailyMetrics() {
        this.maybeResetPeriods();
        return { ...this.dailyMetrics };
    }
    /**
     * Get monthly metrics
     */
    getMonthlyMetrics() {
        this.maybeResetPeriods();
        return { ...this.monthlyMetrics };
    }
    /**
     * Reset all metrics
     */
    resetMetrics() {
        this.metrics = this.createEmptyMetrics();
        this.dailyMetrics = this.createEmptyMetrics();
        this.monthlyMetrics = this.createEmptyMetrics();
    }
    /**
     * Stop the provider and flush remaining events
     */
    async stop() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        await this.flush();
        for (const exporter of this.config.exporters ?? []) {
            await exporter.flush();
        }
    }
    /**
     * Get the underlying provider
     */
    getProvider() {
        return this.provider;
    }
}
// ============================================================================
// Errors
// ============================================================================
export class BudgetExceededError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BudgetExceededError';
    }
}
// ============================================================================
// Exporters
// ============================================================================
/**
 * Console exporter for development
 */
export class ConsoleExporter {
    async export(events) {
        for (const event of events) {
            console.log('[AI Event]', JSON.stringify(event, null, 2));
        }
    }
    async flush() { }
}
/**
 * HTTP exporter for sending to observability platforms
 */
export class HttpExporter {
    endpoint;
    headers;
    pending = [];
    constructor(endpoint, headers = {}) {
        this.endpoint = endpoint;
        this.headers = headers;
    }
    async export(events) {
        this.pending.push(...events);
        if (this.pending.length >= 100) {
            await this.flush();
        }
    }
    async flush() {
        if (this.pending.length === 0)
            return;
        const events = this.pending;
        this.pending = [];
        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.headers,
                },
                body: JSON.stringify({ events }),
            });
        }
        catch (error) {
            console.error('Failed to send events to HTTP endpoint:', error);
            // Re-add events for retry
            this.pending.unshift(...events);
        }
    }
}
/**
 * File exporter for local logging
 */
export class FileExporter {
    filePath;
    buffer = [];
    constructor(filePath) {
        this.filePath = filePath;
    }
    async export(events) {
        for (const event of events) {
            this.buffer.push(JSON.stringify(event));
        }
        if (this.buffer.length >= 100) {
            await this.flush();
        }
    }
    async flush() {
        if (this.buffer.length === 0)
            return;
        const lines = this.buffer.join('\n') + '\n';
        this.buffer = [];
        const fs = await import('fs/promises');
        await fs.appendFile(this.filePath, lines);
    }
}
// ============================================================================
// Factory Functions
// ============================================================================
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
export function createObservableProvider(provider, config) {
    return new ObservableAIProvider(provider, config);
}
//# sourceMappingURL=observability.js.map