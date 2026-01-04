# Fragments

Fragments let you return multiple siblings without an extra wrapper.

```rust
use philjs::prelude::*;

view! {
    <header>"Header"</header>
    <main>"Main"</main>
    <footer>"Footer"</footer>
}
```

You can also construct a fragment explicitly:

```rust
use philjs::prelude::*;

let fragment = Fragment::new(vec![
    Text::new("Header").into_view(),
    Text::new("Main").into_view(),
]);
```
