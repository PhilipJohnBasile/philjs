//! Minimal Template
//!
//! Bare-bones starter for learning or custom setups.

use std::collections::HashMap;

/// Generate minimal template files
pub fn generate() -> HashMap<String, String> {
    let mut files = HashMap::new();

    // Cargo.toml
    files.insert(
        "Cargo.toml".to_string(),
        r#"[package]
name = "{{name}}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
philjs = "2.0"
wasm-bindgen = "0.2"
console_error_panic_hook = "0.1"

[profile.release]
opt-level = "z"
lto = true
"#
        .to_string(),
    );

    // src/lib.rs
    files.insert(
        "src/lib.rs".to_string(),
        r#"//! {{name}} - Minimal PhilJS App

use philjs::prelude::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
    mount_to_body(App);
}

#[component]
fn App() -> impl IntoView {
    let (count, set_count) = create_signal(0);

    view! {
        <main style="font-family: system-ui; text-align: center; padding: 2rem;">
            <h1>"{{name}}"</h1>
            <p>"Count: " {count}</p>
            <button on:click=move |_| set_count.update(|n| *n += 1)>
                "Click me"
            </button>
        </main>
    }
}
"#
        .to_string(),
    );

    // index.html
    files.insert(
        "index.html".to_string(),
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}}</title>
</head>
<body>
    <script type="module">
        import init from './pkg/{{name}}.js';
        init();
    </script>
</body>
</html>
"#
        .to_string(),
    );

    // README.md
    files.insert(
        "README.md".to_string(),
        r#"# {{name}}

Minimal PhilJS application.

## Quick Start

```bash
# Build
cargo philjs build

# Or build with wasm-pack directly
wasm-pack build --target web

# Serve (using any static server)
python -m http.server
# or
npx serve
```

## Next Steps

- Add components in `src/`
- Add styles with CSS
- Add routing with philjs-router
"#
        .to_string(),
    );

    files
}
