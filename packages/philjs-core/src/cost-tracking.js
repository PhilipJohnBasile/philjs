/**
 * Cost tracking system for cloud deployments.
 * Estimates costs per route based on compute, data, and invocations.
 */
/**
 * Pricing models for different cloud providers.
 */
const PRICING_MODELS = {
    aws: {
        lambda: {
            compute: 0.0000166667, // per GB-second
            requests: 0.2 / 1_000_000, // per request
            dataTransfer: 0.09 / 1024, // per GB
        },
        dynamodb: {
            read: 0.25 / 1_000_000,
            write: 1.25 / 1_000_000,
        },
    },
    cloudflare: {
        workers: {
            compute: 0.00001, // per millisecond
            requests: 0.5 / 1_000_000,
            dataTransfer: 0, // free egress
        },
        kv: {
            read: 0.5 / 1_000_000,
            write: 5 / 1_000_000,
        },
    },
    vercel: {
        functions: {
            compute: 0.0000002, // per ms
            requests: 0.6 / 1_000_000,
            dataTransfer: 0.15 / 1024,
        },
    },
    gcp: {
        functions: {
            compute: 0.0000025, // per 100ms
            requests: 0.4 / 1_000_000,
            dataTransfer: 0.12 / 1024,
        },
    },
    azure: {
        functions: {
            compute: 0.000016, // per GB-second
            requests: 0.2 / 1_000_000,
            dataTransfer: 0.087 / 1024,
        },
    },
};
/**
 * Cost tracking manager.
 */
