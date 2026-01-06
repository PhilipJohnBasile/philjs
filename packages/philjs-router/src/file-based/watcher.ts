/**
 * File watcher for hot reload support in development.
 * Watches for route file changes and triggers route regeneration.
 */

import { watch, type FSWatcher, type WatchEventType } from "node:fs";
import { join, relative, dirname } from "node:path";
import { EventEmitter } from "node:events";
import {
  scanDirectory,
  isRouteFileChange,
  getAffectedRoutes,
  type ScanResult,
  type ScannedFile,
  type RouteNode,
  type ScannerConfig,
} from "./scanner.js";
import {
  generateFromScanResult,
  type RouteManifest,
  type GeneratorConfig,
} from "./generator.js";
import { shouldIgnoreFile, isRouteFile } from "./conventions.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Watcher configuration.
 */
export type WatcherConfig = GeneratorConfig & {
  /** Debounce delay in milliseconds */
  debounce?: number;
  /** Whether to log changes */
  verbose?: boolean;
  /** Custom file change handler */
  onFileChange?: (event: FileChangeEvent) => void;
  /** Custom route update handler */
  onRoutesUpdate?: (manifest: RouteManifest) => void;
  /** Custom error handler */
  onError?: (error: Error) => void;
};

/**
 * File change event.
 */
export type FileChangeEvent = {
  /** Type of change */
  type: "add" | "change" | "unlink";
  /** File path that changed */
  filePath: string;
  /** Relative path from routes directory */
  relativePath: string;
  /** Whether this affects routes */
  affectsRoutes: boolean;
  /** Affected route IDs */
  affectedRouteIds: string[];
  /** Timestamp */
  timestamp: number;
};

/**
 * Watcher state.
 */
export type WatcherState = {
  /** Whether the watcher is running */
  running: boolean;
  /** Current scan result */
  scanResult: ScanResult | null;
  /** Current route manifest */
  manifest: RouteManifest | null;
  /** Last update timestamp */
  lastUpdate: number;
  /** Pending file changes */
  pendingChanges: Set<string>;
  /** Number of rebuilds */
  rebuildCount: number;
};

/**
 * Watcher events.
 */
export type WatcherEvents = {
  /** Emitted when routes are updated */
  update: [RouteManifest];
  /** Emitted when a file changes */
  change: [FileChangeEvent];
  /** Emitted on error */
  error: [Error];
  /** Emitted when watcher starts */
  start: [];
  /** Emitted when watcher stops */
  stop: [];
  /** Emitted during rebuild */
  rebuilding: [];
};

// ============================================================================
// RouteWatcher Implementation
// ============================================================================

/**
 * File watcher for route hot reload.
 */
