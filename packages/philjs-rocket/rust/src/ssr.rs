//! Server-side rendering utilities for PhilJS Rocket integration

use crate::responders::PhilJsHtml;
use serde::Serialize;

/// SSR configuration options
#[derive(Debug, Clone)]
pub struct SsrConfig {
    /// Enable streaming SSR
    pub streaming: bool,
    /// Enable hydration
    pub hydration: bool,
    /// Compression level (0-9, 0 = disabled)
    pub compression: u8,
    /// Include performance metrics
    pub metrics: bool,
}

impl Default for SsrConfig {
    fn default() -> Self {
        Self {
            streaming: false,
            hydration: true,
            compression: 0,
            metrics: false,
        }
    }
}

/// SSR renderer for PhilJS components
pub struct SsrRenderer {
    config: SsrConfig,
}

impl SsrRenderer {
    /// Create a new SSR renderer
    pub fn new(config: SsrConfig) -> Self {
        Self { config }
    }

    /// Render a component to HTML
    pub fn render<F, V>(&self, f: F) -> String
    where
        F: FnOnce() -> V,
        V: std::fmt::Display,
    {
        f().to_string()
    }

    /// Render with hydration data
    pub fn render_with_hydration<F, V, D>(&self, f: F, data: D) -> String
    where
        F: FnOnce() -> V,
        V: std::fmt::Display,
        D: Serialize,
    {
        let html = self.render(f);
        let data_json = serde_json::to_string(&data).unwrap_or_default();

        format!(
            r#"{}
<script type="application/json" id="__PHILJS_DATA__">{}</script>
<script>
window.__PHILJS_HYDRATION__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);
</script>"#,
            html, data_json
        )
    }

    /// Render to PhilJsHtml response
    pub fn to_response<F, V>(&self, f: F) -> PhilJsHtml
    where
        F: FnOnce() -> V,
        V: std::fmt::Display,
    {
        let html = self.render(f);
        PhilJsHtml::new(html)
    }
}

/// Render a PhilJS view to HTML string
pub fn render<F, V>(f: F) -> String
where
    F: FnOnce() -> V,
    V: philjs::IntoView,
{
    philjs::render_to_string(f)
}

/// Render a PhilJS view to an HTML response
pub fn render_document<F, V>(title: &str, f: F) -> PhilJsHtml
where
    F: FnOnce() -> V,
    V: philjs::IntoView,
{
    let body_html = philjs::render_to_string(f);

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

    PhilJsHtml::new(html)
}

/// Render a PhilJS view with embedded data for hydration
pub fn render_with_data<F, V, D>(title: &str, f: F, data: D) -> PhilJsHtml
where
    F: FnOnce() -> V,
    V: philjs::IntoView,
    D: Serialize,
{
    let body_html = philjs::render_to_string(f);
    let data_json = serde_json::to_string(&data).unwrap_or_default();

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
    <script type="application/json" id="__PHILJS_DATA__">{}</script>
    <script>
    window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);
    </script>
    <script type="module" src="/static/app.js"></script>
</body>
</html>"#,
        title, body_html, data_json
    );

    PhilJsHtml::new(html)
}

/// Render a streaming response
pub fn render_stream<F, V>(f: F) -> PhilJsHtml
where
    F: FnOnce() -> V,
    V: philjs::IntoView,
{
    let html = philjs::render_to_string(f);
    // Note: True streaming would require async stream response
    PhilJsHtml::new(html)
}

/// HTML document builder for SSR
pub struct HtmlDocument {
    title: String,
    meta_tags: Vec<MetaTag>,
    stylesheets: Vec<String>,
    scripts: Vec<Script>,
    body: String,
    lang: String,
}

impl HtmlDocument {
    /// Create a new HTML document
    pub fn new(title: impl Into<String>) -> Self {
        Self {
            title: title.into(),
            meta_tags: Vec::new(),
            stylesheets: Vec::new(),
            scripts: Vec::new(),
            body: String::new(),
            lang: "en".to_string(),
        }
    }

    /// Set the language
    pub fn lang(mut self, lang: impl Into<String>) -> Self {
        self.lang = lang.into();
        self
    }

    /// Add a meta tag
    pub fn meta(mut self, tag: MetaTag) -> Self {
        self.meta_tags.push(tag);
        self
    }

    /// Add a stylesheet
    pub fn stylesheet(mut self, href: impl Into<String>) -> Self {
        self.stylesheets.push(href.into());
        self
    }

    /// Add a script
    pub fn script(mut self, script: Script) -> Self {
        self.scripts.push(script);
        self
    }

    /// Set the body content
    pub fn body(mut self, body: impl Into<String>) -> Self {
        self.body = body.into();
        self
    }

    /// Build the HTML document
    pub fn build(self) -> String {
        let mut html = format!(
            r#"<!DOCTYPE html>
<html lang="{}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{}</title>"#,
            self.lang, self.title
        );

        // Add meta tags
        for meta in &self.meta_tags {
            html.push_str("\n    ");
            html.push_str(&meta.render());
        }

        // Add stylesheets
        for stylesheet in &self.stylesheets {
            html.push_str(&format!(
                "\n    <link rel=\"stylesheet\" href=\"{}\">",
                stylesheet
            ));
        }

        html.push_str("\n</head>\n<body>");
        html.push_str("\n    <div id=\"app\">");
        html.push_str(&self.body);
        html.push_str("</div>");

        // Add scripts
        for script in &self.scripts {
            html.push_str("\n    ");
            html.push_str(&script.render());
        }

        html.push_str("\n</body>\n</html>");
        html
    }

    /// Build as PhilJsHtml response
    pub fn respond(self) -> PhilJsHtml {
        PhilJsHtml::new(self.build())
    }
}

