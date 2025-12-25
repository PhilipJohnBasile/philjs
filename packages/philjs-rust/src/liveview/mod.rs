//! PhilJS Rust LiveView
//!
//! Server-driven UI for Rust - Phoenix LiveView-style rendering.
//! Similar to Dioxus LiveView pattern.
//!
//! # Example
//! ```rust
//! use philjs_rust::liveview::*;
//!
//! #[live_view]
//! fn Counter() -> impl LiveView {
//!     let count = signal!(0);
//!
//!     live! {
//!         <div>
//!             <h1>"Count: " {count}</h1>
//!             <button live:click="increment">"+"</button>
//!             <button live:click="decrement">"-"</button>
//!         </div>
//!     }
//! }
//!
//! // Handle events
//! impl Counter {
//!     fn handle_event(&mut self, event: &str, _payload: Value) {
//!         match event {
//!             "increment" => self.count.update(|c| *c += 1),
//!             "decrement" => self.count.update(|c| *c -= 1),
//!             _ => {}
//!         }
//!     }
//! }
//! ```

use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::{Arc, RwLock};

use serde::{Deserialize, Serialize};

use crate::reactive::Signal;

// ============================================================================
// Types
// ============================================================================

/// LiveView state
pub type LiveState = HashMap<String, serde_json::Value>;

/// LiveView event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveEvent {
    pub event_type: String,
    pub target: Option<String>,
    pub value: Option<serde_json::Value>,
    pub key: Option<String>,
}

/// DOM patch for efficient updates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DomPatch {
    Morph { target: String, html: String },
    Append { target: String, html: String },
    Prepend { target: String, html: String },
    Replace { target: String, html: String },
    Remove { target: String },
    UpdateAttr { target: String, attr: String, value: String },
    RemoveAttr { target: String, attr: String },
}

/// View patch containing DOM updates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewPatch {
    pub patches: Vec<DomPatch>,
    pub title: Option<String>,
    pub events: Vec<PushEvent>,
}

impl Default for ViewPatch {
    fn default() -> Self {
        Self {
            patches: Vec::new(),
            title: None,
            events: Vec::new(),
        }
    }
}

/// Push event to client
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushEvent {
    pub event: String,
    pub payload: serde_json::Value,
}

// ============================================================================
// LiveView Trait
// ============================================================================

/// Trait for LiveView components
pub trait LiveView: Send + Sync {
    /// Mount the view and return initial state
    fn mount(&mut self, socket: &mut LiveSocket);

    /// Handle an event from the client
    fn handle_event(&mut self, event: &LiveEvent, socket: &mut LiveSocket);

    /// Handle info messages (internal pub/sub)
    fn handle_info(&mut self, _info: serde_json::Value, _socket: &mut LiveSocket) {}

    /// Render the view to HTML
    fn render(&self) -> String;

    /// Called when the view is terminated
    fn terminate(&mut self, _reason: &str) {}
}

// ============================================================================
// LiveSocket
// ============================================================================

/// Socket connection for a LiveView
pub struct LiveSocket {
    /// Unique socket ID
    pub id: String,

    /// Session data
    pub session: HashMap<String, serde_json::Value>,

    /// URL parameters
    pub params: HashMap<String, String>,

    /// Flash messages
    flashes: Vec<Flash>,

    /// Pending events to push to client
    pending_events: Vec<PushEvent>,

    /// Redirect target
    redirect: Option<String>,

    /// Patch target
    patch: Option<String>,
}

#[derive(Debug, Clone)]
struct Flash {
    flash_type: FlashType,
    message: String,
}

#[derive(Debug, Clone, Copy)]
pub enum FlashType {
    Info,
    Success,
    Warning,
    Error,
}

impl LiveSocket {
    pub fn new(id: String) -> Self {
        Self {
            id,
            session: HashMap::new(),
            params: HashMap::new(),
            flashes: Vec::new(),
            pending_events: Vec::new(),
            redirect: None,
            patch: None,
        }
    }

    /// Push an event to the client
    pub fn push_event(&mut self, event: impl Into<String>, payload: serde_json::Value) {
        self.pending_events.push(PushEvent {
            event: event.into(),
            payload,
        });
    }

    /// Redirect to a new URL
    pub fn push_redirect(&mut self, to: impl Into<String>) {
        self.redirect = Some(to.into());
    }

    /// Patch the current URL
    pub fn push_patch(&mut self, to: impl Into<String>) {
        self.patch = Some(to.into());
    }

    /// Put a flash message
    pub fn put_flash(&mut self, flash_type: FlashType, message: impl Into<String>) {
        self.flashes.push(Flash {
            flash_type,
            message: message.into(),
        });
    }

