# Lists

Render lists with `For` for keyed updates and stable diffing.

```rust
use philjs::prelude::*;

#[derive(Clone)]
struct Task {
    id: u32,
    title: String,
}

let tasks = signal!(vec![
    Task { id: 1, title: "Write docs".into() },
    Task { id: 2, title: "Ship release".into() },
]);

let list = For::new(
    move || tasks.get(),
    |task| task.id,
    |task| view! { <li>{task.title}</li> },
)
.render();
```

Use `tasks.update` to mutate the list and let the UI update efficiently.
