/**
 * PhilJS SEO Plugin
 *
 * Comprehensive SEO plugin with meta tags, OpenGraph, Twitter Cards,
 * JSON-LD structured data, sitemap generation, and robots.txt support.
 */

import type { Plugin, PluginContext } from 'philjs-core/plugin-system';
import type {
  SEOPluginConfig,
  PageSEO,
  SitemapEntry,
  SitemapConfig,
  RobotsTxtConfig,
} from './types.js';

/**
 * Minimal Vite plugin interface for compatibility
 */
interface VitePlugin {
  name: string;
  configResolved?(config: { root: string }): void;
  generateBundle?(this: { emitFile: (file: { type: string; fileName: string; source: string }) => void }): Promise<void> | void;
  transformIndexHtml?(html: string): string;
}

/**
 * Default configuration
 */
const defaultConfig: Partial<SEOPluginConfig> = {
  defaults: {
    viewport: 'width=device-width, initial-scale=1',
    robots: { index: true, follow: true },
  },
  trailingSlash: false,
  sitemap: false,
  robots: false,
};

/**
 * Generate sitemap XML
 */
function generateSitemapXML(entries: SitemapEntry[]): string {
  const urls = entries.map(entry => {
    let xml = '  <url>\n';
    xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`;

    if (entry.lastmod) {
      const date = entry.lastmod instanceof Date
        ? entry.lastmod.toISOString().split('T')[0]
        : entry.lastmod;
      xml += `    <lastmod>${date}</lastmod>\n`;
    }

    if (entry.changefreq) {
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    }

    if (entry.priority !== undefined) {
      xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
    }

    // Alternate languages (hreflang)
    if (entry.alternates) {
      for (const alt of entry.alternates) {
        xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}" />\n`;
      }
    }

    // Images
    if (entry.images) {
      for (const image of entry.images) {
        xml += '    <image:image>\n';
        xml += `      <image:loc>${escapeXml(image.loc)}</image:loc>\n`;
        if (image.caption) {
          xml += `      <image:caption>${escapeXml(image.caption)}</image:caption>\n`;
        }
        if (image.title) {
          xml += `      <image:title>${escapeXml(image.title)}</image:title>\n`;
        }
        xml += '    </image:image>\n';
      }
    }

    xml += '  </url>';
    return xml;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
}

/**
 * Generate robots.txt content
 */
function generateRobotsTxt(config: RobotsTxtConfig, baseUrl?: string): string {
  const lines: string[] = [];

  // Rules
  for (const rule of config.rules ?? []) {
    const userAgents = Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent];

    for (const ua of userAgents) {
      lines.push(`User-agent: ${ua}`);
    }

    const allows = Array.isArray(rule.allow) ? rule.allow : (rule.allow ? [rule.allow] : []);
    for (const path of allows) {
      lines.push(`Allow: ${path}`);
    }

    const disallows = Array.isArray(rule.disallow) ? rule.disallow : (rule.disallow ? [rule.disallow] : []);
    for (const path of disallows) {
      lines.push(`Disallow: ${path}`);
    }

    if (rule.crawlDelay !== undefined) {
      lines.push(`Crawl-delay: ${rule.crawlDelay}`);
    }

    lines.push('');
  }

  // Sitemaps
  const sitemaps = config.sitemaps ?? (baseUrl ? [`${baseUrl}/sitemap.xml`] : []);
  for (const sitemap of sitemaps) {
    lines.push(`Sitemap: ${sitemap}`);
  }

  // Additional directives
  if (config.additionalDirectives) {
    lines.push('');
    lines.push(...config.additionalDirectives);
  }

  return lines.join('\n');
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Create Vite plugin for sitemap and robots.txt generation
 */
function createVitePlugin(config: SEOPluginConfig): VitePlugin {
  let _root = '';

  return {
    name: 'philjs-seo',

    configResolved(resolvedConfig: { root: string }) {
      _root = resolvedConfig.root;
    },

    generateBundle() {
      // Generate sitemap
      if (config.sitemap) {
        const sitemapConfig = typeof config.sitemap === 'object' ? config.sitemap : {};
        const entries = sitemapConfig.customEntries ?? [];

        // If no custom entries, create a basic sitemap
        if (entries.length === 0 && config.baseUrl) {
          entries.push({
            loc: config.baseUrl,
            changefreq: 'daily',
            priority: 1.0,
          });
        }

        if (entries.length > 0) {
          const xml = generateSitemapXML(entries);
          const outputPath = sitemapConfig.output ?? 'sitemap.xml';

          this.emitFile({
            type: 'asset',
            fileName: outputPath,
            source: xml,
          });
        }
      }

      // Generate robots.txt
      if (config.robots) {
        const robotsConfig: RobotsTxtConfig = typeof config.robots === 'object'
          ? config.robots
          : {
              rules: [{ userAgent: '*', allow: '/' }],
            };

        const content = generateRobotsTxt(robotsConfig, config.baseUrl);
        const outputPath = robotsConfig.output ?? 'robots.txt';

        this.emitFile({
          type: 'asset',
          fileName: outputPath,
          source: content,
        });
      }
    },

    transformIndexHtml(html: string) {
      // Inject default meta tags into index.html
      if (config.defaults || config.openGraph || config.twitter || config.jsonLd) {
        const {
          generateSEOHead,
        } = require('./head.js') as typeof import('./head.js');

        const seoHtml = generateSEOHead({
          ...(config.defaults !== undefined ? { meta: config.defaults } : {}),
          ...(config.openGraph !== undefined ? { openGraph: config.openGraph } : {}),
          ...(config.twitter !== undefined ? { twitter: config.twitter } : {}),
          ...(config.jsonLd !== undefined ? { jsonLd: config.jsonLd } : {}),
        });

        // Insert before </head>
        return html.replace('</head>', `${seoHtml}\n</head>`);
      }

      return html;
    },
  };
}

