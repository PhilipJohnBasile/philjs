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
/**
 * Parse URL-encoded form data from a string body
 */
function parseUrlEncodedBody(body) {
    const result = {};
    if (!body || body.trim() === '') {
        return result;
    }
    try {
        const params = new URLSearchParams(body);
        params.forEach((value, key) => {
            const existing = result[key];
            if (existing !== undefined) {
                if (Array.isArray(existing)) {
                    existing.push(value);
                }
                else {
                    result[key] = [existing, value];
                }
            }
            else {
                result[key] = value;
            }
        });
    }
    catch {
        // If URLSearchParams fails, try manual parsing
        const pairs = body.split('&');
        for (const pair of pairs) {
            const eqIndex = pair.indexOf('=');
            if (eqIndex === -1)
                continue;
            const key = decodeURIComponent(pair.substring(0, eqIndex).replace(/\+/g, ' '));
            const value = decodeURIComponent(pair.substring(eqIndex + 1).replace(/\+/g, ' '));
            const existing = result[key];
            if (existing !== undefined) {
                if (Array.isArray(existing)) {
                    existing.push(value);
                }
                else {
                    result[key] = [existing, value];
                }
            }
            else {
                result[key] = value;
            }
        }
    }
    return result;
}
/**
 * Form Data Extractor - extracts URL-encoded form data
 */