export class CostTracker {
    provider;
    metrics = new Map();
    customPricing = null;
    constructor(provider = "cloudflare") {
        this.provider = provider;
    }
    /**
     * Set cloud provider.
     */
    setProvider(provider) {
        this.provider = provider;
    }
    /**
     * Set custom pricing model.
     */
    setCustomPricing(pricing) {
        this.customPricing = pricing;
    }
    /**
     * Track metrics for a route.
     */
    trackRoute(route, metrics) {
        const routeMetrics = this.metrics.get(route) || [];
        routeMetrics.push(metrics);
        // Keep last 10,000 entries
        if (routeMetrics.length > 10000) {
            routeMetrics.shift();
        }
        this.metrics.set(route, routeMetrics);
    }
    /**
     * Calculate cost estimate for a route.
     */
    estimateCost(route) {
        const routeMetrics = this.metrics.get(route) || [];
        if (routeMetrics.length === 0) {
            return {
                total: 0,
                breakdown: {
                    compute: 0,
                    memory: 0,
                    dataTransfer: 0,
                },
                perThousandRequests: 0,
                monthlyProjection: 0,
                optimizations: [],
            };
        }
        // Average metrics
        const avgMetrics = this.calculateAverageMetrics(routeMetrics);
        // Get pricing model
        const pricing = this.customPricing || PRICING_MODELS[this.provider];
        // Calculate costs
        const computeCost = this.calculateComputeCost(avgMetrics, pricing);
        const memoryCost = this.calculateMemoryCost(avgMetrics, pricing);
        const dataTransferCost = this.calculateDataTransferCost(avgMetrics, pricing);
        const dbCost = this.calculateDatabaseCost(avgMetrics, pricing);
        const cacheCost = this.calculateCacheCost(avgMetrics, pricing);
        const total = computeCost + memoryCost + dataTransferCost + dbCost + cacheCost;
        // Calculate projections
        const perThousandRequests = total * 1000;
        const requestsPerMonth = routeMetrics.length * 30; // Rough estimate
        const monthlyProjection = total * requestsPerMonth;
        // Generate optimizations
        const optimizations = this.generateOptimizations(avgMetrics, {
            computeCost,
            memoryCost,
            dataTransferCost,
            dbCost,
            cacheCost,
        });
        return {
            total,
            breakdown: {
                compute: computeCost,
                memory: memoryCost,
                dataTransfer: dataTransferCost,
                database: dbCost,
                cache: cacheCost,
            },
            perThousandRequests,
            monthlyProjection,
            optimizations,
        };
    }
    /**
     * Calculate average metrics.
     */
    calculateAverageMetrics(metrics) {
        const sum = metrics.reduce((acc, m) => ({
            computeTime: acc.computeTime + m.computeTime,
            memoryUsed: acc.memoryUsed + m.memoryUsed,
            dataTransfer: acc.dataTransfer + m.dataTransfer,
            invocations: acc.invocations + m.invocations,
            dbQueries: (acc.dbQueries || 0) + (m.dbQueries || 0),
            cacheHits: (acc.cacheHits || 0) + (m.cacheHits || 0),
            cacheMisses: (acc.cacheMisses || 0) + (m.cacheMisses || 0),
            externalApiCalls: (acc.externalApiCalls || 0) + (m.externalApiCalls || 0),
        }), {
            computeTime: 0,
            memoryUsed: 0,
            dataTransfer: 0,
            invocations: 0,
            dbQueries: 0,
            cacheHits: 0,
            cacheMisses: 0,
            externalApiCalls: 0,
        });
        const count = metrics.length;
        const result = {
            computeTime: sum.computeTime / count,
            memoryUsed: sum.memoryUsed / count,
            dataTransfer: sum.dataTransfer / count,
            invocations: sum.invocations / count,
        };
        if (sum.dbQueries)
            result.dbQueries = sum.dbQueries / count;
        if (sum.cacheHits)
            result.cacheHits = sum.cacheHits / count;
        if (sum.cacheMisses)
            result.cacheMisses = sum.cacheMisses / count;
        if (sum.externalApiCalls)
            result.externalApiCalls = sum.externalApiCalls / count;
        return result;
    }
    /**
     * Calculate compute cost.
     */
    calculateComputeCost(metrics, pricing) {
        if (this.provider === "aws" || this.provider === "azure") {
            // GB-seconds
            const gbSeconds = (metrics.memoryUsed / 1024) * (metrics.computeTime / 1000);
            return gbSeconds * (pricing.lambda?.compute || pricing.functions?.compute || 0);
        }
        else {
            // Per millisecond
            return metrics.computeTime * (pricing.workers?.compute || pricing.functions?.compute || 0);
        }
    }
    /**
     * Calculate memory cost.
     */
    calculateMemoryCost(metrics, pricing) {
        // Most providers include memory in compute cost
        return 0;
    }
    /**
     * Calculate data transfer cost.
     */
    calculateDataTransferCost(metrics, pricing) {
        const gbTransferred = metrics.dataTransfer / (1024 * 1024);
        return gbTransferred * (pricing.lambda?.dataTransfer ||
            pricing.workers?.dataTransfer ||
            pricing.functions?.dataTransfer ||
            0);
    }
    /**
     * Calculate database cost.
     */
    calculateDatabaseCost(metrics, pricing) {
        if (!metrics.dbQueries)
            return 0;
        const readCost = pricing.dynamodb?.read || pricing.kv?.read || 0;
        const writeCost = pricing.dynamodb?.write || pricing.kv?.write || 0;
        // Assume 80% reads, 20% writes
        return metrics.dbQueries * (readCost * 0.8 + writeCost * 0.2);
    }
    /**
     * Calculate cache cost.
     */
    calculateCacheCost(metrics, pricing) {
        if (!metrics.cacheHits || !metrics.cacheMisses)
            return 0;
        const hitCost = pricing.cache?.hit || 0;
        const missCost = pricing.cache?.miss || 0;
        return metrics.cacheHits * hitCost + metrics.cacheMisses * missCost;
    }
    /**
     * Generate optimization suggestions.
     */
    generateOptimizations(metrics, costs) {
        const optimizations = [];
        // Compute optimizations
        if (metrics.computeTime > 1000) {
            optimizations.push({
                category: "compute",
                potentialSavings: costs['compute'] * 0.3,
                suggestion: "Consider optimizing algorithm complexity or using caching",
                difficulty: "medium",
            });
        }
        // Memory optimizations
        if (metrics.memoryUsed > 512) {
            optimizations.push({
                category: "memory",
                potentialSavings: costs['memory'] * 0.2,
                suggestion: "Reduce memory usage by streaming data or using smaller data structures",
                difficulty: "medium",
            });
        }
        // Data transfer optimizations
        if (metrics.dataTransfer > 100 * 1024) {
            optimizations.push({
                category: "dataTransfer",
                potentialSavings: costs['dataTransfer'] * 0.4,
                suggestion: "Enable compression, use CDN, or reduce payload size",
                difficulty: "easy",
            });
        }
        // Database optimizations
        if (metrics.dbQueries && metrics.dbQueries > 10) {
            optimizations.push({
                category: "database",
                potentialSavings: costs['database'] * 0.5,
                suggestion: "Batch queries, use caching, or denormalize data",
                difficulty: "medium",
            });
        }
        // Cache optimizations
        if (metrics.cacheMisses && metrics.cacheHits) {
            const hitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses);
            if (hitRate < 0.8) {
                optimizations.push({
                    category: "cache",
                    potentialSavings: costs['cache'] * 0.3,
                    suggestion: `Improve cache hit rate (currently ${(hitRate * 100).toFixed(1)}%)`,
                    difficulty: "easy",
                });
            }
        }
        return optimizations.sort((a, b) => b.potentialSavings - a.potentialSavings);
    }
    /**
     * Get cost trends over time.
     */
    getCostTrends(route, days = 30) {
        const routeMetrics = this.metrics.get(route) || [];
        const trends = [];
        // Group by day
        const dailyMetrics = new Map();
        const now = Date.now();
        const cutoff = now - days * 24 * 60 * 60 * 1000;
        for (const metric of routeMetrics) {
            // Assuming metrics have timestamps (would need to add to CostMetrics type)
            const timestamp = now; // Placeholder
            if (timestamp < cutoff)
                continue;
            const date = new Date(timestamp).toISOString().split("T")[0];
            const dayMetrics = dailyMetrics.get(date) || [];
            dayMetrics.push(metric);
            dailyMetrics.set(date, dayMetrics);
        }
        // Calculate daily costs
        for (const [date, metrics] of dailyMetrics) {
            const estimate = this.estimateCost(route);
            trends.push({
                date,
                cost: estimate.total * metrics.length,
                breakdown: estimate.breakdown,
            });
        }
        return trends;
    }
    /**
     * Export cost data for analysis.
     */
    exportCostData() {
        const data = {};
        for (const [route, metrics] of this.metrics) {
            data[route] = {
                metrics,
                estimate: this.estimateCost(route),
            };
        }
        return data;
    }
}
/**
 * Global cost tracker instance.
 */
export const costTracker = new CostTracker();
//# sourceMappingURL=cost-tracking.js.map