/**
 * PhilJS Rocket Fairing
 *
 * Rocket fairings for PhilJS integration.
 * Fairings are Rocket's middleware equivalent, providing hooks into
 * the request/response lifecycle.
 */

import type {
  FairingContext,
  FairingResponse,
  FairingHooks,
  RocketConfig,
} from './types';

// ============================================================================
// Base Fairing
// ============================================================================

/**
 * Base fairing class for PhilJS Rocket integration
 */
export abstract class PhilJsFairing {
  /** Fairing name */
  abstract readonly name: string;

  /** Called on rocket ignite */
  onIgnite?(): void | Promise<void>;

  /** Called on rocket liftoff */
  onLiftoff?(): void | Promise<void>;

  /** Called on request */
  onRequest?(ctx: FairingContext): FairingResponse | void | Promise<FairingResponse | void>;

  /** Called on response */
  onResponse?(ctx: FairingContext, status: number): FairingResponse | void | Promise<FairingResponse | void>;

  /** Called on shutdown */
  onShutdown?(): void | Promise<void>;

  /**
   * Generate Rust trait implementation
   */
  abstract toRustCode(): string;
}

// ============================================================================
// PhilJS SSR Fairing
// ============================================================================

/**
 * Configuration for SSR fairing
 */
export interface SSRFairingConfig {
  /** Enable streaming SSR */
  streaming?: boolean;
  /** Inject hydration scripts */
  hydration?: boolean;
  /** Base template path */
  templatePath?: string;
  /** Default document title */
  defaultTitle?: string;
  /** Static assets path */
  staticPath?: string;
}

/**
 * SSR Fairing for server-side rendering
 */
export class SSRFairing extends PhilJsFairing {
  readonly name = 'PhilJS SSR';
  private config: SSRFairingConfig;

  constructor(config: SSRFairingConfig = {}) {
    super();
    this.config = {
      streaming: false,
      hydration: true,
      templatePath: 'templates',
      defaultTitle: 'PhilJS App',
      staticPath: 'static',
      ...config,
    };
  }

  onIgnite(): void {
    console.log(`[${this.name}] Initializing SSR fairing`);
    console.log(`[${this.name}] Streaming: ${this.config.streaming}`);
    console.log(`[${this.name}] Hydration: ${this.config.hydration}`);
  }

  onRequest(ctx: FairingContext): FairingResponse | void {
    // Add SSR context to request
    return {
      headers: {
        'X-PhilJS-SSR': 'enabled',
        'X-PhilJS-Request-Id': ctx.requestId,
      },
    };
  }

  onResponse(ctx: FairingContext, status: number): FairingResponse | void {
    // Add timing headers
    return {
      headers: {
        'X-PhilJS-SSR-Timing': `${Date.now()}`,
      },
    };
  }

  toRustCode(): string {
    return `
use rocket::{Rocket, Build, fairing::{Fairing, Info, Kind}, Request, Response, Data};
use philjs_rocket::ssr::SsrRenderer;

pub struct PhilJsSsrFairing {
    streaming: bool,
    hydration: bool,
    template_path: String,
}

impl PhilJsSsrFairing {
    pub fn new() -> Self {
        Self {
            streaming: ${this.config.streaming},
            hydration: ${this.config.hydration},
            template_path: "${this.config.templatePath}".to_string(),
        }
    }
}

#[rocket::async_trait]
impl Fairing for PhilJsSsrFairing {
    fn info(&self) -> Info {
        Info {
            name: "PhilJS SSR",
            kind: Kind::Ignite | Kind::Request | Kind::Response,
        }
    }

    async fn on_ignite(&self, rocket: Rocket<Build>) -> rocket::fairing::Result {
        tracing::info!("PhilJS SSR fairing initialized");
        Ok(rocket)
    }

    async fn on_request(&self, request: &mut Request<'_>, _data: &mut Data<'_>) {
        request.local_cache(|| SsrContext::new(
            self.streaming,
            self.hydration,
        ));
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        response.set_raw_header("X-PhilJS-SSR", "enabled");
    }
}
`.trim();
  }

  getConfig(): SSRFairingConfig {
    return this.config;
  }
}

// ============================================================================
// PhilJS LiveView Fairing
// ============================================================================

/**
 * Configuration for LiveView fairing
 */
