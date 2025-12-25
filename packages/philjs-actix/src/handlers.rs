//! Pre-built route handlers for common use cases
//!
//! This module provides ready-to-use handlers for common patterns in PhilJS applications.

use actix_web::{HttpRequest, HttpResponse, Responder, web};
use serde::{Deserialize, Serialize};
use std::future::Future;
use std::pin::Pin;

/// Handler function type for SSR pages
pub type SsrHandler = fn() -> Pin<Box<dyn Future<Output = HttpResponse>>>;

/// Health check handler
///
/// Returns a simple health check response that can be used for monitoring.
///
/// # Example
///
/// ```rust
/// use actix_web::{web, App};
/// use philjs_actix::handlers::health_check;
///
/// let app = App::new()
///     .route("/health", web::get().to(health_check));
/// ```
pub async fn health_check() -> impl Responder {
    #[derive(Serialize)]
    struct HealthCheck {
        status: &'static str,
        timestamp: i64,
    }

    let health = HealthCheck {
        status: "ok",
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64,
    };

    HttpResponse::Ok().json(health)
}

/// Not found handler
///
/// Returns a 404 response with a custom page.
///
/// # Example
///
/// ```rust
/// use actix_web::App;
/// use philjs_actix::handlers::not_found;
///
/// let app = App::new()
///     .default_service(web::to(not_found));
/// ```
pub async fn not_found() -> impl Responder {
    HttpResponse::NotFound()
        .content_type("text/html")
        .body(
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

/// Error handler builder
///
/// Creates a custom error handler for specific HTTP status codes.
///
/// # Example
///
/// ```rust
/// use philjs_actix::handlers::ErrorHandler;
///
/// let handler = ErrorHandler::new(500, "Internal Server Error");
/// ```
pub struct ErrorHandler {
    status: u16,
    message: String,
}

impl ErrorHandler {
    /// Create a new error handler
    pub fn new(status: u16, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
        }
    }

    /// Render the error as an HTML response
    pub fn html(&self) -> HttpResponse {
        HttpResponse::build(actix_web::http::StatusCode::from_u16(self.status).unwrap())
            .content_type("text/html")
            .body(format!(
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
                self.status, self.status, self.message
            ))
    }

    /// Render the error as a JSON response
    pub fn json(&self) -> HttpResponse {
        #[derive(Serialize)]
        struct ErrorResponse {
            status: u16,
            message: String,
        }

        HttpResponse::build(actix_web::http::StatusCode::from_u16(self.status).unwrap()).json(
            ErrorResponse {
                status: self.status,
                message: self.message.clone(),
            },
        )
    }
}

/// CORS handler
///
/// Handles CORS preflight requests.
///
/// # Example
///
/// ```rust
/// use actix_web::{web, App};
/// use philjs_actix::handlers::cors_preflight;
///
/// let app = App::new()
///     .route("/api/{path:.*}", web::options().to(cors_preflight));
/// ```
pub async fn cors_preflight() -> impl Responder {
    HttpResponse::Ok()
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .insert_header(("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"))
        .insert_header(("Access-Control-Allow-Headers", "Content-Type, Authorization"))
        .insert_header(("Access-Control-Max-Age", "3600"))
        .finish()
}

/// Static file handler with caching
///
/// Serves static files with appropriate caching headers.
///
/// # Example
///
/// ```rust
/// use actix_web::{web, App};
/// use philjs_actix::handlers::StaticFileHandler;
///
/// let handler = StaticFileHandler::new("./public")
///     .with_cache_duration(3600);
/// ```
#[cfg(feature = "static-files")]
pub struct StaticFileHandler {
    root: String,
    cache_duration: u32,
}

#[cfg(feature = "static-files")]
impl StaticFileHandler {
    /// Create a new static file handler
    pub fn new(root: impl Into<String>) -> Self {
        Self {
            root: root.into(),
            cache_duration: 0,
        }
    }

    /// Set cache duration in seconds
    pub fn with_cache_duration(mut self, seconds: u32) -> Self {
        self.cache_duration = seconds;
        self
    }

    /// Build the handler
    pub fn build(self) -> actix_files::Files {
        let mut files = actix_files::Files::new("/static", &self.root);

        if self.cache_duration > 0 {
            files = files.use_etag(true).use_last_modified(true);
        }

        files
    }
}

/// API response builder
///
/// Builds standardized JSON API responses.
///
/// # Example
///
/// ```rust
/// use philjs_actix::handlers::ApiResponse;
///
/// let response = ApiResponse::success(data)
///     .with_message("User created successfully")
///     .build();
/// ```
pub struct ApiResponse<T: Serialize> {
    success: bool,
    data: Option<T>,
    message: Option<String>,
    errors: Vec<String>,
}

impl<T: Serialize> ApiResponse<T> {
    /// Create a success response
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
            errors: Vec::new(),
        }
    }

    /// Create an error response
    pub fn error(message: impl Into<String>) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            message: Some(message.into()),
            errors: Vec::new(),
        }
    }

    /// Add a message
    pub fn with_message(mut self, message: impl Into<String>) -> Self {
        self.message = Some(message.into());
        self
    }

    /// Add an error
    pub fn with_error(mut self, error: impl Into<String>) -> Self {
        self.errors.push(error.into());
        self
    }

    /// Build the HTTP response
    pub fn build(self) -> HttpResponse {
        #[derive(Serialize)]
        struct Response<T> {
            success: bool,
            #[serde(skip_serializing_if = "Option::is_none")]
            data: Option<T>,
            #[serde(skip_serializing_if = "Option::is_none")]
            message: Option<String>,
            #[serde(skip_serializing_if = "Vec::is_empty")]
            errors: Vec<String>,
        }

        let status = if self.success {
            actix_web::http::StatusCode::OK
        } else {
            actix_web::http::StatusCode::BAD_REQUEST
        };

        HttpResponse::build(status).json(Response {
            success: self.success,
            data: self.data,
            message: self.message,
            errors: self.errors,
        })
    }
}

