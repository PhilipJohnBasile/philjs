/**
 * PhilJS Poem SSR (Server-Side Rendering)
 *
 * Server-side rendering helpers for PhilJS components in Poem.
 * Supports both synchronous and streaming SSR, with hydration support.
 */
// ============================================================================
// SSR Renderer
// ============================================================================
/**
 * SSR Renderer for PhilJS components
 */
export class SSRRenderer {
    config;
    constructor(config = {}) {
        this.config = {
            enabled: true,
            streaming: false,
            hydration: true,
            cacheEnabled: false,
            cacheTTL: 300,
            ...config,
        };
    }
    /**
     * Render a component to string
     */
    async render(component, props = {}, options = {}) {
        const startTime = performance.now();
        const head = {
            title: '',
            meta: [],
            links: [],
            scripts: [],
            styles: [],
            ...options.head,
        };
        // Simulate component rendering (actual implementation would call Rust/WASM)
        const html = this.renderComponent(component, props);
        const result = {
            html,
            head,
            renderTime: performance.now() - startTime,
        };
        if (options.hydration !== false && this.config.hydration) {
            result.hydrationData = {
                component,
                props,
                initialState: options.initialState,
            };
        }
        return result;
    }
    /**
     * Render with streaming support
     */
    async *renderStream(component, props = {}, options = {}) {
        // Yield the shell first
        yield {
            type: 'shell',
            content: this.renderShell(options.head),
        };
        // Yield main content
        const html = this.renderComponent(component, props);
        yield {
            type: 'content',
            content: html,
        };
        // Yield hydration script if enabled
        if (options.hydration !== false && this.config.hydration) {
            const hydrationData = {
                component,
                props,
                initialState: options.initialState,
            };
            yield {
                type: 'script',
                content: this.renderHydrationScript(hydrationData),
            };
        }
        // End marker
        yield {
            type: 'end',
            content: '</div></body></html>',
        };
    }
    renderComponent(component, props) {
        // This is a placeholder - actual implementation would use Rust/WASM
        return `<!-- SSR: ${component} -->
<div data-philjs-component="${component}" data-philjs-props='${JSON.stringify(props)}'>
  Loading...
</div>`;
    }
    renderShell(head) {
        const title = head?.title || 'PhilJS App';
        const metaTags = (head?.meta || [])
            .map(tag => {
            if (tag.name)
                return `<meta name="${tag.name}" content="${tag.content}">`;
            if (tag.property)
                return `<meta property="${tag.property}" content="${tag.content}">`;
            return '';
        })
            .filter(Boolean)
            .join('\n    ');
        const links = (head?.links || [])
            .map(link => {
            const attrs = Object.entries(link)
                .map(([k, v]) => `${k}="${v}"`)
                .join(' ');
            return `<link ${attrs}>`;
        })
            .join('\n    ');
        const styles = (head?.styles || [])
            .map(href => `<link rel="stylesheet" href="${href}">`)
            .join('\n    ');
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${metaTags}
    ${links}
    ${styles}
</head>
<body>
<div id="app">`;
    }
    renderHydrationScript(data) {
        return `<script type="application/json" id="__PHILJS_DATA__">${JSON.stringify(data)}</script>
<script>
  window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);
  window.__PHILJS_HYDRATE__ && window.__PHILJS_HYDRATE__();
</script>`;
    }
    /**
     * Generate Rust SSR code
     */
    static toRustCode() {
        return `
use poem::{Response, IntoResponse};
use poem::http::{StatusCode, header};
use tokio::sync::mpsc;
use futures::stream::Stream;
use serde::{Serialize, Deserialize};

/// SSR Configuration
#[derive(Clone)]
pub struct SsrConfig {
    pub streaming: bool,
    pub hydration: bool,
    pub cache_enabled: bool,
    pub cache_ttl: u64,
}

impl Default for SsrConfig {
    fn default() -> Self {
        Self {
            streaming: false,
            hydration: true,
            cache_enabled: false,
            cache_ttl: 300,
        }
    }
}

/// SSR Render Result
#[derive(Debug, Serialize)]
pub struct SsrResult {
    pub html: String,
    pub title: Option<String>,
    pub meta: Vec<MetaTag>,
    pub hydration_data: Option<serde_json::Value>,
    pub render_time_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetaTag {
    pub name: Option<String>,
    pub property: Option<String>,
    pub content: String,
}

/// SSR Renderer
pub struct SsrRenderer {
    config: SsrConfig,
}

impl SsrRenderer {
    pub fn new(config: SsrConfig) -> Self {
        Self { config }
    }

    /// Render a PhilJS component to string
    pub async fn render<V: philjs::IntoView>(
        &self,
        view: V,
        ctx: SsrContext,
    ) -> SsrResult {
        let start = std::time::Instant::now();

        // Render the view to HTML
        let html = philjs::render_to_string(|| view);

        let render_time = start.elapsed().as_secs_f64() * 1000.0;

        SsrResult {
            html,
            title: None,
            meta: Vec::new(),
            hydration_data: if self.config.hydration {
                Some(serde_json::json!({
                    "ctx": ctx,
                    "timestamp": chrono::Utc::now().timestamp_millis()
                }))
            } else {
                None
            },
            render_time_ms: render_time,
        }
    }

