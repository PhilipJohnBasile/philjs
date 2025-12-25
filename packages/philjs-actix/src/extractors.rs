//! Custom extractors for PhilJS Actix-web integration
//!
//! This module provides custom extractors that make it easier to work with
//! PhilJS components and data in Actix-web handlers.

use actix_web::{dev::Payload, error::ErrorBadRequest, FromRequest, HttpRequest};
use futures::future::{ready, Ready};
use serde::{Deserialize, Serialize};
use std::ops::Deref;

/// Extract JSON data with better error messages
///
/// # Example
///
/// ```rust
/// use philjs_actix::extractors::Json;
/// use serde::Deserialize;
///
/// #[derive(Deserialize)]
/// struct CreateUser {
///     name: String,
///     email: String,
/// }
///
/// async fn create_user(Json(user): Json<CreateUser>) -> impl Responder {
///     // user data is available here
///     HttpResponse::Ok().json(user)
/// }
/// ```
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Json<T>(pub T);

impl<T> Deref for Json<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T> FromRequest for Json<T>
where
    T: for<'de> Deserialize<'de> + 'static,
{
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, payload: &mut Payload) -> Self::Future {
        let config = actix_web::web::JsonConfig::default()
            .limit(1024 * 1024) // 1MB limit
            .error_handler(|err, _req| ErrorBadRequest(format!("JSON error: {}", err)));

        ready(
            actix_web::web::Json::<T>::from_request(req, payload)
                .into_inner()
                .map(|json| Json(json.into_inner()))
                .map_err(|e| ErrorBadRequest(format!("Invalid JSON: {}", e))),
        )
    }
}

/// Extract form data with better error messages
///
/// # Example
///
/// ```rust
/// use philjs_actix::extractors::Form;
/// use serde::Deserialize;
///
/// #[derive(Deserialize)]
/// struct LoginForm {
///     username: String,
///     password: String,
/// }
///
/// async fn login(Form(form): Form<LoginForm>) -> impl Responder {
///     HttpResponse::Ok().body(format!("Logging in {}", form.username))
/// }
/// ```
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Form<T>(pub T);

impl<T> Deref for Form<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T> FromRequest for Form<T>
where
    T: for<'de> Deserialize<'de> + 'static,
{
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, payload: &mut Payload) -> Self::Future {
        ready(
            actix_web::web::Form::<T>::from_request(req, payload)
                .into_inner()
                .map(|form| Form(form.into_inner()))
                .map_err(|e| ErrorBadRequest(format!("Invalid form data: {}", e))),
        )
    }
}

/// Extract path parameters with better error messages
///
/// # Example
///
/// ```rust
/// use philjs_actix::extractors::Path;
/// use serde::Deserialize;
///
/// #[derive(Deserialize)]
/// struct UserPath {
///     id: i64,
/// }
///
/// async fn get_user(Path(params): Path<UserPath>) -> impl Responder {
///     HttpResponse::Ok().body(format!("User ID: {}", params.id))
/// }
/// ```
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Path<T>(pub T);

impl<T> Deref for Path<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T> FromRequest for Path<T>
where
    T: for<'de> Deserialize<'de> + 'static,
{
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        ready(
            actix_web::web::Path::<T>::extract(req)
                .into_inner()
                .map(|path| Path(path.into_inner()))
                .map_err(|e| ErrorBadRequest(format!("Invalid path parameters: {}", e))),
        )
    }
}

/// Extract query parameters with better error messages
///
/// # Example
///
/// ```rust
/// use philjs_actix::extractors::Query;
/// use serde::Deserialize;
///
/// #[derive(Deserialize)]
/// struct Pagination {
///     page: Option<u32>,
///     per_page: Option<u32>,
/// }
///
/// async fn list_users(Query(params): Query<Pagination>) -> impl Responder {
///     let page = params.page.unwrap_or(1);
///     let per_page = params.per_page.unwrap_or(10);
///     HttpResponse::Ok().body(format!("Page {} with {} items", page, per_page))
/// }
/// ```
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Query<T>(pub T);

impl<T> Deref for Query<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T> FromRequest for Query<T>
where
    T: for<'de> Deserialize<'de> + 'static,
{
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        ready(
            actix_web::web::Query::<T>::from_query(req.query_string())
                .map(|query| Query(query.into_inner()))
                .map_err(|e| ErrorBadRequest(format!("Invalid query parameters: {}", e))),
        )
    }
}

