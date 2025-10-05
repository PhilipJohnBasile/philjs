/**
 * File-based routing for PhilJS.
 */

export type RouteModule = {
  loader?: Function;
  action?: Function;
  default?: Function;
  config?: Record<string, unknown>;
};

/**
 * Create a router from a route manifest.
 * @param {Record<string, RouteModule>} manifest - Route manifest
 * @returns {{ manifest: Record<string, RouteModule> }}
 */
export function createRouter(manifest) {
  return { manifest };
}
