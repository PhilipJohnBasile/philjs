# Streaming

Streaming SSR sends HTML chunks as they are ready.

```rust
use philjs::prelude::*;
use philjs::ssr::{render_to_stream_async, StreamingConfig};

let config = StreamingConfig::default();
let stream = render_to_stream_async(|| view! {
    <main>
        <h1>"Streaming"</h1>
    </main>
}, config);
```
