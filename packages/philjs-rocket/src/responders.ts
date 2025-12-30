/**
 * PhilJS Rocket Responders
 *
 * Custom responders for PhilJS components in Rocket.
 * Responders convert PhilJS views into HTTP responses.
 */

import type {
  ResponderOptions,
  HtmlResponderOptions,
  JsonResponderOptions,
  StreamResponderOptions,
  MetaTag,
  Script,
} from './types.js';

// ============================================================================
// HTML Responder
// ============================================================================

/**
 * HTML Response builder for PhilJS views
 */
export class HtmlResponder {
  private content: string = '';
  private options: HtmlResponderOptions;

  constructor(options: HtmlResponderOptions = {}) {
    this.options = {
      status: 200,
      contentType: 'text/html; charset=utf-8',
      title: 'PhilJS App',
      meta: [],
      scripts: [],
      styles: [],
      ...options,
    };
  }

  /**
   * Set HTML content
   */
  html(content: string): this {
    this.content = content;
    return this;
  }

  /**
   * Set document title
   */
  title(title: string): this {
    this.options.title = title;
    return this;
  }

  /**
   * Add meta tag
   */
  meta(tag: MetaTag): this {
    this.options.meta = [...(this.options.meta || []), tag];
    return this;
  }

  /**
   * Add script
   */
  script(script: Script): this {
    this.options.scripts = [...(this.options.scripts || []), script];
    return this;
  }

  /**
   * Add stylesheet
   */
  style(href: string): this {
    this.options.styles = [...(this.options.styles || []), href];
    return this;
  }

  /**
   * Set hydration data
   */
  hydrationData(data: unknown): this {
    this.options.hydrationData = data;
    return this;
  }

  /**
   * Set HTTP status code
   */
  status(code: number): this {
    this.options.status = code;
    return this;
  }

  /**
   * Add response header
   */
  header(name: string, value: string): this {
    this.options.headers = { ...this.options.headers, [name]: value };
    return this;
  }

  /**
   * Enable caching
   */
  cache(ttl: number): this {
    this.options.cache = true;
    this.options.cacheTTL = ttl;
    return this;
  }

  /**
   * Build full HTML document
   */
  buildDocument(): string {
    const metaTags = (this.options.meta || [])
      .map(tag => {
        if (tag.name) return `<meta name="${tag.name}" content="${tag.content}">`;
        if (tag.property) return `<meta property="${tag.property}" content="${tag.content}">`;
        if (tag.httpEquiv) return `<meta http-equiv="${tag.httpEquiv}" content="${tag.content}">`;
        return '';
      })
      .join('\n    ');

    const stylesheets = (this.options.styles || [])
      .map(href => `<link rel="stylesheet" href="${href}">`)
      .join('\n    ');

    const scripts = (this.options.scripts || [])
      .map(script => {
        const attrs: string[] = [];
        if (script.type) attrs.push(`type="${script.type}"`);
        if (script.async) attrs.push('async');
        if (script.defer) attrs.push('defer');
        if (script.module) attrs.push('type="module"');

        if (script.src) {
          return `<script ${attrs.join(' ')} src="${script.src}"></script>`;
        }
        return `<script ${attrs.join(' ')}>${script.content || ''}</script>`;
      })
      .join('\n    ');

    const hydrationScript = this.options.hydrationData
      ? `<script type="application/json" id="__PHILJS_DATA__">${JSON.stringify(this.options.hydrationData)}</script>
    <script>window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);</script>`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.options.title}</title>
    ${metaTags}
    ${stylesheets}
</head>
<body>
    <div id="app">${this.content}</div>
    ${hydrationScript}
    ${scripts}
</body>
</html>`;
  }

  /**
   * Generate Rust responder code
   */
  toRustCode(): string {
    return `
use rocket::response::{Responder, Response, Result};
use rocket::http::{ContentType, Status, Header};
use rocket::Request;
use std::io::Cursor;

/// PhilJS HTML Response
pub struct PhilJsHtml {
    content: String,
    status: Status,
    headers: Vec<(String, String)>,
}

impl PhilJsHtml {
    pub fn new(content: String) -> Self {
        Self {
            content,
            status: Status::Ok,
            headers: Vec::new(),
        }
    }

    pub fn status(mut self, status: Status) -> Self {
        self.status = status;
        self
    }

    pub fn header(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.headers.push((name.into(), value.into()));
        self
    }

    /// Wrap content in a full HTML document
    pub fn document(self, title: &str) -> Self {
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
    <script type="module" src="/static/app.js"></script>
</body>
</html>"#,
            title, self.content
        );

