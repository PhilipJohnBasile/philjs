# Lists

Render lists by mapping into views and collecting into a `Vec`.

```rust
use philjs::prelude::*;

#[derive(Clone)]
struct Task { id: String, title: String }

let tasks = vec![
    Task { id: "1".into(), title: "Ship PhilJS".into() },
    Task { id: "2".into(), title: "Write docs".into() },
];

view! {
    <ul>
        {tasks.iter().map(|task| view! {
            <li>{task.title.clone()}</li>
        }).collect::<Vec<_>>()}
    </ul>
}
```
