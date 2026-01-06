/**
 * Vue Plugin for PhilJS Integration
 *
 * This plugin provides global registration of PhilJS features in Vue applications,
 * including devtools integration and global composable access.
 *
 * @example
 * ```ts
 * import { createApp } from 'vue';
 * import { PhilJSPlugin } from '@philjs/universal-vue';
 * import App from './App.vue';
 *
 * const app = createApp(App);
 *
 * app.use(PhilJSPlugin, {
 *   devtools: true,
 * });
 *
 * app.mount('#app');
 * ```
 */

import { inject, type App, type Plugin, type InjectionKey } from 'vue';
import type { SignalBridge, PhilJSPluginOptions, PhilJSVueContext } from './types.js';
import { UNIVERSAL_CONTEXT_KEY } from './composables/use-universal-context.js';

/**
 * Default injection key for PhilJS context
 */
export const PHILJS_INJECTION_KEY: InjectionKey<PhilJSVueContext> = Symbol('philjs');

/**
 * PhilJS Vue Plugin
 *
 * Provides global integration of PhilJS features in Vue applications:
 * - Global context bridge access
 * - Component registry access
 * - Devtools integration (in development)
 *
 * @example
 * ```ts
 * import { createApp } from 'vue';
 * import { PhilJSPlugin } from '@philjs/universal-vue';
 *
 * createApp(App)
 *   .use(PhilJSPlugin)
 *   .mount('#app');
 * ```
 */
export const PhilJSPlugin: Plugin<PhilJSPluginOptions> = {
  install(app: App, options: PhilJSPluginOptions = {}) {
    const {
      installComposables = true,
      contextKey = PHILJS_INJECTION_KEY,
      devtools = typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'development',
    } = options;

    // Create the PhilJS context
    const philjsContext: PhilJSVueContext = {
      contexts: new Map<string, SignalBridge<unknown>>(),

      registerContext<T>(id: string, bridge: SignalBridge<T>) {
        this.contexts.set(id, bridge as SignalBridge<unknown>);
      },

      getContext<T>(id: string): SignalBridge<T> | undefined {
        return this.contexts.get(id) as SignalBridge<T> | undefined;
      },

      hasContext(id: string): boolean {
        return this.contexts.has(id);
      },
    };

    // Provide the context globally
    app.provide(contextKey, philjsContext);

    // Also provide the Universal context map
    app.provide(UNIVERSAL_CONTEXT_KEY, new Map());

    // Add global properties for easy access
    if (installComposables) {
      app.config.globalProperties.$philjs = philjsContext;

      // Add global methods
      app.config.globalProperties.$getUniversalContext = <T>(id: string): T | undefined => {
        const bridge = philjsContext.getContext<T>(id);
        return bridge?.get();
      };
    }

    // Set up devtools integration
    if (devtools && typeof window !== 'undefined') {
      setupDevtools(app, philjsContext);
    }

    // Configure Vue to recognize philjs-* custom elements
    if (app.config.compilerOptions) {
      const originalIsCustomElement = app.config.compilerOptions.isCustomElement;
      app.config.compilerOptions.isCustomElement = (tag: string) => {
        if (tag.startsWith('philjs-') || tag.startsWith('universal-')) {
          return true;
        }
        return originalIsCustomElement?.(tag) ?? false;
      };
    }
  },
};

/**
 * Set up Vue devtools integration for PhilJS
 */
function setupDevtools(app: App, context: PhilJSVueContext): void {
  // Add devtools timeline events
  const devtoolsApi = (window as unknown as { __VUE_DEVTOOLS_GLOBAL_HOOK__?: DevtoolsHook }).__VUE_DEVTOOLS_GLOBAL_HOOK__;

  if (!devtoolsApi) {
    return;
  }

  // Register PhilJS inspector
  devtoolsApi.on?.('devtools:inspector:attach', () => {
  });

  // Expose context for devtools inspection
  (app as unknown as { __PHILJS_CONTEXT__: PhilJSVueContext }).__PHILJS_CONTEXT__ = context;
}

/**
 * Vue Devtools hook interface (simplified)
 */
interface DevtoolsHook {
  on?: (event: string, callback: () => void) => void;
  emit?: (event: string, ...args: unknown[]) => void;
}

/**
 * Composable to access the PhilJS context from within components.
 *
 * @returns The PhilJS Vue context
 *
 * @example
 * ```ts
 * import { usePhilJS } from '@philjs/universal-vue';
 *
 * const philjs = usePhilJS();
 * philjs.registerContext('myContext', myBridge);
 * ```
 */
export function usePhilJS(): PhilJSVueContext {
  const context = inject(PHILJS_INJECTION_KEY);

  if (!context) {
    throw new Error(
      '[PhilJS] usePhilJS must be used within a component that has PhilJSPlugin installed. ' +
      'Make sure you have called app.use(PhilJSPlugin) before mounting your app.'
    );
  }

  return context;
}

/**
 * Create a scoped PhilJS plugin with custom options.
 *
 * Useful for micro-frontends or when you need multiple isolated
 * PhilJS contexts in the same application.
 *
 * @param options - Plugin options
 * @returns A new plugin instance
 *
 * @example
 * ```ts
 * import { createPhilJSPlugin } from '@philjs/universal-vue';
 *
 * const myPlugin = createPhilJSPlugin({
 *   contextKey: Symbol('my-philjs'),
 *   devtools: false,
 * });
 *
 * app.use(myPlugin);
 * ```
 */
export function createPhilJSPlugin(options: PhilJSPluginOptions = {}): Plugin {
  return {
    install(app: App) {
      PhilJSPlugin.install?.(app, options);
    },
  };
}

// Augment Vue's ComponentCustomProperties for global properties
declare module 'vue' {
  interface ComponentCustomProperties {
    $philjs: PhilJSVueContext;
    $getUniversalContext: <T>(id: string) => T | undefined;
  }
}
