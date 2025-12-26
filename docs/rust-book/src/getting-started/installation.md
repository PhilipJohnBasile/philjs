# Installation

## Prerequisites

1. **Rust** (1.70+)
   \`\`\`bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   \`\`\`

2. **wasm-pack**
   \`\`\`bash
   cargo install wasm-pack
   \`\`\`

3. **Node.js** (18+) for the dev server

## Create a New Project

\`\`\`bash
cargo new my-philjs-app
cd my-philjs-app
\`\`\`

## Add Dependencies

\`\`\`toml
# Cargo.toml
[package]
name = "my-philjs-app"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
philjs-rust = "0.1"
philjs-macros = "0.1"
wasm-bindgen = "0.2"
web-sys = { version = "0.3", features = ["Document", "Element", "Window"] }

[profile.release]
lto = true
opt-level = "z"
\`\`\`

## Project Structure

\`\`\`
my-philjs-app/
├── Cargo.toml
├── src/
│   ├── lib.rs          # Main entry
│   ├── components/     # Your components
│   └── pages/          # Route pages
├── index.html
└── pkg/                # WASM output
\`\`\`

## Build and Run

\`\`\`bash
wasm-pack build --target web
npx serve .
\`\`\`

Open http://localhost:3000
