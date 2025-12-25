//! PhilJS Rust Server Functions
//!
//! Define server-side functions that can be called from the client.
//! Similar to Leptos #[server] and Next.js Server Actions.
//!
//! # Example
//! ```rust
//! use philjs_rust::server::*;
//!
//! #[server(GetUser)]
//! async fn get_user(id: u64) -> Result<User, ServerError> {
//!     let user = db.find_user(id).await?;
//!     Ok(user)
//! }
//!
//! // On the client:
//! let user = get_user(123).await?;
//! ```

use std::future::Future;
use std::pin::Pin;

use serde::{Deserialize, Serialize};

// ============================================================================
// Types
// ============================================================================

/// Server function error type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerError {
    pub message: String,
    pub code: Option<String>,
    pub status: u16,
}

impl ServerError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            code: None,
            status: 500,
        }
    }

    pub fn with_code(mut self, code: impl Into<String>) -> Self {
        self.code = Some(code.into());
        self
    }

    pub fn with_status(mut self, status: u16) -> Self {
        self.status = status;
        self
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            code: Some("NOT_FOUND".into()),
            status: 404,
        }
    }

    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            code: Some("UNAUTHORIZED".into()),
            status: 401,
        }
    }

    pub fn bad_request(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            code: Some("BAD_REQUEST".into()),
            status: 400,
        }
    }
}

impl std::fmt::Display for ServerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for ServerError {}

impl From<String> for ServerError {
    fn from(s: String) -> Self {
        Self::new(s)
    }
}

impl From<&str> for ServerError {
    fn from(s: &str) -> Self {
        Self::new(s)
    }
}

/// Result type for server functions
pub type ServerResult<T> = Result<T, ServerError>;

// ============================================================================
// Server Function Trait
// ============================================================================

/// Trait for server functions
pub trait ServerFn: Sized {
    /// The input type (arguments)
    type Input: Serialize + for<'de> Deserialize<'de>;

    /// The output type (return value)
    type Output: Serialize + for<'de> Deserialize<'de>;

    /// The URL path for this server function
    const PATH: &'static str;

    /// The HTTP method
    const METHOD: &'static str = "POST";

    /// Execute the server function
    fn run(input: Self::Input) -> Pin<Box<dyn Future<Output = ServerResult<Self::Output>> + Send>>;
}

// ============================================================================
// Server Context
// ============================================================================

/// Context available in server functions
#[derive(Clone)]
pub struct ServerContext {
    /// Request headers
    pub headers: std::collections::HashMap<String, String>,

    /// Request cookies
    pub cookies: std::collections::HashMap<String, String>,

    /// Client IP address
    pub client_ip: Option<String>,

    /// Request ID for tracing
    pub request_id: String,
}

impl Default for ServerContext {
    fn default() -> Self {
        Self {
            headers: std::collections::HashMap::new(),
            cookies: std::collections::HashMap::new(),
            client_ip: None,
            request_id: uuid_v4(),
        }
    }
}

impl ServerContext {
    pub fn new() -> Self {
        Self::default()
    }

    /// Get a header value
    pub fn header(&self, name: &str) -> Option<&String> {
        self.headers.get(&name.to_lowercase())
    }

    /// Get a cookie value
    pub fn cookie(&self, name: &str) -> Option<&String> {
        self.cookies.get(name)
    }

    /// Get the Authorization header
    pub fn authorization(&self) -> Option<&String> {
        self.header("authorization")
    }

    /// Get the bearer token from Authorization header
    pub fn bearer_token(&self) -> Option<&str> {
        self.authorization()
            .and_then(|auth| auth.strip_prefix("Bearer "))
    }
}

fn uuid_v4() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{:032x}", now)
}

// ============================================================================
// Server Function Registry
// ============================================================================

use std::sync::RwLock;
use std::collections::HashMap;

type ServerFnHandler = Box<dyn Fn(String) -> Pin<Box<dyn Future<Output = Result<String, ServerError>> + Send>> + Send + Sync>;

lazy_static::lazy_static! {
    static ref SERVER_FN_REGISTRY: RwLock<HashMap<&'static str, ServerFnHandler>> =
        RwLock::new(HashMap::new());
}

/// Register a server function
pub fn register_server_fn<F: ServerFn + 'static>() {
    let handler = Box::new(move |input: String| -> Pin<Box<dyn Future<Output = Result<String, ServerError>> + Send>> {
        Box::pin(async move {
            let input: F::Input = serde_json::from_str(&input)
                .map_err(|e| ServerError::bad_request(format!("Invalid input: {}", e)))?;

            let output = F::run(input).await?;

            serde_json::to_string(&output)
                .map_err(|e| ServerError::new(format!("Serialization error: {}", e)))
        })
    });

    SERVER_FN_REGISTRY.write().unwrap().insert(F::PATH, handler);
}

