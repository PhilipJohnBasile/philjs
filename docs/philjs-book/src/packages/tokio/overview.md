# @philjs/tokio

Tokio runtime integration for PhilJS async operations, timers, and concurrent task management.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs-tokio = "0.1"
tokio = { version = "1", features = ["full"] }
```

## Overview

`@philjs/tokio` provides Tokio integration for PhilJS:

- **Async Runtime**: Full Tokio runtime integration
- **Reactive Timers**: Signal-based timers and intervals
- **Task Spawning**: Concurrent task management
- **Channels**: Async communication between components
- **File I/O**: Async file operations
- **Network**: TCP/UDP utilities

## Reactive Timers

```rust
use philjs_tokio::{use_interval, use_timeout, use_debounce};

#[component]
fn Timer() -> impl IntoView {
    let count = signal!(0);

    // Increment every second
    use_interval(Duration::from_secs(1), move || {
        count.update(|c| *c += 1);
    });

    view! { <span>{count}</span> }
}
```

## Async Resources

```rust
use philjs_tokio::use_async;

#[component]
fn UserProfile(id: u64) -> impl IntoView {
    let user = use_async(move || async move {
        fetch_user(id).await
    });

    view! {
        <Suspense fallback=|| "Loading...">
            {move || user.get().map(|u| view! { <Profile user=u /> })}
        </Suspense>
    }
}
```

## Task Spawning

```rust
use philjs_tokio::{spawn, spawn_blocking};

// Spawn async task
spawn(async {
    heavy_async_work().await;
});

// Spawn blocking task
spawn_blocking(|| {
    cpu_intensive_work();
});
```

## Channels

```rust
use philjs_tokio::{channel, broadcast};

// MPSC channel
let (tx, rx) = channel::<Message>(100);

// Broadcast channel
let (tx, rx) = broadcast::<Event>(100);
```

## See Also

- [@philjs/rust](../rust/overview.md) - Rust framework
- [@philjs/axum](../axum/overview.md) - Axum integration
- [@philjs/realtime](../realtime/overview.md) - Real-time features
