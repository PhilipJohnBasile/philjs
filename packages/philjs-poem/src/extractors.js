/**
 * PhilJS Poem Extractors
 *
 * Extractors for the Poem framework integration.
 * Poem has powerful built-in extractors that we extend for PhilJS use cases.
 */
// ============================================================================
// Base Extractor
// ============================================================================
/**
 * Base class for custom extractors
 */
export class Extractor {
    /**
     * Create a successful result
     */
    ok(value) {
        return { ok: true, value };
    }
    /**
     * Create a failed result
     */
    err(error, status) {
        const result = { ok: false, error };
        if (status !== undefined)
            result.status = status;
        return result;
    }
}
/**
 * SSR Context Extractor - extracts SSR-relevant request data
 */
export class SSRContextExtractor extends Extractor {
    name = 'SSRContext';
    extract(ctx) {
        const userAgent = ctx.headers['user-agent'] || null;
        const isBot = userAgent ? this.detectBot(userAgent) : false;
        const isMobile = userAgent ? this.detectMobile(userAgent) : false;
        const acceptLanguage = this.parseAcceptLanguage(ctx.headers['accept-language'] || '');
        return this.ok({
            path: ctx.path,
            query: ctx.query,
            headers: ctx.headers,
            userAgent,
            isBot,
            acceptLanguage,
            isMobile,
            requestId: ctx.requestId,
        });
    }
    detectBot(userAgent) {
        const botPatterns = ['googlebot', 'bingbot', 'bot', 'spider', 'crawler'];
        const ua = userAgent.toLowerCase();
        return botPatterns.some(pattern => ua.includes(pattern));
    }
    detectMobile(userAgent) {
        const mobilePatterns = ['mobile', 'android', 'iphone', 'ipad'];
        const ua = userAgent.toLowerCase();
        return mobilePatterns.some(pattern => ua.includes(pattern));
    }
    parseAcceptLanguage(header) {
        if (!header)
            return ['en'];
        return header.split(',').map(lang => lang.split(';')[0].trim()).filter(Boolean);
    }
    toRustCode() {
        return `
use poem::{FromRequest, Request, RequestBody, Result, error::BadRequest};
use serde::{Serialize, Deserialize};

/// SSR Context extracted from request
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
}

impl<'a> FromRequest<'a> for SsrContext {
    async fn from_request(req: &'a Request, _body: &mut RequestBody) -> Result<Self> {
        let user_agent = req.header("User-Agent").map(|s| s.to_string());
        let is_bot = user_agent.as_ref().map(|ua| Self::detect_bot(ua)).unwrap_or(false);
        let is_mobile = user_agent.as_ref().map(|ua| Self::detect_mobile(ua)).unwrap_or(false);

        let accept_language = req.header("Accept-Language")
            .map(|h| h.split(',').map(|l| l.split(';').next().unwrap_or("").trim().to_string()).collect())
            .unwrap_or_else(|| vec!["en".to_string()]);

        let query: std::collections::HashMap<String, String> = req.uri()
            .query()
            .map(|q| serde_urlencoded::from_str(q).unwrap_or_default())
            .unwrap_or_default();

        Ok(SsrContext {
            path: req.uri().path().to_string(),
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
 * JSON Body Extractor with validation
 */
export class JsonExtractor extends Extractor {
    name = 'Json';
    config;
    constructor(config = {}) {
        super();
        this.config = {
            maxSize: 1024 * 1024, // 1MB
            strictContentType: true,
            ...config,
        };
    }
    extract(ctx) {
        if (this.config.strictContentType) {
            const contentType = ctx.headers['content-type'] || '';
            if (!contentType.includes('application/json')) {
                return this.err('Content-Type must be application/json', 415);
            }
        }
        if (!ctx.body) {
            return this.err('Request body is required', 400);
        }
        try {
            const parsed = typeof ctx.body === 'string' ? JSON.parse(ctx.body) : ctx.body;
            return this.ok(parsed);
        }
        catch {
            return this.err('Invalid JSON in request body', 400);
        }
    }
    toRustCode() {
        return `
use poem::{FromRequest, Request, RequestBody, Result, error::BadRequest};
use serde::de::DeserializeOwned;

/// PhilJS JSON extractor with enhanced error handling
pub struct PhilJsJson<T>(pub T);

impl<T> std::ops::Deref for PhilJsJson<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<'a, T: DeserializeOwned> FromRequest<'a> for PhilJsJson<T> {
    async fn from_request(req: &'a Request, body: &mut RequestBody) -> Result<Self> {
        // Check content type
        let content_type = req.content_type();
        if content_type.map(|ct| ct.essence() != "application/json").unwrap_or(false) {
            return Err(BadRequest(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "Content-Type must be application/json"
            )));
        }

        // Parse JSON body
        let bytes = body.take()?.into_bytes().await?;
        let value = serde_json::from_slice(&bytes)
            .map_err(|e| BadRequest(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("Invalid JSON: {}", e)
            )))?;

        Ok(PhilJsJson(value))
    }
}
`.trim();
    }
}
/**
 * Query Parameters Extractor
 */
export class QueryExtractor extends Extractor {
    name = 'Query';
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    extract(ctx) {
        const result = { ...this.config.defaults };
        // Check required parameters
        for (const param of this.config.required || []) {
            if (!ctx.query[param]) {
                return this.err(`Missing required query parameter: ${param}`, 400);
            }
            result[param] = ctx.query[param];
        }
        // Copy all query parameters
        for (const [key, value] of Object.entries(ctx.query)) {
            result[key] = value;
        }
        return this.ok(result);
    }
    toRustCode() {
        return `
