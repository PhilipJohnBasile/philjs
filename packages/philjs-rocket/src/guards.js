/**
 * PhilJS Rocket Guards
 *
 * Request guards for Rocket framework integration.
 * Guards validate incoming requests and extract typed data.
 */
// ============================================================================
// Base Guard
// ============================================================================
/**
 * Base class for request guards
 */
export class RequestGuard {
    /**
     * Create a successful outcome
     */
    success(value) {
        return { success: true, value };
    }
    /**
     * Create a failed outcome
     */
    failure(error, status) {
        const outcome = { success: false, error };
        if (status !== undefined) {
            outcome.status = status;
        }
        return outcome;
    }
}
/**
 * SSR Context Guard - extracts SSR-relevant request data
 */
export class SSRContextGuard extends RequestGuard {
    name = 'SSRContext';
    validate(ctx) {
        const userAgent = ctx.headers['user-agent'] || null;
        const isBot = userAgent ? this.detectBot(userAgent) : false;
        const isMobile = userAgent ? this.detectMobile(userAgent) : false;
        const acceptLanguage = this.parseAcceptLanguage(ctx.headers['accept-language'] || '');
        return this.success({
            path: ctx.path,
            query: ctx.query,
            headers: ctx.headers,
            userAgent,
            isBot,
            acceptLanguage,
            isMobile,
            requestId: this.generateRequestId(),
        });
    }
    detectBot(userAgent) {
        const botPatterns = [
            'googlebot', 'bingbot', 'slurp', 'duckduckbot',
            'baiduspider', 'yandexbot', 'facebookexternalhit',
            'twitterbot', 'linkedinbot', 'bot', 'spider', 'crawler',
        ];
        const ua = userAgent.toLowerCase();
        return botPatterns.some(pattern => ua.includes(pattern));
    }
    detectMobile(userAgent) {
        const mobilePatterns = [
            'mobile', 'android', 'iphone', 'ipad', 'ipod',
            'blackberry', 'windows phone',
        ];
        const ua = userAgent.toLowerCase();
        return mobilePatterns.some(pattern => ua.includes(pattern));
    }
    parseAcceptLanguage(header) {
        if (!header)
            return ['en'];
        return header
            .split(',')
            .map(lang => lang.split(';')[0].trim())
            .filter(Boolean);
    }
    generateRequestId() {
        return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
    }
    toRustCode() {
        return `
use rocket::{Request, request::{FromRequest, Outcome}};
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SsrContext {
    pub path: String,
    pub query: std::collections::HashMap<String, String>,
    pub user_agent: Option<String>,
    pub is_bot: bool,
    pub is_mobile: bool,
    pub accept_language: Vec<String>,
    pub request_id: String,
}

impl SsrContext {
    fn detect_bot(user_agent: &str) -> bool {
        let ua = user_agent.to_lowercase();
        ["googlebot", "bingbot", "bot", "spider", "crawler"]
            .iter()
            .any(|pattern| ua.contains(pattern))
    }

    fn detect_mobile(user_agent: &str) -> bool {
        let ua = user_agent.to_lowercase();
        ["mobile", "android", "iphone", "ipad"]
            .iter()
            .any(|pattern| ua.contains(pattern))
    }

    fn parse_accept_language(header: &str) -> Vec<String> {
        header
            .split(',')
            .filter_map(|lang| lang.split(';').next())
            .map(|s| s.trim().to_string())
            .collect()
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for SsrContext {
    type Error = std::convert::Infallible;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let user_agent = request.headers()
            .get_one("User-Agent")
            .map(|s| s.to_string());

        let is_bot = user_agent.as_ref()
            .map(|ua| Self::detect_bot(ua))
            .unwrap_or(false);

        let is_mobile = user_agent.as_ref()
            .map(|ua| Self::detect_mobile(ua))
            .unwrap_or(false);

        let accept_language = request.headers()
            .get_one("Accept-Language")
            .map(Self::parse_accept_language)
            .unwrap_or_else(|| vec!["en".to_string()]);

        let query: std::collections::HashMap<String, String> = request.uri()
            .query()
            .map(|q| q.segments()
                .filter_map(|(k, v)| Some((k.to_string(), v.to_string())))
                .collect())
            .unwrap_or_default();

        Outcome::Success(SsrContext {
            path: request.uri().path().to_string(),
            query,
            user_agent,
            is_bot,
            is_mobile,
            accept_language,
            request_id: uuid::Uuid::new_v4().to_string(),
        })
    }
}
`.trim();
    }
}
/**
 * Auth Guard - validates authentication and authorization
 */
