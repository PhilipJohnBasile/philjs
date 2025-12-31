# Local State

Local state is stored in signals inside a component.

```rust
use philjs::prelude::*;

#[component]
fn Toggle() -> impl IntoView {
    let on = signal!(false);

    view! {
        <button on:click=move |_| on.update(|v| *v = !*v)>
            {move || if on.get() { "On" } else { "Off" }}
        </button>
    }
}
```

Signals are scoped to the component. When the component is dropped, the signal is released.
