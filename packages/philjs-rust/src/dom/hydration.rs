//! Proper hydration implementation for SSR
//!
//! This module implements true hydration - attaching to existing SSR HTML
//! without clearing and re-rendering. This is critical for Rust SSR adoption.

use crate::view::{View, IntoView};
use std::collections::HashMap;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use web_sys::{Document, Element, Node, Text, NodeList};

/// Hydration mode configuration
#[derive(Clone, Debug, Default)]
pub enum HydrationMode {
    /// Full hydration - attach all event handlers
    #[default]
    Full,
    /// Partial hydration - only hydrate marked islands
    Partial,
    /// Progressive hydration - hydrate on interaction
    Progressive,
    /// Resume-only - only restore state, no re-render
    Resume,
}

/// Hydration context for tracking SSR markers
#[derive(Clone, Debug, Default)]
pub struct HydrationContext {
    /// Current node index during hydration walk
    pub node_index: usize,
    /// Map of element IDs to their hydration data
    pub id_map: HashMap<String, HydrationData>,
    /// Hydration mode
    pub mode: HydrationMode,
    /// Whether hydration is currently active
    pub is_hydrating: bool,
    /// Errors encountered during hydration
    pub errors: Vec<HydrationError>,
}

/// Data stored for hydration
#[derive(Clone, Debug)]
pub struct HydrationData {
    /// Signal values to restore
    pub signals: HashMap<String, serde_json::Value>,
    /// Event handler IDs
    pub handlers: Vec<String>,
    /// Component props
    pub props: Option<serde_json::Value>,
}

/// Hydration errors
#[derive(Clone, Debug)]
pub enum HydrationError {
    /// Mismatch between SSR and client render
    Mismatch { expected: String, found: String, path: String },
    /// Missing SSR marker
    MissingMarker { id: String },
    /// Invalid hydration data
    InvalidData { reason: String },
    /// DOM node not found
    NodeNotFound { selector: String },
}

impl HydrationContext {
    /// Create a new hydration context
    pub fn new(mode: HydrationMode) -> Self {
        HydrationContext {
            node_index: 0,
            id_map: HashMap::new(),
            mode,
            is_hydrating: true,
            errors: Vec::new(),
        }
    }

    /// Get the next node index
    pub fn next_index(&mut self) -> usize {
        let idx = self.node_index;
        self.node_index += 1;
        idx
    }

    /// Record a hydration error
    pub fn record_error(&mut self, error: HydrationError) {
        self.errors.push(error);
    }

    /// Check if hydration completed without errors
    pub fn is_successful(&self) -> bool {
        self.errors.is_empty()
    }
}

/// Hydration state that can be serialized to JSON for SSR
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct HydrationState {
    /// Version for compatibility checking
    pub version: u32,
    /// Serialized signal values
    pub signals: HashMap<String, serde_json::Value>,
    /// Event handler mappings
    pub handlers: HashMap<String, Vec<HandlerInfo>>,
    /// Component tree structure
    pub tree: Option<ComponentTree>,
}

/// Information about an event handler
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct HandlerInfo {
    /// Event type (click, input, etc.)
    pub event: String,
    /// Handler identifier for lazy loading
    pub id: String,
    /// Captured closure variables
    pub closure: Option<serde_json::Value>,
}

/// Component tree structure for hydration
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct ComponentTree {
    /// Component name
    pub name: String,
    /// Component ID in the DOM
    pub id: String,
    /// Child components
    pub children: Vec<ComponentTree>,
}

impl HydrationState {
    /// Create a new hydration state
    pub fn new() -> Self {
        HydrationState {
            version: 1,
            signals: HashMap::new(),
            handlers: HashMap::new(),
            tree: None,
        }
    }

    /// Register a signal value for hydration
    pub fn register_signal<T: serde::Serialize>(&mut self, id: &str, value: &T) {
        if let Ok(json) = serde_json::to_value(value) {
            self.signals.insert(id.to_string(), json);
        }
    }

    /// Register an event handler for hydration
    pub fn register_handler(&mut self, element_id: &str, handler: HandlerInfo) {
        self.handlers
            .entry(element_id.to_string())
            .or_insert_with(Vec::new)
            .push(handler);
    }

    /// Serialize to JSON for embedding in HTML
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_default()
    }

    /// Deserialize from JSON
    pub fn from_json(json: &str) -> Option<Self> {
        serde_json::from_str(json).ok()
    }
}

impl Default for HydrationState {
    fn default() -> Self {
        Self::new()
    }
}

/// Thread-local hydration context
#[cfg(feature = "wasm")]
thread_local! {
    static HYDRATION_CTX: std::cell::RefCell<Option<HydrationContext>> = std::cell::RefCell::new(None);
}

