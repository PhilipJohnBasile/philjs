# Installation

PhilJS Rust projects use Rust for UI and Node tooling for bundling and dev server workflows.

## Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add the WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-pack
cargo install wasm-pack

# Install the PhilJS Rust CLI
cargo install cargo-philjs
```

## Verify versions

```bash
rustc --version
cargo philjs --version
node --version
```

## Create a new project

```bash
cargo philjs new my-philjs-app --template=spa
cd my-philjs-app
cargo philjs dev
```

## Cargo.toml baseline

```toml
[package]
name = "my-philjs-app"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
philjs = "0.1.0"
wasm-bindgen = "0.2"

[features]
default = ["wasm"]
wasm = ["philjs/wasm"]
ssr = ["philjs/ssr"]
```
