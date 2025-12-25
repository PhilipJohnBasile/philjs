# Macro Design Documentation

This document explains the design decisions and implementation details of philjs-macros.

## Architecture

### Overall Design Philosophy

philjs-macros follows these principles:

1. **Ergonomic API**: Macros should feel natural and intuitive
2. **Helpful Errors**: Provide clear, actionable error messages
3. **Performance**: Generate efficient code without runtime overhead
4. **Flexibility**: Support generics, async, and complex types
5. **Compatibility**: Match the quality of Leptos/Dioxus macros

### Macro Pipeline

All macros follow this general pipeline:

```
Input Tokens → Parse (syn) → Transform → Generate (quote) → Output Tokens
```

## Component Macro

### Design Goals

- Transform functions into reusable components
- Automatic props handling
- Display name generation
- Support for generics and lifetimes

### Implementation Details

#### Props Struct Generation

For a component function:

```rust
#[component]
fn Button(text: String, disabled: bool) -> impl IntoView {
    // ...
}
```

We generate:

```rust
#[derive(Clone)]
pub struct ButtonProps {
    pub text: String,
    pub disabled: bool,
}

pub fn Button(props: ButtonProps) -> impl IntoView {
    let text = props.text;
    let disabled = props.disabled;
    // ... original function body
}
```

#### Display Name Generation

Component names are converted to PascalCase:
- `my_component` → `MyComponent`
- `user_profile` → `UserProfile`
- `MyComponent` → `MyComponent`

This is implemented in `utils::to_pascal_case()`.

#### Transparent Mode

For simple components that don't need props structs:

```rust
#[component(transparent)]
fn Title(text: String) -> impl IntoView {
    view! { <h1>{text}</h1> }
}
```

No props struct is generated; the function signature remains unchanged.

### Edge Cases

- **No arguments**: Component with empty props
- **Self/receiver arguments**: Not supported (compile error)
- **Pattern arguments**: Destructuring patterns are flattened
- **Generic arguments**: Full generic support with proper bounds

## Signal Macro

### Design Goals

- Transform struct fields into reactive signals
- Generate clean getter/setter/updater APIs
- Support for complex types
- Minimal boilerplate

### Implementation Details

#### Signal Field Transformation

For a signal struct:

```rust
#[signal]
struct Counter {
    count: i32,
    step: i32,
}
```

We generate:

```rust
#[derive(Clone)]
struct Counter {
    count_signal: philjs::Signal<i32>,
    step_signal: philjs::Signal<i32>,
}

impl Counter {
    pub fn new(count: i32, step: i32) -> Self {
        Self {
            count_signal: philjs::create_signal(count),
            step_signal: philjs::create_signal(step),
        }
    }

    pub fn count(&self) -> i32
    where i32: Clone
    {
        self.count_signal.get()
    }

    pub fn set_count(&self, value: i32) {
        self.count_signal.set(value);
    }

    pub fn update_count(&self, f: impl FnOnce(&mut i32)) {
        self.count_signal.update(f);
    }

    // ... same for step
}
```

#### Naming Convention

- Field: `count`
- Signal field: `count_signal`
- Getter: `count()`
- Setter: `set_count(value)`
- Updater: `update_count(f)`

### Edge Cases

- **Generic fields**: Full generic support
- **Complex types**: Vec, HashMap, Option all supported
- **Lifetime parameters**: Preserved in generated code
- **Tuple structs**: Not supported (compile error)

## Props Macro

### Design Goals

- Builder pattern for component props
- Optional props with defaults
- Type conversion support
- Compile-time validation

### Implementation Details

#### Builder Generation

For props:

```rust
#[derive(Props)]
struct CardProps {
    title: String,
    #[prop(default = r#""primary".to_string()"#)]
    variant: String,
    #[prop(optional)]
    description: Option<String>,
}
```

We generate:

```rust
pub struct CardPropsBuilder {
    title: Option<String>,
    variant: Option<String>,
    description: Option<String>,
}

impl CardPropsBuilder {
    pub fn new() -> Self {
        Self {
            title: None,
            variant: None,
            description: None,
        }
    }

    pub fn title(mut self, value: String) -> Self {
        self.title = Some(value);
        self
    }

    pub fn variant(mut self, value: String) -> Self {
        self.variant = Some(value);
        self
    }

    pub fn description(mut self, value: String) -> Self {
        self.description = Some(value);
        self
    }

    pub fn build(self) -> CardProps {
        CardProps {
            title: self.title.expect("Missing required prop: title"),
            variant: self.variant.unwrap_or_else(|| "primary".to_string()),
            description: self.description,
        }
    }
}
```

