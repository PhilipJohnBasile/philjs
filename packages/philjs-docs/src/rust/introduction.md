# Rust Introduction

PhilJS provides first-class Rust support via WebAssembly.

## Why Rust?

- **Performance**: Near-native speed in the browser
- **Type Safety**: Catch bugs at compile time
- **Memory Safety**: No null pointer exceptions
- **Shared Logic**: Use the same code on server and client

## Quick Example

\`\`\`rust
use philjs_rust::prelude::*;

#[component]
fn Counter() -> impl IntoView {
    let count = signal(0);
    
    view! {
        <button on:click=move |_| count.set(count.get() + 1)>
            "Count: " {count}
        </button>
    }
}
\`\`\`

## Setup

\`\`\`bash
# Add to Cargo.toml
cargo add philjs-rust
cargo add philjs-macros

# Build for WASM
cargo build --target wasm32-unknown-unknown
\`\`\`

## Interop with JavaScript

Rust and JavaScript signals can talk to each other:

\`\`\`rust
use philjs_rust::js_interop::*;

// Read a JS signal from Rust
let js_count = js_signal::<i32>("count");

// Create a Rust signal accessible from JS  
#[wasm_bindgen]
pub fn create_counter() -> JsSignal {
    let count = signal(0);
    export_signal(count)
}
\`\`\`
