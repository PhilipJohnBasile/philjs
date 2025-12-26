//! Server Functions for PhilJS
//!
//! This module provides server function support similar to Leptos, allowing
//! functions to be called on the server from client code via RPC.
//!
//! # Example
//!
//! ```rust
//! use philjs::server::*;
//!
//! #[server]
//! async fn get_user(id: u64) -> ServerResult<User> {
//!     let user = db.find_user(id).await?;
//!     Ok(user)
//! }
//!
//! // On the client, call like any async function:
//! let user = get_user(123).await?;
//! ```

use std::future::Future;
use std::pin::Pin;
use serde::{Serialize, Deserialize};

/// Result type for server functions
pub type ServerResult<T> = Result<T, ServerError>;

/// Server function error types
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum ServerError {
    /// Network error during RPC
    Network(String),
    /// Serialization error
    Serialization(String),
    /// Server-side error
    Server(String),
    /// Authentication required
    Unauthorized,
    /// Resource not found
    NotFound,
    /// Validation error
    Validation(Vec<ValidationError>),
    /// Custom error with code
    Custom { code: String, message: String },
}

/// Validation error detail
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ValidationError {
    /// Field that failed validation
    pub field: String,
    /// Error message
    pub message: String,
}

impl std::fmt::Display for ServerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServerError::Network(msg) => write!(f, "Network error: {}", msg),
            ServerError::Serialization(msg) => write!(f, "Serialization error: {}", msg),
            ServerError::Server(msg) => write!(f, "Server error: {}", msg),
            ServerError::Unauthorized => write!(f, "Unauthorized"),
            ServerError::NotFound => write!(f, "Not found"),
            ServerError::Validation(errors) => {
                let msgs: Vec<_> = errors.iter().map(|e| format!("{}: {}", e.field, e.message)).collect();
                write!(f, "Validation error: {}", msgs.join(", "))
            }
            ServerError::Custom { code, message } => write!(f, "{}: {}", code, message),
        }
    }
}

impl std::error::Error for ServerError {}

impl From<String> for ServerError {
    fn from(s: String) -> Self {
        ServerError::Server(s)
    }
}

impl From<&str> for ServerError {
    fn from(s: &str) -> Self {
        ServerError::Server(s.to_string())
    }
}

/// Configuration for server function calls
#[derive(Clone, Debug, Default)]
pub struct ServerFnConfig {
    /// Endpoint URL for the server function
    pub endpoint: Option<String>,
    /// HTTP method (default: POST)
    pub method: HttpMethod,
    /// Request timeout in milliseconds
    pub timeout_ms: u64,
    /// Retry configuration
    pub retry: RetryConfig,
    /// Custom headers
    pub headers: Vec<(String, String)>,
}

/// HTTP method for server function calls
#[derive(Clone, Debug, Default)]
pub enum HttpMethod {
    #[default]
    Post,
    Get,
    Put,
    Delete,
    Patch,
}

/// Retry configuration
#[derive(Clone, Debug)]
pub struct RetryConfig {
    /// Maximum number of retries
    pub max_retries: u32,
    /// Initial delay in milliseconds
    pub initial_delay_ms: u64,
    /// Maximum delay in milliseconds
    pub max_delay_ms: u64,
    /// Exponential backoff factor
    pub backoff_factor: f64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        RetryConfig {
            max_retries: 3,
            initial_delay_ms: 100,
            max_delay_ms: 5000,
            backoff_factor: 2.0,
        }
    }
}

/// Trait for types that can be used as server function arguments
pub trait ServerFnArg: Serialize + for<'de> Deserialize<'de> + Send + 'static {}
impl<T: Serialize + for<'de> Deserialize<'de> + Send + 'static> ServerFnArg for T {}

/// Trait for types that can be returned from server functions
pub trait ServerFnReturn: Serialize + for<'de> Deserialize<'de> + Send + 'static {}
impl<T: Serialize + for<'de> Deserialize<'de> + Send + 'static> ServerFnReturn for T {}

/// Server function registry for routing
#[derive(Default)]
pub struct ServerFnRegistry {
    functions: std::collections::HashMap<String, RegisteredServerFn>,
}

/// A registered server function
pub struct RegisteredServerFn {
    /// Function name
    pub name: String,
    /// URL path
    pub path: String,
    /// HTTP method
    pub method: HttpMethod,
    /// Handler function
    pub handler: Box<dyn Fn(Vec<u8>) -> Pin<Box<dyn Future<Output = Result<Vec<u8>, ServerError>> + Send>> + Send + Sync>,
}