export class FormExtractor extends Extractor {
    name = 'Form';
    config;
    constructor(config = {}) {
        super();
        this.config = {
            maxSize: 1024 * 1024, // 1MB default
            strictContentType: true,
            ...config,
        };
    }
    extract(ctx) {
        const contentType = ctx.headers['content-type'] || '';
        // Validate content type
        if (this.config.strictContentType) {
            if (!contentType.includes('application/x-www-form-urlencoded')) {
                return this.err('Content-Type must be application/x-www-form-urlencoded', 415);
            }
        }
        // Check body exists
        if (!ctx.body) {
            return this.err('Request body is required', 400);
        }
        // Get body as string
        let bodyString;
        if (typeof ctx.body === 'string') {
            bodyString = ctx.body;
        }
        else if (ctx.body instanceof ArrayBuffer) {
            bodyString = new TextDecoder().decode(ctx.body);
        }
        else if (ctx.body instanceof Uint8Array) {
            bodyString = new TextDecoder().decode(ctx.body);
        }
        else if (typeof ctx.body === 'object') {
            // Already parsed object
            return this.ok(ctx.body);
        }
        else {
            return this.err('Unable to parse request body', 400);
        }
        // Check size limit
        if (this.config.maxSize && bodyString.length > this.config.maxSize) {
            return this.err(`Request body exceeds maximum size of ${this.config.maxSize} bytes`, 413);
        }
        try {
            const parsed = parseUrlEncodedBody(bodyString);
            return this.ok(parsed);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.err(`Failed to parse form data: ${message}`, 400);
        }
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
 * Parse multipart boundary from Content-Type header
 */
function extractBoundary(contentType) {
    const match = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
    return match ? (match[1] || match[2] || null) : null;
}
/**
 * Parse a single part header value
 */
function parseHeaderValue(header) {
    const parts = header.split(';').map(s => s.trim());
    const value = parts[0] || '';
    const params = {};
    for (let i = 1; i < parts.length; i++) {
        const param = parts[i];
        if (!param)
            continue;
        const eqIndex = param.indexOf('=');
        if (eqIndex === -1)
            continue;
        const paramName = param.substring(0, eqIndex).trim().toLowerCase();
        let paramValue = param.substring(eqIndex + 1).trim();
        // Remove quotes if present
        if (paramValue.startsWith('"') && paramValue.endsWith('"')) {
            paramValue = paramValue.slice(1, -1);
        }
        // Handle filename* (RFC 5987 encoding)
        if (paramName === 'filename*') {
            const encodingMatch = paramValue.match(/^([^']*)'([^']*)'(.*)$/);
            if (encodingMatch) {
                try {
                    paramValue = decodeURIComponent(encodingMatch[3] || '');
                    params['filename'] = paramValue;
                }
                catch {
                    // Fallback to raw value
                    params['filename'] = paramValue;
                }
            }
        }
        else {
            params[paramName] = paramValue;
        }
    }
    return { value, params };
}
/**
 * Parse multipart form data from raw bytes
 * Works in both Node.js and edge runtime environments
 */
function parseMultipartBody(body, boundary, config) {
    const result = {
        fields: {},
        files: [],
    };
    const boundaryBytes = new TextEncoder().encode('--' + boundary);
    const crlfBytes = new Uint8Array([13, 10]); // \r\n
    // Find all boundary positions
    const positions = [];
    let searchFrom = 0;
    while (searchFrom < body.length) {
        const pos = indexOfBytes(body, boundaryBytes, searchFrom);
        if (pos === -1)
            break;
        positions.push(pos);
        searchFrom = pos + boundaryBytes.length;
    }
    // Process each part
    for (let i = 0; i < positions.length - 1; i++) {
        const partStart = positions[i] + boundaryBytes.length;
        const partEnd = positions[i + 1];
        // Skip CRLF after boundary
        let contentStart = partStart;
        if (body[contentStart] === 13 && body[contentStart + 1] === 10) {
            contentStart += 2;
        }
        // Find end of headers (double CRLF)
        const headerEndPos = indexOfBytes(body, new Uint8Array([13, 10, 13, 10]), contentStart);
        if (headerEndPos === -1)
            continue;
        // Parse headers
        const headersBytes = body.slice(contentStart, headerEndPos);
        const headersText = new TextDecoder().decode(headersBytes);
        const headers = parsePartHeaders(headersText);
        // Get content (skip the double CRLF)
        const contentStartPos = headerEndPos + 4;
        let contentEndPos = partEnd;
        // Remove trailing CRLF before next boundary
        if (body[contentEndPos - 2] === 13 && body[contentEndPos - 1] === 10) {
            contentEndPos -= 2;
        }
        const content = body.slice(contentStartPos, contentEndPos);
        // Get Content-Disposition
        const disposition = headers['content-disposition'];
        if (!disposition)
            continue;
        const { params } = parseHeaderValue(disposition);
        const fieldName = params['name'] || '';
        const filename = params['filename'];
        if (filename) {
            // File field
            const contentType = headers['content-type'] || 'application/octet-stream';
            // Check file size
            if (config.maxFileSize && content.length > config.maxFileSize) {
                throw new Error(`File "${filename}" exceeds maximum size of ${config.maxFileSize} bytes`);
            }
            // Check allowed MIME types
            if (config.allowedMimeTypes && config.allowedMimeTypes.length > 0) {
                const mimeBase = contentType.split(';')[0].trim().toLowerCase();
                const isAllowed = config.allowedMimeTypes.some(allowed => {
                    if (allowed.endsWith('/*')) {
                        return mimeBase.startsWith(allowed.slice(0, -1));
                    }
                    return mimeBase === allowed.toLowerCase();
                });
                if (!isAllowed) {
                    throw new Error(`File type "${contentType}" is not allowed`);
                }
            }
            // Check max files
            if (config.maxFiles && result.files.length >= config.maxFiles) {
                throw new Error(`Maximum number of files (${config.maxFiles}) exceeded`);
            }
            result.files.push({
                name: fieldName,
                filename: config.preserveFilename ? filename : sanitizeFilename(filename),
                contentType,
                size: content.length,
                data: content,
            });
        }
        else {
            // Text field
            const value = new TextDecoder().decode(content);
            const existing = result.fields[fieldName];
            if (existing !== undefined) {
                if (Array.isArray(existing)) {
                    existing.push(value);
                }
                else {
                    result.fields[fieldName] = [existing, value];
                }
            }
            else {
                result.fields[fieldName] = value;
            }
        }
    }
    // Check total size
    if (config.maxTotalSize) {
        const totalFileSize = result.files.reduce((sum, f) => sum + f.size, 0);
        if (totalFileSize > config.maxTotalSize) {
            throw new Error(`Total file size exceeds maximum of ${config.maxTotalSize} bytes`);
        }
    }
    return result;
}
/**
 * Find index of byte sequence in array
 */
function indexOfBytes(haystack, needle, fromIndex = 0) {
    outer: for (let i = fromIndex; i <= haystack.length - needle.length; i++) {
        for (let j = 0; j < needle.length; j++) {
            if (haystack[i + j] !== needle[j]) {
                continue outer;
            }
        }
        return i;
    }
    return -1;
}
/**
 * Parse headers from a part's header section
 */
function parsePartHeaders(headersText) {
    const headers = {};
    const lines = headersText.split(/\r?\n/);
    for (const line of lines) {
        if (!line.trim())
            continue;
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1)
            continue;
        const name = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        headers[name] = value;
    }
    return headers;
}
/**
 * Sanitize filename to prevent path traversal attacks
 */
function sanitizeFilename(filename) {
    // Remove path separators and null bytes
    return filename
        .replace(/[/\\]/g, '_')
        .replace(/\0/g, '')
        .replace(/^\.+/, '') // Remove leading dots
        .slice(0, 255); // Limit length
}
/**
 * Multipart Form Extractor - extracts multipart/form-data with file uploads
 */
export class MultipartExtractor extends Extractor {
    name = 'Multipart';
    config;
    constructor(config = {}) {
        super();
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxTotalSize: 50 * 1024 * 1024, // 50MB
            maxFiles: 10,
            allowedMimeTypes: [],
            preserveFilename: false,
            ...config,
        };
    }
    async extract(ctx) {
        const contentType = ctx.headers['content-type'] || '';
        // Validate content type
        if (!contentType.includes('multipart/form-data')) {
            return this.err('Content-Type must be multipart/form-data', 415);
        }
        // Extract boundary
        const boundary = extractBoundary(contentType);
        if (!boundary) {
            return this.err('Missing multipart boundary in Content-Type header', 400);
        }
        // Check body exists
        if (!ctx.body) {
            return this.err('Request body is required', 400);
        }
        // Convert body to Uint8Array
        let bodyBytes;
        if (ctx.body instanceof Uint8Array) {
            bodyBytes = ctx.body;
        }
        else if (ctx.body instanceof ArrayBuffer) {
            bodyBytes = new Uint8Array(ctx.body);
        }
        else if (typeof ctx.body === 'string') {
            bodyBytes = new TextEncoder().encode(ctx.body);
        }
        else if (typeof Blob !== 'undefined' && ctx.body instanceof Blob) {
            // Edge runtime / browser environment
            bodyBytes = new Uint8Array(await ctx.body.arrayBuffer());
        }
        else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(ctx.body)) {
            // Node.js environment
            bodyBytes = new Uint8Array(ctx.body);
        }
        else {
            return this.err('Unable to read request body', 400);
        }
        // Check total size
        if (this.config.maxTotalSize && bodyBytes.length > this.config.maxTotalSize) {
            return this.err(`Request body exceeds maximum size of ${this.config.maxTotalSize} bytes`, 413);
        }
        try {
            const result = parseMultipartBody(bodyBytes, boundary, this.config);
            return this.ok(result);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.err(`Failed to parse multipart data: ${message}`, 400);
        }
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
        return this.err('Data extraction not available in TypeScript context', 500);
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
//# sourceMappingURL=extractors.js.map