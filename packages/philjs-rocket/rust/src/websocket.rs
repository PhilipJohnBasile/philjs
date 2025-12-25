//! WebSocket support for PhilJS Rocket LiveView

use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};
use rocket_ws::{WebSocket, Message, Channel};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::collections::HashMap;
use parking_lot::RwLock;
use tokio::sync::broadcast;
use uuid::Uuid;

/// LiveView WebSocket handler
pub struct LiveViewSocket<T> {
    /// The LiveView component
    component: Arc<RwLock<T>>,
    /// Connection ID
    id: String,
}

impl<T> LiveViewSocket<T>
where
    T: LiveViewHandler + Send + Sync + 'static,
{
    /// Create a new LiveView socket
    pub fn new(component: T) -> Self {
        Self {
            component: Arc::new(RwLock::new(component)),
            id: Uuid::new_v4().to_string(),
        }
    }

    /// Get the connection ID
    pub fn id(&self) -> &str {
        &self.id
    }

    /// Handle WebSocket messages
    pub async fn handle(self, ws: WebSocket) -> Channel<'static> {
        let component = self.component.clone();
        let id = self.id.clone();

        ws.channel(move |mut stream| Box::pin(async move {
            // Send initial render
            {
                let comp = component.read();
                let html = comp.render();
                let msg = LiveViewMessage::Render { html };
                if let Ok(json) = serde_json::to_string(&msg) {
                    let _ = stream.send(Message::Text(json)).await;
                }
            }

            // Mount the component
            {
                let mut comp = component.write();
                let mut socket = LiveSocket::new(id.clone());
                comp.mount(&mut socket);
            }

            // Handle incoming messages
            while let Some(msg) = stream.next().await {
                match msg {
                    Ok(Message::Text(text)) => {
                        if let Ok(event) = serde_json::from_str::<LiveViewEvent>(&text) {
                            let mut comp = component.write();
                            let mut socket = LiveSocket::new(id.clone());
                            comp.handle_event(&event, &mut socket);

                            // Send updated render
                            let html = comp.render();
                            let msg = LiveViewMessage::Render { html };
                            if let Ok(json) = serde_json::to_string(&msg) {
                                let _ = stream.send(Message::Text(json)).await;
                            }
                        }
                    }
                    Ok(Message::Close(_)) => break,
                    _ => {}
                }
            }

            // Unmount the component
            {
                let mut comp = component.write();
                let mut socket = LiveSocket::new(id);
                comp.unmount(&mut socket);
            }

            Ok(())
        }))
    }
}

/// Trait for LiveView components
pub trait LiveViewHandler {
    /// Mount the component
    fn mount(&mut self, socket: &mut LiveSocket);

    /// Handle an event
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
    assigns: HashMap<String, serde_json::Value>,
}

impl LiveSocket {
    /// Create a new live socket
    pub fn new(id: String) -> Self {
        Self {
            id,
            patches: Vec::new(),
            assigns: HashMap::new(),
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
    pub fn assigns(&self) -> &HashMap<String, serde_json::Value> {
        &self.assigns
    }
}

/// LiveView event from client
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveViewEvent {
    /// Event type (e.g., "click", "submit", "change")
    pub event: String,
    /// Event target element ID
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
pub enum LiveViewMessage {
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

/// Broadcast manager for pub/sub messaging
pub struct BroadcastManager {
    /// Channels by topic
    channels: Arc<RwLock<HashMap<String, broadcast::Sender<String>>>>,
    /// Channel capacity
    capacity: usize,
}

impl BroadcastManager {
    /// Create a new broadcast manager
    pub fn new(capacity: usize) -> Self {
        Self {
            channels: Arc::new(RwLock::new(HashMap::new())),
            capacity,
        }
    }

    /// Subscribe to a topic
    pub fn subscribe(&self, topic: &str) -> broadcast::Receiver<String> {
        let mut channels = self.channels.write();

        if let Some(sender) = channels.get(topic) {
            sender.subscribe()
        } else {
            let (tx, rx) = broadcast::channel(self.capacity);
            channels.insert(topic.to_string(), tx);
            rx
        }
    }

    /// Broadcast a message to a topic
    pub fn broadcast(&self, topic: &str, message: String) -> Result<usize, broadcast::error::SendError<String>> {
        let channels = self.channels.read();

        if let Some(sender) = channels.get(topic) {
            sender.send(message)
        } else {
            Ok(0)
        }
    }

    /// Get subscriber count for a topic
    pub fn subscriber_count(&self, topic: &str) -> usize {
        let channels = self.channels.read();

        if let Some(sender) = channels.get(topic) {
            sender.receiver_count()
        } else {
            0
        }
    }
}

impl Default for BroadcastManager {
    fn default() -> Self {
        Self::new(100)
    }
}

/// Presence tracker for online users
pub struct PresenceTracker {
    /// Presences by topic
    presences: Arc<RwLock<HashMap<String, HashMap<String, PresenceEntry>>>>,
}

#[derive(Clone, Serialize)]
pub struct PresenceEntry {
    /// User ID or identifier
    pub id: String,
    /// Connection ID
    pub conn_id: String,
    /// Metadata
    pub metadata: serde_json::Value,
    /// Join time
    pub joined_at: i64,
}

impl PresenceTracker {
    /// Create a new presence tracker
    pub fn new() -> Self {
        Self {
            presences: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Track a presence
    pub fn track(&self, topic: &str, id: &str, conn_id: &str, metadata: serde_json::Value) {
        let mut presences = self.presences.write();
        let topic_presences = presences.entry(topic.to_string()).or_default();

        topic_presences.insert(
            conn_id.to_string(),
            PresenceEntry {
                id: id.to_string(),
                conn_id: conn_id.to_string(),
                metadata,
                joined_at: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs() as i64,
            },
        );
    }

    /// Untrack a presence
    pub fn untrack(&self, topic: &str, conn_id: &str) {
        let mut presences = self.presences.write();
        if let Some(topic_presences) = presences.get_mut(topic) {
            topic_presences.remove(conn_id);
        }
    }

    /// List all presences in a topic
    pub fn list(&self, topic: &str) -> Vec<PresenceEntry> {
        let presences = self.presences.read();
        presences
            .get(topic)
            .map(|p| p.values().cloned().collect())
            .unwrap_or_default()
    }

    /// Get presence count in a topic
    pub fn count(&self, topic: &str) -> usize {
        let presences = self.presences.read();
        presences.get(topic).map(|p| p.len()).unwrap_or(0)
    }
}

impl Default for PresenceTracker {
    fn default() -> Self {
        Self::new()
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
            payload: serde_json::json!({
                "value": 42
            }),
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
    fn test_live_view_patch_serialization() {
        let patch = LiveViewPatch::Replace {
            target: "#app".to_string(),
            html: "<div>Hello</div>".to_string(),
        };

        let json = serde_json::to_string(&patch).unwrap();
        assert!(json.contains("Replace"));
        assert!(json.contains("#app"));
    }

    #[test]
    fn test_presence_tracker() {
        let tracker = PresenceTracker::new();

        tracker.track("room:1", "user-1", "conn-1", serde_json::json!({}));
        tracker.track("room:1", "user-2", "conn-2", serde_json::json!({}));

        assert_eq!(tracker.count("room:1"), 2);

        tracker.untrack("room:1", "conn-1");
        assert_eq!(tracker.count("room:1"), 1);
    }
}
