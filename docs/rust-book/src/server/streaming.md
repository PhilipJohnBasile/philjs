# Streaming

Streaming sends HTML in chunks so the browser can render the shell immediately.

## Configure Streaming

```rust
use philjs::prelude::*;
use philjs::ssr::{render_to_stream_async, StreamingConfig};

let config = StreamingConfig {
    flush_on_suspense: true,
    chunk_size: 8192,
    immediate_shell: true,
};

let stream = render_to_stream_async(|| view! { <App /> }, config);
```

## Integrate with a Response

Use your framework to return the stream. For example, in Axum you can convert each chunk to a body.

Streaming works best with Suspense boundaries, so fallbacks render immediately while data loads.
