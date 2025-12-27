//! Response types

use axum::{
    http::{header, StatusCode},
    response::{IntoResponse, Response},
};
use serde::Serialize;

/// HTML response
pub struct HtmlResponse {
    html: String,
    status: StatusCode,
}

impl HtmlResponse {
    /// Create a new HTML response
    pub fn new(html: impl Into<String>) -> Self {
        HtmlResponse {
            html: html.into(),
            status: StatusCode::OK,
        }
    }

    /// Set the status code
    pub fn status(mut self, status: StatusCode) -> Self {
        self.status = status;
        self
    }
}

impl IntoResponse for HtmlResponse {
    fn into_response(self) -> Response {
        (
            self.status,
            [(header::CONTENT_TYPE, "text/html; charset=utf-8")],
            self.html,
        )
            .into_response()
    }
}

/// JSON response
pub struct JsonResponse<T> {
    data: T,
    status: StatusCode,
}

impl<T: Serialize> JsonResponse<T> {
    /// Create a new JSON response
    pub fn new(data: T) -> Self {
        JsonResponse {
            data,
            status: StatusCode::OK,
        }
    }

    /// Set the status code
    pub fn status(mut self, status: StatusCode) -> Self {
        self.status = status;
        self
    }
}

impl<T: Serialize> IntoResponse for JsonResponse<T> {
    fn into_response(self) -> Response {
        let json = serde_json::to_string(&self.data).unwrap_or_default();
        (
            self.status,
            [(header::CONTENT_TYPE, "application/json")],
            json,
        )
            .into_response()
    }
}

/// Redirect response
pub struct Redirect {
    location: String,
    status: StatusCode,
}

impl Redirect {
    /// Create a temporary redirect (302)
    pub fn to(location: impl Into<String>) -> Self {
        Redirect {
            location: location.into(),
            status: StatusCode::FOUND,
        }
    }

    /// Create a permanent redirect (301)
    pub fn permanent(location: impl Into<String>) -> Self {
        Redirect {
            location: location.into(),
            status: StatusCode::MOVED_PERMANENTLY,
        }
    }

    /// Create a see other redirect (303)
    pub fn see_other(location: impl Into<String>) -> Self {
        Redirect {
            location: location.into(),
            status: StatusCode::SEE_OTHER,
        }
    }
}

impl IntoResponse for Redirect {
    fn into_response(self) -> Response {
        (
            self.status,
            [(header::LOCATION, self.location)],
        )
            .into_response()
    }
}

/// Stream response for SSR streaming
///
/// Streaming SSR enables progressive HTML rendering with Suspense boundaries.
/// This is a placeholder for the streaming implementation - see `render_stream`
/// in handler.rs for the current synchronous approach.
pub struct StreamResponse {
    // Streaming body implementation pending - using sync rendering for now
}
