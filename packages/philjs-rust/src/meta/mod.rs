//! Head/Meta Management for PhilJS
//!
//! Provides components for managing document head elements, similar to leptos_meta.
//! Handles SSR by collecting head elements during render.
//!
//! # Example
//!
//! ```rust
//! use philjs::meta::*;
//!
//! #[component]
//! fn BlogPost(title: String, description: String) -> impl IntoView {
//!     view! {
//!         <Title text=format!("{} | My Blog", title) />
//!         <Meta name="description" content=description />
//!         <Meta property="og:title" content=title.clone() />
//!         <Link rel="canonical" href=format!("/posts/{}", slug) />
//!
//!         <article>
//!             <h1>{title}</h1>
//!             // ...
//!         </article>
//!     }
//! }
//! ```

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use crate::reactive::Signal;
use crate::view::{View, IntoView};

// =============================================================================
// Meta Context (for SSR collection)
// =============================================================================

thread_local! {
    static META_CONTEXT: RefCell<MetaContext> = RefCell::new(MetaContext::new());
}

/// Context for collecting head elements during SSR.
#[derive(Default)]
pub struct MetaContext {
    /// Document title
    pub title: Option<String>,
    /// Title template (e.g., "%s | My Site")
    pub title_template: Option<String>,
    /// Meta tags
    pub meta_tags: Vec<MetaTag>,
    /// Link tags
    pub link_tags: Vec<LinkTag>,
    /// Style tags
    pub style_tags: Vec<StyleTag>,
    /// Script tags
    pub script_tags: Vec<ScriptTag>,
    /// HTML attributes
    pub html_attrs: HashMap<String, String>,
    /// Body attributes
    pub body_attrs: HashMap<String, String>,
}

impl MetaContext {
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the document title.
    pub fn set_title(&mut self, title: String) {
        self.title = Some(title);
    }

    /// Add a meta tag.
    pub fn add_meta(&mut self, tag: MetaTag) {
        // Remove existing tag with same name/property
        if let Some(name) = &tag.name {
            self.meta_tags.retain(|t| t.name.as_ref() != Some(name));
        }
        if let Some(property) = &tag.property {
            self.meta_tags.retain(|t| t.property.as_ref() != Some(property));
        }
        self.meta_tags.push(tag);
    }

    /// Add a link tag.
    pub fn add_link(&mut self, tag: LinkTag) {
        self.link_tags.push(tag);
    }

    /// Add a style tag.
    pub fn add_style(&mut self, tag: StyleTag) {
        self.style_tags.push(tag);
    }

    /// Add a script tag.
    pub fn add_script(&mut self, tag: ScriptTag) {
        self.script_tags.push(tag);
    }

    /// Render all head elements to HTML.
    pub fn render_to_string(&self) -> String {
        let mut html = String::new();

        // Title
        if let Some(title) = &self.title {
            let formatted = if let Some(template) = &self.title_template {
                template.replace("%s", title)
            } else {
                title.clone()
            };
            html.push_str(&format!("<title>{}</title>\n", escape_html(&formatted)));
        }

        // Meta tags
        for meta in &self.meta_tags {
            html.push_str(&meta.to_html());
            html.push('\n');
        }

        // Link tags
        for link in &self.link_tags {
            html.push_str(&link.to_html());
            html.push('\n');
        }

        // Style tags
        for style in &self.style_tags {
            html.push_str(&style.to_html());
            html.push('\n');
        }

        // Script tags
        for script in &self.script_tags {
            html.push_str(&script.to_html());
            html.push('\n');
        }

        html
    }

    /// Get HTML attributes as a string.
    pub fn html_attrs_string(&self) -> String {
        self.html_attrs
            .iter()
            .map(|(k, v)| format!("{}=\"{}\"", k, escape_attr(v)))
            .collect::<Vec<_>>()
            .join(" ")
    }

    /// Get body attributes as a string.
    pub fn body_attrs_string(&self) -> String {
        self.body_attrs
            .iter()
            .map(|(k, v)| format!("{}=\"{}\"", k, escape_attr(v)))
            .collect::<Vec<_>>()
            .join(" ")
    }

    /// Clear the context for reuse.
    pub fn clear(&mut self) {
        self.title = None;
        self.title_template = None;
        self.meta_tags.clear();
        self.link_tags.clear();
        self.style_tags.clear();
        self.script_tags.clear();
        self.html_attrs.clear();
        self.body_attrs.clear();
    }
}

