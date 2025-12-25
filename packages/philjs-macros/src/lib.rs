//! PhilJS Macros - Procedural macros for PhilJS
//!
//! This crate provides ergonomic procedural macros for building reactive web applications
//! with PhilJS. It offers a Leptos-like experience with additional features.
//!
//! # Available Macros
//!
//! ## Component & View Macros
//! - `#[component]` - Transform functions into PhilJS components
//! - `view!` - JSX-like syntax for building UI in Rust
//! - `#[derive(Props)]` - Derive Props trait for component props
//!
//! ## Reactivity Macros
//! - `#[signal]` - Create reactive signals from struct fields
//!
//! ## Server Function Macros
//! - `#[server]` - Mark functions as server-only with RPC generation
//! - `#[action]` - Create form actions (URL-encoded server functions)
//! - `#[loader]` - Create data loaders (GET server functions)
//!
//! ## Routing Macros
//! - `#[route("/path/:param")]` - Define type-safe routes
//! - `#[layout]` - Define layout components
//! - `#[api(GET)]` - Define API routes
//! - `use_params!()` - Extract typed path parameters
//! - `use_query!()` - Extract typed query parameters
//! - `navigate!()` - Type-safe navigation
//! - `redirect!()` - Redirect to another route
//!
//! # Example
//!
//! ```rust,ignore
//! use philjs::prelude::*;
//!
//! #[derive(Props)]
//! struct CounterProps {
//!     initial: i32,
//!     #[prop(default = "Counter")]
//!     label: &'static str,
//! }
//!
//! #[component]
//! fn Counter(props: CounterProps) -> impl IntoView {
//!     let (count, set_count) = create_signal(props.initial);
//!
//!     view! {
//!         <div class="counter">
//!             <h2>{props.label}</h2>
//!             <button on:click=move |_| set_count.update(|n| *n + 1)>
//!                 "Count: " {count}
//!             </button>
//!         </div>
//!     }
//! }
//!
//! #[route("/users/:id")]
//! fn UserPage(params: UserPageParams) -> impl IntoView {
//!     let user = create_resource(
//!         || params.id,
//!         |id| fetch_user(id)
//!     );
//!
//!     view! {
//!         <Suspense fallback=|| view! { <p>"Loading..."</p> }>
//!             {move || user.get().map(|u| view! {
//!                 <h1>{u.name}</h1>
//!             })}
//!         </Suspense>
//!     }
//! }
//!
//! #[server]
//! async fn fetch_user(id: i32) -> Result<User, ServerFnError> {
//!     db::get_user(id).await
//! }
//! ```

use proc_macro::TokenStream;

mod component;
mod props;
mod server;
mod signal;
mod view;
mod routing;
mod utils;

// ============================================================================
// Component & View Macros
// ============================================================================

/// Transform a function into a PhilJS component.
///
/// This macro converts a function into a reusable component with proper
/// display name generation and props handling.
///
/// # Attributes
///
/// - `transparent` - Skip props struct generation, useful for simple components
///
/// # Example
///
/// ```rust,ignore
/// #[component]
/// fn MyComponent(name: String, age: u32) -> impl IntoView {
///     view! {
///         <div>
///             <p>"Name: " {name}</p>
///             <p>"Age: " {age}</p>
///         </div>
///     }
/// }
///
/// // Transparent component (no props struct)
/// #[component(transparent)]
/// fn SimpleText(text: &str) -> impl IntoView {
///     view! { <span>{text}</span> }
/// }
/// ```
#[proc_macro_attribute]
pub fn component(args: TokenStream, input: TokenStream) -> TokenStream {
    component::component_impl(args, input)
}

