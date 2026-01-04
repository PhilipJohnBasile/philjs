# Macros

PhilJS Rust uses macros for ergonomic UI.

## `view!`

```rust
view! { <div>"Hello"</div> }
```

## `component`

```rust
#[component]
fn Button(label: String) -> impl IntoView {
    view! { <button>{label}</button> }
}
```

## `signal!` and `memo!`

```rust
let count = signal!(0);
let doubled = memo!(count.get() * 2);
```

## `effect!`

```rust
let _effect = effect!({ println!("tick"); });
```

## `resource!`

```rust
let data = resource!(async { fetch_data().await });
```

## `Store`

```rust
#[derive(Store)]
struct AppState { count: i32 }
```