/// Get the current meta context.
pub fn use_meta_context() -> MetaContext {
    META_CONTEXT.with(|ctx| {
        let borrowed = ctx.borrow();
        MetaContext {
            title: borrowed.title.clone(),
            title_template: borrowed.title_template.clone(),
            meta_tags: borrowed.meta_tags.clone(),
            link_tags: borrowed.link_tags.clone(),
            style_tags: borrowed.style_tags.clone(),
            script_tags: borrowed.script_tags.clone(),
            html_attrs: borrowed.html_attrs.clone(),
            body_attrs: borrowed.body_attrs.clone(),
        }
    })
}

/// Run a function with meta context, collecting all head elements.
pub fn with_meta_context<R>(f: impl FnOnce() -> R) -> (R, MetaContext) {
    META_CONTEXT.with(|ctx| ctx.borrow_mut().clear());
    let result = f();
    let context = use_meta_context();
    (result, context)
}

// =============================================================================
// Tag Types
// =============================================================================

/// A meta tag.
#[derive(Clone, Debug)]
pub struct MetaTag {
    pub name: Option<String>,
    pub property: Option<String>,
    pub content: String,
    pub charset: Option<String>,
    pub http_equiv: Option<String>,
}

impl MetaTag {
    pub fn to_html(&self) -> String {
        let mut attrs = Vec::new();

        if let Some(name) = &self.name {
            attrs.push(format!("name=\"{}\"", escape_attr(name)));
        }
        if let Some(property) = &self.property {
            attrs.push(format!("property=\"{}\"", escape_attr(property)));
        }
        if let Some(charset) = &self.charset {
            attrs.push(format!("charset=\"{}\"", escape_attr(charset)));
        }
        if let Some(http_equiv) = &self.http_equiv {
            attrs.push(format!("http-equiv=\"{}\"", escape_attr(http_equiv)));
        }
        attrs.push(format!("content=\"{}\"", escape_attr(&self.content)));

        format!("<meta {} />", attrs.join(" "))
    }
}

/// A link tag.
#[derive(Clone, Debug)]
pub struct LinkTag {
    pub rel: String,
    pub href: Option<String>,
    pub r#type: Option<String>,
    pub media: Option<String>,
    pub sizes: Option<String>,
    pub crossorigin: Option<String>,
    pub integrity: Option<String>,
}

impl LinkTag {
    pub fn to_html(&self) -> String {
        let mut attrs = vec![format!("rel=\"{}\"", escape_attr(&self.rel))];

        if let Some(href) = &self.href {
            attrs.push(format!("href=\"{}\"", escape_attr(href)));
        }
        if let Some(t) = &self.r#type {
            attrs.push(format!("type=\"{}\"", escape_attr(t)));
        }
        if let Some(media) = &self.media {
            attrs.push(format!("media=\"{}\"", escape_attr(media)));
        }
        if let Some(sizes) = &self.sizes {
            attrs.push(format!("sizes=\"{}\"", escape_attr(sizes)));
        }
        if let Some(crossorigin) = &self.crossorigin {
            attrs.push(format!("crossorigin=\"{}\"", escape_attr(crossorigin)));
        }
        if let Some(integrity) = &self.integrity {
            attrs.push(format!("integrity=\"{}\"", escape_attr(integrity)));
        }

        format!("<link {} />", attrs.join(" "))
    }
}

/// A style tag.
#[derive(Clone, Debug)]
pub struct StyleTag {
    pub content: String,
    pub id: Option<String>,
    pub media: Option<String>,
    pub nonce: Option<String>,
}

impl StyleTag {
    pub fn to_html(&self) -> String {
        let mut attrs = Vec::new();

        if let Some(id) = &self.id {
            attrs.push(format!("id=\"{}\"", escape_attr(id)));
        }
        if let Some(media) = &self.media {
            attrs.push(format!("media=\"{}\"", escape_attr(media)));
        }
        if let Some(nonce) = &self.nonce {
            attrs.push(format!("nonce=\"{}\"", escape_attr(nonce)));
        }

        if attrs.is_empty() {
            format!("<style>{}</style>", self.content)
        } else {
            format!("<style {}>{}</style>", attrs.join(" "), self.content)
        }
    }
}

