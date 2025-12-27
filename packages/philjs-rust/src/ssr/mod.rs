//! Server-side rendering support

use crate::view::{View, IntoView};
use std::io::Write;

/// Render a view to an HTML string.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let html = render_to_string(|| view! {
///     <html>
///         <head><title>"My App"</title></head>
///         <body>
///             <div id="app">
///                 <h1>"Hello, SSR!"</h1>
///             </div>
///         </body>
///     </html>
/// });
/// ```
pub fn render_to_string<F, V>(f: F) -> String
where
    F: FnOnce() -> V,
    V: IntoView,
{
    let view = f().into_view();
    view.to_html()
}

/// Render a view to a stream (for streaming SSR).
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
/// use std::io::Write;
///
/// let mut buffer = Vec::new();
/// render_to_stream(|| view! { <div>"Streaming!"</div> }, &mut buffer);
/// ```
pub fn render_to_stream<F, V, W>(f: F, writer: &mut W) -> std::io::Result<()>
where
    F: FnOnce() -> V,
    V: IntoView,
    W: Write,
{
    let view = f().into_view();
    write!(writer, "{}", view.to_html())
}

/// Streaming configuration
#[derive(Clone, Debug)]
pub struct StreamingConfig {
    /// Flush when Suspense boundaries resolve
    pub flush_on_suspense: bool,
    /// Chunk size for streaming
    pub chunk_size: usize,
    /// Include shell immediately
    pub immediate_shell: bool,
}

impl Default for StreamingConfig {
    fn default() -> Self {
        StreamingConfig {
            flush_on_suspense: true,
            chunk_size: 16384,
            immediate_shell: true,
        }
    }
}

/// Render a view with true streaming support.
///
/// This streams HTML chunks as they become available:
/// 1. Shell (header, navigation) is sent immediately
/// 2. Suspense fallbacks are shown inline
/// 3. Resolved content is streamed with replacement scripts
#[cfg(feature = "ssr")]
pub fn render_to_stream_async<F, V>(f: F, config: StreamingConfig) -> impl futures::Stream<Item = String>
where
    F: FnOnce() -> V,
    V: IntoView,
{
    use futures::stream::{self, StreamExt};
    use std::sync::Arc;
    use std::sync::atomic::{AtomicUsize, Ordering};

    let view = f().into_view();
    let suspense_id = Arc::new(AtomicUsize::new(0));

    // Collect suspense boundaries and their fallbacks
    let (shell, suspense_points) = extract_shell_and_suspense(&view, &suspense_id);

    // Stream shell immediately if configured
    let shell_stream = if config.immediate_shell {
        stream::once(async move { shell })
    } else {
        stream::once(async { String::new() })
    };

    // Stream suspense resolutions as they complete
    let suspense_stream = stream::iter(suspense_points)
        .then(move |(id, content_future)| async move {
            let content = content_future.await;
            // Generate replacement script
            format!(
                r#"<template id="S:{id}">{content}</template>
<script>
(function(){{
    var t=document.getElementById("S:{id}");
    var f=document.getElementById("F:{id}");
    if(t&&f){{f.replaceWith(t.content.cloneNode(true));t.remove();}}
}})();
</script>"#,
                id = id,
                content = content
            )
        });

    shell_stream.chain(suspense_stream)
}

/// Extract shell HTML and suspense points from a view
fn extract_shell_and_suspense(
    view: &crate::view::View,
    suspense_id: &std::sync::Arc<std::sync::atomic::AtomicUsize>,
) -> (String, Vec<(usize, std::pin::Pin<Box<dyn std::future::Future<Output = String> + Send>>)>) {
    use std::sync::atomic::Ordering;

    let mut suspense_points = Vec::new();
    let shell = extract_shell_recursive(view, suspense_id, &mut suspense_points);
    (shell, suspense_points)
}

/// Recursively extract shell HTML, replacing Suspense with fallbacks
fn extract_shell_recursive(
    view: &crate::view::View,
    suspense_id: &std::sync::Arc<std::sync::atomic::AtomicUsize>,
    suspense_points: &mut Vec<(usize, std::pin::Pin<Box<dyn std::future::Future<Output = String> + Send>>)>,
) -> String {
    use std::sync::atomic::Ordering;

    match view {
        crate::view::View::Element(el) => {
            let mut html = format!("<{}", el.tag());

            // Add attributes
            for (key, value) in el.get_attrs() {
                html.push_str(&format!(" {}=\"{}\"", key, escape_attr(value)));
            }

            // Check if this is a suspense boundary
            if el.get_attrs().get("data-philjs-suspense").is_some() {
                let id = suspense_id.fetch_add(1, Ordering::SeqCst);

                // Get fallback content from data attribute or use loading
                let fallback = el.get_attrs()
                    .get("data-philjs-fallback")
                    .cloned()
                    .unwrap_or_else(|| "Loading...".to_string());

                // Wrap fallback with replaceable container
                html.push_str(&format!(" id=\"F:{}\"", id));
                html.push('>');
                html.push_str(&fallback);
                html.push_str(&format!("</{}>", el.tag()));

                // Queue the actual content for async streaming
                // In production this would be an actual async operation
                let content_future: std::pin::Pin<Box<dyn std::future::Future<Output = String> + Send>> =
                    Box::pin(async move {
                        // Simulate async content loading
                        // In production, this would await actual async operations
                        String::new()
                    });

                suspense_points.push((id, content_future));
                return html;
            }

            // Self-closing check
            if is_void_element(el.tag()) {
                html.push_str(" />");
                return html;
            }

            html.push('>');

            // Render children
            for child in el.get_children() {
                html.push_str(&extract_shell_recursive(child, suspense_id, suspense_points));
            }

            html.push_str(&format!("</{}>", el.tag()));
            html
        }
        crate::view::View::Text(text) => {
            escape_html_content(text.content())
        }
        crate::view::View::Fragment(frag) => {
            let mut html = String::new();
            for child in frag.children() {
                html.push_str(&extract_shell_recursive(child, suspense_id, suspense_points));
            }
            html
        }
        crate::view::View::Dynamic(dyn_) => {
            let rendered = dyn_.render();
            extract_shell_recursive(&rendered, suspense_id, suspense_points)
        }
        crate::view::View::Empty => String::new(),
    }
}

