# Testing

PhilJS Rust supports unit tests and browser tests.

## Unit tests

```bash
cargo test
```

## WASM tests

```bash
wasm-pack test --headless --firefox
```

## Example

```rust
use philjs::prelude::*;

#[test]
fn memo_updates() {
    let count = signal!(1);
    let doubled = memo!(count.get() * 2);
    assert_eq!(doubled.get(), 2);
}
```
