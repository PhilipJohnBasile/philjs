/**
 * PhilJS Rocket Server
 *
 * RocketServer class for SSR integration with PhilJS.
 * Provides a unified interface for configuring and running
 * a Rocket server with PhilJS components.
 */

import type { RocketConfig, RocketSSRConfig, RocketLiveViewConfig } from './types.js';
import { SSRMiddleware, CORSMiddleware, SecurityMiddleware } from './middleware.js';
import type { SSRFairingConfig, LiveViewFairingConfig } from './fairing.js';
import { SSRFairing, LiveViewFairing, StateFairing, MetricsFairing, FairingComposer } from './fairing.js';

// ============================================================================
// Server Configuration
// ============================================================================

/**
 * Rocket server configuration
 */
export interface RocketServerConfig {
  /** Server host */
  host?: string;
  /** Server port */
  port?: number;
  /** Number of workers */
  workers?: number;
  /** Keep-alive timeout in seconds */
  keepAlive?: number;
  /** Request timeout in seconds */
  timeout?: number;
  /** Enable TLS */
  tls?: {
    cert: string;
    key: string;
  };
  /** Log level */
  logLevel?: 'off' | 'critical' | 'normal' | 'debug';
  /** Secret key for cookies (32 bytes) */
  secretKey?: string;
  /** Static files directory */
  staticDir?: string;
  /** Template directory */
  templateDir?: string;
  /** PhilJS configuration */
  philjs?: RocketConfig;
}

/**
 * Default server configuration
 */
export const DEFAULT_SERVER_CONFIG: Required<Omit<RocketServerConfig, 'tls' | 'secretKey' | 'philjs'>> = {
  host: '127.0.0.1',
  port: 8000,
  workers: 4,
  keepAlive: 5,
  timeout: 30,
  logLevel: 'normal',
  staticDir: 'static',
  templateDir: 'templates',
};

// ============================================================================
// Rocket Server
// ============================================================================

/**
 * RocketServer class for PhilJS SSR integration
 */
export class RocketServer {
  private config: RocketServerConfig;
  private fairings: FairingComposer;
  private routes: RouteDefinition[] = [];
  private catchers: CatcherDefinition[] = [];
  private state: Map<string, unknown> = new Map();

  constructor(config: RocketServerConfig = {}) {
    this.config = {
      ...DEFAULT_SERVER_CONFIG,
      ...config,
    };
    this.fairings = new FairingComposer();

    // Apply default fairings based on config
    if (config.philjs?.ssr?.enabled !== false) {
      const ssrConfig: SSRFairingConfig = {};
      if (config.philjs?.ssr?.streaming !== undefined) ssrConfig.streaming = config.philjs.ssr.streaming;
      if (config.philjs?.ssr?.hydration !== undefined) ssrConfig.hydration = config.philjs.ssr.hydration;
      if (config.templateDir !== undefined) ssrConfig.templatePath = config.templateDir;
      this.fairings.withSSR(ssrConfig);
    }

    if (config.philjs?.liveview?.enabled) {
      const liveViewConfig: LiveViewFairingConfig = {};
      if (config.philjs.liveview.heartbeatInterval !== undefined) liveViewConfig.heartbeatInterval = config.philjs.liveview.heartbeatInterval;
      if (config.philjs.liveview.timeout !== undefined) liveViewConfig.timeout = config.philjs.liveview.timeout;
      if (config.philjs.liveview.maxConnections !== undefined) liveViewConfig.maxConnections = config.philjs.liveview.maxConnections;
      this.fairings.withLiveView(liveViewConfig);
    }
  }

  // ============================================================================
  // Configuration Methods
  // ============================================================================

  /**
   * Configure the server
   */
  configure(config: Partial<RocketServerConfig>): this {
    this.config = { ...this.config, ...config };
    return this;
  }

  /**
   * Set server host
   */
  host(host: string): this {
    this.config.host = host;
    return this;
  }

  /**
   * Set server port
   */
  port(port: number): this {
    this.config.port = port;
    return this;
  }

  /**
   * Set number of workers
   */
  workers(count: number): this {
    this.config.workers = count;
    return this;
  }

  /**
   * Enable TLS
   */
  withTLS(cert: string, key: string): this {
    this.config.tls = { cert, key };
    return this;
  }

  /**
   * Set secret key for cookies
   */
  secretKey(key: string): this {
    this.config.secretKey = key;
    return this;
  }

