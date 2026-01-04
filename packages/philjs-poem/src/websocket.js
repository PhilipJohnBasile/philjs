/**
 * PhilJS Poem WebSocket
 *
 * WebSocket support for LiveView in Poem.
 */
// ============================================================================
// WebSocket Configuration
// ============================================================================
/**
 * Default WebSocket options
 */
export const DEFAULT_WS_OPTIONS = {
    maxMessageSize: 64 * 1024,
    maxFrameSize: 16 * 1024,
    compression: true,
    heartbeatInterval: 30000,
    timeout: 60000,
};
/**
 * WebSocket configuration builder
 */
export class WebSocketConfig {
    options;
    constructor(options = {}) {
        this.options = { ...DEFAULT_WS_OPTIONS, ...options };
    }
    maxMessageSize(bytes) {
        this.options.maxMessageSize = bytes;
        return this;
    }
    maxFrameSize(bytes) {
        this.options.maxFrameSize = bytes;
        return this;
    }
    compression(enabled) {
        this.options.compression = enabled;
        return this;
    }
    heartbeatInterval(ms) {
        this.options.heartbeatInterval = ms;
        return this;
    }
    timeout(ms) {
        this.options.timeout = ms;
        return this;
    }
    build() {
        return this.options;
    }
    toRustCode() {
        return `
use poem::web::websocket::{WebSocket, WebSocketStream};

// Poem WebSocket configuration is done via the WebSocket extractor
// The configuration is set at the server level or per-connection
`.trim();
    }
}
// ============================================================================
// LiveView Socket Builder
// ============================================================================
/**
 * LiveView WebSocket handler builder
 */
export class LiveViewSocketBuilder {
    handler = {};
    config = {};
    onConnect(handler) {
        this.handler.onConnect = handler;
        return this;
    }
    onMessage(handler) {
        this.handler.onMessage = handler;
        return this;
    }
    onClose(handler) {
        this.handler.onClose = handler;
        return this;
    }
    render(fn) {
        this.handler.render = fn;
        return this;
    }
    configure(options) {
        this.config = { ...this.config, ...options };
        return this;
    }
    build() {
        if (!this.handler.render) {
            throw new Error('LiveView handler must have a render function');
        }
        const result = {
            render: this.handler.render,
        };
        if (this.handler.onConnect !== undefined)
            result.onConnect = this.handler.onConnect;
        if (this.handler.onMessage !== undefined)
            result.onMessage = this.handler.onMessage;
        if (this.handler.onClose !== undefined)
            result.onClose = this.handler.onClose;
        return result;
    }
    toRustCode() {
        return `
use poem::web::websocket::{WebSocket, WebSocketStream, Message};
use poem::{handler, IntoResponse};
use futures_util::{StreamExt, SinkExt};
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use parking_lot::RwLock;

/// LiveView WebSocket handler
pub struct LiveViewSocket<S> {
    state: Arc<RwLock<S>>,
    id: String,
}

impl<S> LiveViewSocket<S>
where
    S: LiveViewHandler + Send + Sync + 'static,
{
    pub fn new(initial_state: S) -> Self {
        Self {
            state: Arc::new(RwLock::new(initial_state)),
            id: uuid::Uuid::new_v4().to_string(),
        }
    }

    pub async fn handle(self, ws: WebSocket) -> impl IntoResponse {
        let state = self.state.clone();

        ws.on_upgrade(move |socket| async move {
            let (mut sink, mut stream) = socket.split();

            // Send initial render
            {
                let s = state.read();
                let html = s.render();
                let msg = serde_json::json!({
                    "type": "render",
                    "html": html
                });
                let _ = sink.send(Message::Text(msg.to_string())).await;
            }

            // Handle messages
            while let Some(Ok(msg)) = stream.next().await {
                match msg {
                    Message::Text(text) => {
                        if let Ok(event) = serde_json::from_str::<LiveViewMessage>(&text) {
                            let mut s = state.write();
                            s.handle_event(&event);

                            let html = s.render();
                            let msg = serde_json::json!({
                                "type": "render",
                                "html": html
                            });
                            let _ = sink.send(Message::Text(msg.to_string())).await;
                        }
                    }
                    Message::Ping(data) => {
                        let _ = sink.send(Message::Pong(data)).await;
                    }
                    Message::Close(_) => break,
                    _ => {}
                }
            }
        })
    }
}

/// LiveView handler trait
pub trait LiveViewHandler: Sized {
    fn mount(&mut self, socket: &LiveSocket);
    fn handle_event(&mut self, event: &LiveViewMessage);
    fn render(&self) -> String;
    fn unmount(&mut self) {}
}

/// LiveView message from client
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveViewMessage {
    pub event: String,
    pub target: Option<String>,
    pub payload: serde_json::Value,
}

/// LiveSocket for state management
pub struct LiveSocket {
    pub id: String,
    patches: Vec<LiveViewPatch>,
    assigns: std::collections::HashMap<String, serde_json::Value>,
}

impl LiveSocket {
    pub fn new(id: String) -> Self {
        Self {
            id,
            patches: Vec::new(),
            assigns: std::collections::HashMap::new(),
        }
    }

    pub fn assign<T: Serialize>(&mut self, key: &str, value: T) {
        if let Ok(json) = serde_json::to_value(value) {
            self.assigns.insert(key.to_string(), json);
        }
    }

    pub fn push_patch(&mut self, patch: LiveViewPatch) {
        self.patches.push(patch);
    }

    pub fn push_redirect(&mut self, to: &str) {
        self.patches.push(LiveViewPatch::Redirect { to: to.to_string() });
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "op")]
pub enum LiveViewPatch {
    Replace { target: String, html: String },
    Append { target: String, html: String },
    Prepend { target: String, html: String },
    Remove { target: String },
    SetAttribute { target: String, name: String, value: String },
    RemoveAttribute { target: String, name: String },
    Redirect { to: String },
}
`.trim();
    }
}
/**
 * Broadcast manager for real-time updates
 */
