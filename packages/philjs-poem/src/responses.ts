/**
 * PhilJS Poem Responses
 *
 * Custom response types for the Poem framework integration.
 */

import type {
  ResponseOptions,
  HtmlResponseOptions,
  JsonResponseOptions,
  StreamResponseOptions,
  MetaTag,
  Script,
} from './types.js';

// ============================================================================
// HTML Response
// ============================================================================

/**
 * HTML Response builder for PhilJS views
 */
export class HtmlResponse {
  private content: string = '';
  private options: HtmlResponseOptions;

  constructor(options: HtmlResponseOptions = {}) {
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
   * Set HTTP status
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
   * Generate Rust response code
   */
  static toRustCode(): string {
    return `
use poem::{Response, IntoResponse};
use poem::http::{StatusCode, header};

/// PhilJS HTML Response
pub struct PhilJsHtml {
    content: String,
    status: StatusCode,
    headers: Vec<(String, String)>,
}

impl PhilJsHtml {
    pub fn new(content: impl Into<String>) -> Self {
        Self {
            content: content.into(),
            status: StatusCode::OK,
            headers: Vec::new(),
        }
    }

    pub fn status(mut self, status: StatusCode) -> Self {
        self.status = status;
        self
    }

    pub fn header(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.headers.push((name.into(), value.into()));
        self
    }

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
        Self { content: html, ..self }
    }

    pub fn with_hydration<T: serde::Serialize>(self, data: &T) -> Self {
        let json = serde_json::to_string(data).unwrap_or_default();
        let script = format!(
            r#"<script type="application/json" id="__PHILJS_DATA__">{}</script>
<script>window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);</script>"#,
            json
        );
        let content = self.content.replace("</body>", &format!("{}</body>", script));
        Self { content, ..self }
    }
}

impl IntoResponse for PhilJsHtml {
    fn into_response(self) -> Response {
        let mut resp = Response::builder()
            .status(self.status)
            .header(header::CONTENT_TYPE, "text/html; charset=utf-8")
            .body(self.content);

        for (name, value) in self.headers {
            resp = resp.header(name, value);
        }

        resp
    }
}

pub fn render<V: philjs::IntoView>(view: V) -> PhilJsHtml {
    let html = philjs::render_to_string(|| view);
    PhilJsHtml::new(html)
}

pub fn render_document<V: philjs::IntoView>(title: &str, view: V) -> PhilJsHtml {
    render(view).document(title)
}
`.trim();
  }
}

// ============================================================================
// JSON Response
// ============================================================================

/**
 * JSON Response builder
 */
export class JsonResponse<T> {
  private data: T;
  private options: JsonResponseOptions;

  constructor(data: T, options: JsonResponseOptions = {}) {
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
   * Set HTTP status
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
   * Generate Rust response code
   */
  static toRustCode(): string {
    return `
use poem::{Response, IntoResponse};
use poem::http::{StatusCode, header};
use serde::Serialize;

/// PhilJS JSON Response
pub struct PhilJsJson<T: Serialize> {
    data: T,
    status: StatusCode,
    pretty: bool,
}

impl<T: Serialize> PhilJsJson<T> {
    pub fn new(data: T) -> Self {
        Self {
            data,
            status: StatusCode::OK,
            pretty: false,
        }
    }

    pub fn status(mut self, status: StatusCode) -> Self {
        self.status = status;
        self
    }

    pub fn pretty(mut self) -> Self {
        self.pretty = true;
        self
    }
}

impl<T: Serialize> IntoResponse for PhilJsJson<T> {
    fn into_response(self) -> Response {
        let json = if self.pretty {
            serde_json::to_string_pretty(&self.data)
        } else {
            serde_json::to_string(&self.data)
        };

        match json {
            Ok(body) => Response::builder()
                .status(self.status)
                .header(header::CONTENT_TYPE, "application/json")
                .body(body),
            Err(e) => Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(format!("JSON error: {}", e)),
        }
    }
}

pub fn json<T: Serialize>(data: T) -> PhilJsJson<T> {
    PhilJsJson::new(data)
}

pub fn json_success<T: Serialize>(data: T) -> PhilJsJson<serde_json::Value> {
    PhilJsJson::new(serde_json::json!({
        "success": true,
        "data": data
    }))
}

pub fn json_error(message: &str, status: StatusCode) -> PhilJsJson<serde_json::Value> {
    PhilJsJson::new(serde_json::json!({
        "success": false,
        "error": message,
        "status": status.as_u16()
    })).status(status)
}
`.trim();
  }
}

// ============================================================================
// Stream Response
// ============================================================================

/**
 * Streaming Response for SSR
 */
export class StreamResponse {
  private options: StreamResponseOptions;