  /**
   * Set log level
   */
  logLevel(level: 'off' | 'critical' | 'normal' | 'debug'): this {
    this.config.logLevel = level;
    return this;
  }

  // ============================================================================
  // Fairing Methods
  // ============================================================================

  /**
   * Add a fairing
   */
  attach<F extends { name: string }>(fairing: F): this {
    this.fairings.use(fairing as any);
    return this;
  }

  /**
   * Enable SSR with configuration
   */
  withSSR(config?: Partial<RocketSSRConfig>): this {
    const ssrFairingConfig: SSRFairingConfig = {};
    if (config?.streaming !== undefined) ssrFairingConfig.streaming = config.streaming;
    if (config?.hydration !== undefined) ssrFairingConfig.hydration = config.hydration;
    if (this.config.templateDir !== undefined) ssrFairingConfig.templatePath = this.config.templateDir;
    this.fairings.withSSR(ssrFairingConfig);
    return this;
  }

  /**
   * Enable LiveView with configuration
   */
  withLiveView(config?: Partial<RocketLiveViewConfig>): this {
    const liveViewFairingConfig: LiveViewFairingConfig = {};
    if (config?.heartbeatInterval !== undefined) liveViewFairingConfig.heartbeatInterval = config.heartbeatInterval;
    if (config?.timeout !== undefined) liveViewFairingConfig.timeout = config.timeout;
    if (config?.maxConnections !== undefined) liveViewFairingConfig.maxConnections = config.maxConnections;
    if (config?.compression !== undefined) liveViewFairingConfig.compression = config.compression;
    this.fairings.withLiveView(liveViewFairingConfig);
    return this;
  }

  /**
   * Enable metrics collection
   */
  withMetrics(path: string = '/metrics'): this {
    this.fairings.withMetrics({ path });
    return this;
  }

  /**
   * Enable CORS
   */
  withCORS(config?: { origins?: string[]; methods?: string[]; credentials?: boolean }): this {
    // CORS is handled via middleware, not fairing
    return this;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Register managed state
   */
  manage<T>(key: string, value: T): this {
    this.state.set(key, value);
    return this;
  }

  /**
   * Get managed state
   */
  getState<T>(key: string): T | undefined {
    return this.state.get(key) as T | undefined;
  }

  // ============================================================================
  // Route Registration
  // ============================================================================

  /**
   * Mount routes at a base path
   */
  mount(base: string, routes: RouteDefinition[]): this {
    const prefixedRoutes = routes.map(route => ({
      ...route,
      path: `${base}${route.path}`,
    }));
    this.routes.push(...prefixedRoutes);
    return this;
  }

  /**
   * Register a GET route
   */
  get(path: string, handler: RouteHandler): this {
    this.routes.push({ method: 'GET', path, handler });
    return this;
  }

  /**
   * Register a POST route
   */
  post(path: string, handler: RouteHandler): this {
    this.routes.push({ method: 'POST', path, handler });
    return this;
  }

  /**
   * Register a PUT route
   */
  put(path: string, handler: RouteHandler): this {
    this.routes.push({ method: 'PUT', path, handler });
    return this;
  }

  /**
   * Register a DELETE route
   */
  delete(path: string, handler: RouteHandler): this {
    this.routes.push({ method: 'DELETE', path, handler });
    return this;
  }

  /**
   * Register a PATCH route
   */
  patch(path: string, handler: RouteHandler): this {
    this.routes.push({ method: 'PATCH', path, handler });
    return this;
  }

  // ============================================================================
  // Error Catchers
  // ============================================================================

  /**
   * Register error catchers
   */
  register(base: string, catchers: CatcherDefinition[]): this {
    const prefixedCatchers = catchers.map(c => ({
      ...c,
      base,
    }));
    this.catchers.push(...prefixedCatchers);
    return this;
  }

  /**
   * Register a 404 catcher
   */
  catch404(handler: CatcherHandler): this {
    this.catchers.push({ status: 404, handler });
    return this;
  }

  /**
   * Register a 500 catcher
   */
  catch500(handler: CatcherHandler): this {
    this.catchers.push({ status: 500, handler });
    return this;
  }

  /**
   * Register a default catcher
   */
  catchDefault(handler: CatcherHandler): this {
    this.catchers.push({ handler });
    return this;
  }

  // ============================================================================
  // Build and Launch
  // ============================================================================

  /**
   * Build the server configuration (ignite)
   */
  build(): RocketServerBuild {
    return {
      config: this.config,
      fairings: this.fairings.getFairings(),
      routes: this.routes,
      catchers: this.catchers,
      state: this.state,
    };
  }

  /**
   * Generate Rust code for the server
   */
  toRustCode(): string {
    const stateManage = Array.from(this.state.entries())
      .map(([key, _value]) => `.manage(${key}State::default())`)
      .join('\n        ');

    const routeMounts = this.routes.length > 0
      ? `.mount("/", routes![${this.routes.map(r => r.path.replace(/\//g, '_').replace(/^_/, '')).join(', ')}])`
      : '';

    const catcherRegisters = this.catchers.length > 0
      ? `.register("/", catchers![${this.catchers.map(c => c.status ? `catch_${c.status}` : 'catch_default').join(', ')}])`
      : '';

    return `
use rocket::{Rocket, Build, Config};
use philjs_rocket::prelude::*;

#[rocket::main]
async fn main() -> Result<(), rocket::Error> {
    let config = Config {
        address: "${this.config.host || '127.0.0.1'}".parse().unwrap(),
        port: ${this.config.port || 8000},
        workers: ${this.config.workers || 4},
        keep_alive: ${this.config.keepAlive || 5},
        log_level: rocket::config::LogLevel::${(this.config.logLevel || 'normal').charAt(0).toUpperCase() + (this.config.logLevel || 'normal').slice(1)},
        ${this.config.secretKey ? `secret_key: "${this.config.secretKey}".into(),` : ''}
        ..Config::default()
    };

    let _rocket = rocket::custom(config)
        ${this.fairings.toRocketAttach()}
        ${stateManage}
        ${routeMounts}
        ${catcherRegisters}
        .launch()
        .await?;

    Ok(())
}
`.trim();
  }

  /**
   * Get configuration
   */
  getConfig(): RocketServerConfig {
    return this.config;
  }
}

// ============================================================================
// Types
// ============================================================================

/**
 * Route definition
 */
export interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  path: string;
  handler: RouteHandler;
  name?: string;
  rank?: number;
  format?: string;
}

