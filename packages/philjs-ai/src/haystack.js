/**
 * PhilJS Haystack Adapter
 *
 * Integration with Haystack pipelines.
 */
import { signal } from '@philjs/core';
let config = null;
export function initHaystack(cfg) {
    config = cfg;
}
export function useHaystackQuery(pipelineName) {
    const result = signal(null);
    const loading = signal(false);
    const error = signal(null);
    const query = async (input, params = {}) => {
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
        }
        catch (e) {
            error.set(e);
            throw e;
        }
        finally {
            loading.set(false);
        }
    };
    return { result, loading, error, query };
}
export function useHaystackRAG(pipelineName) {
    const { query, result, loading, error } = useHaystackQuery(pipelineName);
    const ask = async (question) => {
        const response = await query(question);
        return {
            answer: response.answers?.[0]?.answer || '',
            documents: response.documents || [],
            metadata: response.metadata || {},
        };
    };
    return { ask, result, loading, error };
}
//# sourceMappingURL=haystack.js.map