export class AuthGuard extends RequestGuard {
    name = 'Auth';
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async validate(ctx) {
        // Extract auth token from header or cookie
        const authHeader = ctx.headers['authorization'];
        const sessionCookie = ctx.cookies['session'];
        if (!authHeader && !sessionCookie) {
            return this.failure('Authentication required', 401);
        }
        // Parse token (in real implementation, validate JWT or session)
        const user = this.parseAuthToken(authHeader || sessionCookie);
        if (!user) {
            return this.failure('Invalid authentication token', 401);
        }
        // Check roles
        if (this.config.roles && this.config.roles.length > 0) {
            const hasRole = this.config.roles.some(role => user.roles.includes(role));
            if (!hasRole) {
                return this.failure('Insufficient permissions', 403);
            }
        }
        // Check permissions
        if (this.config.permissions && this.config.permissions.length > 0) {
            const hasAllPermissions = this.config.permissions.every(perm => user.permissions.includes(perm));
            if (!hasAllPermissions) {
                return this.failure('Missing required permissions', 403);
            }
        }
        // Custom validation
        if (this.config.validate && !this.config.validate(user)) {
            return this.failure('Authorization failed', 403);
        }
        return this.success(user);
    }
    parseAuthToken(token) {
        if (!token)
            return null;
        // In real implementation, decode and validate JWT
        // This is a placeholder that returns a mock user
        try {
            // Remove 'Bearer ' prefix if present
            const cleanToken = token.replace(/^Bearer\s+/i, '');
            // Decode token (placeholder - use proper JWT validation in production)
            const parts = cleanToken.split('.');
            if (parts.length !== 3)
                return null;
            const payload = JSON.parse(atob(parts[1]));
            return {
                id: payload.sub || payload.id,
                email: payload.email,
                name: payload.name,
                roles: payload.roles || [],
                permissions: payload.permissions || [],
                metadata: payload.metadata,
            };
        }
        catch {
            return null;
        }
    }
    toRustCode() {
        const rolesCheck = this.config.roles && this.config.roles.length > 0
            ? `let required_roles = vec![${this.config.roles.map(r => `"${r}"`).join(', ')}];
        if !required_roles.iter().any(|r| user.roles.contains(&r.to_string())) {
            return Outcome::Error((Status::Forbidden, AuthError::InsufficientPermissions));
        }`
            : '';
        return `
use rocket::{Request, request::{FromRequest, Outcome}, http::Status};
use serde::{Serialize, Deserialize};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthUser {
    pub id: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub roles: Vec<String>,
    pub permissions: Vec<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug)]
pub enum AuthError {
    Missing,
    Invalid,
    Expired,
    InsufficientPermissions,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AuthUser {
    type Error = AuthError;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        // Get token from Authorization header or cookie
        let token = request.headers()
            .get_one("Authorization")
            .and_then(|h| h.strip_prefix("Bearer "))
            .or_else(|| request.cookies().get("session").map(|c| c.value()));

        let token = match token {
            Some(t) => t,
            None => return Outcome::Error((Status::Unauthorized, AuthError::Missing)),
        };

        // Decode and validate JWT (using placeholder key)
        let key = DecodingKey::from_secret(b"secret");
        let validation = Validation::new(Algorithm::HS256);

        let token_data = match decode::<AuthUser>(token, &key, &validation) {
            Ok(data) => data,
            Err(_) => return Outcome::Error((Status::Unauthorized, AuthError::Invalid)),
        };

        let user = token_data.claims;

        ${rolesCheck}

        Outcome::Success(user)
    }
}
`.trim();
    }
    /**
     * Create an admin-only guard
     */
    static admin() {
        return new AuthGuard({ roles: ['admin'] });
    }
    /**
     * Create a guard requiring specific roles
     */
    static withRoles(...roles) {
        return new AuthGuard({ roles });
    }
    /**
     * Create a guard requiring specific permissions
     */
    static withPermissions(...permissions) {
        return new AuthGuard({ permissions });
    }
}
/**
 * CSRF Guard - validates CSRF tokens
 */