        Self {
            content: html,
            ..self
        }
    }

    /// Add hydration data for client-side resumption
    pub fn with_hydration<T: serde::Serialize>(self, data: &T) -> Self {
        let data_json = serde_json::to_string(data).unwrap_or_default();
        let hydration_script = format!(
            r#"<script type="application/json" id="__PHILJS_DATA__">{}</script>
<script>window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);</script>"#,
            data_json
        );

        let content = self.content.replace("</body>", &format!("{}</body>", hydration_script));
        Self { content, ..self }
    }
}

impl<'r> Responder<'r, 'static> for PhilJsHtml {
    fn respond_to(self, _request: &'r Request<'_>) -> Result<'static> {
        let mut response = Response::build()
            .status(self.status)
            .header(ContentType::HTML)
            .sized_body(self.content.len(), Cursor::new(self.content))
            .finalize();

        for (name, value) in self.headers {
            response.set_raw_header(name, value);
        }

        Ok(response)
    }
}

/// Render a PhilJS view to HTML response
pub fn render<V: philjs::IntoView>(view: V) -> PhilJsHtml {
    let html = philjs::render_to_string(|| view);
    PhilJsHtml::new(html)
}

/// Render a PhilJS view with a document wrapper
pub fn render_document<V: philjs::IntoView>(title: &str, view: V) -> PhilJsHtml {
    render(view).document(title)
}
`.trim();
  }
}

// ============================================================================
// JSON Responder
// ============================================================================

/**
 * JSON Response builder
 */
export class JsonResponder<T> {
  private data: T;
  private options: JsonResponderOptions;

  constructor(data: T, options: JsonResponderOptions = {}) {
    this.data = data;
    this.options = {
      status: 200,
      contentType: 'application/json; charset=utf-8',
      pretty: false,
      ...options,
    };
  }

  /**
   * Pretty print JSON
   */
  pretty(): this {
    this.options.pretty = true;
    return this;
  }

  /**
   * Set HTTP status code
   */
  status(code: number): this {
    this.options.status = code;
    return this;
  }

  /**
   * Add response header
   */
  header(name: string, value: string): this {
    this.options.headers = { ...this.options.headers, [name]: value };
    return this;
  }

  /**
   * Build JSON string
   */
  build(): string {
    return this.options.pretty
      ? JSON.stringify(this.data, null, 2)
      : JSON.stringify(this.data);
  }

  /**
   * Generate Rust responder code
   */
  static toRustCode(): string {
    return `
use rocket::response::{Responder, Response, Result};
use rocket::http::{ContentType, Status};
use rocket::Request;
use serde::Serialize;
use std::io::Cursor;

/// PhilJS JSON Response
pub struct PhilJsJson<T: Serialize> {
    data: T,
    status: Status,
    pretty: bool,
}

impl<T: Serialize> PhilJsJson<T> {
    pub fn new(data: T) -> Self {
        Self {
            data,
            status: Status::Ok,
            pretty: false,
        }
    }

    pub fn status(mut self, status: Status) -> Self {
        self.status = status;
        self
    }

    pub fn pretty(mut self) -> Self {
        self.pretty = true;
        self
    }
}

impl<'r, T: Serialize> Responder<'r, 'static> for PhilJsJson<T> {
    fn respond_to(self, _request: &'r Request<'_>) -> Result<'static> {
        let json = if self.pretty {
            serde_json::to_string_pretty(&self.data)
        } else {
            serde_json::to_string(&self.data)
        }
        .map_err(|_| Status::InternalServerError)?;

        Response::build()
            .status(self.status)
            .header(ContentType::JSON)
            .sized_body(json.len(), Cursor::new(json))
            .ok()
    }
}

/// Create a JSON response
pub fn json<T: Serialize>(data: T) -> PhilJsJson<T> {
    PhilJsJson::new(data)
}

/// Create a success JSON response
pub fn json_success<T: Serialize>(data: T) -> PhilJsJson<serde_json::Value> {
    PhilJsJson::new(serde_json::json!({
        "success": true,
        "data": data
    }))
}

