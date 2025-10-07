/**
 * ResourceHints Component
 *
 * Provides performance optimization hints for the browser including:
 * - DNS prefetching
 * - Preconnect
 * - Prefetch
 * - Preload
 * - Module preload
 *
 * Usage: Add to your document head in index.html or app root
 */

export interface ResourceHintsProps {
  /**
   * Domains to DNS prefetch (resolve domain names early)
   * Use for external resources you'll definitely use
   */
  dnsPrefetch?: string[];

  /**
   * Origins to preconnect (establish full connection including DNS, TCP, TLS)
   * Use for critical external resources
   */
  preconnect?: Array<{
    href: string;
    crossOrigin?: boolean;
  }>;

  /**
   * Resources to prefetch (fetch and cache for future navigation)
   * Use for likely next page resources
   */
  prefetch?: Array<{
    href: string;
    as?: string;
    type?: string;
  }>;

  /**
   * Resources to preload (fetch for current page)
   * Use for critical resources discovered late
   */
  preload?: Array<{
    href: string;
    as: string;
    type?: string;
    crossOrigin?: boolean;
    integrity?: string;
  }>;

  /**
   * ES modules to preload
   * Use for critical JavaScript modules
   */
  modulePreload?: string[];
}

export function ResourceHints({
  dnsPrefetch = [],
  preconnect = [],
  prefetch = [],
  preload = [],
  modulePreload = [],
}: ResourceHintsProps) {
  return (
    <>
      {/* DNS Prefetch - lightweight, early DNS resolution */}
      {dnsPrefetch.map((domain) => (
        <link key={`dns-${domain}`} rel="dns-prefetch" href={domain} />
      ))}

      {/* Preconnect - full connection setup (DNS + TCP + TLS) */}
      {preconnect.map((conn) => (
        <link
          key={`preconnect-${conn.href}`}
          rel="preconnect"
          href={conn.href}
          crossOrigin={conn.crossOrigin ? 'anonymous' : undefined}
        />
      ))}

      {/* Prefetch - fetch resources for future navigation */}
      {prefetch.map((resource) => (
        <link
          key={`prefetch-${resource.href}`}
          rel="prefetch"
          href={resource.href}
          as={resource.as}
          type={resource.type}
        />
      ))}

      {/* Preload - fetch critical resources for current page */}
      {preload.map((resource) => (
        <link
          key={`preload-${resource.href}`}
          rel="preload"
          href={resource.href}
          as={resource.as}
          type={resource.type}
          crossOrigin={resource.crossOrigin ? 'anonymous' : undefined}
          integrity={resource.integrity}
        />
      ))}

      {/* Module Preload - preload ES modules */}
      {modulePreload.map((href) => (
        <link key={`modulepreload-${href}`} rel="modulepreload" href={href} />
      ))}
    </>
  );
}

/**
 * Default resource hints for the PhilJS documentation site
 */
export function DefaultResourceHints() {
  return (
    <ResourceHints
      // DNS prefetch for common external domains
      dnsPrefetch={[
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://api.github.com',
        'https://cdn.jsdelivr.net',
      ]}
      // Preconnect to critical external services
      preconnect={[
        { href: 'https://fonts.googleapis.com', crossOrigin: true },
        { href: 'https://fonts.gstatic.com', crossOrigin: true },
        { href: 'https://api.github.com', crossOrigin: true },
      ]}
      // Preload critical fonts (if using web fonts)
      preload={[
        // Example: Preload critical font files
        // {
        //   href: '/fonts/inter-var.woff2',
        //   as: 'font',
        //   type: 'font/woff2',
        //   crossOrigin: true,
        // },
      ]}
    />
  );
}

/**
 * Resource hint utilities
 */