    /// Get pending events and clear them
    pub fn take_pending_events(&mut self) -> Vec<PushEvent> {
        std::mem::take(&mut self.pending_events)
    }

    /// Get redirect target
    pub fn take_redirect(&mut self) -> Option<String> {
        self.redirect.take()
    }

    /// Get patch target
    pub fn take_patch(&mut self) -> Option<String> {
        self.patch.take()
    }
}

// ============================================================================
// LiveComponent
// ============================================================================

/// Trait for stateful LiveComponents within a LiveView
pub trait LiveComponent: Send + Sync {
    /// Component props type
    type Props;

    /// Mount the component
    fn mount(&mut self, socket: &mut LiveSocket, props: Self::Props);

    /// Update with new props
    fn update(&mut self, _props: Self::Props, _socket: &mut LiveSocket) {}

    /// Handle component events
    fn handle_event(&mut self, event: &LiveEvent, socket: &mut LiveSocket);

    /// Render the component
    fn render(&self) -> String;
}

// ============================================================================
// View Instance Manager
// ============================================================================

/// Manages LiveView instances for connected clients
pub struct LiveViewRegistry {
    views: RwLock<HashMap<String, Box<dyn LiveView>>>,
}

impl LiveViewRegistry {
    pub fn new() -> Self {
        Self {
            views: RwLock::new(HashMap::new()),
        }
    }

    /// Register a view instance
    pub fn register(&self, socket_id: String, view: Box<dyn LiveView>) {
        if let Ok(mut views) = self.views.write() {
            views.insert(socket_id, view);
        }
    }

    /// Get a mutable reference to a view
    pub fn with_view<F, R>(&self, socket_id: &str, f: F) -> Option<R>
    where
        F: FnOnce(&mut Box<dyn LiveView>) -> R,
    {
        if let Ok(mut views) = self.views.write() {
            views.get_mut(socket_id).map(f)
        } else {
            None
        }
    }

    /// Remove a view instance
    pub fn remove(&self, socket_id: &str) -> Option<Box<dyn LiveView>> {
        if let Ok(mut views) = self.views.write() {
            views.remove(socket_id)
        } else {
            None
        }
    }
}

impl Default for LiveViewRegistry {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// DOM Differ
// ============================================================================

/// Compute DOM patches between old and new HTML
pub fn diff_html(old: &str, new: &str) -> Vec<DomPatch> {
    if old == new {
        return Vec::new();
    }

    // Simple implementation: full morph for now
    // Production would use a proper tree diff algorithm
    vec![DomPatch::Morph {
        target: "body".to_string(),
        html: new.to_string(),
    }]
}

// ============================================================================
// Template Helpers
// ============================================================================

/// Escape HTML special characters
pub fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#039;")
}

/// Conditionally render content
pub fn when<T: ToString>(condition: bool, content: T) -> String {
    if condition {
        content.to_string()
    } else {
        String::new()
    }
}

/// Render a list with a template
pub fn each<T, F>(items: &[T], template: F) -> String
where
    F: Fn(&T, usize) -> String,
{
    items
        .iter()
        .enumerate()
        .map(|(i, item)| template(item, i))
        .collect::<Vec<_>>()
        .join("")
}

// ============================================================================
// Form Helpers
// ============================================================================

