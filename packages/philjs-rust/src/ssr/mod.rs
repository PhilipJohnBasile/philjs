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

/// Render a view with async streaming support.
#[cfg(feature = "ssr")]
pub async fn render_to_stream_async<F, V>(f: F) -> impl futures::Stream<Item = String>
where
    F: FnOnce() -> V,
    V: IntoView,
{
    use futures::stream;

    let view = f().into_view();
    let html = view.to_html();

    // For now, emit as a single chunk
    // TODO: Implement true streaming with Suspense boundaries
    stream::once(async move { html })
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

    // TODO: Make context available during rendering via thread-local
    let html = render_to_string(f);

    context.rendering = false;
    (html, context)
}
