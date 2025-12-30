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

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Geolocation Providers
// ============================================================================

/**
 * Cloudflare Workers geolocation provider
 */
export const CloudflareProvider: GeoLocationProvider = {
  name: 'cloudflare',
  detect(request: Request): GeolocationData {
    const cf = (request as any).cf;
    if (!cf) return {};

    return {
      country: cf.country,
      region: cf.region,
      city: cf.city,
      latitude: cf.latitude,
      longitude: cf.longitude,
      timezone: cf.timezone,
      continent: cf.continent,
      postalCode: cf.postalCode,
    };
  },
};

/**
 * Vercel Edge geolocation provider
 */
export const VercelProvider: GeoLocationProvider = {
  name: 'vercel',
  detect(request: Request): GeolocationData {
    if (!request.headers.has('x-vercel-ip-country')) return {};

    const country = request.headers.get('x-vercel-ip-country') || undefined;
    const region = request.headers.get('x-vercel-ip-country-region') || undefined;
    const city = request.headers.get('x-vercel-ip-city') || undefined;
    const latitude = parseFloatOrUndefined(request.headers.get('x-vercel-ip-latitude'));
    const longitude = parseFloatOrUndefined(request.headers.get('x-vercel-ip-longitude'));
    const timezone = request.headers.get('x-vercel-ip-timezone') || undefined;

    const geo: GeolocationData = {};
    if (country !== undefined) geo.country = country;
    if (region !== undefined) geo.region = region;
    if (city !== undefined) geo.city = city;
    if (latitude !== undefined) geo.latitude = latitude;
    if (longitude !== undefined) geo.longitude = longitude;
    if (timezone !== undefined) geo.timezone = timezone;
    return geo;
  },
};

/**
 * Generic Cloudflare proxy provider (when behind CF but not Workers)
 */
export const CloudflareProxyProvider: GeoLocationProvider = {
  name: 'cloudflare-proxy',
  detect(request: Request): GeolocationData {
    if (!request.headers.has('cf-ipcountry')) return {};

    const country = request.headers.get('cf-ipcountry') || undefined;
    const geo: GeolocationData = {};
    if (country !== undefined) geo.country = country;
    return geo;
  },
};

/**
 * Deno Deploy geolocation provider
 */
export const DenoDeployProvider: GeoLocationProvider = {
  name: 'deno-deploy',
  async detect(request: Request): Promise<GeolocationData> {
    // Deno Deploy uses CF headers
    return CloudflareProxyProvider.detect(request);
  },
};

/**
 * Auto-detect geolocation provider
 */
export async function detectGeolocation(
  request: Request,
  options: GeolocationOptions = {}
): Promise<GeolocationData> {
  if (options.provider) {
    const result = await options.provider.detect(request);
    if (result && Object.keys(result).length > 0) {
      return result;
    }
  }

  // Try providers in order
  const providers = [CloudflareProvider, VercelProvider, CloudflareProxyProvider];

  for (const provider of providers) {
    const result = await provider.detect(request);
    if (result && Object.keys(result).length > 0) {
      return result;
    }
  }

  return options.fallback || {};
}

// ============================================================================
// Geolocation Middleware
// ============================================================================

/**
 * Geolocation middleware - adds geo data to context
 */
