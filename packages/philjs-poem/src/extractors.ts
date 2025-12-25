/**
 * PhilJS Poem Extractors
 *
 * Extractors for the Poem framework integration.
 * Poem has powerful built-in extractors that we extend for PhilJS use cases.
 */

import type {
  ExtractorContext,
  ExtractorResult,
  ExtractorDefinition,
} from './types';

// ============================================================================
// Base Extractor
// ============================================================================

/**
 * Base class for custom extractors
 */
export abstract class Extractor<T> {
  /** Extractor name */
  abstract readonly name: string;

  /** Extract value from request */
  abstract extract(ctx: ExtractorContext): ExtractorResult<T> | Promise<ExtractorResult<T>>;

  /** Generate Rust extractor implementation */
  abstract toRustCode(): string;

  /**
   * Create a successful result
   */
  protected ok(value: T): ExtractorResult<T> {
    return { ok: true, value };
  }

  /**
   * Create a failed result
   */
  protected err(error: string, status?: number): ExtractorResult<T> {
    return { ok: false, error, status };
  }
}

// ============================================================================
// SSR Context Extractor
// ============================================================================

/**
 * SSR context data
 */
export interface SSRContextData {
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  userAgent: string | null;
  isBot: boolean;
  acceptLanguage: string[];
  isMobile: boolean;
  requestId: string;
}

/**
 * SSR Context Extractor - extracts SSR-relevant request data
 */
export class SSRContextExtractor extends Extractor<SSRContextData> {
  readonly name = 'SSRContext';