export class CSRFGuard extends RequestGuard {
    name = 'CSRF';
    config;
    constructor(config = {}) {
        super();
        this.config = {
            headerName: 'X-CSRF-Token',
            cookieName: 'csrf_token',
            excludeMethods: ['GET', 'HEAD', 'OPTIONS'],
            excludePaths: [],
            ...config,
        };
    }
    validate(ctx) {
        // Skip for excluded methods
        if (this.config.excludeMethods?.includes(ctx.method.toUpperCase())) {
            return this.success('skipped');
        }
        // Skip for excluded paths
        if (this.config.excludePaths?.some(path => ctx.path.startsWith(path))) {
            return this.success('skipped');
        }
        // Get token from header
        const headerToken = ctx.headers[this.config.headerName.toLowerCase()];
        // Get token from cookie
        const cookieToken = ctx.cookies[this.config.cookieName];
        if (!headerToken) {
            return this.failure('CSRF token missing', 403);
        }
        if (!cookieToken) {
            return this.failure('CSRF cookie missing', 403);
        }
        // Compare tokens
        if (headerToken !== cookieToken) {
            return this.failure('CSRF token mismatch', 403);
        }
        return this.success(headerToken);
    }
    toRustCode() {
        return `
use rocket::{Request, request::{FromRequest, Outcome}, http::Status};

pub struct CsrfToken(pub String);

#[derive(Debug)]
pub enum CsrfError {
    Missing,
    Mismatch,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for CsrfToken {
    type Error = CsrfError;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        // Skip for safe methods
        let method = request.method().as_str();
        if ["GET", "HEAD", "OPTIONS"].contains(&method) {
            return Outcome::Success(CsrfToken("skipped".to_string()));
        }

        // Get token from header
        let header_token = request.headers()
            .get_one("${this.config.headerName}");

        // Get token from cookie
        let cookie_token = request.cookies()
            .get("${this.config.cookieName}")
            .map(|c| c.value());

        match (header_token, cookie_token) {
            (Some(h), Some(c)) if h == c => Outcome::Success(CsrfToken(h.to_string())),
            (None, _) => Outcome::Error((Status::Forbidden, CsrfError::Missing)),
            _ => Outcome::Error((Status::Forbidden, CsrfError::Mismatch)),
        }
    }
}
`.trim();
    }
}
/**
 * JSON Body Guard - extracts and validates JSON request body
 */
export class JsonBodyGuard extends RequestGuard {
    name = 'JsonBody';
    config;
    schema;
    constructor(config = {}, schema) {
        super();
        this.config = {
            maxSize: 1024 * 1024, // 1MB
            strictContentType: true,
            ...config,
        };
        if (schema !== undefined) {
            this.schema = schema;
        }
    }
    validate(ctx) {
        // Check content type
        if (this.config.strictContentType) {
            const contentType = ctx.headers['content-type'] || '';
            if (!contentType.includes('application/json')) {
                return this.failure('Content-Type must be application/json', 415);
            }
        }
        // In a real implementation, we'd parse the body here
        // This is handled by Rocket's Json extractor in Rust
        return this.failure('Body parsing not implemented in TypeScript guard', 500);
    }
    toRustCode() {
        return `
use rocket::{Request, request::{FromRequest, Outcome}, http::Status, data::{FromData, ToByteUnit}};
use serde::de::DeserializeOwned;

pub struct PhilJsJson<T>(pub T);

#[rocket::async_trait]
impl<'r, T: DeserializeOwned> FromData<'r> for PhilJsJson<T> {
    type Error = serde_json::Error;

    async fn from_data(
        request: &'r Request<'_>,
        data: rocket::Data<'r>,
    ) -> rocket::data::Outcome<'r, Self> {
        use rocket::data::Outcome;

        // Check content type
        let content_type = request.content_type();
        if content_type.map(|ct| ct.is_json()) != Some(true) {
            return Outcome::Forward((data, Status::UnsupportedMediaType));
        }

        // Read body with size limit
        let limit = request.limits().get("json").unwrap_or(${this.config.maxSize}.bytes());
        let string = match data.open(limit).into_string().await {
            Ok(s) if s.is_complete() => s.into_inner(),
            Ok(_) => return Outcome::Error((Status::PayloadTooLarge, serde_json::Error::io(
                std::io::Error::new(std::io::ErrorKind::Other, "payload too large")
            ))),
            Err(e) => return Outcome::Error((Status::InternalServerError, serde_json::Error::io(e))),
        };

        // Parse JSON
        match serde_json::from_str(&string) {
            Ok(value) => Outcome::Success(PhilJsJson(value)),
            Err(e) => Outcome::Error((Status::BadRequest, e)),
        }
    }
}
`.trim();
    }
}
// ============================================================================
// Form Data Guard
// ============================================================================
/**
 * Form Data Guard - extracts form data
 */