impl ServerFnRegistry {
    /// Create a new registry
    pub fn new() -> Self {
        ServerFnRegistry::default()
    }

    /// Register a server function
    pub fn register<F, Args, Ret>(&mut self, name: &str, path: &str, method: HttpMethod, handler: F)
    where
        F: Fn(Args) -> Pin<Box<dyn Future<Output = ServerResult<Ret>> + Send>> + Send + Sync + 'static,
        Args: ServerFnArg,
        Ret: ServerFnReturn,
    {
        let handler = Box::new(move |bytes: Vec<u8>| -> Pin<Box<dyn Future<Output = Result<Vec<u8>, ServerError>> + Send>> {
            // Deserialize args
            let args: Result<Args, _> = serde_json::from_slice(&bytes);
            match args {
                Ok(args) => {
                    let fut = handler(args);
                    Box::pin(async move {
                        match fut.await {
                            Ok(ret) => serde_json::to_vec(&ret)
                                .map_err(|e| ServerError::Serialization(e.to_string())),
                            Err(e) => Err(e),
                        }
                    })
                }
                Err(e) => Box::pin(async move {
                    Err(ServerError::Serialization(e.to_string()))
                }),
            }
        });

        self.functions.insert(name.to_string(), RegisteredServerFn {
            name: name.to_string(),
            path: path.to_string(),
            method,
            handler,
        });
    }

    /// Get a registered function by name
    pub fn get(&self, name: &str) -> Option<&RegisteredServerFn> {
        self.functions.get(name)
    }

    /// Get all registered functions
    pub fn all(&self) -> impl Iterator<Item = &RegisteredServerFn> {
        self.functions.values()
    }
}

/// Global server function registry
static REGISTRY: std::sync::OnceLock<std::sync::RwLock<ServerFnRegistry>> = std::sync::OnceLock::new();

/// Get the global registry
pub fn get_registry() -> &'static std::sync::RwLock<ServerFnRegistry> {
    REGISTRY.get_or_init(|| std::sync::RwLock::new(ServerFnRegistry::new()))
}

/// Register a server function globally
pub fn register_server_fn<F, Args, Ret>(name: &str, path: &str, method: HttpMethod, handler: F)
where
    F: Fn(Args) -> Pin<Box<dyn Future<Output = ServerResult<Ret>> + Send>> + Send + Sync + 'static,
    Args: ServerFnArg,
    Ret: ServerFnReturn,
{
    if let Ok(mut registry) = get_registry().write() {
        registry.register(name, path, method, handler);
    }
}

/// Server function call context
#[derive(Clone, Debug)]
pub struct ServerFnContext {
    /// Request headers
    pub headers: std::collections::HashMap<String, String>,
    /// Cookies
    pub cookies: std::collections::HashMap<String, String>,
    /// User ID if authenticated
    pub user_id: Option<String>,
    /// Request path
    pub path: String,
    /// Request method
    pub method: String,
}

impl ServerFnContext {
    /// Create a new context
    pub fn new() -> Self {
        ServerFnContext {
            headers: std::collections::HashMap::new(),
            cookies: std::collections::HashMap::new(),
            user_id: None,
            path: String::new(),
            method: String::new(),
        }
    }

    /// Get a header value
    pub fn header(&self, name: &str) -> Option<&str> {
        self.headers.get(name).map(|s| s.as_str())
    }

    /// Get a cookie value
    pub fn cookie(&self, name: &str) -> Option<&str> {
        self.cookies.get(name).map(|s| s.as_str())
    }

    /// Check if user is authenticated
    pub fn is_authenticated(&self) -> bool {
        self.user_id.is_some()
    }

    /// Require authentication
    pub fn require_auth(&self) -> ServerResult<&str> {
        self.user_id.as_deref().ok_or(ServerError::Unauthorized)
    }
}

impl Default for ServerFnContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Thread-local context for the current request
thread_local! {
    static CONTEXT: std::cell::RefCell<Option<ServerFnContext>> = std::cell::RefCell::new(None);
}

/// Get the current server function context
pub fn use_server_context() -> Option<ServerFnContext> {
    CONTEXT.with(|ctx| ctx.borrow().clone())
}

/// Set the current server function context
pub fn set_server_context(ctx: ServerFnContext) {
    CONTEXT.with(|c| *c.borrow_mut() = Some(ctx));
}

/// Clear the current server function context
pub fn clear_server_context() {
    CONTEXT.with(|c| *c.borrow_mut() = None);
}