use poem::{FromRequest, Request, RequestBody, Result, error::BadRequest};
use serde::de::DeserializeOwned;

/// PhilJS Query extractor
pub struct PhilJsQuery<T>(pub T);

impl<T> std::ops::Deref for PhilJsQuery<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<'a, T: DeserializeOwned> FromRequest<'a> for PhilJsQuery<T> {
    async fn from_request(req: &'a Request, _body: &mut RequestBody) -> Result<Self> {
        let query = req.uri().query().unwrap_or("");
        let value = serde_urlencoded::from_str(query)
            .map_err(|e| BadRequest(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("Invalid query parameters: {}", e)
            )))?;

        Ok(PhilJsQuery(value))
    }
}
`.trim();
    }
}
// ============================================================================
// Path Extractor
// ============================================================================
/**
 * Path Parameters Extractor
 */
export class PathExtractor extends Extractor {
    name = 'Path';
    paramNames;
    constructor(...paramNames) {
        super();
        this.paramNames = paramNames;
    }
    extract(ctx) {
        const result = {};
        for (const name of this.paramNames) {
            if (!ctx.params[name]) {
                return this.err(`Missing path parameter: ${name}`, 400);
            }
            result[name] = ctx.params[name];
        }
        return this.ok(result);
    }
    toRustCode() {
        return `
// Poem has built-in path extraction via #[handler] macro
// Example:
// #[handler]
// async fn get_user(Path(id): Path<i64>) -> String {
//     format!("User ID: {}", id)
// }
`.trim();
    }
}
/**
 * Auth Extractor - extracts and validates authentication
 */
export class AuthExtractor extends Extractor {
    name = 'Auth';
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async extract(ctx) {
        const authHeader = ctx.headers['authorization'];
        const sessionCookie = ctx.cookies['session'];
        if (!authHeader && !sessionCookie) {
            if (this.config.optional) {
                return this.ok(null);
            }
            return this.err('Authentication required', 401);
        }
        const user = this.parseAuthToken(authHeader || sessionCookie);
        if (!user) {
            if (this.config.optional) {
                return this.ok(null);
            }
            return this.err('Invalid authentication token', 401);
        }
        // Check roles
        if (this.config.roles?.length) {
            const hasRole = this.config.roles.some(role => user.roles.includes(role));
            if (!hasRole) {
                return this.err('Insufficient permissions', 403);
            }
        }
        // Check permissions
        if (this.config.permissions?.length) {
            const hasAllPermissions = this.config.permissions.every(perm => user.permissions.includes(perm));
            if (!hasAllPermissions) {
                return this.err('Missing required permissions', 403);
            }
        }
        return this.ok(user);
    }
    parseAuthToken(token) {
        if (!token)
            return null;
        try {
            const cleanToken = token.replace(/^Bearer\s+/i, '');
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
        return `
use poem::{FromRequest, Request, RequestBody, Result, error::{Unauthorized, Forbidden}};
use serde::{Serialize, Deserialize};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};

/// Authenticated user from JWT
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthUser {
    pub id: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub roles: Vec<String>,
    pub permissions: Vec<String>,
    pub metadata: Option<serde_json::Value>,
}

impl<'a> FromRequest<'a> for AuthUser {
    async fn from_request(req: &'a Request, _body: &mut RequestBody) -> Result<Self> {
        // Get token from Authorization header or cookie
        let token = req.header("Authorization")
            .and_then(|h| h.strip_prefix("Bearer "))
            .or_else(|| req.cookie("session").map(|c| c.value_str()));

        let token = match token {
            Some(t) => t,
            None => return Err(Unauthorized(std::io::Error::new(
                std::io::ErrorKind::PermissionDenied,
                "Authentication required"
            ))),
        };

        // Decode JWT (use proper secret in production)
        let key = DecodingKey::from_secret(b"secret");
        let validation = Validation::new(Algorithm::HS256);

        let token_data = decode::<AuthUser>(token, &key, &validation)
            .map_err(|_| Unauthorized(std::io::Error::new(
                std::io::ErrorKind::PermissionDenied,
                "Invalid token"
            )))?;

        Ok(token_data.claims)
    }
}

