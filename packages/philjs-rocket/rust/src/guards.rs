//! Request guards for PhilJS Rocket integration
//!
//! Guards are Rocket's mechanism for validating and extracting data from requests.

use rocket::request::{FromRequest, Outcome, Request};
use rocket::http::Status;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// SSR context guard providing request information for server-side rendering
#[derive(Debug, Clone)]
pub struct SsrContext {
    user_agent: Option<String>,
    cookies: Vec<(String, String)>,
    headers: Vec<(String, String)>,
    path: String,
    query: String,
    method: String,
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

    /// Get the HTTP method
    pub fn method(&self) -> &str {
        &self.method
    }

    /// Get all cookies
    pub fn cookies(&self) -> &[(String, String)] {
        &self.cookies
    }

    /// Get all headers
    pub fn headers(&self) -> &[(String, String)] {
        &self.headers
    }

    /// Check if request is a bot/crawler
    pub fn is_bot(&self) -> bool {
        self.user_agent
            .as_ref()
            .map(|ua| {
                let ua_lower = ua.to_lowercase();
                ua_lower.contains("bot")
                    || ua_lower.contains("crawler")
                    || ua_lower.contains("spider")
                    || ua_lower.contains("googlebot")
                    || ua_lower.contains("bingbot")
            })
            .unwrap_or(false)
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for SsrContext {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let user_agent = request
            .headers()
            .get_one("User-Agent")
            .map(|s| s.to_string());

        let cookies = request
            .cookies()
            .iter()
            .map(|c| (c.name().to_string(), c.value().to_string()))
            .collect();

        let headers = request
            .headers()
            .iter()
            .map(|h| (h.name.to_string(), h.value.to_string()))
            .collect();

        let path = request.uri().path().to_string();
        let query = request.uri().query().map(|q| q.to_string()).unwrap_or_default();
        let method = request.method().to_string();

        Outcome::Success(SsrContext {
            user_agent,
            cookies,
            headers,
            path,
            query,
            method,
        })
    }
}

/// Authenticated user guard
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthUser {
    /// User ID
    pub id: String,
    /// Username
    pub username: Option<String>,
    /// Email
    pub email: Option<String>,
    /// User roles
    pub roles: Vec<String>,
}

impl AuthUser {
    /// Create a new authenticated user
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            username: None,
            email: None,
            roles: Vec::new(),
        }
    }

    /// Check if user has a specific role
    pub fn has_role(&self, role: &str) -> bool {
        self.roles.iter().any(|r| r == role)
    }

    /// Check if user has any of the specified roles
    pub fn has_any_role(&self, roles: &[&str]) -> bool {
        roles.iter().any(|r| self.has_role(r))
    }

    /// Check if user has all of the specified roles
    pub fn has_all_roles(&self, roles: &[&str]) -> bool {
        roles.iter().all(|r| self.has_role(r))
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AuthUser {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        // Check for authorization header
        let auth_header = request.headers().get_one("Authorization");

        match auth_header {
            Some(token) if token.starts_with("Bearer ") => {
                // In a real implementation, validate the JWT token here
                // For now, we'll create a placeholder user
                let _token_value = &token[7..];

                // Placeholder - in production, decode and validate JWT
                Outcome::Success(AuthUser {
                    id: "user-123".to_string(),
                    username: Some("demo".to_string()),
                    email: Some("demo@example.com".to_string()),
                    roles: vec!["user".to_string()],
                })
            }
            _ => {
                // Check for session cookie
                if let Some(_session) = request.cookies().get("session_id") {
                    // Placeholder - in production, validate session
                    Outcome::Success(AuthUser {
                        id: "user-456".to_string(),
                        username: Some("session_user".to_string()),
                        email: None,
                        roles: vec!["user".to_string()],
                    })
                } else {
                    Outcome::Forward(Status::Unauthorized)
                }
            }
        }
    }
}

/// Optional authenticated user guard
pub struct MaybeAuthUser(pub Option<AuthUser>);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for MaybeAuthUser {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        match AuthUser::from_request(request).await {
            Outcome::Success(user) => Outcome::Success(MaybeAuthUser(Some(user))),
            _ => Outcome::Success(MaybeAuthUser(None)),
        }
    }
}

/// CSRF token guard
#[derive(Debug, Clone)]
pub struct CsrfToken {
    /// The token value
    token: String,
}

impl CsrfToken {
    /// Get the token value
    pub fn token(&self) -> &str {
        &self.token
    }

    /// Generate a new CSRF token
    pub fn generate() -> Self {
        Self {
            token: uuid::Uuid::new_v4().to_string(),
        }
    }

