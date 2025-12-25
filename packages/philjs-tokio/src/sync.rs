//! Synchronization primitives

use std::ops::{Deref, DerefMut};
use std::sync::Arc;
use tokio::sync::{
    Mutex as TokioMutex, MutexGuard as TokioMutexGuard,
    RwLock as TokioRwLock, RwLockReadGuard, RwLockWriteGuard,
    Semaphore as TokioSemaphore, SemaphorePermit, OwnedSemaphorePermit,
};

/// Async mutex wrapper
pub struct Mutex<T> {
    inner: TokioMutex<T>,
}

impl<T> Mutex<T> {
    /// Create a new mutex
    pub fn new(value: T) -> Self {
        Self {
            inner: TokioMutex::new(value),
        }
    }

    /// Lock the mutex
    pub async fn lock(&self) -> MutexGuard<'_, T> {
        MutexGuard {
            inner: self.inner.lock().await,
        }
    }

    /// Try to lock the mutex without waiting
    pub fn try_lock(&self) -> Option<MutexGuard<'_, T>> {
        self.inner.try_lock().ok().map(|guard| MutexGuard { inner: guard })
    }

    /// Get the inner value, consuming the mutex
    pub fn into_inner(self) -> T {
        self.inner.into_inner()
    }
}

/// Mutex guard wrapper
pub struct MutexGuard<'a, T> {
    inner: TokioMutexGuard<'a, T>,
}

impl<'a, T> Deref for MutexGuard<'a, T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl<'a, T> DerefMut for MutexGuard<'a, T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}

/// Async read-write lock
pub struct RwLock<T> {
    inner: TokioRwLock<T>,
}

impl<T> RwLock<T> {
    /// Create a new read-write lock
    pub fn new(value: T) -> Self {
        Self {
            inner: TokioRwLock::new(value),
        }
    }

    /// Acquire a read lock
    pub async fn read(&self) -> ReadGuard<'_, T> {
        ReadGuard {
            inner: self.inner.read().await,
        }
    }

    /// Try to acquire a read lock without waiting
    pub fn try_read(&self) -> Option<ReadGuard<'_, T>> {
        self.inner.try_read().ok().map(|guard| ReadGuard { inner: guard })
    }

    /// Acquire a write lock
    pub async fn write(&self) -> WriteGuard<'_, T> {
        WriteGuard {
            inner: self.inner.write().await,
        }
    }

    /// Try to acquire a write lock without waiting
    pub fn try_write(&self) -> Option<WriteGuard<'_, T>> {
        self.inner.try_write().ok().map(|guard| WriteGuard { inner: guard })
    }

    /// Get the inner value, consuming the lock
    pub fn into_inner(self) -> T {
        self.inner.into_inner()
    }
}

/// Read guard wrapper
pub struct ReadGuard<'a, T> {
    inner: RwLockReadGuard<'a, T>,
}

impl<'a, T> Deref for ReadGuard<'a, T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

/// Write guard wrapper
pub struct WriteGuard<'a, T> {
    inner: RwLockWriteGuard<'a, T>,
}

impl<'a, T> Deref for WriteGuard<'a, T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl<'a, T> DerefMut for WriteGuard<'a, T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}

/// Semaphore for limiting concurrent access
pub struct Semaphore {
    inner: Arc<TokioSemaphore>,
}

impl Semaphore {
    /// Create a new semaphore with the given number of permits
    pub fn new(permits: usize) -> Self {
        Self {
            inner: Arc::new(TokioSemaphore::new(permits)),
        }
    }

    /// Acquire a permit
    pub async fn acquire(&self) -> SemaphoreGuard<'_> {
        SemaphoreGuard {
            inner: self.inner.acquire().await.expect("Semaphore closed"),
        }
    }

    /// Try to acquire a permit without waiting
    pub fn try_acquire(&self) -> Option<SemaphoreGuard<'_>> {
        self.inner.try_acquire().ok().map(|permit| SemaphoreGuard { inner: permit })
    }

    /// Acquire an owned permit
    pub async fn acquire_owned(self: &Arc<Self>) -> OwnedSemaphoreGuard {
        OwnedSemaphoreGuard {
            inner: self.inner.clone().acquire_owned().await.expect("Semaphore closed"),
        }
    }

    /// Get the number of available permits
    pub fn available_permits(&self) -> usize {
        self.inner.available_permits()
    }

    /// Add permits
    pub fn add_permits(&self, n: usize) {
        self.inner.add_permits(n);
    }

    /// Close the semaphore
    pub fn close(&self) {
        self.inner.close();
    }

    /// Check if the semaphore is closed
    pub fn is_closed(&self) -> bool {
        self.inner.is_closed()
    }
}