/// Create an error JSON response
pub fn json_error(message: &str, status: Status) -> PhilJsJson<serde_json::Value> {
    PhilJsJson::new(serde_json::json!({
        "success": false,
        "error": message,
        "status": status.code
    })).status(status)
}
`.trim();
  }
}

// ============================================================================
// Stream Responder
// ============================================================================

/**
 * Streaming HTML Response for SSR
 */
export class StreamResponder {
  private options: StreamResponderOptions;
  private chunks: string[] = [];

  constructor(options: StreamResponderOptions = {}) {
    this.options = {
      status: 200,
      contentType: 'text/html; charset=utf-8',
      chunkSize: 16384,
      flushInterval: 16,
      ...options,
    };
  }

  /**
   * Add a chunk to the stream
   */
  push(chunk: string): this {
    this.chunks.push(chunk);
    return this;
  }

  /**
   * Set HTTP status code
   */
  status(code: number): this {
    this.options.status = code;
    return this;
  }

  /**
   * Generate Rust responder code
   */
  static toRustCode(): string {
    return `
use rocket::response::{Responder, Response, Result};
use rocket::http::{ContentType, Status, Header};
use rocket::Request;
use tokio::sync::mpsc;
use futures::stream::Stream;

/// PhilJS Streaming HTML Response
pub struct PhilJsStream {
    rx: mpsc::Receiver<String>,
}

impl PhilJsStream {
    pub fn new(rx: mpsc::Receiver<String>) -> Self {
        Self { rx }
    }

    /// Create a stream channel
    pub fn channel(buffer: usize) -> (StreamSender, Self) {
        let (tx, rx) = mpsc::channel(buffer);
        (StreamSender { tx }, Self { rx })
    }
}

pub struct StreamSender {
    tx: mpsc::Sender<String>,
}

impl StreamSender {
    /// Send a chunk to the stream
    pub async fn send(&self, chunk: impl Into<String>) -> Result<(), mpsc::error::SendError<String>> {
        self.tx.send(chunk.into()).await
    }

    /// Send HTML content
    pub async fn html(&self, html: impl Into<String>) -> Result<(), mpsc::error::SendError<String>> {
        self.send(html).await
    }

