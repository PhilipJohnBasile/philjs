/**
 * Resumable Container Component
 *
 * The container component is the root of a resumable application.
 * It manages the serialization context, handles state persistence,
 * and coordinates hydration on the client.
 *
 * @example
 * ```typescript
 * // Server-side
 * const html = await renderToString(
 *   <ResumableContainer>
 *     <App />
 *   </ResumableContainer>
 * );
 *
 * // Client-side
 * resumeContainer(document.getElementById('app'));
 * ```
 */

import type { QRL } from './qrl.js';
import { isQRL, parseQRL, configureQRL } from './qrl.js';
import {
  type SerializationContext,
  createSerializationContext,
  withSerializationContext,
  generateStateScript,
  generateBootstrapScript,
} from './serializer.js';
import { initLoader, configureLoader, loadAndHydrate } from './loader.js';
import {
  initHydration,
  discoverHydrationBoundaries,
  type HydrationStrategy,
} from './hydration.js';
import {
  type ResumableContext,
  type ResumableConfig,
  withResumableContext,
  resume,
} from './resumable.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Container state
 */
export interface ContainerState {
  /** Unique container ID */
  id: string;
  /** Whether the container has been hydrated */
  hydrated: boolean;
  /** Serialization context */
  serialization: SerializationContext | null;
  /** Resumable context */
  resumable: ResumableContext | null;
  /** Error state */
  error: Error | null;
  /** Loading state */
  loading: boolean;
}

/**
 * Container configuration
 */
export interface ContainerConfig extends ResumableConfig {
  /** Container element ID */
  id?: string;
  /** Default hydration strategy for children */
  defaultHydration?: HydrationStrategy;
  /** Enable automatic discovery of hydration boundaries */
  autoDiscover?: boolean;
  /** Enable error boundaries */
  errorBoundary?: boolean;
  /** Error fallback component */
  errorFallback?: (error: Error) => unknown;
  /** Loading fallback component */
  loadingFallback?: unknown;
  /** On hydration complete callback */
  onHydrate?: () => void;
  /** On error callback */
  onError?: (error: Error) => void;
}

/**
 * Container props
 */
export interface ContainerProps extends ContainerConfig {
  /** Children to render */
  children: unknown;
}

// ============================================================================
// Container Registry
// ============================================================================

/** Registry of active containers */
const containerRegistry = new Map<string, ContainerState>();

/** Counter for container IDs */
let containerIdCounter = 0;

/**
 * Generate a unique container ID
 */
function generateContainerId(): string {
  return `container_${containerIdCounter++}`;
}

/**
 * Get a container by ID
 */
export function getContainer(id: string): ContainerState | undefined {
  return containerRegistry.get(id);
}

/**
 * Get all containers
 */
export function getAllContainers(): ContainerState[] {
  return Array.from(containerRegistry.values());
}

// ============================================================================
// ResumableContainer Component
// ============================================================================

/**
 * Create a ResumableContainer component.
 *
 * This is the root component for a resumable application.
 * It handles:
 * - Creating the serialization context for SSR
 * - Generating state scripts for hydration
 * - Coordinating client-side resume
 */
export function ResumableContainer(props: ContainerProps): unknown {
  const id = props.id || generateContainerId();
  const isServer = typeof window === 'undefined';

  if (isServer) {
    return renderServerContainer(id, props);
  } else {
    return renderClientContainer(id, props);
  }
}

/**
 * Render the container on the server
 */
