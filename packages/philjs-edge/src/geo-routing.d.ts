/**
 * Geo-Routing for PhilJS Edge
 *
 * Intelligent request routing based on geographic location,
 * latency, and server health for optimal performance.
 */
export interface GeoLocation {
    latitude: number;
    longitude: number;
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    continent?: string;
}
export interface EdgeNode {
    id: string;
    name: string;
    location: GeoLocation;
    provider: 'cloudflare' | 'vercel' | 'deno' | 'netlify' | 'custom';
    endpoint: string;
    weight: number;
    healthy: boolean;
    latency?: number;
    capacity?: number;
    features?: string[];
}
export interface RoutingConfig {
    nodes: EdgeNode[];
    strategy: 'latency' | 'geo' | 'weighted' | 'failover' | 'smart';
    fallbackNode?: string;
    healthCheckInterval?: number;
    latencyThreshold?: number;
    geoPreference?: 'nearest' | 'same-country' | 'same-continent';
}
export interface RoutingDecision {
    node: EdgeNode;
    reason: string;
    latency?: number;
    distance?: number;
    alternatives: EdgeNode[];
}
export declare class GeoRouter {
    private config;
    private healthStatus;
    private latencyHistory;
    constructor(config: RoutingConfig);
    private initializeHealthChecks;
    /**
     * Route a request to the optimal edge node
     */
    route(clientLocation: GeoLocation): RoutingDecision;
    private routeByLatency;
    private routeByGeography;
    private routeByWeight;
    private routeByFailover;
    private routeSmart;
    private getHealthyNodes;
    /**
     * Update node health status
     */
    updateHealth(nodeId: string, healthy: boolean, latency?: number): void;
    /**
     * Run health check on all nodes
     */
    healthCheck(): Promise<Map<string, boolean>>;
    /**
     * Get average latency for a node
     */
    getAverageLatency(nodeId: string): number | undefined;
    /**
     * Get routing statistics
     */
    getStats(): {
        totalNodes: number;
        healthyNodes: number;
        avgLatency: number;
        nodeStats: Array<{
            id: string;
            healthy: boolean;
            avgLatency: number;
        }>;
    };
}
/**
 * Create a geo router instance
 */
export declare function createGeoRouter(config: RoutingConfig): GeoRouter;
/**
 * Get client location from request headers
 */
export declare function getClientLocation(request: Request): GeoLocation | null;
/**
 * Predefined edge node locations for major providers
 */
export declare const EDGE_LOCATIONS: {
    readonly cloudflare: readonly [{
        readonly id: "cf-iad";
        readonly name: "Washington DC";
        readonly location: {
            readonly latitude: 38.9072;
            readonly longitude: -77.0369;
            readonly country: "US";
            readonly continent: "NA";
        };
    }, {
        readonly id: "cf-sfo";
        readonly name: "San Francisco";
        readonly location: {
            readonly latitude: 37.7749;
            readonly longitude: -122.4194;
            readonly country: "US";
            readonly continent: "NA";
        };
    }, {
        readonly id: "cf-lhr";
        readonly name: "London";
        readonly location: {
            readonly latitude: 51.5074;
            readonly longitude: -0.1278;
            readonly country: "GB";
            readonly continent: "EU";
        };
    }, {
        readonly id: "cf-fra";
        readonly name: "Frankfurt";
        readonly location: {
            readonly latitude: 50.1109;
            readonly longitude: 8.6821;
            readonly country: "DE";
            readonly continent: "EU";
        };
    }, {
        readonly id: "cf-nrt";
        readonly name: "Tokyo";
        readonly location: {
            readonly latitude: 35.6762;
            readonly longitude: 139.6503;
            readonly country: "JP";
            readonly continent: "AS";
        };
    }, {
        readonly id: "cf-sin";
        readonly name: "Singapore";
        readonly location: {
            readonly latitude: 1.3521;
            readonly longitude: 103.8198;
            readonly country: "SG";
            readonly continent: "AS";
        };
    }, {
        readonly id: "cf-syd";
        readonly name: "Sydney";
        readonly location: {
            readonly latitude: -33.8688;
            readonly longitude: 151.2093;
            readonly country: "AU";
            readonly continent: "OC";
        };
    }, {
        readonly id: "cf-gru";
        readonly name: "São Paulo";
        readonly location: {
            readonly latitude: -23.5505;
            readonly longitude: -46.6333;
            readonly country: "BR";
            readonly continent: "SA";
        };
    }];
    readonly vercel: readonly [{
        readonly id: "vercel-iad1";
        readonly name: "Washington DC";
        readonly location: {
            readonly latitude: 38.9072;
            readonly longitude: -77.0369;
            readonly country: "US";
            readonly continent: "NA";
        };
    }, {
        readonly id: "vercel-sfo1";
        readonly name: "San Francisco";
        readonly location: {
            readonly latitude: 37.7749;
            readonly longitude: -122.4194;
            readonly country: "US";
            readonly continent: "NA";
        };
    }, {
        readonly id: "vercel-lhr1";
        readonly name: "London";
        readonly location: {
            readonly latitude: 51.5074;
            readonly longitude: -0.1278;
            readonly country: "GB";
            readonly continent: "EU";
        };
    }, {
        readonly id: "vercel-cdg1";
        readonly name: "Paris";
        readonly location: {
            readonly latitude: 48.8566;
            readonly longitude: 2.3522;
            readonly country: "FR";
            readonly continent: "EU";
        };
    }, {
        readonly id: "vercel-hnd1";
        readonly name: "Tokyo";
        readonly location: {
            readonly latitude: 35.6762;
            readonly longitude: 139.6503;
            readonly country: "JP";
            readonly continent: "AS";
        };
    }, {
        readonly id: "vercel-sin1";
        readonly name: "Singapore";
        readonly location: {
            readonly latitude: 1.3521;
            readonly longitude: 103.8198;
            readonly country: "SG";
            readonly continent: "AS";
        };
    }, {
        readonly id: "vercel-syd1";
        readonly name: "Sydney";
        readonly location: {
            readonly latitude: -33.8688;
            readonly longitude: 151.2093;
            readonly country: "AU";
            readonly continent: "OC";
        };
    }];
};
//# sourceMappingURL=geo-routing.d.ts.map