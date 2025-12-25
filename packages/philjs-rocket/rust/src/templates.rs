//! Template support for PhilJS Rocket integration
//!
//! Provides integration with Tera and Handlebars template engines.

use rocket::fairing::{Fairing, Info, Kind};
use rocket::{Rocket, Build};
use rocket_dyn_templates::{Template, Engines};
use serde::Serialize;
use std::collections::HashMap;

/// Template context for rendering
#[derive(Default, Serialize)]
pub struct TemplateContext {
    /// Template data
    #[serde(flatten)]
    data: HashMap<String, serde_json::Value>,
}

impl TemplateContext {
    /// Create a new empty context
    pub fn new() -> Self {
        Self::default()
    }

    /// Insert a value into the context
    pub fn insert<T: Serialize>(&mut self, key: impl Into<String>, value: T) {
        if let Ok(json) = serde_json::to_value(value) {
            self.data.insert(key.into(), json);
        }
    }

    /// Chain insert for builder pattern
    pub fn with<T: Serialize>(mut self, key: impl Into<String>, value: T) -> Self {
        self.insert(key, value);
        self
    }

    /// Get a value from the context
    pub fn get(&self, key: &str) -> Option<&serde_json::Value> {
        self.data.get(key)
    }

    /// Check if the context contains a key
    pub fn contains(&self, key: &str) -> bool {
        self.data.contains_key(key)
    }

    /// Merge another context into this one
    pub fn merge(&mut self, other: TemplateContext) {
        for (key, value) in other.data {
            self.data.insert(key, value);
        }
    }

    /// Create context from a serializable struct
    pub fn from_struct<T: Serialize>(data: &T) -> Self {
        let mut ctx = Self::new();
        if let Ok(json) = serde_json::to_value(data) {
            if let serde_json::Value::Object(map) = json {
                for (key, value) in map {
                    ctx.data.insert(key, value);
                }
            }
        }
        ctx
    }
}

/// Render a template with context
pub fn render_template(name: &str, context: TemplateContext) -> Template {
    Template::render(name, context)
}

/// Template fairing for registering custom functions and filters
pub fn template_fairing() -> impl Fairing {
    Template::custom(|engines: &mut Engines| {
        // Add custom Tera functions
        engines.tera.as_mut().map(|tera| {
            // Register custom global functions
            tera.register_function("philjs_version", tera_philjs_version);
            tera.register_function("asset_url", tera_asset_url);

            // Register custom filters
            tera.register_filter("json_pretty", tera_json_pretty);
            tera.register_filter("truncate_words", tera_truncate_words);
        });

        // Add custom Handlebars helpers
        engines.handlebars.as_mut().map(|hbs| {
            hbs.register_helper("philjs_version", Box::new(hbs_philjs_version));
            hbs.register_helper("asset_url", Box::new(hbs_asset_url));
        });
    })
}

// Tera custom functions

fn tera_philjs_version(
    _args: &HashMap<String, tera::Value>,
) -> tera::Result<tera::Value> {
    Ok(tera::Value::String("2.0.0".to_string()))
}

fn tera_asset_url(
    args: &HashMap<String, tera::Value>,
) -> tera::Result<tera::Value> {
    let path = args
        .get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| tera::Error::msg("'path' argument is required"))?;

    Ok(tera::Value::String(format!("/static/{}", path)))
}

fn tera_json_pretty(
    value: &tera::Value,
    _args: &HashMap<String, tera::Value>,
) -> tera::Result<tera::Value> {
    let pretty = serde_json::to_string_pretty(value)
        .map_err(|e| tera::Error::msg(format!("JSON error: {}", e)))?;
    Ok(tera::Value::String(pretty))
}

fn tera_truncate_words(
    value: &tera::Value,
    args: &HashMap<String, tera::Value>,
) -> tera::Result<tera::Value> {
    let s = value.as_str().unwrap_or("");
    let count = args
        .get("count")
        .and_then(|v| v.as_u64())
        .unwrap_or(10) as usize;

    let words: Vec<&str> = s.split_whitespace().collect();
    let truncated = if words.len() > count {
        format!("{}...", words[..count].join(" "))
    } else {
        s.to_string()
    };

    Ok(tera::Value::String(truncated))
}

// Handlebars custom helpers

fn hbs_philjs_version(
    _h: &handlebars::Helper,
    _: &handlebars::Handlebars,
    _: &handlebars::Context,
    _: &mut handlebars::RenderContext,
    out: &mut dyn handlebars::Output,
) -> handlebars::HelperResult {
    out.write("2.0.0")?;
    Ok(())
}

