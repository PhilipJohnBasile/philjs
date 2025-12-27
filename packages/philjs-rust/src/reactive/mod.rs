//! Reactive primitives for PhilJS
//!
//! This module provides the core reactive system:
//! - `Signal` - Reactive state container
//! - `Memo` - Computed/derived values
//! - `Effect` - Side effects that react to changes
//! - `Resource` - Async data fetching with loading states
//! - `Context` - Dependency injection
//! - `Action` - Server mutations with pending state
//! - `RwSignal` - Combined read/write signal
//! - `StoredValue` - Non-reactive storage

pub mod signal;
pub mod memo;
pub mod effect;
pub mod resource;
pub mod batch;
pub mod context;
pub mod runtime;
pub mod action;
pub mod utils;

pub use signal::{Signal, ReadSignal, WriteSignal, create_signal};
pub use memo::Memo;
pub use effect::{Effect, watch};
pub use resource::{Resource, ResourceState, create_resource};
pub use batch::batch;
pub use context::{provide_context, use_context, Context};
pub use action::{Action, MultiAction, ActionError, create_action, create_server_action, create_multi_action};
pub use utils::{RwSignal, create_rw_signal, StoredValue, create_stored_value, Trigger, create_trigger, on_cleanup};
