# Testing

PhilJS Rust apps can be tested in both native and WASM environments.

## Unit Tests

```rust
#[test]
fn sum_works() {
    assert_eq!(2 + 2, 4);
}
```

## SSR Tests

```rust
use philjs::ssr::render_to_string;
use philjs::prelude::*;

#[test]
fn renders_html() {
    let html = render_to_string(|| view! { <p>"Hi"</p> });
    assert!(html.contains("Hi"));
}
```

## WASM Tests

Add `wasm-bindgen-test`:

```toml
[dev-dependencies]
wasm-bindgen-test = "0.3"
```

```rust
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn wasm_it_works() {
    assert_eq!(1 + 1, 2);
}
```

Run with:

```bash
wasm-pack test --headless --firefox
```
