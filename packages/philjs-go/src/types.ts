/**
 * Type definitions for PhilJS Go integration
 */

export interface GoServerConfig {
  /**
   * Server port
   * @default 3000
   */
  port?: number;

  /**
   * Host to bind to
   * @default "0.0.0.0"
   */
  host?: string;

  /**
   * Enable SSR
   * @default true
   */
  ssr?: boolean;

  /**
   * Static files directory
   */
  static?: string;

  /**
   * API routes directory
   */
  apiDir?: string;

  /**
   * Enable compression
   * @default true
   */
  compress?: boolean;

  /**
   * Enable CORS
   */
  cors?: CorsConfig | boolean;

  /**
   * TLS configuration
   */
  tls?: TlsConfig;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Maximum request body size
   * @default "10mb"
   */
  maxBodySize?: string;

  /**
   * Enable HTTP/2
   * @default true
   */
  http2?: boolean;

  /**
   * Edge runtime mode (Cloudflare Workers compatible)
   */
  edge?: boolean;
}

export interface CorsConfig {
  origins?: string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export interface TlsConfig {
  cert: string;
  key: string;
}

export interface GoRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  path: string;
  handler: string;
}

export interface GoMiddleware {
  name: string;
  handler: string;
  paths?: string[];
}

export interface GoServerFunction {
  name: string;
  method: string;
  path: string;
  handler: GoFunctionHandler;
}

export type GoFunctionHandler = (ctx: GoContext) => Promise<GoResponse> | GoResponse;

export interface GoContext {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: unknown;
    params: Record<string, string>;
    query: Record<string, string>;
  };
  env: Record<string, string>;
}

export interface GoResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface GoBuildOptions {
  /**
   * Output directory
   * @default "./dist/go"
   */
  outDir?: string;

  /**
   * Target OS
   * @default current OS
   */
  goos?: 'linux' | 'darwin' | 'windows';

  /**
   * Target architecture
   * @default current arch
   */
  goarch?: 'amd64' | 'arm64' | 'arm';

  /**
   * Build mode
   * @default "release"
   */
  mode?: 'debug' | 'release';

  /**
   * Enable CGO
   * @default false
   */
  cgo?: boolean;

  /**
   * Additional build flags
   */
  flags?: string[];

  /**
   * Generate Docker image
   */
  docker?: boolean;
}

export interface GoProjectConfig {
  /**
   * Go module name
   */
  module: string;

  /**
   * Go version
   * @default "1.22"
   */
  goVersion?: string;

  /**
   * Server configuration
   */
  server?: GoServerConfig;

  /**
   * Build configuration
   */
  build?: GoBuildOptions;

  /**
   * Dependencies
   */
  dependencies?: Record<string, string>;
}