/**
 * Create SEO plugin
 */
export function createSEOPlugin(userConfig: SEOPluginConfig = {}): Plugin {
  const config = { ...defaultConfig, ...userConfig } as SEOPluginConfig;

  return {
    meta: {
      name: 'philjs-plugin-seo',
      version: '2.0.0',
      description: 'SEO plugin for PhilJS with meta tags, OpenGraph, JSON-LD, and sitemap',
      author: 'PhilJS Team',
      homepage: 'https://philjs.dev/plugins/seo',
      repository: 'https://github.com/yourusername/philjs',
      license: 'MIT',
      keywords: ['seo', 'meta-tags', 'opengraph', 'twitter-cards', 'json-ld', 'sitemap'],
      philjs: '^2.0.0',
    },

    configSchema: {
      type: 'object',
      properties: {
        baseUrl: {
          type: 'string',
          description: 'Base URL for the site',
        },
        sitemap: {
          type: 'object',
          description: 'Enable sitemap generation',
        },
        robots: {
          type: 'object',
          description: 'Enable robots.txt generation',
        },
        defaults: {
          type: 'object',
          description: 'Default meta tags',
        },
        openGraph: {
          type: 'object',
          description: 'Default OpenGraph tags',
        },
        twitter: {
          type: 'object',
          description: 'Default Twitter Card tags',
        },
      },
    },

    vitePlugin(pluginConfig: SEOPluginConfig): any {
      const mergedConfig = { ...config, ...pluginConfig };
      return createVitePlugin(mergedConfig);
    },

    async setup(pluginConfig: SEOPluginConfig, ctx: PluginContext) {
      const mergedConfig = { ...config, ...pluginConfig };

      ctx.logger.info('Setting up SEO...');

      // Create SEO utility file
      const seoCode = `/**
 * SEO utilities
 * Auto-generated by philjs-plugin-seo
 */

import {
  generateSEOHead,
  updateHead,
  mergeSEO,
  createBreadcrumbs,
  createFAQ,
  createOrganization,
  createWebSite,
} from 'philjs-plugin-seo/head';

import type { PageSEO, MetaTags, OpenGraphTags, TwitterTags, JsonLd } from 'philjs-plugin-seo';

// Default SEO configuration
export const defaultSEO: PageSEO = ${JSON.stringify({
  meta: mergedConfig.defaults,
  openGraph: mergedConfig.openGraph,
  twitter: mergedConfig.twitter,
  jsonLd: mergedConfig.jsonLd,
}, null, 2)};

/**
 * Set page SEO (merges with defaults)
 */
export function setPageSEO(seo: PageSEO): void {
  const merged = mergeSEO(defaultSEO, seo);
  updateHead(merged);
}

/**
 * Generate SEO meta string for SSR
 */
export function generatePageSEO(seo: PageSEO): string {
  const merged = mergeSEO(defaultSEO, seo);
  return generateSEOHead(merged);
}

// Re-exports
export { createBreadcrumbs, createFAQ, createOrganization, createWebSite };
export type { PageSEO, MetaTags, OpenGraphTags, TwitterTags, JsonLd };
`;

      try {
        await ctx.fs.mkdir('src/lib');
        await ctx.fs.writeFile('src/lib/seo.ts', seoCode);
        ctx.logger.success('Created SEO utility file');
      } catch {
        ctx.logger.warn('Could not create SEO file, import directly from the package');
      }

      ctx.logger.success('SEO setup complete!');
      ctx.logger.info(`
Usage:
import { setPageSEO, createBreadcrumbs } from './lib/seo';

// Set page SEO
setPageSEO({
  meta: {
    title: 'My Page',
    description: 'Page description',
  },
  openGraph: {
    image: '/og-image.png',
  },
  jsonLd: createBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
  ]),
});
`);
    },

    hooks: {
      async init(ctx) {
        ctx.logger.debug('SEO plugin initialized');
      },
    },
  };
}

/**
 * Default export
 */
export default createSEOPlugin;

/**
 * Re-export types
 */
export type {
  SEOPluginConfig,
  PageSEO,
  MetaTags,
  OpenGraphTags,
  TwitterTags,
  JsonLd,
  JsonLdType,
  SitemapEntry,
  SitemapConfig,
  RobotsTxtConfig,
  RobotsDirectives,
  OpenGraphImage,
  OrganizationJsonLd,
  WebSiteJsonLd,
  ArticleJsonLd,
  ProductJsonLd,
  BreadcrumbJsonLd,
  FAQJsonLd,
} from './types.js';

/**
 * Re-export head utilities
 */
export {
  generateMetaTags,
  generateOpenGraphTags,
  generateTwitterTags,
  generateJsonLd,
  generateSEOHead,
  mergeSEO,
  updateHead,
  createBreadcrumbs,
  createFAQ,
  createOrganization,
  createWebSite,
} from './head.js';