export interface LiveViewFairingConfig {
  /** WebSocket path */
  wsPath?: string;
  /** Heartbeat interval in ms */
  heartbeatInterval?: number;
  /** Connection timeout in ms */
  timeout?: number;
  /** Maximum connections */
  maxConnections?: number;
  /** Enable compression */
  compression?: boolean;
}

/**
 * LiveView Fairing for real-time updates
 */
export class LiveViewFairing extends PhilJsFairing {
  readonly name = 'PhilJS LiveView';
  private config: LiveViewFairingConfig;

  constructor(config: LiveViewFairingConfig = {}) {
    super();
    this.config = {
      wsPath: '/live',
      heartbeatInterval: 30000,
      timeout: 60000,
      maxConnections: 10000,
      compression: true,
      ...config,
    };
  }

  onIgnite(): void {
    console.log(`[${this.name}] Initializing LiveView fairing`);
    console.log(`[${this.name}] WebSocket path: ${this.config.wsPath}`);
    console.log(`[${this.name}] Max connections: ${this.config.maxConnections}`);
  }

  onLiftoff(): void {
    console.log(`[${this.name}] LiveView WebSocket ready at ${this.config.wsPath}`);
  }

  toRustCode(): string {
    return `
use rocket::{Rocket, Build, fairing::{Fairing, Info, Kind}};
use rocket_ws::WebSocket;
use philjs_rocket::liveview::{LiveViewRegistry, LiveViewConnection};
use std::sync::Arc;
use parking_lot::RwLock;

pub struct PhilJsLiveViewFairing {
    ws_path: String,
    heartbeat_interval: u64,
    timeout: u64,
    max_connections: usize,
    compression: bool,
    registry: Arc<RwLock<LiveViewRegistry>>,
}

impl PhilJsLiveViewFairing {
    pub fn new() -> Self {
        Self {
            ws_path: "${this.config.wsPath}".to_string(),
            heartbeat_interval: ${this.config.heartbeatInterval},
            timeout: ${this.config.timeout},
            max_connections: ${this.config.maxConnections},
            compression: ${this.config.compression},
            registry: Arc::new(RwLock::new(LiveViewRegistry::new())),
        }
    }

    pub fn registry(&self) -> Arc<RwLock<LiveViewRegistry>> {
        self.registry.clone()
    }
}

#[rocket::async_trait]
impl Fairing for PhilJsLiveViewFairing {
    fn info(&self) -> Info {
        Info {
            name: "PhilJS LiveView",
            kind: Kind::Ignite | Kind::Liftoff | Kind::Shutdown,
        }
    }

    async fn on_ignite(&self, rocket: Rocket<Build>) -> rocket::fairing::Result {
        tracing::info!("PhilJS LiveView fairing initialized");
        Ok(rocket.manage(self.registry.clone()))
    }

    async fn on_liftoff(&self, _rocket: &Rocket<rocket::Orbit>) {
        tracing::info!("PhilJS LiveView WebSocket ready at {}", self.ws_path);
    }

    async fn on_shutdown(&self, _rocket: &Rocket<rocket::Orbit>) {
        tracing::info!("PhilJS LiveView shutting down");
        self.registry.write().shutdown_all().await;
    }
}
`.trim();
  }

  getConfig(): LiveViewFairingConfig {
    return this.config;
  }
}

// ============================================================================
// PhilJS State Fairing
// ============================================================================

/**
 * Configuration for state fairing
 */
export interface StateFairingConfig {
  /** Initial state */
  initialState?: Record<string, unknown>;
  /** State persistence */
  persist?: boolean;
  /** Persistence path */
  persistPath?: string;
}

/**
 * State Fairing for application state management
 */
export class StateFairing extends PhilJsFairing {
  readonly name = 'PhilJS State';
  private config: StateFairingConfig;

  constructor(config: StateFairingConfig = {}) {
    super();
    this.config = {
      initialState: {},
      persist: false,
      persistPath: './state.json',
      ...config,
    };
  }

  onIgnite(): void {
    console.log(`[${this.name}] Initializing state fairing`);
  }

  onShutdown(): void {
    if (this.config.persist) {
      console.log(`[${this.name}] Persisting state to ${this.config.persistPath}`);
    }
  }

