//! LiveView Example for PhilJS Actix
//!
//! This example demonstrates real-time updates using WebSockets.
//!
//! Run with: cargo run --example liveview --features websocket

use actix_web::{web, App, HttpServer, HttpRequest, HttpResponse, Responder};
use actix_web_actors::ws;
use actix::{Actor, StreamHandler, Handler, Message, AsyncContext, ActorContext};
use philjs_actix::prelude::*;
use philjs_actix::websocket::{LiveViewSocket, WebSocketHandler};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

/// LiveView message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum LiveMessage {
    Event { name: String, payload: serde_json::Value },
    Render { html: String },
    Patch { target: String, html: String },
    Redirect { to: String },
}

/// Counter component state
#[derive(Default)]
pub struct CounterComponent {
    count: i32,
    step: i32,
}

impl CounterComponent {
    pub fn new() -> Self {
        Self { count: 0, step: 1 }
    }

    pub fn render(&self) -> String {
        format!(
            r#"<div class="counter-container" id="counter">
                <h1>LiveView Counter</h1>
                <div class="counter-display">
                    <button class="btn btn-danger" phx-click="decrement">-{}</button>
                    <span class="count-value">{}</span>
                    <button class="btn btn-success" phx-click="increment">+{}</button>
                </div>
                <div class="counter-controls">
                    <label>
                        Step size:
                        <input type="number" value="{}" phx-change="set_step" name="step" />
                    </label>
                    <button class="btn btn-secondary" phx-click="reset">Reset</button>
                </div>
                <div class="counter-info">
                    <p>Current count: <strong>{}</strong></p>
                    <p>Step: <strong>{}</strong></p>
                </div>
            </div>"#,
            self.step, self.count, self.step, self.step, self.count, self.step
        )
    }

    pub fn handle_event(&mut self, name: &str, payload: &serde_json::Value) -> bool {
        match name {
            "increment" => {
                self.count += self.step;
                true
            }
            "decrement" => {
                self.count -= self.step;
                true
            }
            "set_step" => {
                if let Some(step) = payload.get("step").and_then(|v| v.as_i64()) {
                    self.step = step as i32;
                    true
                } else {
                    false
                }
            }
            "reset" => {
                self.count = 0;
                true
            }
            _ => false
        }
    }
}

/// WebSocket actor for counter
pub struct CounterWebSocket {
    component: CounterComponent,
}

impl CounterWebSocket {
    pub fn new() -> Self {
        Self {
            component: CounterComponent::new(),
        }
    }
}

impl Actor for CounterWebSocket {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        // Send initial render
        let html = self.component.render();
        let msg = LiveMessage::Render { html };
        if let Ok(json) = serde_json::to_string(&msg) {
            ctx.text(json);
        }
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for CounterWebSocket {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Text(text)) => {
                if let Ok(LiveMessage::Event { name, payload }) =
                    serde_json::from_str::<LiveMessage>(&text)
                {
                    if self.component.handle_event(&name, &payload) {
                        let html = self.component.render();
                        let msg = LiveMessage::Render { html };
                        if let Ok(json) = serde_json::to_string(&msg) {
                            ctx.text(json);
                        }
                    }
                }
            }
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => {}
        }
    }
}

/// Chat room with presence tracking
#[derive(Clone, Serialize)]
struct ChatMessage {
    user: String,
    text: String,
    timestamp: u64,
}

struct ChatRoom {
    messages: Vec<ChatMessage>,
    users: HashMap<String, String>, // id -> username
}

impl ChatRoom {
    fn new() -> Self {
        Self {
            messages: Vec::new(),
            users: HashMap::new(),
        }
    }
}

type SharedChatRoom = Arc<Mutex<ChatRoom>>;

/// Home page
async fn index() -> HttpResponse {
    render_document("LiveView Examples | PhilJS Actix", || view! {
        <div class="container">
            <h1>"PhilJS Actix LiveView Examples"</h1>
            <p>"Real-time, interactive applications powered by WebSockets."</p>
            <ul class="demo-list">
                <li>
                    <a href="/counter">"Counter Demo"</a>
                    <p>"An interactive counter with increment, decrement, and configurable step."</p>
                </li>
                <li>
                    <a href="/presence">"Presence Demo"</a>
                    <p>"See who's currently viewing this page in real-time."</p>
                </li>
            </ul>
        </div>
    })
}

