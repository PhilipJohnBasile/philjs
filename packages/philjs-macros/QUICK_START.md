# PhilJS Macros Quick Start

Get started with philjs-macros in 5 minutes.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs-macros = "0.1.0"
```

## Basic Example

```rust
use philjs_macros::{component, view, Props, signal};

// 1. Define component props
#[derive(Props, Clone)]
struct CounterProps {
    #[prop(default = "0")]
    initial: i32,
}

// 2. Create reactive state
#[signal]
struct CounterState {
    count: i32,
}

// 3. Build your component
#[component]
fn Counter(props: CounterProps) -> impl IntoView {
    let state = CounterState::new(props.initial);

    let increment = move |_| {
        state.update_count(|c| *c += 1);
    };

    let decrement = move |_| {
        state.update_count(|c| *c -= 1);
    };

    // 4. Create UI with view! macro
    view! {
        <div class="counter">
            <h2>"Count: " {state.count()}</h2>
            <button on:click={increment}>"+"</button>
            <button on:click={decrement}>"-"</button>
        </div>
    }
}

// 5. Use your component
fn main() {
    let counter = Counter(CounterProps::builder()
        .initial(5)
        .build()
    );

    philjs::mount(counter, "#app");
}
```

## Cheat Sheet

### Component

```rust
#[component]
fn MyComponent(name: String) -> impl IntoView {
    view! { <div>{name}</div> }
}
```

### Props

```rust
#[derive(Props)]
struct MyProps {
    required: String,
    #[prop(optional)]
    optional: Option<i32>,
    #[prop(default = "42")]
    with_default: i32,
    #[prop(into)]
    convertible: String,
}
```

### Signals

```rust
#[signal]
struct State {
    count: i32,
}

let state = State::new(0);
state.set_count(5);
state.update_count(|c| *c += 1);
```

### View Macro

```rust
view! {
    <div class="container">
        // Text
        "Hello"

        // Expression
        {variable}

        // Conditional
        {condition.then(|| view! { <p>"Shown"</p> })}

        // List
        {items.iter().map(|x| view! { <li>{x}</li> }).collect::<Vec<_>>()}
    </div>
}
```

### Server Functions

```rust
#[server]
async fn get_data(id: u32) -> Result<Data, Error> {
    // Server-only code
    let db = get_database().await?;
    db.fetch(id).await
}

// Client usage
let data = get_data(42).await?;
```

## Common Patterns

### Form Handling

```rust
#[signal]
struct FormState {
    username: String,
    email: String,
}

#[component]
fn LoginForm() -> impl IntoView {
    let form = FormState::new(String::new(), String::new());

    view! {
        <form>
            <input
                value={form.username()}
                on:input={move |e| form.set_username(e.target.value)}
            />
            <input
                value={form.email()}
                on:input={move |e| form.set_email(e.target.value)}
            />
            <button type="submit">"Submit"</button>
        </form>
    }
}
```

### List Rendering

```rust
let todos = vec!["Task 1", "Task 2"];

view! {
    <ul>
        {todos.iter().map(|todo| view! {
            <li>{todo}</li>
        }).collect::<Vec<_>>()}
    </ul>
}
```

### Conditional Rendering

```rust
view! {
    {if logged_in {
        view! { <Dashboard /> }
    } else {
        view! { <LoginForm /> }
    }}
}
```

### Event Handlers

```rust
view! {
    <button on:click={move |e| {
        e.prevent_default();
        handle_click();
    }}>
        "Click me"
    </button>
}
```

## Next Steps

- Read the [Full Documentation](README.md)
- Check out [Examples](examples/)
- Review [API Reference](docs/api-reference.md)
- See [Migration Guide](docs/migration-guide.md) if coming from another framework

## Getting Help

- GitHub Issues: Report bugs or request features
- Discord: Join the community
- Documentation: Read the detailed guides

Happy coding with PhilJS Macros!