  toRustCode(): string {
    return `
use rocket::{Rocket, Build, fairing::{Fairing, Info, Kind}};
use std::sync::Arc;
use parking_lot::RwLock;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    data: serde_json::Value,
}

pub struct PhilJsStateFairing {
    initial_state: serde_json::Value,
    persist: bool,
    persist_path: String,
    state: Arc<RwLock<AppState>>,
}

impl PhilJsStateFairing {
    pub fn new() -> Self {
        let initial = serde_json::json!(${JSON.stringify(this.config.initialState)});
        Self {
            initial_state: initial.clone(),
            persist: ${this.config.persist},
            persist_path: "${this.config.persistPath}".to_string(),
            state: Arc::new(RwLock::new(AppState { data: initial })),
        }
    }

    pub fn state(&self) -> Arc<RwLock<AppState>> {
        self.state.clone()
    }
}

#[rocket::async_trait]
impl Fairing for PhilJsStateFairing {
    fn info(&self) -> Info {
        Info {
            name: "PhilJS State",
            kind: Kind::Ignite | Kind::Shutdown,
        }
    }

    async fn on_ignite(&self, rocket: Rocket<Build>) -> rocket::fairing::Result {
        tracing::info!("PhilJS State fairing initialized");
        Ok(rocket.manage(self.state.clone()))
    }

    async fn on_shutdown(&self, _rocket: &Rocket<rocket::Orbit>) {
        if self.persist {
            tracing::info!("Persisting state to {}", self.persist_path);
            if let Ok(json) = serde_json::to_string_pretty(&self.state.read().data) {
                let _ = std::fs::write(&self.persist_path, json);
            }
        }
    }
}
`.trim();
  }

  getConfig(): StateFairingConfig {
    return this.config;
  }
}

// ============================================================================
// PhilJS Metrics Fairing
// ============================================================================

/**
 * Configuration for metrics fairing
 */
export interface MetricsFairingConfig {
  /** Enable metrics collection */
  enabled?: boolean;
  /** Metrics endpoint path */
  path?: string;
  /** Include request timing */
  timing?: boolean;
  /** Include memory stats */
  memory?: boolean;
  /** Custom labels */
  labels?: Record<string, string>;
}

/**
 * Metrics Fairing for observability
 */
export class MetricsFairing extends PhilJsFairing {
  readonly name = 'PhilJS Metrics';
  private config: MetricsFairingConfig;

  constructor(config: MetricsFairingConfig = {}) {
    super();
    this.config = {
      enabled: true,
      path: '/metrics',
      timing: true,
      memory: true,
      labels: {},
      ...config,
    };
  }

  onIgnite(): void {
    console.log(`[${this.name}] Initializing metrics fairing`);
    console.log(`[${this.name}] Metrics endpoint: ${this.config.path}`);
  }

  onRequest(ctx: FairingContext): void {
    // Record request start time
  }

  onResponse(ctx: FairingContext, status: number): void {
    // Record request duration and status
  }

  toRustCode(): string {
    return `
use rocket::{Rocket, Build, fairing::{Fairing, Info, Kind}, Request, Response, Data};
use std::time::Instant;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

pub struct PhilJsMetricsFairing {
    path: String,
    timing: bool,
    memory: bool,
    request_count: Arc<AtomicU64>,
    total_duration_ms: Arc<AtomicU64>,
}

impl PhilJsMetricsFairing {
    pub fn new() -> Self {
        Self {
            path: "${this.config.path}".to_string(),
            timing: ${this.config.timing},
            memory: ${this.config.memory},
            request_count: Arc::new(AtomicU64::new(0)),
            total_duration_ms: Arc::new(AtomicU64::new(0)),
        }
    }

    pub fn get_metrics(&self) -> String {
        let count = self.request_count.load(Ordering::Relaxed);
        let total_ms = self.total_duration_ms.load(Ordering::Relaxed);
        let avg_ms = if count > 0 { total_ms / count } else { 0 };

        format!(
            "# HELP philjs_requests_total Total number of requests\\n\\
             # TYPE philjs_requests_total counter\\n\\
             philjs_requests_total {}\\n\\
             # HELP philjs_request_duration_avg_ms Average request duration\\n\\
             # TYPE philjs_request_duration_avg_ms gauge\\n\\
             philjs_request_duration_avg_ms {}\\n",
            count, avg_ms
        )
    }
}

#[rocket::async_trait]
impl Fairing for PhilJsMetricsFairing {
    fn info(&self) -> Info {
        Info {
            name: "PhilJS Metrics",
            kind: Kind::Ignite | Kind::Request | Kind::Response,
        }
    }

    async fn on_ignite(&self, rocket: Rocket<Build>) -> rocket::fairing::Result {
        tracing::info!("PhilJS Metrics fairing initialized at {}", self.path);
        Ok(rocket)
    }

    async fn on_request(&self, request: &mut Request<'_>, _data: &mut Data<'_>) {
        request.local_cache(|| Instant::now());
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, _response: &mut Response<'r>) {
        let start: &Instant = request.local_cache(|| Instant::now());
        let duration = start.elapsed();

        self.request_count.fetch_add(1, Ordering::Relaxed);
        self.total_duration_ms.fetch_add(
            duration.as_millis() as u64,
            Ordering::Relaxed
        );
    }
}
`.trim();
  }