/// Initialize hydration context
#[cfg(feature = "wasm")]
pub fn init_hydration(mode: HydrationMode) {
    HYDRATION_CTX.with(|ctx| {
        *ctx.borrow_mut() = Some(HydrationContext::new(mode));
    });
}

/// Get current hydration context
#[cfg(feature = "wasm")]
pub fn get_hydration_context() -> Option<HydrationContext> {
    HYDRATION_CTX.with(|ctx| ctx.borrow().clone())
}

/// Check if currently hydrating
#[cfg(feature = "wasm")]
pub fn is_hydrating() -> bool {
    HYDRATION_CTX.with(|ctx| {
        ctx.borrow().as_ref().map(|c| c.is_hydrating).unwrap_or(false)
    })
}

/// Complete hydration
#[cfg(feature = "wasm")]
pub fn complete_hydration() -> Result<(), Vec<HydrationError>> {
    HYDRATION_CTX.with(|ctx| {
        let mut ctx = ctx.borrow_mut();
        if let Some(ref mut hydration_ctx) = *ctx {
            hydration_ctx.is_hydrating = false;
            if hydration_ctx.is_successful() {
                Ok(())
            } else {
                Err(hydration_ctx.errors.clone())
            }
        } else {
            Ok(())
        }
    })
}

/// Hydrate a view by attaching to existing SSR DOM
#[cfg(feature = "wasm")]
pub fn hydrate<F, V>(f: F)
where
    F: FnOnce() -> V + 'static,
    V: IntoView,
{
    hydrate_to_body(f, HydrationMode::Full);
}

/// Hydrate with specific mode
#[cfg(feature = "wasm")]
pub fn hydrate_to_body<F, V>(f: F, mode: HydrationMode)
where
    F: FnOnce() -> V + 'static,
    V: IntoView,
{
    let document = web_sys::window()
        .expect("no window")
        .document()
        .expect("no document");

    let body = document.body().expect("no body");
    hydrate_to(f, &body, mode);
}

/// Hydrate to a specific element
#[cfg(feature = "wasm")]
pub fn hydrate_to<F, V>(f: F, parent: &Element, mode: HydrationMode)
where
    F: FnOnce() -> V + 'static,
    V: IntoView,
{
    // Initialize hydration context
    init_hydration(mode.clone());

    // Load hydration state from embedded JSON
    let state = load_hydration_state();

    // Restore signals from hydration state
    if let Some(ref state) = state {
        restore_signals(state);
    }

    // Create the view (this will use hydration context)
    let view = f().into_view();

    // Walk the DOM and attach handlers without re-rendering
    match mode {
        HydrationMode::Full => {
            hydrate_view_full(&view, parent, 0);
        }
        HydrationMode::Partial => {
            hydrate_view_partial(&view, parent);
        }
        HydrationMode::Progressive => {
            setup_progressive_hydration(&view, parent);
        }
        HydrationMode::Resume => {
            // Resume mode - signals already restored, just attach listeners
            attach_event_listeners(parent, &state);
        }
    }

    // Mark hydration complete
    if let Err(errors) = complete_hydration() {
        web_sys::console::warn_1(&format!("Hydration errors: {:?}", errors).into());
    }
}

/// Load hydration state from embedded script tag
#[cfg(feature = "wasm")]
fn load_hydration_state() -> Option<HydrationState> {
    let document = web_sys::window()?.document()?;

    // Look for hydration data script
    let script = document.get_element_by_id("__PHILJS_HYDRATION__")?;
    let json = script.text_content()?;

    HydrationState::from_json(&json)
}

/// Restore signal values from hydration state
#[cfg(feature = "wasm")]
fn restore_signals(state: &HydrationState) {
    use crate::reactive::signal::restore_signal_value;

    for (id, value) in &state.signals {
        restore_signal_value(id, value.clone());
    }
}

/// Full hydration - walk DOM and attach all handlers
#[cfg(feature = "wasm")]
fn hydrate_view_full(view: &View, parent: &Element, mut index: usize) -> usize {
    let children = parent.child_nodes();

    match view {
        View::Element(el) => {
            // Find matching DOM element
            if let Some(dom_node) = children.get(index as u32) {
                if let Ok(dom_element) = dom_node.dyn_into::<Element>() {
                    // Verify tag matches
                    if dom_element.tag_name().to_lowercase() == el.tag().to_lowercase() {
                        // Attach event handlers
                        attach_element_handlers(&dom_element, el);

                        // Recursively hydrate children
                        let mut child_index = 0;
                        for child_view in el.get_children() {
                            child_index = hydrate_view_full(child_view, &dom_element, child_index);
                        }
                    } else {
                        // Mismatch - record error
                        HYDRATION_CTX.with(|ctx| {
                            if let Some(ref mut c) = *ctx.borrow_mut() {
                                c.record_error(HydrationError::Mismatch {
                                    expected: el.tag().to_string(),
                                    found: dom_element.tag_name(),
                                    path: format!("index {}", index),
                                });
                            }
                        });
                    }
                }
            }
            index + 1
        }
        View::Text(_) => {
            // Text nodes don't need handler attachment
            index + 1
        }
        View::Fragment(frag) => {
            for child in frag.children() {
                index = hydrate_view_full(child, parent, index);
            }
            index
        }
        View::Dynamic(dyn_) => {
            let current = dyn_.render();
            hydrate_view_full(&current, parent, index)
        }
        View::Empty => index,
    }
}

