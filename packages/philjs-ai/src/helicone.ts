/**
 * PhilJS Helicone Adapter
 */

import { signal } from '@philjs/core';

export interface HeliconeConfig { apiKey: string; baseUrl?: string; }

let config: HeliconeConfig | null = null;
export function initHelicone(cfg: HeliconeConfig) { config = cfg; }

export function createHeliconeProxy(openaiBaseUrl = 'https://api.openai.com') {
    return {
        baseUrl: 'https://oai.hconeai.com/v1',
        headers: {
            'Helicone-Auth': `Bearer ${config?.apiKey}`,
            'Helicone-Target-Url': openaiBaseUrl,
        }
    };
}

export function useHeliconeMetrics() {
    const metrics = signal<{ requestCount: number; totalCost: number; avgLatency: number } | null>(null);

    const fetch = async () => {
        const res = await globalThis.fetch(`${config?.baseUrl || 'https://api.helicone.ai'}/v1/metrics`, {
            headers: { Authorization: `Bearer ${config?.apiKey}` }
        });
        metrics.set(await res.json());
    };

    fetch();
    return { metrics, refetch: fetch };
}
