/**
 * Geo-Routing for PhilJS Edge
 *
 * Intelligent request routing based on geographic location,
 * latency, and server health for optimal performance.
 */
// Haversine formula for calculating distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
export class GeoRouter {
    config;
    healthStatus = new Map();
    latencyHistory = new Map();
    constructor(config) {
        this.config = config;
        this.initializeHealthChecks();
    }
    initializeHealthChecks() {
        // Initialize health status for all nodes
        for (const node of this.config.nodes) {
            this.healthStatus.set(node.id, {
                healthy: node.healthy,
                lastCheck: Date.now(),
                latency: node.latency || 50,
            });
            this.latencyHistory.set(node.id, []);
        }
    }
    /**
     * Route a request to the optimal edge node
     */
    route(clientLocation) {
        const healthyNodes = this.getHealthyNodes();
        if (healthyNodes.length === 0) {
            const fallback = this.config.nodes.find(n => n.id === this.config.fallbackNode);
            if (fallback) {
                return {
                    node: fallback,
                    reason: 'All nodes unhealthy, using fallback',
                    alternatives: [],
                };
            }
            throw new Error('No healthy nodes available');
        }
        switch (this.config.strategy) {
            case 'latency':
                return this.routeByLatency(healthyNodes);
            case 'geo':
                return this.routeByGeography(healthyNodes, clientLocation);
            case 'weighted':
                return this.routeByWeight(healthyNodes);
            case 'failover':
                return this.routeByFailover(healthyNodes);
            case 'smart':
            default:
                return this.routeSmart(healthyNodes, clientLocation);
        }
    }
    routeByLatency(nodes) {
        // ES2023+: toSorted() for non-mutating sort
        const sorted = nodes.toSorted((a, b) => {
            const latencyA = this.healthStatus.get(a.id)?.latency || Infinity;
            const latencyB = this.healthStatus.get(b.id)?.latency || Infinity;
            return latencyA - latencyB;
        });
        const best = sorted[0];
        const bestLatency = this.healthStatus.get(best.id)?.latency;
        const result = {
            node: best,
            reason: `Lowest latency: ${bestLatency}ms`,
            alternatives: sorted.slice(1, 4),
        };
        if (bestLatency !== undefined) {
            result.latency = bestLatency;
        }
        return result;
    }
    routeByGeography(nodes, clientLocation) {
        const withDistance = nodes.map(node => ({
            node,
            distance: calculateDistance(clientLocation.latitude, clientLocation.longitude, node.location.latitude, node.location.longitude),
        }));
        // Apply geo preference
        let filtered = withDistance;
        if (this.config.geoPreference === 'same-country' && clientLocation.country) {
            const sameCountry = withDistance.filter(n => n.node.location.country === clientLocation.country);
            if (sameCountry.length > 0)
                filtered = sameCountry;
        }
        else if (this.config.geoPreference === 'same-continent' && clientLocation.continent) {
            const sameContinent = withDistance.filter(n => n.node.location.continent === clientLocation.continent);
            if (sameContinent.length > 0)
                filtered = sameContinent;
        }
        const sorted = filtered.sort((a, b) => a.distance - b.distance);
        const best = sorted[0];
        return {
            node: best.node,
            reason: `Nearest: ${best.distance.toFixed(0)}km away`,
            distance: best.distance,
            alternatives: sorted.slice(1, 4).map(s => s.node),
        };
    }
    routeByWeight(nodes) {
        const totalWeight = nodes.reduce((sum, n) => sum + n.weight, 0);
        let random = Math.random() * totalWeight;
        for (const node of nodes) {
            random -= node.weight;
            if (random <= 0) {
                return {
                    node,
                    reason: `Weighted selection (weight: ${node.weight}/${totalWeight})`,
                    alternatives: nodes.filter(n => n.id !== node.id).slice(0, 3),
                };
            }
        }
        return {
            node: nodes[0],
            reason: 'Weighted fallback',
            alternatives: nodes.slice(1, 4),
        };
    }
    routeByFailover(nodes) {
        // ES2023+: toSorted() for non-mutating sort
        // Sort by weight descending (primary nodes have higher weight)
        const sorted = nodes.toSorted((a, b) => b.weight - a.weight);
        return {
            node: sorted[0],
            reason: `Primary node (failover ready with ${sorted.length - 1} alternatives)`,
            alternatives: sorted.slice(1, 4),
        };
    }
    routeSmart(nodes, clientLocation) {
        // Calculate composite score for each node
        const scored = nodes.map(node => {
            const distance = calculateDistance(clientLocation.latitude, clientLocation.longitude, node.location.latitude, node.location.longitude);
            const latency = this.healthStatus.get(node.id)?.latency || 100;
            const weight = node.weight;
            // Normalize and weight factors
            const maxDistance = 20000; // km
            const maxLatency = 500; // ms
            const maxWeight = 100;
            const distanceScore = 1 - distance / maxDistance;
            const latencyScore = 1 - latency / maxLatency;
            const weightScore = weight / maxWeight;
            // Composite score: 40% latency, 35% distance, 25% weight
            const score = latencyScore * 0.4 + distanceScore * 0.35 + weightScore * 0.25;
            return { node, score, distance, latency };
        });
        const sorted = scored.sort((a, b) => b.score - a.score);
        const best = sorted[0];
        return {
            node: best.node,
            reason: `Smart routing (score: ${(best.score * 100).toFixed(1)}%, ${best.distance.toFixed(0)}km, ${best.latency}ms)`,
            latency: best.latency,
            distance: best.distance,
            alternatives: sorted.slice(1, 4).map(s => s.node),
        };
    }
    getHealthyNodes() {
        return this.config.nodes.filter(node => {
            const status = this.healthStatus.get(node.id);
            return status?.healthy !== false;
        });
    }
    /**
     * Update node health status
     */
    updateHealth(nodeId, healthy, latency) {
        const status = this.healthStatus.get(nodeId);
        if (status) {
            status.healthy = healthy;
            status.lastCheck = Date.now();
            if (latency !== undefined) {
                status.latency = latency;
                const history = this.latencyHistory.get(nodeId) || [];
                history.push(latency);
                if (history.length > 100)
                    history.shift();
                this.latencyHistory.set(nodeId, history);
            }
        }
    }
    /**
     * Run health check on all nodes
     */
    async healthCheck() {
        const results = new Map();
        await Promise.all(this.config.nodes.map(async (node) => {
            const start = Date.now();
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(`${node.endpoint}/health`, {
                    method: 'HEAD',
                    signal: controller.signal,
                });
                clearTimeout(timeout);
                const latency = Date.now() - start;
                const healthy = response.ok;
                this.updateHealth(node.id, healthy, latency);
                results.set(node.id, healthy);
            }
            catch {
                this.updateHealth(node.id, false);
                results.set(node.id, false);
            }
        }));
        return results;
    }
    /**
     * Get average latency for a node
     */
    getAverageLatency(nodeId) {
        const history = this.latencyHistory.get(nodeId);
        if (!history || history.length === 0)
            return undefined;
        return history.reduce((sum, l) => sum + l, 0) / history.length;
    }
    /**
     * Get routing statistics
     */
    getStats() {
        const nodeStats = this.config.nodes.map(node => ({
            id: node.id,
            healthy: this.healthStatus.get(node.id)?.healthy || false,
            avgLatency: this.getAverageLatency(node.id) || 0,
        }));
        const healthyNodes = nodeStats.filter(n => n.healthy).length;
        const avgLatency = nodeStats.reduce((sum, n) => sum + n.avgLatency, 0) / nodeStats.length;
        return {
            totalNodes: this.config.nodes.length,
            healthyNodes,
            avgLatency,
            nodeStats,
        };
    }
}
/**
 * Create a geo router instance
 */
