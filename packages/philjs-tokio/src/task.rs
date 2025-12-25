//! Task spawning and management

use std::collections::HashMap;
use std::future::Future;
use std::sync::Arc;
use parking_lot::RwLock;
use tokio::task::JoinHandle;

/// Spawn a named task
pub fn spawn_task<F, T>(name: &str, future: F) -> TaskHandle<T>
where
    F: Future<Output = T> + Send + 'static,
    T: Send + 'static,
{
    let name = name.to_string();
    let handle = tokio::spawn(async move {
        #[cfg(feature = "tracing")]
        tracing::debug!(task = %name, "Task started");

        let result = future.await;

        #[cfg(feature = "tracing")]
        tracing::debug!(task = %name, "Task completed");

        result
    });

    TaskHandle::new(handle)
}

/// Spawn a blocking task
pub fn spawn_blocking_task<F, T>(name: &str, f: F) -> TaskHandle<T>
where
    F: FnOnce() -> T + Send + 'static,
    T: Send + 'static,
{
    let name = name.to_string();
    let handle = tokio::task::spawn_blocking(move || {
        #[cfg(feature = "tracing")]
        tracing::debug!(task = %name, "Blocking task started");

        let result = f();

        #[cfg(feature = "tracing")]
        tracing::debug!(task = %name, "Blocking task completed");

        result
    });

    TaskHandle::new(handle)
}

/// Task handle wrapper
pub struct TaskHandle<T> {
    handle: JoinHandle<T>,
}

impl<T> TaskHandle<T> {
    /// Create a new task handle
    pub fn new(handle: JoinHandle<T>) -> Self {
        Self { handle }
    }

    /// Check if the task is finished
    pub fn is_finished(&self) -> bool {
        self.handle.is_finished()
    }

    /// Abort the task
    pub fn abort(&self) {
        self.handle.abort();
    }

    /// Wait for the task to complete
    pub async fn join(self) -> Result<T, tokio::task::JoinError> {
        self.handle.await
    }

    /// Get the inner handle
    pub fn into_inner(self) -> JoinHandle<T> {
        self.handle
    }
}

/// Task manager for tracking multiple tasks
pub struct TaskManager {
    tasks: Arc<RwLock<HashMap<String, TaskEntry>>>,
}

struct TaskEntry {
    handle: tokio::task::AbortHandle,
    spawned_at: std::time::Instant,
}

impl Default for TaskManager {
    fn default() -> Self {
        Self::new()
    }
}

