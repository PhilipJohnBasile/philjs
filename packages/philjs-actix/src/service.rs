//! PhilJS Actix service for route handling

use actix_web::{
    web, HttpRequest, HttpResponse, Responder,
    dev::{ServiceFactory, ServiceRequest, ServiceResponse},
    body::BoxBody,
    Error,
};
use philjs::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use parking_lot::RwLock;

/// PhilJS Service for handling SSR routes
pub struct PhilJsService {
    /// Route handlers
    routes: Arc<RwLock<HashMap<String, RouteHandler>>>,
    /// Fallback handler
    fallback: Option<Box<dyn Fn() -> HttpResponse + Send + Sync>>,
}

type RouteHandler = Box<dyn Fn(HttpRequest) -> HttpResponse + Send + Sync>;

impl PhilJsService {
    /// Create a new PhilJS service
    pub fn new() -> Self {
        Self {
            routes: Arc::new(RwLock::new(HashMap::new())),
            fallback: None,
        }
    }

    /// Add a route handler
    pub fn route<F, V>(self, path: &str, handler: F) -> Self
    where
        F: Fn() -> V + Send + Sync + 'static,
        V: IntoView,
    {
        let handler_fn = move |_req: HttpRequest| {
            let html = render_to_string(&handler);
            HttpResponse::Ok()
                .content_type("text/html; charset=utf-8")
                .body(html)
        };

        self.routes.write().insert(path.to_string(), Box::new(handler_fn));
        self
    }

    /// Add a route with data loader
    pub fn route_with_loader<F, V, L, D>(self, path: &str, handler: F, loader: L) -> Self
    where
        F: Fn(D) -> V + Send + Sync + Clone + 'static,
        V: IntoView,
        L: Fn(&HttpRequest) -> D + Send + Sync + 'static,
        D: Serialize + Clone + 'static,
    {
        let handler_clone = handler.clone();
        let handler_fn = move |req: HttpRequest| {
            let data = loader(&req);
            let handler = handler_clone.clone();
            let data_clone = data.clone();
            let html = render_to_string(move || handler(data_clone));
            let data_json = serde_json::to_string(&data).unwrap_or_default();

            let full_html = format!(
                r#"{}
<script type="application/json" id="__PHILJS_DATA__">{}</script>
<script>
window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);
</script>"#,
                html, data_json
            );

            HttpResponse::Ok()
                .content_type("text/html; charset=utf-8")
                .body(full_html)
        };

        self.routes.write().insert(path.to_string(), Box::new(handler_fn));
        self
    }

    /// Set fallback handler for 404
    pub fn fallback<F, V>(mut self, handler: F) -> Self
    where
        F: Fn() -> V + Send + Sync + 'static,
        V: IntoView,
    {
        self.fallback = Some(Box::new(move || {
            let html = render_to_string(&handler);
            HttpResponse::NotFound()
                .content_type("text/html; charset=utf-8")
                .body(html)
        }));
        self
    }

    /// Configure routes on a web::ServiceConfig
    pub fn configure(&self, cfg: &mut web::ServiceConfig) {
        let routes = self.routes.clone();
        let fallback = self.fallback.is_some();

        // Register each route
        for (path, _handler) in routes.read().iter() {
            let routes_clone = routes.clone();
            let path_clone = path.clone();

            cfg.route(path, web::get().to(move |req: HttpRequest| {
                let routes = routes_clone.read();
                if let Some(handler) = routes.get(&path_clone) {
                    handler(req)
                } else {
                    HttpResponse::NotFound().finish()
                }
            }));
        }
    }
}

impl Default for PhilJsService {
    fn default() -> Self {
        Self::new()
    }
}

/// API route builder for JSON endpoints
pub struct ApiService {
    /// Base path for API routes
    base_path: String,
    /// API version
    version: Option<String>,
}

impl ApiService {
    /// Create a new API service
    pub fn new(base_path: impl Into<String>) -> Self {
        Self {
            base_path: base_path.into(),
            version: None,
        }
    }

    /// Set API version
    pub fn version(mut self, version: impl Into<String>) -> Self {
        self.version = Some(version.into());
        self
    }

