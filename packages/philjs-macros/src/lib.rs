//! PhilJS Macros - Procedural macros for PhilJS
//!
//! This crate provides ergonomic procedural macros for building reactive web applications
//! with PhilJS. It includes macros for components, signals, props, views, and server functions.
//!
//! # Available Macros
//!
//! - `#[component]` - Transform functions into PhilJS components
//! - `#[signal]` - Create reactive signals from struct fields
//! - `#[derive(Props)]` - Derive Props trait for component props
//! - `view!` - JSX-like syntax for building UI in Rust
//! - `#[server]` - Mark functions as server-only with RPC generation
//!
//! # Example
//!
//! ```rust,ignore
//! use philjs_macros::{component, view, Props};
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
//! ```

use proc_macro::TokenStream;

mod component;
mod props;
mod server;
mod signal;
mod view;
mod utils;

/// Transform a function into a PhilJS component.
///
/// This macro converts a function into a reusable component with proper
/// display name generation and props handling.
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
/// ```
#[proc_macro_attribute]
pub fn component(args: TokenStream, input: TokenStream) -> TokenStream {
    component::component_impl(args, input)
}

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
/// ```
#[proc_macro_attribute]
pub fn signal(args: TokenStream, input: TokenStream) -> TokenStream {
    signal::signal_impl(args, input)
}

/// Derive the Props trait for component props.
///
/// This macro handles optional props with defaults and validates prop types
/// at compile time.
///
/// # Example
///
/// ```rust,ignore
/// #[derive(Props)]
/// struct ButtonProps {
///     text: String,
///     #[prop(default = "primary")]
///     variant: &'static str,
///     #[prop(optional)]
///     on_click: Option<Callback<()>>,
/// }
/// ```
#[proc_macro_derive(Props, attributes(prop))]
pub fn derive_props(input: TokenStream) -> TokenStream {
    props::derive_props_impl(input)
}

/// JSX-like syntax for building UI in Rust.
///
/// This macro provides a familiar JSX-like syntax that compiles to efficient
/// PhilJS render calls. Supports expressions, conditionals, and loops.
///
/// # Example
///
/// ```rust,ignore
/// let items = vec!["Apple", "Banana", "Cherry"];
/// let show_header = true;
///
/// view! {
///     <div class="container">
///         {show_header.then(|| view! {
///             <h1>"Fruit List"</h1>
///         })}
///         <ul>
///             {items.iter().map(|item| view! {
///                 <li>{item}</li>
///             }).collect::<Vec<_>>()}
///         </ul>
///     </div>
/// }
/// ```
#[proc_macro]
pub fn view(input: TokenStream) -> TokenStream {
    view::view_impl(input)
}

/// Mark functions as server-only with automatic RPC generation.
///
/// This macro generates client-side RPC calls for server functions,
/// enabling seamless client-server communication.
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
/// // On the client:
/// let user = fetch_user(42).await?;
/// ```
#[proc_macro_attribute]
pub fn server(args: TokenStream, input: TokenStream) -> TokenStream {
    server::server_impl(args, input)
}
