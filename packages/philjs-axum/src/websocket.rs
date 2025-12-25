//! WebSocket support for PhilJS Axum
//!
//! This module provides WebSocket handling for LiveView and real-time features.

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use parking_lot::RwLock;
use tokio::sync::{broadcast, mpsc};
use uuid::Uuid;

/// LiveView WebSocket handler
pub struct LiveViewSocket<S> {
    /// The LiveView component state
    state: Arc<RwLock<S>>,
    /// Connection ID
    id: String,
}

impl<S> LiveViewSocket<S>
where
    S: LiveViewHandler + Send + Sync + 'static,
{
    /// Create a new LiveView socket
    pub fn new(component: S) -> Self {
        Self {
            state: Arc::new(RwLock::new(component)),
            id: Uuid::new_v4().to_string(),
        }
    }

    /// Handle WebSocket upgrade
    pub async fn upgrade(self, ws: WebSocketUpgrade) -> Response {
        ws.on_upgrade(move |socket| self.handle_connection(socket))
    }

    /// Handle WebSocket connection
    async fn handle_connection(self, socket: WebSocket) {
        let (mut sender, mut receiver) = socket.split();
        let state = self.state.clone();
        let id = self.id.clone();

        // Send initial render
        {
            let comp = state.read();
            let html = comp.render();
            let msg = LiveViewServerMessage::Render { html };
            if let Ok(json) = serde_json::to_string(&msg) {
                let _ = sender.send(Message::Text(json)).await;
            }
        }

        // Mount the component
        {
            let mut comp = state.write();
            let mut socket = LiveSocket::new(id.clone());
            comp.mount(&mut socket);
        }

        // Handle incoming messages
        while let Some(result) = receiver.next().await {
            match result {
                Ok(Message::Text(text)) => {
                    if let Ok(event) = serde_json::from_str::<LiveViewEvent>(&text) {
                        let mut comp = state.write();
                        let mut socket = LiveSocket::new(id.clone());
                        comp.handle_event(&event, &mut socket);

                        // Send updated render
                        let html = comp.render();
                        let msg = LiveViewServerMessage::Render { html };
                        if let Ok(json) = serde_json::to_string(&msg) {
                            let _ = sender.send(Message::Text(json)).await;
                        }

                        // Send any patches
                        let patches = socket.take_patches();
                        if !patches.is_empty() {
                            let msg = LiveViewServerMessage::Patch { patches };
                            if let Ok(json) = serde_json::to_string(&msg) {
                                let _ = sender.send(Message::Text(json)).await;
                            }
                        }
                    }
                }
                Ok(Message::Ping(data)) => {
                    let _ = sender.send(Message::Pong(data)).await;
                }
                Ok(Message::Close(_)) => break,
                Err(_) => break,
                _ => {}
            }
        }

        // Unmount the component
        {
            let mut comp = state.write();
            let mut socket = LiveSocket::new(id);
            comp.unmount(&mut socket);
        }
    }
}

/// Trait for LiveView components
pub trait LiveViewHandler {
    /// Mount the component
    fn mount(&mut self, socket: &mut LiveSocket);

    /// Handle an event from the client
    fn handle_event(&mut self, event: &LiveViewEvent, socket: &mut LiveSocket);

    /// Render the component to HTML
    fn render(&self) -> String;

    /// Unmount the component (cleanup)
    fn unmount(&mut self, _socket: &mut LiveSocket) {}
}

/// LiveView socket for component communication
pub struct LiveSocket {
    /// Connection ID
    pub id: String,
    /// Pending patches to send
    patches: Vec<LiveViewPatch>,
    /// Assigns (state to send to client)
    assigns: std::collections::HashMap<String, serde_json::Value>,
}

impl LiveSocket {
    /// Create a new live socket
    pub fn new(id: String) -> Self {
        Self {
            id,
            patches: Vec::new(),
            assigns: std::collections::HashMap::new(),
        }
    }

