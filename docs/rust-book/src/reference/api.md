# API Reference

This reference summarizes the most-used PhilJS Rust APIs.

## Reactivity

- `signal!(value)` -> Signal<T>
- `memo!(expr)` -> Memo<T>
- `Effect::new(fn)` -> Effect
- `watch(source, callback)` -> Effect

## Rendering

- `view! { ... }` -> View
- `Show::new(when, children, fallback)` -> Show
- `For::new(each, key, children)` -> For
- `fragment(vec![...])` -> Fragment

## DOM

- `mount_to_body(|| view! { ... })`
- `hydrate_to_body(|| view! { ... }, HydrationMode::Auto)`

## SSR

- `render_to_string(|| view! { ... })`
- `render_to_string_with_context(|| view! { ... })`
- `render_to_stream_async(|| view! { ... }, StreamingConfig)`

## Server Functions

- `#[server] async fn ...`
- `call_server::<MyFn>(input)`