// =============================================================================
// Client-side RPC implementation (WASM)
// =============================================================================

#[cfg(feature = "wasm")]
mod client {
    use super::*;
    use wasm_bindgen::prelude::*;
    use wasm_bindgen_futures::JsFuture;
    use web_sys::{Request, RequestInit, Response, Headers};

    /// Call a server function from the client
    pub async fn call_server_fn<Args, Ret>(
        name: &str,
        args: Args,
        config: Option<ServerFnConfig>,
    ) -> ServerResult<Ret>
    where
        Args: ServerFnArg,
        Ret: ServerFnReturn,
    {
        let config = config.unwrap_or_default();
        let endpoint = config.endpoint.unwrap_or_else(|| format!("/api/_sf/{}", name));

        // Serialize arguments
        let body = serde_json::to_string(&args)
            .map_err(|e| ServerError::Serialization(e.to_string()))?;

        // Create request
        let mut opts = RequestInit::new();
        opts.method(match config.method {
            HttpMethod::Get => "GET",
            HttpMethod::Post => "POST",
            HttpMethod::Put => "PUT",
            HttpMethod::Delete => "DELETE",
            HttpMethod::Patch => "PATCH",
        });
        opts.body(Some(&JsValue::from_str(&body)));

        // Set headers
        let headers = Headers::new().map_err(|_| ServerError::Network("Failed to create headers".into()))?;
        headers.set("Content-Type", "application/json").ok();
        for (key, value) in &config.headers {
            headers.set(key, value).ok();
        }
        opts.headers(&headers);

        let request = Request::new_with_str_and_init(&endpoint, &opts)
            .map_err(|_| ServerError::Network("Failed to create request".into()))?;

        // Send request
        let window = web_sys::window().ok_or_else(|| ServerError::Network("No window".into()))?;
        let resp_value = JsFuture::from(window.fetch_with_request(&request))
            .await
            .map_err(|_| ServerError::Network("Fetch failed".into()))?;

        let resp: Response = resp_value.dyn_into()
            .map_err(|_| ServerError::Network("Invalid response".into()))?;

        if !resp.ok() {
            let status = resp.status();
            return Err(match status {
                401 => ServerError::Unauthorized,
                404 => ServerError::NotFound,
                _ => ServerError::Server(format!("HTTP {}", status)),
            });
        }

        // Parse response
        let json = JsFuture::from(resp.json().map_err(|_| ServerError::Network("Failed to parse JSON".into()))?)
            .await
            .map_err(|_| ServerError::Network("Failed to read response".into()))?;

        let result: Ret = serde_wasm_bindgen::from_value(json)
            .map_err(|e| ServerError::Serialization(e.to_string()))?;

        Ok(result)
    }
}

#[cfg(feature = "wasm")]
pub use client::call_server_fn;

// =============================================================================
// Server-side handler implementation
// =============================================================================

/// Axum handler for server functions
#[cfg(feature = "axum")]
pub mod axum_handler {
    use super::*;
    use axum::{
        body::Body,
        extract::Path,
        http::{Request, Response, StatusCode},
        routing::post,
        Router,
    };

    /// Create an Axum router for server functions
    pub fn server_fn_router() -> Router {
        Router::new()
            .route("/api/_sf/:name", post(handle_server_fn))
    }

    async fn handle_server_fn(
        Path(name): Path<String>,
        req: Request<Body>,
    ) -> Response<Body> {
        let registry = get_registry().read().unwrap();

        if let Some(server_fn) = registry.get(&name) {
            // Extract body
            let body_bytes = match axum::body::to_bytes(req.into_body(), usize::MAX).await {
                Ok(bytes) => bytes.to_vec(),
                Err(_) => return Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                    .body(Body::from("Invalid request body"))
                    .unwrap(),
            };

            // Call the server function
            match (server_fn.handler)(body_bytes).await {
                Ok(result) => Response::builder()
                    .status(StatusCode::OK)
                    .header("Content-Type", "application/json")
                    .body(Body::from(result))
                    .unwrap(),
                Err(e) => Response::builder()
                    .status(match e {
                        ServerError::Unauthorized => StatusCode::UNAUTHORIZED,
                        ServerError::NotFound => StatusCode::NOT_FOUND,
                        ServerError::Validation(_) => StatusCode::BAD_REQUEST,
                        _ => StatusCode::INTERNAL_SERVER_ERROR,
                    })
                    .header("Content-Type", "application/json")
                    .body(Body::from(serde_json::to_string(&e).unwrap_or_default()))
                    .unwrap(),
            }
        } else {
            Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from("Server function not found"))
                .unwrap()
        }
    }
}

