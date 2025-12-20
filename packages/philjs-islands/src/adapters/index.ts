/**
 * Framework adapters for multi-framework island architecture
 */

export { reactAdapter, createReactIsland } from './react.js';
export { vueAdapter, createVueIsland } from './vue.js';
export { svelteAdapter, updateSvelteProps, getSvelteInstance, createSvelteStoreBridge } from './svelte.js';
export { preactAdapter, createPreactIsland, createPreactSignal } from './preact.js';
export { solidAdapter, createSolidIsland, createSolidStore, createSolidResource, createSolidContext } from './solid.js';

export type {
  FrameworkAdapter,
  HydrationStrategy,
  IslandProps,
  IslandMetadata,
  HydrationOptions,
  IslandRegistration,
  MultiFrameworkIslandConfig
} from './types.js';

export type { ReactComponent, ReactModule } from './react.js';
export type { VueComponent, VueModule } from './vue.js';
export type { SvelteComponent, SvelteModule } from './svelte.js';
export type { PreactComponent, PreactModule } from './preact.js';
export type { SolidComponent, SolidModule } from './solid.js';

import { reactAdapter } from './react.js';
import { vueAdapter } from './vue.js';
import { svelteAdapter } from './svelte.js';
import { preactAdapter } from './preact.js';
import { solidAdapter } from './solid.js';
import type { FrameworkAdapter } from './types.js';

/**
 * Registry of all available framework adapters
 */
export const FRAMEWORK_ADAPTERS: Record<string, FrameworkAdapter> = {
  react: reactAdapter,
  vue: vueAdapter,
  svelte: svelteAdapter,
  preact: preactAdapter,
  solid: solidAdapter
};

/**
 * Get framework adapter by name
 */
export function getAdapter(framework: string): FrameworkAdapter | undefined {
  return FRAMEWORK_ADAPTERS[framework.toLowerCase()];
}

/**
 * Auto-detect framework from component
 */
export function detectFramework(component: any): FrameworkAdapter | undefined {
  for (const adapter of Object.values(FRAMEWORK_ADAPTERS)) {
    if (adapter.detect(component)) {
      return adapter;
    }
  }
  return undefined;
}

/**
 * Register a custom framework adapter
 */
export function registerAdapter(adapter: FrameworkAdapter): void {
  FRAMEWORK_ADAPTERS[adapter.name.toLowerCase()] = adapter;
}

/**
 * Check if a framework is supported
 */
export function isFrameworkSupported(framework: string): boolean {
  return framework.toLowerCase() in FRAMEWORK_ADAPTERS;
}

/**
 * Get all supported framework names
 */
export function getSupportedFrameworks(): string[] {
  return Object.keys(FRAMEWORK_ADAPTERS);
}