impl Clone for Semaphore {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

/// Semaphore guard
pub struct SemaphoreGuard<'a> {
    inner: SemaphorePermit<'a>,
}

/// Owned semaphore guard
pub struct OwnedSemaphoreGuard {
    inner: OwnedSemaphorePermit,
}

/// Rate limiter based on semaphore
pub struct RateLimiter {
    semaphore: Arc<Semaphore>,
    refill_interval: std::time::Duration,
    max_permits: usize,
}

impl RateLimiter {
    /// Create a new rate limiter
    pub fn new(permits_per_interval: usize, interval: std::time::Duration) -> Self {
        let semaphore = Arc::new(Semaphore::new(permits_per_interval));
        let semaphore_clone = semaphore.clone();
        let max_permits = permits_per_interval;

        // Spawn refill task
        tokio::spawn(async move {
            let mut ticker = tokio::time::interval(interval);
            loop {
                ticker.tick().await;
                let available = semaphore_clone.available_permits();
                if available < max_permits {
                    semaphore_clone.add_permits(max_permits - available);
                }
            }
        });

        Self {
            semaphore,
            refill_interval: interval,
            max_permits,
        }
    }

    /// Acquire a permit (waits if rate limited)
    pub async fn acquire(&self) -> SemaphoreGuard<'_> {
        self.semaphore.acquire().await
    }

    /// Try to acquire without waiting
    pub fn try_acquire(&self) -> Option<SemaphoreGuard<'_>> {
        self.semaphore.try_acquire()
    }

    /// Get available permits
    pub fn available(&self) -> usize {
        self.semaphore.available_permits()
    }

    /// Get the refill interval
    pub fn refill_interval(&self) -> std::time::Duration {
        self.refill_interval
    }

    /// Get max permits
    pub fn max_permits(&self) -> usize {
        self.max_permits
    }
}

/// Barrier for synchronizing multiple tasks
pub struct Barrier {
    inner: tokio::sync::Barrier,
}

impl Barrier {
    /// Create a new barrier
    pub fn new(n: usize) -> Self {
        Self {
            inner: tokio::sync::Barrier::new(n),
        }
    }

    /// Wait at the barrier
    pub async fn wait(&self) -> BarrierWaitResult {
        let result = self.inner.wait().await;
        BarrierWaitResult {
            is_leader: result.is_leader(),
        }
    }
}

/// Barrier wait result
pub struct BarrierWaitResult {
    is_leader: bool,
}

impl BarrierWaitResult {
    /// Check if this task is the leader
    pub fn is_leader(&self) -> bool {
        self.is_leader
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mutex() {
        let mutex = Mutex::new(0);

        {
            let mut guard = mutex.lock().await;
            *guard = 42;
        }

        let guard = mutex.lock().await;
        assert_eq!(*guard, 42);
    }

    #[tokio::test]
    async fn test_rwlock() {
        let lock = RwLock::new(0);

        {
            let mut guard = lock.write().await;
            *guard = 42;
        }

        let guard = lock.read().await;
        assert_eq!(*guard, 42);
    }

    #[tokio::test]
    async fn test_semaphore() {
        let semaphore = Semaphore::new(2);

        assert_eq!(semaphore.available_permits(), 2);

        let _guard1 = semaphore.acquire().await;
        assert_eq!(semaphore.available_permits(), 1);

        let _guard2 = semaphore.acquire().await;
        assert_eq!(semaphore.available_permits(), 0);

        drop(_guard1);
        assert_eq!(semaphore.available_permits(), 1);
    }

    #[tokio::test]
    async fn test_barrier() {
        let barrier = Arc::new(Barrier::new(2));
        let barrier_clone = barrier.clone();

        let handle = tokio::spawn(async move {
            barrier_clone.wait().await
        });

        let result = barrier.wait().await;
        let other_result = handle.await.unwrap();

        // Exactly one should be the leader
        assert!(result.is_leader() != other_result.is_leader());
    }
}