/// A script tag.
#[derive(Clone, Debug)]
pub struct ScriptTag {
    pub src: Option<String>,
    pub content: Option<String>,
    pub r#type: Option<String>,
    pub r#async: bool,
    pub defer: bool,
    pub module: bool,
    pub nonce: Option<String>,
    pub integrity: Option<String>,
    pub crossorigin: Option<String>,
}

impl ScriptTag {
    pub fn to_html(&self) -> String {
        let mut attrs = Vec::new();

        if let Some(src) = &self.src {
            attrs.push(format!("src=\"{}\"", escape_attr(src)));
        }
        if let Some(t) = &self.r#type {
            attrs.push(format!("type=\"{}\"", escape_attr(t)));
        } else if self.module {
            attrs.push("type=\"module\"".to_string());
        }
        if self.r#async {
            attrs.push("async".to_string());
        }
        if self.defer {
            attrs.push("defer".to_string());
        }
        if let Some(nonce) = &self.nonce {
            attrs.push(format!("nonce=\"{}\"", escape_attr(nonce)));
        }
        if let Some(integrity) = &self.integrity {
            attrs.push(format!("integrity=\"{}\"", escape_attr(integrity)));
        }
        if let Some(crossorigin) = &self.crossorigin {
            attrs.push(format!("crossorigin=\"{}\"", escape_attr(crossorigin)));
        }

        let attrs_str = if attrs.is_empty() {
            String::new()
        } else {
            format!(" {}", attrs.join(" "))
        };

        if let Some(content) = &self.content {
            format!("<script{}>{}</script>", attrs_str, content)
        } else {
            format!("<script{}></script>", attrs_str)
        }
    }
}

// =============================================================================
// Components
// =============================================================================

/// Set the document title.
///
/// # Example
/// ```rust
/// view! {
///     <Title text="Home | My App" />
/// }
/// ```
pub struct Title {
    text: String,
}

impl Title {
    pub fn new(text: impl Into<String>) -> Self {
        let text = text.into();
        META_CONTEXT.with(|ctx| ctx.borrow_mut().set_title(text.clone()));

        #[cfg(target_arch = "wasm32")]
        {
            if let Some(document) = web_sys::window().and_then(|w| w.document()) {
                document.set_title(&text);
            }
        }

        Self { text }
    }
}

impl IntoView for Title {
    fn into_view(self) -> View {
        View::Empty
    }
}

/// Set a title template that will wrap all Title components.
///
/// # Example
/// ```rust
/// view! {
///     <TitleTemplate template="%s | My App" />
///     // Then any <Title text="Home" /> becomes "Home | My App"
/// }
/// ```
pub struct TitleTemplate {
    template: String,
}

impl TitleTemplate {
    pub fn new(template: impl Into<String>) -> Self {
        let template = template.into();
        META_CONTEXT.with(|ctx| ctx.borrow_mut().title_template = Some(template.clone()));
        Self { template }
    }
}

impl IntoView for TitleTemplate {
    fn into_view(self) -> View {
        View::Empty
    }
}

/// Add a meta tag to the document head.
///
/// # Example
/// ```rust
/// view! {
///     <Meta name="description" content="My page description" />
///     <Meta property="og:title" content="My Title" />
///     <Meta charset="utf-8" />
/// }
/// ```
pub struct Meta {
    tag: MetaTag,
}

impl Meta {
    pub fn new() -> Self {
        Self {
            tag: MetaTag {
                name: None,
                property: None,
                content: String::new(),
                charset: None,
                http_equiv: None,
            },
        }
    }

    pub fn name(mut self, name: impl Into<String>) -> Self {
        self.tag.name = Some(name.into());
        self
    }

    pub fn property(mut self, property: impl Into<String>) -> Self {
        self.tag.property = Some(property.into());
        self
    }

    pub fn content(mut self, content: impl Into<String>) -> Self {
        self.tag.content = content.into();
        self
    }

    pub fn charset(mut self, charset: impl Into<String>) -> Self {
        self.tag.charset = Some(charset.into());
        self
    }

    pub fn http_equiv(mut self, http_equiv: impl Into<String>) -> Self {
        self.tag.http_equiv = Some(http_equiv.into());
        self
    }

    pub fn build(self) -> Self {
        META_CONTEXT.with(|ctx| ctx.borrow_mut().add_meta(self.tag.clone()));

        #[cfg(target_arch = "wasm32")]
        {
            // Update DOM
            if let Some(document) = web_sys::window().and_then(|w| w.document()) {
                let head = document.head().unwrap();
                // Remove existing and add new
                let meta = document.create_element("meta").unwrap();
                if let Some(name) = &self.tag.name {
                    meta.set_attribute("name", name).ok();
                }
                if let Some(property) = &self.tag.property {
                    meta.set_attribute("property", property).ok();
                }
                meta.set_attribute("content", &self.tag.content).ok();
                head.append_child(&meta).ok();
            }
        }

        self
    }
}

