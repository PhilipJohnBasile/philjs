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
  viewbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
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
export class NominatimProvider implements GeocodingProvider {
  readonly name = 'nominatim';
  private baseUrl: string;
  private userAgent: string;

  constructor(baseUrl = 'https://nominatim.openstreetmap.org', userAgent = 'PhilJS-Geo/1.0') {
    this.baseUrl = baseUrl;
    this.userAgent = userAgent;
  }

  async geocode(query: string, options: GeocodingOptions = {}): Promise<GeocodingResult[]> {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: String(options.limit ?? 5),
    });

    if (options.language) params.set('accept-language', options.language);
    if (options.countryCode) params.set('countrycodes', options.countryCode);
    if (options.viewbox) params.set('viewbox', options.viewbox.join(','));
    if (options.bounded) params.set('bounded', '1');

    const response = await fetch(`${this.baseUrl}/search?${params}`, {
      headers: { 'User-Agent': this.userAgent },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json() as NominatimResult[];

    return data.map((item) => this.parseResult(item));
  }

  async reverseGeocode(lat: number, lon: number, options: GeocodingOptions = {}): Promise<GeocodingResult | null> {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: 'json',
      addressdetails: '1',
    });

    if (options.language) params.set('accept-language', options.language);

    const response = await fetch(`${this.baseUrl}/reverse?${params}`, {
      headers: { 'User-Agent': this.userAgent },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json() as NominatimResult;
    if (!data.lat || !data.lon) return null;

    return this.parseResult(data);
  }

  private parseResult(item: NominatimResult): GeocodingResult {
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

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance?: number;
  boundingbox?: [string, string, string, string];
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

/**
 * Mapbox Geocoding Provider
 */
export class MapboxProvider implements GeocodingProvider {
  readonly name = 'mapbox';
  private accessToken: string;
  private baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async geocode(query: string, options: GeocodingOptions = {}): Promise<GeocodingResult[]> {
    const params = new URLSearchParams({
      access_token: this.accessToken,
      limit: String(options.limit ?? 5),
    });

    if (options.language) params.set('language', options.language);
    if (options.countryCode) params.set('country', options.countryCode);
    if (options.viewbox) params.set('bbox', options.viewbox.join(','));

    const response = await fetch(
      `${this.baseUrl}/${encodeURIComponent(query)}.json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json() as MapboxResponse;

    return data.features.map((feature) => this.parseFeature(feature));
  }

  async reverseGeocode(lat: number, lon: number, options: GeocodingOptions = {}): Promise<GeocodingResult | null> {
    const params = new URLSearchParams({
      access_token: this.accessToken,
    });

    if (options.language) params.set('language', options.language);

    const response = await fetch(
      `${this.baseUrl}/${lon},${lat}.json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json() as MapboxResponse;
    const feature = data.features[0];
    if (!feature) return null;

    return this.parseFeature(feature);
  }

  private parseFeature(feature: MapboxFeature): GeocodingResult {
    const [lon, lat] = feature.center;
    const context = feature.context ?? [];

    const findContext = (type: string) =>
      context.find((c) => c.id.startsWith(type))?.text;

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

interface MapboxResponse {
  features: MapboxFeature[];
}

interface MapboxFeature {
  center: [number, number];
  place_name: string;
  place_type: string[];
  text: string;
  address?: string;
  bbox?: [number, number, number, number];
  context?: Array<{ id: string; text: string }>;
}

/**
 * Geocoding utility class with caching
 */
export class Geocoder {
  private provider: GeocodingProvider;
  private cache = new Map<string, { result: GeocodingResult[]; timestamp: number }>();
  private cacheTTL: number;

  constructor(provider: GeocodingProvider, cacheTTL = 3600000) {
    this.provider = provider;
    this.cacheTTL = cacheTTL;
  }

  async geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]> {
    const cacheKey = `geocode:${query}:${JSON.stringify(options ?? {})}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.result;
    }

    const result = await this.provider.geocode(query, options);
    this.cache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  }

  async reverseGeocode(lat: number, lon: number, options?: GeocodingOptions): Promise<GeocodingResult | null> {
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

  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Create a geocoder with the default provider (Nominatim)
 */
export function createGeocoder(provider?: GeocodingProvider): Geocoder {
  return new Geocoder(provider ?? new NominatimProvider());
}

/**
 * Quick geocode function
 */
export async function geocode(
  query: string,
  options?: GeocodingOptions
): Promise<GeocodingResult[]> {
  const geocoder = createGeocoder();
  return geocoder.geocode(query, options);
}

/**
 * Quick reverse geocode function
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  options?: GeocodingOptions
): Promise<GeocodingResult | null> {
  const geocoder = createGeocoder();
  return geocoder.reverseGeocode(lat, lon, options);
}