    /// Assign a value to send to the client
    pub fn assign<T: Serialize>(&mut self, key: &str, value: T) {
        if let Ok(json) = serde_json::to_value(value) {
            self.assigns.insert(key.to_string(), json);
        }
    }

    /// Push a DOM patch
    pub fn push_patch(&mut self, patch: LiveViewPatch) {
        self.patches.push(patch);
    }

    /// Push a redirect
    pub fn push_redirect(&mut self, to: &str) {
        self.patches.push(LiveViewPatch::Redirect {
            to: to.to_string(),
        });
    }

    /// Push a navigate (client-side navigation)
    pub fn push_navigate(&mut self, to: &str) {
        self.patches.push(LiveViewPatch::Navigate {
            to: to.to_string(),
        });
    }

    /// Get pending patches
    pub fn take_patches(&mut self) -> Vec<LiveViewPatch> {
        std::mem::take(&mut self.patches)
    }

    /// Get assigns
    pub fn assigns(&self) -> &std::collections::HashMap<String, serde_json::Value> {
        &self.assigns
    }
}

/// LiveView event from client
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveViewEvent {
    /// Event type
    pub event: String,
    /// Target element ID
    pub target: Option<String>,
    /// Event payload
    pub payload: serde_json::Value,
}

impl LiveViewEvent {
    /// Get a value from the payload
    pub fn get<T: for<'de> Deserialize<'de>>(&self, key: &str) -> Option<T> {
        self.payload.get(key).and_then(|v| serde_json::from_value(v.clone()).ok())
    }
}

/// LiveView message to client
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum LiveViewServerMessage {
    /// Full render
    Render { html: String },
    /// DOM patches
    Patch { patches: Vec<LiveViewPatch> },
    /// Error message
    Error { message: String },
    /// Redirect
    Redirect { to: String },
}

/// DOM patch operation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "op")]
pub enum LiveViewPatch {
    /// Replace element content
    Replace { target: String, html: String },
    /// Append to element
    Append { target: String, html: String },
    /// Prepend to element
    Prepend { target: String, html: String },
    /// Remove element
    Remove { target: String },
    /// Update attribute
    SetAttribute { target: String, name: String, value: String },
    /// Remove attribute
    RemoveAttribute { target: String, name: String },
    /// Add CSS class
    AddClass { target: String, class: String },
    /// Remove CSS class
    RemoveClass { target: String, class: String },
    /// Redirect to URL
    Redirect { to: String },
    /// Client-side navigation
    Navigate { to: String },
}

/// Broadcast channel for pub/sub messaging
pub struct BroadcastChannel {
    /// Sender
    tx: broadcast::Sender<BroadcastMessage>,
}

/// Broadcast message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BroadcastMessage {
    /// Topic
    pub topic: String,
    /// Event type
    pub event: String,
    /// Payload
    pub payload: serde_json::Value,
}

impl BroadcastChannel {
    /// Create a new broadcast channel
    pub fn new(capacity: usize) -> Self {
        let (tx, _) = broadcast::channel(capacity);
        Self { tx }
    }

    /// Subscribe to the channel
    pub fn subscribe(&self) -> broadcast::Receiver<BroadcastMessage> {
        self.tx.subscribe()
    }

    /// Broadcast a message
    pub fn broadcast(&self, msg: BroadcastMessage) -> Result<usize, broadcast::error::SendError<BroadcastMessage>> {
        self.tx.send(msg)
    }

    /// Get subscriber count
    pub fn subscriber_count(&self) -> usize {
        self.tx.receiver_count()
    }
}

impl Default for BroadcastChannel {
    fn default() -> Self {
        Self::new(1024)
    }
}

/// Presence tracking for connected users
pub struct PresenceTracker {
    /// State
    state: Arc<RwLock<std::collections::HashMap<String, Vec<PresenceEntry>>>>,
}

/// Presence entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresenceEntry {
    /// User/connection ID
    pub id: String,
    /// Phoenix-style reference
    pub phx_ref: String,
    /// Metadata
    pub meta: serde_json::Value,
    /// Join timestamp
    pub joined_at: u64,
}

