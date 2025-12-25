//! LiveView Example for PhilJS Poem
//!
//! This example demonstrates real-time updates using WebSockets with Poem.
//!
//! Run with: cargo run --example liveview --features websocket

use poem::{
    handler,
    web::{Html, websocket::{WebSocket, WebSocketStream}},
    Route, Server, EndpointExt,
    listener::TcpListener,
};
use philjs_poem::prelude::*;
use futures_util::{StreamExt, SinkExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use parking_lot::RwLock;

/// LiveView message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
enum LiveViewMessage {
    Event { name: String, payload: serde_json::Value },
    Render { html: String },
    Patch { ops: Vec<PatchOp> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "op")]
enum PatchOp {
    Replace { target: String, html: String },
    SetAttribute { target: String, name: String, value: String },
}

/// Counter component state
struct CounterState {
    count: i32,
    step: i32,
}

impl CounterState {
    fn new() -> Self {
        Self { count: 0, step: 1 }
    }

    fn render(&self) -> String {
        format!(
            r#"<div class="counter" id="counter">
                <h1>LiveView Counter</h1>
                <div class="display">
                    <button id="dec" phx-click="decrement">-{}</button>
                    <span class="count">{}</span>
                    <button id="inc" phx-click="increment">+{}</button>
                </div>
                <div class="controls">
                    <label>
                        Step:
                        <input type="number" value="{}" phx-change="set_step" />
                    </label>
                    <button phx-click="reset">Reset</button>
                </div>
            </div>"#,
            self.step, self.count, self.step, self.step
        )
    }

    fn handle_event(&mut self, event: &str, payload: &serde_json::Value) -> bool {
        match event {
            "increment" => {
                self.count += self.step;
                true
            }
            "decrement" => {
                self.count -= self.step;
                true
            }
            "set_step" => {
                if let Some(step) = payload.get("value").and_then(|v| v.as_i64()) {
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

/// Home page handler
#[handler]
async fn index() -> Html<String> {
    let html = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhilJS Poem LiveView</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #1a1a2e;
            color: #eee;
        }
        h1 { color: #00d4ff; }
        a { color: #00d4ff; }
        ul { line-height: 2; }
    </style>
</head>
<body>
    <h1>PhilJS Poem LiveView Examples</h1>
    <p>Real-time, interactive applications with WebSockets.</p>
    <ul>
        <li><a href="/counter">Counter Demo</a> - Interactive counter with LiveView</li>
        <li><a href="/todos">Todo List Demo</a> - Real-time todo list</li>
    </ul>
</body>
</html>"#;
    Html(html.to_string())
}

/// Counter page
#[handler]
async fn counter_page() -> Html<String> {
    let html = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Counter | PhilJS LiveView</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #1a1a2e;
            color: #eee;
        }
        h1 { color: #00d4ff; text-align: center; }
        .counter { text-align: center; padding: 2rem; }
        .display { display: flex; justify-content: center; align-items: center; gap: 1rem; margin: 2rem 0; }
        .count { font-size: 4rem; font-weight: bold; color: #00d4ff; min-width: 120px; }
        button {
            padding: 1rem 2rem;
            font-size: 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.1s;
        }
        button:hover { transform: scale(1.05); }
        button:active { transform: scale(0.95); }
        #dec { background: #ff6b6b; color: white; }
        #inc { background: #51cf66; color: white; }
        .controls { margin-top: 2rem; }
        .controls label { margin-right: 1rem; }
        .controls input { padding: 0.5rem; width: 80px; }
        .controls button { background: #666; color: white; padding: 0.5rem 1rem; font-size: 1rem; }
        a { color: #00d4ff; display: block; text-align: center; margin-top: 2rem; }
    </style>
</head>
<body>
    <div id="liveview-root">
        <div class="counter">
            <p>Connecting to LiveView...</p>
        </div>
    </div>
    <a href="/">Back to Home</a>

    <script>
        const ws = new WebSocket(`ws://${window.location.host}/ws/counter`);

        ws.onopen = () => {
            console.log('LiveView connected');
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'Render') {
                document.getElementById('liveview-root').innerHTML = msg.html;
                attachEventHandlers();
            }
        };

        ws.onclose = () => {
            console.log('LiveView disconnected');
            document.getElementById('liveview-root').innerHTML =
                '<p style="color: #ff6b6b;">Disconnected. Refresh to reconnect.</p>';
        };

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
                    ws.send(JSON.stringify({
                        type: 'Event',
                        name: el.getAttribute('phx-change'),
                        payload: { value: parseInt(e.target.value) || 0 }
                    }));
                };
            });
        }
    </script>
</body>
</html>"#;
    Html(html.to_string())
}

/// Counter WebSocket handler
#[handler]
async fn counter_ws(ws: WebSocket) -> impl poem::IntoResponse {
    ws.on_upgrade(|socket| async move {
        handle_counter_socket(socket).await
    })
}

async fn handle_counter_socket(socket: WebSocketStream) {
    let (mut sender, mut receiver) = socket.split();
    let state = Arc::new(RwLock::new(CounterState::new()));

    // Send initial render
    {
        let s = state.read();
        let msg = LiveViewMessage::Render { html: s.render() };
        if let Ok(json) = serde_json::to_string(&msg) {
            let _ = sender.send(poem::web::websocket::Message::Text(json)).await;
        }
    }

    // Handle incoming events
    while let Some(Ok(msg)) = receiver.next().await {
        if let poem::web::websocket::Message::Text(text) = msg {
            if let Ok(LiveViewMessage::Event { name, payload }) =
                serde_json::from_str::<LiveViewMessage>(&text)
            {
                let changed = {
                    let mut s = state.write();
                    s.handle_event(&name, &payload)
                };

                if changed {
                    let s = state.read();
                    let msg = LiveViewMessage::Render { html: s.render() };
                    if let Ok(json) = serde_json::to_string(&msg) {
                        let _ = sender.send(poem::web::websocket::Message::Text(json)).await;
                    }
                }
            }
        }
    }
}

/// Todo list state
struct TodoState {
    todos: Vec<Todo>,
    next_id: u32,
}

#[derive(Clone, Serialize)]
struct Todo {
    id: u32,
    text: String,
    completed: bool,
}

impl TodoState {
    fn new() -> Self {
        Self {
            todos: vec![
                Todo { id: 1, text: "Learn PhilJS".to_string(), completed: false },
                Todo { id: 2, text: "Build with Poem".to_string(), completed: false },
            ],
            next_id: 3,
        }
    }

    fn render(&self) -> String {
        let todos_html: String = self.todos.iter().map(|todo| {
            let checked = if todo.completed { "checked" } else { "" };
            let class = if todo.completed { "completed" } else { "" };
            format!(
                r#"<li class="todo-item {}">
                    <input type="checkbox" {} phx-click="toggle" data-id="{}">
                    <span>{}</span>
                    <button phx-click="delete" data-id="{}" class="delete">x</button>
                </li>"#,
                class, checked, todo.id, todo.text, todo.id
            )
        }).collect();

        let active = self.todos.iter().filter(|t| !t.completed).count();
        let completed = self.todos.iter().filter(|t| t.completed).count();

        format!(
            r#"<div class="todo-app">
                <h1>Todo List</h1>
                <form phx-submit="add">
                    <input type="text" name="text" placeholder="What needs to be done?" />
                    <button type="submit">Add</button>
                </form>
                <ul class="todo-list">{}</ul>
                <footer>
                    <span>{} active, {} completed</span>
                    <button phx-click="clear_completed">Clear completed</button>
                </footer>
            </div>"#,
            todos_html, active, completed
        )
    }

    fn handle_event(&mut self, event: &str, payload: &serde_json::Value) -> bool {
        match event {
            "add" => {
                if let Some(text) = payload.get("text").and_then(|v| v.as_str()) {
                    if !text.is_empty() {
                        self.todos.push(Todo {
                            id: self.next_id,
                            text: text.to_string(),
                            completed: false,
                        });
                        self.next_id += 1;
                        return true;
                    }
                }
                false
            }
            "toggle" => {
                if let Some(id) = payload.get("id").and_then(|v| v.as_u64()) {
                    if let Some(todo) = self.todos.iter_mut().find(|t| t.id == id as u32) {
                        todo.completed = !todo.completed;
                        return true;
                    }
                }
                false
            }
            "delete" => {
                if let Some(id) = payload.get("id").and_then(|v| v.as_u64()) {
                    self.todos.retain(|t| t.id != id as u32);
                    return true;
                }
                false
            }
            "clear_completed" => {
                self.todos.retain(|t| !t.completed);
                true
            }
            _ => false
        }
    }
}

/// Todo page
#[handler]
async fn todo_page() -> Html<String> {
    let html = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List | PhilJS LiveView</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 2rem;
            background: #1a1a2e;
            color: #eee;
        }
        h1 { color: #00d4ff; text-align: center; }
        .todo-app { background: #16213e; padding: 2rem; border-radius: 12px; }
        form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        form input { flex: 1; padding: 0.75rem; border: none; border-radius: 4px; }
        form button { padding: 0.75rem 1.5rem; background: #00d4ff; border: none; border-radius: 4px; cursor: pointer; }
        .todo-list { list-style: none; padding: 0; }
        .todo-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; border-bottom: 1px solid #333; }
        .todo-item.completed span { text-decoration: line-through; opacity: 0.5; }
        .todo-item span { flex: 1; }
        .delete { background: #ff6b6b; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; }
        footer { display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #333; }
        footer button { background: #666; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
        a { color: #00d4ff; display: block; text-align: center; margin-top: 2rem; }
    </style>
</head>
<body>
    <div id="liveview-root">
        <div class="todo-app">
            <p>Connecting to LiveView...</p>
        </div>
    </div>
    <a href="/">Back to Home</a>

    <script>
        const ws = new WebSocket(`ws://${window.location.host}/ws/todos`);

        ws.onopen = () => console.log('LiveView connected');
        ws.onclose = () => {
            document.getElementById('liveview-root').innerHTML =
                '<p style="color: #ff6b6b;">Disconnected. Refresh to reconnect.</p>';
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'Render') {
                document.getElementById('liveview-root').innerHTML = msg.html;
                attachEventHandlers();
            }
        };

        function attachEventHandlers() {
            document.querySelectorAll('[phx-click]').forEach(el => {
                el.onclick = () => {
                    const id = el.dataset.id ? parseInt(el.dataset.id) : null;
                    ws.send(JSON.stringify({
                        type: 'Event',
                        name: el.getAttribute('phx-click'),
                        payload: { id }
                    }));
                };
            });

            document.querySelectorAll('[phx-submit]').forEach(form => {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    const input = form.querySelector('input[name="text"]');
                    ws.send(JSON.stringify({
                        type: 'Event',
                        name: form.getAttribute('phx-submit'),
                        payload: { text: input.value }
                    }));
                    input.value = '';
                };
            });
        }
    </script>
</body>
</html>"#;
    Html(html.to_string())
}

/// Todo WebSocket handler
#[handler]
async fn todo_ws(ws: WebSocket) -> impl poem::IntoResponse {
    ws.on_upgrade(|socket| async move {
        handle_todo_socket(socket).await
    })
}

async fn handle_todo_socket(socket: WebSocketStream) {
    let (mut sender, mut receiver) = socket.split();
    let state = Arc::new(RwLock::new(TodoState::new()));

    // Send initial render
    {
        let s = state.read();
        let msg = LiveViewMessage::Render { html: s.render() };
        if let Ok(json) = serde_json::to_string(&msg) {
            let _ = sender.send(poem::web::websocket::Message::Text(json)).await;
        }
    }

    // Handle incoming events
    while let Some(Ok(msg)) = receiver.next().await {
        if let poem::web::websocket::Message::Text(text) = msg {
            if let Ok(LiveViewMessage::Event { name, payload }) =
                serde_json::from_str::<LiveViewMessage>(&text)
            {
                let changed = {
                    let mut s = state.write();
                    s.handle_event(&name, &payload)
                };

                if changed {
                    let s = state.read();
                    let msg = LiveViewMessage::Render { html: s.render() };
                    if let Ok(json) = serde_json::to_string(&msg) {
                        let _ = sender.send(poem::web::websocket::Message::Text(json)).await;
                    }
                }
            }
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    // Build routes
    let app = Route::new()
        .at("/", poem::get(index))
        .at("/counter", poem::get(counter_page))
        .at("/ws/counter", poem::get(counter_ws))
        .at("/todos", poem::get(todo_page))
        .at("/ws/todos", poem::get(todo_ws));

    // Start server
    println!("LiveView server running at http://localhost:3000");

    Server::new(TcpListener::bind("0.0.0.0:3000"))
        .run(app)
        .await
}
