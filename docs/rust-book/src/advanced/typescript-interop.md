# TypeScript Interop

PhilJS Rust apps often pair with TypeScript for tooling, bundling, and external APIs.

## Expose Rust to TypeScript

Use `wasm-bindgen` to export functions and types.

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn format_price(value: f64) -> String {
    format!("${:.2}", value)
}
```

Run `wasm-pack build --target web`. The generated `pkg/` folder includes TypeScript declarations.

## Use from TypeScript

```ts
import init, { format_price } from "./pkg/my_philjs_app.js";

await init();
console.log(format_price(12.5));
```

## Tips

- Prefer `--target web` for browser builds and `--target bundler` for Vite.
- Keep exported signatures simple for clean type generation.