    /// Render with streaming
    pub fn render_stream<V: philjs::IntoView + Send + 'static>(
        &self,
        view: V,
        ctx: SsrContext,
    ) -> impl Stream<Item = Result<String, std::io::Error>> {
        let config = self.config.clone();

        async_stream::stream! {
            // Send the document shell
            yield Ok(render_shell(&ctx));

            // Render main content
            let html = philjs::render_to_string(|| view);
            yield Ok(html);

            // Send hydration data
            if config.hydration {
                let hydration_script = format!(
                    r#"<script type="application/json" id="__PHILJS_DATA__">{}</script>
<script>window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);</script>"#,
                    serde_json::to_string(&ctx).unwrap_or_default()
                );
                yield Ok(hydration_script);
            }

            // Close the document
            yield Ok("</div></body></html>".to_string());
        }
    }
}

/// SSR Context from request
#[derive(Debug, Clone, Serialize, Deserialize)]
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
    pub fn from_request(req: &poem::Request) -> Self {
        let user_agent = req.header("User-Agent").map(|s| s.to_string());
        let is_bot = user_agent.as_ref()
            .map(|ua| {
                let ua_lower = ua.to_lowercase();
                ["googlebot", "bingbot", "bot", "spider", "crawler"]
                    .iter()
                    .any(|p| ua_lower.contains(p))
            })
            .unwrap_or(false);

        let is_mobile = user_agent.as_ref()
            .map(|ua| {
                let ua_lower = ua.to_lowercase();
                ["mobile", "android", "iphone", "ipad"]
                    .iter()
                    .any(|p| ua_lower.contains(p))
            })
            .unwrap_or(false);

        Self {
            url: req.uri().to_string(),
            path: req.uri().path().to_string(),
            query: req.uri()
                .query()
                .map(|q| serde_urlencoded::from_str(q).unwrap_or_default())
                .unwrap_or_default(),
            user_agent,
            is_bot,
            is_mobile,
            accept_language: req.header("Accept-Language")
                .map(|h| h.split(',').map(|s| s.split(';').next().unwrap_or("").trim().to_string()).collect())
                .unwrap_or_else(|| vec!["en".to_string()]),
            request_id: uuid::Uuid::new_v4().to_string(),
        }
    }
}

fn render_shell(ctx: &SsrContext) -> String {
    format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhilJS App</title>
</head>
<body>
<div id="app">"#)
}

