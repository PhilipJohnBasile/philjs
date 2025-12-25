/**
 * PhilJS Rocket SSR
 *
 * Server-side rendering integration for Rocket framework.
 * Provides streaming SSR, hydration, and SEO utilities.
 */

import type { RocketSSRConfig } from './types';

// ============================================================================
// SSR Types
// ============================================================================

/**
 * SSR context passed to renderers
 */
export interface SSRContext {
  /** Request URL */
  url: string;
  /** Request path */
  path: string;
  /** Query parameters */
  query: Record<string, string>;
  /** Request headers */
  headers: Record<string, string>;
  /** User agent */
  userAgent?: string;
  /** Whether the client is a bot */
  isBot: boolean;
  /** Accept-Language header parsed */
  acceptLanguage: string[];
  /** Whether the client is mobile */
  isMobile: boolean;
  /** Request ID for tracing */
  requestId: string;
}

/**
 * SSR render result
 */
export interface SSRResult {
  /** Rendered HTML */
  html: string;
  /** Document head content */
  head: HeadContent;
  /** Hydration data */
  hydrationData?: unknown;
  /** HTTP status */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Redirect URL (if applicable) */
  redirect?: string;
}

/**
 * Head content for SEO
 */
export interface HeadContent {
  /** Document title */
  title?: string;
  /** Meta tags */
  meta: MetaTag[];
  /** Link tags */
  links: LinkTag[];
  /** Scripts (head) */
  scripts: ScriptTag[];
  /** Styles */
  styles: StyleTag[];
  /** JSON-LD structured data */
  jsonLd?: Record<string, unknown>;
}

/**
 * Meta tag
 */
export interface MetaTag {
  name?: string;
  property?: string;
  content: string;
  httpEquiv?: string;
  charset?: string;
}

/**
 * Link tag
 */
export interface LinkTag {
  rel: string;
  href: string;
  type?: string;
  as?: string;
  crossorigin?: string;
  hreflang?: string;
}

/**
 * Script tag
 */
export interface ScriptTag {
  src?: string;
  content?: string;
  type?: string;
  async?: boolean;
  defer?: boolean;
  module?: boolean;
  id?: string;
}

/**
 * Style tag
 */
export interface StyleTag {
  content: string;
  id?: string;
}

/**
 * Render function type
 */
export type RenderFunction<T = unknown> = (
  props: T,
  ctx: SSRContext
) => string | Promise<string>;

// ============================================================================
// SSR Renderer
// ============================================================================

/**
 * SSR Renderer configuration
 */
export interface SSRRendererConfig {
  /** Enable streaming */
  streaming?: boolean;
  /** Enable hydration */
  hydration?: boolean;
  /** Default title */
  defaultTitle?: string;
  /** Default meta tags */
  defaultMeta?: MetaTag[];
  /** Static assets path */
  assetsPath?: string;
  /** Enable caching */
  cache?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
}

/**
 * SSR Renderer class
 */
export class SSRRenderer {
  private config: SSRRendererConfig;
  private cache: Map<string, { html: string; expires: number }> = new Map();

  constructor(config: SSRRendererConfig = {}) {
    this.config = {
      streaming: false,
      hydration: true,
      defaultTitle: 'PhilJS App',
      defaultMeta: [
        { charset: 'UTF-8' } as MetaTag,
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ],
      assetsPath: '/static',
      cache: false,
      cacheTTL: 300,
      ...config,
    };
  }

  /**
   * Render a component to HTML
   */
  async render<T>(
    renderFn: RenderFunction<T>,
    props: T,
    ctx: SSRContext
  ): Promise<SSRResult> {
    // Check cache
    if (this.config.cache) {
      const cacheKey = this.getCacheKey(ctx);
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return {
          html: cached.html,
          head: { meta: [], links: [], scripts: [], styles: [] },
          status: 200,
          headers: { 'X-SSR-Cache': 'HIT' },
        };
      }
    }

    // Collect head content
    const headCollector = new HeadCollector(this.config.defaultTitle, this.config.defaultMeta);

    // Render component
    const html = await renderFn(props, ctx);

    // Build head
    const head = headCollector.build();

    // Build full document
    const fullHtml = this.buildDocument(html, head, props);

    // Cache if enabled
    if (this.config.cache) {
      const cacheKey = this.getCacheKey(ctx);
      this.cache.set(cacheKey, {
        html: fullHtml,
        expires: Date.now() + (this.config.cacheTTL || 300) * 1000,
      });
    }