/// Counter page
async fn counter_page() -> HttpResponse {
    let html = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Counter | PhilJS LiveView</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #eee;
            min-height: 100vh;
        }
        h1 { color: #00d4ff; text-align: center; }
        .counter-container { text-align: center; padding: 2rem; background: rgba(255,255,255,0.05); border-radius: 16px; }
        .counter-display { display: flex; justify-content: center; align-items: center; gap: 1rem; margin: 2rem 0; }
        .count-value { font-size: 4rem; font-weight: bold; color: #00d4ff; min-width: 120px; }
        .btn { padding: 1rem 2rem; font-size: 1.5rem; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .btn:hover { transform: scale(1.05); }
        .btn:active { transform: scale(0.95); }
        .btn-success { background: #51cf66; color: white; }
        .btn-danger { background: #ff6b6b; color: white; }
        .btn-secondary { background: #666; color: white; padding: 0.5rem 1rem; font-size: 1rem; }
        .counter-controls { margin-top: 2rem; }
        .counter-controls label { margin-right: 1rem; }
        .counter-controls input { padding: 0.5rem; width: 80px; border-radius: 4px; border: 1px solid #444; background: #2a2a4e; color: #fff; }
        .counter-info { margin-top: 2rem; opacity: 0.7; }
        a { color: #00d4ff; display: block; text-align: center; margin-top: 2rem; }
        .connection-status { position: fixed; top: 1rem; right: 1rem; padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.8rem; }
        .connected { background: #51cf66; color: white; }
        .disconnected { background: #ff6b6b; color: white; }
    </style>
</head>
<body>
    <div id="connection-status" class="connection-status disconnected">Connecting...</div>
    <div id="liveview-root">
        <div class="counter-container">
            <p>Connecting to LiveView server...</p>
        </div>
    </div>
    <a href="/">Back to Home</a>

    <script>
        let ws;
        const statusEl = document.getElementById('connection-status');

        function connect() {
            ws = new WebSocket(`ws://${window.location.host}/ws/counter`);

            ws.onopen = () => {
                console.log('LiveView connected');
                statusEl.textContent = 'Connected';
                statusEl.className = 'connection-status connected';
            };

            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.type === 'Render') {
                    document.getElementById('liveview-root').innerHTML = msg.html;
                    attachEventHandlers();
                } else if (msg.type === 'Patch') {
                    const target = document.querySelector(msg.target);
                    if (target) target.innerHTML = msg.html;
                }
            };

            ws.onclose = () => {
                console.log('LiveView disconnected');
                statusEl.textContent = 'Disconnected - Reconnecting...';
                statusEl.className = 'connection-status disconnected';
                setTimeout(connect, 2000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }

        function attachEventHandlers() {
            document.querySelectorAll('[phx-click]').forEach(el => {
                el.onclick = () => {
                    ws.send(JSON.stringify({
                        type: 'Event',
                        name: el.getAttribute('phx-click'),
                        payload: {}
                    }));
                };
            });

            document.querySelectorAll('[phx-change]').forEach(el => {
                el.onchange = (e) => {
                    const name = el.getAttribute('name');
                    const payload = {};
                    payload[name] = parseInt(e.target.value) || 0;
                    ws.send(JSON.stringify({
                        type: 'Event',
                        name: el.getAttribute('phx-change'),
                        payload
                    }));
                };
            });
        }

        connect();
    </script>
</body>
</html>"#;

    HttpResponse::Ok()
        .content_type("text/html")
        .body(html)
}

/// Counter WebSocket handler
async fn counter_ws(req: HttpRequest, stream: web::Payload) -> Result<HttpResponse, actix_web::Error> {
    ws::start(CounterWebSocket::new(), &req, stream)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    println!("LiveView server running at http://localhost:8080");
    println!("Visit http://localhost:8080/counter for the counter demo");

    HttpServer::new(move || {
        App::new()
            .wrap(actix_web::middleware::Logger::default())
            // Pages
            .route("/", web::get().to(index))
            .route("/counter", web::get().to(counter_page))
            // WebSocket
            .route("/ws/counter", web::get().to(counter_ws))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