  getConfig(): MetricsFairingConfig {
    return this.config;
  }
}

// ============================================================================
// Custom Fairing Builder
// ============================================================================

/**
 * Build a custom fairing from hooks
 */
export function createFairing(name: string, hooks: FairingHooks): CustomFairing {
  return new CustomFairing(name, hooks);
}

/**
 * Custom Fairing class
 */
export class CustomFairing extends PhilJsFairing {
  readonly name: string;
  private hooks: FairingHooks;

  constructor(name: string, hooks: FairingHooks) {
    super();
    this.name = name;
    this.hooks = hooks;

    // Bind hooks to methods
    if (hooks.onIgnite) this.onIgnite = hooks.onIgnite;
    if (hooks.onLiftoff) this.onLiftoff = hooks.onLiftoff;
    if (hooks.onRequest) this.onRequest = hooks.onRequest;
    if (hooks.onResponse) this.onResponse = hooks.onResponse;
    if (hooks.onShutdown) this.onShutdown = hooks.onShutdown;
  }

  toRustCode(): string {
    const kinds: string[] = [];
    if (this.hooks.onIgnite) kinds.push('Kind::Ignite');
    if (this.hooks.onLiftoff) kinds.push('Kind::Liftoff');
    if (this.hooks.onRequest) kinds.push('Kind::Request');
    if (this.hooks.onResponse) kinds.push('Kind::Response');
    if (this.hooks.onShutdown) kinds.push('Kind::Shutdown');

    return `
use rocket::{Rocket, Build, fairing::{Fairing, Info, Kind}, Request, Response, Data};

pub struct ${this.name.replace(/\s+/g, '')}Fairing;

#[rocket::async_trait]
impl Fairing for ${this.name.replace(/\s+/g, '')}Fairing {
    fn info(&self) -> Info {
        Info {
            name: "${this.name}",
            kind: ${kinds.join(' | ') || 'Kind::Ignite'},
        }
    }

    // Implement hooks as needed...
}
`.trim();
  }
}

// ============================================================================
// Fairing Composer
// ============================================================================

/**
 * Compose multiple fairings together
 */
export class FairingComposer {
  private fairings: PhilJsFairing[] = [];

  /**
   * Add a fairing
   */
  use(fairing: PhilJsFairing): this {
    this.fairings.push(fairing);
    return this;
  }

  /**
   * Add SSR fairing
   */
  withSSR(config?: SSRFairingConfig): this {
    return this.use(new SSRFairing(config));
  }

  /**
   * Add LiveView fairing
   */
  withLiveView(config?: LiveViewFairingConfig): this {
    return this.use(new LiveViewFairing(config));
  }

  /**
   * Add State fairing
   */
  withState(config?: StateFairingConfig): this {
    return this.use(new StateFairing(config));
  }

  /**
   * Add Metrics fairing
   */
  withMetrics(config?: MetricsFairingConfig): this {
    return this.use(new MetricsFairing(config));
  }

  /**
   * Get all fairings
   */
  getFairings(): PhilJsFairing[] {
    return this.fairings;
  }

  /**
   * Generate Rust code for all fairings
   */
  toRustCode(): string {
    return this.fairings.map(f => f.toRustCode()).join('\n\n');
  }

  /**
   * Generate Rocket attach code
   */
  toRocketAttach(): string {
    const attaches = this.fairings
      .map(f => `.attach(${f.name.replace(/\s+/g, '')}Fairing::new())`)
      .join('\n        ');

    return `
fn rocket() -> Rocket<Build> {
    rocket::build()
        ${attaches}
}
`.trim();
  }
}

/**
 * Create a new fairing composer
 */
export function composeFairings(): FairingComposer {
  return new FairingComposer();
}