export const ResourceHintUtils = {
  /**
   * Add a DNS prefetch hint dynamically
   */
  addDNSPrefetch(domain: string): void {
    if (typeof document === 'undefined') return;

    const existing = document.querySelector(`link[rel="dns-prefetch"][href="${domain}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  },

  /**
   * Add a preconnect hint dynamically
   */
  addPreconnect(href: string, crossOrigin: boolean = false): void {
    if (typeof document === 'undefined') return;

    const existing = document.querySelector(`link[rel="preconnect"][href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    if (crossOrigin) {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  },

  /**
   * Prefetch a resource for future navigation
   */
  prefetch(href: string, as?: string): void {
    if (typeof document === 'undefined') return;

    const existing = document.querySelector(`link[rel="prefetch"][href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    if (as) {
      link.as = as;
    }
    document.head.appendChild(link);
  },

  /**
   * Preload a critical resource
   */
  preload(href: string, as: string, type?: string): void {
    if (typeof document === 'undefined') return;

    const existing = document.querySelector(`link[rel="preload"][href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) {
      link.type = type;
    }
    document.head.appendChild(link);
  },

  /**
   * Preload an ES module
   */
  modulePreload(href: string): void {
    if (typeof document === 'undefined') return;

    const existing = document.querySelector(`link[rel="modulepreload"][href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = href;
    document.head.appendChild(link);
  },

  /**
   * Check if a resource is already cached
   */
  async isResourceCached(url: string): Promise<boolean> {
    if (!('caches' in window)) return false;

    try {
      const cache = await caches.open('philjs-docs');
      const response = await cache.match(url);
      return !!response;
    } catch {
      return false;
    }
  },

  /**
   * Warm up cache for critical resources
   */
  async warmCache(urls: string[]): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open('philjs-docs');
      await Promise.all(
        urls.map((url) =>
          fetch(url).then((response) => {
            if (response.ok) {
              return cache.put(url, response);
            }
          })
        )
      );
    } catch (error) {
      console.error('Failed to warm cache:', error);
    }
  },
};

/**
 * Example usage:
 *
 * ```tsx
 * // In your document head or root component
 * <ResourceHints
 *   dnsPrefetch={[
 *     'https://api.example.com',
 *     'https://cdn.example.com'
 *   ]}
 *   preconnect={[
 *     { href: 'https://fonts.googleapis.com', crossOrigin: true },
 *     { href: 'https://api.github.com', crossOrigin: true }
 *   ]}
 *   prefetch={[
 *     { href: '/page2', as: 'document' },
 *     { href: '/data.json', as: 'fetch' }
 *   ]}
 *   preload={[
 *     {
 *       href: '/critical.css',
 *       as: 'style'
 *     },
 *     {
 *       href: '/hero.jpg',
 *       as: 'image',
 *       type: 'image/jpeg'
 *     }
 *   ]}
 *   modulePreload={[
 *     '/app.js',
 *     '/vendor.js'
 *   ]}
 * />
 *
 * // Or use the default hints
 * <DefaultResourceHints />
 *
 * // Dynamically add hints
 * ResourceHintUtils.addPreconnect('https://api.example.com', true);
 * ResourceHintUtils.prefetch('/next-page', 'document');
 * ResourceHintUtils.preload('/critical.css', 'style');
 * ```
 *
 * ## Resource Hint Types:
 *
 * ### dns-prefetch
 * - Resolves domain name to IP address
 * - Lightweight, use for many domains
 * - Example: External APIs, CDNs
 *
 * ### preconnect
 * - Full connection (DNS + TCP + TLS)
 * - More expensive, use for critical origins
 * - Example: Primary API, font provider
 *
 * ### prefetch
 * - Fetch and cache for future navigation
 * - Low priority, doesn't block current page
 * - Example: Next page resources
 *
 * ### preload
 * - Fetch critical current page resources
 * - High priority, discovered late in page load
 * - Example: Fonts, hero images, critical CSS
 *
 * ### modulepreload
 * - Preload ES modules with dependencies
 * - Example: Critical JavaScript bundles
 */