export class BroadcastManager {
    channels = new Map();
    channel(name) {
        if (!this.channels.has(name)) {
            this.channels.set(name, new Set());
        }
        const subscribers = this.channels.get(name);
        return {
            name,
            subscribe: (handler) => {
                subscribers.add(handler);
                return () => subscribers.delete(handler);
            },
            broadcast: (message) => {
                for (const handler of subscribers) {
                    try {
                        handler(message);
                    }
                    catch (error) {
                        console.error(`Broadcast error in channel ${name}:`, error);
                    }
                }
            },
            subscriberCount: () => subscribers.size,
        };
    }
    broadcast(channelName, message) {
        const subscribers = this.channels.get(channelName);
        if (subscribers) {
            for (const handler of subscribers) {
                try {
                    handler(message);
                }
                catch (error) {
                    console.error(`Broadcast error:`, error);
                }
            }
        }
    }
    getChannelNames() {
        return Array.from(this.channels.keys());
    }
    static toRustCode() {
        return `
use tokio::sync::broadcast;
use std::collections::HashMap;
use std::sync::Arc;
use parking_lot::RwLock;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BroadcastMessage {
    pub topic: String,
    pub event: String,
    pub payload: serde_json::Value,
}

pub struct BroadcastManager {
    channels: Arc<RwLock<HashMap<String, broadcast::Sender<BroadcastMessage>>>>,
    capacity: usize,
}

impl BroadcastManager {
    pub fn new(capacity: usize) -> Self {
        Self {
            channels: Arc::new(RwLock::new(HashMap::new())),
            capacity,
        }
    }

    pub fn channel(&self, name: &str) -> broadcast::Sender<BroadcastMessage> {
        let mut channels = self.channels.write();

        if let Some(tx) = channels.get(name) {
            tx.clone()
        } else {
            let (tx, _) = broadcast::channel(self.capacity);
            channels.insert(name.to_string(), tx.clone());
            tx
        }
    }

    pub fn subscribe(&self, name: &str) -> broadcast::Receiver<BroadcastMessage> {
        self.channel(name).subscribe()
    }

    pub fn broadcast(&self, topic: &str, event: &str, payload: serde_json::Value) {
        let tx = self.channel(topic);
        let _ = tx.send(BroadcastMessage {
            topic: topic.to_string(),
            event: event.to_string(),
            payload,
        });
    }
}

impl Default for BroadcastManager {
    fn default() -> Self {
        Self::new(1024)
    }
}
`.trim();
    }
}
/**
 * Presence tracker for LiveView
 */
export class PresenceTracker {
    state = new Map();
    onJoin;
    onLeave;
    track(key, entry) {
        const fullEntry = {
            ...entry,
            joinedAt: Date.now(),
        };
        const current = this.state.get(key);
        if (current) {
            current.push(fullEntry);
        }
        else {
            this.state.set(key, [fullEntry]);
        }
        this.onJoin?.(key, current, fullEntry);
    }
    untrack(key, id) {
        const current = this.state.get(key);
        if (!current)
            return;
        const index = current.findIndex(e => e.id === id);
        if (index === -1)
            return;
        const leftEntry = current.splice(index, 1)[0];
        if (current.length === 0) {
            this.state.delete(key);
        }
        if (leftEntry !== undefined) {
            this.onLeave?.(key, current, leftEntry);
        }
    }
    get(key) {
        return this.state.get(key) || [];
    }
    list() {
        return this.state;
    }
    onJoinCallback(callback) {
        this.onJoin = callback;
    }
    onLeaveCallback(callback) {
        this.onLeave = callback;
    }
    static toRustCode() {
        return `
use std::collections::HashMap;
use std::sync::Arc;
use parking_lot::RwLock;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresenceEntry {
    pub id: String,
    pub phx_ref: String,
    pub meta: serde_json::Value,
    pub joined_at: u64,
}

pub struct PresenceTracker {
    state: Arc<RwLock<HashMap<String, Vec<PresenceEntry>>>>,
}

impl PresenceTracker {
    pub fn new() -> Self {
        Self {
            state: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn track(&self, key: &str, id: &str, meta: serde_json::Value) -> PresenceEntry {
        let entry = PresenceEntry {
            id: id.to_string(),
            phx_ref: uuid::Uuid::new_v4().to_string(),
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

    pub fn get(&self, key: &str) -> Vec<PresenceEntry> {
        self.state.read()
            .get(key)
            .cloned()
            .unwrap_or_default()
    }

    pub fn list(&self) -> HashMap<String, Vec<PresenceEntry>> {
        self.state.read().clone()
    }
}

impl Default for PresenceTracker {
    fn default() -> Self {
        Self::new()
    }
}
`.trim();
    }
}
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Create a WebSocket configuration builder
 */
export function configureWebSocket(options) {
    return new WebSocketConfig(options);
}
/**
 * Create a LiveView socket builder
 */
export function createLiveViewSocket() {
    return new LiveViewSocketBuilder();
}
/**
 * Create a broadcast manager
 */
export function createBroadcastManager() {
    return new BroadcastManager();
}
/**
 * Create a presence tracker
 */
export function createPresenceTracker() {
    return new PresenceTracker();
}
//# sourceMappingURL=websocket.js.map