impl Default for Meta {
    fn default() -> Self {
        Self::new()
    }
}

impl IntoView for Meta {
    fn into_view(self) -> View {
        View::Empty
    }
}

/// Add a link tag to the document head.
///
/// # Example
/// ```rust
/// view! {
///     <Link rel="stylesheet" href="/styles.css" />
///     <Link rel="canonical" href="https://example.com/page" />
///     <Link rel="icon" href="/favicon.ico" />
/// }
/// ```
pub struct Link {
    tag: LinkTag,
}

impl Link {
    pub fn new(rel: impl Into<String>) -> Self {
        Self {
            tag: LinkTag {
                rel: rel.into(),
                href: None,
                r#type: None,
                media: None,
                sizes: None,
                crossorigin: None,
                integrity: None,
            },
        }
    }

    pub fn href(mut self, href: impl Into<String>) -> Self {
        self.tag.href = Some(href.into());
        self
    }

    pub fn r#type(mut self, t: impl Into<String>) -> Self {
        self.tag.r#type = Some(t.into());
        self
    }

    pub fn media(mut self, media: impl Into<String>) -> Self {
        self.tag.media = Some(media.into());
        self
    }

    pub fn sizes(mut self, sizes: impl Into<String>) -> Self {
        self.tag.sizes = Some(sizes.into());
        self
    }

    pub fn crossorigin(mut self, crossorigin: impl Into<String>) -> Self {
        self.tag.crossorigin = Some(crossorigin.into());
        self
    }

    pub fn integrity(mut self, integrity: impl Into<String>) -> Self {
        self.tag.integrity = Some(integrity.into());
        self
    }

    pub fn build(self) -> Self {
        META_CONTEXT.with(|ctx| ctx.borrow_mut().add_link(self.tag.clone()));
        self
    }
}

impl IntoView for Link {
    fn into_view(self) -> View {
        View::Empty
    }
}

/// Add inline styles to the document head.
///
/// # Example
/// ```rust
/// view! {
///     <Style>
///         ".my-class { color: red; }"
///     </Style>
/// }
/// ```
pub struct Style {
    tag: StyleTag,
}

impl Style {
    pub fn new(content: impl Into<String>) -> Self {
        let tag = StyleTag {
            content: content.into(),
            id: None,
            media: None,
            nonce: None,
        };
        META_CONTEXT.with(|ctx| ctx.borrow_mut().add_style(tag.clone()));
        Self { tag }
    }

    pub fn id(mut self, id: impl Into<String>) -> Self {
        self.tag.id = Some(id.into());
        self
    }

    pub fn media(mut self, media: impl Into<String>) -> Self {
        self.tag.media = Some(media.into());
        self
    }

    pub fn nonce(mut self, nonce: impl Into<String>) -> Self {
        self.tag.nonce = Some(nonce.into());
        self
    }
}

impl IntoView for Style {
    fn into_view(self) -> View {
        View::Empty
    }
}

/// Add a script to the document head.
///
/// # Example
/// ```rust
/// view! {
///     <Script src="/app.js" defer=true />
///     <Script>
///         "console.log('inline script');"
///     </Script>
/// }
/// ```
pub struct Script {
    tag: ScriptTag,
}

impl Script {
    pub fn new() -> Self {
        Self {
            tag: ScriptTag {
                src: None,
                content: None,
                r#type: None,
                r#async: false,
                defer: false,
                module: false,
                nonce: None,
                integrity: None,
                crossorigin: None,
            },
        }
    }

    pub fn src(mut self, src: impl Into<String>) -> Self {
        self.tag.src = Some(src.into());
        self
    }

    pub fn content(mut self, content: impl Into<String>) -> Self {
        self.tag.content = Some(content.into());
        self
    }

