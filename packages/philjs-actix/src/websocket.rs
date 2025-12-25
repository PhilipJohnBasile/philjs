//! WebSocket support for PhilJS LiveView

use actix_web::{web, HttpRequest, HttpResponse, Error};
use actix_ws::{Message, MessageStream, Session};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use parking_lot::RwLock;
use tokio::sync::mpsc;
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
    T: LiveViewComponent + Send + Sync + 'static,
{
    /// Create a new LiveView socket
    pub fn new(component: T) -> Self {
        Self {
            component: Arc::new(RwLock::new(component)),
            id: Uuid::new_v4().to_string(),
        }
    }

    /// Upgrade HTTP request to WebSocket
    pub async fn upgrade(
        self,
        req: HttpRequest,
        stream: web::Payload,
    ) -> Result<HttpResponse, Error> {
        let (response, session, msg_stream) = actix_ws::handle(&req, stream)?;

        // Spawn the WebSocket handler
        actix_rt::spawn(self.handle_connection(session, msg_stream));

        Ok(response)
    }

    /// Handle WebSocket connection
    async fn handle_connection(self, mut session: Session, mut msg_stream: MessageStream) {
        let component = self.component.clone();
        let id = self.id.clone();

        // Send initial render
        {
            let comp = component.read();
            let html = comp.render();
            let msg = LiveViewMessage::Render { html };
            if let Ok(json) = serde_json::to_string(&msg) {
                let _ = session.text(json).await;
            }
        }

        // Mount the component
        {
            let mut comp = component.write();
            let mut socket = LiveSocket::new(id.clone());
            comp.mount(&mut socket);
        }

        // Handle incoming messages
        while let Some(Ok(msg)) = msg_stream.next().await {
            match msg {
                Message::Text(text) => {
                    if let Ok(event) = serde_json::from_str::<LiveViewEvent>(&text) {
                        let mut comp = component.write();
                        let mut socket = LiveSocket::new(id.clone());
                        comp.handle_event(&event, &mut socket);

                        // Send updated render
                        let html = comp.render();
                        let msg = LiveViewMessage::Render { html };
                        if let Ok(json) = serde_json::to_string(&msg) {
                            let _ = session.text(json).await;
                        }
                    }
                }
                Message::Ping(bytes) => {
                    let _ = session.pong(&bytes).await;
                }
                Message::Close(_) => {
                    break;
                }
                _ => {}
            }
        }

        // Unmount the component
        {
            let mut comp = component.write();
            let mut socket = LiveSocket::new(id);
            comp.unmount(&mut socket);
        }
    }
}

/// Trait for LiveView components
pub trait LiveViewComponent {
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

/// Generic WebSocket handler
pub struct WebSocketHandler {
    /// Handler function
    on_message: Box<dyn Fn(&str) -> Option<String> + Send + Sync>,
}

impl WebSocketHandler {
    /// Create a new WebSocket handler
    pub fn new<F>(handler: F) -> Self
    where
        F: Fn(&str) -> Option<String> + Send + Sync + 'static,
    {
        Self {
            on_message: Box::new(handler),
        }
    }

    /// Upgrade to WebSocket
    pub async fn upgrade(
        self,
        req: HttpRequest,
        stream: web::Payload,
    ) -> Result<HttpResponse, Error> {
        let (response, session, msg_stream) = actix_ws::handle(&req, stream)?;

        actix_rt::spawn(self.handle_connection(session, msg_stream));

        Ok(response)
    }

    /// Handle connection
    async fn handle_connection(self, mut session: Session, mut msg_stream: MessageStream) {
        while let Some(Ok(msg)) = msg_stream.next().await {
            match msg {
                Message::Text(text) => {
                    if let Some(response) = (self.on_message)(&text) {
                        let _ = session.text(response).await;
                    }
                }
                Message::Ping(bytes) => {
                    let _ = session.pong(&bytes).await;
                }
                Message::Close(_) => {
                    break;
                }
                _ => {}
            }
        }
    }
}

/// Channel-based WebSocket for bidirectional communication
pub struct ChannelSocket {
    /// Sender for outgoing messages
    tx: mpsc::Sender<String>,
    /// Receiver for incoming messages
    rx: mpsc::Receiver<String>,
}

impl ChannelSocket {
    /// Create a new channel socket pair
    pub fn new(buffer_size: usize) -> (Self, ChannelSocketHandle) {
        let (tx_out, rx_out) = mpsc::channel(buffer_size);
        let (tx_in, rx_in) = mpsc::channel(buffer_size);

        let socket = Self {
            tx: tx_out,
            rx: rx_in,
        };

        let handle = ChannelSocketHandle {
            tx: tx_in,
            rx: rx_out,
        };

        (socket, handle)
    }

    /// Send a message
    pub async fn send(&self, msg: String) -> Result<(), mpsc::error::SendError<String>> {
        self.tx.send(msg).await
    }

    /// Receive a message
    pub async fn recv(&mut self) -> Option<String> {
        self.rx.recv().await
    }
}

/// Handle for the other side of a channel socket
pub struct ChannelSocketHandle {
    /// Sender
    tx: mpsc::Sender<String>,
    /// Receiver
    rx: mpsc::Receiver<String>,
}

impl ChannelSocketHandle {
    /// Send a message
    pub async fn send(&self, msg: String) -> Result<(), mpsc::error::SendError<String>> {
        self.tx.send(msg).await
    }

    /// Receive a message
    pub async fn recv(&mut self) -> Option<String> {
        self.rx.recv().await
    }
}

/// Broadcast channel for multiple subscribers
pub struct BroadcastChannel {
    /// Sender
    tx: tokio::sync::broadcast::Sender<String>,
}

impl BroadcastChannel {
    /// Create a new broadcast channel
    pub fn new(capacity: usize) -> Self {
        let (tx, _) = tokio::sync::broadcast::channel(capacity);
        Self { tx }
    }

    /// Subscribe to the channel
    pub fn subscribe(&self) -> tokio::sync::broadcast::Receiver<String> {
        self.tx.subscribe()
    }

    /// Broadcast a message
    pub fn broadcast(&self, msg: String) -> Result<usize, tokio::sync::broadcast::error::SendError<String>> {
        self.tx.send(msg)
    }

    /// Get subscriber count
    pub fn subscriber_count(&self) -> usize {
        self.tx.receiver_count()
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
}
