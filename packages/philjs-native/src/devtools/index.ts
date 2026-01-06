/**
 * PhilJS Native - DevTools & Hot Reloading
 *
 * Development tools including hot module reloading (HMR),
 * component inspection, and debugging utilities.
 */

import { signal, effect, batch, type Signal } from '@philjs/core';
import { detectPlatform, nativeBridge, platformInfo } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Hot reload status
 */
export type HotReloadStatus = 'idle' | 'checking' | 'updating' | 'error' | 'applied';

/**
 * Module update info
 */
export interface ModuleUpdate {
  id: string;
  path: string;
  timestamp: number;
  accepted: boolean;
}

/**
 * HMR runtime config
 */
export interface HMRConfig {
  /** WebSocket URL for dev server */
  wsUrl?: string;
  /** Reconnect interval in ms */
  reconnectInterval?: number;
  /** Maximum reconnection attempts */
  maxRetries?: number;
  /** Whether to show overlay on errors */
  showErrorOverlay?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Custom update handler */
  onUpdate?: (modules: ModuleUpdate[]) => void;
}

/**
 * Development menu options
 */
export interface DevMenuOptions {
  enabled?: boolean;
  items?: DevMenuItem[];
}

/**
 * Development menu item
 */
export interface DevMenuItem {
  title: string;
  handler: () => void;
  icon?: string;
}

/**
 * Performance profile entry
 */
export interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  type: 'measure' | 'navigation' | 'resource' | 'paint' | 'custom';
  metadata?: Record<string, any>;
}

// ============================================================================
// State
// ============================================================================

/**
 * Hot reload status signal
 */
export const hotReloadStatus: Signal<HotReloadStatus> = signal<HotReloadStatus>('idle');

/**
 * Last updated modules
 */
export const lastUpdatedModules: Signal<ModuleUpdate[]> = signal<ModuleUpdate[]>([]);

/**
 * Dev mode enabled
 */
export const devModeEnabled: Signal<boolean> = signal(
  typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production'
);

/**
 * Performance entries
 */
export const performanceEntries: Signal<PerformanceEntry[]> = signal<PerformanceEntry[]>([]);

// ============================================================================
// Hot Module Reloading
// ============================================================================

let hmrSocket: WebSocket | null = null;
let hmrConfig: HMRConfig = {};
let reconnectAttempts = 0;
let reconnectTimer: any = null;

/**
 * Initialize HMR
 */
export function initHMR(config: HMRConfig = {}): () => void {
  hmrConfig = {
    wsUrl: config.wsUrl || 'ws://localhost:8081/hot',
    reconnectInterval: config.reconnectInterval || 3000,
    maxRetries: config.maxRetries || 10,
    showErrorOverlay: config.showErrorOverlay ?? true,
    ...config,
  };

  if (!devModeEnabled()) {
    return () => {};
  }

  connect();

  return () => {
    disconnect();
  };
}

/**
 * Connect to HMR server
 */
function connect(): void {
  if (hmrSocket?.readyState === WebSocket.OPEN) {
    return;
  }

  hotReloadStatus.set('checking');

  try {
    hmrSocket = new WebSocket(hmrConfig.wsUrl!);

    hmrSocket.onopen = () => {
      hotReloadStatus.set('idle');
      reconnectAttempts = 0;
    };

    hmrSocket.onmessage = (event) => {
      handleMessage(event.data);
    };

    hmrSocket.onerror = (error) => {
      console.error('[HMR] WebSocket error:', error);
      hotReloadStatus.set('error');
      hmrConfig.onError?.(new Error('HMR WebSocket error'));
    };

    hmrSocket.onclose = () => {
      console.log('[HMR] Disconnected from dev server');
      hotReloadStatus.set('idle');
      scheduleReconnect();
    };
  } catch (error) {
    console.error('[HMR] Failed to connect:', error);
    hotReloadStatus.set('error');
    scheduleReconnect();
  }
}

/**
 * Disconnect from HMR server
 */
function disconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (hmrSocket) {
    hmrSocket.close();
    hmrSocket = null;
  }
}

/**
 * Schedule reconnection
 */