/// Extract SSR context data
///
/// This extractor provides access to SSR-specific context data like
/// request headers, cookies, and session information.
///
/// # Example
///
/// ```rust
/// use philjs_actix::extractors::SsrContext;
///
/// async fn ssr_page(ctx: SsrContext) -> impl Responder {
///     let user_agent = ctx.user_agent();
///     render_to_response(|| view! {
///         <div>"User Agent: " {user_agent}</div>
///     })
/// }
/// ```
#[derive(Debug, Clone)]
pub struct SsrContext {
    user_agent: Option<String>,
    cookies: Vec<(String, String)>,
    headers: Vec<(String, String)>,
    path: String,
    query: String,
}

impl SsrContext {
    /// Get the user agent string
    pub fn user_agent(&self) -> Option<&str> {
        self.user_agent.as_deref()
    }

    /// Get a cookie by name
    pub fn cookie(&self, name: &str) -> Option<&str> {
        self.cookies
            .iter()
            .find(|(k, _)| k == name)
            .map(|(_, v)| v.as_str())
    }

    /// Get a header by name
    pub fn header(&self, name: &str) -> Option<&str> {
        self.headers
            .iter()
            .find(|(k, _)| k.eq_ignore_ascii_case(name))
            .map(|(_, v)| v.as_str())
    }

    /// Get the request path
    pub fn path(&self) -> &str {
        &self.path
    }

    /// Get the query string
    pub fn query(&self) -> &str {
        &self.query
    }

    /// Get all cookies
    pub fn cookies(&self) -> &[(String, String)] {
        &self.cookies
    }

    /// Get all headers
    pub fn headers(&self) -> &[(String, String)] {
        &self.headers
    }
}

impl FromRequest for SsrContext {
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        let user_agent = req
            .headers()
            .get("user-agent")
            .and_then(|v| v.to_str().ok())
            .map(|s| s.to_string());

        let cookies = req
            .cookies()
            .map(|cookies| {
                cookies
                    .iter()
                    .map(|c| (c.name().to_string(), c.value().to_string()))
                    .collect()
            })
            .unwrap_or_default();

        let headers = req
            .headers()
            .iter()
            .map(|(k, v)| {
                (
                    k.as_str().to_string(),
                    v.to_str().unwrap_or_default().to_string(),
                )
            })
            .collect();

        let path = req.path().to_string();
        let query = req.query_string().to_string();

        ready(Ok(SsrContext {
            user_agent,
            cookies,
            headers,
            path,
            query,
        }))
    }
}

/// Extract connection info
///
/// # Example
///
/// ```rust
/// use philjs_actix::extractors::ConnectionInfo;
///
/// async fn handler(conn: ConnectionInfo) -> impl Responder {
///     HttpResponse::Ok().body(format!("Request from: {}", conn.remote_addr()))
/// }
/// ```
#[derive(Debug, Clone)]
pub struct ConnectionInfo {
    remote_addr: Option<String>,
    scheme: String,
    host: String,
}

impl ConnectionInfo {
    /// Get the remote address
    pub fn remote_addr(&self) -> Option<&str> {
        self.remote_addr.as_deref()
    }

    /// Get the scheme (http/https)
    pub fn scheme(&self) -> &str {
        &self.scheme
    }

    /// Get the host
    pub fn host(&self) -> &str {
        &self.host
    }
}

impl FromRequest for ConnectionInfo {
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        let conn_info = req.connection_info();
        let remote_addr = conn_info.peer_addr().map(|s| s.to_string());
        let scheme = conn_info.scheme().to_string();
        let host = conn_info.host().to_string();

        ready(Ok(ConnectionInfo {
            remote_addr,
            scheme,
            host,
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::test;

    #[actix_rt::test]
    async fn test_ssr_context_extraction() {
        let req = test::TestRequest::default()
            .insert_header(("user-agent", "test-agent"))
            .uri("/test?page=1")
            .to_http_request();

        let mut payload = Payload::None;
        let ctx = SsrContext::from_request(&req, &mut payload).await.unwrap();

        assert_eq!(ctx.user_agent(), Some("test-agent"));
        assert_eq!(ctx.path(), "/test");
        assert_eq!(ctx.query(), "page=1");
    }

    #[actix_rt::test]
    async fn test_connection_info_extraction() {
        let req = test::TestRequest::default()
            .uri("https://example.com/test")
            .to_http_request();

        let mut payload = Payload::None;
        let conn = ConnectionInfo::from_request(&req, &mut payload)
            .await
            .unwrap();

        assert_eq!(conn.scheme(), "http");
    }
}
