# Debugging

Use Rust logging and browser devtools to debug PhilJS applications.

## Console Logging

```rust
use web_sys::console;

console::log_1(&"mounted".into());
```

## Error Boundaries

Wrap risky sections in error boundaries when rendering:

```rust
use philjs::view::ErrorBoundary;

let view = ErrorBoundary::new(
    || view! { <p>"Something went wrong"</p> },
    || view! { <App /> },
)
.render();
```

## Server Logs

For SSR, use `tracing` or `log` for structured output. Pair with `RUST_LOG=info` during development.