function scheduleReconnect(): void {
  if (reconnectAttempts >= (hmrConfig.maxRetries || 10)) {
    console.log('[HMR] Max reconnection attempts reached');
    return;
  }

  reconnectAttempts++;
  reconnectTimer = setTimeout(connect, hmrConfig.reconnectInterval);
}

/**
 * Handle HMR message
 */
function handleMessage(data: string): void {
  try {
    const message = JSON.parse(data);

    switch (message.type) {
      case 'hash':
        break;

      case 'still-ok':
      case 'ok':
        hotReloadStatus.set('idle');
        break;

      case 'content-changed':
        // Full reload needed
        console.log('[HMR] Content changed, reloading...');
        performFullReload();
        break;

      case 'update':
        handleUpdate(message.modules);
        break;

      case 'errors':
        handleErrors(message.errors);
        break;

      case 'warnings':
        handleWarnings(message.warnings);
        break;
    }
  } catch (error) {
    console.error('[HMR] Failed to parse message:', error);
  }
}

/**
 * Handle module updates
 */
function handleUpdate(modules: ModuleUpdate[]): void {
  hotReloadStatus.set('updating');

  console.log('[HMR] Updating modules:', modules.map(m => m.path).join(', '));

  batch(() => {
    lastUpdatedModules.set(modules);
  });

  // Apply updates
  let allAccepted = true;

  for (const module of modules) {
    if (!applyModuleUpdate(module)) {
      allAccepted = false;
      break;
    }
  }

  if (allAccepted) {
    hotReloadStatus.set('applied');
    hmrConfig.onUpdate?.(modules);

    // Reset status after a delay
    setTimeout(() => {
      if (hotReloadStatus() === 'applied') {
        hotReloadStatus.set('idle');
      }
    }, 2000);
  } else {
    console.log('[HMR] Some modules could not be hot-updated, performing full reload');
    performFullReload();
  }
}

/**
 * Apply a single module update
 */
function applyModuleUpdate(module: ModuleUpdate): boolean {
  // In a real implementation, this would use the bundler's HMR API
  // For now, we'll simulate acceptance
  console.log(`[HMR] Applying update for ${module.path}`);
  return module.accepted;
}

/**
 * Handle HMR errors
 */
function handleErrors(errors: string[]): void {
  hotReloadStatus.set('error');

  console.error('[HMR] Build errors:', errors);

  if (hmrConfig.showErrorOverlay) {
    showErrorOverlay(errors);
  }

  hmrConfig.onError?.(new Error(errors.join('\n')));
}

/**
 * Handle HMR warnings
 */
function handleWarnings(warnings: string[]): void {
  console.warn('[HMR] Build warnings:', warnings);
}

/**
 * Perform full reload
 */
function performFullReload(): void {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

/**
 * Show error overlay
 */
function showErrorOverlay(errors: string[]): void {
  if (typeof document === 'undefined') return;

  // Remove existing overlay
  hideErrorOverlay();

  const overlay = document.createElement('div');
  overlay.id = 'philjs-error-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    color: #ff5555;
    padding: 20px;
    font-family: monospace;
    font-size: 14px;
    z-index: 99999;
    overflow: auto;
  `;

  const content = document.createElement('div');
  content.innerHTML = `
    <h1 style="color: #ff5555; margin-bottom: 20px;">Build Error</h1>
    <pre style="white-space: pre-wrap; word-wrap: break-word;">${errors.join('\n\n')}</pre>
    <button onclick="document.getElementById('philjs-error-overlay').remove()"
            style="position: fixed; top: 10px; right: 10px; background: #333; color: white;
                   border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px;">
      Close
    </button>
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);
}

/**
 * Hide error overlay
 */
export function hideErrorOverlay(): void {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('philjs-error-overlay');
  if (existing) {
    existing.remove();
  }
}

// ============================================================================
// Development Menu
// ============================================================================

let devMenuItems: DevMenuItem[] = [];

/**
 * Register dev menu item
 */
export function registerDevMenuItem(item: DevMenuItem): () => void {
  devMenuItems.push(item);

  return () => {
    devMenuItems = devMenuItems.filter(i => i !== item);
  };
}

