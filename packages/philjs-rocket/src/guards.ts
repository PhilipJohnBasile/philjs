/**
 * PhilJS Rocket Guards
 *
 * Request guards for Rocket framework integration.
 * Guards validate incoming requests and extract typed data.
 */

import type {
  GuardContext,
  GuardOutcome,
  GuardDefinition,
} from './types.js';

// ============================================================================
// Base Guard
// ============================================================================

/**
 * Base class for request guards
 */
export abstract class RequestGuard<T> {
  /** Guard name */
  abstract readonly name: string;

  /** Validate and extract from request */
  abstract validate(ctx: GuardContext): GuardOutcome<T> | Promise<GuardOutcome<T>>;

  /** Generate Rust guard implementation */
  abstract toRustCode(): string;

  /**
   * Create a successful outcome
   */
  protected success(value: T): GuardOutcome<T> {
    return { success: true, value };
  }

  /**
   * Create a failed outcome
   */
  protected failure(error: string, status?: number): GuardOutcome<T> {
    const outcome: GuardOutcome<T> = { success: false, error };
    if (status !== undefined) {
      outcome.status = status;
    }
    return outcome;
  }
}

// ============================================================================
// SSR Context Guard
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
 * SSR Context Guard - extracts SSR-relevant request data
 */
export class SSRContextGuard extends RequestGuard<SSRContextData> {
  readonly name = 'SSRContext';

  validate(ctx: GuardContext): GuardOutcome<SSRContextData> {
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

  private detectBot(userAgent: string): boolean {
    const botPatterns = [
      'googlebot', 'bingbot', 'slurp', 'duckduckbot',
      'baiduspider', 'yandexbot', 'facebookexternalhit',
      'twitterbot', 'linkedinbot', 'bot', 'spider', 'crawler',
    ];
    const ua = userAgent.toLowerCase();
    return botPatterns.some(pattern => ua.includes(pattern));
  }

  private detectMobile(userAgent: string): boolean {
    const mobilePatterns = [
      'mobile', 'android', 'iphone', 'ipad', 'ipod',
      'blackberry', 'windows phone',
    ];
    const ua = userAgent.toLowerCase();
    return mobilePatterns.some(pattern => ua.includes(pattern));
  }

  private parseAcceptLanguage(header: string): string[] {
    if (!header) return ['en'];
    return header
      .split(',')
      .map(lang => lang.split(';')[0]!.trim())
      .filter(Boolean);
  }

  private generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toRustCode(): string {
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

// ============================================================================
// Auth Guard
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
 * Auth Guard configuration
 */
export interface AuthGuardConfig {
  /** Required roles (any of) */
  roles?: string[];
  /** Required permissions (all of) */
  permissions?: string[];
  /** Custom validation function */
  validate?: (user: AuthUser) => boolean;
  /** Redirect URL on failure */
  redirectUrl?: string;
}

/**
 * Auth Guard - validates authentication and authorization
 */
export class AuthGuard extends RequestGuard<AuthUser> {
  readonly name = 'Auth';
  private config: AuthGuardConfig;

  constructor(config: AuthGuardConfig = {}) {
    super();
    this.config = config;
  }

  async validate(ctx: GuardContext): Promise<GuardOutcome<AuthUser>> {
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
      const hasAllPermissions = this.config.permissions.every(
        perm => user.permissions.includes(perm)
      );
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

  private parseAuthToken(token: string | undefined): AuthUser | null {
    if (!token) return null;

    // In real implementation, decode and validate JWT
    // This is a placeholder that returns a mock user
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '');

      // Decode token (placeholder - use proper JWT validation in production)
      const parts = cleanToken.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]!));
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
  static admin(): AuthGuard {
    return new AuthGuard({ roles: ['admin'] });
  }

  /**
   * Create a guard requiring specific roles
   */
  static withRoles(...roles: string[]): AuthGuard {
    return new AuthGuard({ roles });
  }

  /**
   * Create a guard requiring specific permissions
   */
  static withPermissions(...permissions: string[]): AuthGuard {
    return new AuthGuard({ permissions });
  }
}

// ============================================================================
// CSRF Guard
// ============================================================================

/**
 * CSRF Guard configuration
 */
export interface CSRFGuardConfig {
  /** Token header name */
  headerName?: string;
  /** Token cookie name */
  cookieName?: string;
  /** Excluded methods */
  excludeMethods?: string[];
  /** Excluded paths */
  excludePaths?: string[];
}

/**
 * CSRF Guard - validates CSRF tokens
 */
export class CSRFGuard extends RequestGuard<string> {
  readonly name = 'CSRF';
  private config: CSRFGuardConfig;

  constructor(config: CSRFGuardConfig = {}) {
    super();
    this.config = {
      headerName: 'X-CSRF-Token',
      cookieName: 'csrf_token',
      excludeMethods: ['GET', 'HEAD', 'OPTIONS'],
      excludePaths: [],
      ...config,
    };
  }

