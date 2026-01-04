/**
 * PhilJS Haystack Adapter
 * 
 * Integration with Haystack pipelines.
 */

import { signal } from '@philjs/core';

export interface HaystackPipeline {
    name: string;
    run: (query: string, params?: Record<string, any>) => Promise<any>;
}

export interface HaystackConfig {
    baseUrl: string;
    apiKey?: string;
}

let config: HaystackConfig | null = null;

export function initHaystack(cfg: HaystackConfig) {
    config = cfg;
}

export function useHaystackQuery(pipelineName: string) {
    const result = signal<any>(null);
    const loading = signal(false);
    const error = signal<Error | null>(null);

    const query = async (input: string, params: Record<string, any> = {}) => {
        loading.set(true);
        error.set(null);

        try {
            const response = await fetch(`${config?.baseUrl}/pipelines/${pipelineName}/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(config?.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
                },
                body: JSON.stringify({ query: input, params }),
            });

            const data = await response.json();
            result.set(data);
            return data;
        } catch (e) {
            error.set(e as Error);
            throw e;
        } finally {
            loading.set(false);
        }
    };

    return { result, loading, error, query };
}

export function useHaystackRAG(pipelineName: string) {
    const { query, result, loading, error } = useHaystackQuery(pipelineName);

    const ask = async (question: string) => {
        const response = await query(question);
        return {
            answer: response.answers?.[0]?.answer || '',
            documents: response.documents || [],
            metadata: response.metadata || {},
        };
    };

    return { ask, result, loading, error };
}