export function createGeoRouter(config) {
    return new GeoRouter(config);
}
/**
 * Get client location from request headers
 */
export function getClientLocation(request) {
    // Try Cloudflare headers
    const cfLat = request.headers.get('cf-iplatitude');
    const cfLon = request.headers.get('cf-iplongitude');
    if (cfLat && cfLon) {
        const loc = {
            latitude: parseFloat(cfLat),
            longitude: parseFloat(cfLon),
        };
        const cfCountry = request.headers.get('cf-ipcountry');
        if (cfCountry)
            loc.country = cfCountry;
        const cfCity = request.headers.get('cf-ipcity');
        if (cfCity)
            loc.city = cfCity;
        const cfContinent = request.headers.get('cf-ipcontinent');
        if (cfContinent)
            loc.continent = cfContinent;
        return loc;
    }
    // Try Vercel headers
    const vercelLat = request.headers.get('x-vercel-ip-latitude');
    const vercelLon = request.headers.get('x-vercel-ip-longitude');
    if (vercelLat && vercelLon) {
        const loc = {
            latitude: parseFloat(vercelLat),
            longitude: parseFloat(vercelLon),
        };
        const vercelCountry = request.headers.get('x-vercel-ip-country');
        if (vercelCountry)
            loc.country = vercelCountry;
        const vercelCity = request.headers.get('x-vercel-ip-city');
        if (vercelCity)
            loc.city = vercelCity;
        return loc;
    }
    // Try Fastly headers
    const fastlyGeo = request.headers.get('fastly-client-ip-geo');
    if (fastlyGeo) {
        try {
            const geo = JSON.parse(fastlyGeo);
            return {
                latitude: geo.latitude,
                longitude: geo.longitude,
                country: geo.country_code,
                city: geo.city,
                region: geo.region,
            };
        }
        catch {
            // Invalid JSON
        }
    }
    return null;
}
/**
 * Predefined edge node locations for major providers
 */