    return {
      html: fullHtml,
      head,
      hydrationData: this.config.hydration ? props : undefined,
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-SSR-Rendered': 'true',
      },
    };
  }

  /**
   * Render with streaming
   */
  renderStream<T>(
    renderFn: RenderFunction<T>,
    props: T,
    ctx: SSRContext
  ): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    const config = this.config;
    const headCollector = new HeadCollector(config.defaultTitle, config.defaultMeta);

    return new ReadableStream({
      async start(controller) {
        // Send document head
        const headHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headCollector.getTitle()}</title>
    ${headCollector.renderMeta()}
    <script>
        // Streaming SSR client runtime
        window.__PHILJS_STREAMING__ = true;
        function __philjs_inject(id, html) {
            const el = document.getElementById('suspense-' + id);
            if (el) {
                const temp = document.createElement('div');
                temp.innerHTML = html;
                el.replaceWith(...temp.childNodes);
            }
        }
    </script>
</head>
<body>
<div id="app">`;

        controller.enqueue(encoder.encode(headHtml));

        // Render and stream content
        try {
          const content = await renderFn(props, ctx);
          controller.enqueue(encoder.encode(content));
        } catch (error) {
          controller.enqueue(encoder.encode(`<div class="error">Render error</div>`));
        }

        // Send hydration script and close
        if (config.hydration) {
          const hydrationScript = `
</div>
<script type="application/json" id="__PHILJS_DATA__">${JSON.stringify(props)}</script>
<script>window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);</script>
<script type="module" src="${config.assetsPath}/app.js"></script>
</body>
</html>`;
          controller.enqueue(encoder.encode(hydrationScript));
        } else {
          controller.enqueue(encoder.encode(`
</div>
<script type="module" src="${config.assetsPath}/app.js"></script>
</body>
</html>`));
        }

        controller.close();
      },
    });
  }

  /**
   * Build a full HTML document
   */
  private buildDocument(content: string, head: HeadContent, hydrationData?: unknown): string {
    const metaTags = head.meta
      .map(tag => {
        if (tag.charset) return `<meta charset="${tag.charset}">`;
        if (tag.httpEquiv) return `<meta http-equiv="${tag.httpEquiv}" content="${tag.content}">`;
        if (tag.property) return `<meta property="${tag.property}" content="${tag.content}">`;
        if (tag.name) return `<meta name="${tag.name}" content="${tag.content}">`;
        return '';
      })
      .filter(Boolean)
      .join('\n    ');

    const linkTags = head.links
      .map(link => {
        let attrs = `rel="${link.rel}" href="${link.href}"`;
        if (link.type) attrs += ` type="${link.type}"`;
        if (link.as) attrs += ` as="${link.as}"`;
        if (link.crossorigin) attrs += ` crossorigin="${link.crossorigin}"`;
        if (link.hreflang) attrs += ` hreflang="${link.hreflang}"`;
        return `<link ${attrs}>`;
      })
      .join('\n    ');

    const styleTags = head.styles
      .map(style => `<style${style.id ? ` id="${style.id}"` : ''}>${style.content}</style>`)
      .join('\n    ');

    const headScripts = head.scripts
      .map(script => {
        let attrs = '';
        if (script.type) attrs += ` type="${script.type}"`;
        if (script.async) attrs += ' async';
        if (script.defer) attrs += ' defer';
        if (script.module) attrs += ' type="module"';
        if (script.id) attrs += ` id="${script.id}"`;

        if (script.src) {
          return `<script${attrs} src="${script.src}"></script>`;
        }
        return `<script${attrs}>${script.content || ''}</script>`;
      })
      .join('\n    ');

    const jsonLd = head.jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(head.jsonLd)}</script>`
      : '';

    const hydrationScript = hydrationData && this.config.hydration
      ? `<script type="application/json" id="__PHILJS_DATA__">${JSON.stringify(hydrationData)}</script>
    <script>window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);</script>`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    ${metaTags}
    <title>${head.title || this.config.defaultTitle}</title>
    ${linkTags}
    ${styleTags}
    ${headScripts}
    ${jsonLd}
</head>
<body>
    <div id="app">${content}</div>
    ${hydrationScript}
    <script type="module" src="${this.config.assetsPath}/app.js"></script>
</body>
</html>`;
  }

  /**
   * Get cache key for a request
   */
  private getCacheKey(ctx: SSRContext): string {
    return `ssr:${ctx.path}:${JSON.stringify(ctx.query)}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  pruneCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires < now) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Head content collector
 */
