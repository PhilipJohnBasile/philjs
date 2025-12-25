//! LiveView Example for PhilJS Rocket
//!
//! This example demonstrates real-time updates using WebSockets.
//!
//! Run with: cargo run --example liveview --features websocket

use rocket::{get, launch, routes, State};
use rocket_ws::{WebSocket, Channel};
use philjs_rocket::prelude::*;
use philjs_rocket::websocket::{LiveViewSocket, LiveViewHandler, BroadcastManager};
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use parking_lot::RwLock;

// ============================================================================
// LiveView Component: Counter
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CounterState {
    count: i32,
}

impl Default for CounterState {
    fn default() -> Self {
        Self { count: 0 }
    }
}

impl LiveViewHandler for CounterState {
    type State = Self;

    fn mount(&mut self, _socket: &LiveSocket) -> Self::State {
        self.clone()
    }

    fn handle_event(&mut self, event: &LiveViewMessage) {
        match event.event.as_str() {
            "increment" => self.count += 1,
            "decrement" => self.count -= 1,
            "reset" => self.count = 0,
            _ => {}
        }
    }

    fn render(&self) -> String {
        format!(
            r#"
            <div class="counter-live">
                <h2>LiveView Counter</h2>
                <p class="count">{}</p>
                <div class="buttons">
                    <button phx-click="decrement">-</button>
                    <button phx-click="reset">Reset</button>
                    <button phx-click="increment">+</button>
                </div>
            </div>
            "#,
            self.count
        )
    }
}

// ============================================================================
// LiveView Component: Chat
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChatMessage {
    id: String,
    user: String,
    text: String,
    timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChatState {
    messages: Vec<ChatMessage>,
    username: String,
}

impl ChatState {
    fn new(username: String) -> Self {
        Self {
            messages: Vec::new(),
            username,
        }
    }

    fn add_message(&mut self, text: String) {
        let msg = ChatMessage {
            id: uuid::Uuid::new_v4().to_string(),
            user: self.username.clone(),
            text,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };
        self.messages.push(msg);
    }
}

impl LiveViewHandler for ChatState {
    type State = Self;

    fn mount(&mut self, _socket: &LiveSocket) -> Self::State {
        self.clone()
    }

    fn handle_event(&mut self, event: &LiveViewMessage) {
        match event.event.as_str() {
            "send_message" => {
                if let Some(text) = event.payload.get("text").and_then(|v| v.as_str()) {
                    self.add_message(text.to_string());
                }
            }
            "clear" => {
                self.messages.clear();
            }
            _ => {}
        }
    }

    fn render(&self) -> String {
        let messages_html: String = self.messages
            .iter()
            .map(|msg| {
                format!(
                    r#"<div class="chat-message">
                        <span class="user">{}</span>
                        <span class="text">{}</span>
                    </div>"#,
                    msg.user, msg.text
                )
            })
            .collect();

        format!(
            r#"
            <div class="chat-live">
                <h2>LiveView Chat</h2>
                <div class="messages" id="chat-messages">
                    {}
                </div>
                <form phx-submit="send_message">
                    <input type="text" name="text" placeholder="Type a message..."
                           phx-hook="ChatInput" required />
                    <button type="submit">Send</button>
                </form>
                <button phx-click="clear">Clear All</button>
            </div>
            "#,
            messages_html
        )
    }
}

// ============================================================================
// Routes
// ============================================================================

/// Home page with LiveView components
#[get("/")]
fn index() -> PhilJsHtml {
    render_document("LiveView Demo | PhilJS", || view! {
        <div class="container">
            <h1>"PhilJS LiveView Demo"</h1>
            <p>"Real-time updates without page reloads"</p>

            <div class="liveview-container" data-phx-main="true">
                <div id="counter" phx-hook="LiveView" phx-session="counter">
                    "Loading counter..."
                </div>

                <div id="chat" phx-hook="LiveView" phx-session="chat">
                    "Loading chat..."
                </div>
            </div>

            <script type="module" src="/static/liveview.js"></script>
        </div>
    })
}

/// WebSocket endpoint for counter LiveView
#[get("/live/counter")]
async fn counter_ws(ws: WebSocket) -> Channel<'static> {
    let state = CounterState::default();
    let socket = LiveViewSocket::new(state);
    socket.handle(ws).await
}

/// WebSocket endpoint for chat LiveView
#[get("/live/chat")]
async fn chat_ws(ws: WebSocket) -> Channel<'static> {
    let state = ChatState::new("Anonymous".to_string());
    let socket = LiveViewSocket::new(state);
    socket.handle(ws).await
}

/// API to get current state
#[get("/api/counter")]
fn counter_api(state: &State<Arc<RwLock<CounterState>>>) -> PhilJsJson<CounterState> {
    let s = state.read();
    json(s.clone())
}

// ============================================================================
// Main
// ============================================================================

#[launch]
fn rocket() -> _ {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .init();

    // Shared state for API access
    let counter_state = Arc::new(RwLock::new(CounterState::default()));

    // Broadcast manager for real-time updates
    let broadcast = BroadcastManager::new(1024);

    rocket::build()
        .attach(PhilJsSsrFairing::new())
        .attach(PhilJsLiveViewFairing::new())
        .manage(counter_state)
        .manage(broadcast)
        .mount("/", routes![
            index,
            counter_ws,
            chat_ws,
            counter_api,
        ])
}
