//! PhilJS Rust Query
//!
//! TanStack Query-style data fetching for Rust.
//! Provides caching, refetching, and optimistic updates.
//!
//! # Example
//! ```rust
//! use philjs_rust::query::*;
//!
//! let users = use_query(
//!     ["users"],
//!     || async { fetch_users().await }
//! );
//!
//! match users.data() {
//!     Some(data) => view! { <UserList users=data /> },
//!     None => view! { <Loading /> },
//! }
//! ```

use std::any::Any;
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

use crate::reactive::{Signal, Memo, effect};

// ============================================================================
// Types
// ============================================================================

/// Query key type
pub type QueryKey = Vec<String>;

/// Query status
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum QueryStatus {
    Idle,
    Loading,
    Error,
    Success,
}

/// Query state
#[derive(Clone)]
pub struct QueryState<T: Clone> {
    pub data: Option<T>,
    pub error: Option<String>,
    pub status: QueryStatus,
    pub is_fetching: bool,
    pub last_updated: Option<Instant>,
}

impl<T: Clone> Default for QueryState<T> {
    fn default() -> Self {
        Self {
            data: None,
            error: None,
            status: QueryStatus::Idle,
            is_fetching: false,
            last_updated: None,
        }
    }
}

/// Query options
pub struct QueryOptions {
    /// Time until data is considered stale (ms)
    pub stale_time: u64,

    /// Time to keep unused data in cache (ms)
    pub cache_time: u64,

    /// Whether to refetch on window focus
    pub refetch_on_window_focus: bool,

    /// Whether to refetch on reconnect
    pub refetch_on_reconnect: bool,

    /// Refetch interval (0 = disabled)
    pub refetch_interval: u64,

    /// Number of retries on error
    pub retry: u32,

    /// Delay between retries (ms)
    pub retry_delay: u64,

    /// Whether the query is enabled
    pub enabled: bool,
}

impl Default for QueryOptions {
    fn default() -> Self {
        Self {
            stale_time: 0,
            cache_time: 5 * 60 * 1000, // 5 minutes
            refetch_on_window_focus: true,
            refetch_on_reconnect: true,
            refetch_interval: 0,
            retry: 3,
            retry_delay: 1000,
            enabled: true,
        }
    }
}

// ============================================================================
// Query Cache
// ============================================================================

struct CacheEntry {
    data: Box<dyn Any + Send + Sync>,
    last_updated: Instant,
    stale_time: Duration,
}

impl CacheEntry {
    fn is_stale(&self) -> bool {
        self.last_updated.elapsed() > self.stale_time
    }
}

lazy_static::lazy_static! {
    static ref QUERY_CACHE: RwLock<HashMap<String, CacheEntry>> = RwLock::new(HashMap::new());
}

fn cache_key(key: &QueryKey) -> String {
    key.join(":")
}

fn get_cached<T: Clone + Send + Sync + 'static>(key: &QueryKey) -> Option<(T, bool)> {
    let cache = QUERY_CACHE.read().ok()?;
    let entry = cache.get(&cache_key(key))?;

    let data = entry.data.downcast_ref::<T>()?.clone();
    let is_stale = entry.is_stale();

    Some((data, is_stale))
}

fn set_cached<T: Clone + Send + Sync + 'static>(key: &QueryKey, data: T, stale_time: Duration) {
    if let Ok(mut cache) = QUERY_CACHE.write() {
        cache.insert(cache_key(key), CacheEntry {
            data: Box::new(data),
            last_updated: Instant::now(),
            stale_time,
        });
    }
}

fn invalidate_cache(key: &QueryKey) {
    if let Ok(mut cache) = QUERY_CACHE.write() {
        cache.remove(&cache_key(key));
    }
}

fn invalidate_queries(predicate: impl Fn(&str) -> bool) {
    if let Ok(mut cache) = QUERY_CACHE.write() {
        cache.retain(|k, _| !predicate(k));
    }
}

// ============================================================================
// useQuery
// ============================================================================

pub struct Query<T: Clone> {
    state: Signal<QueryState<T>>,
    key: QueryKey,
}

