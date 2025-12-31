/**
 * PhilJS Rocket WebSocket
 *
 * WebSocket support for LiveView in Rocket.
 */
// ============================================================================
// WebSocket Configuration
// ============================================================================
/**
 * Default WebSocket options
 */
export const DEFAULT_WS_OPTIONS = {
    maxMessageSize: 64 * 1024, // 64KB
    maxFrameSize: 16 * 1024, // 16KB
    compression: true,
    heartbeatInterval: 30000, // 30 seconds
    timeout: 60000, // 60 seconds
};
/**
 * WebSocket configuration builder
 */
export class WebSocketConfig {
    options;
    constructor(options = {}) {
        this.options = { ...DEFAULT_WS_OPTIONS, ...options };
    }
    /**
     * Set maximum message size
     */
    maxMessageSize(bytes) {
        this.options.maxMessageSize = bytes;
        return this;
    }
    /**
     * Set maximum frame size
     */
    maxFrameSize(bytes) {
        this.options.maxFrameSize = bytes;
        return this;
    }
    /**
     * Enable/disable compression
     */
    compression(enabled) {
        this.options.compression = enabled;
        return this;
    }
    /**
     * Set heartbeat interval
     */
    heartbeatInterval(ms) {
        this.options.heartbeatInterval = ms;
        return this;
    }
    /**
     * Set connection timeout
     */
    timeout(ms) {
        this.options.timeout = ms;
        return this;
    }
    /**
     * Get configuration
     */
    build() {
        return this.options;
    }
    /**
     * Generate Rust configuration code
     */
    toRustCode() {
        return `
use rocket_ws::Config as WsConfig;

let ws_config = WsConfig {
    max_message_size: ${this.options.maxMessageSize},
    max_frame_size: ${this.options.maxFrameSize},
    ..Default::default()
};
`.trim();
    }
}
/**
 * LiveView WebSocket handler builder
 */
export class LiveViewSocketBuilder {
    handler = {};
    config = {};
    /**
     * Set connection handler
     */
    onConnect(handler) {
        this.handler.onConnect = handler;
        return this;
    }
    /**
     * Set message handler
     */
    onMessage(handler) {
        this.handler.onMessage = handler;
        return this;
    }
    /**
     * Set close handler
     */
    onClose(handler) {
        this.handler.onClose = handler;
        return this;
    }
    /**
     * Set render function
     */
    render(fn) {
        this.handler.render = fn;
        return this;
    }
    /**
     * Configure WebSocket options
     */
    configure(options) {
        this.config = { ...this.config, ...options };
        return this;
    }
    /**
     * Build the handler
     */
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
    /**
     * Generate Rust handler code
     */
    toRustCode() {
        return `
use rocket_ws::{WebSocket, Channel, Message};
use philjs_rocket::liveview::{LiveViewHandler, LiveSocket, LiveViewMessage, LiveViewPatch};
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

    /// Handle WebSocket connection
    pub async fn handle(self, ws: WebSocket) -> Channel<'static> {
        let state = self.state.clone();
        let id = self.id.clone();

        ws.channel(move |mut stream| Box::pin(async move {
            // Send initial render
            {
                let s = state.read();
                let html = s.render();
                let msg = serde_json::json!({
                    "type": "render",
                    "html": html
                });
                let _ = stream.send(Message::Text(msg.to_string())).await;
            }

            // Handle incoming messages
            while let Some(message) = stream.next().await {
                match message {
                    Ok(Message::Text(text)) => {
                        if let Ok(event) = serde_json::from_str::<LiveViewMessage>(&text) {
                            let mut s = state.write();
                            s.handle_event(&event);

                            // Send updated render
                            let html = s.render();
                            let msg = serde_json::json!({
                                "type": "render",
                                "html": html
                            });
                            let _ = stream.send(Message::Text(msg.to_string())).await;
                        }
                    }
                    Ok(Message::Ping(data)) => {
                        let _ = stream.send(Message::Pong(data)).await;
                    }
                    Ok(Message::Close(_)) | Err(_) => break,
                    _ => {}
                }
            }

            Ok(())
        }))
    }
}

/// LiveView handler trait
pub trait LiveViewHandler: Sized {
    type State;

    /// Mount the view and return initial state
    fn mount(&mut self, socket: &LiveSocket) -> Self::State;

    /// Handle events from the client
    fn handle_event(&mut self, event: &LiveViewMessage);

    /// Render the current state to HTML
    fn render(&self) -> String;

    /// Optional: Handle unmount
    fn unmount(&mut self) {}
}
`.trim();
    }
}
/**
 * Create a LiveView message encoder
 */
