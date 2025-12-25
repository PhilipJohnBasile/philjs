//! Custom responders for PhilJS Rocket integration
//!
//! Responders are Rocket's way of creating HTTP responses.

use rocket::http::{ContentType, Status};
use rocket::response::{Responder, Response};
use rocket::request::Request;
use serde::Serialize;
use std::io::Cursor;

/// HTML response responder
pub struct PhilJsHtml {
    html: String,
    status: Status,
}

impl PhilJsHtml {
    /// Create a new HTML response
    pub fn new(html: impl Into<String>) -> Self {
        Self {
            html: html.into(),
            status: Status::Ok,
        }
    }

    /// Set the HTTP status
    pub fn status(mut self, status: Status) -> Self {
        self.status = status;
        self
    }

    /// Create a not found response
    pub fn not_found(html: impl Into<String>) -> Self {
        Self {
            html: html.into(),
            status: Status::NotFound,
        }
    }

    /// Create a server error response
    pub fn server_error(html: impl Into<String>) -> Self {
        Self {
            html: html.into(),
            status: Status::InternalServerError,
        }
    }
}

impl<'r> Responder<'r, 'static> for PhilJsHtml {
    fn respond_to(self, _request: &'r Request<'_>) -> rocket::response::Result<'static> {
        Response::build()
            .status(self.status)
            .header(ContentType::HTML)
            .sized_body(self.html.len(), Cursor::new(self.html))
            .ok()
    }
}

/// JSON response responder
pub struct PhilJsJson<T> {
    data: T,
    status: Status,
}

impl<T: Serialize> PhilJsJson<T> {
    /// Create a new JSON response
    pub fn new(data: T) -> Self {
        Self {
            data,
            status: Status::Ok,
        }
    }

    /// Set the HTTP status
    pub fn status(mut self, status: Status) -> Self {
        self.status = status;
        self
    }

    /// Create a created response (201)
    pub fn created(data: T) -> Self {
        Self {
            data,
            status: Status::Created,
        }
    }
}

impl<'r, T: Serialize> Responder<'r, 'static> for PhilJsJson<T> {
    fn respond_to(self, _request: &'r Request<'_>) -> rocket::response::Result<'static> {
        let json = serde_json::to_string(&self.data)
            .map_err(|_| Status::InternalServerError)?;

        Response::build()
            .status(self.status)
            .header(ContentType::JSON)
            .sized_body(json.len(), Cursor::new(json))
            .ok()
    }
}

/// Streaming response responder
pub struct PhilJsStream {
    html: String,
}

impl PhilJsStream {
    /// Create a new streaming response
    pub fn new(html: impl Into<String>) -> Self {
        Self { html: html.into() }
    }
}

impl<'r> Responder<'r, 'static> for PhilJsStream {
    fn respond_to(self, _request: &'r Request<'_>) -> rocket::response::Result<'static> {
        Response::build()
            .status(Status::Ok)
            .header(ContentType::HTML)
            .raw_header("Transfer-Encoding", "chunked")
            .sized_body(self.html.len(), Cursor::new(self.html))
            .ok()
    }
}

/// Error response responder
#[derive(Debug)]
pub struct PhilJsError {
    status: Status,
    message: String,
    details: Option<serde_json::Value>,
}

impl PhilJsError {
    /// Create a new error response
    pub fn new(status: Status, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
            details: None,
        }
    }

    /// Add error details
    pub fn with_details(mut self, details: serde_json::Value) -> Self {
        self.details = Some(details);
        self
    }

    /// Create a not found error
    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(Status::NotFound, message)
    }

    /// Create a bad request error
    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::new(Status::BadRequest, message)
    }

    /// Create an unauthorized error
    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self::new(Status::Unauthorized, message)
    }

    /// Create a forbidden error
    pub fn forbidden(message: impl Into<String>) -> Self {
        Self::new(Status::Forbidden, message)
    }

    /// Create an internal server error
    pub fn internal(message: impl Into<String>) -> Self {
        Self::new(Status::InternalServerError, message)
    }
}

impl<'r> Responder<'r, 'static> for PhilJsError {
    fn respond_to(self, _request: &'r Request<'_>) -> rocket::response::Result<'static> {
        #[derive(Serialize)]
        struct ErrorBody {
            error: String,
            status: u16,
            #[serde(skip_serializing_if = "Option::is_none")]
            details: Option<serde_json::Value>,
        }

        let body = ErrorBody {
            error: self.message,
            status: self.status.code,
            details: self.details,
        };

        let json = serde_json::to_string(&body).unwrap_or_else(|_| {
            format!(r#"{{"error":"Internal Server Error","status":500}}"#)
        });

        Response::build()
            .status(self.status)
            .header(ContentType::JSON)
            .sized_body(json.len(), Cursor::new(json))
            .ok()
    }
}