/// JSX-like syntax for building UI in Rust.
///
/// This macro provides a familiar JSX-like syntax that compiles to efficient
/// PhilJS render calls. Supports expressions, conditionals, loops, and more.
///
/// # Features
///
/// - **Elements**: `<div>`, `<span>`, etc.
/// - **Components**: `<MyComponent prop={value} />`
/// - **Fragments**: `<>...</>`
/// - **Event handlers**: `on:click={handler}` with modifiers
/// - **Two-way binding**: `bind:value={signal}`
/// - **Class directives**: `class:active={is_active}`
/// - **Style directives**: `style:color={color}`
/// - **Refs**: `ref={node_ref}`
/// - **Spread**: `{..props}`
/// - **Control flow**: `<Show>`, `<For>`, `<Match>`, `<Suspense>`, `<ErrorBoundary>`
///
/// # Example
///
/// ```rust,ignore
/// let items = vec!["Apple", "Banana", "Cherry"];
/// let show_header = create_signal(true);
/// let (count, set_count) = create_signal(0);
///
/// view! {
///     <div class="container">
///         <Show when={move || show_header.get()}>
///             <h1>"Fruit List"</h1>
///         </Show>
///
///         <button on:click|preventDefault={move |_| set_count.update(|n| *n + 1)}>
///             "Clicked: " {count} " times"
///         </button>
///
///         <ul>
///             <For each={items} key={|item| item.to_string()}>
///                 {|item| view! { <li>{item}</li> }}
///             </For>
///         </ul>
///
///         <input bind:value={name} />
///
///         <div class:highlighted={is_selected} style:opacity={opacity}>
///             "Dynamic styling"
///         </div>
///     </div>
/// }
/// ```
#[proc_macro]
pub fn view(input: TokenStream) -> TokenStream {
    view::view_impl(input)
}

/// Derive the Props trait for component props.
///
/// This macro handles optional props with defaults and validates prop types
/// at compile time.
///
/// # Attributes
///
/// - `#[prop(default = "value")]` - Set a default value
/// - `#[prop(optional)]` - Make the prop optional (Option<T>)
/// - `#[prop(into)]` - Accept any type that implements Into<T>
///
/// # Example
///
/// ```rust,ignore
/// #[derive(Props)]
/// struct ButtonProps {
///     text: String,
///
///     #[prop(default = "primary")]
///     variant: &'static str,
///
///     #[prop(optional)]
///     on_click: Option<Callback<()>>,
///
///     #[prop(into)]
///     class: String,
/// }
/// ```
#[proc_macro_derive(Props, attributes(prop))]
pub fn derive_props(input: TokenStream) -> TokenStream {
    props::derive_props_impl(input)
}

// ============================================================================
// Reactivity Macros
// ============================================================================

/// Create reactive signals from struct fields.
///
/// This macro generates getters and setters for each field, making them
/// reactive signals that can be used in components.
///
/// # Example
///
/// ```rust,ignore
/// #[signal]
/// struct AppState {
///     count: i32,
///     name: String,
/// }
///
/// // Generates:
/// // - count() -> Signal<i32>
/// // - set_count(i32)
/// // - name() -> Signal<String>
/// // - set_name(String)
///
/// let state = AppState::new();
/// state.set_count(42);
/// println!("Count: {}", state.count().get());
/// ```
#[proc_macro_attribute]
pub fn signal(args: TokenStream, input: TokenStream) -> TokenStream {
    signal::signal_impl(args, input)
}

// ============================================================================
// Server Function Macros
// ============================================================================