/// Optional authentication
pub struct OptionalAuth(pub Option<AuthUser>);

impl<'a> FromRequest<'a> for OptionalAuth {
    async fn from_request(req: &'a Request, body: &mut RequestBody) -> Result<Self> {
        match AuthUser::from_request(req, body).await {
            Ok(user) => Ok(OptionalAuth(Some(user))),
            Err(_) => Ok(OptionalAuth(None)),
        }
    }
}
`.trim();
    }
}
// ============================================================================
// Form Extractor
// ============================================================================
/**
 * Form Data Extractor
 */
export class FormExtractor extends Extractor {
    name = 'Form';
    maxSize;
    constructor(maxSize = 1024 * 1024) {
        super();
        this.maxSize = maxSize;
    }
    extract(ctx) {
        const contentType = ctx.headers['content-type'] || '';
        if (!contentType.includes('application/x-www-form-urlencoded') &&
            !contentType.includes('multipart/form-data')) {
            return this.err('Invalid content type for form data', 415);
        }
        const parsed = parseFormBody(ctx.body, contentType, this.maxSize);
        if (!parsed.ok) {
            return parsed;
        }
        return this.ok(parsed.value);
    }
    toRustCode() {
        return `
use poem::web::Form;

// Use Poem's built-in Form extractor
// #[handler]
// async fn submit(Form(data): Form<MyFormData>) -> String {
//     format!("Received: {:?}", data)
// }
`.trim();
    }
}
/**
 * Multipart Form Extractor
 */
export class MultipartExtractor extends Extractor {
    name = 'Multipart';
    maxFileSize;
    constructor(maxFileSize = 10 * 1024 * 1024) {
        super();
        this.maxFileSize = maxFileSize;
    }
    extract(ctx) {
        const contentType = ctx.headers['content-type'] || '';
        if (!contentType.includes('multipart/form-data')) {
            return this.err('Content-Type must be multipart/form-data', 415);
        }
        const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
        if (!boundaryMatch) {
            return this.err('Multipart boundary missing', 400);
        }
        const parsed = parseMultipartBody(ctx.body, boundaryMatch[1], this.maxFileSize);
        if (!parsed.ok) {
            return parsed;
        }
        return this.ok(parsed.value);
    }
    toRustCode() {
        return `
use poem::web::Multipart;

// Use Poem's built-in Multipart extractor
// #[handler]
// async fn upload(mut multipart: Multipart) -> Result<String> {
//     while let Some(field) = multipart.next_field().await? {
//         let name = field.name().map(|s| s.to_string());
//         let filename = field.file_name().map(|s| s.to_string());
//         let data = field.bytes().await?;
//         // Process field...
//     }
//     Ok("Upload complete")
// }
`.trim();
    }
}
// ============================================================================
// Cookie Extractor
// ============================================================================
/**
 * Cookie Extractor
 */
export class CookieExtractor extends Extractor {
    name = 'Cookie';
    extract(ctx) {
        return this.ok(ctx.cookies);
    }
    toRustCode() {
        return `
use poem::web::cookie::CookieJar;

// Use Poem's CookieJar extractor
// #[handler]
// async fn handler(cookies: &CookieJar) -> String {
//     if let Some(session) = cookies.get("session") {
//         format!("Session: {}", session.value())
//     } else {
//         "No session".to_string()
//     }
// }
`.trim();
    }
}
// ============================================================================
// Header Extractor
// ============================================================================
/**
 * Header Extractor
 */
export class HeaderExtractor extends Extractor {
    name = 'Header';
    headerName;
    required;
    constructor(headerName, required = false) {
        super();
        this.headerName = headerName;
        this.required = required;
    }
    extract(ctx) {
        const value = ctx.headers[this.headerName.toLowerCase()];
        if (!value && this.required) {
            return this.err(`Missing required header: ${this.headerName}`, 400);
        }
        return this.ok(value || null);
    }
    toRustCode() {
        return `
use poem::web::TypedHeader;
use poem::http::header;

// Use Poem's TypedHeader extractor for standard headers
// #[handler]
// async fn handler(TypedHeader(auth): TypedHeader<header::Authorization<header::authorization::Bearer>>) -> String {
//     format!("Token: {}", auth.token())
// }
`.trim();
    }
}
// ============================================================================
// Data Extractor (State)
// ============================================================================
/**
 * Application Data/State Extractor
 */
export class DataExtractor extends Extractor {
    name = 'Data';
    extract(ctx) {
        if (!ctx.state) {
            return this.err('Application state is not available', 500);
        }
        return this.ok(ctx.state);
    }
    toRustCode() {
        return `