class HeadCollector {
  private title?: string;
  private meta: MetaTag[] = [];
  private links: LinkTag[] = [];
  private scripts: ScriptTag[] = [];
  private styles: StyleTag[] = [];
  private jsonLd?: Record<string, unknown>;

  constructor(defaultTitle?: string, defaultMeta?: MetaTag[]) {
    this.title = defaultTitle;
    this.meta = [...(defaultMeta || [])];
  }

  setTitle(title: string): void {
    this.title = title;
  }

  getTitle(): string {
    return this.title || 'PhilJS App';
  }

  addMeta(tag: MetaTag): void {
    this.meta.push(tag);
  }

  addLink(tag: LinkTag): void {
    this.links.push(tag);
  }

  addScript(tag: ScriptTag): void {
    this.scripts.push(tag);
  }

  addStyle(tag: StyleTag): void {
    this.styles.push(tag);
  }

  setJsonLd(data: Record<string, unknown>): void {
    this.jsonLd = data;
  }

  renderMeta(): string {
    return this.meta
      .map(tag => {
        if (tag.charset) return `<meta charset="${tag.charset}">`;
        if (tag.httpEquiv) return `<meta http-equiv="${tag.httpEquiv}" content="${tag.content}">`;
        if (tag.property) return `<meta property="${tag.property}" content="${tag.content}">`;
        if (tag.name) return `<meta name="${tag.name}" content="${tag.content}">`;
        return '';
      })
      .filter(Boolean)
      .join('\n    ');
  }

  build(): HeadContent {
    return {
      title: this.title,
      meta: this.meta,
      links: this.links,
      scripts: this.scripts,
      styles: this.styles,
      jsonLd: this.jsonLd,
    };
  }
}

// ============================================================================
// SSR Context Helpers
// ============================================================================

/**
 * Create SSR context from request data
 */
export function createSSRContext(
  url: string,
  headers: Record<string, string>
): SSRContext {
  const urlObj = new URL(url, 'http://localhost');
  const userAgent = headers['user-agent'] || '';

  return {
    url,
    path: urlObj.pathname,
    query: Object.fromEntries(urlObj.searchParams),
    headers,
    userAgent,
    isBot: detectBot(userAgent),
    isMobile: detectMobile(userAgent),
    acceptLanguage: parseAcceptLanguage(headers['accept-language'] || ''),
    requestId: generateRequestId(),
  };
}

/**
 * Detect if user agent is a bot
 */
function detectBot(userAgent: string): boolean {
  const botPatterns = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot',
    'baiduspider', 'yandexbot', 'facebookexternalhit',
    'twitterbot', 'linkedinbot', 'bot', 'spider', 'crawler',
  ];
  const ua = userAgent.toLowerCase();
  return botPatterns.some(pattern => ua.includes(pattern));
}

/**
 * Detect if user agent is mobile
 */
function detectMobile(userAgent: string): boolean {
  const mobilePatterns = [
    'mobile', 'android', 'iphone', 'ipad', 'ipod',
    'blackberry', 'windows phone',
  ];
  const ua = userAgent.toLowerCase();
  return mobilePatterns.some(pattern => ua.includes(pattern));
}

/**
 * Parse Accept-Language header
 */
function parseAcceptLanguage(header: string): string[] {
  if (!header) return ['en'];
  return header
    .split(',')
    .map(lang => lang.split(';')[0].trim())
    .filter(Boolean);
}

/**
 * Generate request ID
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// SEO Utilities
// ============================================================================

/**
 * Generate meta tags for SEO
 */
export function generateSEOMeta(options: {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: string;
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  locale?: string;
}): MetaTag[] {
  const meta: MetaTag[] = [
    { name: 'description', content: options.description },
    // Open Graph
    { property: 'og:title', content: options.title },
    { property: 'og:description', content: options.description },
    { property: 'og:url', content: options.url },
    { property: 'og:type', content: options.type || 'website' },
  ];

  if (options.image) {
    meta.push({ property: 'og:image', content: options.image });
  }

  if (options.siteName) {
    meta.push({ property: 'og:site_name', content: options.siteName });
  }

  if (options.locale) {
    meta.push({ property: 'og:locale', content: options.locale });
  }

  // Twitter
  meta.push({ name: 'twitter:card', content: options.twitterCard || 'summary' });
  meta.push({ name: 'twitter:title', content: options.title });
  meta.push({ name: 'twitter:description', content: options.description });

  if (options.image) {
    meta.push({ name: 'twitter:image', content: options.image });
  }

  if (options.twitterSite) {
    meta.push({ name: 'twitter:site', content: options.twitterSite });
  }

  return meta;
}