    /// Validate a token against this one
    pub fn validate(&self, token: &str) -> bool {
        self.token == token
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for CsrfToken {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        // Check for CSRF token in header or cookie
        let header_token = request.headers().get_one("X-CSRF-Token");
        let cookie_token = request.cookies().get("csrf_token").map(|c| c.value());

        match (header_token, cookie_token) {
            (Some(header), Some(cookie)) if header == cookie => {
                Outcome::Success(CsrfToken {
                    token: header.to_string(),
                })
            }
            _ => {
                // For GET requests, generate a new token
                if request.method() == rocket::http::Method::Get {
                    Outcome::Success(CsrfToken::generate())
                } else {
                    Outcome::Forward(Status::Forbidden)
                }
            }
        }
    }
}

/// Connection info guard
#[derive(Debug, Clone)]
pub struct ConnectionInfo {
    remote_addr: Option<String>,
    real_ip: Option<String>,
}

impl ConnectionInfo {
    /// Get the remote address
    pub fn remote_addr(&self) -> Option<&str> {
        self.remote_addr.as_deref()
    }

    /// Get the real IP (considering proxy headers)
    pub fn real_ip(&self) -> Option<&str> {
        self.real_ip.as_deref().or(self.remote_addr.as_deref())
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for ConnectionInfo {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let remote_addr = request.client_ip().map(|ip| ip.to_string());

        let real_ip = request
            .headers()
            .get_one("X-Forwarded-For")
            .or_else(|| request.headers().get_one("X-Real-IP"))
            .map(|s| s.split(',').next().unwrap_or(s).trim().to_string());

        Outcome::Success(ConnectionInfo {
            remote_addr,
            real_ip,
        })
    }
}

/// JSON body guard with better error handling
pub struct JsonBody<T>(pub T);

#[rocket::async_trait]
impl<'r, T: Deserialize<'r>> FromRequest<'r> for JsonBody<T> {
    type Error = String;

    async fn from_request(_request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        // Note: For proper JSON body parsing, use Rocket's built-in Json<T> data guard
        // This is a placeholder showing the pattern
        Outcome::Forward(Status::BadRequest)
    }
}

/// Query parameters guard
#[derive(Debug, Clone)]
pub struct QueryParams {
    params: HashMap<String, String>,
}

impl QueryParams {
    /// Get a query parameter
    pub fn get(&self, key: &str) -> Option<&str> {
        self.params.get(key).map(|s| s.as_str())
    }

    /// Get a query parameter with a default value
    pub fn get_or(&self, key: &str, default: &str) -> &str {
        self.params.get(key).map(|s| s.as_str()).unwrap_or(default)
    }

    /// Get a query parameter as a specific type
    pub fn get_as<T: std::str::FromStr>(&self, key: &str) -> Option<T> {
        self.params.get(key).and_then(|v| v.parse().ok())
    }

    /// Check if a parameter exists
    pub fn has(&self, key: &str) -> bool {
        self.params.contains_key(key)
    }

    /// Get all parameters
    pub fn all(&self) -> &HashMap<String, String> {
        &self.params
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for QueryParams {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let params = request
            .uri()
            .query()
            .map(|q| {
                q.segments()
                    .filter_map(|(k, v)| Some((k.to_string(), v.to_string())))
                    .collect()
            })
            .unwrap_or_default();

        Outcome::Success(QueryParams { params })
    }
}

/// Pagination parameters guard
#[derive(Debug, Clone)]
pub struct PaginationParams {
    /// Current page (1-indexed)
    pub page: u32,
    /// Items per page
    pub per_page: u32,
}

impl PaginationParams {
    /// Get the offset for database queries
    pub fn offset(&self) -> u32 {
        (self.page.saturating_sub(1)) * self.per_page
    }

    /// Get the limit for database queries
    pub fn limit(&self) -> u32 {
        self.per_page
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

#[rocket::async_trait]
impl<'r> FromRequest<'r> for PaginationParams {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let query = request.uri().query();

        let page = query
            .and_then(|q| q.segments().find(|(k, _)| *k == "page"))
            .and_then(|(_, v)| v.parse().ok())
            .unwrap_or(1);

        let per_page = query
            .and_then(|q| q.segments().find(|(k, _)| *k == "per_page" || *k == "limit"))
            .and_then(|(_, v)| v.parse().ok())
            .unwrap_or(10)
            .min(100); // Cap at 100

        Outcome::Success(PaginationParams { page, per_page })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_auth_user_roles() {
        let user = AuthUser {
            id: "123".to_string(),
            username: Some("test".to_string()),
            email: None,
            roles: vec!["admin".to_string(), "user".to_string()],
        };

        assert!(user.has_role("admin"));
        assert!(user.has_role("user"));
        assert!(!user.has_role("superuser"));
        assert!(user.has_any_role(&["admin", "moderator"]));
        assert!(user.has_all_roles(&["admin", "user"]));
        assert!(!user.has_all_roles(&["admin", "superuser"]));
    }

    #[test]
    fn test_pagination_params() {
        let params = PaginationParams {
            page: 3,
            per_page: 20,
        };

        assert_eq!(params.offset(), 40);
        assert_eq!(params.limit(), 20);
    }

    #[test]
    fn test_csrf_token() {
        let token = CsrfToken::generate();
        assert!(!token.token().is_empty());
        assert!(token.validate(token.token()));
        assert!(!token.validate("invalid"));
    }
}
