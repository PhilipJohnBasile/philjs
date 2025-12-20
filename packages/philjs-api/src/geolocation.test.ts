/**
 * Geolocation Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  CloudflareProvider,
  VercelProvider,
  detectGeolocation,
  detectLanguageFromGeo,
  detectLanguageFromHeader,
  detectLanguage,
  geoDistance,
  isWithinRadius,
  DEFAULT_LANGUAGE_MAP,
  geoRedirectMiddleware,
  redirectByCountry,
  languageDetectionMiddleware,
} from './geolocation.js';
import { executeEdgeMiddleware } from './edge-middleware.js';

describe('Geolocation', () => {
  describe('Providers', () => {
    describe('CloudflareProvider', () => {
      it('should detect from Cloudflare cf object', () => {
        const request = {
          cf: {
            country: 'US',
            region: 'California',
            city: 'San Francisco',
            latitude: 37.7749,
            longitude: -122.4194,
            timezone: 'America/Los_Angeles',
            continent: 'NA',
            postalCode: '94102',
          },
        } as any;

        const geo = CloudflareProvider.detect(request);

        expect(geo).toEqual({
          country: 'US',
          region: 'California',
          city: 'San Francisco',
          latitude: 37.7749,
          longitude: -122.4194,
          timezone: 'America/Los_Angeles',
          continent: 'NA',
          postalCode: '94102',
        });
      });

      it('should return empty object if no cf data', () => {
        const request = new Request('https://example.com');
        const geo = CloudflareProvider.detect(request);
        expect(geo).toEqual({});
      });
    });

    describe('VercelProvider', () => {
      it('should detect from Vercel headers', () => {
        const request = new Request('https://example.com', {
          headers: {
            'x-vercel-ip-country': 'US',
            'x-vercel-ip-country-region': 'CA',
            'x-vercel-ip-city': 'San Francisco',
            'x-vercel-ip-latitude': '37.7749',
            'x-vercel-ip-longitude': '-122.4194',
            'x-vercel-ip-timezone': 'America/Los_Angeles',
          },
        });

        const geo = VercelProvider.detect(request);

        expect(geo).toEqual({
          country: 'US',
          region: 'CA',
          city: 'San Francisco',
          latitude: 37.7749,
          longitude: -122.4194,
          timezone: 'America/Los_Angeles',
        });
      });

      it('should return empty object if no Vercel headers', () => {
        const request = new Request('https://example.com');
        const geo = VercelProvider.detect(request);
        expect(geo).toEqual({});
      });
    });
  });

  describe('detectGeolocation', () => {
    it('should use custom provider if provided', async () => {
      const customProvider = {
        name: 'custom',
        detect: () => ({ country: 'CUSTOM', city: 'CustomCity' }),
      };

      const request = new Request('https://example.com');
      const geo = await detectGeolocation(request, { provider: customProvider });

      expect(geo).toEqual({ country: 'CUSTOM', city: 'CustomCity' });
    });

    it('should use fallback if no provider detects', async () => {
      const request = new Request('https://example.com');
      const geo = await detectGeolocation(request, {
        fallback: { country: 'US', city: 'Default' },
      });

      expect(geo).toEqual({ country: 'US', city: 'Default' });
    });
  });

  describe('Language Detection', () => {
    describe('detectLanguageFromGeo', () => {
      it('should detect language from country code', () => {
        const geo = { country: 'US' };
        const lang = detectLanguageFromGeo(geo);
        expect(lang).toBe('en-US');
      });

      it('should handle multi-language countries', () => {
        const geo = { country: 'CA' };
        const lang = detectLanguageFromGeo(geo);
        expect(lang).toEqual(['en-CA', 'fr-CA']);
      });

      it('should return undefined for unknown country', () => {
        const geo = { country: 'XX' };
        const lang = detectLanguageFromGeo(geo);
        expect(lang).toBeUndefined();
      });

      it('should use custom language map', () => {
        const geo = { country: 'US' };
        const customMap = { US: 'custom-lang' };
        const lang = detectLanguageFromGeo(geo, customMap);
        expect(lang).toBe('custom-lang');
      });
    });

    describe('detectLanguageFromHeader', () => {
      it('should parse Accept-Language header', () => {
        const langs = detectLanguageFromHeader('en-US,en;q=0.9,fr;q=0.8');
        expect(langs).toEqual(['en-US', 'en', 'fr']);
      });

      it('should sort by quality value', () => {
        const langs = detectLanguageFromHeader('fr;q=0.8,en-US;q=0.9,en');
        expect(langs).toEqual(['en', 'en-US', 'fr']);
      });

      it('should handle null header', () => {
        const langs = detectLanguageFromHeader(null);
        expect(langs).toEqual([]);
      });
    });

    describe('detectLanguage', () => {
      it('should prefer geo-based detection', () => {
        const request = new Request('https://example.com', {
          headers: { 'Accept-Language': 'fr-FR' },
        });
        const geo = { country: 'US' };

        const lang = detectLanguage(request, geo);
        expect(lang).toBe('en-US');
      });

      it('should fall back to Accept-Language header', () => {
        const request = new Request('https://example.com', {
          headers: { 'Accept-Language': 'fr-FR,en;q=0.9' },
        });
        const geo = {};

        const lang = detectLanguage(request, geo);
        expect(lang).toBe('fr-FR');
      });
    });
  });

  describe('Geo Distance', () => {
    it('should calculate distance between two points', () => {
      // San Francisco to Los Angeles
      const sf = { lat: 37.7749, lon: -122.4194 };
      const la = { lat: 34.0522, lon: -118.2437 };

      const distance = geoDistance(sf.lat, sf.lon, la.lat, la.lon);

      // Approximate distance is ~560km
      expect(distance).toBeGreaterThan(500);
      expect(distance).toBeLessThan(600);
    });

    it('should calculate zero distance for same point', () => {
      const distance = geoDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(distance).toBeCloseTo(0, 1);
    });
  });

  describe('isWithinRadius', () => {
    it('should return true for points within radius', () => {
      const center = { lat: 37.7749, lon: -122.4194 };
      const nearby = { lat: 37.7849, lon: -122.4094 };

      const result = isWithinRadius(center.lat, center.lon, nearby.lat, nearby.lon, 10);
      expect(result).toBe(true);
    });

    it('should return false for points outside radius', () => {
      const sf = { lat: 37.7749, lon: -122.4194 };
      const la = { lat: 34.0522, lon: -118.2437 };

      const result = isWithinRadius(sf.lat, sf.lon, la.lat, la.lon, 100);
      expect(result).toBe(false);
    });
  });

  describe('Geo Redirect Middleware', () => {
    it('should redirect based on country', async () => {
      const middleware = geoRedirectMiddleware([
        {
          countries: ['GB', 'FR', 'DE'],
          destination: '/eu',
        },
      ]);

      const request = new Request('https://example.com/');
      const response = await executeEdgeMiddleware(request, middleware, {
        geo: { country: 'GB' },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/eu');
    });

    it('should not redirect if country does not match', async () => {
      const middleware = geoRedirectMiddleware([
        {
          countries: ['GB'],
          destination: '/uk',
        },
      ]);

      const request = new Request('https://example.com/');
      const response = await executeEdgeMiddleware(request, middleware, {
        geo: { country: 'US' },
      });

      expect(response.status).toBe(200);
    });

    it('should respect exclusions', async () => {
      const middleware = geoRedirectMiddleware([
        {
          countries: ['GB'],
          destination: '/uk',
          exclude: ['/api/*'],
        },
      ]);

      const request = new Request('https://example.com/api/users');
      const response = await executeEdgeMiddleware(request, middleware, {
        geo: { country: 'GB' },
      });

      expect(response.status).toBe(200);
    });
  });

  describe('redirectByCountry', () => {
    it('should redirect based on country mapping', async () => {
      const middleware = redirectByCountry({
        'GB,IE': '/uk',
        'FR,BE,LU': '/fr',
        'DE,AT,CH': '/de',
      });

      const request = new Request('https://example.com/');
      const response = await executeEdgeMiddleware(request, middleware, {
        geo: { country: 'FR' },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/fr');
    });

    it('should support permanent redirects', async () => {
      const middleware = redirectByCountry(
        { 'GB': '/uk' },
        { status: 301 }
      );

      const request = new Request('https://example.com/');
      const response = await executeEdgeMiddleware(request, middleware, {
        geo: { country: 'GB' },
      });

      expect(response.status).toBe(301);
    });
  });

  describe('languageDetectionMiddleware', () => {
    it('should detect and set language cookie', async () => {
      const middleware = languageDetectionMiddleware();

      const request = new Request('https://example.com/');
      const response = await executeEdgeMiddleware(request, middleware, {
        geo: { country: 'FR' },
      });

      expect(response.headers.get('X-Detected-Language')).toBe('fr-FR');
      expect(response.headers.get('Set-Cookie')).toContain('preferred-language=fr-FR');
    });

    it('should use existing cookie if present', async () => {
      const middleware = languageDetectionMiddleware();

      const request = new Request('https://example.com/', {
        headers: { Cookie: 'preferred-language=de-DE' },
      });
      const response = await executeEdgeMiddleware(request, middleware, {
        geo: { country: 'FR' },
      });

      expect(response.headers.get('X-Detected-Language')).toBe('de-DE');
    });

    it('should use custom cookie name', async () => {
      const middleware = languageDetectionMiddleware({
        cookieName: 'user-lang',
      });

      const request = new Request('https://example.com/');
      const response = await executeEdgeMiddleware(request, middleware, {
        geo: { country: 'ES' },
      });

      expect(response.headers.get('Set-Cookie')).toContain('user-lang=es-ES');
    });
  });
});
