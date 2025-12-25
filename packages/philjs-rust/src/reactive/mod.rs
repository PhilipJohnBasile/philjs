//! Reactive primitives for PhilJS
//!
//! This module provides the core reactive system:
//! - `Signal` - Reactive state container
//! - `Memo` - Computed/derived values
//! - `Effect` - Side effects that react to changes
//! - `Resource` - Async data fetching with loading states
//! - `Context` - Dependency injection

pub mod signal;
pub mod memo;
pub mod effect;
pub mod resource;
pub mod batch;
pub mod context;
pub mod runtime;

pub use signal::Signal;
pub use memo::Memo;
pub use effect::Effect;
pub use resource::Resource;
pub use batch::batch;
pub use context::{provide_context, use_context, Context};
