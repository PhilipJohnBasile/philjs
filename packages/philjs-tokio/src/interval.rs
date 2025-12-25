//! Interval utilities for periodic tasks

use std::future::Future;
use std::time::Duration;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tokio::task::JoinHandle;

/// Spawn a periodic task
pub fn spawn_interval<F, Fut>(period: Duration, f: F) -> IntervalHandle
where
    F: Fn() -> Fut + Send + Sync + 'static,
    Fut: Future<Output = ()> + Send,
{
    let running = Arc::new(AtomicBool::new(true));
    let running_clone = running.clone();

    let handle = tokio::spawn(async move {
        let mut interval = tokio::time::interval(period);

        while running_clone.load(Ordering::Relaxed) {
            interval.tick().await;
            if running_clone.load(Ordering::Relaxed) {
                f().await;
            }
        }
    });

    IntervalHandle::new(handle, running)
}

/// Spawn a periodic task with initial delay
pub fn spawn_interval_with_delay<F, Fut>(
    initial_delay: Duration,
    period: Duration,
    f: F,
) -> IntervalHandle
where
    F: Fn() -> Fut + Send + Sync + 'static,
    Fut: Future<Output = ()> + Send,
{
    let running = Arc::new(AtomicBool::new(true));
    let running_clone = running.clone();

    let handle = tokio::spawn(async move {
        tokio::time::sleep(initial_delay).await;

        let mut interval = tokio::time::interval(period);

        while running_clone.load(Ordering::Relaxed) {
            interval.tick().await;
            if running_clone.load(Ordering::Relaxed) {
                f().await;
            }
        }
    });

    IntervalHandle::new(handle, running)
}

/// Spawn a task that runs at most N times
pub fn spawn_interval_n<F, Fut>(period: Duration, count: u32, f: F) -> IntervalHandle
where
    F: Fn() -> Fut + Send + Sync + 'static,
    Fut: Future<Output = ()> + Send,
{
    let running = Arc::new(AtomicBool::new(true));
    let running_clone = running.clone();

    let handle = tokio::spawn(async move {
        let mut interval = tokio::time::interval(period);
        let mut remaining = count;

        while remaining > 0 && running_clone.load(Ordering::Relaxed) {
            interval.tick().await;
            if running_clone.load(Ordering::Relaxed) {
                f().await;
                remaining -= 1;
            }
        }

        running_clone.store(false, Ordering::Relaxed);
    });

    IntervalHandle::new(handle, running)
}

/// Handle for controlling an interval task
pub struct IntervalHandle {
    handle: JoinHandle<()>,
    running: Arc<AtomicBool>,
}

impl IntervalHandle {
    /// Create a new interval handle
    pub fn new(handle: JoinHandle<()>, running: Arc<AtomicBool>) -> Self {
        Self { handle, running }
    }

    /// Check if the interval is still running
    pub fn is_running(&self) -> bool {
        self.running.load(Ordering::Relaxed) && !self.handle.is_finished()
    }

    /// Stop the interval
    pub fn stop(&self) {
        self.running.store(false, Ordering::Relaxed);
    }

    /// Abort the interval immediately
    pub fn abort(&self) {
        self.running.store(false, Ordering::Relaxed);
        self.handle.abort();
    }

    /// Wait for the interval to complete
    pub async fn join(self) -> Result<(), tokio::task::JoinError> {
        self.handle.await
    }

    /// Stop and wait for the interval to complete
    pub async fn stop_and_join(self) -> Result<(), tokio::task::JoinError> {
        self.stop();
        self.handle.await
    }
}

/// Interval builder for more complex scheduling
pub struct IntervalBuilder<F, Fut>
where
    F: Fn() -> Fut + Send + Sync + 'static,
    Fut: Future<Output = ()> + Send,
{
    period: Duration,
    initial_delay: Option<Duration>,
    max_count: Option<u32>,
    on_error: Option<Box<dyn Fn() + Send + Sync>>,
    f: F,
}