/**
 * Generate JSON-LD for structured data
 */
export function generateJsonLd(
  type: 'WebSite' | 'Article' | 'Product' | 'Organization' | 'Person' | 'BreadcrumbList',
  data: Record<string, unknown>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an SSR renderer
 */
export function createSSRRenderer(config?: SSRRendererConfig): SSRRenderer {
  return new SSRRenderer(config);
}

/**
 * Create a streaming SSR renderer
 */
export function createStreamingRenderer(config?: Omit<SSRRendererConfig, 'streaming'>): SSRRenderer {
  return new SSRRenderer({ ...config, streaming: true });
}

// ============================================================================
// Rust Code Generation
// ============================================================================

/**
 * Generate Rust SSR code
 */
export function generateRustSSRCode(): string {
  return `
use rocket::{Request, response::Response};
use rocket::http::ContentType;
use std::io::Cursor;
use serde::Serialize;

/// SSR context for PhilJS
#[derive(Debug, Clone, Serialize)]
pub struct SsrContext {
    pub url: String,
    pub path: String,
    pub query: std::collections::HashMap<String, String>,
    pub user_agent: Option<String>,
    pub is_bot: bool,
    pub is_mobile: bool,
    pub accept_language: Vec<String>,
    pub request_id: String,
}

impl SsrContext {
    pub fn from_request(request: &Request<'_>) -> Self {
        let user_agent = request.headers()
            .get_one("User-Agent")
            .map(|s| s.to_string());

        let is_bot = user_agent.as_ref()
            .map(|ua| Self::detect_bot(ua))
            .unwrap_or(false);

        let is_mobile = user_agent.as_ref()
            .map(|ua| Self::detect_mobile(ua))
            .unwrap_or(false);

        let accept_language = request.headers()
            .get_one("Accept-Language")
            .map(|h| Self::parse_accept_language(h))
            .unwrap_or_else(|| vec!["en".to_string()]);

        let query = request.uri()
            .query()
            .map(|q| q.segments()
                .filter_map(|(k, v)| Some((k.to_string(), v.to_string())))
                .collect())
            .unwrap_or_default();

        Self {
            url: request.uri().to_string(),
            path: request.uri().path().to_string(),
            query,
            user_agent,
            is_bot,
            is_mobile,
            accept_language,
            request_id: uuid::Uuid::new_v4().to_string(),
        }
    }

    fn detect_bot(user_agent: &str) -> bool {
        let ua = user_agent.to_lowercase();
        ["googlebot", "bingbot", "bot", "spider", "crawler"]
            .iter()
            .any(|pattern| ua.contains(pattern))
    }

    fn detect_mobile(user_agent: &str) -> bool {
        let ua = user_agent.to_lowercase();
        ["mobile", "android", "iphone", "ipad"]
            .iter()
            .any(|pattern| ua.contains(pattern))
    }

    fn parse_accept_language(header: &str) -> Vec<String> {
        header
            .split(',')
            .filter_map(|lang| lang.split(';').next())
            .map(|s| s.trim().to_string())
            .collect()
    }
}

/// Render a PhilJS view to an SSR response
pub fn render_ssr<T: Serialize>(
    content: &str,
    title: &str,
    hydration_data: Option<&T>,
) -> Response<'static> {
    let hydration_script = hydration_data
        .and_then(|data| serde_json::to_string(data).ok())
        .map(|json| format!(
            r#"<script type="application/json" id="__PHILJS_DATA__">{}</script>
<script>window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);</script>"#,
            json
        ))
        .unwrap_or_default();

    let html = format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{}</title>
    <link rel="stylesheet" href="/static/styles.css">
</head>
<body>
    <div id="app">{}</div>
    {}
    <script type="module" src="/static/app.js"></script>
</body>
</html>"#,
        title, content, hydration_script
    );

    Response::build()
        .header(ContentType::HTML)
        .sized_body(html.len(), Cursor::new(html))
        .finalize()
}

/// Streaming SSR response
pub fn render_ssr_streaming<F>(
    title: &str,
    render_fn: F,
) -> rocket::response::stream::TextStream![String]
where
    F: FnOnce() -> String + Send + 'static,
{
    rocket::response::stream::TextStream! {
        yield format!(
            r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{}</title>
    <link rel="stylesheet" href="/static/styles.css">
</head>
<body>
<div id="app">"#,
            title
        );

        yield render_fn();

        yield r#"</div>
<script type="module" src="/static/app.js"></script>
</body>
</html>"#.to_string();
    }
}
`.trim();
}