/// Redirect handler
///
/// Creates redirect responses.
///
/// # Example
///
/// ```rust
/// use philjs_actix::handlers::redirect;
///
/// async fn old_route() -> impl Responder {
///     redirect("/new-route", false)
/// }
/// ```
pub fn redirect(to: &str, permanent: bool) -> HttpResponse {
    let status = if permanent {
        actix_web::http::StatusCode::MOVED_PERMANENTLY
    } else {
        actix_web::http::StatusCode::FOUND
    };

    HttpResponse::build(status)
        .insert_header(("Location", to))
        .finish()
}

/// Pagination parameters
#[derive(Debug, Clone, Deserialize)]
pub struct PaginationParams {
    #[serde(default = "default_page")]
    pub page: u32,
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
        (self.page - 1) * self.per_page
    }

    /// Get the limit for SQL queries
    pub fn limit(&self) -> u32 {
        self.per_page
    }
}

/// Paginated response builder
///
/// # Example
///
/// ```rust
/// use philjs_actix::handlers::{PaginatedResponse, PaginationParams};
///
/// async fn list_users(params: web::Query<PaginationParams>) -> impl Responder {
///     let total = 100;
///     let users = vec![/* ... */];
///
///     PaginatedResponse::new(users, total, params.page, params.per_page).build()
/// }
/// ```
pub struct PaginatedResponse<T: Serialize> {
    data: Vec<T>,
    total: u32,
    page: u32,
    per_page: u32,
}

impl<T: Serialize> PaginatedResponse<T> {
    /// Create a new paginated response
    pub fn new(data: Vec<T>, total: u32, page: u32, per_page: u32) -> Self {
        Self {
            data,
            total,
            page,
            per_page,
        }
    }

    /// Build the HTTP response
    pub fn build(self) -> HttpResponse {
        #[derive(Serialize)]
        struct Response<T> {
            data: Vec<T>,
            pagination: Pagination,
        }

        #[derive(Serialize)]
        struct Pagination {
            total: u32,
            page: u32,
            per_page: u32,
            total_pages: u32,
        }

        let total_pages = (self.total + self.per_page - 1) / self.per_page;

        HttpResponse::Ok().json(Response {
            data: self.data,
            pagination: Pagination {
                total: self.total,
                page: self.page,
                per_page: self.per_page,
                total_pages,
            },
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::test;

    #[actix_rt::test]
    async fn test_health_check() {
        let resp = health_check().await.respond_to(&test::TestRequest::default().to_http_request());
        assert_eq!(resp.status(), actix_web::http::StatusCode::OK);
    }

    #[actix_rt::test]
    async fn test_not_found() {
        let resp = not_found().await.respond_to(&test::TestRequest::default().to_http_request());
        assert_eq!(resp.status(), actix_web::http::StatusCode::NOT_FOUND);
    }

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
    fn test_api_response_success() {
        let response = ApiResponse::success("test")
            .with_message("Success")
            .build();
        assert_eq!(response.status(), actix_web::http::StatusCode::OK);
    }

    #[test]
    fn test_api_response_error() {
        let response = ApiResponse::<()>::error("Error occurred").build();
        assert_eq!(response.status(), actix_web::http::StatusCode::BAD_REQUEST);
    }
}