/// Generate form input HTML
pub fn input(name: &str, input_type: &str, value: &str, attrs: &[(&str, &str)]) -> String {
    let mut html = format!(
        r#"<input type="{}" name="{}" id="{}" value="{}""#,
        input_type,
        name,
        name,
        escape_html(value)
    );

    for (key, val) in attrs {
        html.push_str(&format!(r#" {}="{}""#, key, escape_html(val)));
    }

    html.push_str(" />");
    html
}

/// Generate text input
pub fn text_input(name: &str, value: &str) -> String {
    input(name, "text", value, &[("phx-change", "validate")])
}

/// Generate email input
pub fn email_input(name: &str, value: &str) -> String {
    input(name, "email", value, &[("phx-change", "validate")])
}

/// Generate password input
pub fn password_input(name: &str) -> String {
    input(name, "password", "", &[("phx-change", "validate")])
}

/// Generate submit button
pub fn submit_button(text: &str, disable_with: Option<&str>) -> String {
    if let Some(disable_text) = disable_with {
        format!(
            r#"<button type="submit" phx-disable-with="{}">{}</button>"#,
            escape_html(disable_text),
            escape_html(text)
        )
    } else {
        format!(r#"<button type="submit">{}</button>"#, escape_html(text))
    }
}

// ============================================================================
// Validation
// ============================================================================

/// Validation error type
#[derive(Debug, Clone, Default)]
pub struct ValidationErrors {
    errors: HashMap<String, Vec<String>>,
}

impl ValidationErrors {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add(&mut self, field: &str, message: &str) {
        self.errors
            .entry(field.to_string())
            .or_default()
            .push(message.to_string());
    }

    pub fn get(&self, field: &str) -> Option<&Vec<String>> {
        self.errors.get(field)
    }

    pub fn is_empty(&self) -> bool {
        self.errors.is_empty()
    }

    pub fn render_errors(&self, field: &str) -> String {
        if let Some(errors) = self.get(field) {
            format!(
                r#"<div class="error">{}</div>"#,
                errors.iter().map(|e| escape_html(e)).collect::<Vec<_>>().join(", ")
            )
        } else {
            String::new()
        }
    }
}

// ============================================================================
// Server Integration
// ============================================================================

/// WebSocket message types
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    Join {
        topic: String,
        payload: JoinPayload,
    },
    Leave {
        topic: String,
    },
    Event {
        topic: String,
        event: LiveEvent,
    },
    Heartbeat,
    Reply {
        r#ref: String,
        status: String,
        response: serde_json::Value,
    },
    Diff {
        topic: String,
        diff: ViewPatch,
    },
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JoinPayload {
    pub url: String,
    pub params: HashMap<String, String>,
    pub session: String,
}

/// Handle incoming WebSocket message
pub async fn handle_ws_message(
    registry: &LiveViewRegistry,
    socket_id: &str,
    message: WsMessage,
) -> Option<WsMessage> {
    match message {
        WsMessage::Event { topic, event } => {
            let mut socket = LiveSocket::new(socket_id.to_string());

            let new_html = registry.with_view(socket_id, |view| {
                view.handle_event(&event, &mut socket);
                view.render()
            })?;

            // Get previous HTML (would be cached in production)
            let patches = diff_html("", &new_html);

            Some(WsMessage::Diff {
                topic,
                diff: ViewPatch {
                    patches,
                    events: socket.take_pending_events(),
                    title: None,
                },
            })
        }

        WsMessage::Heartbeat => Some(WsMessage::Reply {
            r#ref: "heartbeat".to_string(),
            status: "ok".to_string(),
            response: serde_json::json!({}),
        }),

        _ => None,
    }
}

// ============================================================================
// Macros
// ============================================================================

/// Create a LiveView (proc-macro placeholder)
#[macro_export]
macro_rules! live_view {
    ($name:ident, $init:expr, $render:expr) => {
        pub struct $name {
            socket: $crate::liveview::LiveSocket,
        }

        impl $name {
            pub fn new() -> Self {
                Self {
                    socket: $crate::liveview::LiveSocket::new(String::new()),
                }
            }
        }
    };
}

/// HTML template macro (simplified)
#[macro_export]
macro_rules! live {
    ($($tt:tt)*) => {
        format!("{}", stringify!($($tt)*))
    };
}

// ============================================================================
// PubSub
// ============================================================================

/// Simple in-memory PubSub
pub struct PubSub {
    subscriptions: RwLock<HashMap<String, Vec<String>>>,
}

impl PubSub {
    pub fn new() -> Self {
        Self {
            subscriptions: RwLock::new(HashMap::new()),
        }
    }

    /// Subscribe a socket to a topic
    pub fn subscribe(&self, topic: &str, socket_id: &str) {
        if let Ok(mut subs) = self.subscriptions.write() {
            subs.entry(topic.to_string())
                .or_default()
                .push(socket_id.to_string());
        }
    }

    /// Unsubscribe a socket from a topic
    pub fn unsubscribe(&self, topic: &str, socket_id: &str) {
        if let Ok(mut subs) = self.subscriptions.write() {
            if let Some(subscribers) = subs.get_mut(topic) {
                subscribers.retain(|id| id != socket_id);
            }
        }
    }

    /// Get subscribers for a topic
    pub fn subscribers(&self, topic: &str) -> Vec<String> {
        if let Ok(subs) = self.subscriptions.read() {
            subs.get(topic).cloned().unwrap_or_default()
        } else {
            Vec::new()
        }
    }

    /// Unsubscribe from all topics
    pub fn unsubscribe_all(&self, socket_id: &str) {
        if let Ok(mut subs) = self.subscriptions.write() {
            for subscribers in subs.values_mut() {
                subscribers.retain(|id| id != socket_id);
            }
        }
    }
}

impl Default for PubSub {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Exports
// ============================================================================

pub use crate::live;
pub use crate::live_view;
