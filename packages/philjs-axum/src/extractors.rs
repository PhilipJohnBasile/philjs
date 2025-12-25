//! Custom extractors for Axum

use axum::{
    async_trait,
    extract::{FromRequest, FromRequestParts, Request},
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde::de::DeserializeOwned;
use std::ops::Deref;

/// JSON extractor with better error handling
pub struct PhilJsJson<T>(pub T);

impl<T> Deref for PhilJsJson<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[async_trait]
impl<T, S> FromRequest<S> for PhilJsJson<T>
where
    T: DeserializeOwned,
    S: Send + Sync,
{
    type Rejection = Response;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        match Json::<T>::from_request(req, state).await {
            Ok(Json(value)) => Ok(PhilJsJson(value)),
            Err(err) => Err((
                StatusCode::BAD_REQUEST,
                format!("Invalid JSON: {}", err),
            )
                .into_response()),
        }
    }
}

/// Query parameter extractor
pub struct PhilJsQuery<T>(pub T);

impl<T> Deref for PhilJsQuery<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[async_trait]
impl<T, S> FromRequestParts<S> for PhilJsQuery<T>
where
    T: DeserializeOwned,
    S: Send + Sync,
{
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        match axum::extract::Query::<T>::from_request_parts(parts, state).await {
            Ok(axum::extract::Query(value)) => Ok(PhilJsQuery(value)),
            Err(err) => Err((
                StatusCode::BAD_REQUEST,
                format!("Invalid query parameters: {}", err),
            )
                .into_response()),
        }
    }
}

/// SSR context extractor
#[derive(Debug, Clone)]
pub struct SsrContext {
    user_agent: Option<String>,
    path: String,
    query: String,
}

impl SsrContext {
    /// Get user agent
    pub fn user_agent(&self) -> Option<&str> {
        self.user_agent.as_deref()
    }

    /// Get request path
    pub fn path(&self) -> &str {
        &self.path
    }

    /// Get query string
    pub fn query(&self) -> &str {
        &self.query
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for SsrContext
where
    S: Send + Sync,
{
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let user_agent = parts
            .headers
            .get("user-agent")
            .and_then(|v| v.to_str().ok())
            .map(|s| s.to_string());

        let path = parts.uri.path().to_string();
        let query = parts.uri.query().unwrap_or_default().to_string();

        Ok(SsrContext {
            user_agent,
            path,
            query,
        })
    }
}