impl TaskManager {
    /// Create a new task manager
    pub fn new() -> Self {
        Self {
            tasks: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Spawn and track a task
    pub fn spawn<F, T>(&self, name: impl Into<String>, future: F) -> TaskHandle<T>
    where
        F: Future<Output = T> + Send + 'static,
        T: Send + 'static,
    {
        let name = name.into();
        let tasks = self.tasks.clone();
        let task_name = name.clone();

        let handle = tokio::spawn(async move {
            let result = future.await;

            // Remove from tracked tasks
            tasks.write().remove(&task_name);

            result
        });

        // Track the task
        self.tasks.write().insert(name, TaskEntry {
            handle: handle.abort_handle(),
            spawned_at: std::time::Instant::now(),
        });

        TaskHandle::new(handle)
    }

    /// Get the number of active tasks
    pub fn active_count(&self) -> usize {
        self.tasks.read().len()
    }

    /// Get all task names
    pub fn task_names(&self) -> Vec<String> {
        self.tasks.read().keys().cloned().collect()
    }

    /// Check if a task exists
    pub fn has_task(&self, name: &str) -> bool {
        self.tasks.read().contains_key(name)
    }

    /// Abort a specific task
    pub fn abort(&self, name: &str) -> bool {
        if let Some(entry) = self.tasks.write().remove(name) {
            entry.handle.abort();
            true
        } else {
            false
        }
    }

    /// Abort all tasks
    pub fn abort_all(&self) {
        let mut tasks = self.tasks.write();
        for (_, entry) in tasks.drain() {
            entry.handle.abort();
        }
    }

    /// Get task statistics
    pub fn stats(&self) -> TaskStats {
        let tasks = self.tasks.read();
        let now = std::time::Instant::now();

        let mut total_age = std::time::Duration::ZERO;
        for entry in tasks.values() {
            total_age += now.duration_since(entry.spawned_at);
        }

        TaskStats {
            active_tasks: tasks.len(),
            average_age: if tasks.is_empty() {
                std::time::Duration::ZERO
            } else {
                total_age / tasks.len() as u32
            },
        }
    }
}

/// Task statistics
#[derive(Debug, Clone)]
pub struct TaskStats {
    /// Number of active tasks
    pub active_tasks: usize,
    /// Average task age
    pub average_age: std::time::Duration,
}

/// Task group for running multiple tasks together
pub struct TaskGroup<T> {
    handles: Vec<JoinHandle<T>>,
}

impl<T> Default for TaskGroup<T> {
    fn default() -> Self {
        Self::new()
    }
}

impl<T: Send + 'static> TaskGroup<T> {
    /// Create a new task group
    pub fn new() -> Self {
        Self {
            handles: Vec::new(),
        }
    }

    /// Add a task to the group
    pub fn spawn<F>(&mut self, future: F)
    where
        F: Future<Output = T> + Send + 'static,
    {
        self.handles.push(tokio::spawn(future));
    }

    /// Get the number of tasks
    pub fn len(&self) -> usize {
        self.handles.len()
    }

    /// Check if empty
    pub fn is_empty(&self) -> bool {
        self.handles.is_empty()
    }

    /// Wait for all tasks to complete
    pub async fn join_all(self) -> Vec<Result<T, tokio::task::JoinError>> {
        futures::future::join_all(self.handles).await
    }

    /// Abort all tasks
    pub fn abort_all(&self) {
        for handle in &self.handles {
            handle.abort();
        }
    }
}

/// Scoped task that aborts when dropped
pub struct ScopedTask<T> {
    handle: JoinHandle<T>,
}

impl<T> ScopedTask<T> {
    /// Create a scoped task
    pub fn new<F>(future: F) -> Self
    where
        F: Future<Output = T> + Send + 'static,
        T: Send + 'static,
    {
        Self {
            handle: tokio::spawn(future),
        }
    }

    /// Check if finished
    pub fn is_finished(&self) -> bool {
        self.handle.is_finished()
    }

    /// Wait for completion without dropping
    pub async fn join(self) -> Result<T, tokio::task::JoinError> {
        self.handle.await
    }
}

impl<T> Drop for ScopedTask<T> {
    fn drop(&mut self) {
        self.handle.abort();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_spawn_task() {
        let handle = spawn_task("test", async { 42 });
        let result = handle.join().await.unwrap();
        assert_eq!(result, 42);
    }

    #[tokio::test]
    async fn test_task_manager() {
        let manager = TaskManager::new();

        let _handle = manager.spawn("task1", async {
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            42
        });

        assert_eq!(manager.active_count(), 1);
        assert!(manager.has_task("task1"));

        // Wait a bit for task to complete
        tokio::time::sleep(std::time::Duration::from_millis(150)).await;

        assert_eq!(manager.active_count(), 0);
    }

    #[tokio::test]
    async fn test_task_group() {
        let mut group = TaskGroup::new();

        group.spawn(async { 1 });
        group.spawn(async { 2 });
        group.spawn(async { 3 });

        assert_eq!(group.len(), 3);

        let results = group.join_all().await;
        let values: Vec<_> = results.into_iter().map(|r| r.unwrap()).collect();

        assert_eq!(values, vec![1, 2, 3]);
    }

    #[tokio::test]
    async fn test_scoped_task() {
        let task = ScopedTask::new(async { 42 });
        let result = task.join().await.unwrap();
        assert_eq!(result, 42);
    }
}