/// SSR handler macro helper
#[macro_export]
macro_rules! ssr_handler {
    ($name:ident, $view:expr) => {
        #[handler]
        async fn $name(req: &poem::Request) -> impl poem::IntoResponse {
            let ctx = SsrContext::from_request(req);
            let renderer = SsrRenderer::new(SsrConfig::default());
            let result = renderer.render($view, ctx).await;

            poem::Response::builder()
                .content_type("text/html; charset=utf-8")
                .body(result.html)
        }
    };
}
`.trim();
    }
}
/**
 * SSR Cache for storing rendered pages
 */
export class SSRCache {
    cache = new Map();
    defaultTTL;
    constructor(defaultTTL = 300) {
        this.defaultTTL = defaultTTL;
    }
    /**
     * Get a cached result
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.result;
    }
    /**
     * Set a cached result
     */
    set(key, result, ttl) {
        this.cache.set(key, {
            result,
            expiresAt: Date.now() + (ttl || this.defaultTTL) * 1000,
        });
    }
    /**
     * Delete a cached entry
     */
    delete(key) {
        return this.cache.delete(key);
    }
    /**
     * Clear all cached entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Purge expired entries
     */
    purgeExpired() {
        let purged = 0;
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                purged++;
            }
        }
        return purged;
    }
    /**
     * Get cache size
     */
    size() {
        return this.cache.size;
    }
    /**
     * Generate cache key from context
     */
    static generateKey(ctx) {
        return `${ctx.path}?${JSON.stringify(ctx.query)}`;
    }
}
// ============================================================================
// Head Manager
// ============================================================================
/**
 * Head manager for SSR meta tags
 */
export class HeadManager {
    head;
    constructor() {
        this.head = {
            title: '',
            meta: [],
            links: [],
            scripts: [],
            styles: [],
        };
    }
    /**
     * Set document title
     */
    title(title) {
        this.head.title = title;
        return this;
    }
    /**
     * Add meta tag
     */
    meta(tag) {
        this.head.meta.push(tag);
        return this;
    }
    /**
     * Add Open Graph meta tag
     */
    og(property, content) {
        return this.meta({ property: `og:${property}`, content });
    }
    /**
     * Add Twitter card meta tag
     */
    twitter(name, content) {
        return this.meta({ name: `twitter:${name}`, content });
    }
    /**
     * Add description meta tag
     */
    description(content) {
        this.meta({ name: 'description', content });
        this.og('description', content);
        return this;
    }
    /**
     * Add canonical link
     */
    canonical(href) {
        this.head.links.push({ rel: 'canonical', href });
        return this;
    }
    /**
     * Add preload link
     */
    preload(href, as, type) {
        const link = { rel: 'preload', href, as };
        if (type !== undefined)
            link.type = type;
        this.head.links.push(link);
        return this;
    }
    /**
     * Add stylesheet
     */
    stylesheet(href) {
        this.head.styles.push(href);
        return this;
    }
    /**
     * Add script
     */
    script(script) {
        this.head.scripts.push(script);
        return this;
    }
    /**
     * Build head
     */
    build() {
        return this.head;
    }
    /**
     * Render to HTML string
     */
    render() {
        const parts = [];
        if (this.head.title) {
            parts.push(`<title>${this.head.title}</title>`);
        }
        for (const tag of this.head.meta) {
            if (tag.name) {
                parts.push(`<meta name="${tag.name}" content="${tag.content}">`);
            }
            else if (tag.property) {
                parts.push(`<meta property="${tag.property}" content="${tag.content}">`);
            }
            else if (tag.httpEquiv) {
                parts.push(`<meta http-equiv="${tag.httpEquiv}" content="${tag.content}">`);
            }
        }
        for (const link of this.head.links) {
            const attrs = Object.entries(link)
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => `${k}="${v}"`)
                .join(' ');
            parts.push(`<link ${attrs}>`);
        }
        for (const href of this.head.styles) {
            parts.push(`<link rel="stylesheet" href="${href}">`);
        }
        for (const script of this.head.scripts) {
            const attrs = [];
            if (script.type)
                attrs.push(`type="${script.type}"`);
            if (script.async)
                attrs.push('async');
            if (script.defer)
                attrs.push('defer');
            if (script.module)
                attrs.push('type="module"');
            if (script.src) {
                parts.push(`<script ${attrs.join(' ')} src="${script.src}"></script>`);
            }
            else if (script.content) {
                parts.push(`<script ${attrs.join(' ')}>${script.content}</script>`);
            }
        }
        return parts.join('\n');
    }
}
// ============================================================================
// SSR Document
// ============================================================================
/**
 * Full HTML document builder for SSR
 */
export class SSRDocument {
    head;
    bodyContent = '';
    bodyAttrs = {};
    htmlAttrs = { lang: 'en' };
    hydrationData;
    constructor() {
        this.head = new HeadManager();
    }
    /**
     * Get head manager
     */
    getHead() {
        return this.head;
    }
    /**
     * Set HTML attributes
     */
    htmlAttributes(attrs) {
        this.htmlAttrs = { ...this.htmlAttrs, ...attrs };
        return this;
    }
    /**
     * Set body attributes
     */
    bodyAttributes(attrs) {
        this.bodyAttrs = { ...this.bodyAttrs, ...attrs };
        return this;
    }
    /**
     * Set body content
     */
    body(content) {
        this.bodyContent = content;
        return this;
    }
    /**
     * Set hydration data
     */
    hydration(data) {
        this.hydrationData = data;
        return this;
    }
    /**
     * Render full document
     */
    render() {
        const htmlAttrsStr = Object.entries(this.htmlAttrs)
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ');
        const bodyAttrsStr = Object.entries(this.bodyAttrs)
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ');
        const hydrationScript = this.hydrationData
            ? `<script type="application/json" id="__PHILJS_DATA__">${JSON.stringify(this.hydrationData)}</script>
<script>window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);</script>`
            : '';
        return `<!DOCTYPE html>
<html ${htmlAttrsStr}>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${this.head.render()}
</head>
<body${bodyAttrsStr ? ' ' + bodyAttrsStr : ''}>
    <div id="app">${this.bodyContent}</div>
    ${hydrationScript}
</body>
</html>`;
    }
}
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Create an SSR renderer
 */
export function createSSRRenderer(config) {
    return new SSRRenderer(config);
}
/**
 * Create an SSR cache
 */
export function createSSRCache(defaultTTL) {
    return new SSRCache(defaultTTL);
}
/**
 * Create a head manager
 */
export function createHeadManager() {
    return new HeadManager();
}
/**
 * Create an SSR document
 */
export function createSSRDocument() {
    return new SSRDocument();
}
/**
 * Render a component with default settings
 */
export async function renderToString(component, props, options) {
    const renderer = new SSRRenderer();
    const result = await renderer.render(component, props, options);
    return result.html;
}
/**
 * Render a full document
 */
export async function renderDocument(component, props, head) {
    const doc = new SSRDocument();
    const renderer = new SSRRenderer();
    if (head?.title)
        doc.getHead().title(head.title);
    for (const meta of head?.meta || []) {
        doc.getHead().meta(meta);
    }
    const renderOptions = { hydration: true };
    if (head !== undefined)
        renderOptions.head = head;
    const result = await renderer.render(component, props, renderOptions);
    return doc.body(result.html).hydration(result.hydrationData).render();
}
//# sourceMappingURL=ssr.js.map