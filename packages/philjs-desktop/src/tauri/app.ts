/**
 * Desktop App Creation
 */

import type { DesktopAppOptions, TauriConfig, TauriPlugin } from './types.js';
import { initTauriContext, isTauri } from './context.js';
import { listen, TauriEvents } from './events.js';

// App state
let appInitialized = false;
const loadedPlugins: TauriPlugin[] = [];

/**
 * Create a PhilJS desktop application
 * @param options - App creation options
 */
export async function createDesktopApp<Props = Record<string, unknown>>(
  options: DesktopAppOptions<Props>
): Promise<void> {
  const {
    component,
    props = {} as Props,
    containerId = 'app',
    config = {} as TauriConfig,
    plugins = [],
    onError,
    onReady,
  } = options;

  try {
    // Initialize Tauri context
    await initTauriContext();

    // Load plugins
    for (const plugin of plugins) {
      await loadPlugin(plugin);
    }

    // Set up error handling
    if (onError) {
      window.addEventListener('error', (event) => {
        onError(event.error);
      });
      window.addEventListener('unhandledrejection', (event) => {
        onError(event.reason);
      });
    }

    // Set up window close handler
    if (isTauri()) {
      await listen(TauriEvents.WINDOW_CLOSE_REQUESTED, async () => {
        // Allow cleanup before closing
        const shouldClose = await beforeClose();
        if (shouldClose) {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          await getCurrentWindow().destroy();
        }
      });
    }

    // Find or create container
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }

    // Render the component
    const rendered = component();
    if (typeof rendered === 'string') {
      container.innerHTML = rendered;
    } else if (rendered instanceof Node) {
      container.appendChild(rendered);
    }

    appInitialized = true;

    // Call ready callback
    onReady?.();

    console.log(`[PhilJS Desktop] App "${config.appName || 'App'}" initialized`);
  } catch (error) {
    console.error('[PhilJS Desktop] Failed to initialize app:', error);
    onError?.(error as Error);
    throw error;
  }
}

/**
 * Load a plugin
 */
async function loadPlugin(plugin: TauriPlugin): Promise<void> {
  if (loadedPlugins.some(p => p.name === plugin.name)) {
    console.warn(`[PhilJS Desktop] Plugin "${plugin.name}" already loaded`);
    return;
  }

  try {
    // Initialize plugin
    await plugin.init?.();

    // Set up event listeners
    if (plugin.events) {
      for (const [event, callback] of Object.entries(plugin.events)) {
        await listen(event, callback);
      }
    }

    loadedPlugins.push(plugin);
    console.log(`[PhilJS Desktop] Plugin "${plugin.name}" loaded`);
  } catch (error) {
    console.error(`[PhilJS Desktop] Failed to load plugin "${plugin.name}":`, error);
    throw error;
  }
}

// Before close handlers
const beforeCloseHandlers: Array<() => boolean | Promise<boolean>> = [];

/**
 * Register a before close handler
 */
export function onBeforeClose(handler: () => boolean | Promise<boolean>): () => void {
  beforeCloseHandlers.push(handler);
  return () => {
    const index = beforeCloseHandlers.indexOf(handler);
    if (index > -1) {
      beforeCloseHandlers.splice(index, 1);
    }
  };
}

/**
 * Run before close handlers
 */
async function beforeClose(): Promise<boolean> {
  for (const handler of beforeCloseHandlers) {
    const result = await handler();
    if (!result) return false;
  }
  return true;
}

/**
 * Check if app is initialized
 */
export function isAppInitialized(): boolean {
  return appInitialized;
}

/**
 * Get loaded plugins
 */
export function getLoadedPlugins(): TauriPlugin[] {
  return [...loadedPlugins];
}

/**
 * Create default Tauri configuration
 */
export function createDefaultConfig(overrides: Partial<TauriConfig> = {}): TauriConfig {
  return {
    appName: 'PhilJS App',
    version: '1.0.0',
    window: {
      title: overrides.appName || 'PhilJS App',
      width: 1024,
      height: 768,
      minWidth: 400,
      minHeight: 300,
      resizable: true,
      decorations: true,
      transparent: false,
      alwaysOnTop: false,
      center: true,
      fullscreen: false,
      focus: true,
      visible: true,
    },
    devTools: process.env['NODE_ENV'] === 'development',
    ...overrides,
  };
}

/**
 * Get app version
 */
export async function getAppVersion(): Promise<string> {
  if (!isTauri()) return '0.0.0';

  try {
    const { getVersion } = await import('@tauri-apps/api/app');
    return getVersion();
  } catch {
    return '0.0.0';
  }
}

/**
 * Get app name
 */
export async function getAppName(): Promise<string> {
  if (!isTauri()) return 'Unknown';

  try {
    const { getName } = await import('@tauri-apps/api/app');
    return getName();
  } catch {
    return 'Unknown';
  }
}

/**
 * Get Tauri version
 */
export async function getTauriVersion(): Promise<string> {
  if (!isTauri()) return '0.0.0';

  try {
    const { getTauriVersion: getVersion } = await import('@tauri-apps/api/app');
    return getVersion();
  } catch {
    return '0.0.0';
  }
}