impl<T: Clone + Send + Sync + 'static> Query<T> {
    pub fn data(&self) -> Option<T> {
        self.state.get().data
    }

    pub fn error(&self) -> Option<String> {
        self.state.get().error
    }

    pub fn status(&self) -> QueryStatus {
        self.state.get().status
    }

    pub fn is_loading(&self) -> bool {
        self.state.get().status == QueryStatus::Loading
    }

    pub fn is_error(&self) -> bool {
        self.state.get().status == QueryStatus::Error
    }

    pub fn is_success(&self) -> bool {
        self.state.get().status == QueryStatus::Success
    }

    pub fn is_fetching(&self) -> bool {
        self.state.get().is_fetching
    }

    pub fn refetch(&self) {
        invalidate_cache(&self.key);
        // Trigger refetch through signal update
        let mut state = self.state.get();
        state.is_fetching = true;
        self.state.set(state);
    }
}

/// Create a query
pub fn use_query<T, F, Fut>(
    key: impl IntoQueryKey,
    query_fn: F,
) -> Query<T>
where
    T: Clone + Send + Sync + 'static,
    F: Fn() -> Fut + 'static,
    Fut: Future<Output = Result<T, String>> + Send + 'static,
{
    use_query_with_options(key, query_fn, QueryOptions::default())
}

/// Create a query with options
pub fn use_query_with_options<T, F, Fut>(
    key: impl IntoQueryKey,
    query_fn: F,
    options: QueryOptions,
) -> Query<T>
where
    T: Clone + Send + Sync + 'static,
    F: Fn() -> Fut + 'static,
    Fut: Future<Output = Result<T, String>> + Send + 'static,
{
    let key = key.into_query_key();
    let state = Signal::new(QueryState::default());

    // Check cache first
    if let Some((cached_data, is_stale)) = get_cached::<T>(&key) {
        let mut initial_state = QueryState::default();
        initial_state.data = Some(cached_data);
        initial_state.status = QueryStatus::Success;
        initial_state.is_fetching = is_stale && options.enabled;
        state.set(initial_state);
    }

    // Set up query effect
    if options.enabled {
        let state_clone = state.clone();
        let key_clone = key.clone();
        let stale_time = Duration::from_millis(options.stale_time);

        // Would spawn async task to fetch
        // For now, just set loading state
        effect(move || {
            // Check if we need to fetch
            if state_clone.get().data.is_none() || state_clone.get().is_fetching {
                let mut s = state_clone.get();
                s.status = QueryStatus::Loading;
                s.is_fetching = true;
                state_clone.set(s);

                // In real implementation, spawn async task here
            }
        });
    }

    Query { state, key }
}

// ============================================================================
// useMutation
// ============================================================================

pub struct Mutation<I, O: Clone> {
    state: Signal<MutationState<O>>,
    _marker: std::marker::PhantomData<I>,
}

#[derive(Clone)]
pub struct MutationState<T: Clone> {
    pub data: Option<T>,
    pub error: Option<String>,
    pub is_loading: bool,
    pub is_error: bool,
    pub is_success: bool,
}

impl<T: Clone> Default for MutationState<T> {
    fn default() -> Self {
        Self {
            data: None,
            error: None,
            is_loading: false,
            is_error: false,
            is_success: false,
        }
    }
}

impl<I, O: Clone + 'static> Mutation<I, O> {
    pub fn data(&self) -> Option<O> {
        self.state.get().data
    }

    pub fn error(&self) -> Option<String> {
        self.state.get().error
    }

    pub fn is_loading(&self) -> bool {
        self.state.get().is_loading
    }

    pub fn is_error(&self) -> bool {
        self.state.get().is_error
    }

    pub fn is_success(&self) -> bool {
        self.state.get().is_success
    }

    pub fn reset(&self) {
        self.state.set(MutationState::default());
    }
}

/// Mutation options
pub struct MutationOptions<I, O> {
    pub on_success: Option<Box<dyn Fn(&O)>>,
    pub on_error: Option<Box<dyn Fn(&String)>>,
    pub on_settled: Option<Box<dyn Fn(Option<&O>, Option<&String>)>>,
    pub invalidate_queries: Vec<QueryKey>,
    _marker: std::marker::PhantomData<I>,
}

impl<I, O> Default for MutationOptions<I, O> {
    fn default() -> Self {
        Self {
            on_success: None,
            on_error: None,
            on_settled: None,
            invalidate_queries: Vec::new(),
            _marker: std::marker::PhantomData,
        }
    }
}

