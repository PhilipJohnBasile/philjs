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
#[cfg(feature = "wasm")]
pub use hydration::{hydrate, hydrate_to, hydrate_to_body};
pub use hydration::{
    HydrationMode,
    HydrationContext,
    HydrationState,
    HydrationError,
    generate_hydration_script,
};
