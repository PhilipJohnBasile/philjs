# API Reference

PhilJS Rust exposes a small, stable surface area.

## Core modules

- `reactive` - signals, memos, effects
- `view` - `view!` macro and view types
- `dom` - mount and hydration helpers
- `ssr` - render to string/stream
- `router` - route helpers
- `server` - server functions
- `store` - structured state

## Example imports

```rust
use philjs::prelude::*;
use philjs::ssr::render_to_string;
use philjs::server::server_fn;
```