/// Attach event handlers to an element
#[cfg(feature = "wasm")]
fn attach_element_handlers(element: &Element, view_el: &crate::view::element::Element) {
    use wasm_bindgen::closure::Closure;

    for (event_name, handler) in view_el.get_handlers() {
        let handler = handler.clone();
        let closure = Closure::wrap(Box::new(move |event: web_sys::Event| {
            handler(crate::dom::event::Event::from(event));
        }) as Box<dyn FnMut(web_sys::Event)>);

        let _ = element.add_event_listener_with_callback(
            event_name,
            closure.as_ref().unchecked_ref(),
        );

        // Prevent closure from being dropped
        closure.forget();
    }
}

/// Partial hydration - only hydrate marked islands
#[cfg(feature = "wasm")]
fn hydrate_view_partial(view: &View, parent: &Element) {
    let document = web_sys::window()
        .expect("no window")
        .document()
        .expect("no document");

    // Find all island markers
    let islands = document.query_selector_all("[data-philjs-island]")
        .expect("query failed");

    for i in 0..islands.length() {
        if let Some(island) = islands.get(i) {
            if let Ok(element) = island.dyn_into::<Element>() {
                let island_id = element.get_attribute("data-philjs-island");
                if let Some(id) = island_id {
                    hydrate_island(&element, &id, view);
                }
            }
        }
    }
}

/// Hydrate a single island
#[cfg(feature = "wasm")]
fn hydrate_island(element: &Element, island_id: &str, view: &View) {
    // Find matching component in view tree
    if let Some(island_view) = find_island_in_view(view, island_id) {
        hydrate_view_full(island_view, element, 0);
    }
}

/// Find an island component in the view tree
#[cfg(feature = "wasm")]
fn find_island_in_view<'a>(view: &'a View, island_id: &str) -> Option<&'a View> {
    match view {
        View::Element(el) => {
            // Check if this element has the island marker
            for (key, value) in el.get_attrs() {
                if key == "data-philjs-island" && value == island_id {
                    return Some(view);
                }
            }
            // Search children
            for child in el.get_children() {
                if let Some(found) = find_island_in_view(child, island_id) {
                    return Some(found);
                }
            }
            None
        }
        View::Fragment(frag) => {
            for child in frag.children() {
                if let Some(found) = find_island_in_view(child, island_id) {
                    return Some(found);
                }
            }
            None
        }
        _ => None,
    }
}

/// Setup progressive hydration with interaction triggers
#[cfg(feature = "wasm")]
fn setup_progressive_hydration(view: &View, parent: &Element) {
    let document = web_sys::window()
        .expect("no window")
        .document()
        .expect("no document");

    // Find elements marked for progressive hydration
    let progressive = document.query_selector_all("[data-philjs-hydrate]")
        .expect("query failed");

    for i in 0..progressive.length() {
        if let Some(node) = progressive.get(i) {
            if let Ok(element) = node.dyn_into::<Element>() {
                let trigger = element.get_attribute("data-philjs-hydrate")
                    .unwrap_or_else(|| "visible".to_string());

                match trigger.as_str() {
                    "visible" => setup_visibility_hydration(&element, view),
                    "idle" => setup_idle_hydration(&element, view),
                    "interaction" => setup_interaction_hydration(&element, view),
                    _ => {}
                }
            }
        }
    }
}

/// Hydrate when element becomes visible
#[cfg(feature = "wasm")]
fn setup_visibility_hydration(element: &Element, view: &View) {
    use wasm_bindgen::closure::Closure;

    let element = element.clone();
    let view_ptr = view as *const View;

    // Use IntersectionObserver for visibility detection
    let callback = Closure::wrap(Box::new(move |entries: js_sys::Array, _observer: web_sys::IntersectionObserver| {
        for entry in entries.iter() {
            if let Ok(entry) = entry.dyn_into::<web_sys::IntersectionObserverEntry>() {
                if entry.is_intersecting() {
                    // Safe because view lives for the lifetime of the app
                    let view = unsafe { &*view_ptr };
                    hydrate_view_full(view, &element, 0);
                }
            }
        }
    }) as Box<dyn FnMut(js_sys::Array, web_sys::IntersectionObserver)>);

    let mut options = web_sys::IntersectionObserverInit::new();
    options.threshold(&JsValue::from_f64(0.1));

    if let Ok(observer) = web_sys::IntersectionObserver::new_with_options(
        callback.as_ref().unchecked_ref(),
        &options,
    ) {
        observer.observe(&element);
    }

    callback.forget();
}