/**
 * Show development menu
 */
export function showDevMenu(): void {
  const platform = detectPlatform();

  if (platform !== 'web') {
    nativeBridge.call('DevMenu', 'show', {
      items: devMenuItems.map(i => ({ title: i.title })),
    });
    return;
  }

  // Web implementation
  showWebDevMenu();
}

/**
 * Hide development menu
 */
export function hideDevMenu(): void {
  const platform = detectPlatform();

  if (platform !== 'web') {
    nativeBridge.call('DevMenu', 'hide');
    return;
  }

  hideWebDevMenu();
}

/**
 * Show web dev menu
 */
function showWebDevMenu(): void {
  if (typeof document === 'undefined') return;

  hideWebDevMenu();

  const menu = document.createElement('div');
  menu.id = 'philjs-dev-menu';
  menu.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #1e1e1e;
    border-radius: 12px;
    padding: 16px;
    min-width: 280px;
    z-index: 99998;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  `;

  const defaultItems: DevMenuItem[] = [
    { title: 'Reload', handler: () => window.location.reload() },
    { title: 'Toggle Inspector', handler: toggleInspector },
    { title: 'Show Performance Monitor', handler: showPerformanceMonitor },
    { title: 'Clear Cache', handler: clearDevCache },
  ];

  const allItems = [...defaultItems, ...devMenuItems];

  menu.innerHTML = `
    <h3 style="color: white; margin: 0 0 12px; font-size: 16px; font-weight: 600;">Dev Menu</h3>
    ${allItems.map((item, index) => `
      <button data-index="${index}" style="
        display: block;
        width: 100%;
        padding: 12px 16px;
        margin: 4px 0;
        background: #333;
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        text-align: left;
      ">${item.title}</button>
    `).join('')}
  `;

  menu.querySelectorAll('button').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      allItems[index]?.handler();
      hideWebDevMenu();
    });
  });

  // Click outside to close
  const backdrop = document.createElement('div');
  backdrop.id = 'philjs-dev-menu-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99997;
  `;
  backdrop.addEventListener('click', hideWebDevMenu);

  document.body.appendChild(backdrop);
  document.body.appendChild(menu);
}

/**
 * Hide web dev menu
 */
function hideWebDevMenu(): void {
  if (typeof document === 'undefined') return;

  document.getElementById('philjs-dev-menu')?.remove();
  document.getElementById('philjs-dev-menu-backdrop')?.remove();
}

// ============================================================================
// Component Inspector
// ============================================================================

let inspectorEnabled = false;
let inspectorOverlay: HTMLDivElement | null = null;

/**
 * Toggle component inspector
 */
export function toggleInspector(): void {
  inspectorEnabled = !inspectorEnabled;

  if (inspectorEnabled) {
    enableInspector();
  } else {
    disableInspector();
  }
}

/**
 * Enable inspector
 */