    /// Get the full base path
    pub fn path(&self) -> String {
        match &self.version {
            Some(v) => format!("{}/{}", self.base_path, v),
            None => self.base_path.clone(),
        }
    }

    /// Configure API routes
    pub fn configure<F>(&self, cfg: &mut web::ServiceConfig, routes: F)
    where
        F: FnOnce(&mut web::ServiceConfig),
    {
        cfg.service(
            web::scope(&self.path())
                .configure(routes)
        );
    }
}

/// Resource handler for CRUD operations
pub struct ResourceHandler<T> {
    /// Resource name
    name: String,
    /// Phantom data
    _phantom: std::marker::PhantomData<T>,
}

impl<T> ResourceHandler<T>
where
    T: Serialize + for<'de> Deserialize<'de> + 'static,
{
    /// Create a new resource handler
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            _phantom: std::marker::PhantomData,
        }
    }

    /// Get the resource path
    pub fn path(&self) -> String {
        format!("/{}", self.name)
    }

    /// Get the resource item path
    pub fn item_path(&self) -> String {
        format!("/{}/:id", self.name)
    }
}

/// Response wrapper for consistent API responses
#[derive(Serialize, Deserialize)]
pub struct ApiResponse<T> {
    /// Success flag
    pub success: bool,
    /// Response data
    pub data: Option<T>,
    /// Error message
    pub error: Option<String>,
    /// Metadata
    pub meta: Option<ResponseMeta>,
}

/// Response metadata
#[derive(Serialize, Deserialize)]
pub struct ResponseMeta {
    /// Total count for pagination
    pub total: Option<u64>,
    /// Current page
    pub page: Option<u32>,
    /// Items per page
    pub per_page: Option<u32>,
}

impl<T> ApiResponse<T> {
    /// Create a success response
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            meta: None,
        }
    }

    /// Create an error response
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.into()),
            meta: None,
        }
    }

    /// Add metadata
    pub fn with_meta(mut self, meta: ResponseMeta) -> Self {
        self.meta = Some(meta);
        self
    }
}

impl<T: Serialize> Responder for ApiResponse<T> {
    type Body = BoxBody;

    fn respond_to(self, _req: &HttpRequest) -> HttpResponse<Self::Body> {
        match serde_json::to_string(&self) {
            Ok(json) => HttpResponse::Ok()
                .content_type("application/json")
                .body(json),
            Err(e) => HttpResponse::InternalServerError()
                .body(format!("Serialization error: {}", e)),
        }
    }
}

/// Paginated response
#[derive(Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    /// Items
    pub items: Vec<T>,
    /// Total count
    pub total: u64,
    /// Current page
    pub page: u32,
    /// Items per page
    pub per_page: u32,
    /// Total pages
    pub total_pages: u32,
}

impl<T> PaginatedResponse<T> {
    /// Create a new paginated response
    pub fn new(items: Vec<T>, total: u64, page: u32, per_page: u32) -> Self {
        let total_pages = ((total as f64) / (per_page as f64)).ceil() as u32;
        Self {
            items,
            total,
            page,
            per_page,
            total_pages,
        }
    }
}

impl<T: Serialize> Responder for PaginatedResponse<T> {
    type Body = BoxBody;

    fn respond_to(self, _req: &HttpRequest) -> HttpResponse<Self::Body> {
        match serde_json::to_string(&self) {
            Ok(json) => HttpResponse::Ok()
                .content_type("application/json")
                .body(json),
            Err(e) => HttpResponse::InternalServerError()
                .body(format!("Serialization error: {}", e)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_api_response_success() {
        let response: ApiResponse<String> = ApiResponse::success("test".to_string());
        assert!(response.success);
        assert_eq!(response.data, Some("test".to_string()));
        assert!(response.error.is_none());
    }

    #[test]
    fn test_api_response_error() {
        let response: ApiResponse<String> = ApiResponse::error("Something went wrong");
        assert!(!response.success);
        assert!(response.data.is_none());
        assert_eq!(response.error, Some("Something went wrong".to_string()));
    }

    #[test]
    fn test_paginated_response() {
        let response = PaginatedResponse::new(vec![1, 2, 3], 100, 1, 10);
        assert_eq!(response.items.len(), 3);
        assert_eq!(response.total, 100);
        assert_eq!(response.total_pages, 10);
    }
}
