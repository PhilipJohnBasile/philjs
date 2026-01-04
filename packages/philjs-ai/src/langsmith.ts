/**
 * PhilJS LangSmith Integration
 * 
 * LLM observability and tracing with LangSmith.
 */

import { signal, effect, type Signal } from '@philjs/core';

// ============ TYPES ============

export interface LangSmithConfig {
    apiKey: string;
    projectName?: string;
    endpoint?: string;
}

export interface Trace {
    id: string;
    name: string;
    runType: 'llm' | 'chain' | 'tool' | 'agent';
    startTime: Date;
    endTime?: Date;
    inputs: Record<string, any>;
    outputs?: Record<string, any>;
    error?: string;
    metadata?: Record<string, any>;
    parentId?: string;
    children: Trace[];
    tokens?: { prompt: number; completion: number };
    cost?: number;
}

export interface TraceOptions {
    name: string;
    runType: Trace['runType'];
    inputs: Record<string, any>;
    metadata?: Record<string, any>;
    parentId?: string;
}

// ============ CLIENT ============

let config: LangSmithConfig | null = null;

export function initLangSmith(cfg: LangSmithConfig): void {
    config = cfg;
}

function getConfig(): LangSmithConfig {
    if (!config) {
        throw new Error('LangSmith not initialized. Call initLangSmith() first.');
    }
    return config;
}

/**
 * LangSmith Client
 */
export class LangSmithClient {
    private config: LangSmithConfig;
    private endpoint: string;

    constructor(cfg?: LangSmithConfig) {
        this.config = cfg || getConfig();
        this.endpoint = this.config.endpoint || 'https://api.smith.langchain.com';
    }

    async createRun(trace: TraceOptions): Promise<string> {
        const runId = crypto.randomUUID();

        await fetch(`${this.endpoint}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey,
            },
            body: JSON.stringify({
                id: runId,
                name: trace.name,
                run_type: trace.runType,
                inputs: trace.inputs,
                start_time: new Date().toISOString(),
                project_name: this.config.projectName,
                parent_run_id: trace.parentId,
                extra: trace.metadata,
            }),
        });

        return runId;
    }

    async updateRun(runId: string, update: {
        outputs?: Record<string, any>;
        error?: string;
        endTime?: Date;
    }): Promise<void> {
        await fetch(`${this.endpoint}/runs/${runId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey,
            },
            body: JSON.stringify({
                outputs: update.outputs,
                error: update.error,
                end_time: (update.endTime || new Date()).toISOString(),
            }),
        });
    }

    async getRuns(options: {
        projectName?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<Trace[]> {
        const params = new URLSearchParams({
            project_name: options.projectName || this.config.projectName || '',
            limit: String(options.limit || 20),
            offset: String(options.offset || 0),
        });

        const response = await fetch(`${this.endpoint}/runs?${params}`, {
            headers: {
                'x-api-key': this.config.apiKey,
            },
        });

        const data = await response.json();
        return data.runs;
    }
}

// ============ TRACING DECORATOR ============

/**
 * Trace an async function
 * 
 * @example
 * ```ts
 * const generateResponse = traced('generate_response', 'llm', async (prompt: string) => {
 *   return await openai.chat.completions.create({ ... });
 * });
 * ```
 */
export function traced<T extends (...args: any[]) => Promise<any>>(
    name: string,
    runType: Trace['runType'],
    fn: T
): T {
    const client = new LangSmithClient();

    return (async (...args: Parameters<T>) => {
        const runId = await client.createRun({
            name,
            runType,
            inputs: { args },
        });

        try {
            const result = await fn(...args);
            await client.updateRun(runId, { outputs: { result } });
            return result;
        } catch (error) {
            await client.updateRun(runId, {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }) as T;
}

// ============ HOOKS ============

/**
 * Use LangSmith traces as signals
 */
export function useTraces(options: { limit?: number } = {}) {
    const traces = signal<Trace[]>([]);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const client = new LangSmithClient();

    const fetch = async () => {
        loading.set(true);
        error.set(null);

        try {
            const runs = await client.getRuns({ limit: options.limit });
            traces.set(runs);
        } catch (e) {
            error.set(e as Error);
        } finally {
            loading.set(false);
        }
    };

    fetch();

    return { traces, loading, error, refetch: fetch };
}

/**
 * Create a trace context for nested tracing
 */
export function useTraceContext() {
    const currentTraceId = signal<string | null>(null);
    const client = new LangSmithClient();

    const startTrace = async (options: Omit<TraceOptions, 'parentId'>) => {
        const runId = await client.createRun({
            ...options,
            parentId: currentTraceId() || undefined,
        });
        currentTraceId.set(runId);
        return runId;
    };

    const endTrace = async (runId: string, result: {
        outputs?: Record<string, any>;
        error?: string;
    }) => {
        await client.updateRun(runId, result);
    };

    return { currentTraceId, startTrace, endTrace };
}

// ============ EVALUATION ============

export interface EvaluationResult {
    key: string;
    score: number;
    comment?: string;
}

/**
 * Run evaluation on traces
 */
export async function evaluate(
    runId: string,
    evaluator: (trace: Trace) => Promise<EvaluationResult[]>
): Promise<EvaluationResult[]> {
    const client = new LangSmithClient();

    // Get the trace
    const runs = await client.getRuns();
    const trace = runs.find(r => r.id === runId);

    if (!trace) {
        throw new Error(`Run ${runId} not found`);
    }

    // Run evaluator
    const results = await evaluator(trace);

    // TODO: Submit feedback to LangSmith

    return results;
}

export {
    initLangSmith,
    LangSmithClient,
    traced,
    useTraces,
    useTraceContext,
    evaluate,
};
