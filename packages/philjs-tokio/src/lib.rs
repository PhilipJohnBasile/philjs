//! # PhilJS Tokio Integration
//!
//! Async runtime configuration, task spawning, and channel utilities for PhilJS.
//!
//! ## Features
//!
//! - **Runtime Configuration**: Easy setup for Tokio runtime
//! - **Task Spawning**: Helpers for spawning and managing async tasks
//! - **Channel Utilities**: Typed channels for component communication
//! - **Timeout Helpers**: Simplified timeout handling
//! - **Interval Helpers**: Easy periodic task execution
//!
//! ## Quick Start
//!
//! ```rust
//! use philjs_tokio::prelude::*;
//!
//! #[tokio::main]
//! async fn main() {
//!     // Spawn a background task
//!     let handle = spawn_task("fetch-data", async {
//!         // Do async work
//!         Ok::<_, Error>("done")
//!     });
//!
//!     // With timeout
//!     let result = with_timeout(Duration::from_secs(5), async {
//!         fetch_data().await
//!     }).await;
//!
//!     // Periodic task
//!     spawn_interval(Duration::from_secs(60), || async {
//!         cleanup_cache().await;
//!     });
//! }
//! ```

#![warn(missing_docs)]

pub mod runtime;
pub mod task;
pub mod channel;
pub mod timeout;
pub mod interval;
pub mod sync;

// Re-exports
pub use runtime::{RuntimeBuilder, RuntimeConfig};
pub use task::{spawn_task, spawn_blocking_task, TaskHandle, TaskManager};
pub use channel::{channel, broadcast, watch, Channel, Sender, Receiver};
pub use timeout::{with_timeout, TimeoutError};
pub use interval::{spawn_interval, IntervalHandle};
pub use sync::{Mutex, RwLock, Semaphore};

// Re-export tokio types
pub use tokio::{
    spawn, task::JoinHandle,
    time::{sleep, Duration, Instant, interval as tokio_interval},
    sync::{mpsc, oneshot, broadcast as tokio_broadcast, watch as tokio_watch},
    select, join, try_join,
};

/// Prelude - import commonly used items
pub mod prelude {
    pub use crate::runtime::{RuntimeBuilder, RuntimeConfig};
    pub use crate::task::{spawn_task, spawn_blocking_task, TaskHandle, TaskManager};
    pub use crate::channel::{channel, broadcast, watch};
    pub use crate::timeout::{with_timeout, TimeoutError};
    pub use crate::interval::{spawn_interval, IntervalHandle};
    pub use crate::sync::{Mutex, RwLock, Semaphore};

    pub use tokio::{
        spawn,
        time::{sleep, Duration, Instant},
        select, join, try_join,
    };

    // Re-export PhilJS
    pub use philjs::prelude::*;
}
