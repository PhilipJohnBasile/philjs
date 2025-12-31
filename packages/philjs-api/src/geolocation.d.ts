/**
 * PhilJS Geolocation Routing
 *
 * Geolocation-based routing and utilities for edge runtimes.
 * Supports Cloudflare Workers, Vercel Edge, Deno Deploy, and custom providers.
 *
 * Features:
 * - Country/region/city detection
 * - Geo-based redirects
 * - Language detection from IP
 * - useGeolocation() hook for client-side
 * - Multi-provider support
 */
import type { EdgeMiddleware, GeolocationData } from './edge-middleware.js';
export interface GeoLocationProvider {
    name: string;
    detect(request: Request): Promise<GeolocationData> | GeolocationData;
}
export interface GeoRedirectRule {
    /** Countries to match (ISO 3166-1 alpha-2) */
    countries?: string[];
    /** Regions to match */
    regions?: string[];
    /** Cities to match */
    cities?: string[];
    /** Continents to match */
    continents?: string[];
    /** Destination URL */
    destination: string;
    /** Redirect status code */
    status?: 301 | 302 | 307 | 308;
    /** Exclude patterns */
    exclude?: string[];
}
export interface GeoLanguageMapping {
    /** Country code to language mapping */
    [countryCode: string]: string | string[];
}
export interface GeolocationOptions {
    /** Custom provider */
    provider?: GeoLocationProvider;
    /** Fallback geolocation */
    fallback?: GeolocationData;
    /** Add geo headers to response */
    addHeaders?: boolean;
}
/**
 * Cloudflare Workers geolocation provider
 */
export declare const CloudflareProvider: GeoLocationProvider;
/**
 * Vercel Edge geolocation provider
 */
export declare const VercelProvider: GeoLocationProvider;
/**
 * Generic Cloudflare proxy provider (when behind CF but not Workers)
 */
export declare const CloudflareProxyProvider: GeoLocationProvider;
/**
 * Deno Deploy geolocation provider
 */
export declare const DenoDeployProvider: GeoLocationProvider;
/**
 * Auto-detect geolocation provider
 */
export declare function detectGeolocation(request: Request, options?: GeolocationOptions): Promise<GeolocationData>;
/**
 * Geolocation middleware - adds geo data to context
 */
export declare function geolocationMiddleware(options?: GeolocationOptions): EdgeMiddleware;
/**
 * Redirect based on geolocation
 */
export declare function geoRedirectMiddleware(rules: GeoRedirectRule[]): EdgeMiddleware;
/**
 * Simplified geo redirect helper
 */
export declare function redirectByCountry(mapping: Record<string, string>, options?: {
    status?: 301 | 302 | 307 | 308;
    exclude?: string[];
}): EdgeMiddleware;
/**
 * Default country to language mapping
 */
export declare const DEFAULT_LANGUAGE_MAP: GeoLanguageMapping;
/**
 * Detect language from geolocation
 */
export declare function detectLanguageFromGeo(geo: GeolocationData, languageMap?: GeoLanguageMapping): string | string[] | undefined;
/**
 * Detect language from Accept-Language header
 */
export declare function detectLanguageFromHeader(acceptLanguage: string | null): string[];
/**
 * Combine geo and header language detection
 */
export declare function detectLanguage(request: Request, geo: GeolocationData, languageMap?: GeoLanguageMapping): string | undefined;
/**
 * Language detection middleware
 */
export declare function languageDetectionMiddleware(options?: {
    languageMap?: GeoLanguageMapping;
    cookieName?: string;
    headerName?: string;
}): EdgeMiddleware;
/**
 * Redirect to localized version based on detected language
 */
export declare function localizedRedirectMiddleware(options?: {
    supportedLocales: string[];
    defaultLocale: string;
    languageMap?: GeoLanguageMapping;
    cookieName?: string;
}): EdgeMiddleware;
/**
 * Calculate distance between two geo points (in km)
 */
export declare function geoDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
/**
 * Check if point is within radius of center
 */
export declare function isWithinRadius(centerLat: number, centerLon: number, pointLat: number, pointLon: number, radiusKm: number): boolean;
/**
 * useGeolocation hook for client-side
 *
 * Note: This retrieves server-detected geo from cookies/headers,
 * not browser geolocation API.
 */
export declare function useGeolocation(): {
    geo: GeolocationData | null;
    language: string | null;
    loading: boolean;
};
/**
 * Inject geolocation data into HTML
 */
export declare function injectGeolocationData(html: string, geo: GeolocationData): string;
//# sourceMappingURL=geolocation.d.ts.map