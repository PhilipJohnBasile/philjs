# Stores

A store is a struct that wraps signals and exposes domain-specific methods.

```rust
use philjs::prelude::*;

#[derive(Clone)]
struct Todo {
    id: u32,
    text: String,
    done: bool,
}

#[derive(Clone)]
struct TodoStore {
    todos: Signal<Vec<Todo>>,
}

impl TodoStore {
    fn new() -> Self {
        Self { todos: signal!(Vec::new()) }
    }

    fn add(&self, text: impl Into<String>) {
        let next = Todo {
            id: self.todos.get().len() as u32 + 1,
            text: text.into(),
            done: false,
        };
        self.todos.update(|items| items.push(next));
    }

    fn toggle(&self, id: u32) {
        self.todos.update(|items| {
            if let Some(todo) = items.iter_mut().find(|t| t.id == id) {
                todo.done = !todo.done;
            }
        });
    }
}
```

Use stores when you want reusable logic across multiple components.
