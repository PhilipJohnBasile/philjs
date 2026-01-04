/**
 * Cost tracking system for cloud deployments.
 * Estimates costs per route based on compute, data, and invocations.
 */
export type CloudProvider = "aws" | "gcp" | "azure" | "cloudflare" | "vercel";
export type CostMetrics = {
    /** Compute time in milliseconds */
    computeTime: number;
    /** Memory used in MB */
    memoryUsed: number;
    /** Data transferred in KB */
    dataTransfer: number;
    /** Number of invocations */
    invocations: number;
    /** Database queries */
    dbQueries?: number;
    /** Cache hits/misses */
    cacheHits?: number;
    cacheMisses?: number;
    /** API calls to external services */
    externalApiCalls?: number;
};
export type CostEstimate = {
    /** Total estimated cost in USD */
    total: number;
    /** Breakdown by category */
    breakdown: {
        compute: number;
        memory: number;
        dataTransfer: number;
        database?: number;
        cache?: number;
        externalApis?: number;
    };
    /** Cost per 1000 requests */
    perThousandRequests: number;
    /** Monthly projection based on current usage */
    monthlyProjection: number;
    /** Optimization suggestions */
    optimizations: Array<{
        category: string;
        potentialSavings: number;
        suggestion: string;
        difficulty: "easy" | "medium" | "hard";
    }>;
};
/**
 * Cost tracking manager.
 */
export declare class CostTracker {
    private provider;
    private metrics;
    private customPricing;
    constructor(provider?: CloudProvider);
    /**
     * Set cloud provider.
     */
    setProvider(provider: CloudProvider): void;
    /**
     * Set custom pricing model.
     */
    setCustomPricing(pricing: any): void;
    /**
     * Track metrics for a route.
     */
    trackRoute(route: string, metrics: CostMetrics): void;
    /**
     * Calculate cost estimate for a route.
     */
    estimateCost(route: string): CostEstimate;
    /**
     * Calculate average metrics.
     */
    private calculateAverageMetrics;
    /**
     * Calculate compute cost.
     */
    private calculateComputeCost;
    /**
     * Calculate memory cost.
     */
    private calculateMemoryCost;
    /**
     * Calculate data transfer cost.
     */
    private calculateDataTransferCost;
    /**
     * Calculate database cost.
     */
    private calculateDatabaseCost;
    /**
     * Calculate cache cost.
     */
    private calculateCacheCost;
    /**
     * Generate optimization suggestions.
     */
    private generateOptimizations;
    /**
     * Get cost trends over time.
     */
    getCostTrends(route: string, days?: number): {
        date: string;
        cost: number;
        breakdown: Record<string, number>;
    }[];
    /**
     * Export cost data for analysis.
     */
    exportCostData(): Record<string, {
        metrics: CostMetrics[];
        estimate: CostEstimate;
    }>;
}
/**
 * Global cost tracker instance.
 */
export declare const costTracker: CostTracker;
//# sourceMappingURL=cost-tracking.d.ts.map