function renderServerContainer(id: string, props: ContainerProps): unknown {
  const serializationOptions: { isDev?: boolean } = {};
  if (props.isDev !== undefined) {
    serializationOptions.isDev = props.isDev;
  }
  const serialization = createSerializationContext(serializationOptions);

  const resumable: ResumableContext = {
    serialization,
    componentStack: [],
    signals: new Map(),
    isServer: true,
    isHydrating: false,
  };

  // Register container
  containerRegistry.set(id, {
    id,
    hydrated: false,
    serialization,
    resumable,
    error: null,
    loading: false,
  });

  // Render children in context
  const children = withResumableContext(resumable, () => props.children);

  // Generate scripts
  const stateScript = generateStateScript(serialization);
  const bootstrapOptions: { basePath?: string; inlineRuntime?: boolean } = {};
  if (props.basePath !== undefined) {
    bootstrapOptions.basePath = props.basePath;
  }
  const bootstrapScript = generateBootstrapScript(bootstrapOptions);

  // Return container with children and scripts
  return {
    type: 'div',
    props: {
      id: `phil-container-${id}`,
      'data-phil-container': id,
      'data-hydration-strategy': props.defaultHydration || 'idle',
      children: [
        children,
        // Inject scripts as raw HTML (handled by renderer)
        { type: 'raw-html', props: { html: stateScript } },
        { type: 'raw-html', props: { html: bootstrapScript } },
      ],
    },
  };
}

/**
 * Render the container on the client (for SPA mode)
 */
function renderClientContainer(id: string, props: ContainerProps): unknown {
  // In SPA mode, just render children
  return {
    type: 'div',
    props: {
      id: `phil-container-${id}`,
      'data-phil-container': id,
      children: props.children,
    },
  };
}

// ============================================================================
// Client-Side Resume
// ============================================================================

/**
 * Resume a container on the client
 */
export async function resumeContainer(
  element: Element,
  config?: ContainerConfig
): Promise<void> {
  const containerId = element.getAttribute('data-phil-container');
  if (!containerId) {
    throw new Error('Element is not a resumable container');
  }

  // Check if already hydrated
  const existing = containerRegistry.get(containerId);
  if (existing?.hydrated) {
    return;
  }

  // Configure loader
  configureLoader({
    basePath: config?.basePath || '',
    isDev: config?.isDev || false,
  });

  // Configure QRL
  const qrlOptions: { basePath?: string; resolver?: (chunk: string) => Promise<Record<string, unknown>> } = {};
  if (config?.basePath !== undefined) {
    qrlOptions.basePath = config.basePath;
  }
  if (config?.resolver !== undefined) {
    qrlOptions.resolver = config.resolver;
  }
  configureQRL(qrlOptions);

  // Update container state
  const state: ContainerState = {
    id: containerId,
    hydrated: false,
    serialization: null,
    resumable: null,
    error: null,
    loading: true,
  };
  containerRegistry.set(containerId, state);

  try {
    // Initialize systems
    initLoader();
    initHydration();

    // Discover and setup hydration boundaries
    if (config?.autoDiscover !== false) {
      discoverHydrationBoundaries(element);
    }

    // Resume the application
    resume(config);

    // Mark as hydrated
    state.hydrated = true;
    state.loading = false;

    // Dispatch event
    element.dispatchEvent(
      new CustomEvent('phil:container-resumed', {
        bubbles: true,
        detail: { containerId },
      })
    );

    // Callback
    config?.onHydrate?.();
  } catch (error) {
    state.error = error instanceof Error ? error : new Error(String(error));
    state.loading = false;
    config?.onError?.(state.error);
    throw state.error;
  }
}

/**
 * Resume all containers on the page
 */
export async function resumeAllContainers(
  config?: ContainerConfig
): Promise<void> {
  const containers = document.querySelectorAll('[data-phil-container]');

  await Promise.all(
    Array.from(containers).map((element) =>
      resumeContainer(element, config).catch((error) => {
        console.error(`[PhilJS] Failed to resume container:`, error);
      })
    )
  );
}

// ============================================================================
// Container Utilities
// ============================================================================

/**
 * Check if a container is hydrated
 */
export function isContainerHydrated(id: string): boolean {
  return containerRegistry.get(id)?.hydrated ?? false;
}

/**
 * Wait for a container to hydrate
 */
export async function waitForContainer(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const check = () => {
      const container = containerRegistry.get(id);
      if (!container) {
        reject(new Error(`Container ${id} not found`));
        return;
      }
      if (container.error) {
        reject(container.error);
        return;
      }
      if (container.hydrated) {
        resolve();
        return;
      }
      setTimeout(check, 10);
    };
    check();
  });
}

