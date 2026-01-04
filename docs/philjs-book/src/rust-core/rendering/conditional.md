# Conditional Rendering

Use normal Rust control flow inside `view!` blocks.

```rust
use philjs::prelude::*;

let logged_in = signal!(false);

view! {
    <section>
        {
            if logged_in.get() {
                view! { <p>"Welcome back."</p> }
            } else {
                view! { <p>"Please sign in."</p> }
            }
        }
    </section>
}
```
