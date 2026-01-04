# Hello World

This chapter builds a minimal PhilJS Rust component and mounts it in the browser.

## 1. Create the component

`src/lib.rs`

```rust
use wasm_bindgen::prelude::*;
use philjs::prelude::*;

#[component]
fn App() -> impl IntoView {
    let name = signal!("PhilJS".to_string());

    view! {
        <main>
            <h1>"Hello " {name}</h1>
            <p>"Rust + PhilJS running in the browser."</p>
        </main>
    }
}

#[wasm_bindgen(start)]
pub fn main() {
    mount(|| view! { <App /> });
}
```

## 2. Run the dev server

```bash
cargo philjs dev
```

The CLI handles bundling and the HTML shell. Open the local URL printed by the dev server.
