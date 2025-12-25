//! Node references for direct DOM access

use std::cell::RefCell;
use std::rc::Rc;

#[cfg(feature = "wasm")]
use web_sys::Element;

/// A reference to a DOM node.
#[derive(Clone, Default)]
pub struct NodeRef {
    #[cfg(feature = "wasm")]
    inner: Rc<RefCell<Option<Element>>>,
    #[cfg(not(feature = "wasm"))]
    inner: Rc<RefCell<Option<()>>>,
}

impl NodeRef {
    /// Create a new node ref.
    pub fn new() -> Self {
        NodeRef {
            inner: Rc::new(RefCell::new(None)),
        }
    }

    /// Check if the ref has been set.
    pub fn is_set(&self) -> bool {
        self.inner.borrow().is_some()
    }

    #[cfg(feature = "wasm")]
    /// Get the DOM element.
    pub fn get(&self) -> Option<Element> {
        self.inner.borrow().clone()
    }

    #[cfg(feature = "wasm")]
    /// Set the DOM element.
    pub fn set(&self, element: Element) {
        *self.inner.borrow_mut() = Some(element);
    }

    #[cfg(feature = "wasm")]
    /// Get the element and call a function on it.
    pub fn with<R>(&self, f: impl FnOnce(&Element) -> R) -> Option<R> {
        self.inner.borrow().as_ref().map(f)
    }

    /// Clear the ref.
    pub fn clear(&self) {
        *self.inner.borrow_mut() = None;
    }
}

/// Create a new node ref.
pub fn create_node_ref() -> NodeRef {
    NodeRef::new()
}
