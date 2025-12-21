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

import { detectEdgePlatform, type EdgePlatform, type EdgeRegion } from './edge-runtime';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Country and Continent Data
// ============================================================================

const CONTINENT_COUNTRIES: Record<string, string[]> = {
  AF: ['DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'CI', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'],
  AN: ['AQ'],
  AS: ['AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'CY', 'GE', 'HK', 'IN', 'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KW', 'KG', 'LA', 'LB', 'MO', 'MY', 'MV', 'MN', 'MM', 'NP', 'KP', 'OM', 'PK', 'PS', 'PH', 'QA', 'SA', 'SG', 'KR', 'LK', 'SY', 'TW', 'TJ', 'TH', 'TL', 'TR', 'TM', 'AE', 'UZ', 'VN', 'YE'],
  EU: ['AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FO', 'FI', 'FR', 'DE', 'GI', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL', 'MK', 'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'UA', 'GB', 'VA'],
  NA: ['AG', 'BS', 'BB', 'BZ', 'CA', 'CR', 'CU', 'DM', 'DO', 'SV', 'GD', 'GT', 'HT', 'HN', 'JM', 'MX', 'NI', 'PA', 'KN', 'LC', 'VC', 'TT', 'US'],
  OC: ['AS', 'AU', 'CK', 'FJ', 'PF', 'GU', 'KI', 'MH', 'FM', 'NR', 'NC', 'NZ', 'NU', 'NF', 'MP', 'PW', 'PG', 'WS', 'SB', 'TO', 'TV', 'VU'],
  SA: ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'FK', 'GF', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'],
};

const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
]);

const CONTINENT_NAMES: Record<string, string> = {
  AF: 'Africa',
  AN: 'Antarctica',
  AS: 'Asia',
  EU: 'Europe',
  NA: 'North America',
  OC: 'Oceania',
  SA: 'South America',
};

// ============================================================================
// Geolocation Extraction
// ============================================================================

/**
 * Extract geolocation from request based on edge platform
 */