/// Meta tag builder
#[derive(Debug, Clone)]
pub struct MetaTag {
    name: Option<String>,
    property: Option<String>,
    content: String,
}

impl MetaTag {
    /// Create a meta tag with name
    pub fn name(name: impl Into<String>, content: impl Into<String>) -> Self {
        Self {
            name: Some(name.into()),
            property: None,
            content: content.into(),
        }
    }

    /// Create a meta tag with property (for Open Graph)
    pub fn property(property: impl Into<String>, content: impl Into<String>) -> Self {
        Self {
            name: None,
            property: Some(property.into()),
            content: content.into(),
        }
    }

    /// Render the meta tag
    fn render(&self) -> String {
        if let Some(name) = &self.name {
            format!("<meta name=\"{}\" content=\"{}\">", name, self.content)
        } else if let Some(property) = &self.property {
            format!(
                "<meta property=\"{}\" content=\"{}\">",
                property, self.content
            )
        } else {
            String::new()
        }
    }
}

/// Script builder
#[derive(Debug, Clone)]
pub struct Script {
    src: Option<String>,
    content: Option<String>,
    module: bool,
    defer: bool,
    async_load: bool,
}

impl Script {
    /// Create an external script
    pub fn src(src: impl Into<String>) -> Self {
        Self {
            src: Some(src.into()),
            content: None,
            module: false,
            defer: false,
            async_load: false,
        }
    }

    /// Create an inline script
    pub fn inline(content: impl Into<String>) -> Self {
        Self {
            src: None,
            content: Some(content.into()),
            module: false,
            defer: false,
            async_load: false,
        }
    }

    /// Mark as ES module
    pub fn module(mut self) -> Self {
        self.module = true;
        self
    }

    /// Add defer attribute
    pub fn defer(mut self) -> Self {
        self.defer = true;
        self
    }

    /// Add async attribute
    pub fn async_load(mut self) -> Self {
        self.async_load = true;
        self
    }

    /// Render the script tag
    fn render(&self) -> String {
        let mut attrs = Vec::new();

        if self.module {
            attrs.push("type=\"module\"".to_string());
        }
        if self.defer {
            attrs.push("defer".to_string());
        }
        if self.async_load {
            attrs.push("async".to_string());
        }

        let attrs_str = if attrs.is_empty() {
            String::new()
        } else {
            format!(" {}", attrs.join(" "))
        };

        if let Some(src) = &self.src {
            format!("<script src=\"{}\"{}></script>", src, attrs_str)
        } else if let Some(content) = &self.content {
            format!("<script{}>{}</script>", attrs_str, content)
        } else {
            String::new()
        }
    }
}

/// SEO helper for building meta tags
pub struct SeoBuilder {
    title: String,
    description: Option<String>,
    keywords: Vec<String>,
    og_tags: Vec<(String, String)>,
    twitter_tags: Vec<(String, String)>,
}

impl SeoBuilder {
    /// Create a new SEO builder
    pub fn new(title: impl Into<String>) -> Self {
        Self {
            title: title.into(),
            description: None,
            keywords: Vec::new(),
            og_tags: Vec::new(),
            twitter_tags: Vec::new(),
        }
    }

    /// Set description
    pub fn description(mut self, desc: impl Into<String>) -> Self {
        self.description = Some(desc.into());
        self
    }

    /// Add keywords
    pub fn keywords(mut self, keywords: impl IntoIterator<Item = impl Into<String>>) -> Self {
        self.keywords.extend(keywords.into_iter().map(|k| k.into()));
        self
    }

    /// Add Open Graph tag
    pub fn og(mut self, property: impl Into<String>, content: impl Into<String>) -> Self {
        self.og_tags.push((property.into(), content.into()));
        self
    }

    /// Add Twitter card tag
    pub fn twitter(mut self, name: impl Into<String>, content: impl Into<String>) -> Self {
        self.twitter_tags.push((name.into(), content.into()));
        self
    }

    /// Build meta tags
    pub fn build(self) -> Vec<MetaTag> {
        let mut tags = vec![MetaTag::name("title", &self.title)];

        if let Some(desc) = &self.description {
            tags.push(MetaTag::name("description", desc));
        }

        if !self.keywords.is_empty() {
            tags.push(MetaTag::name("keywords", self.keywords.join(", ")));
        }

        // Open Graph
        tags.push(MetaTag::property("og:title", &self.title));
        if let Some(desc) = &self.description {
            tags.push(MetaTag::property("og:description", desc));
        }
        for (property, content) in self.og_tags {
            tags.push(MetaTag::property(property, content));
        }

        // Twitter
        for (name, content) in self.twitter_tags {
            tags.push(MetaTag::name(format!("twitter:{}", name), content));
        }

        tags
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_html_document() {
        let doc = HtmlDocument::new("Test Page")
            .lang("en")
            .meta(MetaTag::name("description", "Test description"))
            .stylesheet("/styles.css")
            .script(Script::src("/app.js").module())
            .body("<h1>Hello World</h1>")
            .build();

        assert!(doc.contains("<!DOCTYPE html>"));
        assert!(doc.contains("<title>Test Page</title>"));
        assert!(doc.contains("<h1>Hello World</h1>"));
    }

    #[test]
    fn test_seo_builder() {
        let tags = SeoBuilder::new("Test Title")
            .description("Test description")
            .keywords(vec!["test", "seo"])
            .og("image", "https://example.com/image.jpg")
            .twitter("card", "summary")
            .build();

        assert!(!tags.is_empty());
    }

    #[test]
    fn test_script_rendering() {
        let script = Script::src("/app.js").module().defer().render();
        assert!(script.contains("type=\"module\""));
        assert!(script.contains("defer"));
    }
}
