//! LiveView Example for PhilJS Axum
//!
//! This example demonstrates real-time updates using WebSockets.
//!
//! Run with: cargo run --example liveview --features websocket

use axum::{
    Router,
    routing::get,
    extract::ws::WebSocketUpgrade,
    response::Response,
};
use philjs_axum::prelude::*;
use philjs_axum::websocket::{
    LiveViewSocket, LiveViewHandler, LiveSocket, LiveViewEvent,
    BroadcastChannel, PresenceTracker,
};
use std::net::SocketAddr;
use std::sync::Arc;

/// Counter LiveView component
struct CounterLiveView {
    count: i32,
    step: i32,
}

impl CounterLiveView {
    fn new() -> Self {
        Self { count: 0, step: 1 }
    }
}

impl LiveViewHandler for CounterLiveView {
    fn mount(&mut self, socket: &mut LiveSocket) {
        socket.assign("count", self.count);
        socket.assign("step", self.step);
        tracing::info!("Counter mounted for connection: {}", socket.id);
    }

    fn handle_event(&mut self, event: &LiveViewEvent, socket: &mut LiveSocket) {
        match event.event.as_str() {
            "increment" => {
                self.count += self.step;
                socket.assign("count", self.count);
            }
            "decrement" => {
                self.count -= self.step;
                socket.assign("count", self.count);
            }
            "set_step" => {
                if let Some(step) = event.get::<i32>("step") {
                    self.step = step;
                    socket.assign("step", self.step);
                }
            }
            "reset" => {
                self.count = 0;
                socket.assign("count", self.count);
            }
            _ => {}
        }
    }

    fn render(&self) -> String {
        format!(
            r#"<div class="counter-container">
                <h1>LiveView Counter</h1>
                <div class="counter">
                    <button phx-click="decrement" class="btn btn-danger">-{}</button>
                    <span class="count">{}</span>
                    <button phx-click="increment" class="btn btn-success">+{}</button>
                </div>
                <div class="controls">
                    <label>
                        Step:
                        <input type="number" value="{}" phx-change="set_step" name="step" />
                    </label>
                    <button phx-click="reset" class="btn btn-secondary">Reset</button>
                </div>
            </div>"#,
            self.step, self.count, self.step, self.step
        )
    }

    fn unmount(&mut self, socket: &mut LiveSocket) {
        tracing::info!("Counter unmounted for connection: {}", socket.id);
    }
}

/// Chat room LiveView component
struct ChatRoomLiveView {
    messages: Vec<ChatMessage>,
    username: String,
    broadcast: Arc<BroadcastChannel>,
}

struct ChatMessage {
    user: String,
    text: String,
    timestamp: u64,
}

impl ChatRoomLiveView {
    fn new(broadcast: Arc<BroadcastChannel>) -> Self {
        Self {
            messages: Vec::new(),
            username: format!("User{}", rand::random::<u16>()),
            broadcast,
        }
    }
}

impl LiveViewHandler for ChatRoomLiveView {
    fn mount(&mut self, socket: &mut LiveSocket) {
        socket.assign("username", &self.username);
        socket.assign("messages", &self.messages.iter().map(|m| {
            serde_json::json!({
                "user": m.user,
                "text": m.text,
                "timestamp": m.timestamp
            })
        }).collect::<Vec<_>>());
        tracing::info!("Chat room mounted for {}", self.username);
    }

    fn handle_event(&mut self, event: &LiveViewEvent, socket: &mut LiveSocket) {
        match event.event.as_str() {
            "send_message" => {
                if let Some(text) = event.get::<String>("message") {
                    let msg = ChatMessage {
                        user: self.username.clone(),
                        text,
                        timestamp: std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_secs(),
                    };
                    self.messages.push(msg);

                    // Broadcast to all connected clients
                    let _ = self.broadcast.broadcast(
                        philjs_axum::websocket::BroadcastMessage {
                            topic: "chat:lobby".to_string(),
                            event: "new_message".to_string(),
                            payload: serde_json::json!({
                                "user": self.username,
                                "text": event.get::<String>("message")
                            }),
                        }
                    );
                }
            }
            "set_username" => {
                if let Some(name) = event.get::<String>("username") {
                    self.username = name;
                    socket.assign("username", &self.username);
                }
            }
            _ => {}
        }
    }

    fn render(&self) -> String {
        let messages_html: String = self.messages.iter().map(|m| {
            format!(
                r#"<div class="message">
                    <span class="user">{}</span>
                    <span class="text">{}</span>
                </div>"#,
                m.user, m.text
            )
        }).collect();

        format!(
            r#"<div class="chat-container">
                <h1>Chat Room</h1>
                <div class="messages" id="messages">{}</div>
                <form phx-submit="send_message">
                    <input type="text" name="message" placeholder="Type a message..." />
                    <button type="submit">Send</button>
                </form>
            </div>"#,
            messages_html
        )
    }
}

// Home page
async fn index() -> PhilJsHtml {
    render_document("LiveView Examples | PhilJS Axum", || view! {
        <div class="container">
            <h1>"PhilJS Axum LiveView Examples"</h1>
            <p>"Real-time, interactive applications with WebSockets."</p>
            <ul>
                <li><a href="/counter">"Counter Demo"</a></li>
                <li><a href="/chat">"Chat Room Demo"</a></li>
            </ul>
        </div>
    })
}

// Counter page (static render, connects via WebSocket)
async fn counter_page() -> PhilJsHtml {
    render_document("Counter | LiveView", || view! {
        <div id="app" data-phx-main="true" data-phx-session="counter">
            <p>"Loading..."</p>
        </div>
        <script src="/static/liveview.js" />
    })
}

// Counter WebSocket handler
async fn counter_ws(ws: WebSocketUpgrade) -> Response {
    let socket = LiveViewSocket::new(CounterLiveView::new());
    socket.upgrade(ws).await
}

// Chat page
async fn chat_page() -> PhilJsHtml {
    render_document("Chat | LiveView", || view! {
        <div id="app" data-phx-main="true" data-phx-session="chat">
            <p>"Loading..."</p>
        </div>
        <script src="/static/liveview.js" />
    })
}

// Chat WebSocket handler
async fn chat_ws(
    ws: WebSocketUpgrade,
    axum::extract::State(state): axum::extract::State<AppStateWithBroadcast>,
) -> Response {
    let socket = LiveViewSocket::new(ChatRoomLiveView::new(state.broadcast.clone()));
    socket.upgrade(ws).await
}

#[derive(Clone)]
struct AppStateWithBroadcast {
    broadcast: Arc<BroadcastChannel>,
    presence: Arc<PresenceTracker>,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    // Create broadcast channel and presence tracker
    let state = AppStateWithBroadcast {
        broadcast: Arc::new(BroadcastChannel::new(1024)),
        presence: Arc::new(PresenceTracker::new()),
    };

    // Build router
    let app = Router::new()
        // Pages
        .route("/", get(index))
        .route("/counter", get(counter_page))
        .route("/chat", get(chat_page))
        // WebSocket endpoints
        .route("/ws/counter", get(counter_ws))
        .route("/ws/chat", get(chat_ws))
        // Middleware
        .layer(PhilJsLayer::new())
        .layer(TracingLayer::new())
        .with_state(state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("LiveView server running at http://localhost:3000");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