/// Actix handler for server functions
#[cfg(feature = "actix")]
pub mod actix_handler {
    use super::*;
    use actix_web::{web, HttpResponse, Responder};

    /// Configure Actix routes for server functions
    pub fn configure_server_fns(cfg: &mut web::ServiceConfig) {
        cfg.route("/api/_sf/{name}", web::post().to(handle_server_fn));
    }

    async fn handle_server_fn(
        path: web::Path<String>,
        body: web::Bytes,
    ) -> impl Responder {
        let name = path.into_inner();
        let registry = get_registry().read().unwrap();

        if let Some(server_fn) = registry.get(&name) {
            match (server_fn.handler)(body.to_vec()).await {
                Ok(result) => HttpResponse::Ok()
                    .content_type("application/json")
                    .body(result),
                Err(e) => {
                    let status = match e {
                        ServerError::Unauthorized => actix_web::http::StatusCode::UNAUTHORIZED,
                        ServerError::NotFound => actix_web::http::StatusCode::NOT_FOUND,
                        ServerError::Validation(_) => actix_web::http::StatusCode::BAD_REQUEST,
                        _ => actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
                    };
                    HttpResponse::build(status)
                        .content_type("application/json")
                        .body(serde_json::to_string(&e).unwrap_or_default())
                }
            }
        } else {
            HttpResponse::NotFound().body("Server function not found")
        }
    }
}

// =============================================================================
// Macros
// =============================================================================

/// Derive macro for creating server functions
///
/// # Example
///
/// ```rust
/// #[server]
/// async fn get_todos() -> ServerResult<Vec<Todo>> {
///     // This runs on the server
///     let todos = db::get_all_todos().await?;
///     Ok(todos)
/// }
/// ```
///
/// The macro generates:
/// - A function that calls the server via RPC on the client
/// - A function that runs the code on the server
/// - Registration in the server function registry
#[macro_export]
macro_rules! server_fn {
    (
        $(#[$meta:meta])*
        async fn $name:ident($($arg:ident : $arg_ty:ty),* $(,)?) -> ServerResult<$ret:ty> $body:block
    ) => {
        $(#[$meta])*
        pub async fn $name($($arg: $arg_ty),*) -> $crate::server::ServerResult<$ret> {
            #[derive(serde::Serialize, serde::Deserialize)]
            struct Args {
                $($arg: $arg_ty),*
            }

            #[cfg(feature = "wasm")]
            {
                // Client-side: call server via RPC
                let args = Args { $($arg),* };
                $crate::server::call_server_fn(stringify!($name), args, None).await
            }

            #[cfg(not(feature = "wasm"))]
            {
                // Server-side: run the actual code
                $body
            }
        }

        // Register the server function
        #[cfg(not(feature = "wasm"))]
        #[ctor::ctor]
        fn __register_server_fn() {
            use $crate::server::{register_server_fn, HttpMethod, ServerResult};
            use std::pin::Pin;
            use std::future::Future;

            #[derive(serde::Serialize, serde::Deserialize)]
            struct Args {
                $($arg: $arg_ty),*
            }

            register_server_fn(
                stringify!($name),
                concat!("/api/_sf/", stringify!($name)),
                HttpMethod::Post,
                |args: Args| -> Pin<Box<dyn Future<Output = ServerResult<$ret>> + Send>> {
                    Box::pin(async move {
                        let Args { $($arg),* } = args;
                        $body
                    })
                },
            );
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_server_error_display() {
        let err = ServerError::Unauthorized;
        assert_eq!(format!("{}", err), "Unauthorized");

        let err = ServerError::Validation(vec![
            ValidationError { field: "email".into(), message: "invalid".into() }
        ]);
        assert!(format!("{}", err).contains("email: invalid"));
    }

    #[test]
    fn test_server_fn_context() {
        let mut ctx = ServerFnContext::new();
        ctx.headers.insert("Authorization".into(), "Bearer xyz".into());
        ctx.user_id = Some("user123".into());

        assert_eq!(ctx.header("Authorization"), Some("Bearer xyz"));
        assert!(ctx.is_authenticated());
        assert_eq!(ctx.require_auth().unwrap(), "user123");
    }

    #[test]
    fn test_retry_config_default() {
        let config = RetryConfig::default();
        assert_eq!(config.max_retries, 3);
        assert_eq!(config.initial_delay_ms, 100);
    }
}