use poem::web::Data;

// Use Poem's Data extractor for application state
// #[handler]
// async fn handler(data: Data<&AppState>) -> String {
//     format!("Counter: {}", data.counter)
// }
`.trim();
    }
}
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Create a custom extractor from a function
 */
export function createExtractor(name, extract) {
    return { name, extract };
}
/**
 * Create an SSR context extractor
 */
export function ssrContext() {
    return new SSRContextExtractor();
}
/**
 * Create a JSON body extractor
 */
export function json(config) {
    return new JsonExtractor(config);
}
/**
 * Create a query params extractor
 */
export function query(config) {
    return new QueryExtractor(config);
}
/**
 * Create an auth extractor
 */
export function auth(config) {
    return new AuthExtractor(config);
}
/**
 * Create an optional auth extractor
 */
export function optionalAuth() {
    return new AuthExtractor({ optional: true });
}
function parseFormBody(body, contentType, maxSize) {
    if (body === undefined || body === null) {
        return { ok: false, error: 'Request body is required', status: 400 };
    }
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
        return { ok: true, value: formDataToRecord(body) };
    }
    if (body instanceof URLSearchParams) {
        return { ok: true, value: paramsToRecord(body) };
    }
    const raw = typeof body === 'string'
        ? body
        : body instanceof Uint8Array
            ? new TextDecoder('utf-8').decode(body)
            : null;
    if (raw === null) {
        if (typeof body === 'object') {
            return { ok: true, value: body };
        }
        return { ok: false, error: 'Unsupported body type', status: 415 };
    }
    if (maxSize > 0 && raw.length > maxSize) {
        return { ok: false, error: 'Payload too large', status: 413 };
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
        return { ok: true, value: paramsToRecord(new URLSearchParams(raw)) };
    }
    const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
    if (!boundaryMatch) {
        return { ok: false, error: 'Multipart boundary missing', status: 400 };
    }
    const { fields } = parseMultipart(raw, boundaryMatch[1], maxSize);
    return { ok: true, value: fields };
}
function parseMultipartBody(body, boundary, maxFileSize) {
    const raw = typeof body === 'string'
        ? body
        : body instanceof Uint8Array
            ? new TextDecoder('utf-8').decode(body)
            : null;
    if (raw === null) {
        return { ok: false, error: 'Unsupported body type', status: 415 };
    }
    const { files, oversize } = parseMultipart(raw, boundary, maxFileSize);
    if (oversize) {
        return { ok: false, error: 'File too large', status: 413 };
    }
    return { ok: true, value: files };
}
function formDataToRecord(formData) {
    const result = {};
    for (const [key, value] of formData.entries()) {
        appendValue(result, key, value);
    }
    return result;
}
function paramsToRecord(params) {
    const result = {};
    params.forEach((value, key) => {
        appendValue(result, key, value);
    });
    return result;
}
function parseMultipart(body, boundary, maxFileSize) {
    const fields = {};
    const files = new Map();
    let oversize = false;
    const parts = body.split(`--${boundary}`).slice(1, -1);
    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed)
            continue;
        const [rawHeaders, rawValue] = trimmed.split(/\r\n\r\n/);
        if (!rawHeaders || rawValue === undefined)
            continue;
        const headers = rawHeaders.split(/\r\n/).reduce((acc, line) => {
            const [key, ...rest] = line.split(':');
            if (!key)
                return acc;
            acc[key.trim().toLowerCase()] = rest.join(':').trim();
            return acc;
        }, {});
        const disposition = headers['content-disposition'] || '';
        const nameMatch = disposition.match(/name=\"([^\"]+)\"/i);
        if (!nameMatch)
            continue;
        const filenameMatch = disposition.match(/filename=\"([^\"]*)\"/i);
        const value = rawValue.replace(/\r\n$/, '');
        if (filenameMatch) {
            const data = new TextEncoder().encode(value);
            if (data.length > maxFileSize) {
                oversize = true;
                continue;
            }
            const file = {
                name: nameMatch[1],
                filename: filenameMatch[1],
                contentType: headers['content-type'] || 'application/octet-stream',
                size: data.length,
                data,
            };
            files.set(nameMatch[1], file);
        }
        else {
            appendValue(fields, nameMatch[1], value);
            files.set(nameMatch[1], value);
        }
    }
    return { fields, files, oversize };
}
function appendValue(target, key, value) {
    const existing = target[key];
    if (existing === undefined) {
        target[key] = value;
    }
    else if (Array.isArray(existing)) {
        existing.push(value);
    }
    else {
        target[key] = [existing, value];
    }
}
//# sourceMappingURL=extractors.js.map