function enableInspector(): void {
  if (typeof document === 'undefined') return;

  inspectorOverlay = document.createElement('div');
  inspectorOverlay.id = 'philjs-inspector-overlay';
  inspectorOverlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 99996;
    border: 2px solid #007AFF;
    background: rgba(0, 122, 255, 0.1);
    transition: all 0.1s ease;
  `;

  document.body.appendChild(inspectorOverlay);

  document.addEventListener('mousemove', handleInspectorMouseMove);
  document.addEventListener('click', handleInspectorClick, true);

}

/**
 * Disable inspector
 */
function disableInspector(): void {
  if (typeof document === 'undefined') return;

  document.removeEventListener('mousemove', handleInspectorMouseMove);
  document.removeEventListener('click', handleInspectorClick, true);

  inspectorOverlay?.remove();
  inspectorOverlay = null;

}

/**
 * Handle inspector mouse move
 */
function handleInspectorMouseMove(event: MouseEvent): void {
  if (!inspectorOverlay) return;

  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (!element) return;

  const rect = element.getBoundingClientRect();

  inspectorOverlay.style.top = `${rect.top}px`;
  inspectorOverlay.style.left = `${rect.left}px`;
  inspectorOverlay.style.width = `${rect.width}px`;
  inspectorOverlay.style.height = `${rect.height}px`;
}

/**
 * Handle inspector click
 */
function handleInspectorClick(event: MouseEvent): void {
  if (!inspectorEnabled) return;

  event.preventDefault();
  event.stopPropagation();

  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (!element) return;

  console.log('[Inspector] Selected element:', {
    tagName: element.tagName,
    id: element.id,
    className: element.className,
    computedStyle: getComputedStyle(element),
  });

  toggleInspector();
}

// ============================================================================
// Performance Monitoring
// ============================================================================

let performanceMonitorVisible = false;
let performanceMonitorInterval: any = null;

/**
 * Show performance monitor
 */
export function showPerformanceMonitor(): void {
  if (typeof document === 'undefined') return;

  if (performanceMonitorVisible) {
    hidePerformanceMonitor();
    return;
  }

  performanceMonitorVisible = true;

  const monitor = document.createElement('div');
  monitor.id = 'philjs-perf-monitor';
  monitor.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: #0f0;
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    border-radius: 8px;
    z-index: 99995;
    min-width: 150px;
  `;

  document.body.appendChild(monitor);

  let frameCount = 0;
  let lastTime = performance.now();

  performanceMonitorInterval = setInterval(() => {
    const now = performance.now();
    const fps = Math.round(frameCount * 1000 / (now - lastTime));
    frameCount = 0;
    lastTime = now;

    const memory = (performance as any).memory;
    const memoryUsage = memory
      ? `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB`
      : 'N/A';

    monitor.innerHTML = `
      <div>FPS: ${fps}</div>
      <div>Memory: ${memoryUsage}</div>
      <div>Platform: ${detectPlatform()}</div>
    `;
  }, 1000);

  const countFrame = () => {
    if (performanceMonitorVisible) {
      frameCount++;
      requestAnimationFrame(countFrame);
    }
  };

  requestAnimationFrame(countFrame);
}

/**
 * Hide performance monitor
 */
export function hidePerformanceMonitor(): void {
  performanceMonitorVisible = false;

  if (performanceMonitorInterval) {
    clearInterval(performanceMonitorInterval);
    performanceMonitorInterval = null;
  }

  document.getElementById('philjs-perf-monitor')?.remove();
}

// ============================================================================
// Cache & Storage
// ============================================================================

/**
 * Clear development cache
 */
export async function clearDevCache(): Promise<void> {
  if (typeof caches !== 'undefined') {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }

}

// ============================================================================
// Logging Utilities
// ============================================================================

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log with styling
 */
export function log(level: LogLevel, module: string, message: string, ...args: any[]): void {
  if (!devModeEnabled()) return;

  const colors: Record<LogLevel, string> = {
    debug: '#888',
    info: '#007AFF',
    warn: '#FF9500',
    error: '#FF3B30',
  };

  const style = `color: ${colors[level]}; font-weight: bold;`;

  console[level](
    `%c[${module}]`,
    style,
    message,
    ...args
  );
}

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

/**
 * Set up dev keyboard shortcuts
 */
export function setupDevKeyboardShortcuts(): () => void {
  if (typeof document === 'undefined') return () => {};

  const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl/Cmd + D: Toggle dev menu
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      showDevMenu();
    }

    // Ctrl/Cmd + I: Toggle inspector
    if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
      event.preventDefault();
      toggleInspector();
    }

    // Ctrl/Cmd + P: Toggle performance monitor
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
      event.preventDefault();
      showPerformanceMonitor();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

// ============================================================================
// Exports
// ============================================================================

export const DevTools = {
  // HMR
  initHMR,
  hotReloadStatus,
  lastUpdatedModules,
  hideErrorOverlay,

  // Dev Menu
  registerDevMenuItem,
  showDevMenu,
  hideDevMenu,

  // Inspector
  toggleInspector,

  // Performance
  showPerformanceMonitor,
  hidePerformanceMonitor,

  // Cache
  clearDevCache,

  // Logging
  log,

  // Keyboard
  setupDevKeyboardShortcuts,

  // State
  devModeEnabled,
};

export default DevTools;
