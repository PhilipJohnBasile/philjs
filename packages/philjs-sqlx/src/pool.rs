//! Database connection pool management

use sqlx::pool::PoolOptions;
use std::time::Duration;
use tracing::{info, warn};

use crate::error::{DbError, DbResult};

/// Database pool type alias - generic over any database
pub type DbPool<DB> = sqlx::Pool<DB>;

/// Pool configuration
#[derive(Clone, Debug)]
pub struct PoolConfig {
    /// Database URL
    pub url: String,
    /// Maximum connections
    pub max_connections: u32,
    /// Minimum connections
    pub min_connections: u32,
    /// Connection timeout
    pub connect_timeout: Duration,
    /// Idle timeout
    pub idle_timeout: Option<Duration>,
    /// Max lifetime
    pub max_lifetime: Option<Duration>,
    /// Test connection on acquire
    pub test_on_acquire: bool,
}

impl Default for PoolConfig {
    fn default() -> Self {
        Self {
            url: String::new(),
            max_connections: 10,
            min_connections: 1,
            connect_timeout: Duration::from_secs(30),
            idle_timeout: Some(Duration::from_secs(600)),
            max_lifetime: Some(Duration::from_secs(1800)),
            test_on_acquire: true,
        }
    }
}

impl PoolConfig {
    /// Create a new pool configuration with the given URL
    pub fn new(url: impl Into<String>) -> Self {
        Self {
            url: url.into(),
            ..Default::default()
        }
    }

    /// Set maximum connections
    pub fn max_connections(mut self, max: u32) -> Self {
        self.max_connections = max;
        self
    }

    /// Set minimum connections
    pub fn min_connections(mut self, min: u32) -> Self {
        self.min_connections = min;
        self
    }

    /// Set connection timeout
    pub fn connect_timeout(mut self, timeout: Duration) -> Self {
        self.connect_timeout = timeout;
        self
    }

    /// Set idle timeout
    pub fn idle_timeout(mut self, timeout: Option<Duration>) -> Self {
        self.idle_timeout = timeout;
        self
    }

    /// Set max lifetime
    pub fn max_lifetime(mut self, lifetime: Option<Duration>) -> Self {
        self.max_lifetime = lifetime;
        self
    }

    /// Enable/disable test on acquire
    pub fn test_on_acquire(mut self, test: bool) -> Self {
        self.test_on_acquire = test;
        self
    }

    /// Build pool options
    fn build_options<DB: sqlx::Database>(&self) -> PoolOptions<DB> {
        let mut opts = PoolOptions::new()
            .max_connections(self.max_connections)
            .min_connections(self.min_connections)
            .acquire_timeout(self.connect_timeout)
            .test_before_acquire(self.test_on_acquire);

        if let Some(idle) = self.idle_timeout {
            opts = opts.idle_timeout(idle);
        }

        if let Some(lifetime) = self.max_lifetime {
            opts = opts.max_lifetime(lifetime);
        }

        opts
    }
}

/// Create a database pool with the given configuration
#[cfg(feature = "postgres")]
pub async fn create_pool(config: &PoolConfig) -> DbResult<DbPool<sqlx::Postgres>> {
    info!(url = %config.url, max_connections = %config.max_connections, "Creating PostgreSQL pool");

    let pool = config
        .build_options()
        .connect(&config.url)
        .await
        .map_err(|e| DbError::Connection(e.to_string()))?;

    info!("PostgreSQL pool created successfully");
    Ok(pool)
}

/// Create a PostgreSQL pool
#[cfg(feature = "postgres")]
pub async fn create_pg_pool(url: &str) -> DbResult<DbPool<sqlx::Postgres>> {
    create_pool(&PoolConfig::new(url)).await
}

/// Create a MySQL pool
#[cfg(feature = "mysql")]
pub async fn create_mysql_pool(config: &PoolConfig) -> DbResult<DbPool<sqlx::MySql>> {
    info!(url = %config.url, max_connections = %config.max_connections, "Creating MySQL pool");

    let pool = config
        .build_options()
        .connect(&config.url)
        .await
        .map_err(|e| DbError::Connection(e.to_string()))?;

    info!("MySQL pool created successfully");
    Ok(pool)
}

