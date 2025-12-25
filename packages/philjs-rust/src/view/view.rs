//! Core View type

use std::rc::Rc;

use super::{Element, Text, Fragment, Dynamic, Children};

/// The core view type that represents any renderable content.
#[derive(Clone)]
pub enum View {
    /// An HTML element
    Element(Element),
    /// A text node
    Text(Text),
    /// A fragment (multiple nodes)
    Fragment(Fragment),
    /// A dynamic/reactive node
    Dynamic(Rc<Dynamic>),
    /// Empty/null node
    Empty,
}

impl View {
    /// Create an empty view.
    pub fn empty() -> Self {
        View::Empty
    }

    /// Check if this view is empty.
    pub fn is_empty(&self) -> bool {
        matches!(self, View::Empty)
    }

    /// Render to HTML string (for SSR).
    pub fn to_html(&self) -> String {
        match self {
            View::Element(el) => el.to_html(),
            View::Text(text) => text.to_html(),
            View::Fragment(frag) => frag.to_html(),
            View::Dynamic(dyn_) => dyn_.to_html(),
            View::Empty => String::new(),
        }
    }
}

impl Default for View {
    fn default() -> Self {
        View::Empty
    }
}

impl std::fmt::Debug for View {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            View::Element(el) => write!(f, "Element({:?})", el.tag()),
            View::Text(t) => write!(f, "Text({:?})", t.content()),
            View::Fragment(frag) => write!(f, "Fragment({} children)", frag.children().len()),
            View::Dynamic(_) => write!(f, "Dynamic"),
            View::Empty => write!(f, "Empty"),
        }
    }
}
