/**
 * Cache strategy helpers
 */

import type { CacheRule, CacheStrategy } from './types.js';

/**
 * Create a cache rule
 */
export function createCacheRule(
  pattern: RegExp | string,
  strategy: CacheStrategy,
  options: Partial<CacheRule> = {}
): CacheRule {
  return {
    pattern,
    strategy,
    ...(options.cacheName !== undefined && { cacheName: options.cacheName }),
    ...(options.maxAge !== undefined && { maxAge: options.maxAge }),
    ...(options.maxEntries !== undefined && { maxEntries: options.maxEntries }),
    ...(options.networkTimeout !== undefined && { networkTimeout: options.networkTimeout }),
  };
}

/**
 * Predefined cache rules
 */
export const cacheRules = {
  /**
   * Cache static assets (JS, CSS, images)
   */
  staticAssets: (): CacheRule => createCacheRule(
    /\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2)$/,
    'cache-first',
    { maxAge: 7 * 24 * 60 * 60 * 1000, maxEntries: 50 }
  ),

  /**
   * Cache API responses with network-first strategy
   */
  apiResponses: (apiPath: string = '/api'): CacheRule => createCacheRule(
    new RegExp(`^${apiPath}/`),
    'network-first',
    { networkTimeout: 3000, maxEntries: 20 }
  ),

  /**
   * Cache images with stale-while-revalidate
   */
  images: (): CacheRule => createCacheRule(
    /\.(png|jpg|jpeg|gif|svg|webp)$/,
    'stale-while-revalidate',
    { maxEntries: 100, maxAge: 30 * 24 * 60 * 60 * 1000 }
  ),

  /**
   * Cache fonts
   */
  fonts: (): CacheRule => createCacheRule(
    /\.(woff|woff2|ttf|eot)$/,
    'cache-first',
    { maxAge: 365 * 24 * 60 * 60 * 1000, maxEntries: 10 }
  ),

  /**
   * Cache Google Fonts
   */
  googleFonts: (): CacheRule[] => [
    createCacheRule(
      /^https:\/\/fonts\.googleapis\.com/,
      'stale-while-revalidate',
      { cacheName: 'google-fonts-stylesheets' }
    ),
    createCacheRule(
      /^https:\/\/fonts\.gstatic\.com/,
      'cache-first',
      { cacheName: 'google-fonts-webfonts', maxAge: 365 * 24 * 60 * 60 * 1000, maxEntries: 30 }
    ),
  ],
};

/**
 * Get default cache rules
 */
export function getDefaultCacheRules(): CacheRule[] {
  return [
    cacheRules.staticAssets(),
    cacheRules.images(),
    cacheRules.fonts(),
    ...cacheRules.googleFonts(),
  ];
}
