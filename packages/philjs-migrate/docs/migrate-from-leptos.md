# Migrating from Leptos to PhilJS-Rust

This guide helps you migrate Leptos applications to PhilJS-Rust. Both are Rust-based reactive UI frameworks with similar signal-based architectures, making the migration relatively straightforward.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Why Migrate?](#why-migrate)
3. [Signal API Comparison](#signal-api-comparison)
4. [View Macro Differences](#view-macro-differences)
5. [Components](#components)
6. [Server Functions](#server-functions)
7. [Routing](#routing)
8. [Resource and Suspense](#resource-and-suspense)
9. [Context](#context)
10. [Step-by-Step Migration](#step-by-step-migration)

---

## Quick Start

### Update Cargo.toml

```toml
# Before (Leptos)
[dependencies]
leptos = "0.6"
leptos_router = "0.6"
leptos_meta = "0.6"

# After (PhilJS)
[dependencies]
philjs = "1.0"
```

### Basic Component Conversion

```rust
// Before (Leptos)
use leptos::*;

#[component]
pub fn Counter(cx: Scope, initial: i32) -> impl IntoView {
    let (count, set_count) = create_signal(cx, initial);
    let doubled = create_memo(cx, move |_| count() * 2);

    create_effect(cx, move |_| {
        log!("Count changed: {}", count());
    });

    view! { cx,
        <button on:click=move |_| set_count.update(|n| *n += 1)>
            "Count: " {count} " (Doubled: " {doubled} ")"
        </button>
    }
}

// After (PhilJS)
use philjs::prelude::*;

#[component]
pub fn Counter(initial: i32) -> impl IntoView {
    let count = signal!(initial);
    let doubled = memo!(count.get() * 2);

    effect!(|| {
        log!("Count changed: {}", count.get());
    });

    view! {
        <button on:click=move |_| count.update(|n| *n += 1)>
            "Count: " {count} " (Doubled: " {doubled} ")"
        </button>
    }
}
```

---

## Why Migrate?

### Similarities

Both Leptos and PhilJS-Rust share:
- Fine-grained reactivity with signals
- Rust-native with WASM compilation
- SSR support with hydration
- Component-based architecture
- Similar view macro syntax

### PhilJS Advantages

1. **Simpler API**: No `cx: Scope` parameter everywhere
2. **Unified Signal Type**: One `Signal<T>` instead of `(ReadSignal, WriteSignal)`
3. **Macro Ergonomics**: `signal!`, `memo!`, `effect!` macros
4. **LiveView Integration**: Built-in LiveView support
5. **Unified Ecosystem**: Share code between TypeScript and Rust
6. **Query Integration**: Built-in TanStack Query-style caching

---

## Signal API Comparison

### Creating Signals

```rust
// Leptos - returns tuple (read, write)
let (count, set_count) = create_signal(cx, 0);
let count_rw = create_rw_signal(cx, 0);

// PhilJS - unified Signal type
let count = Signal::new(0);
// Or with macro
let count = signal!(0);
```

### Reading Signals

```rust
// Leptos
let value = count();           // Call read signal
let value = count_rw.get();    // RwSignal.get()

// PhilJS - consistent API
let value = count.get();       // Always use .get()
// Or in view! context, just use the signal name
view! {
    <span>{count}</span>       // Auto-displays value
}
```

### Writing Signals

```rust
// Leptos
set_count(5);                    // Set directly
set_count.set(5);                // Or .set()
set_count.update(|n| *n += 1);   // Update with function
count_rw.set(5);                 // RwSignal

// PhilJS
count.set(5);                    // Direct set
count.update(|n| *n += 1);       // Update with function
```

### Computed/Memo

```rust
// Leptos
let doubled = create_memo(cx, move |_| count() * 2);
// Access
doubled()

// PhilJS
let doubled = Memo::new(|| count.get() * 2);
// Or with macro
let doubled = memo!(count.get() * 2);
// Access
doubled.get()
// In view! - just use the name
```

### Effects

```rust
// Leptos
create_effect(cx, move |prev_value| {
    let value = count();
    log!("Count: {} (was {:?})", value, prev_value);
    value  // Return for next iteration
});

// PhilJS
Effect::new(|| {
    let value = count.get();
    log!("Count: {}", value);
});
// Or with macro
effect!(|| {
    log!("Count: {}", count.get());
});
```

---

## View Macro Differences

### Basic Syntax

```rust
// Leptos - requires cx parameter
view! { cx,
    <div class="container">
        <h1>"Hello, World!"</h1>
    </div>
}

// PhilJS - no cx needed
view! {
    <div class="container">
        <h1>"Hello, World!"</h1>
    </div>
}
```

### Event Handlers

```rust
// Leptos
view! { cx,
    <button on:click=move |_| set_count.update(|n| *n += 1)>
        "Increment"
    </button>
}

// PhilJS - same syntax
view! {
    <button on:click=move |_| count.update(|n| *n += 1)>
        "Increment"
    </button>
}
```

### Dynamic Content

```rust
// Leptos
view! { cx,
    <span>{count}</span>
    <span>{move || format!("Value: {}", count())}</span>
}

// PhilJS - same patterns
view! {
    <span>{count}</span>
    <span>{move || format!("Value: {}", count.get())}</span>
}
```

### Conditional Rendering

```rust
// Leptos
view! { cx,
    <Show
        when=move || count() > 5
        fallback=|cx| view! { cx, <p>"Count is small"</p> }
    >
        <p>"Count is large!"</p>
    </Show>
}

// PhilJS
view! {
    <Show
        when=move || count.get() > 5
        fallback=|| view! { <p>"Count is small"</p> }
    >
        <p>"Count is large!"</p>
    </Show>
}
```

### Lists

```rust
// Leptos
view! { cx,
    <For
        each=move || items()
        key=|item| item.id
        view=move |cx, item| view! { cx,
            <li>{item.name.clone()}</li>
        }
    />
}

// PhilJS
view! {
    <For
        each=move || items.get()
        key=|item| item.id
        view=move |item| view! {
            <li>{item.name.clone()}</li>
        }
    />
}
```

---

## Components

### Component Definition

```rust
// Leptos
#[component]
pub fn Greeting(cx: Scope, name: String) -> impl IntoView {
    view! { cx,
        <h1>"Hello, " {name} "!"</h1>
    }
}

// PhilJS - no Scope parameter
#[component]
pub fn Greeting(name: String) -> impl IntoView {
    view! {
        <h1>"Hello, " {name} "!"</h1>
    }
}
```

### Optional Props

```rust
// Leptos
#[component]
pub fn Button(
    cx: Scope,
    #[prop(optional)] disabled: bool,
    #[prop(default = "Click me".to_string())] label: String,
    children: Children,
) -> impl IntoView {
    view! { cx,
        <button disabled=disabled>
            {label}
            {children(cx)}
        </button>
    }
}

// PhilJS
#[component]
pub fn Button(
    #[prop(optional)] disabled: bool,
    #[prop(default = "Click me".to_string())] label: String,
    children: Children,
) -> impl IntoView {
    view! {
        <button disabled=disabled>
            {label}
            {children()}
        </button>
    }
}
```

### Component Usage

```rust
// Leptos
view! { cx,
    <Greeting name="World".to_string() />
    <Button disabled=true>
        "Submit"
    </Button>
}

// PhilJS - same syntax
view! {
    <Greeting name="World".to_string() />
    <Button disabled=true>
        "Submit"
    </Button>
}
```

---

## Server Functions

### Defining Server Functions

```rust
// Leptos
#[server(GetUser, "/api")]
pub async fn get_user(id: u64) -> Result<User, ServerFnError> {
    let user = db::find_user(id).await?;
    Ok(user)
}

// PhilJS - simpler attribute
#[server]
pub async fn get_user(id: u64) -> ServerResult<User> {
    let user = db::find_user(id).await?;
    Ok(user)
}
```

### Calling Server Functions

```rust
// Leptos
#[component]
pub fn UserProfile(cx: Scope, id: u64) -> impl IntoView {
    let user = create_resource(cx, move || id, |id| async move {
        get_user(id).await
    });

    view! { cx,
        <Suspense fallback=move || view! { cx, <p>"Loading..."</p> }>
            {move || user.get().map(|result| match result {
                Ok(user) => view! { cx, <h1>{user.name.clone()}</h1> },
                Err(e) => view! { cx, <p>"Error: " {e.to_string()}</p> },
            })}
        </Suspense>
    }
}

// PhilJS
#[component]
pub fn UserProfile(id: u64) -> impl IntoView {
    let user = Resource::new(move || async move {
        get_user(id).await
    });

    view! {
        <Suspense fallback=|| view! { <p>"Loading..."</p> }>
            {move || user.get().map(|result| match result {
                Ok(user) => view! { <h1>{user.name.clone()}</h1> },
                Err(e) => view! { <p>"Error: " {e.to_string()}</p> },
            })}
        </Suspense>
    }
}
```

---

## Routing

### Route Definition

```rust
// Leptos
use leptos_router::*;

#[component]
pub fn App(cx: Scope) -> impl IntoView {
    view! { cx,
        <Router>
            <Routes>
                <Route path="/" view=|cx| view! { cx, <HomePage /> } />
                <Route path="/users/:id" view=|cx| view! { cx, <UserPage /> } />
                <Route path="/*any" view=|cx| view! { cx, <NotFound /> } />
            </Routes>
        </Router>
    }
}

// PhilJS
use philjs::router::*;

#[component]
pub fn App() -> impl IntoView {
    let routes = routes![
        ("/" => HomePage),
        ("/users/:id" => UserPage),
        ("/*any" => NotFound),
    ];

    view! {
        <Router routes=routes>
            <Routes />
        </Router>
    }
}
```

### Accessing Route Params

```rust
// Leptos
#[component]
pub fn UserPage(cx: Scope) -> impl IntoView {
    let params = use_params_map(cx);
    let id = move || params().get("id").cloned().unwrap_or_default();

    view! { cx, <h1>"User: " {id}</h1> }
}

// PhilJS
#[component]
pub fn UserPage() -> impl IntoView {
    let params = use_params();
    let id = move || params.get("id").unwrap_or_default();

    view! { <h1>"User: " {id}</h1> }
}
```

### Navigation

```rust
// Leptos
let navigate = use_navigate(cx);
navigate("/home", NavigateOptions::default());

// PhilJS
let navigate = use_navigate();
navigate("/home");
```

---

## Resource and Suspense

### Creating Resources

```rust
// Leptos
let user = create_resource(
    cx,
    move || user_id(),  // Source signal
    |id| async move {
        fetch_user(id).await
    }
);

// Access
user.read(cx)  // Option<Result<T, E>>
user.loading()  // bool

// PhilJS
let user = Resource::new(move || async move {
    let id = user_id.get();
    fetch_user(id).await
});

// Access
user.get()       // Option<Result<T, E>>
user.loading()   // bool
```

### Suspense Pattern

```rust
// Leptos
view! { cx,
    <Suspense fallback=move || view! { cx, <p>"Loading..."</p> }>
        <ErrorBoundary fallback=|cx, errors| view! { cx,
            <p>"Error: " {errors.get().first().map(|e| e.to_string())}</p>
        }>
            {move || user.read(cx).map(|data| view! { cx,
                <div>{data.name.clone()}</div>
            })}
        </ErrorBoundary>
    </Suspense>
}

// PhilJS
view! {
    <Suspense fallback=|| view! { <p>"Loading..."</p> }>
        <ErrorBoundary fallback=|errors| view! {
            <p>"Error: " {errors.first().map(|e| e.to_string())}</p>
        }>
            {move || user.get().map(|data| view! {
                <div>{data.name.clone()}</div>
            })}
        </ErrorBoundary>
    </Suspense>
}
```

---

## Context

### Providing Context

```rust
// Leptos
provide_context(cx, MyContext { value: 42 });

// In child
let ctx = use_context::<MyContext>(cx).expect("Context not found");

// PhilJS - no cx parameter
provide_context(MyContext { value: 42 });

// In child
let ctx = use_context::<MyContext>().expect("Context not found");
```

### Reactive Context

```rust
// Leptos
let count = create_rw_signal(cx, 0);
provide_context(cx, count);

// Child accesses
let count = use_context::<RwSignal<i32>>(cx).expect("Count context");
count.get()

// PhilJS
let count = signal!(0);
provide_context(count.clone());

// Child accesses
let count = use_context::<Signal<i32>>().expect("Count context");
count.get()
```

---

## Step-by-Step Migration

### 1. Update Cargo.toml

```toml
[dependencies]
philjs = "1.0"
# philjs = { version = "1.0", features = ["ssr", "hydrate"] }  # For SSR
```

### 2. Update Imports

```rust
// Before
use leptos::*;
use leptos_router::*;

// After
use philjs::prelude::*;
use philjs::router::*;
```

### 3. Remove Scope Parameters

Search and replace patterns:
- `fn (\w+)\(cx: Scope` -> `fn $1(`
- `view! { cx,` -> `view! {`
- `create_signal(cx,` -> `Signal::new(`
- `create_memo(cx,` -> `Memo::new(`
- `create_effect(cx,` -> `Effect::new(`
- `create_resource(cx,` -> `Resource::new(`
- `provide_context(cx,` -> `provide_context(`
- `use_context::<(.+)>(cx)` -> `use_context::<$1>()`

### 4. Update Signal Patterns

```rust
// Replace tuple pattern
// Before: let (count, set_count) = create_signal(cx, 0);
// After:  let count = Signal::new(0);

// Replace setter calls
// Before: set_count(5) or set_count.set(5)
// After:  count.set(5)

// Replace getter calls (in closures)
// Before: count()
// After:  count.get()
```

### 5. Update Children Pattern

```rust
// Before: children(cx)
// After:  children()
```

### 6. Test and Verify

```bash
cargo build
cargo test
trunk serve  # For WASM
cargo run    # For SSR
```

---

## Comparison Table

| Feature | Leptos | PhilJS-Rust |
|---------|--------|-------------|
| Signal Creation | `create_signal(cx, x)` | `Signal::new(x)` or `signal!(x)` |
| Signal Type | `(ReadSignal, WriteSignal)` | `Signal<T>` (unified) |
| RwSignal | `create_rw_signal(cx, x)` | `Signal::new(x)` |
| Memo | `create_memo(cx, \|_\| x)` | `Memo::new(\|\| x)` or `memo!(x)` |
| Effect | `create_effect(cx, \|_\| {})` | `Effect::new(\|\| {})` or `effect!(\|\| {})` |
| Resource | `create_resource(cx, src, fetcher)` | `Resource::new(fetcher)` |
| View Macro | `view! { cx, ... }` | `view! { ... }` |
| Provide Context | `provide_context(cx, val)` | `provide_context(val)` |
| Use Context | `use_context::<T>(cx)` | `use_context::<T>()` |
| Server Functions | `#[server(Name, "/api")]` | `#[server]` |
| Children | `children(cx)` | `children()` |

---

## Need Help?

- [PhilJS-Rust Documentation](https://philjs.dev/rust)
- [Discord Community](https://discord.gg/philjs)
- [GitHub Issues](https://github.com/philjs/philjs/issues)
- [API Reference](https://docs.rs/philjs)