  extract(ctx: ExtractorContext): ExtractorResult<SSRContextData> {
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

  private detectBot(userAgent: string): boolean {
    const botPatterns = ['googlebot', 'bingbot', 'bot', 'spider', 'crawler'];
    const ua = userAgent.toLowerCase();
    return botPatterns.some(pattern => ua.includes(pattern));
  }

  private detectMobile(userAgent: string): boolean {
    const mobilePatterns = ['mobile', 'android', 'iphone', 'ipad'];
    const ua = userAgent.toLowerCase();
    return mobilePatterns.some(pattern => ua.includes(pattern));
  }

  private parseAcceptLanguage(header: string): string[] {
    if (!header) return ['en'];
    return header.split(',').map(lang => lang.split(';')[0].trim()).filter(Boolean);
  }

  toRustCode(): string {
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

// ============================================================================
// JSON Body Extractor
// ============================================================================

/**
 * JSON body extractor configuration
 */
export interface JsonExtractorConfig {
  /** Maximum body size in bytes */
  maxSize?: number;
  /** Strict content type check */
  strictContentType?: boolean;
}

/**
 * JSON Body Extractor with validation
 */
export class JsonExtractor<T> extends Extractor<T> {
  readonly name = 'Json';
  private config: JsonExtractorConfig;

  constructor(config: JsonExtractorConfig = {}) {
    super();
    this.config = {
      maxSize: 1024 * 1024, // 1MB
      strictContentType: true,
      ...config,
    };
  }

  extract(ctx: ExtractorContext): ExtractorResult<T> {
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
      return this.ok(parsed as T);
    } catch {
      return this.err('Invalid JSON in request body', 400);
    }
  }

  toRustCode(): string {
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

// ============================================================================
// Query Extractor
// ============================================================================

/**
 * Query parameters extractor configuration
 */
export interface QueryExtractorConfig {
  /** Required parameters */
  required?: string[];
  /** Default values */
  defaults?: Record<string, string>;
}

/**
 * Query Parameters Extractor
 */
export class QueryExtractor<T extends Record<string, string>> extends Extractor<T> {
  readonly name = 'Query';
  private config: QueryExtractorConfig;

  constructor(config: QueryExtractorConfig = {}) {
    super();
    this.config = config;
  }

  extract(ctx: ExtractorContext): ExtractorResult<T> {
    const result: Record<string, string> = { ...this.config.defaults };

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

    return this.ok(result as T);
  }

  toRustCode(): string {
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
export class PathExtractor<T> extends Extractor<T> {
  readonly name = 'Path';
  private paramNames: string[];

  constructor(...paramNames: string[]) {
    super();
    this.paramNames = paramNames;
  }

  extract(ctx: ExtractorContext): ExtractorResult<T> {
    const result: Record<string, string> = {};

    for (const name of this.paramNames) {
      if (!ctx.params[name]) {
        return this.err(`Missing path parameter: ${name}`, 400);
      }
      result[name] = ctx.params[name];
    }

    return this.ok(result as T);
  }

  toRustCode(): string {
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

// ============================================================================
// Auth Extractor
// ============================================================================

/**
 * Authenticated user data
 */
export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Auth Extractor configuration
 */
export interface AuthExtractorConfig {
  /** Required roles (any of) */
  roles?: string[];
  /** Required permissions (all of) */
  permissions?: string[];
  /** Optional - don't fail if no auth */
  optional?: boolean;
}

/**
 * Auth Extractor - extracts and validates authentication
 */
export class AuthExtractor extends Extractor<AuthUser | null> {
  readonly name = 'Auth';
  private config: AuthExtractorConfig;

  constructor(config: AuthExtractorConfig = {}) {
    super();
    this.config = config;
  }

  async extract(ctx: ExtractorContext): Promise<ExtractorResult<AuthUser | null>> {
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
      const hasAllPermissions = this.config.permissions.every(
        perm => user.permissions.includes(perm)
      );
      if (!hasAllPermissions) {
        return this.err('Missing required permissions', 403);
      }
    }

    return this.ok(user);
  }

  private parseAuthToken(token: string | undefined): AuthUser | null {
    if (!token) return null;

    try {
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      const parts = cleanToken.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return {
        id: payload.sub || payload.id,
        email: payload.email,
        name: payload.name,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
        metadata: payload.metadata,
      };
    } catch {
      return null;
    }
  }

  toRustCode(): string {
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
export class FormExtractor<T> extends Extractor<T> {
  readonly name = 'Form';
  private maxSize: number;

  constructor(maxSize: number = 1024 * 1024) {
    super();
    this.maxSize = maxSize;
  }

  extract(ctx: ExtractorContext): ExtractorResult<T> {
    const contentType = ctx.headers['content-type'] || '';
    if (!contentType.includes('application/x-www-form-urlencoded') &&
        !contentType.includes('multipart/form-data')) {
      return this.err('Invalid content type for form data', 415);
    }

    return this.err('Form parsing not implemented in TypeScript extractor', 500);
  }

  toRustCode(): string {
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

// ============================================================================
// Multipart Extractor
// ============================================================================

/**
 * Multipart form data with file upload support
 */
export interface MultipartFile {
  name: string;
  filename: string;
  contentType: string;
  size: number;
  data: Uint8Array;
}

/**
 * Multipart Form Extractor
 */
export class MultipartExtractor extends Extractor<Map<string, string | MultipartFile>> {
  readonly name = 'Multipart';
  private maxFileSize: number;

  constructor(maxFileSize: number = 10 * 1024 * 1024) {
    super();
    this.maxFileSize = maxFileSize;
  }

  extract(ctx: ExtractorContext): ExtractorResult<Map<string, string | MultipartFile>> {
    const contentType = ctx.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return this.err('Content-Type must be multipart/form-data', 415);
    }

    return this.err('Multipart parsing not implemented in TypeScript extractor', 500);
  }

  toRustCode(): string {
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
export class CookieExtractor extends Extractor<Record<string, string>> {
  readonly name = 'Cookie';

  extract(ctx: ExtractorContext): ExtractorResult<Record<string, string>> {
    return this.ok(ctx.cookies);
  }

  toRustCode(): string {
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
export class HeaderExtractor extends Extractor<string | null> {
  readonly name = 'Header';
  private headerName: string;
  private required: boolean;

  constructor(headerName: string, required: boolean = false) {
    super();
    this.headerName = headerName;
    this.required = required;
  }

  extract(ctx: ExtractorContext): ExtractorResult<string | null> {
    const value = ctx.headers[this.headerName.toLowerCase()];

    if (!value && this.required) {
      return this.err(`Missing required header: ${this.headerName}`, 400);
    }

    return this.ok(value || null);
  }

  toRustCode(): string {
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
export class DataExtractor<T> extends Extractor<T> {
  readonly name = 'Data';

  extract(ctx: ExtractorContext): ExtractorResult<T> {
    return this.err('Data extraction not available in TypeScript context', 500);
  }

  toRustCode(): string {
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
export function createExtractor<T>(
  name: string,
  extract: (ctx: ExtractorContext) => ExtractorResult<T> | Promise<ExtractorResult<T>>
): ExtractorDefinition<T> {
  return { name, extract };
}

/**
 * Create an SSR context extractor
 */
export function ssrContext(): SSRContextExtractor {
  return new SSRContextExtractor();
}

/**
 * Create a JSON body extractor
 */
export function json<T>(config?: JsonExtractorConfig): JsonExtractor<T> {
  return new JsonExtractor<T>(config);
}

/**
 * Create a query params extractor
 */
export function query<T extends Record<string, string>>(config?: QueryExtractorConfig): QueryExtractor<T> {
  return new QueryExtractor<T>(config);
}

/**
 * Create an auth extractor
 */
export function auth(config?: AuthExtractorConfig): AuthExtractor {
  return new AuthExtractor(config);
}

/**
 * Create an optional auth extractor
 */
export function optionalAuth(): AuthExtractor {
  return new AuthExtractor({ optional: true });
}
