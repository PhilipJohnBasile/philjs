//! Event handling

use std::rc::Rc;

/// A DOM event wrapper.
#[derive(Clone)]
pub struct Event {
    #[cfg(feature = "wasm")]
    inner: web_sys::Event,
    #[cfg(not(feature = "wasm"))]
    _marker: std::marker::PhantomData<()>,
}

impl Event {
    #[cfg(feature = "wasm")]
    /// Create from a web_sys Event.
    pub fn from_web_sys(event: web_sys::Event) -> Self {
        Event { inner: event }
    }

    #[cfg(feature = "wasm")]
    /// Get the underlying web_sys Event.
    pub fn inner(&self) -> &web_sys::Event {
        &self.inner
    }

    #[cfg(feature = "wasm")]
    /// Prevent default behavior.
    pub fn prevent_default(&self) {
        self.inner.prevent_default();
    }

    #[cfg(feature = "wasm")]
    /// Stop propagation.
    pub fn stop_propagation(&self) {
        self.inner.stop_propagation();
    }

    #[cfg(feature = "wasm")]
    /// Stop immediate propagation.
    pub fn stop_immediate_propagation(&self) {
        self.inner.stop_immediate_propagation();
    }

    #[cfg(feature = "wasm")]
    /// Get the target element.
    pub fn target(&self) -> Option<web_sys::EventTarget> {
        self.inner.target()
    }

    #[cfg(feature = "wasm")]
    /// Get the current target element.
    pub fn current_target(&self) -> Option<web_sys::EventTarget> {
        self.inner.current_target()
    }

    // Non-WASM stubs
    #[cfg(not(feature = "wasm"))]
    pub fn prevent_default(&self) {}

    #[cfg(not(feature = "wasm"))]
    pub fn stop_propagation(&self) {}

    #[cfg(not(feature = "wasm"))]
    pub fn stop_immediate_propagation(&self) {}
}

/// Mouse event wrapper.
#[derive(Clone)]
pub struct MouseEvent {
    #[cfg(feature = "wasm")]
    inner: web_sys::MouseEvent,
    #[cfg(not(feature = "wasm"))]
    _marker: std::marker::PhantomData<()>,
}

#[cfg(feature = "wasm")]
impl MouseEvent {
    pub fn from_web_sys(event: web_sys::MouseEvent) -> Self {
        MouseEvent { inner: event }
    }

    pub fn client_x(&self) -> i32 {
        self.inner.client_x()
    }

    pub fn client_y(&self) -> i32 {
        self.inner.client_y()
    }

    pub fn page_x(&self) -> i32 {
        self.inner.page_x()
    }

    pub fn page_y(&self) -> i32 {
        self.inner.page_y()
    }

    pub fn button(&self) -> i16 {
        self.inner.button()
    }

    pub fn alt_key(&self) -> bool {
        self.inner.alt_key()
    }

    pub fn ctrl_key(&self) -> bool {
        self.inner.ctrl_key()
    }

    pub fn shift_key(&self) -> bool {
        self.inner.shift_key()
    }

    pub fn meta_key(&self) -> bool {
        self.inner.meta_key()
    }
}

/// Keyboard event wrapper.
#[derive(Clone)]
pub struct KeyboardEvent {
    #[cfg(feature = "wasm")]
    inner: web_sys::KeyboardEvent,
    #[cfg(not(feature = "wasm"))]
    _marker: std::marker::PhantomData<()>,
}

#[cfg(feature = "wasm")]
impl KeyboardEvent {
    pub fn from_web_sys(event: web_sys::KeyboardEvent) -> Self {
        KeyboardEvent { inner: event }
    }

    pub fn key(&self) -> String {
        self.inner.key()
    }

    pub fn code(&self) -> String {
        self.inner.code()
    }

    pub fn alt_key(&self) -> bool {
        self.inner.alt_key()
    }

    pub fn ctrl_key(&self) -> bool {
        self.inner.ctrl_key()
    }

    pub fn shift_key(&self) -> bool {
        self.inner.shift_key()
    }

    pub fn meta_key(&self) -> bool {
        self.inner.meta_key()
    }

    pub fn repeat(&self) -> bool {
        self.inner.repeat()
    }
}

#[cfg(feature = "wasm")]
impl From<web_sys::Event> for Event {
    fn from(event: web_sys::Event) -> Self {
        Event::from_web_sys(event)
    }
}

/// Input event wrapper.
#[derive(Clone)]
pub struct InputEvent {
    #[cfg(feature = "wasm")]
    inner: web_sys::InputEvent,
    #[cfg(not(feature = "wasm"))]
    _marker: std::marker::PhantomData<()>,
}

#[cfg(feature = "wasm")]
impl InputEvent {
    pub fn from_web_sys(event: web_sys::InputEvent) -> Self {
        InputEvent { inner: event }
    }

    pub fn data(&self) -> Option<String> {
        self.inner.data()
    }

    pub fn input_type(&self) -> String {
        self.inner.input_type()
    }
}
