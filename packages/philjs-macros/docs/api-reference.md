# API Reference

Complete reference for all macros in philjs-macros.

## Table of Contents

- [component](#component)
- [signal](#signal)
- [Props](#props-derive)
- [view!](#view)
- [server](#server)

---

## `#[component]`

Transform a function into a PhilJS component.

### Syntax

```rust
#[component]
fn ComponentName(prop1: Type1, prop2: Type2, ...) -> impl IntoView {
    // component body
}
```

### Parameters

- **transparent** (optional): Don't generate a props struct

```rust
#[component(transparent)]
fn SimpleComponent(value: String) -> impl IntoView {
    // ...
}
```

### Generated Code

For a component:

```rust
#[component]
fn Button(text: String, disabled: bool) -> impl IntoView {
    view! { <button>{text}</button> }
}
```

Generates:

```rust
#[derive(Clone)]
pub struct ButtonProps {
    pub text: String,
    pub disabled: bool,
}

pub fn Button(props: ButtonProps) -> impl IntoView {
    let text = props.text;
    let disabled = props.disabled;
    view! { <button>{text}</button> }
}

impl ComponentName for ButtonProps {
    fn component_name() -> &'static str {
        "Button"
    }
}
```

### Examples

#### Basic Component

```rust
#[component]
fn Greeting(name: String) -> impl IntoView {
    view! {
        <h1>"Hello, " {name} "!"</h1>
    }
}

// Usage
let greeting = Greeting(GreetingProps {
    name: "World".to_string()
});
```

#### Generic Component

```rust
#[component]
fn List<T: Display>(items: Vec<T>) -> impl IntoView {
    view! {
        <ul>
            {items.iter().map(|item| view! {
                <li>{item.to_string()}</li>
            }).collect::<Vec<_>>()}
        </ul>
    }
}
```

#### Transparent Component

```rust
#[component(transparent)]
fn Title(text: String) -> impl IntoView {
    view! { <h1>{text}</h1> }
}

// Usage (no props struct)
let title = Title("My Title".to_string());
```

#### Async Component

```rust
#[component]
async fn AsyncComponent(url: String) -> impl IntoView {
    let data = fetch_data(&url).await;
    view! { <div>{data}</div> }
}
```

### Notes

- Component names are converted to PascalCase for display
- Props struct is automatically generated unless `transparent` is used
- Supports generics, lifetimes, and async
- Return type must implement `IntoView`

---

## `#[signal]`

Create reactive signals from struct fields.

### Syntax

```rust
#[signal]
struct StructName {
    field1: Type1,
    field2: Type2,
    // ...
}
```

### Generated Methods

For each field `field_name: Type`:

- `fn field_name(&self) -> Type` - Get current value
- `fn set_field_name(&self, value: Type)` - Set new value
- `fn update_field_name(&self, f: impl FnOnce(&mut Type))` - Update in place

### Examples

#### Basic Signal

```rust
#[signal]
struct Counter {
    count: i32,
}

let counter = Counter::new(0);
assert_eq!(counter.count(), 0);

counter.set_count(5);
assert_eq!(counter.count(), 5);

counter.update_count(|c| *c += 1);
assert_eq!(counter.count(), 6);
```

#### Multiple Fields

```rust
#[signal]
struct UserState {
    name: String,
    age: u32,
    is_active: bool,
}

let state = UserState::new(
    "Alice".to_string(),
    30,
    true
);

state.set_name("Bob".to_string());
state.update_age(|age| *age += 1);
```

#### Complex Types

```rust
#[signal]
struct AppState {
    users: Vec<User>,
    current_user: Option<User>,
}

let state = AppState::new(vec![], None);

state.update_users(|users| {
    users.push(new_user);
});

state.set_current_user(Some(user));
```

#### Generic Signals

```rust
#[signal]
struct GenericState<T> {
    value: T,
}

let int_state = GenericState::new(42);
let string_state = GenericState::new("hello".to_string());
```

### Notes

- Generated struct has `#[derive(Clone)]`
- All signals are shareable (clone is cheap)
- Getters require `T: Clone`
- Original field names become signal fields with `_signal` suffix

---

## `#[derive(Props)]`

Derive builder pattern for component props.

### Syntax

```rust
#[derive(Props)]
struct PropsName {
    #[prop(ATTRIBUTES)]
    field: Type,
}
```

### Attributes

- `optional` - Field is optional (type becomes `Option<T>`)
- `default = "expr"` - Provide default value
- `into` - Accept `impl Into<T>` instead of `T`

### Generated Code

```rust
#[derive(Props)]
struct ButtonProps {
    text: String,
    #[prop(default = r#""primary".to_string()"#)]
    variant: String,
}
```

Generates:

```rust
pub struct ButtonPropsBuilder {
    text: Option<String>,
    variant: Option<String>,
}

impl ButtonPropsBuilder {
    pub fn new() -> Self { /* ... */ }

    pub fn text(mut self, value: String) -> Self {
        self.text = Some(value);
        self
    }

    pub fn variant(mut self, value: String) -> Self {
        self.variant = Some(value);
        self
    }

    pub fn build(self) -> ButtonProps {
        ButtonProps {
            text: self.text.expect("Missing required prop: text"),
            variant: self.variant.unwrap_or_else(|| "primary".to_string()),
        }
    }
}

impl Props for ButtonProps {
    type Builder = ButtonPropsBuilder;
    fn builder() -> Self::Builder {
        ButtonPropsBuilder::new()
    }
}
```

### Examples

#### Required Props

```rust
#[derive(Props)]
struct CardProps {
    title: String,
    content: String,
}

let props = CardProps::builder()
    .title("My Card".to_string())
    .content("Content here".to_string())
    .build();
```

#### Optional Props

```rust
#[derive(Props)]
struct UserProps {
    name: String,
    #[prop(optional)]
    email: Option<String>,
}

let props = UserProps::builder()
    .name("Alice".to_string())
    .build();
// email will be None
```

#### Default Values

```rust
#[derive(Props)]
struct StyledProps {
    text: String,
    #[prop(default = r#""16px".to_string()"#)]
    font_size: String,
    #[prop(default = "true")]
    bold: bool,
}

let props = StyledProps::builder()
    .text("Hello".to_string())
    .build();
// font_size = "16px", bold = true
```

#### Into Conversion

```rust
#[derive(Props)]
struct TextProps {
    #[prop(into)]
    content: String,
}

let props = TextProps::builder()
    .content("hello")  // &str converted to String
    .build();
```

#### Combined Attributes

```rust
#[derive(Props)]
struct ComplexProps {
    id: u32,
    #[prop(into)]
    name: String,
    #[prop(default = "true")]
    active: bool,
    #[prop(optional)]
    description: Option<String>,
}
```

### Notes

- Missing required props panic at runtime with helpful message
- Default expressions are evaluated at build time
- `into` adds trait bounds: `impl Into<T>`
- Builder pattern is zero-cost (optimized away)

---

## `view!`

JSX-like syntax for building UI.

### Syntax

```rust
view! {
    <element attribute="value" namespace:attr={expr}>
        "text"
        {expression}
        <child />
    </element>
}
```

### Elements

#### Self-Closing Tags

```rust
view! {
    <img src="photo.jpg" alt="Photo" />
}
```

#### Nested Elements

```rust
view! {
    <div>
        <h1>"Title"</h1>
        <p>"Description"</p>
    </div>
}
```

#### Fragments

Multiple root elements:

```rust
view! {
    <div>"First"</div>
    <div>"Second"</div>
}
// Becomes: philjs::fragment(vec![...])
```

### Attributes

#### Static Attributes

```rust
view! {
    <div class="container" id="main" />
}
```

#### Dynamic Attributes

```rust
let class_name = "active";
view! {
    <div class={class_name} />
}
```

#### Namespaced Attributes

```rust
view! {
    <button on:click={handler} on:mouseover={hover_handler} />
}
```

#### Boolean Attributes

```rust
view! {
    <input disabled />
}
// disabled = true
```

### Text and Expressions

#### Text Nodes

```rust
view! {
    <p>"Hello, World!"</p>
}
```

#### Expression Blocks

```rust
let name = "Alice";
view! {
    <p>"Hello, " {name}</p>
}
```

#### Complex Expressions

```rust
let count = 42;
view! {
    <p>{format!("Count: {}", count)}</p>
}
```

### Control Flow

#### Conditionals

```rust
let show = true;
view! {
    {show.then(|| view! {
        <div>"Visible"</div>
    })}
}
```

#### If/Else

```rust
{if condition {
    view! { <div>"True"</div> }
} else {
    view! { <div>"False"</div> }
}}
```

#### Match Expressions

```rust
{match status {
    Status::Loading => view! { <div>"Loading..."</div> },
    Status::Success => view! { <div>"Success!"</div> },
    Status::Error(e) => view! { <div>"Error: " {e}</div> },
}}
```

### Lists

#### Map and Collect

```rust
let items = vec!["A", "B", "C"];
view! {
    <ul>
        {items.iter().map(|item| view! {
            <li>{item}</li>
        }).collect::<Vec<_>>()}
    </ul>
}
```

#### With Index

```rust
{items.iter().enumerate().map(|(i, item)| view! {
    <li class={format!("item-{}", i)}>{item}</li>
}).collect::<Vec<_>>()}
```

### Generated Code

```rust
view! {
    <div class="container">
        <h1>"Hello"</h1>
    </div>
}
```

Generates:

```rust
philjs::element("div")
    .attr(("class", "container"))
    .child(
        philjs::element("h1")
            .child(philjs::text("Hello"))
    )
```

### Notes

- Elements must be properly closed
- Tag names must match exactly
- Expressions can be any valid Rust expression
- Return type must implement `IntoView`

---

## `#[server]`

Mark functions as server-only with RPC generation.

### Syntax

```rust
#[server]
async fn function_name(param: Type) -> Result<ReturnType, ErrorType> {
    // Server-only code
}
```

### Parameters

- `endpoint = "/path"` - Custom endpoint path
- `prefix = "/api"` - Endpoint prefix (default: `/api`)

### Generated Code

```rust
#[server]
async fn get_user(id: u32) -> Result<User, ServerError> {
    let db = get_database().await?;
    db.fetch_user(id).await
}
```

Generates:

```rust
// Input struct
#[derive(Serialize, Deserialize)]
struct GetUserInput {
    id: u32,
}

// Server-side implementation
#[cfg(feature = "ssr")]
async fn get_user(id: u32) -> Result<User, ServerError> {
    let db = get_database().await?;
    db.fetch_user(id).await
}

// Client-side RPC stub
#[cfg(not(feature = "ssr"))]
async fn get_user(id: u32) -> Result<User, ServerError> {
    let input = GetUserInput { id };
    philjs::fetch_json("/api/get_user", &input).await
}

// Server registration
#[cfg(feature = "ssr")]
philjs::inventory::submit! {
    philjs::ServerFn {
        path: "/api/get_user",
        handler: /* ... */,
    }
}
```

### Examples

#### Basic Server Function

```rust
#[server]
async fn fetch_data(query: String) -> Result<Vec<Item>, ServerError> {
    let db = get_database().await?;
    db.search(&query).await
}

// Client usage
let items = fetch_data("search term".to_string()).await?;
```

#### Custom Endpoint

```rust
#[server(endpoint = "/api/v2/users")]
async fn get_users() -> Result<Vec<User>, ServerError> {
    // ...
}
```

#### With Prefix

```rust
#[server(prefix = "/v1")]
async fn versioned_function(id: u32) -> Result<Data, ServerError> {
    // Available at /v1/versioned_function
}
```

#### Multiple Parameters

```rust
#[server]
async fn create_post(
    title: String,
    content: String,
    author_id: u32,
) -> Result<u32, ServerError> {
    let db = get_database().await?;
    db.insert_post(&title, &content, author_id).await
}
```

#### Complex Return Types

```rust
#[derive(Serialize, Deserialize)]
struct UserProfile {
    user: User,
    posts: Vec<Post>,
    followers: u32,
}

#[server]
async fn get_profile(user_id: u32) -> Result<UserProfile, ServerError> {
    // ...
}
```

### Notes

- Functions must be `async`
- Parameters and return types must implement `Serialize` and `Deserialize`
- Server code only runs when `ssr` feature is enabled
- Client automatically gets RPC stub
- Endpoints are registered automatically on server

---

## Type Requirements

### `IntoView`

Types that can be converted to views:

```rust
pub trait IntoView {
    type Output;
    fn into_view(self) -> Self::Output;
}
```

Implemented for:
- `View`
- `String`
- `&str`
- `i32`, `u32`, etc.
- `Option<T: IntoView>`
- `Vec<T: IntoView>`

### `ComponentName`

Provides component display name:

```rust
pub trait ComponentName {
    fn component_name() -> &'static str;
}
```

Auto-generated by `#[component]`.

### `Props`

Builder pattern for props:

```rust
pub trait Props {
    type Builder;
    fn builder() -> Self::Builder;
}
```

Generated by `#[derive(Props)]`.