export class RouteWatcher extends EventEmitter {
  private config: Required<WatcherConfig>;
  private watcher: FSWatcher | null = null;
  private state: WatcherState = {
    running: false,
    scanResult: null,
    manifest: null,
    lastUpdate: 0,
    pendingChanges: new Set(),
    rebuildCount: 0,
  };
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: WatcherConfig) {
    super();

    this.config = {
      debounce: 100,
      verbose: false,
      layouts: true,
      loading: true,
      errors: true,
      parallel: true,
      groups: true,
      lazy: true,
      generateTypes: true,
      basePath: "",
      extensions: [".tsx", ".ts", ".jsx", ".js"],
      ignore: [],
      ...config,
      onFileChange: config.onFileChange || (() => {}),
      onRoutesUpdate: config.onRoutesUpdate || (() => {}),
      onError: config.onError || ((err) => console.error(err)),
    };
  }

  /**
   * Start watching for file changes.
   */
  start(): void {
    if (this.state.running) {
      return;
    }

    this.log("Starting route watcher...");

    try {
      // Initial scan
      this.rebuild();

      // Start watching
      this.watcher = watch(
        this.config.dir,
        { recursive: true },
        this.handleFileChange.bind(this)
      );

      this.state.running = true;
      this.emit("start");
      this.log(`Watching for route changes in: ${this.config.dir}`);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Stop watching for file changes.
   */
  stop(): void {
    if (!this.state.running) {
      return;
    }

    this.log("Stopping route watcher...");

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.state.running = false;
    this.state.pendingChanges.clear();
    this.emit("stop");
  }

  /**
   * Force a rebuild of routes.
   */
  rebuild(): RouteManifest | null {
    this.log("Rebuilding routes...");
    this.emit("rebuilding");

    try {
      const scanResult = scanDirectory(this.config);
      const manifest = generateFromScanResult(scanResult, this.config);

      this.state.scanResult = scanResult;
      this.state.manifest = manifest;
      this.state.lastUpdate = Date.now();
      this.state.rebuildCount++;

      this.log(`Routes rebuilt: ${manifest.routes.length} routes found`);
      this.emit("update", manifest);
      this.config.onRoutesUpdate(manifest);

      return manifest;
    } catch (error) {
      this.handleError(error as Error);
      return null;
    }
  }

  /**
   * Get the current state.
   */
  getState(): WatcherState {
    return { ...this.state };
  }

  /**
   * Get the current manifest.
   */
  getManifest(): RouteManifest | null {
    return this.state.manifest;
  }

  /**
   * Handle file change events.
   */
  private handleFileChange(eventType: WatchEventType, filename: string | null): void {
    if (!filename) {
      return;
    }

    const filePath = join(this.config.dir, filename);
    const relativePath = filename;

    // Check if this file affects routes
    if (!this.shouldProcessFile(filePath, relativePath)) {
      return;
    }

    // Add to pending changes
    this.state.pendingChanges.add(filePath);

    // Debounce the rebuild
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processPendingChanges();
    }, this.config.debounce);
  }

  /**
   * Check if a file should be processed.
   */
  private shouldProcessFile(absolutePath: string, relativePath: string): boolean {
    // Check if it's a route file
    if (!isRouteFile(relativePath)) {
      return false;
    }

    // Check ignore patterns
    if (shouldIgnoreFile(relativePath)) {
      return false;
    }

    // Check extension
    const ext = relativePath.slice(relativePath.lastIndexOf("."));
    if (!this.config.extensions.includes(ext)) {
      return false;
    }

    return true;
  }

  /**
   * Process pending file changes.
   */
  private processPendingChanges(): void {
    const changes = Array.from(this.state.pendingChanges);
    this.state.pendingChanges.clear();

    if (changes.length === 0) {
      return;
    }

    this.log(`Processing ${changes.length} file changes...`);

    // Emit change events
    for (const filePath of changes) {
      const relativePath = relative(this.config.dir, filePath);
      const affectedRoutes = this.state.scanResult
        ? getAffectedRoutes(filePath, this.state.scanResult.tree)
        : [];

      const event: FileChangeEvent = {
        type: "change", // We don't differentiate between add/change/unlink with fs.watch
        filePath,
        relativePath,
        affectsRoutes: affectedRoutes.length > 0 || isRouteFileChange(filePath, this.config),
        affectedRouteIds: affectedRoutes.map((r) => r.id),
        timestamp: Date.now(),
      };

      this.emit("change", event);
      this.config.onFileChange(event);
    }

    // Rebuild routes
    this.rebuild();
  }

  /**
   * Handle errors.
   */
  private handleError(error: Error): void {
    this.log(`Error: ${error.message}`, true);
    this.emit("error", error);
    this.config.onError(error);
  }

  /**
   * Log a message.
   */
  private log(message: string, isError: boolean = false): void {
    if (this.config.verbose || isError) {
      const prefix = "[PhilJS Router]";
      if (isError) {
        console.error(`${prefix} ${message}`);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create and start a route watcher.
 */
export function createWatcher(config: WatcherConfig): RouteWatcher {
  const watcher = new RouteWatcher(config);
  watcher.start();
  return watcher;
}

/**
 * Watch routes and return a cleanup function.
 */
export function watchRoutes(
  config: WatcherConfig,
  onUpdate: (manifest: RouteManifest) => void
): () => void {
  const watcher = new RouteWatcher({
    ...config,
    onRoutesUpdate: onUpdate,
  });

  watcher.start();

  return () => {
    watcher.stop();
  };
}

// ============================================================================
// Hot Module Replacement Integration
// ============================================================================

/**
 * HMR update payload.
 */
export type HMRPayload = {
  /** Type of update */
  type: "route-update" | "full-reload";
  /** Updated route IDs */
  routeIds: string[];
  /** New manifest */
  manifest?: RouteManifest;
  /** Timestamp */
  timestamp: number;
};

/**
 * Create an HMR handler for route updates.
 */
export function createHMRHandler(
  watcher: RouteWatcher,
  sendUpdate: (payload: HMRPayload) => void
): void {
  watcher.on("change", (event: FileChangeEvent) => {
    if (event.affectsRoutes) {
      sendUpdate({
        type: event.affectedRouteIds.length <= 3 ? "route-update" : "full-reload",
        routeIds: event.affectedRouteIds,
        timestamp: event.timestamp,
      });
    }
  });

  watcher.on("update", (manifest: RouteManifest) => {
    sendUpdate({
      type: "route-update",
      routeIds: manifest.routes.map((r) => r.id),
      manifest,
      timestamp: Date.now(),
    });
  });
}

/**
 * Apply an HMR update on the client side.
 */
export async function applyHMRUpdate(
  payload: HMRPayload,
  routeLoader: (routeId: string) => Promise<any>,
  onRouteUpdate: (routeId: string, module: any) => void
): Promise<void> {
  if (payload.type === "full-reload") {
    // Full page reload
    window.location.reload();
    return;
  }

  // Partial update - reload affected routes
  for (const routeId of payload.routeIds) {
    try {
      const module = await routeLoader(routeId);
      onRouteUpdate(routeId, module);
    } catch (error) {
      console.error(`[PhilJS Router] Failed to reload route: ${routeId}`, error);
    }
  }
}

// ============================================================================
// Development Server Integration
// ============================================================================

/**
 * Development server options.
 */
export type DevServerOptions = {
  /** Route watcher configuration */
  watcher: WatcherConfig;
  /** WebSocket port for HMR */
  wsPort?: number;
  /** Whether to enable HMR */
  hmr?: boolean;
};

/**
 * Create a development server handler.
 */
export function createDevHandler(options: DevServerOptions): {
  watcher: RouteWatcher;
  getRoutes: () => RouteManifest | null;
  handleRequest: (request: Request) => Response | null;
} {
  const watcher = new RouteWatcher({
    ...options.watcher,
    verbose: true,
  });

  watcher.start();

  return {
    watcher,
    getRoutes: () => watcher.getManifest(),
    handleRequest: (request: Request) => {
      const url = new URL(request.url);

      // Handle route manifest request
      if (url.pathname === "/__philjs_routes__") {
        const manifest = watcher.getManifest();
        return new Response(JSON.stringify(manifest), {
          headers: { "Content-Type": "application/json" },
        });
      }

      return null;
    },
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Invalidate module cache for a file.
 * Useful for development when modules need to be reloaded.
 */
export function invalidateModuleCache(filePath: string): boolean {
  // This is a Node.js specific operation
  if (typeof require !== "undefined" && require.cache) {
    const normalizedPath = filePath.replace(/\\/g, "/");

    for (const key of Object.keys(require.cache)) {
      if (key.replace(/\\/g, "/").includes(normalizedPath)) {
        delete require.cache[key];
        return true;
      }
    }
  }

  return false;
}

/**
 * Get the module timestamp for cache busting.
 */
export function getModuleTimestamp(filePath: string): number {
  try {
    const { statSync } = require("node:fs");
    const stat = statSync(filePath);
    return stat.mtimeMs;
  } catch {
    return Date.now();
  }
}

/**
 * Create a cache-busting import path.
 */
export function createCacheBustingImport(importPath: string, timestamp?: number): string {
  const ts = timestamp || Date.now();
  const separator = importPath.includes("?") ? "&" : "?";
  return `${importPath}${separator}t=${ts}`;
}