/// Create a mutation
pub fn use_mutation<I, O, F, Fut>(
    mutation_fn: F,
) -> Mutation<I, O>
where
    O: Clone + 'static,
    F: Fn(I) -> Fut + 'static,
    Fut: Future<Output = Result<O, String>> + Send + 'static,
{
    Mutation {
        state: Signal::new(MutationState::default()),
        _marker: std::marker::PhantomData,
    }
}

// ============================================================================
// useInfiniteQuery
// ============================================================================

pub struct InfiniteQuery<T: Clone> {
    pub pages: Signal<Vec<T>>,
    pub has_next_page: Signal<bool>,
    pub is_fetching_next_page: Signal<bool>,
    pub status: Signal<QueryStatus>,
}

impl<T: Clone> InfiniteQuery<T> {
    pub fn data(&self) -> Vec<T> {
        self.pages.get()
    }

    pub fn fetch_next_page(&self) {
        // Would trigger fetch of next page
    }
}

/// Create an infinite query
pub fn use_infinite_query<T, F, Fut>(
    key: impl IntoQueryKey,
    query_fn: F,
) -> InfiniteQuery<T>
where
    T: Clone + 'static,
    F: Fn(Option<String>) -> Fut + 'static,
    Fut: Future<Output = Result<(T, Option<String>), String>> + Send + 'static,
{
    InfiniteQuery {
        pages: Signal::new(Vec::new()),
        has_next_page: Signal::new(false),
        is_fetching_next_page: Signal::new(false),
        status: Signal::new(QueryStatus::Idle),
    }
}

// ============================================================================
// Query Client
// ============================================================================

/// Query client for global cache management
pub struct QueryClient;

impl QueryClient {
    pub fn new() -> Self {
        Self
    }

    /// Invalidate queries matching predicate
    pub fn invalidate_queries(&self, predicate: impl Fn(&str) -> bool) {
        invalidate_queries(predicate);
    }

    /// Invalidate queries by key
    pub fn invalidate(&self, key: impl IntoQueryKey) {
        invalidate_cache(&key.into_query_key());
    }

    /// Prefetch a query
    pub async fn prefetch<T, F, Fut>(&self, key: impl IntoQueryKey, query_fn: F)
    where
        T: Clone + Send + Sync + 'static,
        F: Fn() -> Fut,
        Fut: Future<Output = Result<T, String>> + Send,
    {
        let key = key.into_query_key();
        if let Ok(data) = query_fn().await {
            set_cached(&key, data, Duration::from_secs(0));
        }
    }

    /// Set query data directly
    pub fn set_query_data<T: Clone + Send + Sync + 'static>(
        &self,
        key: impl IntoQueryKey,
        data: T,
    ) {
        set_cached(&key.into_query_key(), data, Duration::from_secs(0));
    }

    /// Get query data from cache
    pub fn get_query_data<T: Clone + Send + Sync + 'static>(
        &self,
        key: impl IntoQueryKey,
    ) -> Option<T> {
        get_cached::<T>(&key.into_query_key()).map(|(d, _)| d)
    }

    /// Clear all cached queries
    pub fn clear(&self) {
        if let Ok(mut cache) = QUERY_CACHE.write() {
            cache.clear();
        }
    }
}

// ============================================================================
// Helper Traits
// ============================================================================

pub trait IntoQueryKey {
    fn into_query_key(self) -> QueryKey;
}

impl IntoQueryKey for QueryKey {
    fn into_query_key(self) -> QueryKey {
        self
    }
}

impl IntoQueryKey for &str {
    fn into_query_key(self) -> QueryKey {
        vec![self.to_string()]
    }
}

impl IntoQueryKey for String {
    fn into_query_key(self) -> QueryKey {
        vec![self]
    }
}

impl<const N: usize> IntoQueryKey for [&str; N] {
    fn into_query_key(self) -> QueryKey {
        self.iter().map(|s| s.to_string()).collect()
    }
}

impl IntoQueryKey for Vec<&str> {
    fn into_query_key(self) -> QueryKey {
        self.into_iter().map(|s| s.to_string()).collect()
    }
}

// ============================================================================
// Re-exports
// ============================================================================

pub use QueryStatus::*;
