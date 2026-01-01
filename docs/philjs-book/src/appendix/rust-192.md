# Rust 1.92 Quickstart (Appendix)

A concise on-ramp to Rust 1.92 for PhilJS developers. This appendix focuses on the minimum you need for tooling, small services, and WASM helpers. The deep Rust coverage lives in the separate Rust with PhilJS book.

## Table of contents

- [Toolchain and Cargo](#rust-toolchain)
- [Rust basics](#rust-basics)
- [Traits and lifetimes](#rust-traits)
- [Ownership and borrowing](#rust-ownership)
- [Error handling](#rust-errors)
- [WASM interop](#rust-wasm)
- [Testing and linting](#rust-testing)
- [Practical crates](#rust-crates)
- [Command quick reference](#rust-commands)

<a id="rust-toolchain"></a>
## Toolchain and Cargo

Install Rust with `rustup` and pin to 1.92:

```bash
rustup default 1.92.0
rustup component add rustfmt clippy
```

Create a new project:

```bash
cargo new my_tool
cd my_tool
cargo run
```

Project layout:

```
my_tool/
|-- Cargo.toml
`-- src/
    `-- main.rs
```

<a id="rust-basics"></a>
## Rust basics

Rust is strict about mutability and ownership.

```rust
fn main() {
    let name = String::from("Phil");
    let mut count = 0;
    count += 1;
    println!("{name} {count}");
}
```

Structs and enums:

```rust
struct User {
    id: String,
    email: String,
}

enum LoadState {
    Idle,
    Loading,
    Loaded(User),
    Error(String),
}
```

Pattern matching:

```rust
match state {
    LoadState::Loaded(user) => println!("{}", user.email),
    LoadState::Error(err) => eprintln!("{err}"),
    _ => {}
}
```

<a id="rust-traits"></a>
## Traits and lifetimes

Traits describe shared behavior. Most Rust libraries expose traits so you can write generic functions.
```rust
trait Identified {
    fn id(&self) -> &str;
}

impl Identified for User {
    fn id(&self) -> &str { &self.id }
}
```

Lifetimes describe how long references are valid. In many cases they are elided automatically. When you return references, you may need an explicit lifetime:

```rust
fn first<'a>(items: &'a [String]) -> Option<&'a String> {
    items.first()
}
```

<a id="rust-ownership"></a>
## Ownership and borrowing

Rust enforces that each value has a single owner. References (`&T` or `&mut T`) borrow without taking ownership.

```rust
fn len(s: &String) -> usize {
    s.len()
}
```

If you need to mutate, borrow mutably:

```rust
fn push_exclamation(s: &mut String) {
    s.push('!');
}
```

**Visual:** Ownership and borrowing

![Rust ownership diagram](../../visuals/rust-ownership.svg "Ownership and borrowing")

Rules to remember:

- Many immutable borrows OR one mutable borrow at a time.
- A mutable borrow prevents all other borrows until it ends.
- Values are dropped when they go out of scope.

<a id="rust-errors"></a>
## Error handling

Use `Result<T, E>` and the `?` operator for propagation.

```rust
use std::fs;

fn read_config(path: &str) -> Result<String, std::io::Error> {
    let content = fs::read_to_string(path)?;
    Ok(content)
}
```

Use `thiserror` for structured errors in libraries, and `anyhow` for simple tools.

<a id="rust-wasm"></a>
## WASM interop

For simple JS interop, use `wasm-bindgen`.

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

Build:

```bash
cargo build --release --target wasm32-unknown-unknown
wasm-bindgen --target web --out-dir pkg target/wasm32-unknown-unknown/release/my_tool.wasm
```

Keep exported functions simple: numbers, strings, and typed arrays.

<a id="rust-testing"></a>
## Testing and linting

Run tests and lint:

```bash
cargo test
cargo clippy
cargo fmt
```

Use `#[cfg(test)]` modules for unit tests and `tests/` for integration tests.

<a id="rust-crates"></a>
## Practical crates

Common picks for PhilJS projects:

- `serde` and `serde_json` for serialization
- `reqwest` for HTTP (native)
- `wasm-bindgen`, `js-sys`, `web-sys` for WASM
- `thiserror` or `anyhow` for errors
- `tracing` for logs and spans

<a id="rust-commands"></a>
## Command quick reference

```bash
rustup update
cargo build --release
cargo test
cargo clippy
cargo fmt
```

## Links

- [The Rust Book](https://doc.rust-lang.org/book/)
- [Rust By Example](https://doc.rust-lang.org/rust-by-example/)
- [wasm-bindgen Guide](https://rustwasm.github.io/docs/wasm-bindgen/)


