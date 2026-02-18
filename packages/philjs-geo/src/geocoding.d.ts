/**
 * Geocoding and Reverse Geocoding
 *
 * Provider-agnostic geocoding API with support for multiple services
 */
export interface GeocodingResult {
    lat: number;
    lon: number;
    displayName: string;
    type: string;
    importance?: number;
    address?: AddressComponents;
    boundingBox?: [number, number, number, number];
}
export interface AddressComponents {
    houseNumber?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countryCode?: string;
}
export interface GeocodingOptions {
    limit?: number;
    language?: string;
    countryCode?: string;
    viewbox?: [number, number, number, number];
    bounded?: boolean;
}
export interface GeocodingProvider {
    name: string;
    geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]>;
    reverseGeocode(lat: number, lon: number, options?: GeocodingOptions): Promise<GeocodingResult | null>;
}
/**
 * Nominatim (OpenStreetMap) Geocoding Provider
 */
export declare class NominatimProvider implements GeocodingProvider {
    readonly name = "nominatim";
    private baseUrl;
    private userAgent;
    constructor(baseUrl?: string, userAgent?: string);
    geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]>;
    reverseGeocode(lat: number, lon: number, options?: GeocodingOptions): Promise<GeocodingResult | null>;
    private parseResult;
}
/**
 * Mapbox Geocoding Provider
 */
export declare class MapboxProvider implements GeocodingProvider {
    readonly name = "mapbox";
    private accessToken;
    private baseUrl;
    constructor(accessToken: string);
    geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]>;
    reverseGeocode(lat: number, lon: number, options?: GeocodingOptions): Promise<GeocodingResult | null>;
    private parseFeature;
}
/**
 * Geocoding utility class with caching
 */
export declare class Geocoder {
    private provider;
    private cache;
    private cacheTTL;
    constructor(provider: GeocodingProvider, cacheTTL?: number);
    geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]>;
    reverseGeocode(lat: number, lon: number, options?: GeocodingOptions): Promise<GeocodingResult | null>;
    clearCache(): void;
}
/**
 * Create a geocoder with the default provider (Nominatim)
 */
export declare function createGeocoder(provider?: GeocodingProvider): Geocoder;
/**
 * Quick geocode function
 */
export declare function geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]>;
/**
 * Quick reverse geocode function
 */
export declare function reverseGeocode(lat: number, lon: number, options?: GeocodingOptions): Promise<GeocodingResult | null>;
//# sourceMappingURL=geocoding.d.ts.map