/// Mark functions as server-only with automatic RPC generation.
///
/// This macro generates client-side RPC calls for server functions,
/// enabling seamless client-server communication.
///
/// # Attributes
///
/// - `endpoint = "/path"` - Custom endpoint path
/// - `prefix = "/api"` - API prefix (default: "/api")
/// - `encoding = "json"` - Encoding format (json, cbor, url, multipart)
/// - `streaming` - Enable streaming responses
/// - `middleware = "auth"` - Apply middleware
/// - `rate_limit = 60` - Rate limit (requests per minute)
/// - `require = "admin"` - Required permission
/// - `cache = 3600` - Cache duration in seconds
/// - `openapi` - Generate OpenAPI documentation
///
/// # Example
///
/// ```rust,ignore
/// #[server]
/// async fn fetch_user(id: u32) -> Result<User, ServerFnError> {
///     let db = get_database_connection();
///     db.fetch_user(id).await
/// }
///
/// #[server(encoding = "multipart")]
/// async fn upload_file(file: MultipartFile) -> Result<String, ServerFnError> {
///     save_file(file).await
/// }
///
/// #[server(streaming)]
/// async fn stream_data() -> impl Stream<Item = DataChunk> {
///     create_data_stream()
/// }
///
/// // On the client:
/// let user = fetch_user(42).await?;
/// ```
#[proc_macro_attribute]
pub fn server(args: TokenStream, input: TokenStream) -> TokenStream {
    server::server_impl(args, input)
}

/// Create a form action (URL-encoded server function).
///
/// This is a convenience macro that creates a server function optimized
/// for form submissions, similar to Remix actions.
///
/// # Example
///
/// ```rust,ignore
/// #[action]
/// async fn create_user(name: String, email: String) -> Result<User, ActionError> {
///     db::create_user(name, email).await
/// }
///
/// // Use with ActionForm
/// view! {
///     <ActionForm action={create_user}>
///         <input name="name" />
///         <input name="email" type="email" />
///         <button type="submit">"Create"</button>
///     </ActionForm>
/// }
/// ```
#[proc_macro_attribute]
pub fn action(args: TokenStream, input: TokenStream) -> TokenStream {
    server::action_impl(args, input)
}

/// Create a data loader (GET server function).
///
/// This is a convenience macro that creates a server function optimized
/// for data loading, similar to Remix loaders.
///
/// # Example
///
/// ```rust,ignore
/// #[loader]
/// async fn load_users() -> Result<Vec<User>, LoaderError> {
///     db::get_all_users().await
/// }
///
/// #[route("/users")]
/// fn UsersPage() -> impl IntoView {
///     let users = create_resource(|| (), |_| load_users());
///     // ...
/// }
/// ```
#[proc_macro_attribute]
pub fn loader(args: TokenStream, input: TokenStream) -> TokenStream {
    server::loader_impl(args, input)
}

// ============================================================================
// Routing Macros
// ============================================================================

/// Define a type-safe route.
///
/// This macro creates a route handler with automatic parameter extraction
/// and type-safe navigation support.
///
/// # Path Syntax
///
/// - `/users` - Static segment
/// - `/users/:id` - Dynamic parameter (String by default)
/// - `/users/:id<i32>` - Typed parameter
/// - `/files/*path` - Catch-all parameter
/// - `/users/:id?` - Optional parameter
///
/// # Attributes
///
/// - `ssr = "ssr"` - SSR mode: "ssr", "csr", "ssg", "isr"
/// - `revalidate = 60` - ISR revalidation interval
/// - `guard = "auth_guard"` - Route guard function
/// - `title = "Page Title"` - Page title for metadata
/// - `preload` - Enable route preloading
///
/// # Example
///
/// ```rust,ignore
/// #[route("/")]
/// fn HomePage() -> impl IntoView {
///     view! { <h1>"Welcome"</h1> }
/// }
///
/// #[route("/users/:id<i32>")]
/// fn UserPage(params: UserPageParams) -> impl IntoView {
///     view! { <h1>"User " {params.id}</h1> }
/// }
///
/// #[route("/posts/:slug", ssr = "ssg")]
/// fn PostPage(params: PostPageParams) -> impl IntoView {
///     // Statically generated at build time
/// }
///
/// #[route("/admin", guard = "require_admin")]
/// fn AdminPage() -> impl IntoView {
///     // Protected route
/// }
/// ```
#[proc_macro_attribute]
pub fn route(args: TokenStream, input: TokenStream) -> TokenStream {
    routing::route_impl(args, input)
}

