/**
 * Geocoding and Reverse Geocoding
 *
 * Provider-agnostic geocoding API with support for multiple services
 */
/**
 * Nominatim (OpenStreetMap) Geocoding Provider
 */
export class NominatimProvider {
    name = 'nominatim';
    baseUrl;
    userAgent;
    constructor(baseUrl = 'https://nominatim.openstreetmap.org', userAgent = 'PhilJS-Geo/1.0') {
        this.baseUrl = baseUrl;
        this.userAgent = userAgent;
    }
    async geocode(query, options = {}) {
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            addressdetails: '1',
            limit: String(options.limit ?? 5),
        });
        if (options.language)
            params.set('accept-language', options.language);
        if (options.countryCode)
            params.set('countrycodes', options.countryCode);
        if (options.viewbox)
            params.set('viewbox', options.viewbox.join(','));
        if (options.bounded)
            params.set('bounded', '1');
        const response = await fetch(`${this.baseUrl}/search?${params}`, {
            headers: { 'User-Agent': this.userAgent },
        });
        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
        }
        const data = await response.json();
        return data.map((item) => this.parseResult(item));
    }
    async reverseGeocode(lat, lon, options = {}) {
        const params = new URLSearchParams({
            lat: String(lat),
            lon: String(lon),
            format: 'json',
            addressdetails: '1',
        });
        if (options.language)
            params.set('accept-language', options.language);
        const response = await fetch(`${this.baseUrl}/reverse?${params}`, {
            headers: { 'User-Agent': this.userAgent },
        });
        if (!response.ok) {
            if (response.status === 404)
                return null;
            throw new Error(`Reverse geocoding failed: ${response.status}`);
        }
        const data = await response.json();
        if (!data.lat || !data.lon)
            return null;
        return this.parseResult(data);
    }
    parseResult(item) {
        const addr = item.address ?? {};
        return {
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            displayName: item.display_name,
            type: item.type,
            importance: item.importance,
            boundingBox: item.boundingbox
                ? [
                    parseFloat(item.boundingbox[2] ?? '0'),
                    parseFloat(item.boundingbox[0] ?? '0'),
                    parseFloat(item.boundingbox[3] ?? '0'),
                    parseFloat(item.boundingbox[1] ?? '0'),
                ]
                : undefined,
            address: {
                houseNumber: addr.house_number,
                road: addr.road,
                neighbourhood: addr.neighbourhood,
                suburb: addr.suburb,
                city: addr.city ?? addr.town ?? addr.village,
                county: addr.county,
                state: addr.state,
                postcode: addr.postcode,
                country: addr.country,
                countryCode: addr.country_code,
            },
        };
    }
}
/**
 * Mapbox Geocoding Provider
 */
export class MapboxProvider {
    name = 'mapbox';
    accessToken;
    baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
    constructor(accessToken) {
        this.accessToken = accessToken;
    }
    async geocode(query, options = {}) {
        const params = new URLSearchParams({
            access_token: this.accessToken,
            limit: String(options.limit ?? 5),
        });
        if (options.language)
            params.set('language', options.language);
        if (options.countryCode)
            params.set('country', options.countryCode);
        if (options.viewbox)
            params.set('bbox', options.viewbox.join(','));
        const response = await fetch(`${this.baseUrl}/${encodeURIComponent(query)}.json?${params}`);
        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
        }
        const data = await response.json();
        return data.features.map((feature) => this.parseFeature(feature));
    }
    async reverseGeocode(lat, lon, options = {}) {
        const params = new URLSearchParams({
            access_token: this.accessToken,
        });
        if (options.language)
            params.set('language', options.language);
        const response = await fetch(`${this.baseUrl}/${lon},${lat}.json?${params}`);
        if (!response.ok) {
            throw new Error(`Reverse geocoding failed: ${response.status}`);
        }
        const data = await response.json();
        const feature = data.features[0];
        if (!feature)
            return null;
        return this.parseFeature(feature);
    }
    parseFeature(feature) {
        const [lon, lat] = feature.center;
        const context = feature.context ?? [];
        const findContext = (type) => context.find((c) => c.id.startsWith(type))?.text;
        return {
            lat: lat ?? 0,
            lon: lon ?? 0,
            displayName: feature.place_name,
            type: feature.place_type[0] ?? 'unknown',
            address: {
                houseNumber: feature.address,
                road: feature.text,
                city: findContext('place'),
                state: findContext('region'),
                postcode: findContext('postcode'),
                country: findContext('country'),
            },
            boundingBox: feature.bbox,
        };
    }
}
/**
 * Geocoding utility class with caching
 */
export class Geocoder {
    provider;
    cache = new Map();
    cacheTTL;
    constructor(provider, cacheTTL = 3600000) {
        this.provider = provider;
        this.cacheTTL = cacheTTL;
    }
    async geocode(query, options) {
        const cacheKey = `geocode:${query}:${JSON.stringify(options ?? {})}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.result;
        }
        const result = await this.provider.geocode(query, options);
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
    }
    async reverseGeocode(lat, lon, options) {
        // Round coordinates to reduce cache misses
        const roundedLat = Math.round(lat * 100000) / 100000;
        const roundedLon = Math.round(lon * 100000) / 100000;
        const cacheKey = `reverse:${roundedLat}:${roundedLon}:${JSON.stringify(options ?? {})}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.result[0] ?? null;
        }
        const result = await this.provider.reverseGeocode(lat, lon, options);
        if (result) {
            this.cache.set(cacheKey, { result: [result], timestamp: Date.now() });
        }
        return result;
    }
    clearCache() {
        this.cache.clear();
    }
}
/**
 * Create a geocoder with the default provider (Nominatim)
 */
export function createGeocoder(provider) {
    return new Geocoder(provider ?? new NominatimProvider());
}
/**
 * Quick geocode function
 */
export async function geocode(query, options) {
    const geocoder = createGeocoder();
    return geocoder.geocode(query, options);
}
/**
 * Quick reverse geocode function
 */
export async function reverseGeocode(lat, lon, options) {
    const geocoder = createGeocoder();
    return geocoder.reverseGeocode(lat, lon, options);
}
//# sourceMappingURL=geocoding.js.map