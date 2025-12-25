//! Request handlers for SSR

use axum::{
    body::Body,
    http::{header, StatusCode},
    response::{IntoResponse, Response},
};
use philjs::prelude::*;
use serde::Serialize;

use crate::response::HtmlResponse;

/// Render a PhilJS view to HTML
pub fn render<F, V>(f: F) -> HtmlResponse
where
    F: FnOnce() -> V,
    V: IntoView,
{
    let html = render_to_string(f);
    HtmlResponse::new(html)
}

/// Render with loader data
pub fn render_with_data<F, V, D>(f: F, data: D) -> HtmlResponse
where
    F: FnOnce() -> V,
    V: IntoView,
    D: Serialize,
{
    let view_html = render_to_string(f);
    let data_json = serde_json::to_string(&data).unwrap_or_default();

    // Inject data script
    let html = format!(
        r#"{}
<script type="application/json" id="__PHILJS_DATA__">{}</script>
<script>
window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);
</script>"#,
        view_html, data_json
    );

    HtmlResponse::new(html)
}

/// Render a streaming response
pub fn render_stream<F, V>(f: F) -> Response
where
    F: FnOnce() -> V + Send + 'static,
    V: IntoView,
{
    // For now, render synchronously
    // TODO: Implement true streaming with Suspense boundaries
    let html = render_to_string(f);

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/html; charset=utf-8")
        .body(Body::from(html))
        .unwrap()
}

/// Render a full HTML document
pub fn render_document<F, V>(
    title: &str,
    f: F,
) -> HtmlResponse
where
    F: FnOnce() -> V,
    V: IntoView,
{
    let body_html = render_to_string(f);

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
        title, body_html
    );

    HtmlResponse::new(html)
}

/// Render with custom head content
pub fn render_with_head<F, V>(
    head: &str,
    f: F,
) -> HtmlResponse
where
    F: FnOnce() -> V,
    V: IntoView,
{
    let body_html = render_to_string(f);

    let html = format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {}
</head>
<body>
    <div id="app">{}</div>
    <script type="module" src="/static/app.js"></script>
</body>
</html>"#,
        head, body_html
    );

    HtmlResponse::new(html)
}