export function createMessageEncoder() {
    return {
        /**
         * Encode a join message
         */
        join(topic, payload) {
            return JSON.stringify({ type: 'phx_join', topic, payload });
        },
        /**
         * Encode a leave message
         */
        leave(topic) {
            return JSON.stringify({ type: 'phx_leave', topic });
        },
        /**
         * Encode an event message
         */
        event(topic, event, payload) {
            return JSON.stringify({ type: 'event', topic, event, payload });
        },
        /**
         * Encode a heartbeat message
         */
        heartbeat() {
            return JSON.stringify({ type: 'heartbeat' });
        },
    };
}
/**
 * Create a LiveView message decoder
 */
export function createMessageDecoder() {
    return {
        /**
         * Decode a server message
         */
        decode(data) {
            try {
                return JSON.parse(data);
            }
            catch {
                return null;
            }
        },
        /**
         * Check if message is a render
         */
        isRender(msg) {
            return msg.type === 'render';
        },
        /**
         * Check if message is a patch
         */
        isPatch(msg) {
            return msg.type === 'patch';
        },
        /**
         * Check if message is a redirect
         */
        isRedirect(msg) {
            return msg.type === 'redirect';
        },
    };
}
/**
 * Create a broadcast channel manager
 */
export class BroadcastManager {
    channels = new Map();
    /**
     * Get or create a channel
     */
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
                        console.error(`Error in broadcast handler for channel ${name}:`, error);
                    }
                }
            },
            subscriberCount: () => subscribers.size,
        };
    }
    /**
     * Broadcast to a channel
     */
    broadcast(channelName, message) {
        const subscribers = this.channels.get(channelName);
        if (subscribers) {
            for (const handler of subscribers) {
                try {
                    handler(message);
                }
                catch (error) {
                    console.error(`Error in broadcast handler:`, error);
                }
            }
        }
    }
    /**
     * Get all channel names
     */
    getChannelNames() {
        return Array.from(this.channels.keys());
    }
    /**
     * Generate Rust broadcast code
     */
    static toRustCode() {
        return `
use tokio::sync::broadcast;
use std::collections::HashMap;
use std::sync::Arc;
use parking_lot::RwLock;
use serde::{Serialize, Deserialize};

/// Broadcast message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BroadcastMessage {
    pub topic: String,
    pub event: String,
    pub payload: serde_json::Value,
}

/// Broadcast channel manager
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

    /// Get or create a channel
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

    /// Subscribe to a channel
    pub fn subscribe(&self, name: &str) -> broadcast::Receiver<BroadcastMessage> {
        self.channel(name).subscribe()
    }

    /// Broadcast a message to a channel
    pub fn broadcast(&self, topic: &str, event: &str, payload: serde_json::Value) {
        let tx = self.channel(topic);
        let _ = tx.send(BroadcastMessage {
            topic: topic.to_string(),
            event: event.to_string(),
            payload,
        });
    }

    /// Get subscriber count for a channel
    pub fn subscriber_count(&self, name: &str) -> usize {
        self.channel(name).receiver_count()
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
    /**
     * Track a join
     */
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
    /**
     * Untrack a leave
     */
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
    /**
     * Get presence for a key
     */
    get(key) {
        return this.state.get(key) || [];
    }
    /**
     * List all presences
     */
    list() {
        return this.state;
    }
    /**
     * Set join callback
     */
    onJoinCallback(callback) {
        this.onJoin = callback;
    }
    /**
     * Set leave callback
     */
    onLeaveCallback(callback) {
        this.onLeave = callback;
    }
    /**
     * Generate Rust presence code
     */
    static toRustCode() {
        return `
use std::collections::HashMap;
use std::sync::Arc;
use parking_lot::RwLock;
use serde::{Serialize, Deserialize};

/// Presence entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresenceEntry {
    pub id: String,
    pub phx_ref: String,
    pub meta: serde_json::Value,
    pub joined_at: u64,
}

/// Presence tracker
pub struct PresenceTracker {
    state: Arc<RwLock<HashMap<String, Vec<PresenceEntry>>>>,
}

impl PresenceTracker {
    pub fn new() -> Self {
        Self {
            state: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Track a join
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

    /// Untrack a leave
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

    /// Get presence for a key
    pub fn get(&self, key: &str) -> Vec<PresenceEntry> {
        self.state.read()
            .get(key)
            .cloned()
            .unwrap_or_default()
    }

    /// List all presences
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