# Hydration

Hydration attaches event handlers and reactive state to server-rendered HTML.

## Server Rendering with Hydration Data

```rust
use philjs::prelude::*;
use philjs::ssr::{render_to_string_with_context, HydrationScript};

let (html, ctx) = render_to_string_with_context(|| view! { <App /> });
let hydration = HydrationScript::new().with_data(ctx);

let document = format!(
    "<!doctype html><body>{}{}{} </body>",
    html,
    hydration.to_html(),
    ctx.data_scripts()
);
```

## Client Hydration

```rust
use philjs::prelude::*;
use philjs::dom::hydrate_to_body;

#[wasm_bindgen(start)]
pub fn main() {
    hydrate_to_body(|| view! { <App /> }, HydrationMode::Auto);
}
```

`HydrationMode::Auto` uses embedded data to reconcile existing DOM with your component tree.
