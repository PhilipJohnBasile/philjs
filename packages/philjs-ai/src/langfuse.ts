/**
 * PhilJS Langfuse Adapter
 */

import { signal } from '@philjs/core';

export interface LangfuseConfig { publicKey: string; secretKey: string; baseUrl?: string; }

let config: LangfuseConfig | null = null;
export function initLangfuse(cfg: LangfuseConfig) { config = cfg; }

export class LangfuseClient {
    async createTrace(name: string, input: any) {
        const id = crypto.randomUUID();
        await fetch(`${config?.baseUrl || 'https://cloud.langfuse.com'}/api/public/traces`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(`${config?.publicKey}:${config?.secretKey}`)}` },
            body: JSON.stringify({ id, name, input, timestamp: new Date().toISOString() }),
        });
        return id;
    }

    async endTrace(id: string, output: any) {
        await fetch(`${config?.baseUrl || 'https://cloud.langfuse.com'}/api/public/traces/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(`${config?.publicKey}:${config?.secretKey}`)}` },
            body: JSON.stringify({ output }),
        });
    }
}

export function useLangfuseTrace() {
    const traceId = signal<string | null>(null);
    const client = new LangfuseClient();

    return {
        traceId,
        start: async (name: string, input: any) => { const id = await client.createTrace(name, input); traceId.set(id); return id; },
        end: async (output: any) => { if (traceId()) await client.endTrace(traceId()!, output); },
    };
}
