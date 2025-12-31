# Hello World

This chapter walks through your first PhilJS Rust component and a minimal HTML shell.

## 1. Write the App

Create `src/lib.rs`:

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
    mount_to_body(|| view! { <App /> });
}
```

## 2. Add an HTML Shell

Create `index.html` at the project root:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PhilJS Rust Hello</title>
  </head>
  <body>
    <script type="module">
      import init from "./pkg/my_philjs_app.js";
      init();
    </script>
  </body>
</html>
```

## 3. Build and Run

```bash
wasm-pack build --target web
python -m http.server 3000
```

Open http://localhost:3000 to see your app.
