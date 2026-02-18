/**
 * PhilJS Langfuse Adapter
 */
import { signal } from '@philjs/core';
let config = null;
export function initLangfuse(cfg) { config = cfg; }
export class LangfuseClient {
    async createTrace(name, input) {
        const id = crypto.randomUUID();
        await fetch(`${config?.baseUrl || 'https://cloud.langfuse.com'}/api/public/traces`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(`${config?.publicKey}:${config?.secretKey}`)}` },
            body: JSON.stringify({ id, name, input, timestamp: new Date().toISOString() }),
        });
        return id;
    }
    async endTrace(id, output) {
        await fetch(`${config?.baseUrl || 'https://cloud.langfuse.com'}/api/public/traces/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(`${config?.publicKey}:${config?.secretKey}`)}` },
            body: JSON.stringify({ output }),
        });
    }
}
export function useLangfuseTrace() {
    const traceId = signal(null);
    const client = new LangfuseClient();
    return {
        traceId,
        start: async (name, input) => { const id = await client.createTrace(name, input); traceId.set(id); return id; },
        end: async (output) => { if (traceId())
            await client.endTrace(traceId(), output); },
    };
}
//# sourceMappingURL=langfuse.js.map