export class FormDataGuard extends RequestGuard {
    name = 'FormData';
    maxSize;
    constructor(maxSize = 1024 * 1024) {
        super();
        this.maxSize = maxSize;
    }
    validate(ctx) {
        const contentType = ctx.headers['content-type'] || '';
        if (!contentType.includes('application/x-www-form-urlencoded') &&
            !contentType.includes('multipart/form-data')) {
            return this.failure('Invalid content type for form data', 415);
        }
        return this.failure('Form parsing not implemented in TypeScript guard', 500);
    }
    toRustCode() {
        return `
use rocket::form::{Form, FromForm};
use rocket::data::ToByteUnit;

// Use Rocket's built-in Form extractor
// #[derive(FromForm)]
// struct MyForm {
//     field: String,
// }
//
// #[post("/submit", data = "<form>")]
// fn submit(form: Form<MyForm>) -> String {
//     format!("Received: {}", form.field)
// }
`.trim();
    }
}
// ============================================================================
// Path Guard
// ============================================================================
/**
 * Path Guard - extracts typed path parameters
 */
export class PathGuard extends RequestGuard {
    name = 'Path';
    paramName;
    constructor(paramName) {
        super();
        this.paramName = paramName;
    }
    validate(ctx) {
        const value = ctx.params[this.paramName];
        if (!value) {
            return this.failure(`Path parameter '${this.paramName}' not found`, 400);
        }
        return this.success(value);
    }
    toRustCode() {
        return `
// Path parameters are automatically extracted by Rocket
// Use #[get("/<id>")] or similar route annotations
//
// #[get("/users/<id>")]
// fn get_user(id: i64) -> String {
//     format!("User ID: {}", id)
// }
`.trim();
    }
}
/**
 * Query Guard - extracts and validates query parameters
 */
export class QueryGuard extends RequestGuard {
    name = 'Query';
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    validate(ctx) {
        const result = { ...this.config.defaults };
        // Check required parameters
        for (const param of this.config.required || []) {
            if (!ctx.query[param]) {
                return this.failure(`Missing required query parameter: ${param}`, 400);
            }
            result[param] = ctx.query[param];
        }
        // Copy all query parameters
        for (const [key, value] of Object.entries(ctx.query)) {
            result[key] = value;
        }
        return this.success(result);
    }
    toRustCode() {
        return `
use rocket::form::FromForm;

// Use Rocket's query parameters with FromForm derive
// #[derive(FromForm)]
// struct QueryParams {
//     #[field(default = "10")]
//     limit: i32,
//     offset: Option<i32>,
// }
//
// #[get("/items?<params..>")]
// fn items(params: QueryParams) -> String {
//     format!("Limit: {}, Offset: {:?}", params.limit, params.offset)
// }
`.trim();
    }
}
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Create a custom guard from a validation function
 */
export function createGuard(name, validate) {
    return { name, validate };
}
/**
 * Combine multiple guards
 */
export function combineGuards(...guards) {
    return async (ctx) => {
        const results = [];
        for (const guard of guards) {
            const outcome = await guard.validate(ctx);
            if (!outcome.success) {
                return outcome;
            }
            results.push(outcome.value);
        }
        return { success: true, value: results };
    };
}
//# sourceMappingURL=guards.js.map