export function geolocationMiddleware(options: GeolocationOptions = {}): EdgeMiddleware {
  return async (context): Promise<Response> => {
    const geo = await detectGeolocation(context.request.raw, options);

    // Update context geo
    (context as any).geo = geo;
    (context.request as any).geo = geo;

    const response = await context.next();

    // Optionally add geo headers
    if (options.addHeaders && geo.country) {
      const headers = new Headers(response.headers);
      headers.set('X-Geo-Country', geo.country);
      if (geo.region) headers.set('X-Geo-Region', geo.region);
      if (geo.city) headers.set('X-Geo-City', geo.city);
      if (geo.continent) headers.set('X-Geo-Continent', geo.continent);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  };
}

// ============================================================================
// Geo-based Redirects
// ============================================================================

/**
 * Redirect based on geolocation
 */
export function geoRedirectMiddleware(rules: GeoRedirectRule[]): EdgeMiddleware {
  return async (context) => {
    const geo = context.geo;
    const pathname = context.request.url.pathname;

    for (const rule of rules) {
      // Check exclusions
      if (rule.exclude) {
        const excluded = rule.exclude.some((pattern) => {
          const regex = new RegExp(
            '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
          );
          return regex.test(pathname);
        });
        if (excluded) continue;
      }

      // Check countries
      if (rule.countries && geo.country) {
        if (!rule.countries.includes(geo.country)) continue;
      }

      // Check regions
      if (rule.regions && geo.region) {
        if (!rule.regions.includes(geo.region)) continue;
      }

      // Check cities
      if (rule.cities && geo.city) {
        if (!rule.cities.includes(geo.city)) continue;
      }

      // Check continents
      if (rule.continents && geo.continent) {
        if (!rule.continents.includes(geo.continent)) continue;
      }

      // If we got here, this rule matches
      if (
        rule.countries?.length ||
        rule.regions?.length ||
        rule.cities?.length ||
        rule.continents?.length
      ) {
        return context.redirect(rule.destination, rule.status || 302);
      }
    }

    return context.next();
  };
}

/**
 * Simplified geo redirect helper
 */
export function redirectByCountry(
  mapping: Record<string, string>,
  options: { status?: 301 | 302 | 307 | 308; exclude?: string[] } = {}
): EdgeMiddleware {
  const rules: GeoRedirectRule[] = Object.entries(mapping).map(([countries, destination]) => {
    const rule: GeoRedirectRule = {
      countries: countries.split(',').map((c) => c.trim()),
      destination,
    };
    if (options.status !== undefined) rule.status = options.status;
    if (options.exclude !== undefined) rule.exclude = options.exclude;
    return rule;
  });

  return geoRedirectMiddleware(rules);
}

// ============================================================================
// Language Detection
// ============================================================================

/**
 * Default country to language mapping
 */
export const DEFAULT_LANGUAGE_MAP: GeoLanguageMapping = {
  US: 'en-US',
  GB: 'en-GB',
  CA: ['en-CA', 'fr-CA'],
  FR: 'fr-FR',
  DE: 'de-DE',
  ES: 'es-ES',
  IT: 'it-IT',
  JP: 'ja-JP',
  CN: 'zh-CN',
  TW: 'zh-TW',
  KR: 'ko-KR',
  BR: 'pt-BR',
  PT: 'pt-PT',
  RU: 'ru-RU',
  IN: ['hi-IN', 'en-IN'],
  MX: 'es-MX',
  AR: 'es-AR',
  NL: 'nl-NL',
  SE: 'sv-SE',
  NO: 'no-NO',
  DK: 'da-DK',
  FI: 'fi-FI',
  PL: 'pl-PL',
  TR: 'tr-TR',
  SA: 'ar-SA',
  AE: 'ar-AE',
  IL: 'he-IL',
  GR: 'el-GR',
  CZ: 'cs-CZ',
  HU: 'hu-HU',
  RO: 'ro-RO',
  TH: 'th-TH',
  VN: 'vi-VN',
  ID: 'id-ID',
  MY: 'ms-MY',
  PH: ['en-PH', 'tl-PH'],
  SG: ['en-SG', 'zh-SG'],
  AU: 'en-AU',
  NZ: 'en-NZ',
  ZA: ['en-ZA', 'af-ZA'],
};

/**
 * Detect language from geolocation
 */
export function detectLanguageFromGeo(
  geo: GeolocationData,
  languageMap: GeoLanguageMapping = DEFAULT_LANGUAGE_MAP
): string | string[] | undefined {
  if (!geo.country) return undefined;
  return languageMap[geo.country];
}

/**
 * Detect language from Accept-Language header
 */
export function detectLanguageFromHeader(acceptLanguage: string | null): string[] {
  if (!acceptLanguage) return [];

  return acceptLanguage
    .split(',')
    .map((lang) => {
      const [locale = '', q = '1'] = lang.trim().split(';q=');
      return { locale: locale.trim(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality)
    .map((item) => item.locale);
}

/**
 * Combine geo and header language detection
 */
export function detectLanguage(
  request: Request,
  geo: GeolocationData,
  languageMap: GeoLanguageMapping = DEFAULT_LANGUAGE_MAP
): string | undefined {
  // Try geo-based detection first
  const geoLang = detectLanguageFromGeo(geo, languageMap);
  if (geoLang) {
    return Array.isArray(geoLang) ? geoLang[0] : geoLang;
  }

  // Fall back to Accept-Language header
  const headerLangs = detectLanguageFromHeader(request.headers.get('accept-language'));
  return headerLangs[0];
}

/**
 * Language detection middleware
 */
export function languageDetectionMiddleware(options: {
  languageMap?: GeoLanguageMapping;
  cookieName?: string;
  headerName?: string;
} = {}): EdgeMiddleware {
  const {
    languageMap = DEFAULT_LANGUAGE_MAP,
    cookieName = 'preferred-language',
    headerName = 'X-Detected-Language',
  } = options;

  return async (context) => {
    // Check for existing preference
    const existingLang = context.cookies.get(cookieName);
    if (existingLang) {
      const response = await context.next();
      const headers = new Headers(response.headers);
      headers.set(headerName, existingLang);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    // Detect language
    const detectedLang = detectLanguage(
      context.request.raw,
      context.geo,
      languageMap
    );

    if (detectedLang) {
      // Set cookie
      context.cookies.set(cookieName, detectedLang, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        path: '/',
        sameSite: 'lax',
      });

      const response = await context.next();
      const headers = new Headers(response.headers);
      headers.set(headerName, detectedLang);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return context.next();
  };
}

/**
 * Redirect to localized version based on detected language
 */
export function localizedRedirectMiddleware(options: {
  supportedLocales: string[];
  defaultLocale: string;
  languageMap?: GeoLanguageMapping;
  cookieName?: string;
} = { supportedLocales: ['en'], defaultLocale: 'en' }): EdgeMiddleware {
  const { supportedLocales, defaultLocale, languageMap, cookieName = 'locale' } = options;

  return async (context) => {
    const pathname = context.request.url.pathname;

    // Check if already on a localized path
    const localeInPath = supportedLocales.find((locale) =>
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (localeInPath) {
      // Update cookie to match URL
      context.cookies.set(cookieName, localeInPath, {
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
      });
      return context.next();
    }

    // Check cookie first
    let preferredLocale = context.cookies.get(cookieName);

    // Detect language if no cookie
    if (!preferredLocale) {
      const detectedLang = detectLanguage(
        context.request.raw,
        context.geo,
        languageMap
      );

      if (detectedLang) {
        // Match detected language to supported locales
        preferredLocale = supportedLocales.find(
          (locale) => locale.toLowerCase().startsWith(detectedLang.toLowerCase())
        );
      }
    }

    // Use default if no match
    if (!preferredLocale || !supportedLocales.includes(preferredLocale)) {
      preferredLocale = defaultLocale;
    }

    // Don't redirect if already on default locale and not using locale prefix
    if (preferredLocale === defaultLocale && !pathname.startsWith(`/${defaultLocale}/`)) {
      return context.next();
    }

    // Redirect to localized path
    const localizedPath = `/${preferredLocale}${pathname}${context.request.url.search}`;
    return context.redirect(localizedPath, 307);
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function parseFloatOrUndefined(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Calculate distance between two geo points (in km)
 */
export function geoDistance(
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
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if point is within radius of center
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusKm: number
): boolean {
  const distance = geoDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusKm;
}

// ============================================================================
// Client-side Hook (for browser)
// ============================================================================

/**
 * useGeolocation hook for client-side
 *
 * Note: This retrieves server-detected geo from cookies/headers,
 * not browser geolocation API.
 */
export function useGeolocation(): {
  geo: GeolocationData | null;
  language: string | null;
  loading: boolean;
} {
  // This would need to be implemented with signals for reactivity
  // For now, return a basic structure

  if (typeof window === 'undefined') {
    return { geo: null, language: null, loading: false };
  }

  // Try to read from meta tags or global variable
  const geoDataEl = document.querySelector('meta[name="geo-data"]');
  const geoData = geoDataEl?.getAttribute('content');

  let geo: GeolocationData | null = null;
  if (geoData) {
    try {
      geo = JSON.parse(geoData);
    } catch {
      geo = null;
    }
  }

  const language = document.documentElement.lang || null;

  return { geo, language, loading: false };
}

/**
 * Inject geolocation data into HTML
 */
export function injectGeolocationData(html: string, geo: GeolocationData): string {
  const geoMeta = `<meta name="geo-data" content='${JSON.stringify(geo)}'>`;
  return html.replace('</head>', `${geoMeta}\n</head>`);
}