impl<F, Fut> IntervalBuilder<F, Fut>
where
    F: Fn() -> Fut + Send + Sync + 'static,
    Fut: Future<Output = ()> + Send,
{
    /// Create a new interval builder
    pub fn new(period: Duration, f: F) -> Self {
        Self {
            period,
            initial_delay: None,
            max_count: None,
            on_error: None,
            f,
        }
    }

    /// Set initial delay
    pub fn initial_delay(mut self, delay: Duration) -> Self {
        self.initial_delay = Some(delay);
        self
    }

    /// Set maximum execution count
    pub fn max_count(mut self, count: u32) -> Self {
        self.max_count = Some(count);
        self
    }

    /// Spawn the interval
    pub fn spawn(self) -> IntervalHandle {
        let running = Arc::new(AtomicBool::new(true));
        let running_clone = running.clone();

        let period = self.period;
        let initial_delay = self.initial_delay;
        let max_count = self.max_count;
        let f = self.f;

        let handle = tokio::spawn(async move {
            if let Some(delay) = initial_delay {
                tokio::time::sleep(delay).await;
            }

            let mut interval = tokio::time::interval(period);
            let mut count = 0u32;

            loop {
                if !running_clone.load(Ordering::Relaxed) {
                    break;
                }

                if let Some(max) = max_count {
                    if count >= max {
                        break;
                    }
                }

                interval.tick().await;

                if running_clone.load(Ordering::Relaxed) {
                    f().await;
                    count += 1;
                }
            }

            running_clone.store(false, Ordering::Relaxed);
        });

        IntervalHandle::new(handle, running)
    }
}

/// Cron-like scheduler (simplified)
pub struct Scheduler {
    tasks: Vec<ScheduledTask>,
}

struct ScheduledTask {
    name: String,
    period: Duration,
    handle: Option<IntervalHandle>,
}

impl Default for Scheduler {
    fn default() -> Self {
        Self::new()
    }
}

impl Scheduler {
    /// Create a new scheduler
    pub fn new() -> Self {
        Self { tasks: Vec::new() }
    }

    /// Add a task to the scheduler
    pub fn add_task<F, Fut>(&mut self, name: impl Into<String>, period: Duration, f: F)
    where
        F: Fn() -> Fut + Send + Sync + 'static,
        Fut: Future<Output = ()> + Send + 'static,
    {
        let handle = spawn_interval(period, f);
        self.tasks.push(ScheduledTask {
            name: name.into(),
            period,
            handle: Some(handle),
        });
    }

    /// Get task names
    pub fn task_names(&self) -> Vec<&str> {
        self.tasks.iter().map(|t| t.name.as_str()).collect()
    }

    /// Stop a task by name
    pub fn stop_task(&mut self, name: &str) {
        if let Some(task) = self.tasks.iter_mut().find(|t| t.name == name) {
            if let Some(handle) = task.handle.take() {
                handle.stop();
            }
        }
    }

    /// Stop all tasks
    pub fn stop_all(&mut self) {
        for task in &mut self.tasks {
            if let Some(handle) = task.handle.take() {
                handle.stop();
            }
        }
    }

    /// Check if a task is running
    pub fn is_running(&self, name: &str) -> bool {
        self.tasks
            .iter()
            .find(|t| t.name == name)
            .and_then(|t| t.handle.as_ref())
            .map(|h| h.is_running())
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::AtomicU32;

    #[tokio::test]
    async fn test_spawn_interval() {
        let counter = Arc::new(AtomicU32::new(0));
        let counter_clone = counter.clone();

        let handle = spawn_interval(Duration::from_millis(10), move || {
            let counter = counter_clone.clone();
            async move {
                counter.fetch_add(1, Ordering::Relaxed);
            }
        });

        tokio::time::sleep(Duration::from_millis(55)).await;
        handle.stop();

        let count = counter.load(Ordering::Relaxed);
        assert!(count >= 4 && count <= 6, "Count was {}", count);
    }

    #[tokio::test]
    async fn test_spawn_interval_n() {
        let counter = Arc::new(AtomicU32::new(0));
        let counter_clone = counter.clone();

        let handle = spawn_interval_n(Duration::from_millis(10), 3, move || {
            let counter = counter_clone.clone();
            async move {
                counter.fetch_add(1, Ordering::Relaxed);
            }
        });

        tokio::time::sleep(Duration::from_millis(100)).await;

        let count = counter.load(Ordering::Relaxed);
        assert_eq!(count, 3);
        assert!(!handle.is_running());
    }

    #[tokio::test]
    async fn test_interval_handle_stop() {
        let counter = Arc::new(AtomicU32::new(0));
        let counter_clone = counter.clone();

        let handle = spawn_interval(Duration::from_millis(10), move || {
            let counter = counter_clone.clone();
            async move {
                counter.fetch_add(1, Ordering::Relaxed);
            }
        });

        tokio::time::sleep(Duration::from_millis(25)).await;
        handle.stop();

        let count_at_stop = counter.load(Ordering::Relaxed);
        tokio::time::sleep(Duration::from_millis(50)).await;

        // Count should not increase much after stop
        let final_count = counter.load(Ordering::Relaxed);
        assert!(final_count <= count_at_stop + 1);
    }
}