export const EDGE_LOCATIONS = {
    cloudflare: [
        { id: 'cf-iad', name: 'Washington DC', location: { latitude: 38.9072, longitude: -77.0369, country: 'US', continent: 'NA' } },
        { id: 'cf-sfo', name: 'San Francisco', location: { latitude: 37.7749, longitude: -122.4194, country: 'US', continent: 'NA' } },
        { id: 'cf-lhr', name: 'London', location: { latitude: 51.5074, longitude: -0.1278, country: 'GB', continent: 'EU' } },
        { id: 'cf-fra', name: 'Frankfurt', location: { latitude: 50.1109, longitude: 8.6821, country: 'DE', continent: 'EU' } },
        { id: 'cf-nrt', name: 'Tokyo', location: { latitude: 35.6762, longitude: 139.6503, country: 'JP', continent: 'AS' } },
        { id: 'cf-sin', name: 'Singapore', location: { latitude: 1.3521, longitude: 103.8198, country: 'SG', continent: 'AS' } },
        { id: 'cf-syd', name: 'Sydney', location: { latitude: -33.8688, longitude: 151.2093, country: 'AU', continent: 'OC' } },
        { id: 'cf-gru', name: 'São Paulo', location: { latitude: -23.5505, longitude: -46.6333, country: 'BR', continent: 'SA' } },
    ],
    vercel: [
        { id: 'vercel-iad1', name: 'Washington DC', location: { latitude: 38.9072, longitude: -77.0369, country: 'US', continent: 'NA' } },
        { id: 'vercel-sfo1', name: 'San Francisco', location: { latitude: 37.7749, longitude: -122.4194, country: 'US', continent: 'NA' } },
        { id: 'vercel-lhr1', name: 'London', location: { latitude: 51.5074, longitude: -0.1278, country: 'GB', continent: 'EU' } },
        { id: 'vercel-cdg1', name: 'Paris', location: { latitude: 48.8566, longitude: 2.3522, country: 'FR', continent: 'EU' } },
        { id: 'vercel-hnd1', name: 'Tokyo', location: { latitude: 35.6762, longitude: 139.6503, country: 'JP', continent: 'AS' } },
        { id: 'vercel-sin1', name: 'Singapore', location: { latitude: 1.3521, longitude: 103.8198, country: 'SG', continent: 'AS' } },
        { id: 'vercel-syd1', name: 'Sydney', location: { latitude: -33.8688, longitude: 151.2093, country: 'AU', continent: 'OC' } },
    ],
};
//# sourceMappingURL=geo-routing.js.map