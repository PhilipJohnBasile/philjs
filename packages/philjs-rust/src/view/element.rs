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

    /// Create a namespaced element (e.g., SVG).
    pub fn new_ns(_namespace: &str, tag: impl Into<String>) -> Self {
        // For now, ignore namespace in SSR output
        // Full implementation would track namespace for correct rendering
        Self::new(tag)
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

    /// Add a dynamic class based on a signal.
    pub fn class_signal(mut self, class_name: impl Into<String>, condition: impl Fn() -> bool + 'static) -> Self {
        let class_name = class_name.into();
        let existing_class = self.class.take();
        self.class = Some(Rc::new(move || {
            let base = existing_class.as_ref().map(|f| f()).unwrap_or_default();
            if condition() {
                if base.is_empty() {
                    class_name.clone()
                } else {
                    format!("{} {}", base, class_name)
                }
            } else {
                base
            }
        }));
        self
    }

    /// Add a dynamic style property.
    pub fn style_signal(mut self, property: impl Into<String>, value: impl Fn() -> String + 'static) -> Self {
        let property = property.into();
        let existing_style = self.style.take();
        self.style = Some(Rc::new(move || {
            let base = existing_style.as_ref().map(|f| f()).unwrap_or_default();
            let prop_style = format!("{}: {}", property, value());
            if base.is_empty() {
                prop_style
            } else {
                format!("{}; {}", base, prop_style)
            }
        }));
        self
    }

    /// Two-way binding (simplified - actual impl would need signal integration).
    pub fn bind(self, _property: impl Into<String>, _signal: impl std::any::Any) -> Self {
        // Two-way binding is primarily a client-side feature
        // For SSR, we just return self unchanged
        self
    }

    /// Set a DOM property (not attribute).
    pub fn prop(self, _name: impl Into<String>, _value: impl std::any::Any) -> Self {
        // Properties are client-side only
        self
    }

    /// Spread attributes from a props object.
    pub fn spread(self, _props: impl std::any::Any) -> Self {
        // Would need runtime reflection
        self
    }

    /// Use a directive.
    pub fn use_directive<P>(self, _directive: impl Fn(), _param: P) -> Self {
        // Directives are client-side
        self
    }

    /// Add a transition.
    pub fn transition(self, _name: impl Into<String>, _params: impl std::any::Any) -> Self {
        // Transitions are client-side
        self
    }

    /// Add an animation.
    pub fn animate(self, _name: impl Into<String>, _params: impl std::any::Any) -> Self {
        // Animations are client-side
        self
    }

    /// Add event modifier: prevent default.
    pub fn prevent_default(self) -> Self {
        // Client-side only
        self
    }

    /// Add event modifier: stop propagation.
    pub fn stop_propagation(self) -> Self {
        // Client-side only
        self
    }

    /// Add event modifier: capture phase.
    pub fn capture(self) -> Self {
        // Client-side only
        self
    }

    /// Add event modifier: passive listener.
    pub fn passive(self) -> Self {
        // Client-side only
        self
    }

    /// Add event modifier: once only.
    pub fn once(self) -> Self {
        // Client-side only
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