fn hbs_asset_url(
    h: &handlebars::Helper,
    _: &handlebars::Handlebars,
    _: &handlebars::Context,
    _: &mut handlebars::RenderContext,
    out: &mut dyn handlebars::Output,
) -> handlebars::HelperResult {
    let path = h
        .param(0)
        .and_then(|v| v.value().as_str())
        .unwrap_or("");

    out.write(&format!("/static/{}", path))?;
    Ok(())
}

/// Template helpers for PhilJS components
pub struct PhilJsTemplateHelpers;

impl PhilJsTemplateHelpers {
    /// Generate a script tag for PhilJS hydration
    pub fn hydration_script(data: &impl Serialize) -> String {
        let json = serde_json::to_string(data).unwrap_or_default();
        format!(
            r#"<script type="application/json" id="__PHILJS_DATA__">{}</script>
<script>window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);</script>"#,
            json
        )
    }

    /// Generate LiveView connection script
    pub fn liveview_script(socket_path: &str) -> String {
        format!(
            r#"<script type="module">
import {{ LiveSocket }} from '/static/philjs-liveview.js';
const liveSocket = new LiveSocket('{}');
liveSocket.connect();
window.liveSocket = liveSocket;
</script>"#,
            socket_path
        )
    }

    /// Generate meta tags for SEO
    pub fn seo_meta(title: &str, description: &str) -> String {
        format!(
            r#"<meta name="title" content="{}">
<meta name="description" content="{}">
<meta property="og:title" content="{}">
<meta property="og:description" content="{}">"#,
            title, description, title, description
        )
    }

    /// Generate CSRF token meta tag
    pub fn csrf_meta(token: &str) -> String {
        format!(r#"<meta name="csrf-token" content="{}">"#, token)
    }
}

/// Template layout helper
pub struct Layout {
    title: String,
    meta_tags: Vec<String>,
    stylesheets: Vec<String>,
    scripts: Vec<String>,
    body_class: Option<String>,
}

impl Layout {
    /// Create a new layout
    pub fn new(title: impl Into<String>) -> Self {
        Self {
            title: title.into(),
            meta_tags: Vec::new(),
            stylesheets: Vec::new(),
            scripts: Vec::new(),
            body_class: None,
        }
    }

    /// Add a meta tag
    pub fn meta(mut self, content: impl Into<String>) -> Self {
        self.meta_tags.push(content.into());
        self
    }

    /// Add a stylesheet
    pub fn stylesheet(mut self, href: impl Into<String>) -> Self {
        self.stylesheets.push(href.into());
        self
    }

    /// Add a script
    pub fn script(mut self, src: impl Into<String>) -> Self {
        self.scripts.push(src.into());
        self
    }

    /// Set body class
    pub fn body_class(mut self, class: impl Into<String>) -> Self {
        self.body_class = Some(class.into());
        self
    }

    /// Render head content
    pub fn head(&self) -> String {
        let mut head = format!(
            r#"<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{}</title>"#,
            self.title
        );

        for meta in &self.meta_tags {
            head.push_str("\n");
            head.push_str(meta);
        }

        for stylesheet in &self.stylesheets {
            head.push_str(&format!(
                "\n<link rel=\"stylesheet\" href=\"{}\">",
                stylesheet
            ));
        }

        head
    }

    /// Render body attributes
    pub fn body_attrs(&self) -> String {
        self.body_class
            .as_ref()
            .map(|c| format!(r#"class="{}""#, c))
            .unwrap_or_default()
    }

    /// Render scripts
    pub fn scripts_html(&self) -> String {
        self.scripts
            .iter()
            .map(|s| format!("<script type=\"module\" src=\"{}\"></script>", s))
            .collect::<Vec<_>>()
            .join("\n")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_template_context() {
        let ctx = TemplateContext::new()
            .with("name", "Test")
            .with("count", 42);

        assert!(ctx.contains("name"));
        assert!(ctx.contains("count"));
    }

    #[test]
    fn test_layout() {
        let layout = Layout::new("Test Page")
            .stylesheet("/styles.css")
            .script("/app.js")
            .body_class("dark-mode");

        assert!(layout.head().contains("Test Page"));
        assert!(layout.head().contains("/styles.css"));
        assert!(layout.body_attrs().contains("dark-mode"));
    }

    #[test]
    fn test_hydration_script() {
        let data = serde_json::json!({"count": 42});
        let script = PhilJsTemplateHelpers::hydration_script(&data);
        assert!(script.contains("__PHILJS_DATA__"));
        assert!(script.contains("42"));
    }
}