    pub fn r#type(mut self, t: impl Into<String>) -> Self {
        self.tag.r#type = Some(t.into());
        self
    }

    pub fn r#async(mut self, async_: bool) -> Self {
        self.tag.r#async = async_;
        self
    }

    pub fn defer(mut self, defer: bool) -> Self {
        self.tag.defer = defer;
        self
    }

    pub fn module(mut self, module: bool) -> Self {
        self.tag.module = module;
        self
    }

    pub fn nonce(mut self, nonce: impl Into<String>) -> Self {
        self.tag.nonce = Some(nonce.into());
        self
    }

    pub fn integrity(mut self, integrity: impl Into<String>) -> Self {
        self.tag.integrity = Some(integrity.into());
        self
    }

    pub fn crossorigin(mut self, crossorigin: impl Into<String>) -> Self {
        self.tag.crossorigin = Some(crossorigin.into());
        self
    }

    pub fn build(self) -> Self {
        META_CONTEXT.with(|ctx| ctx.borrow_mut().add_script(self.tag.clone()));
        self
    }
}

impl Default for Script {
    fn default() -> Self {
        Self::new()
    }
}

impl IntoView for Script {
    fn into_view(self) -> View {
        View::Empty
    }
}

/// Set attributes on the <html> element.
///
/// # Example
/// ```rust
/// view! {
///     <Html lang="en" class="dark" />
/// }
/// ```
pub struct Html {
    attrs: HashMap<String, String>,
}

impl Html {
    pub fn new() -> Self {
        Self { attrs: HashMap::new() }
    }

    pub fn lang(mut self, lang: impl Into<String>) -> Self {
        self.attrs.insert("lang".to_string(), lang.into());
        self
    }

    pub fn class(mut self, class: impl Into<String>) -> Self {
        self.attrs.insert("class".to_string(), class.into());
        self
    }

    pub fn dir(mut self, dir: impl Into<String>) -> Self {
        self.attrs.insert("dir".to_string(), dir.into());
        self
    }

    pub fn attr(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.attrs.insert(name.into(), value.into());
        self
    }

    pub fn build(self) -> Self {
        META_CONTEXT.with(|ctx| {
            ctx.borrow_mut().html_attrs.extend(self.attrs.clone());
        });
        self
    }
}

impl Default for Html {
    fn default() -> Self {
        Self::new()
    }
}

impl IntoView for Html {
    fn into_view(self) -> View {
        View::Empty
    }
}

/// Set attributes on the <body> element.
///
/// # Example
/// ```rust
/// view! {
///     <Body class="bg-white dark:bg-gray-900" />
/// }
/// ```
pub struct Body {
    attrs: HashMap<String, String>,
}

impl Body {
    pub fn new() -> Self {
        Self { attrs: HashMap::new() }
    }

    pub fn class(mut self, class: impl Into<String>) -> Self {
        self.attrs.insert("class".to_string(), class.into());
        self
    }

    pub fn id(mut self, id: impl Into<String>) -> Self {
        self.attrs.insert("id".to_string(), id.into());
        self
    }

    pub fn attr(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.attrs.insert(name.into(), value.into());
        self
    }

    pub fn build(self) -> Self {
        META_CONTEXT.with(|ctx| {
            ctx.borrow_mut().body_attrs.extend(self.attrs.clone());
        });
        self
    }
}

impl Default for Body {
    fn default() -> Self {
        Self::new()
    }
}

impl IntoView for Body {
    fn into_view(self) -> View {
        View::Empty
    }
}

// =============================================================================
// Helpers
// =============================================================================

fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

fn escape_attr(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('"', "&quot;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_meta_context() {
        META_CONTEXT.with(|ctx| ctx.borrow_mut().clear());

        Title::new("Test Page");
        Meta::new().name("description").content("Test description").build();

        let ctx = use_meta_context();
        assert_eq!(ctx.title, Some("Test Page".to_string()));
        assert_eq!(ctx.meta_tags.len(), 1);
    }

    #[test]
    fn test_meta_tag_html() {
        let tag = MetaTag {
            name: Some("description".to_string()),
            property: None,
            content: "Test content".to_string(),
            charset: None,
            http_equiv: None,
        };

        let html = tag.to_html();
        assert!(html.contains("name=\"description\""));
        assert!(html.contains("content=\"Test content\""));
    }

    #[test]
    fn test_link_tag_html() {
        let tag = LinkTag {
            rel: "stylesheet".to_string(),
            href: Some("/styles.css".to_string()),
            r#type: None,
            media: None,
            sizes: None,
            crossorigin: None,
            integrity: None,
        };

        let html = tag.to_html();
        assert!(html.contains("rel=\"stylesheet\""));
        assert!(html.contains("href=\"/styles.css\""));
    }
}
