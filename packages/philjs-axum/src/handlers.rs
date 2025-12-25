//! Route handlers for Axum

use axum::{http::StatusCode, response::{IntoResponse, Json, Response}};
use serde::{Deserialize, Serialize};

/// Health check handler
pub async fn health_check() -> impl IntoResponse {
    #[derive(Serialize)]
    struct Health {
        status: &'static str,
    }
    Json(Health { status: "ok" })
}

/// Not found handler
pub async fn not_found() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "404 Not Found")
}

/// Pagination parameters
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    #[serde(default = "default_page")]
    pub page: u32,
    #[serde(default = "default_per_page")]
    pub per_page: u32,
}

fn default_page() -> u32 { 1 }
fn default_per_page() -> u32 { 10 }

impl PaginationParams {
    pub fn offset(&self) -> u32 {
        (self.page - 1) * self.per_page
    }
}

/// API response builder
pub struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    message: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self { success: true, data: Some(data), message: None }
    }

    pub fn error(message: impl Into<String>) -> ApiResponse<()> {
        ApiResponse { success: false, data: None, message: Some(message.into()) }
    }

    pub fn with_message(mut self, message: impl Into<String>) -> Self {
        self.message = Some(message.into());
        self
    }
}

impl<T: Serialize> IntoResponse for ApiResponse<T> {
    fn into_response(self) -> Response {
        #[derive(Serialize)]
        struct Resp<T> {
            success: bool,
            #[serde(skip_serializing_if = "Option::is_none")]
            data: Option<T>,
            #[serde(skip_serializing_if = "Option::is_none")]
            message: Option<String>,
        }
        Json(Resp { success: self.success, data: self.data, message: self.message }).into_response()
    }
}

/// Paginated response
#[derive(Serialize)]
pub struct PaginatedResponse<T> {
    data: Vec<T>,
    total: u32,
    page: u32,
    per_page: u32,
}

impl<T: Serialize> PaginatedResponse<T> {
    pub fn new(data: Vec<T>, total: u32, page: u32, per_page: u32) -> Self {
        Self { data, total, page, per_page }
    }
}

impl<T: Serialize> IntoResponse for PaginatedResponse<T> {
    fn into_response(self) -> Response {
        Json(self).into_response()
    }
}