export function getGeoLocation(request: Request, platformContext?: unknown): GeoLocation {
  const platform = detectEdgePlatform();
  const geo: GeoLocation = {};

  // Try to get IP address
  geo.ip = getClientIP(request);

  switch (platform) {
    case 'cloudflare':
      return extractCloudflareGeo(request, geo);

    case 'vercel':
      return extractVercelGeo(request, geo);

    case 'netlify':
      return extractNetlifyGeo(request, platformContext, geo);

    case 'deno':
      return extractDenoGeo(request, geo);

    default:
      return extractGenericGeo(request, geo);
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string | undefined {
  const headers = request.headers;

  // Check various headers for client IP
  const ipHeaders = [
    'cf-connecting-ip',      // Cloudflare
    'x-real-ip',             // Nginx
    'x-forwarded-for',       // Standard proxy header
    'x-client-ip',           // Apache
    'x-vercel-forwarded-for', // Vercel
    'true-client-ip',        // Akamai, Cloudflare Enterprise
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, use the first
      const ip = value.split(',')[0].trim();
      if (ip && isValidIP(ip)) {
        return ip;
      }
    }
  }

  return undefined;
}

function isValidIP(ip: string): boolean {
  // Basic IPv4/IPv6 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function extractCloudflareGeo(request: Request, geo: GeoLocation): GeoLocation {
  const cf = (request as any).cf;

  if (cf) {
    geo.country = cf.country;
    geo.region = cf.region;
    geo.city = cf.city;
    geo.postalCode = cf.postalCode;
    geo.latitude = cf.latitude ? parseFloat(cf.latitude) : undefined;
    geo.longitude = cf.longitude ? parseFloat(cf.longitude) : undefined;
    geo.timezone = cf.timezone;
    geo.continent = cf.continent;
    geo.colo = cf.colo;
    geo.metroCode = cf.metroCode;

    if (cf.asOrganization) {
      geo.asn = {
        number: cf.asn,
        name: cf.asOrganization,
      };
    }
  }

  // Add derived data
  if (geo.country) {
    geo.isEU = EU_COUNTRIES.has(geo.country);
    geo.continent = geo.continent || getContinentForCountry(geo.country);
    geo.continentName = geo.continent ? CONTINENT_NAMES[geo.continent] : undefined;
  }

  return geo;
}

function extractVercelGeo(request: Request, geo: GeoLocation): GeoLocation {
  const headers = request.headers;

  geo.country = headers.get('x-vercel-ip-country') || undefined;
  geo.region = headers.get('x-vercel-ip-country-region') || undefined;
  geo.city = headers.get('x-vercel-ip-city') || undefined;

  const lat = headers.get('x-vercel-ip-latitude');
  const lon = headers.get('x-vercel-ip-longitude');
  geo.latitude = lat ? parseFloat(lat) : undefined;
  geo.longitude = lon ? parseFloat(lon) : undefined;

  geo.timezone = headers.get('x-vercel-ip-timezone') || undefined;

  // Decode URL-encoded city name
  if (geo.city) {
    try {
      geo.city = decodeURIComponent(geo.city);
    } catch {
      // Keep original if decoding fails
    }
  }

  // Add derived data
  if (geo.country) {
    geo.isEU = EU_COUNTRIES.has(geo.country);
    geo.continent = getContinentForCountry(geo.country);
    geo.continentName = geo.continent ? CONTINENT_NAMES[geo.continent] : undefined;
  }

  return geo;
}

function extractNetlifyGeo(request: Request, context: unknown, geo: GeoLocation): GeoLocation {
  const netlifyGeo = (context as any)?.geo;

  if (netlifyGeo) {
    geo.country = netlifyGeo.country?.code;
    geo.countryName = netlifyGeo.country?.name;
    geo.city = netlifyGeo.city;
    geo.region = netlifyGeo.subdivision?.code;
    geo.latitude = netlifyGeo.latitude;
    geo.longitude = netlifyGeo.longitude;
    geo.timezone = netlifyGeo.timezone;
  }

  // Add derived data
  if (geo.country) {
    geo.isEU = EU_COUNTRIES.has(geo.country);
    geo.continent = getContinentForCountry(geo.country);
    geo.continentName = geo.continent ? CONTINENT_NAMES[geo.continent] : undefined;
  }

  return geo;
}

function extractDenoGeo(request: Request, geo: GeoLocation): GeoLocation {
  // Deno Deploy provides limited geo info through headers
  const headers = request.headers;

  geo.country = headers.get('x-deno-country') || undefined;
  geo.region = headers.get('x-deno-region') || undefined;
  geo.city = headers.get('x-deno-city') || undefined;

  // Add derived data
  if (geo.country) {
    geo.isEU = EU_COUNTRIES.has(geo.country);
    geo.continent = getContinentForCountry(geo.country);
    geo.continentName = geo.continent ? CONTINENT_NAMES[geo.continent] : undefined;
  }

  return geo;
}

function extractGenericGeo(request: Request, geo: GeoLocation): GeoLocation {
  // Try to extract from common headers
  const headers = request.headers;

  geo.country = headers.get('cf-ipcountry') ||
                headers.get('x-country-code') ||
                headers.get('x-geo-country') ||
                undefined;

  geo.city = headers.get('x-city') ||
             headers.get('x-geo-city') ||
             undefined;

  geo.region = headers.get('x-region') ||
               headers.get('x-geo-region') ||
               undefined;

  // Add derived data
  if (geo.country) {
    geo.isEU = EU_COUNTRIES.has(geo.country);
    geo.continent = getContinentForCountry(geo.country);
    geo.continentName = geo.continent ? CONTINENT_NAMES[geo.continent] : undefined;
  }

  return geo;
}

function getContinentForCountry(countryCode: string): string | undefined {
  for (const [continent, countries] of Object.entries(CONTINENT_COUNTRIES)) {
    if (countries.includes(countryCode)) {
      return continent;
    }
  }
  return undefined;
}

// ============================================================================
// Geo Routing
// ============================================================================

/**
 * Apply geo routing rules
 */
export function applyGeoRouting(
  request: Request,
  geo: GeoLocation,
  config: GeoRoutingConfig
): { action: 'allow' | 'block' | 'redirect' | 'rewrite'; url?: string } {
  // Sort rules by priority (descending)
  const sortedRules = [...config.rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const rule of sortedRules) {
    if (matchesRule(geo, rule)) {
      if (rule.action === 'redirect' && rule.redirectUrl) {
        return { action: 'redirect', url: rule.redirectUrl };
      }
      if (rule.action === 'rewrite' && rule.rewritePath) {
        const url = new URL(request.url);
        url.pathname = rule.rewritePath;
        return { action: 'rewrite', url: url.toString() };
      }
      return { action: rule.action };
    }
  }

  return { action: config.defaultAction || 'allow' };
}

function matchesRule(geo: GeoLocation, rule: GeoRoutingRule): boolean {
  // Check countries
  if (rule.countries && rule.countries.length > 0) {
    if (!geo.country || !rule.countries.includes(geo.country)) {
      return false;
    }
  }

  // Check continents
  if (rule.continents && rule.continents.length > 0) {
    if (!geo.continent || !rule.continents.includes(geo.continent)) {
      return false;
    }
  }

  // Check regions (format: "US-CA")
  if (rule.regions && rule.regions.length > 0) {
    const geoRegion = geo.country && geo.region ? `${geo.country}-${geo.region}` : undefined;
    if (!geoRegion || !rule.regions.includes(geoRegion)) {
      return false;
    }
  }

  // Check cities
  if (rule.cities && rule.cities.length > 0) {
    if (!geo.city || !rule.cities.some(c => c.toLowerCase() === geo.city?.toLowerCase())) {
      return false;
    }
  }

  return true;
}

/**
 * Create a geo routing middleware
 */
export function createGeoRoutingMiddleware(
  config: GeoRoutingConfig
): (request: Request, context?: unknown) => Response | null {
  return (request: Request, context?: unknown): Response | null => {
    const geo = getGeoLocation(request, context);
    const result = applyGeoRouting(request, geo, config);

    switch (result.action) {
      case 'block':
        return new Response(config.blockedBody || 'Access Denied', {
          status: config.blockedStatus || 403,
          headers: {
            'Content-Type': 'text/plain',
            'X-Blocked-Reason': 'geo-restriction',
          },
        });

      case 'redirect':
        return Response.redirect(result.url!, 302);

      case 'rewrite':
        // Return null to indicate the request should continue with rewritten URL
        // Caller should handle creating new request with rewritten URL
        return null;

      default:
        return null; // Allow - continue to handler
    }
  };
}

// ============================================================================
// Region-Aware Routing
// ============================================================================

/**
 * Find the best region for a request based on location
 */
export function findBestRegion(
  geo: GeoLocation,
  regions: RegionConfig[]
): RegionConfig | undefined {
  // Filter to healthy regions
  const healthyRegions = regions.filter(r => r.healthy !== false);

  if (healthyRegions.length === 0) {
    return regions[0]; // Fallback to first region
  }

  // Find exact country match
  if (geo.country) {
    const exactMatch = healthyRegions.find(r => r.countries.includes(geo.country!));
    if (exactMatch) {
      return exactMatch;
    }
  }

  // Find continent match
  if (geo.continent) {
    const continentCountries = CONTINENT_COUNTRIES[geo.continent] || [];
    const continentMatch = healthyRegions.find(r =>
      r.countries.some(c => continentCountries.includes(c))
    );
    if (continentMatch) {
      return continentMatch;
    }
  }

  // Return region with highest weight
  return healthyRegions.sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1))[0];
}