/// Call a server function by path
pub async fn call_server_fn(path: &str, input: String) -> Result<String, ServerError> {
    let registry = SERVER_FN_REGISTRY.read().unwrap();

    let handler = registry.get(path)
        .ok_or_else(|| ServerError::not_found(format!("Server function not found: {}", path)))?;

    handler(input).await
}

// ============================================================================
// Client-Side Calling
// ============================================================================

/// Call a server function from the client
#[cfg(target_arch = "wasm32")]
pub async fn call_server<F: ServerFn>(input: F::Input) -> ServerResult<F::Output> {
    use wasm_bindgen::JsCast;
    use wasm_bindgen_futures::JsFuture;
    use web_sys::{Request, RequestInit, Response};

    let window = web_sys::window().unwrap();

    let mut opts = RequestInit::new();
    opts.method(F::METHOD);
    opts.body(Some(&wasm_bindgen::JsValue::from_str(
        &serde_json::to_string(&input).map_err(|e| ServerError::new(e.to_string()))?
    )));

    let request = Request::new_with_str_and_init(F::PATH, &opts)
        .map_err(|_| ServerError::new("Failed to create request"))?;

    request.headers().set("Content-Type", "application/json").ok();

    let resp_value = JsFuture::from(window.fetch_with_request(&request))
        .await
        .map_err(|_| ServerError::new("Network error"))?;

    let resp: Response = resp_value.dyn_into()
        .map_err(|_| ServerError::new("Invalid response"))?;

    let text = JsFuture::from(resp.text().map_err(|_| ServerError::new("Failed to read response"))?)
        .await
        .map_err(|_| ServerError::new("Failed to read response text"))?;

    let text_str = text.as_string()
        .ok_or_else(|| ServerError::new("Response is not a string"))?;

    if resp.ok() {
        serde_json::from_str(&text_str)
            .map_err(|e| ServerError::new(format!("Failed to parse response: {}", e)))
    } else {
        Err(serde_json::from_str(&text_str).unwrap_or_else(|_| ServerError::new(text_str)))
    }
}

/// Call a server function from the client (non-WASM fallback)
#[cfg(not(target_arch = "wasm32"))]
pub async fn call_server<F: ServerFn>(input: F::Input) -> ServerResult<F::Output> {
    // On server, call directly
    F::run(input).await
}

// ============================================================================
// Macros
// ============================================================================

/// Define a server function
///
/// # Example
/// ```rust
/// #[server(CreateUser, "/api/users")]
/// pub async fn create_user(name: String, email: String) -> ServerResult<User> {
///     let user = db.create_user(name, email).await?;
///     Ok(user)
/// }
/// ```
#[macro_export]
macro_rules! server_fn {
    (
        $vis:vis async fn $name:ident($($arg:ident : $arg_ty:ty),* $(,)?) -> $ret:ty $body:block
    ) => {
        paste::paste! {
            #[derive(serde::Serialize, serde::Deserialize)]
            pub struct [<$name:camel Input>] {
                $(pub $arg: $arg_ty,)*
            }

            pub struct [<$name:camel>];

            impl $crate::server::ServerFn for [<$name:camel>] {
                type Input = [<$name:camel Input>];
                type Output = $ret;

                const PATH: &'static str = concat!("/api/", stringify!($name));

                fn run(input: Self::Input) -> std::pin::Pin<Box<dyn std::future::Future<Output = $crate::server::ServerResult<Self::Output>> + Send>> {
                    let [<$name:camel Input>] { $($arg,)* } = input;
                    Box::pin(async move $body)
                }
            }

            $vis async fn $name($($arg: $arg_ty),*) -> $crate::server::ServerResult<$ret> {
                $crate::server::call_server::<[<$name:camel>]>([<$name:camel Input>] { $($arg,)* }).await
            }
        }
    };
}

// ============================================================================
// Action (Form Submission)
// ============================================================================

/// Action state for form submissions
pub struct Action<I, O> {
    /// Whether the action is pending
    pub pending: crate::reactive::Signal<bool>,

    /// The last result
    pub result: crate::reactive::Signal<Option<ServerResult<O>>>,

    /// The input type marker
    _marker: std::marker::PhantomData<I>,
}

impl<I, O> Action<I, O>
where
    I: Serialize + for<'de> Deserialize<'de> + Clone + 'static,
    O: Serialize + for<'de> Deserialize<'de> + Clone + 'static,
{
    pub fn new() -> Self {
        Self {
            pending: crate::reactive::Signal::new(false),
            result: crate::reactive::Signal::new(None),
            _marker: std::marker::PhantomData,
        }
    }

    /// Submit the action
    pub async fn submit<F>(&self, input: I, action: F)
    where
        F: Fn(I) -> Pin<Box<dyn Future<Output = ServerResult<O>> + Send>> + 'static,
    {
        self.pending.set(true);
        let result = action(input).await;
        self.result.set(Some(result));
        self.pending.set(false);
    }
}

// ============================================================================
// Re-exports
// ============================================================================

pub use crate::server_fn;