impl PresenceTracker {
    /// Create a new presence tracker
    pub fn new() -> Self {
        Self {
            state: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Track a user joining
    pub fn track(&self, key: &str, id: &str, meta: serde_json::Value) -> PresenceEntry {
        let entry = PresenceEntry {
            id: id.to_string(),
            phx_ref: Uuid::new_v4().to_string(),
            meta,
            joined_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        };

        let mut state = self.state.write();
        state.entry(key.to_string())
            .or_insert_with(Vec::new)
            .push(entry.clone());

        entry
    }

    /// Untrack a user leaving
    pub fn untrack(&self, key: &str, id: &str) -> Option<PresenceEntry> {
        let mut state = self.state.write();

        if let Some(entries) = state.get_mut(key) {
            if let Some(index) = entries.iter().position(|e| e.id == id) {
                let entry = entries.remove(index);
                if entries.is_empty() {
                    state.remove(key);
                }
                return Some(entry);
            }
        }

        None
    }

    /// Get presences for a key
    pub fn get(&self, key: &str) -> Vec<PresenceEntry> {
        self.state.read()
            .get(key)
            .cloned()
            .unwrap_or_default()
    }

    /// List all presences
    pub fn list(&self) -> std::collections::HashMap<String, Vec<PresenceEntry>> {
        self.state.read().clone()
    }
}

impl Default for PresenceTracker {
    fn default() -> Self {
        Self::new()
    }
}

/// WebSocket handler for simple message handling
pub async fn websocket_handler<F, Fut>(
    ws: WebSocketUpgrade,
    handler: F,
) -> Response
where
    F: FnOnce(WebSocket) -> Fut + Send + 'static,
    Fut: std::future::Future<Output = ()> + Send,
{
    ws.on_upgrade(handler)
}

/// Echo WebSocket handler (for testing)
pub async fn echo_handler(socket: WebSocket) {
    let (mut sender, mut receiver) = socket.split();

    while let Some(Ok(msg)) = receiver.next().await {
        match msg {
            Message::Text(text) => {
                let _ = sender.send(Message::Text(text)).await;
            }
            Message::Binary(data) => {
                let _ = sender.send(Message::Binary(data)).await;
            }
            Message::Ping(data) => {
                let _ = sender.send(Message::Pong(data)).await;
            }
            Message::Close(_) => break,
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_live_view_event() {
        let event = LiveViewEvent {
            event: "click".to_string(),
            target: Some("button-1".to_string()),
            payload: serde_json::json!({ "value": 42 }),
        };

        assert_eq!(event.event, "click");
        assert_eq!(event.get::<i32>("value"), Some(42));
    }

    #[test]
    fn test_live_socket_assigns() {
        let mut socket = LiveSocket::new("test".to_string());
        socket.assign("count", 42);
        socket.assign("name", "test");

        assert!(socket.assigns().contains_key("count"));
        assert!(socket.assigns().contains_key("name"));
    }

    #[test]
    fn test_broadcast_channel() {
        let channel = BroadcastChannel::new(16);
        let mut rx = channel.subscribe();

        let msg = BroadcastMessage {
            topic: "test".to_string(),
            event: "update".to_string(),
            payload: serde_json::json!({"data": "test"}),
        };

        channel.broadcast(msg.clone()).unwrap();

        // Would need tokio runtime to actually receive
    }

    #[test]
    fn test_presence_tracker() {
        let tracker = PresenceTracker::new();

        let entry = tracker.track("room:lobby", "user1", serde_json::json!({"name": "Alice"}));
        assert_eq!(entry.id, "user1");

        let presences = tracker.get("room:lobby");
        assert_eq!(presences.len(), 1);

        tracker.untrack("room:lobby", "user1");
        let presences = tracker.get("room:lobby");
        assert_eq!(presences.len(), 0);
    }
}
