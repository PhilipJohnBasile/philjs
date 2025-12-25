//! Pre-built route handlers for common use cases

use rocket::http::Status;
use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};
use crate::responders::{PhilJsHtml, PhilJsJson, PhilJsError, ApiResponse, PaginatedResponse};

/// Health check response
#[derive(Serialize)]
pub struct HealthCheck {
    /// Status
    pub status: &'static str,
    /// Timestamp
    pub timestamp: i64,
    /// Version
    pub version: Option<String>,
}

/// Health check handler
///
/// # Example
///
/// ```rust
/// use rocket::routes;
/// use philjs_rocket::handlers::health_check;
///
/// #[launch]
/// fn rocket() -> _ {
///     rocket::build().mount("/", routes![health_check])
/// }
/// ```
#[rocket::get("/health")]
pub async fn health_check() -> Json<HealthCheck> {
    Json(HealthCheck {
        status: "ok",
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64,
        version: Some(env!("CARGO_PKG_VERSION").to_string()),
    })
}

/// Not found handler
///
/// Returns a 404 response with a custom HTML page.
pub async fn not_found_html() -> PhilJsHtml {
    PhilJsHtml::not_found(
        r#"<!DOCTYPE html>
<html>
<head>
    <title>404 Not Found</title>
    <style>
        body { font-family: sans-serif; text-align: center; padding: 50px; }
        h1 { color: #e74c3c; }
    </style>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
</body>
</html>"#,
    )
}

/// Not found JSON handler
pub async fn not_found_json() -> PhilJsError {
    PhilJsError::not_found("Resource not found")
}

/// Error handler builder
///
/// Creates a custom error handler for specific HTTP status codes.
pub struct ErrorHandler {
    status: Status,
    message: String,
}

impl ErrorHandler {
    /// Create a new error handler
    pub fn new(status: Status, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
        }
    }

    /// Render the error as an HTML response
    pub fn html(&self) -> PhilJsHtml {
        let html = format!(
            r#"<!DOCTYPE html>
<html>
<head>
    <title>{} - Error</title>
    <style>
        body {{ font-family: sans-serif; text-align: center; padding: 50px; }}
        h1 {{ color: #e74c3c; }}
    </style>
</head>
<body>
    <h1>{} - Error</h1>
    <p>{}</p>
</body>
</html>"#,
            self.status.code, self.status.code, self.message
        );
        PhilJsHtml::new(html).status(self.status)
    }

    /// Render the error as a JSON response
    pub fn json(&self) -> PhilJsError {
        PhilJsError::new(self.status, &self.message)
    }
}

/// Pagination parameters
#[derive(Debug, Clone, Deserialize)]
pub struct PaginationParams {
    /// Current page (1-indexed)
    #[serde(default = "default_page")]
    pub page: u32,
    /// Items per page
    #[serde(default = "default_per_page")]
    pub per_page: u32,
}

fn default_page() -> u32 {
    1
}

fn default_per_page() -> u32 {
    10
}

impl PaginationParams {
    /// Get the offset for SQL queries
    pub fn offset(&self) -> u32 {
        (self.page.saturating_sub(1)) * self.per_page
    }

    /// Get the limit for SQL queries
    pub fn limit(&self) -> u32 {
        self.per_page.min(100) // Cap at 100
    }
}

impl Default for PaginationParams {
    fn default() -> Self {
        Self {
            page: 1,
            per_page: 10,
        }
    }
}

/// Redirect helper
pub fn redirect(to: &str, permanent: bool) -> rocket::response::Redirect {
    if permanent {
        rocket::response::Redirect::permanent(to.to_string())
    } else {
        rocket::response::Redirect::to(to.to_string())
    }
}

/// API success response helper
pub fn api_success<T: Serialize>(data: T) -> ApiResponse<T> {
    ApiResponse::success(data)
}

/// API error response helper
pub fn api_error(message: impl Into<String>) -> ApiResponse<()> {
    ApiResponse::error(message)
}

/// Paginated response helper
pub fn paginated<T: Serialize>(
    data: Vec<T>,
    total: u64,
    params: &PaginationParams,
) -> PaginatedResponse<T> {
    PaginatedResponse::new(data, total, params.page, params.per_page)
}

/// CORS preflight handler
#[rocket::options("/<_path..>")]
pub async fn cors_preflight(_path: std::path::PathBuf) -> Status {
    Status::NoContent
}

/// Static file serving configuration
pub struct StaticFileConfig {
    /// Root directory
    pub root: String,
    /// Cache max-age in seconds
    pub cache_max_age: u32,
    /// Enable ETag
    pub etag: bool,
}

impl Default for StaticFileConfig {
    fn default() -> Self {
        Self {
            root: "static".to_string(),
            cache_max_age: 3600,
            etag: true,
        }
    }
}

/// CRUD handler trait for resource endpoints
pub trait CrudHandler<T, ID> {
    /// List all resources
    fn list(&self) -> impl std::future::Future<Output = Vec<T>> + Send;

    /// Get a single resource
    fn get(&self, id: ID) -> impl std::future::Future<Output = Option<T>> + Send;

    /// Create a new resource
    fn create(&self, data: T) -> impl std::future::Future<Output = T> + Send;

    /// Update a resource
    fn update(&self, id: ID, data: T) -> impl std::future::Future<Output = Option<T>> + Send;

    /// Delete a resource
    fn delete(&self, id: ID) -> impl std::future::Future<Output = bool> + Send;
}

/// Versioned API helper
pub struct ApiVersion {
    /// Major version
    pub major: u32,
    /// Minor version
    pub minor: u32,
}

impl ApiVersion {
    /// Create a new API version
    pub fn new(major: u32, minor: u32) -> Self {
        Self { major, minor }
    }

    /// Get the version string
    pub fn as_string(&self) -> String {
        format!("v{}.{}", self.major, self.minor)
    }

    /// Get the path prefix
    pub fn path_prefix(&self) -> String {
        format!("/api/v{}", self.major)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pagination_params() {
        let params = PaginationParams {
            page: 2,
            per_page: 20,
        };
        assert_eq!(params.offset(), 20);
        assert_eq!(params.limit(), 20);
    }

    #[test]
    fn test_pagination_limit_cap() {
        let params = PaginationParams {
            page: 1,
            per_page: 200, // Over the cap
        };
        assert_eq!(params.limit(), 100); // Should be capped
    }

    #[test]
    fn test_error_handler() {
        let handler = ErrorHandler::new(Status::NotFound, "Resource not found");
        let json_response = handler.json();
        assert_eq!(json_response.status, Status::NotFound);
    }

    #[test]
    fn test_api_version() {
        let version = ApiVersion::new(2, 1);
        assert_eq!(version.as_string(), "v2.1");
        assert_eq!(version.path_prefix(), "/api/v2");
    }
}