/**
 * Create latency-based routing handler
 */
export function createLatencyRouter(config: LatencyRoutingConfig): {
  route: (request: Request, context?: unknown) => RegionConfig;
  getRegionHealth: () => Map<string, boolean>;
  setRegionHealth: (regionId: string, healthy: boolean) => void;
} {
  const regionHealth = new Map<string, boolean>();

  // Initialize all regions as healthy
  for (const region of config.regions) {
    regionHealth.set(region.id, region.healthy !== false);
  }

  return {
    route(request: Request, context?: unknown): RegionConfig {
      const geo = getGeoLocation(request, context);

      // Filter to healthy regions
      const healthyRegions = config.regions.filter(r => regionHealth.get(r.id) !== false);

      if (healthyRegions.length === 0) {
        // All regions unhealthy, try fallback
        const fallback = config.regions.find(r => r.id === config.fallbackRegion);
        return fallback || config.regions[0];
      }

      // Find best region
      const best = findBestRegion(geo, healthyRegions);
      return best || healthyRegions[0];
    },

    getRegionHealth(): Map<string, boolean> {
      return new Map(regionHealth);
    },

    setRegionHealth(regionId: string, healthy: boolean): void {
      regionHealth.set(regionId, healthy);
    },
  };
}

// ============================================================================
// Geo-Based A/B Testing
// ============================================================================

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
export function selectGeoVariant(
  request: Request,
  geo: GeoLocation,
  config: GeoABTestConfig
): { variant: string; isNew: boolean } {
  const cookieName = config.cookieName || `ab_${config.name}`;

  // Check for existing assignment
  const cookies = request.headers.get('cookie') || '';
  const existingVariant = parseCookie(cookies, cookieName);
  if (existingVariant && config.variants.some(v => v.id === existingVariant)) {
    return { variant: existingVariant, isNew: false };
  }

  // Find geo-specific variant
  for (const variant of config.variants) {
    if (variant.countries && geo.country && variant.countries.includes(geo.country)) {
      return { variant: variant.id, isNew: true };
    }
    if (variant.continents && geo.continent && variant.continents.includes(geo.continent)) {
      return { variant: variant.id, isNew: true };
    }
  }

  // Weighted random selection
  const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of config.variants) {
    random -= variant.weight;
    if (random <= 0) {
      return { variant: variant.id, isNew: true };
    }
  }

  return { variant: config.variants[0].id, isNew: true };
}

