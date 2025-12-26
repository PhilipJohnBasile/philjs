//! DOM bindings and utilities

pub mod node_ref;
pub mod event;
pub mod mount;
pub mod hydration;

#[cfg(feature = "wasm")]
pub mod wasm_bindings;

pub use node_ref::NodeRef;
pub use event::Event;
pub use mount::mount;

// Hydration exports
pub use hydration::{
    hydrate,
    hydrate_to,
    hydrate_to_body,
    HydrationMode,
    HydrationContext,
    HydrationState,
    HydrationError,
    generate_hydration_script,
};
