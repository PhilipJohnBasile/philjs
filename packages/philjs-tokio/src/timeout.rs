//! Timeout utilities

use std::future::Future;
use std::time::Duration;
use std::fmt;

/// Timeout error
#[derive(Debug, Clone, Copy)]
pub struct TimeoutError {
    duration: Duration,
}

impl TimeoutError {
    /// Create a new timeout error
    pub fn new(duration: Duration) -> Self {
        Self { duration }
    }

    /// Get the timeout duration
    pub fn duration(&self) -> Duration {
        self.duration
    }
}

impl fmt::Display for TimeoutError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Operation timed out after {:?}", self.duration)
    }
}

impl std::error::Error for TimeoutError {}

/// Execute a future with a timeout
pub async fn with_timeout<F, T>(duration: Duration, future: F) -> Result<T, TimeoutError>
where
    F: Future<Output = T>,
{
    match tokio::time::timeout(duration, future).await {
        Ok(result) => Ok(result),
        Err(_) => Err(TimeoutError::new(duration)),
    }
}

/// Execute a future with a timeout, returning None on timeout
pub async fn with_timeout_optional<F, T>(duration: Duration, future: F) -> Option<T>
where
    F: Future<Output = T>,
{
    tokio::time::timeout(duration, future).await.ok()
}

/// Execute a future with retry on timeout
pub async fn with_timeout_retry<F, Fut, T>(
    duration: Duration,
    max_retries: u32,
    mut factory: F,
) -> Result<T, TimeoutError>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = T>,
{
    for _ in 0..max_retries {
        match with_timeout(duration, factory()).await {
            Ok(result) => return Ok(result),
            Err(_) => continue,
        }
    }

    Err(TimeoutError::new(duration))
}

/// Execute a future with exponential backoff timeout
pub async fn with_backoff_timeout<F, Fut, T>(
    initial: Duration,
    max: Duration,
    max_retries: u32,
    mut factory: F,
) -> Result<T, TimeoutError>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = T>,
{
    let mut current_timeout = initial;

    for _ in 0..max_retries {
        match with_timeout(current_timeout, factory()).await {
            Ok(result) => return Ok(result),
            Err(_) => {
                current_timeout = (current_timeout * 2).min(max);
            }
        }
    }

    Err(TimeoutError::new(current_timeout))
}

/// Timeout configuration
#[derive(Clone, Debug)]
pub struct TimeoutConfig {
    /// Initial timeout
    pub initial: Duration,
    /// Maximum timeout
    pub max: Duration,
    /// Backoff multiplier
    pub multiplier: f64,
    /// Maximum retries
    pub max_retries: u32,
}

impl Default for TimeoutConfig {
    fn default() -> Self {
        Self {
            initial: Duration::from_secs(1),
            max: Duration::from_secs(30),
            multiplier: 2.0,
            max_retries: 3,
        }
    }
}

impl TimeoutConfig {
    /// Create a new timeout config
    pub fn new() -> Self {
        Self::default()
    }

    /// Set initial timeout
    pub fn initial(mut self, duration: Duration) -> Self {
        self.initial = duration;
        self
    }

    /// Set max timeout
    pub fn max(mut self, duration: Duration) -> Self {
        self.max = duration;
        self
    }

    /// Set backoff multiplier
    pub fn multiplier(mut self, multiplier: f64) -> Self {
        self.multiplier = multiplier;
        self
    }

    /// Set max retries
    pub fn max_retries(mut self, retries: u32) -> Self {
        self.max_retries = retries;
        self
    }

    /// Calculate timeout for a given attempt
    pub fn timeout_for_attempt(&self, attempt: u32) -> Duration {
        let timeout = self.initial.as_secs_f64() * self.multiplier.powi(attempt as i32);
        let timeout_duration = Duration::from_secs_f64(timeout);
        timeout_duration.min(self.max)
    }

    /// Execute with this config
    pub async fn execute<F, Fut, T>(&self, mut factory: F) -> Result<T, TimeoutError>
    where
        F: FnMut() -> Fut,
        Fut: Future<Output = T>,
    {
        for attempt in 0..self.max_retries {
            let timeout = self.timeout_for_attempt(attempt);
            match with_timeout(timeout, factory()).await {
                Ok(result) => return Ok(result),
                Err(_) => continue,
            }
        }

        Err(TimeoutError::new(self.timeout_for_attempt(self.max_retries - 1)))
    }
}

/// Deadline-based timeout
pub struct Deadline {
    deadline: tokio::time::Instant,
}

impl Deadline {
    /// Create a deadline from now + duration
    pub fn after(duration: Duration) -> Self {
        Self {
            deadline: tokio::time::Instant::now() + duration,
        }
    }

    /// Create a deadline at a specific instant
    pub fn at(instant: tokio::time::Instant) -> Self {
        Self { deadline: instant }
    }

    /// Check if deadline has passed
    pub fn is_elapsed(&self) -> bool {
        tokio::time::Instant::now() >= self.deadline
    }

    /// Get remaining time
    pub fn remaining(&self) -> Duration {
        let now = tokio::time::Instant::now();
        if now >= self.deadline {
            Duration::ZERO
        } else {
            self.deadline - now
        }
    }

    /// Execute a future with this deadline
    pub async fn execute<F, T>(&self, future: F) -> Result<T, TimeoutError>
    where
        F: Future<Output = T>,
    {
        let remaining = self.remaining();
        if remaining.is_zero() {
            return Err(TimeoutError::new(Duration::ZERO));
        }
        with_timeout(remaining, future).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_with_timeout_success() {
        let result = with_timeout(Duration::from_secs(1), async { 42 }).await;
        assert_eq!(result.unwrap(), 42);
    }

    #[tokio::test]
    async fn test_with_timeout_failure() {
        let result = with_timeout(Duration::from_millis(10), async {
            tokio::time::sleep(Duration::from_secs(1)).await;
            42
        })
        .await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_timeout_config() {
        let config = TimeoutConfig::new()
            .initial(Duration::from_millis(100))
            .multiplier(2.0)
            .max(Duration::from_secs(10));

        assert_eq!(config.timeout_for_attempt(0), Duration::from_millis(100));
        assert_eq!(config.timeout_for_attempt(1), Duration::from_millis(200));
        assert_eq!(config.timeout_for_attempt(2), Duration::from_millis(400));
    }

    #[tokio::test]
    async fn test_deadline() {
        let deadline = Deadline::after(Duration::from_millis(100));

        assert!(!deadline.is_elapsed());
        assert!(deadline.remaining() > Duration::ZERO);

        tokio::time::sleep(Duration::from_millis(150)).await;

        assert!(deadline.is_elapsed());
        assert_eq!(deadline.remaining(), Duration::ZERO);
    }
}