  constructor(options: StreamResponseOptions = {}) {
    this.options = {
      status: 200,
      contentType: 'text/html; charset=utf-8',
      chunkSize: 16384,
      flushInterval: 16,
      ...options,
    };
  }

  /**
   * Set HTTP status
   */
  status(code: number): this {
    this.options.status = code;
    return this;
  }

  /**
   * Generate Rust response code
   */
  static toRustCode(): string {
    return `
use poem::{Response, IntoResponse, Body};
use poem::http::{StatusCode, header};
use tokio::sync::mpsc;
use futures::stream::Stream;

/// PhilJS Streaming Response
pub struct PhilJsStream {
    rx: mpsc::Receiver<String>,
}

impl PhilJsStream {
    pub fn new(rx: mpsc::Receiver<String>) -> Self {
        Self { rx }
    }

    pub fn channel(buffer: usize) -> (StreamSender, Self) {
        let (tx, rx) = mpsc::channel(buffer);
        (StreamSender { tx }, Self { rx })
    }
}

pub struct StreamSender {
    tx: mpsc::Sender<String>,
}

impl StreamSender {
    pub async fn send(&self, chunk: impl Into<String>) -> Result<(), mpsc::error::SendError<String>> {
        self.tx.send(chunk.into()).await
    }

    pub async fn html(&self, html: impl Into<String>) -> Result<(), mpsc::error::SendError<String>> {
        self.send(html).await
    }

    pub async fn suspense_start(&self, id: &str) -> Result<(), mpsc::error::SendError<String>> {
        self.send(format!(r#"<template id="S:{}">"#, id)).await
    }

    pub async fn suspense_end(&self, id: &str, html: &str) -> Result<(), mpsc::error::SendError<String>> {
        self.send(format!(
            r#"</template><script>$RC("S:{}","{}")</script>"#,
            id, html.replace('"', r#"\\""#)
        )).await
    }
}

impl IntoResponse for PhilJsStream {
    fn into_response(self) -> Response {
        use tokio_stream::wrappers::ReceiverStream;
        let stream = ReceiverStream::new(self.rx);

        Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "text/html; charset=utf-8")
            .header(header::TRANSFER_ENCODING, "chunked")
            .body(Body::from_bytes_stream(stream.map(|s| Ok::<_, std::io::Error>(s.into_bytes()))))
    }
}

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
// Redirect Response
// ============================================================================

/**
 * Redirect Response
 */
export class RedirectResponse {
  private url: string;
  private permanent: boolean;

  constructor(url: string, permanent: boolean = false) {
    this.url = url;
    this.permanent = permanent;
  }

  static temporary(url: string): RedirectResponse {
    return new RedirectResponse(url, false);
  }

  static permanent(url: string): RedirectResponse {
    return new RedirectResponse(url, true);
  }

  static seeOther(url: string): RedirectResponse {
    return new RedirectResponse(url, false);
  }

  static toRustCode(): string {
    return `
use poem::web::Redirect;

pub fn redirect(url: &str) -> Redirect {
    Redirect::temporary(url)
}

pub fn redirect_permanent(url: &str) -> Redirect {
    Redirect::permanent(url)
}

pub fn redirect_see_other(url: &str) -> Redirect {
    Redirect::see_other(url)
}
`.trim();
  }
}

// ============================================================================
// Error Response
// ============================================================================

/**
 * Error Response
 */
export class ErrorResponse {
  private code: number;
  private message: string;
  private details?: unknown;

  constructor(code: number, message: string, details?: unknown) {
    this.code = code;
    this.message = message;
    this.details = details;
  }

  static badRequest(message: string = 'Bad Request'): ErrorResponse {
    return new ErrorResponse(400, message);
  }

  static unauthorized(message: string = 'Unauthorized'): ErrorResponse {
    return new ErrorResponse(401, message);
  }

  static forbidden(message: string = 'Forbidden'): ErrorResponse {
    return new ErrorResponse(403, message);
  }

  static notFound(message: string = 'Not Found'): ErrorResponse {
    return new ErrorResponse(404, message);
  }

  static internal(message: string = 'Internal Server Error'): ErrorResponse {
    return new ErrorResponse(500, message);
  }

  toJson(): string {
    return JSON.stringify({
      error: this.message,
      status: this.code,
      details: this.details,
    });
  }

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

  static toRustCode(): string {
    return `
use poem::{Response, IntoResponse, error::ResponseError};
use poem::http::StatusCode;
use serde::Serialize;
use std::fmt;

#[derive(Debug, Serialize)]
pub struct PhilJsError {
    pub error: String,
    pub status: u16,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl PhilJsError {
    pub fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            error: message.into(),
            status: status.as_u16(),
            details: None,
        }
    }

    pub fn with_details(mut self, details: impl Serialize) -> Self {
        self.details = serde_json::to_value(details).ok();
        self
    }

    pub fn bad_request(message: &str) -> Self {
        Self::new(StatusCode::BAD_REQUEST, message)
    }

    pub fn unauthorized(message: &str) -> Self {
        Self::new(StatusCode::UNAUTHORIZED, message)
    }

    pub fn forbidden(message: &str) -> Self {
        Self::new(StatusCode::FORBIDDEN, message)
    }

    pub fn not_found(message: &str) -> Self {
        Self::new(StatusCode::NOT_FOUND, message)
    }

    pub fn internal(message: &str) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, message)
    }
}

impl fmt::Display for PhilJsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.error)
    }
}