  validate(ctx: GuardContext): GuardOutcome<string> {
    // Skip for excluded methods
    if (this.config.excludeMethods?.includes(ctx.method.toUpperCase())) {
      return this.success('skipped');
    }

    // Skip for excluded paths
    if (this.config.excludePaths?.some(path => ctx.path.startsWith(path))) {
      return this.success('skipped');
    }

    // Get token from header
    const headerToken = ctx.headers[this.config.headerName!.toLowerCase()];

    // Get token from cookie
    const cookieToken = ctx.cookies[this.config.cookieName!];

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

  toRustCode(): string {
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

// ============================================================================
// JSON Body Guard
// ============================================================================

/**
 * JSON Body Guard configuration
 */
export interface JsonBodyGuardConfig {
  /** Maximum body size in bytes */
  maxSize?: number;
  /** Content type validation */
  strictContentType?: boolean;
}

/**
 * JSON Body Guard - extracts and validates JSON request body
 */
export class JsonBodyGuard<T> extends RequestGuard<T> {
  readonly name = 'JsonBody';
  private config: JsonBodyGuardConfig;
  private schema?: object;

  constructor(config: JsonBodyGuardConfig = {}, schema?: object) {
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

  validate(ctx: GuardContext): GuardOutcome<T> {
    // Check content type
    if (this.config.strictContentType) {
      const contentType = ctx.headers['content-type'] || '';
      if (!contentType.includes('application/json')) {
        return this.failure('Content-Type must be application/json', 415);
      }
    }

    const parsed = parseJsonBody(ctx.body, this.config.maxSize || 0);
    if (!parsed.success) {
      return this.failure(parsed.error, parsed.status);
    }

    if (this.schema) {
      const schemaError = validateSchema(parsed.value, this.schema);
      if (schemaError) {
        return this.failure(schemaError, 422);
      }
    }

    return this.success(parsed.value as T);
  }

  toRustCode(): string {
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
export class FormDataGuard<T> extends RequestGuard<T> {
  readonly name = 'FormData';
  private maxSize: number;

  constructor(maxSize: number = 1024 * 1024) {
    super();
    this.maxSize = maxSize;
  }

  validate(ctx: GuardContext): GuardOutcome<T> {
    const contentType = ctx.headers['content-type'] || '';
    if (!contentType.includes('application/x-www-form-urlencoded') &&
        !contentType.includes('multipart/form-data')) {
      return this.failure('Invalid content type for form data', 415);
    }

    const parsed = parseFormBody(ctx.body, contentType, this.maxSize);
    if (!parsed.success) {
      return this.failure(parsed.error, parsed.status);
    }

    return this.success(parsed.value as T);
  }

  toRustCode(): string {
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
export class PathGuard<T> extends RequestGuard<T> {
  readonly name = 'Path';
  private paramName: string;

  constructor(paramName: string) {
    super();
    this.paramName = paramName;
  }

  validate(ctx: GuardContext): GuardOutcome<T> {
    const value = ctx.params[this.paramName];
    if (!value) {
      return this.failure(`Path parameter '${this.paramName}' not found`, 400);
    }

    return this.success(value as unknown as T);
  }

  toRustCode(): string {
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

// ============================================================================
// Query Guard
// ============================================================================

/**
 * Query Guard configuration
 */
export interface QueryGuardConfig {
  /** Required parameters */
  required?: string[];
  /** Default values */
  defaults?: Record<string, string>;
}

/**
 * Query Guard - extracts and validates query parameters
 */
export class QueryGuard<T extends Record<string, string>> extends RequestGuard<T> {
  readonly name = 'Query';
  private config: QueryGuardConfig;

  constructor(config: QueryGuardConfig = {}) {
    super();
    this.config = config;
  }

  validate(ctx: GuardContext): GuardOutcome<T> {
    const result: Record<string, string> = { ...this.config.defaults };

    // Check required parameters
    for (const param of this.config.required || []) {
      if (!ctx.query[param]) {
        return this.failure(`Missing required query parameter: ${param}`, 400);
      }
      result[param] = ctx.query[param];
    }

    // Copy all query parameters
    for (const [key, value] of Object.entries(ctx.query)) {
      result[key] = value as string;
    }

    return this.success(result as T);
  }

  toRustCode(): string {
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
export function createGuard<T>(
  name: string,
  validate: (ctx: GuardContext) => GuardOutcome<T> | Promise<GuardOutcome<T>>
): GuardDefinition<T> {
  return { name, validate };
}

/**
 * Combine multiple guards
 */
export function combineGuards<T extends unknown[]>(
  ...guards: { validate: (ctx: GuardContext) => GuardOutcome<unknown> | Promise<GuardOutcome<unknown>> }[]
): (ctx: GuardContext) => Promise<GuardOutcome<T>> {
  return async (ctx: GuardContext): Promise<GuardOutcome<T>> => {
    const results: unknown[] = [];

    for (const guard of guards) {
      const outcome = await guard.validate(ctx);
      if (!outcome.success) {
        return outcome as GuardOutcome<T>;
      }
      results.push(outcome.value);
    }

    return { success: true, value: results as T };
  };
}

type ParseResult<T> = { success: true; value: T } | { success: false; error: string; status?: number };

function parseJsonBody(body: GuardContext['body'], maxSize: number): ParseResult<unknown> {
  if (body === undefined) {
    return { success: false, error: 'Request body is required', status: 400 };
  }

  if (typeof body === 'string') {
    if (maxSize > 0 && body.length > maxSize) {
      return { success: false, error: 'Payload too large', status: 413 };
    }
    try {
      return { success: true, value: JSON.parse(body) };
    } catch (error) {
      return { success: false, error: `Invalid JSON: ${(error as Error).message}`, status: 400 };
    }
  }

  if (body instanceof Uint8Array) {
    if (maxSize > 0 && body.length > maxSize) {
      return { success: false, error: 'Payload too large', status: 413 };
    }
    const text = new TextDecoder('utf-8').decode(body);
    try {
      return { success: true, value: JSON.parse(text) };
    } catch (error) {
      return { success: false, error: `Invalid JSON: ${(error as Error).message}`, status: 400 };
    }
  }

  if (typeof body === 'object') {
    return { success: true, value: body };
  }

  return { success: false, error: 'Unsupported body type', status: 415 };
}

function parseFormBody(
  body: GuardContext['body'],
  contentType: string,
  maxSize: number
): ParseResult<Record<string, unknown>> {
  if (body === undefined) {
    return { success: false, error: 'Request body is required', status: 400 };
  }

  if (body instanceof FormData) {
    return { success: true, value: formDataToRecord(body) };
  }

  if (body instanceof URLSearchParams) {
    return { success: true, value: paramsToRecord(body) };
  }

  const raw = typeof body === 'string'
    ? body
    : body instanceof Uint8Array
      ? new TextDecoder('utf-8').decode(body)
      : null;

  if (raw === null) {
    if (typeof body === 'object') {
      return { success: true, value: body as Record<string, unknown> };
    }
    return { success: false, error: 'Unsupported body type', status: 415 };
  }

  if (maxSize > 0 && raw.length > maxSize) {
    return { success: false, error: 'Payload too large', status: 413 };
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return { success: true, value: paramsToRecord(new URLSearchParams(raw)) };
  }

  const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
  if (!boundaryMatch) {
    return { success: false, error: 'Multipart boundary missing', status: 400 };
  }

  return { success: true, value: parseMultipart(raw, boundaryMatch[1]!) };
}

function formDataToRecord(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    appendFormValue(result, key, value);
  }
  return result;
}

function paramsToRecord(params: URLSearchParams): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  params.forEach((value, key) => {
    appendFormValue(result, key, value);
  });
  return result;
}

function parseMultipart(body: string, boundary: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const parts = body.split(`--${boundary}`).slice(1, -1);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [rawHeaders, rawValue] = trimmed.split(/\r\n\r\n/);
    if (!rawHeaders || rawValue === undefined) continue;

    const headers = rawHeaders.split(/\r\n/).reduce<Record<string, string>>((acc, line) => {
      const [key, ...rest] = line.split(':');
      if (!key) return acc;
      acc[key.trim().toLowerCase()] = rest.join(':').trim();
      return acc;
    }, {});

    const disposition = headers['content-disposition'] || '';
    const nameMatch = disposition.match(/name=\"([^\"]+)\"/i);
    if (!nameMatch) continue;

    const filenameMatch = disposition.match(/filename=\"([^\"]*)\"/i);
    const value = rawValue.replace(/\r\n$/, '');

    if (filenameMatch) {
      appendFormValue(result, nameMatch[1]!, {
        filename: filenameMatch[1]!,
        contentType: headers['content-type'],
        data: value,
        size: value.length,
      });
    } else {
      appendFormValue(result, nameMatch[1]!, value);
    }
  }

  return result;
}

function appendFormValue(result: Record<string, unknown>, key: string, value: unknown): void {
  const existing = result[key];
  if (existing === undefined) {
    result[key] = value;
  } else if (Array.isArray(existing)) {
    existing.push(value);
  } else {
    result[key] = [existing, value];
  }
}

function validateSchema(value: unknown, schema: object): string | null {
  if (!schema || typeof schema !== 'object') return null;
  const record = value as Record<string, unknown>;
  const required = (schema as { required?: string[] }).required;
  if (required && Array.isArray(required)) {
    for (const key of required) {
      if (!(key in record)) {
        return `Missing required field: ${key}`;
      }
    }
  }
  return null;
}
