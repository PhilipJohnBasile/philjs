//! Tokio runtime configuration

use std::time::Duration;

/// Runtime configuration
#[derive(Clone, Debug)]
pub struct RuntimeConfig {
    /// Number of worker threads (None = CPU count)
    pub worker_threads: Option<usize>,
    /// Thread name prefix
    pub thread_name: String,
    /// Stack size per thread
    pub thread_stack_size: Option<usize>,
    /// Enable I/O driver
    pub enable_io: bool,
    /// Enable time driver
    pub enable_time: bool,
    /// Blocking thread pool size
    pub max_blocking_threads: usize,
    /// Thread keep-alive duration
    pub thread_keep_alive: Option<Duration>,
    /// Global task queue interval
    pub global_queue_interval: Option<u32>,
    /// Event interval
    pub event_interval: Option<u32>,
}

impl Default for RuntimeConfig {
    fn default() -> Self {
        Self {
            worker_threads: None,
            thread_name: "philjs-worker".to_string(),
            thread_stack_size: None,
            enable_io: true,
            enable_time: true,
            max_blocking_threads: 512,
            thread_keep_alive: Some(Duration::from_secs(10)),
            global_queue_interval: None,
            event_interval: None,
        }
    }
}

impl RuntimeConfig {
    /// Create a new runtime configuration
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the number of worker threads
    pub fn worker_threads(mut self, threads: usize) -> Self {
        self.worker_threads = Some(threads);
        self
    }

    /// Set the thread name prefix
    pub fn thread_name(mut self, name: impl Into<String>) -> Self {
        self.thread_name = name.into();
        self
    }

    /// Set the stack size per thread
    pub fn thread_stack_size(mut self, size: usize) -> Self {
        self.thread_stack_size = Some(size);
        self
    }

    /// Enable/disable I/O driver
    pub fn enable_io(mut self, enable: bool) -> Self {
        self.enable_io = enable;
        self
    }

    /// Enable/disable time driver
    pub fn enable_time(mut self, enable: bool) -> Self {
        self.enable_time = enable;
        self
    }

    /// Set max blocking threads
    pub fn max_blocking_threads(mut self, max: usize) -> Self {
        self.max_blocking_threads = max;
        self
    }

    /// Set thread keep-alive duration
    pub fn thread_keep_alive(mut self, duration: Duration) -> Self {
        self.thread_keep_alive = Some(duration);
        self
    }
}

/// Runtime builder
pub struct RuntimeBuilder {
    config: RuntimeConfig,
}

impl Default for RuntimeBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl RuntimeBuilder {
    /// Create a new runtime builder
    pub fn new() -> Self {
        Self {
            config: RuntimeConfig::default(),
        }
    }

    /// Create a runtime builder with custom config
    pub fn with_config(config: RuntimeConfig) -> Self {
        Self { config }
    }

    /// Set worker threads
    pub fn worker_threads(mut self, threads: usize) -> Self {
        self.config.worker_threads = Some(threads);
        self
    }

    /// Set thread name
    pub fn thread_name(mut self, name: impl Into<String>) -> Self {
        self.config.thread_name = name.into();
        self
    }

    /// Set max blocking threads
    pub fn max_blocking_threads(mut self, max: usize) -> Self {
        self.config.max_blocking_threads = max;
        self
    }

    /// Enable all features
    pub fn enable_all(mut self) -> Self {
        self.config.enable_io = true;
        self.config.enable_time = true;
        self
    }

    /// Build a multi-threaded runtime
    #[cfg(feature = "rt-multi-thread")]
    pub fn build_multi_thread(self) -> std::io::Result<tokio::runtime::Runtime> {
        let mut builder = tokio::runtime::Builder::new_multi_thread();

        if let Some(threads) = self.config.worker_threads {
            builder.worker_threads(threads);
        }

        builder.thread_name(&self.config.thread_name);

        if let Some(size) = self.config.thread_stack_size {
            builder.thread_stack_size(size);
        }

        if self.config.enable_io {
            builder.enable_io();
        }

        if self.config.enable_time {
            builder.enable_time();
        }

        builder.max_blocking_threads(self.config.max_blocking_threads);

        if let Some(duration) = self.config.thread_keep_alive {
            builder.thread_keep_alive(duration);
        }

        if let Some(interval) = self.config.global_queue_interval {
            builder.global_queue_interval(interval);
        }

        if let Some(interval) = self.config.event_interval {
            builder.event_interval(interval);
        }

        builder.build()
    }

    /// Build a current-thread runtime
    #[cfg(feature = "rt")]
    pub fn build_current_thread(self) -> std::io::Result<tokio::runtime::Runtime> {
        let mut builder = tokio::runtime::Builder::new_current_thread();

        builder.thread_name(&self.config.thread_name);

        if self.config.enable_io {
            builder.enable_io();
        }

        if self.config.enable_time {
            builder.enable_time();
        }

        if let Some(interval) = self.config.event_interval {
            builder.event_interval(interval);
        }

        builder.build()
    }

    /// Get the configuration
    pub fn config(&self) -> &RuntimeConfig {
        &self.config
    }
}

/// Runtime handle wrapper with utilities
pub struct RuntimeHandle {
    handle: tokio::runtime::Handle,
}

impl RuntimeHandle {
    /// Create from a Tokio handle
    pub fn new(handle: tokio::runtime::Handle) -> Self {
        Self { handle }
    }

    /// Get the current runtime handle
    pub fn current() -> Self {
        Self {
            handle: tokio::runtime::Handle::current(),
        }
    }

    /// Try to get the current runtime handle
    pub fn try_current() -> Option<Self> {
        tokio::runtime::Handle::try_current()
            .ok()
            .map(|h| Self { handle: h })
    }

    /// Spawn a task
    pub fn spawn<F>(&self, future: F) -> tokio::task::JoinHandle<F::Output>
    where
        F: std::future::Future + Send + 'static,
        F::Output: Send + 'static,
    {
        self.handle.spawn(future)
    }

    /// Spawn a blocking task
    pub fn spawn_blocking<F, R>(&self, f: F) -> tokio::task::JoinHandle<R>
    where
        F: FnOnce() -> R + Send + 'static,
        R: Send + 'static,
    {
        self.handle.spawn_blocking(f)
    }

    /// Block on a future
    pub fn block_on<F: std::future::Future>(&self, future: F) -> F::Output {
        self.handle.block_on(future)
    }

    /// Enter the runtime context
    pub fn enter(&self) -> tokio::runtime::EnterGuard<'_> {
        self.handle.enter()
    }

    /// Get the inner handle
    pub fn inner(&self) -> &tokio::runtime::Handle {
        &self.handle
    }
}

impl Clone for RuntimeHandle {
    fn clone(&self) -> Self {
        Self {
            handle: self.handle.clone(),
        }
    }
}

impl From<tokio::runtime::Handle> for RuntimeHandle {
    fn from(handle: tokio::runtime::Handle) -> Self {
        Self::new(handle)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_runtime_config() {
        let config = RuntimeConfig::new()
            .worker_threads(4)
            .thread_name("test-worker")
            .max_blocking_threads(100);

        assert_eq!(config.worker_threads, Some(4));
        assert_eq!(config.thread_name, "test-worker");
        assert_eq!(config.max_blocking_threads, 100);
    }

    #[test]
    fn test_runtime_builder() {
        let builder = RuntimeBuilder::new()
            .worker_threads(2)
            .thread_name("builder-test");

        assert_eq!(builder.config().worker_threads, Some(2));
    }
}