impl std::error::Error for PhilJsError {}

impl ResponseError for PhilJsError {
    fn status(&self) -> StatusCode {
        StatusCode::from_u16(self.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR)
    }

    fn as_response(&self) -> Response {
        let json = serde_json::to_string(self).unwrap_or_else(|_| "{}".to_string());
        Response::builder()
            .status(self.status())
            .header("Content-Type", "application/json")
            .body(json)
    }
}
`.trim();
  }
}

// ============================================================================
// File Response
// ============================================================================

/**
 * File Download Response
 */
export class FileResponse {
  private filename: string;
  private contentType: string;
  private data: Uint8Array | string;
  private inline: boolean;

  constructor(filename: string, data: Uint8Array | string, contentType?: string, inline: boolean = false) {
    this.filename = filename;
    this.data = data;
    this.contentType = contentType || 'application/octet-stream';
    this.inline = inline;
  }

  static toRustCode(): string {
    return `
use poem::{Response, IntoResponse};
use poem::http::header;

pub struct FileResponse {
    filename: String,
    content_type: String,
    data: Vec<u8>,
    inline: bool,
}

impl FileResponse {
    pub fn new(filename: impl Into<String>, data: Vec<u8>) -> Self {
        Self {
            filename: filename.into(),
            content_type: "application/octet-stream".to_string(),
            data,
            inline: false,
        }
    }

    pub fn content_type(mut self, ct: impl Into<String>) -> Self {
        self.content_type = ct.into();
        self
    }

    pub fn inline(mut self) -> Self {
        self.inline = true;
        self
    }
}

impl IntoResponse for FileResponse {
    fn into_response(self) -> Response {
        let disposition = if self.inline {
            format!("inline; filename=\"{}\"", self.filename)
        } else {
            format!("attachment; filename=\"{}\"", self.filename)
        };

        Response::builder()
            .header(header::CONTENT_TYPE, self.content_type)
            .header(header::CONTENT_DISPOSITION, disposition)
            .body(self.data)
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
export function html(content: string, options?: HtmlResponseOptions): HtmlResponse {
  return new HtmlResponse(options).html(content);
}

/**
 * Create a JSON response
 */
export function json<T>(data: T, options?: JsonResponseOptions): JsonResponse<T> {
  return new JsonResponse(data, options);
}

/**
 * Create a streaming response
 */
export function stream(options?: StreamResponseOptions): StreamResponse {
  return new StreamResponse(options);
}

/**
 * Create a redirect response
 */
export function redirect(url: string, permanent: boolean = false): RedirectResponse {
  return new RedirectResponse(url, permanent);
}

/**
 * Create an error response
 */
export function error(code: number, message: string, details?: unknown): ErrorResponse {
  return new ErrorResponse(code, message, details);
}

/**
 * Create a file download response
 */
export function file(
  filename: string,
  data: Uint8Array | string,
  contentType?: string
): FileResponse {
  return new FileResponse(filename, data, contentType);
}