#### Attribute Options

- `#[prop(optional)]`: Makes field optional (no panic on missing)
- `#[prop(default = "expr")]`: Provides default value
- `#[prop(into)]`: Accepts `impl Into<T>` instead of `T`

### Edge Cases

- **Required + default**: default takes precedence
- **Optional + default**: default is used when not provided
- **Into + generic**: Proper trait bounds generated
- **Invalid default expr**: Compile error with location

## View Macro

### Design Goals

- JSX-like syntax in Rust
- Compile to efficient render calls
- Support expressions and control flow
- Type-safe attribute handling

### Implementation Details

#### Parser

The parser handles:

1. **Elements**: `<tag>...</tag>` or `<tag />`
2. **Text**: String literals
3. **Expressions**: `{expr}`

#### Element Parsing

Elements are parsed in stages:

```
<button class="btn" on:click={handler}>
  "Click me"
</button>
```

Becomes:

```rust
philjs::element("button")
    .attr(("class", "btn"))
    .attr(("on:click", handler))
    .child(philjs::text("Click me"))
```

#### Expression Handling

Expressions are wrapped with `IntoView`:

```
{count}  →  philjs::IntoView::into_view(count)
```

#### Conditional Rendering

```rust
{show.then(|| view! { <div>"Content"</div> })}
```

#### List Rendering

```rust
{items.iter().map(|item| view! {
    <li>{item}</li>
}).collect::<Vec<_>>()}
```

### Edge Cases

- **Mismatched tags**: Compile error with exact location
- **Unclosed elements**: Helpful error message
- **Invalid attributes**: Syntax error
- **Nested expressions**: Full support with proper precedence

## Server Macro

### Design Goals

- Mark functions as server-only
- Generate client-side RPC calls
- Automatic serialization
- Custom endpoint configuration

### Implementation Details

#### Dual Implementation

For a server function:

```rust
#[server]
async fn get_user(id: u32) -> Result<User, Error> {
    // Server implementation
}
```

We generate:

```rust
// Server-side (when ssr feature enabled)
#[cfg(feature = "ssr")]
async fn get_user(id: u32) -> Result<User, Error> {
    // Original implementation
}

// Client-side (when ssr feature disabled)
#[cfg(not(feature = "ssr"))]
async fn get_user(id: u32) -> Result<User, Error> {
    let input = GetUserInput { id };
    philjs::fetch_json("/api/get_user", &input).await
}

// Input struct for serialization
#[derive(Serialize, Deserialize)]
struct GetUserInput {
    id: u32,
}

// Server registration
#[cfg(feature = "ssr")]
philjs::inventory::submit! {
    philjs::ServerFn {
        path: "/api/get_user",
        handler: |req| Box::pin(async move {
            let input: GetUserInput = philjs::extract_json(req).await?;
            let result = get_user(input.id).await;
            philjs::json_response(result)
        }),
    }
}
```

#### Endpoint Configuration

- `#[server]`: Default endpoint `/api/{function_name}`
- `#[server(endpoint = "/custom")]`: Custom endpoint
- `#[server(prefix = "/v1")]`: Prefix for endpoint

### Edge Cases

- **Generic functions**: Not supported (too complex for RPC)
- **Lifetime parameters**: Not supported
- **Non-serializable types**: Compile error
- **Multiple return types**: Result types handled specially

## Testing Strategy

### Unit Tests

Each module has unit tests for:
- Basic functionality
- Edge cases
- Error conditions

### Integration Tests

Tests directory contains:
- Real-world usage examples
- Macro expansion validation
- Generated code verification

### Compile Tests

Using `trybuild` for:
- Error message validation
- Invalid input handling
- Type checking

## Performance Considerations

### Compile Time

- Minimize allocations during parsing
- Reuse AST nodes where possible
- Efficient code generation

### Runtime

- Generated code has zero overhead
- No unnecessary clones or allocations
- Direct function calls (not dynamic dispatch)

## Future Enhancements

### Planned Features

1. **Better error recovery**: Continue parsing after errors
2. **IDE integration**: Language server support
3. **Async signals**: Reactive async state
4. **Incremental compilation**: Cache macro expansions
5. **Hot reloading**: Preserve state across rebuilds

### API Extensions

1. **Slot support**: Named children slots
2. **Ref forwarding**: Component refs
3. **Context API**: Automatic context injection
4. **Memo support**: Automatic memoization
5. **Suspense boundaries**: Better async handling