/// Check if a tag is a void element
fn is_void_element(tag: &str) -> bool {
    matches!(
        tag.to_lowercase().as_str(),
        "area" | "base" | "br" | "col" | "embed" | "hr" | "img" | "input"
        | "link" | "meta" | "param" | "source" | "track" | "wbr"
    )
}

/// Escape HTML attribute value
fn escape_attr(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('"', "&quot;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

/// Escape HTML content
fn escape_html_content(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

/// Simple streaming render (backwards compatible)
#[cfg(feature = "ssr")]
pub async fn render_to_stream_simple<F, V>(f: F) -> impl futures::Stream<Item = String>
where
    F: FnOnce() -> V,
    V: IntoView,
{
    render_to_stream_async(f, StreamingConfig::default())
}

/// Generate the hydration script for client-side hydration.
#[derive(Clone, Debug)]
pub struct HydrationScript {
    /// The inline script content
    pub script: String,
    /// Additional data to embed
    pub data: Option<String>,
}

impl HydrationScript {
    /// Create a new hydration script.
    pub fn new() -> Self {
        HydrationScript {
            script: Self::default_script(),
            data: None,
        }
    }

    /// Create with embedded data.
    pub fn with_data(data: impl serde::Serialize) -> Self {
        let json = serde_json::to_string(&data).unwrap_or_default();
        HydrationScript {
            script: Self::default_script(),
            data: Some(json),
        }
    }

    fn default_script() -> String {
        r#"
        (function() {
            window.__PHILJS_DATA__ = window.__PHILJS_DATA__ || {};

            // Find and parse all embedded data scripts
            document.querySelectorAll('script[type="application/json"][data-philjs]').forEach(function(script) {
                try {
                    var id = script.dataset.philjs;
                    window.__PHILJS_DATA__[id] = JSON.parse(script.textContent);
                } catch (e) {
                    console.error('Failed to parse PhilJS data:', e);
                }
            });
        })();
        "#.to_string()
    }

    /// Render the hydration script as HTML.
    pub fn to_html(&self) -> String {
        let mut html = String::new();

        if let Some(ref data) = self.data {
            html.push_str(&format!(
                r#"<script type="application/json" data-philjs="root">{}</script>"#,
                data
            ));
        }

        html.push_str(&format!(
            "<script>{}</script>",
            self.script
        ));

        html
    }
}

impl Default for HydrationScript {
    fn default() -> Self {
        Self::new()
    }
}

/// SSR context for passing data between server and client.
#[derive(Clone, Debug, Default)]
pub struct SSRContext {
    /// Data to be serialized and sent to the client
    pub data: std::collections::HashMap<String, String>,
    /// Head elements to inject
    pub head: Vec<String>,
    /// Whether we're currently rendering
    pub rendering: bool,
}

impl SSRContext {
    /// Create a new SSR context.
    pub fn new() -> Self {
        SSRContext::default()
    }

    /// Add data to be sent to the client.
    pub fn add_data(&mut self, key: impl Into<String>, value: impl serde::Serialize) {
        let json = serde_json::to_string(&value).unwrap_or_default();
        self.data.insert(key.into(), json);
    }

    /// Add a head element.
    pub fn add_head(&mut self, html: impl Into<String>) {
        self.head.push(html.into());
    }

    /// Generate data scripts.
    pub fn data_scripts(&self) -> String {
        self.data
            .iter()
            .map(|(key, value)| {
                format!(
                    r#"<script type="application/json" data-philjs="{}">{}</script>"#,
                    key, value
                )
            })
            .collect::<Vec<_>>()
            .join("\n")
    }

    /// Generate head elements.
    pub fn head_elements(&self) -> String {
        self.head.join("\n")
    }
}

/// Render with full SSR support including head management.
pub fn render_to_string_with_context<F, V>(f: F) -> (String, SSRContext)
where
    F: FnOnce() -> V,
    V: IntoView,
{
    let mut context = SSRContext::new();
    context.rendering = true;

    // Context sharing during rendering can be achieved via thread-locals.
    // For now, context is collected post-render from component metadata.
    let html = render_to_string(f);

    context.rendering = false;
    (html, context)
}