/// Define a layout component.
///
/// Layout components wrap child routes and provide shared UI like
/// navigation, headers, and footers.
///
/// # Example
///
/// ```rust,ignore
/// #[layout("/")]
/// fn RootLayout(children: impl Fn() -> View) -> impl IntoView {
///     view! {
///         <header>"My App"</header>
///         <main>{children()}</main>
///         <footer>"© 2024"</footer>
///     }
/// }
///
/// #[layout("/dashboard")]
/// fn DashboardLayout(children: impl Fn() -> View) -> impl IntoView {
///     view! {
///         <aside>"Sidebar"</aside>
///         <div class="content">{children()}</div>
///     }
/// }
/// ```
#[proc_macro_attribute]
pub fn layout(args: TokenStream, input: TokenStream) -> TokenStream {
    routing::layout_impl(args, input)
}

/// Define an API route handler.
///
/// Creates a server-side API endpoint with the specified HTTP method.
///
/// # Example
///
/// ```rust,ignore
/// #[api(GET)]
/// async fn get_users(req: Request) -> Response {
///     let users = db::get_all_users().await;
///     json_response(users)
/// }
///
/// #[api(POST)]
/// async fn create_user(req: Request) -> Response {
///     let body: CreateUser = req.json().await?;
///     let user = db::create_user(body).await;
///     json_response(user)
/// }
///
/// #[api(DELETE)]
/// async fn delete_user(req: Request) -> Response {
///     let id = req.param("id");
///     db::delete_user(id).await;
///     no_content()
/// }
/// ```
#[proc_macro_attribute]
pub fn api(args: TokenStream, input: TokenStream) -> TokenStream {
    routing::api_impl(args, input)
}

/// Extract typed path parameters from the current route.
///
/// # Example
///
/// ```rust,ignore
/// #[derive(Debug, Clone, Deserialize)]
/// struct PostParams {
///     id: i32,
///     slug: String,
/// }
///
/// #[route("/posts/:id/:slug")]
/// fn PostPage() -> impl IntoView {
///     let params = use_params!(PostParams);
///
///     view! {
///         <h1>"Post " {params.id} ": " {params.slug}</h1>
///     }
/// }
/// ```
#[proc_macro]
pub fn use_params(input: TokenStream) -> TokenStream {
    routing::use_params_impl(input)
}

/// Extract typed query parameters from the current URL.
///
/// # Example
///
/// ```rust,ignore
/// #[derive(Debug, Clone, Deserialize)]
/// struct SearchQuery {
///     q: String,
///     page: Option<u32>,
///     sort: Option<String>,
/// }
///
/// #[route("/search")]
/// fn SearchPage() -> impl IntoView {
///     let query = use_query!(SearchQuery);
///
///     view! {
///         <h1>"Search: " {query.q}</h1>
///         <p>"Page: " {query.page.unwrap_or(1)}</p>
///     }
/// }
/// ```
#[proc_macro]
pub fn use_query(input: TokenStream) -> TokenStream {
    routing::use_query_impl(input)
}

/// Navigate to a route programmatically.
///
/// # Example
///
/// ```rust,ignore
/// fn handle_login_success(user_id: i32) {
///     navigate!("/dashboard");
///     // Or with dynamic path:
///     // philjs::router::navigate(&format!("/users/{}", user_id));
/// }
/// ```
#[proc_macro]
pub fn navigate(input: TokenStream) -> TokenStream {
    routing::navigate_impl(input)
}

/// Redirect to another route (returns from the current function).
///
/// # Example
///
/// ```rust,ignore
/// #[route("/protected")]
/// async fn ProtectedPage() -> impl IntoView {
///     let user = get_current_user().await;
///     if user.is_none() {
///         redirect!("/login");
///     }
///
///     view! { <h1>"Protected Content"</h1> }
/// }
/// ```
#[proc_macro]
pub fn redirect(input: TokenStream) -> TokenStream {
    routing::redirect_impl(input)
}