    /// Send a Suspense boundary
    pub async fn suspense_start(&self, id: &str) -> Result<(), mpsc::error::SendError<String>> {
        self.send(format!(r#"<template id="S:{}">"#, id)).await
    }

    /// Complete a Suspense boundary
    pub async fn suspense_end(&self, id: &str, html: &str) -> Result<(), mpsc::error::SendError<String>> {
        self.send(format!(
            r#"</template><script>$RC("S:{}","{}")</script>"#,
            id, html.replace('"', r#"\""#)
        )).await
    }
}

impl<'r> Responder<'r, 'static> for PhilJsStream {
    fn respond_to(self, _request: &'r Request<'_>) -> Result<'static> {
        use tokio_stream::wrappers::ReceiverStream;
        use rocket::response::stream::TextStream;

        let stream = ReceiverStream::new(self.rx);

        Response::build()
            .status(Status::Ok)
            .header(ContentType::HTML)
            .header(Header::new("Transfer-Encoding", "chunked"))
            .streamed_body(stream)
            .ok()
    }
}

/// Create a streaming SSR response
pub fn stream_ssr<F, Fut>(render_fn: F) -> PhilJsStream
where
    F: FnOnce(StreamSender) -> Fut + Send + 'static,
    Fut: std::future::Future<Output = ()> + Send,
{
    let (sender, stream) = PhilJsStream::channel(32);

    tokio::spawn(async move {
        render_fn(sender).await;
    });

    stream
}
`.trim();
  }
}

// ============================================================================
// Redirect Responder
// ============================================================================

/**
 * Redirect Response builder
 */
export class RedirectResponder {
  private url: string;
  private permanent: boolean;

  constructor(url: string, permanent: boolean = false) {
    this.url = url;
    this.permanent = permanent;
  }

  /**
   * Create a temporary redirect (302)
   */
  static temporary(url: string): RedirectResponder {
    return new RedirectResponder(url, false);
  }

  /**
   * Create a permanent redirect (301)
   */
  static permanent(url: string): RedirectResponder {
    return new RedirectResponder(url, true);
  }

  /**
   * Create a "See Other" redirect (303)
   */
  static seeOther(url: string): RedirectResponder {
    return new RedirectResponder(url, false);
  }

  /**
   * Generate Rust responder code
   */
  static toRustCode(): string {
    return `
use rocket::response::Redirect;

/// Create a temporary redirect
pub fn redirect(url: &str) -> Redirect {
    Redirect::to(url.to_string())
}

/// Create a permanent redirect
pub fn redirect_permanent(url: &str) -> Redirect {
    Redirect::permanent(url.to_string())
}

/// Create a "See Other" redirect (for POST/redirect/GET pattern)
pub fn redirect_see_other(url: &str) -> Redirect {
    Redirect::to(url.to_string())
}
`.trim();
  }
}

// ============================================================================
// Error Responder
// ============================================================================

/**
 * Error Response builder
 */
export class ErrorResponder {
  private code: number;
  private message: string;
  private details?: unknown;

  constructor(code: number, message: string, details?: unknown) {
    this.code = code;
    this.message = message;
    this.details = details;
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message: string = 'Bad Request'): ErrorResponder {
    return new ErrorResponder(400, message);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message: string = 'Unauthorized'): ErrorResponder {
    return new ErrorResponder(401, message);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message: string = 'Forbidden'): ErrorResponder {
    return new ErrorResponder(403, message);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message: string = 'Not Found'): ErrorResponder {
    return new ErrorResponder(404, message);
  }

  /**
   * Create a 500 Internal Server Error
   */
  static internal(message: string = 'Internal Server Error'): ErrorResponder {
    return new ErrorResponder(500, message);
  }

  /**
   * Build JSON error response
   */
  toJson(): string {
    return JSON.stringify({
      error: this.message,
      status: this.code,
      details: this.details,
    });
  }

  /**
   * Build HTML error response
   */
  toHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>${this.code} - ${this.message}</title>
    <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; text-align: center; }
        h1 { color: #dc2626; }
    </style>
</head>
<body>
    <h1>${this.code}</h1>
    <p>${this.message}</p>
</body>
</html>`;
  }

  /**
   * Generate Rust responder code
   */
  static toRustCode(): string {
    return `
use rocket::response::{Responder, Response, Result};
use rocket::http::{ContentType, Status};
use rocket::Request;
use std::io::Cursor;
use serde::Serialize;

/// PhilJS Error Response
#[derive(Debug, Serialize)]
pub struct PhilJsError {
    pub error: String,
    pub status: u16,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl PhilJsError {
    pub fn new(status: Status, message: impl Into<String>) -> Self {
        Self {
            error: message.into(),
            status: status.code,
            details: None,
        }
    }

    pub fn with_details(mut self, details: impl Serialize) -> Self {
        self.details = serde_json::to_value(details).ok();
        self
    }

    pub fn bad_request(message: &str) -> Self {
        Self::new(Status::BadRequest, message)
    }

    pub fn unauthorized(message: &str) -> Self {
        Self::new(Status::Unauthorized, message)
    }

    pub fn forbidden(message: &str) -> Self {
        Self::new(Status::Forbidden, message)
    }

    pub fn not_found(message: &str) -> Self {
        Self::new(Status::NotFound, message)
    }

    pub fn internal(message: &str) -> Self {
        Self::new(Status::InternalServerError, message)
    }
}

impl<'r> Responder<'r, 'static> for PhilJsError {
    fn respond_to(self, request: &'r Request<'_>) -> Result<'static> {
        // Check if client accepts JSON
        let accepts_json = request.headers()
            .get_one("Accept")
            .map(|a| a.contains("application/json"))
            .unwrap_or(false);

        if accepts_json {
            let json = serde_json::to_string(&self)
                .map_err(|_| Status::InternalServerError)?;

            Response::build()
                .status(Status::from_code(self.status).unwrap_or(Status::InternalServerError))
                .header(ContentType::JSON)
                .sized_body(json.len(), Cursor::new(json))
                .ok()
        } else {
            let html = format!(
                r#"<!DOCTYPE html>
<html>
<head><title>{} - {}</title></head>
<body>
<h1>{}</h1>
<p>{}</p>
</body>
</html>"#,
                self.status, self.error, self.status, self.error
            );

            Response::build()
                .status(Status::from_code(self.status).unwrap_or(Status::InternalServerError))
                .header(ContentType::HTML)
                .sized_body(html.len(), Cursor::new(html))
                .ok()
        }
    }
}
`.trim();
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create an HTML response
 */
export function html(content: string, options?: HtmlResponderOptions): HtmlResponder {
  return new HtmlResponder(options).html(content);
}

/**
 * Create a JSON response
 */
export function json<T>(data: T, options?: JsonResponderOptions): JsonResponder<T> {
  return new JsonResponder(data, options);
}

/**
 * Create a streaming response
 */
export function stream(options?: StreamResponderOptions): StreamResponder {
  return new StreamResponder(options);
}

/**
 * Create a redirect response
 */
export function redirect(url: string, permanent: boolean = false): RedirectResponder {
  return new RedirectResponder(url, permanent);
}

/**
 * Create an error response
 */
export function error(code: number, message: string, details?: unknown): ErrorResponder {
  return new ErrorResponder(code, message, details);
}