function parseCookie(cookies: string, name: string): string | undefined {
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Create cookie header for A/B variant
 */
export function createVariantCookie(
  config: GeoABTestConfig,
  variant: string
): string {
  const cookieName = config.cookieName || `ab_${config.name}`;
  const maxAge = config.cookieMaxAge || 86400 * 30; // 30 days

  return `${cookieName}=${encodeURIComponent(variant)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

// ============================================================================
// Distance Calculations
// ============================================================================

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Find nearest location from a list
 */
export function findNearestLocation<T extends { latitude: number; longitude: number }>(
  userLat: number,
  userLon: number,
  locations: T[]
): T | undefined {
  if (locations.length === 0) return undefined;

  let nearest = locations[0];
  let minDistance = calculateDistance(userLat, userLon, nearest.latitude, nearest.longitude);

  for (let i = 1; i < locations.length; i++) {
    const loc = locations[i];
    const distance = calculateDistance(userLat, userLon, loc.latitude, loc.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = loc;
    }
  }

  return nearest;
}

// ============================================================================
// Geo Headers Utility
// ============================================================================

/**
 * Add geo information as response headers
 */
export function addGeoHeaders(headers: Headers, geo: GeoLocation): void {
  if (geo.country) headers.set('X-Geo-Country', geo.country);
  if (geo.region) headers.set('X-Geo-Region', geo.region);
  if (geo.city) headers.set('X-Geo-City', geo.city);
  if (geo.continent) headers.set('X-Geo-Continent', geo.continent);
  if (geo.timezone) headers.set('X-Geo-Timezone', geo.timezone);
  if (geo.isEU !== undefined) headers.set('X-Geo-EU', geo.isEU.toString());
  if (geo.latitude !== undefined) headers.set('X-Geo-Latitude', geo.latitude.toString());
  if (geo.longitude !== undefined) headers.set('X-Geo-Longitude', geo.longitude.toString());
}

// ============================================================================
// Exports
// ============================================================================

export default {
  getGeoLocation,
  getClientIP,
  applyGeoRouting,
  createGeoRoutingMiddleware,
  findBestRegion,
  createLatencyRouter,
  selectGeoVariant,
  createVariantCookie,
  calculateDistance,
  findNearestLocation,
  addGeoHeaders,
  EU_COUNTRIES: Array.from(EU_COUNTRIES),
  CONTINENT_COUNTRIES,
  CONTINENT_NAMES,
};