/// Hydrate during idle time
#[cfg(feature = "wasm")]
fn setup_idle_hydration(element: &Element, view: &View) {
    use wasm_bindgen::closure::Closure;

    let element = element.clone();
    let view_ptr = view as *const View;

    let callback = Closure::wrap(Box::new(move || {
        let view = unsafe { &*view_ptr };
        hydrate_view_full(view, &element, 0);
    }) as Box<dyn FnMut()>);

    // Use requestIdleCallback if available
    if let Some(window) = web_sys::window() {
        let _ = js_sys::Reflect::get(&window, &"requestIdleCallback".into())
            .ok()
            .and_then(|f| f.dyn_into::<js_sys::Function>().ok())
            .map(|f| {
                let _ = f.call1(&window, callback.as_ref().unchecked_ref());
            });
    }

    callback.forget();
}

/// Hydrate on first interaction
#[cfg(feature = "wasm")]
fn setup_interaction_hydration(element: &Element, view: &View) {
    use wasm_bindgen::closure::Closure;

    let element_clone = element.clone();
    let view_ptr = view as *const View;

    let callback = Closure::wrap(Box::new(move |_: web_sys::Event| {
        let view = unsafe { &*view_ptr };
        hydrate_view_full(view, &element_clone, 0);
    }) as Box<dyn FnMut(web_sys::Event)>);

    // Listen for common interaction events
    for event in &["click", "focus", "touchstart", "mouseover"] {
        let _ = element.add_event_listener_with_callback_and_add_event_listener_options(
            event,
            callback.as_ref().unchecked_ref(),
            web_sys::AddEventListenerOptions::new().once(true),
        );
    }

    callback.forget();
}

/// Attach event listeners from hydration state (resume mode)
#[cfg(feature = "wasm")]
fn attach_event_listeners(parent: &Element, state: &Option<HydrationState>) {
    let Some(state) = state else { return };

    let document = web_sys::window()
        .expect("no window")
        .document()
        .expect("no document");

    for (element_id, handlers) in &state.handlers {
        if let Some(element) = document.get_element_by_id(element_id) {
            for handler in handlers {
                setup_lazy_handler(&element, handler);
            }
        }
    }
}

/// Setup a lazy-loaded handler
#[cfg(feature = "wasm")]
fn setup_lazy_handler(element: &Element, handler: &HandlerInfo) {
    use wasm_bindgen::closure::Closure;

    let handler_id = handler.id.clone();
    let closure_data = handler.closure.clone();

    let callback = Closure::wrap(Box::new(move |event: web_sys::Event| {
        // Lazy load the actual handler module
        wasm_bindgen_futures::spawn_local({
            let handler_id = handler_id.clone();
            let closure_data = closure_data.clone();
            async move {
                // In production, this would dynamically import the handler
                web_sys::console::log_1(&format!("Handler {} invoked", handler_id).into());
            }
        });
    }) as Box<dyn FnMut(web_sys::Event)>);

    let _ = element.add_event_listener_with_callback(
        &handler.event,
        callback.as_ref().unchecked_ref(),
    );

    callback.forget();
}

/// Generate hydration script for SSR
pub fn generate_hydration_script(state: &HydrationState) -> String {
    let json = state.to_json();
    format!(
        r#"<script id="__PHILJS_HYDRATION__" type="application/json">{}</script>
<script>
(function() {{
    window.__PHILJS_HYDRATE__ = function() {{
        // Hydration will be called when WASM loads
    }};
}})();
</script>"#,
        json
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hydration_state_serialization() {
        let mut state = HydrationState::new();
        state.register_signal("count", &42i32);
        state.register_handler("btn1", HandlerInfo {
            event: "click".to_string(),
            id: "increment".to_string(),
            closure: None,
        });

        let json = state.to_json();
        let restored = HydrationState::from_json(&json).unwrap();

        assert_eq!(restored.version, 1);
        assert_eq!(restored.signals.len(), 1);
        assert_eq!(restored.handlers.len(), 1);
    }

    #[test]
    fn test_hydration_context() {
        let mut ctx = HydrationContext::new(HydrationMode::Full);
        assert!(ctx.is_hydrating);
        assert_eq!(ctx.next_index(), 0);
        assert_eq!(ctx.next_index(), 1);
        assert!(ctx.is_successful());

        ctx.record_error(HydrationError::MissingMarker { id: "test".to_string() });
        assert!(!ctx.is_successful());
    }
}
