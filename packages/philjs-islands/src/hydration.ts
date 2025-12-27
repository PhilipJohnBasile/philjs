/**
 * Hydration utilities for PhilJS Islands
 */

import type { IslandInstance, HydrationStrategy } from './types.js';

/**
 * Hydrate a specific island element
 */
export async function hydrateIsland(element: HTMLElement): Promise<void> {
  if (!(element.tagName.toLowerCase() === 'phil-island')) {
    console.warn('[PhilJS Islands] hydrateIsland expects a <phil-island> element');
    return;
  }

  const instance = (element as any)._instance as IslandInstance | undefined;
  if (instance) {
    await instance.hydrate();
  }
}

/**
 * Hydrate all islands in a container
 */
export async function hydrateAll(
  root: HTMLElement | Document = document,
  options?: { concurrent?: boolean }
): Promise<void> {
  const islands = root.querySelectorAll('phil-island:not([data-hydrated])');
  const elements = Array.from(islands) as HTMLElement[];

  if (options?.concurrent !== false) {
    // Hydrate all concurrently (default)
    await Promise.all(elements.map(hydrateIsland));
  } else {
    // Hydrate sequentially
    for (const element of elements) {
      await hydrateIsland(element);
    }
  }
}

/**
 * Mount islands with attribute-based detection
 * Supports both <phil-island> elements and [data-island] attributes
 */
export function mountIslands(
  root: HTMLElement | Document = document,
  options?: {
    attributeName?: string;
    defaultStrategy?: HydrationStrategy;
  }
): void {
  const attributeName = options?.attributeName || 'data-island';
  const defaultStrategy = options?.defaultStrategy || 'visible';

  // Handle [data-island] elements by wrapping them
  const attributeIslands = root.querySelectorAll(`[${attributeName}]:not(phil-island)`);

  for (const element of attributeIslands) {
    const name = element.getAttribute(attributeName);
    if (!name) continue;

    // Check if already wrapped
    if (element.closest('phil-island')) continue;

    // Create wrapper island element
    const island = document.createElement('phil-island');
    island.setAttribute('name', name);
    island.setAttribute('strategy', element.getAttribute('data-strategy') || defaultStrategy);

    // Copy props if present
    const propsAttr = element.getAttribute('data-props');
    if (propsAttr) {
      island.setAttribute('props', propsAttr);
    }

    // Wrap the element
    element.parentNode?.insertBefore(island, element);
    island.appendChild(element);
  }

  // <phil-island> elements self-initialize via connectedCallback
}

/**
 * Wait for an island to be hydrated
 */
export function waitForHydration(element: HTMLElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (element.hasAttribute('data-hydrated')) {
      resolve();
      return;
    }

    const handleHydrated = () => {
      element.removeEventListener('phil:island-hydrated', handleHydrated);
      element.removeEventListener('phil:island-error', handleError);
      resolve();
    };

    const handleError = (event: Event) => {
      element.removeEventListener('phil:island-hydrated', handleHydrated);
      element.removeEventListener('phil:island-error', handleError);
      reject((event as CustomEvent).detail?.error || new Error('Island hydration failed'));
    };

    element.addEventListener('phil:island-hydrated', handleHydrated);
    element.addEventListener('phil:island-error', handleError);
  });
}

/**
 * Wait for all islands in a container to hydrate
 */
export function waitForAllHydration(
  root: HTMLElement | Document = document
): Promise<void[]> {
  const islands = root.querySelectorAll('phil-island:not([data-hydrated])');
  return Promise.all(Array.from(islands).map(waitForHydration));
}