/// Redirect response
pub struct PhilJsRedirect {
    location: String,
    status: Status,
}

impl PhilJsRedirect {
    /// Create a temporary redirect (302)
    pub fn to(location: impl Into<String>) -> Self {
        Self {
            location: location.into(),
            status: Status::Found,
        }
    }

    /// Create a permanent redirect (301)
    pub fn permanent(location: impl Into<String>) -> Self {
        Self {
            location: location.into(),
            status: Status::MovedPermanently,
        }
    }

    /// Create a see other redirect (303)
    pub fn see_other(location: impl Into<String>) -> Self {
        Self {
            location: location.into(),
            status: Status::SeeOther,
        }
    }

    /// Create a temporary redirect (307)
    pub fn temporary(location: impl Into<String>) -> Self {
        Self {
            location: location.into(),
            status: Status::TemporaryRedirect,
        }
    }
}

impl<'r> Responder<'r, 'static> for PhilJsRedirect {
    fn respond_to(self, _request: &'r Request<'_>) -> rocket::response::Result<'static> {
        Response::build()
            .status(self.status)
            .raw_header("Location", self.location)
            .ok()
    }
}

/// Empty response (204 No Content)
pub struct PhilJsEmpty;

impl<'r> Responder<'r, 'static> for PhilJsEmpty {
    fn respond_to(self, _request: &'r Request<'_>) -> rocket::response::Result<'static> {
        Response::build()
            .status(Status::NoContent)
            .ok()
    }
}

/// API response wrapper for consistent JSON responses
#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
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

    /// Add a message
    pub fn with_message(mut self, message: impl Into<String>) -> Self {
        self.message = Some(message.into());
        self
    }
}

impl ApiResponse<()> {
    /// Create an error response
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            message: Some(message.into()),
            errors: Vec::new(),
        }
    }

    /// Add an error to the list
    pub fn with_error(mut self, error: impl Into<String>) -> Self {
        self.errors.push(error.into());
        self
    }
}

impl<'r, T: Serialize> Responder<'r, 'static> for ApiResponse<T> {
    fn respond_to(self, _request: &'r Request<'_>) -> rocket::response::Result<'static> {
        let status = if self.success {
            Status::Ok
        } else {
            Status::BadRequest
        };

        let json = serde_json::to_string(&self)
            .map_err(|_| Status::InternalServerError)?;

        Response::build()
            .status(status)
            .header(ContentType::JSON)
            .sized_body(json.len(), Cursor::new(json))
            .ok()
    }
}

/// Paginated response
#[derive(Serialize)]
pub struct PaginatedResponse<T: Serialize> {
    data: Vec<T>,
    pagination: PaginationMeta,
}

#[derive(Serialize)]
struct PaginationMeta {
    total: u64,
    page: u32,
    per_page: u32,
    total_pages: u32,
}

impl<T: Serialize> PaginatedResponse<T> {
    /// Create a new paginated response
    pub fn new(data: Vec<T>, total: u64, page: u32, per_page: u32) -> Self {
        let total_pages = ((total as f64) / (per_page as f64)).ceil() as u32;

        Self {
            data,
            pagination: PaginationMeta {
                total,
                page,
                per_page,
                total_pages,
            },
        }
    }
}

impl<'r, T: Serialize> Responder<'r, 'static> for PaginatedResponse<T> {
    fn respond_to(self, _request: &'r Request<'_>) -> rocket::response::Result<'static> {
        let json = serde_json::to_string(&self)
            .map_err(|_| Status::InternalServerError)?;

        Response::build()
            .status(Status::Ok)
            .header(ContentType::JSON)
            .sized_body(json.len(), Cursor::new(json))
            .ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_philjs_html() {
        let html = PhilJsHtml::new("<h1>Hello</h1>");
        assert_eq!(html.status, Status::Ok);

        let not_found = PhilJsHtml::not_found("<h1>Not Found</h1>");
        assert_eq!(not_found.status, Status::NotFound);
    }

    #[test]
    fn test_philjs_error() {
        let error = PhilJsError::not_found("Resource not found");
        assert_eq!(error.status, Status::NotFound);

        let bad_request = PhilJsError::bad_request("Invalid input");
        assert_eq!(bad_request.status, Status::BadRequest);
    }

    #[test]
    fn test_paginated_response() {
        let response = PaginatedResponse::new(
            vec![1, 2, 3],
            100,
            1,
            10,
        );
        assert_eq!(response.pagination.total, 100);
        assert_eq!(response.pagination.total_pages, 10);
    }
}