/**
 * Dispose a container
 */
export function disposeContainer(id: string): void {
  const container = containerRegistry.get(id);
  if (container) {
    // Cleanup
    containerRegistry.delete(id);

    // Dispatch event
    if (typeof document !== 'undefined') {
      const element = document.querySelector(`[data-phil-container="${id}"]`);
      element?.dispatchEvent(
        new CustomEvent('phil:container-disposed', {
          bubbles: true,
          detail: { containerId: id },
        })
      );
    }
  }
}

/**
 * Dispose all containers
 */
export function disposeAllContainers(): void {
  for (const id of containerRegistry.keys()) {
    disposeContainer(id);
  }
}

// ============================================================================
// Error Boundary
// ============================================================================

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  /** Children to render */
  children: unknown;
  /** Fallback to render on error */
  fallback?: (error: Error, retry: () => void) => unknown;
  /** Error callback */
  onError?: (error: Error) => void;
}

/**
 * Error boundary component for resumable containers
 */
export function ErrorBoundary(props: ErrorBoundaryProps): unknown {
  // This would integrate with the rendering system
  // For now, just render children
  return props.children;
}

// ============================================================================
// Suspense Support
// ============================================================================

/**
 * Suspense props
 */
export interface SuspenseProps {
  /** Children to render */
  children: unknown;
  /** Fallback to render while loading */
  fallback?: unknown;
}

/**
 * Suspense component for lazy loading
 */
export function Suspense(props: SuspenseProps): unknown {
  // On server, render fallback if children are lazy
  // On client, handle async boundaries
  return {
    type: 'phil-suspense',
    props: {
      'data-phil-suspense': 'true',
      children: props.children,
      fallback: props.fallback,
    },
  };
}

// ============================================================================
// Context Provider
// ============================================================================

/**
 * Context value
 */
export interface ContainerContextValue {
  /** Container ID */
  id: string;
  /** Whether hydrated */
  hydrated: boolean;
  /** Force hydrate the container */
  forceHydrate: () => Promise<void>;
  /** Register a component for hydration */
  register: (componentId: string, qrl: QRL) => void;
}

/**
 * Container context
 */
let containerContext: ContainerContextValue | null = null;

/**
 * Get the current container context
 */
export function useContainerContext(): ContainerContextValue | null {
  return containerContext;
}

/**
 * Provide container context
 */
export function ContainerProvider(props: {
  value: ContainerContextValue;
  children: unknown;
}): unknown {
  const prev = containerContext;
  containerContext = props.value;

  try {
    return props.children;
  } finally {
    containerContext = prev;
  }
}

// ============================================================================
// Prefetching
// ============================================================================

/**
 * Prefetch components in a container
 */
export function prefetchContainer(element: Element): void {
  // Find all components with QRLs and prefetch them
  const components = element.querySelectorAll('[data-qcomponent]');

  components.forEach((component) => {
    const qrlStr = component.getAttribute('data-qcomponent');
    if (qrlStr) {
      const qrl = parseQRL(qrlStr);
      // Prefetch the chunk
      import(/* @vite-ignore */ qrl.$chunk$).catch(() => {
        // Ignore prefetch errors
      });
    }
  });
}

/**
 * Prefetch container on link hover
 */
export function setupContainerPrefetching(): void {
  if (typeof document === 'undefined') return;

  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[data-prefetch-container]');

    if (link) {
      const containerId = link.getAttribute('data-prefetch-container');
      if (containerId) {
        const container = document.querySelector(
          `[data-phil-container="${containerId}"]`
        );
        if (container) {
          prefetchContainer(container);
        }
      }
    }
  });
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get container statistics
 */
export function getContainerStats(): {
  total: number;
  hydrated: number;
  loading: number;
  errored: number;
} {
  const stats = {
    total: containerRegistry.size,
    hydrated: 0,
    loading: 0,
    errored: 0,
  };

  for (const container of containerRegistry.values()) {
    if (container.hydrated) stats.hydrated++;
    if (container.loading) stats.loading++;
    if (container.error) stats.errored++;
  }

  return stats;
}