/**
 * Route handler type
 */
export type RouteHandler = (ctx: RouteContext) => Promise<RouteResponse> | RouteResponse;

/**
 * Route context
 */
export interface RouteContext {
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  body?: unknown;
  state: Map<string, unknown>;
}

/**
 * Route response
 */
export interface RouteResponse {
  status?: number;
  headers?: Record<string, string>;
  body: string | Uint8Array | ReadableStream<Uint8Array>;
}

/**
 * Catcher definition
 */
export interface CatcherDefinition {
  status?: number;
  handler: CatcherHandler;
  base?: string;
}

/**
 * Catcher handler type
 */
export type CatcherHandler = (status: number, request: CatcherRequest) => Promise<RouteResponse> | RouteResponse;

/**
 * Catcher request
 */
export interface CatcherRequest {
  uri: string;
  method: string;
  headers: Record<string, string>;
}

/**
 * Server build result
 */
export interface RocketServerBuild {
  config: RocketServerConfig;
  fairings: unknown[];
  routes: RouteDefinition[];
  catchers: CatcherDefinition[];
  state: Map<string, unknown>;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new Rocket server
 */
export function createRocketServer(config?: RocketServerConfig): RocketServer {
  return new RocketServer(config);
}

/**
 * Create a development server
 */
export function createDevServer(port: number = 8000): RocketServer {
  return new RocketServer({
    host: '127.0.0.1',
    port,
    logLevel: 'debug',
    philjs: {
      ssr: { enabled: true, streaming: false, hydration: true },
      liveview: { enabled: true },
    },
  });
}

/**
 * Create a production server
 */
export function createProdServer(config: RocketServerConfig): RocketServer {
  const liveviewConfig: RocketLiveViewConfig = { enabled: true };
  if (config.philjs?.liveview?.enabled !== undefined) {
    liveviewConfig.enabled = config.philjs.liveview.enabled;
  }
  return new RocketServer({
    host: '0.0.0.0',
    workers: config.workers || 8,
    logLevel: 'normal',
    ...config,
    philjs: {
      ssr: { enabled: true, streaming: true, hydration: true, cacheEnabled: true },
      liveview: liveviewConfig,
      security: { enabled: true },
      ...config.philjs,
    },
  });
}