/// Create a SQLite pool
#[cfg(feature = "sqlite")]
pub async fn create_sqlite_pool(config: &PoolConfig) -> DbResult<DbPool<sqlx::Sqlite>> {
    info!(url = %config.url, max_connections = %config.max_connections, "Creating SQLite pool");

    let pool = config
        .build_options()
        .connect(&config.url)
        .await
        .map_err(|e| DbError::Connection(e.to_string()))?;

    info!("SQLite pool created successfully");
    Ok(pool)
}

/// Pool health check
pub struct PoolHealth {
    /// Whether the pool is healthy
    pub healthy: bool,
    /// Number of active connections
    pub active: u32,
    /// Number of idle connections
    pub idle: u32,
    /// Pool size
    pub size: u32,
}

/// Get pool health information
pub fn pool_health<DB: sqlx::Database>(pool: &DbPool<DB>) -> PoolHealth {
    PoolHealth {
        healthy: !pool.is_closed(),
        active: pool.size() - pool.num_idle() as u32,
        idle: pool.num_idle() as u32,
        size: pool.size(),
    }
}

/// Pool statistics
#[derive(Debug, Clone)]
pub struct PoolStats {
    /// Total connections created
    pub connections_created: u64,
    /// Total connections recycled
    pub connections_recycled: u64,
    /// Current pool size
    pub size: u32,
    /// Idle connections
    pub idle: u32,
    /// Active connections
    pub active: u32,
}

/// Pool manager for multiple databases
pub struct PoolManager<DB: sqlx::Database> {
    pools: std::collections::HashMap<String, DbPool<DB>>,
    default_config: PoolConfig,
}

impl<DB: sqlx::Database> PoolManager<DB> {
    /// Create a new pool manager
    pub fn new(default_config: PoolConfig) -> Self {
        Self {
            pools: std::collections::HashMap::new(),
            default_config,
        }
    }

    /// Get the default configuration
    pub fn default_config(&self) -> &PoolConfig {
        &self.default_config
    }

    /// Get a pool by name
    pub fn get(&self, name: &str) -> Option<&DbPool<DB>> {
        self.pools.get(name)
    }

    /// Check if a pool exists
    pub fn contains(&self, name: &str) -> bool {
        self.pools.contains_key(name)
    }

    /// Get all pool names
    pub fn pool_names(&self) -> Vec<String> {
        self.pools.keys().cloned().collect()
    }

    /// Close all pools
    pub async fn close_all(&self) {
        for (name, pool) in &self.pools {
            info!(name = %name, "Closing database pool");
            pool.close().await;
        }
    }
}

/// Read replica configuration
#[derive(Clone, Debug)]
pub struct ReplicaConfig {
    /// Primary database URL
    pub primary_url: String,
    /// Replica database URLs
    pub replica_urls: Vec<String>,
    /// Pool configuration for primary
    pub primary_config: PoolConfig,
    /// Pool configuration for replicas
    pub replica_config: PoolConfig,
}

impl ReplicaConfig {
    /// Create a new replica configuration
    pub fn new(primary_url: impl Into<String>) -> Self {
        Self {
            primary_url: primary_url.into(),
            replica_urls: Vec::new(),
            primary_config: PoolConfig::default(),
            replica_config: PoolConfig::default().max_connections(5),
        }
    }

    /// Add a replica URL
    pub fn add_replica(mut self, url: impl Into<String>) -> Self {
        self.replica_urls.push(url.into());
        self
    }

    /// Set primary pool configuration
    pub fn primary_config(mut self, config: PoolConfig) -> Self {
        self.primary_config = config;
        self
    }

    /// Set replica pool configuration
    pub fn replica_config(mut self, config: PoolConfig) -> Self {
        self.replica_config = config;
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pool_config_default() {
        let config = PoolConfig::default();
        assert_eq!(config.max_connections, 10);
        assert_eq!(config.min_connections, 1);
        assert!(config.test_on_acquire);
    }

    #[test]
    fn test_pool_config_builder() {
        let config = PoolConfig::new("postgres://localhost/test")
            .max_connections(20)
            .min_connections(5)
            .connect_timeout(Duration::from_secs(60));

        assert_eq!(config.max_connections, 20);
        assert_eq!(config.min_connections, 5);
        assert_eq!(config.connect_timeout, Duration::from_secs(60));
    }

    #[test]
    fn test_replica_config() {
        let config = ReplicaConfig::new("postgres://primary/db")
            .add_replica("postgres://replica1/db")
            .add_replica("postgres://replica2/db");

        assert_eq!(config.replica_urls.len(), 2);
    }
}
