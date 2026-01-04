/**
 * PhilJS Edge Geo - Geolocation-Based Routing at the Edge
 *
 * Provides geolocation capabilities across edge platforms:
 * - IP-based geolocation
 * - Region-aware routing
 * - Latency-based routing
 * - Geo-blocking and compliance
 * - Multi-region deployments
 */
export interface GeoLocation {
    /** IP address */
    ip?: string;
    /** Country code (ISO 3166-1 alpha-2) */
    country?: string;
    /** Country name */
    countryName?: string;
    /** Region/state code */
    region?: string;
    /** Region/state name */
    regionName?: string;
    /** City name */
    city?: string;
    /** Postal/ZIP code */
    postalCode?: string;
    /** Latitude */
    latitude?: number;
    /** Longitude */
    longitude?: number;
    /** Timezone */
    timezone?: string;
    /** Continent code */
    continent?: string;
    /** Continent name */
    continentName?: string;
    /** EU member state */
    isEU?: boolean;
    /** ASN information */
    asn?: {
        number: number;
        name: string;
        domain?: string;
    };
    /** Metro/DMA code (US only) */
    metroCode?: number;
    /** Cloudflare colo ID */
    colo?: string;
}
export interface GeoRoutingRule {
    /** Rule name for logging */
    name?: string;
    /** Countries to match (ISO 3166-1 alpha-2) */
    countries?: string[];
    /** Continents to match */
    continents?: string[];
    /** Regions to match (e.g., "US-CA") */
    regions?: string[];
    /** Cities to match */
    cities?: string[];
    /** Whether to block or allow */
    action: 'allow' | 'block' | 'redirect' | 'rewrite';
    /** Redirect URL (for redirect action) */
    redirectUrl?: string;
    /** Rewrite path (for rewrite action) */
    rewritePath?: string;
    /** Priority (higher = checked first) */
    priority?: number;
}
export interface GeoRoutingConfig {
    /** Default action if no rules match */
    defaultAction?: 'allow' | 'block';
    /** Rules to apply */
    rules: GeoRoutingRule[];
    /** Blocked response status code */
    blockedStatus?: number;
    /** Blocked response body */
    blockedBody?: string;
    /** Custom headers for geo info */
    exposeHeaders?: boolean;
}
export interface RegionConfig {
    /** Region identifier */
    id: string;
    /** Region name */
    name: string;
    /** Countries served by this region */
    countries: string[];
    /** Origin URL for this region */
    originUrl: string;
    /** Priority weight (for load balancing) */
    weight?: number;
    /** Whether region is healthy */
    healthy?: boolean;
}
export interface LatencyRoutingConfig {
    /** Available regions */
    regions: RegionConfig[];
    /** Fallback region if primary is unhealthy */
    fallbackRegion?: string;
    /** Health check interval in ms */
    healthCheckInterval?: number;
    /** Health check timeout in ms */
    healthCheckTimeout?: number;
}
/**
 * Extract geolocation from request based on edge platform
 */
export declare function getGeoLocation(request: Request, platformContext?: unknown): GeoLocation;
/**
 * Get client IP address from request
 */
export declare function getClientIP(request: Request): string | undefined;
/**
 * Apply geo routing rules
 */
export declare function applyGeoRouting(request: Request, geo: GeoLocation, config: GeoRoutingConfig): {
    action: 'allow' | 'block' | 'redirect' | 'rewrite';
    url?: string;
};
/**
 * Create a geo routing middleware
 */
export declare function createGeoRoutingMiddleware(config: GeoRoutingConfig): (request: Request, context?: unknown) => Response | null;
/**
 * Find the best region for a request based on location
 */
export declare function findBestRegion(geo: GeoLocation, regions: RegionConfig[]): RegionConfig | undefined;
/**
 * Create latency-based routing handler
 */
export declare function createLatencyRouter(config: LatencyRoutingConfig): {
    route: (request: Request, context?: unknown) => RegionConfig;
    getRegionHealth: () => Map<string, boolean>;
    setRegionHealth: (regionId: string, healthy: boolean) => void;
};
export interface GeoABTestConfig {
    /** Test name */
    name: string;
    /** Variants and their weights */
    variants: Array<{
        id: string;
        weight: number;
        /** Countries for this variant */
        countries?: string[];
        /** Continents for this variant */
        continents?: string[];
    }>;
    /** Cookie name for persistence */
    cookieName?: string;
    /** Cookie max age in seconds */
    cookieMaxAge?: number;
}
/**
 * Select A/B test variant based on geo
 */
export declare function selectGeoVariant(request: Request, geo: GeoLocation, config: GeoABTestConfig): {
    variant: string;
    isNew: boolean;
};
/**
 * Create cookie header for A/B variant
 */
export declare function createVariantCookie(config: GeoABTestConfig, variant: string): string;
/**
 * Calculate distance between two points (Haversine formula)
 */
export declare function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
/**
 * Find nearest location from a list
 */
export declare function findNearestLocation<T extends {
    latitude: number;
    longitude: number;
}>(userLat: number, userLon: number, locations: T[]): T | undefined;
/**
 * Add geo information as response headers
 */
export declare function addGeoHeaders(headers: Headers, geo: GeoLocation): void;
declare const _default: {
    getGeoLocation: typeof getGeoLocation;
    getClientIP: typeof getClientIP;
    applyGeoRouting: typeof applyGeoRouting;
    createGeoRoutingMiddleware: typeof createGeoRoutingMiddleware;
    findBestRegion: typeof findBestRegion;
    createLatencyRouter: typeof createLatencyRouter;
    selectGeoVariant: typeof selectGeoVariant;
    createVariantCookie: typeof createVariantCookie;
    calculateDistance: typeof calculateDistance;
    findNearestLocation: typeof findNearestLocation;
    addGeoHeaders: typeof addGeoHeaders;
    EU_COUNTRIES: string[];
    CONTINENT_COUNTRIES: Record<string, string[]>;
    CONTINENT_NAMES: Record<string, string>;
};
export default _default;
//# sourceMappingURL=geo.d.ts.map