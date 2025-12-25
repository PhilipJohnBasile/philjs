//! HTML Element representation

use std::collections::HashMap;
use std::rc::Rc;

use super::View;
use crate::dom::NodeRef;

type EventHandler = Box<dyn Fn(crate::dom::Event)>;
type DynamicAttr = (&'static str, Box<dyn Fn() -> String>);

/// An HTML element node.
#[derive(Clone)]
pub struct Element {
    tag: String,
    attrs: HashMap<String, String>,
    dynamic_attrs: Vec<Rc<DynamicAttr>>,
    events: Vec<(String, Rc<EventHandler>)>,
    children: Vec<View>,
    class: Option<Rc<dyn Fn() -> String>>,
    style: Option<Rc<dyn Fn() -> String>>,
    node_ref: Option<NodeRef>,
}

impl Element {
    /// Create a new element with the given tag name.
    pub fn new(tag: impl Into<String>) -> Self {
        Element {
            tag: tag.into(),
            attrs: HashMap::new(),
            dynamic_attrs: Vec::new(),
            events: Vec::new(),
            children: Vec::new(),
            class: None,
            style: None,
            node_ref: None,
        }
    }

    /// Get the tag name.
    pub fn tag(&self) -> &str {
        &self.tag
    }

    /// Add static attributes.
    pub fn attrs(mut self, attrs: &[(&str, &str)]) -> Self {
        for (key, value) in attrs {
            self.attrs.insert(key.to_string(), value.to_string());
        }
        self
    }

    /// Add a single static attribute.
    pub fn attr(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.attrs.insert(key.into(), value.into());
        self
    }

    /// Add dynamic attributes.
    pub fn dynamic_attrs(mut self, attrs: Vec<(&'static str, Box<dyn Fn() -> String>)>) -> Self {
        for (key, value) in attrs {
            self.dynamic_attrs.push(Rc::new((key, value)));
        }
        self
    }

    /// Add event handlers.
    pub fn events(mut self, events: Vec<(&str, Box<dyn Fn(crate::dom::Event)>)>) -> Self {
        for (name, handler) in events {
            self.events.push((name.to_string(), Rc::new(handler)));
        }
        self
    }

    /// Add an event handler.
    pub fn on(mut self, event: impl Into<String>, handler: impl Fn(crate::dom::Event) + 'static) -> Self {
        self.events.push((event.into(), Rc::new(Box::new(handler))));
        self
    }

    /// Set the class attribute (reactive).
    pub fn class(mut self, class: impl Fn() -> String + 'static) -> Self {
        self.class = Some(Rc::new(class));
        self
    }

    /// Set the style attribute (reactive).
    pub fn style(mut self, style: impl Fn() -> String + 'static) -> Self {
        self.style = Some(Rc::new(style));
        self
    }

    /// Set a node ref.
    pub fn node_ref(mut self, node_ref: NodeRef) -> Self {
        self.node_ref = Some(node_ref);
        self
    }

    /// Add children.
    pub fn children(mut self, children: Vec<View>) -> Self {
        self.children = children;
        self
    }

    /// Add a single child.
    pub fn child(mut self, child: impl Into<View>) -> Self {
        self.children.push(child.into());
        self
    }

    /// Get all attributes (for SSR).
    pub fn get_attrs(&self) -> &HashMap<String, String> {
        &self.attrs
    }

    /// Get children.
    pub fn get_children(&self) -> &[View] {
        &self.children
    }

    /// Render to HTML string.
    pub fn to_html(&self) -> String {
        let mut html = format!("<{}", self.tag);

        // Static attributes
        for (key, value) in &self.attrs {
            html.push_str(&format!(" {}=\"{}\"", key, escape_html(value)));
        }

        // Dynamic attributes
        for attr in &self.dynamic_attrs {
            let (key, value_fn) = attr.as_ref();
            html.push_str(&format!(" {}=\"{}\"", key, escape_html(&value_fn())));
        }

        // Class
        if let Some(class_fn) = &self.class {
            html.push_str(&format!(" class=\"{}\"", escape_html(&class_fn())));
        }

        // Style
        if let Some(style_fn) = &self.style {
            html.push_str(&format!(" style=\"{}\"", escape_html(&style_fn())));
        }

        // Self-closing tags
        if is_void_element(&self.tag) {
            html.push_str(" />");
            return html;
        }

        html.push('>');

        // Children
        for child in &self.children {
            html.push_str(&child.to_html());
        }

        html.push_str(&format!("</{}>", self.tag));
        html
    }
}

/// Check if a tag is a void element (self-closing).
fn is_void_element(tag: &str) -> bool {
    matches!(
        tag.to_lowercase().as_str(),
        "area" | "base" | "br" | "col" | "embed" | "hr" | "img" | "input"
        | "link" | "meta" | "param" | "source" | "track" | "wbr"
    )
}

/// Escape HTML special characters.
fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

impl From<Element> for View {
    fn from(el: Element) -> Self {
        View::Element(el)
    }
}
