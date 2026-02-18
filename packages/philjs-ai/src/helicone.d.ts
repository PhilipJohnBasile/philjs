/**
 * PhilJS Helicone Adapter
 */
export interface HeliconeConfig {
    apiKey: string;
    baseUrl?: string;
}
export declare function initHelicone(cfg: HeliconeConfig): void;
export declare function createHeliconeProxy(openaiBaseUrl?: string): {
    baseUrl: string;
    headers: {
        'Helicone-Auth': string;
        'Helicone-Target-Url': string;
    };
};
export declare function useHeliconeMetrics(): {
    metrics: import("@philjs/core").Signal<{
        requestCount: number;
        totalCost: number;
        avgLatency: number;
    }>;
    refetch: () => Promise<void>;
};
