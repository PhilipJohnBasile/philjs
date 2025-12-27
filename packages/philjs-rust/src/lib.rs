//! # PhilJS - Pure Rust UI Framework
//!
//! Write reactive UI components in pure Rust with fine-grained reactivity.
//! Compile to WebAssembly for the browser or render on the server.
//!
//! ## Features
//!
//! - **Fine-grained Reactivity**: Signals, memos, and effects
//! - **JSX-like Syntax**: `view!` macro for ergonomic UI authoring
//! - **Component Model**: Props, children, and composition
//! - **SSR Support**: Server-side rendering with hydration
//! - **WASM-first**: Optimized for WebAssembly deployment
//! - **Type-safe Routing**: File-based routing with compile-time safety
//! - **Server Functions**: RPC-style server/client communication
//! - **Data Fetching**: TanStack Query-style caching and mutations
//!
//! ## Quick Start
//!
//! ```rust
//! use philjs::prelude::*;
//!
//! #[component]
//! fn Counter(initial: i32) -> impl IntoView {
//!     let count = signal!(initial);
//!
//!     view! {
//!         <div class="counter">
//!             <h1>"Count: " {count}</h1>
//!             <button on:click=move |_| count.set(count.get() + 1)>
//!                 "+"
//!             </button>
//!             <button on:click=move |_| count.set(count.get() - 1)>
//!                 "-"
//!             </button>
//!         </div>
//!     }
//! }
//!
//! fn main() {
//!     mount(|| view! { <Counter initial=0 /> });
//! }
//! ```
//!
//! ## Server Functions
//!
//! ```rust
//! use philjs::server::*;
//!
//! #[server]
//! async fn get_user(id: u64) -> ServerResult<User> {
//!     let user = db.find_user(id).await?;
//!     Ok(user)
//! }
//! ```
//!
//! ## Type-safe Routing
//!
//! ```rust
//! use philjs::router::*;
//!
//! let routes = routes![
//!     ("/" => HomePage),
//!     ("/users/:id" => UserPage),
//!     ("/posts/*rest" => PostsPage),
//! ];
//! ```
//!
//! ## Data Fetching
//!
//! ```rust
//! use philjs::query::*;
//!
//! let users = use_query(["users"], || async { fetch_users().await });
//! ```
//!
//! ## LiveView (Server-Driven UI)
//!
//! ```rust
//! use philjs::liveview::*;
//!
//! struct Counter { count: Signal<i32> }
//!
//! impl LiveView for Counter {
//!     fn mount(&mut self, socket: &mut LiveSocket) {
//!         // Initialize state
//!     }
//!
//!     fn handle_event(&mut self, event: &LiveEvent, socket: &mut LiveSocket) {
//!         match event.event_type.as_str() {
//!             "increment" => self.count.update(|c| *c += 1),
//!             "decrement" => self.count.update(|c| *c -= 1),
//!             _ => {}
//!         }
//!     }
//!
//!     fn render(&self) -> String {
//!         format!(r#"
//!             <div>
//!                 <h1>Count: {}</h1>
//!                 <button live:click="increment">+</button>
//!                 <button live:click="decrement">-</button>
//!             </div>
//!         "#, self.count.get())
//!     }
//! }
//! ```

#![warn(missing_docs)]
#![allow(clippy::type_complexity)]

pub mod reactive;
pub mod view;
pub mod dom;
pub mod runtime;
pub mod ssr;
pub mod router;
pub mod server;
pub mod query;
pub mod liveview;
pub mod meta;
pub mod store;

#[cfg(feature = "wasm")]
pub mod wasm;

// Re-export macros
pub use philjs_macros::{component, effect, memo, resource, signal, view, Store};

// Re-export core types
pub use reactive::{
    signal::Signal,
    memo::Memo,
    effect::Effect,
    resource::Resource,
    batch::batch,
    context::{provide_context, use_context, Context},
};

pub use view::{
    element::Element,
    text::Text,
    fragment::Fragment,
    dynamic::Dynamic,
    children::Children,
    into_view::IntoView,
    view::View,
};

pub use dom::{
    node_ref::NodeRef,
    event::Event,
    mount::mount,
};

pub use ssr::{
    render_to_string,
    render_to_stream,
    render_to_stream_async,
    StreamingConfig,
    HydrationScript,
};

// Hydration exports
pub use dom::{
    hydrate,
    hydrate_to,
    hydrate_to_body,
    HydrationMode,
    HydrationContext,
    HydrationState,
    generate_hydration_script,
};

// Server function exports
pub use server::functions::{
    ServerResult,
    ServerError,
    ServerFnConfig,
    server_fn,
};

/// Prelude module - import everything you need
pub mod prelude {
    pub use crate::reactive::{
        signal::Signal,
        memo::Memo,
        effect::Effect,
        resource::Resource,
        batch::batch,
        context::{provide_context, use_context},
    };

    pub use crate::view::{
        element::Element,
        text::Text,
        fragment::Fragment,
        dynamic::Dynamic,
        children::Children,
        into_view::IntoView,
    };

    pub use crate::dom::{
        node_ref::NodeRef,
        event::Event,
        mount::mount,
    };

    pub use crate::ssr::{render_to_string, render_to_stream};

    pub use philjs_macros::{component, effect, memo, resource, signal, view, Store};
}

/// Spread attributes from a struct or HashMap
///
/// Note: Full spread attribute support requires compile-time type reflection.
/// For dynamic attribute spreading, use the `attrs!` macro or pass attributes
/// explicitly to components.
pub fn spread_attrs<T>(_attrs: T) -> Vec<(&'static str, Box<dyn Fn() -> String>)> {
    // Spread requires compile-time reflection; use attrs! macro for dynamic attributes
    Vec::new()
}

// =============================================================================
// Additional Leptos-Parity Exports
// =============================================================================

// Meta/Head management (leptos_meta equivalent)
pub use meta::{
    Title, TitleTemplate, Meta, Link, Style, Script, Html, Body,
    MetaContext, use_meta_context, with_meta_context,
};

// Store for deep reactive updates
pub use store::{Store, StoreField, StoreVec, StoreMap, create_store, produce};

// Action exports
pub use reactive::{
    Action, MultiAction, ActionError,
    create_action, create_server_action, create_multi_action,
    RwSignal, create_rw_signal,
    StoredValue, create_stored_value,
    Trigger, create_trigger,
    on_cleanup,
};

// Transition and Animation
pub use view::{
    Transition, TransitionConfig, use_transition, use_deferred_value,
    AnimatedShow, AnimatedShowConfig, AnimationState,
    fade, slide, scale,
};

// Router Form components
pub use router::form::{Form, FormMethod, FormData, ActionForm, MultiActionForm};
