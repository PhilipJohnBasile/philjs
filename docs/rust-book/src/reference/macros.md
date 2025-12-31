# Macros

PhilJS provides ergonomic procedural macros to simplify Rust UI code.

## Component Macros

- `#[component]` - turn a function into a component
- `view!` - RSX syntax for UI
- `#[derive(Props)]` - props builder with defaults and optional fields

## Reactivity Macros

- `signal!(value)` - create a signal
- `memo!(expr)` - create a memo

## Server Macros

- `#[server]` - server-only functions
- `#[action]` - form actions (URL encoded)
- `#[loader]` - data loaders (GET)

## Routing Macros

- `#[route("/path/:id")]`
- `#[layout]`
- `#[api(GET)]`
- `use_params!()`
- `use_query!()`
- `navigate!()`
- `redirect!()`
