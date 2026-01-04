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
import { type SerializationContext } from './serializer.js';
import { type HydrationStrategy } from './hydration.js';
import { type ResumableContext, type ResumableConfig } from './resumable.js';
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
/**
 * Get a container by ID
 */
export declare function getContainer(id: string): ContainerState | undefined;
/**
 * Get all containers
 */
export declare function getAllContainers(): ContainerState[];
/**
 * Create a ResumableContainer component.
 *
 * This is the root component for a resumable application.
 * It handles:
 * - Creating the serialization context for SSR
 * - Generating state scripts for hydration
 * - Coordinating client-side resume
 */
export declare function ResumableContainer(props: ContainerProps): unknown;
/**
 * Resume a container on the client
 */
export declare function resumeContainer(element: Element, config?: ContainerConfig): Promise<void>;
/**
 * Resume all containers on the page
 */
export declare function resumeAllContainers(config?: ContainerConfig): Promise<void>;
/**
 * Check if a container is hydrated
 */
export declare function isContainerHydrated(id: string): boolean;
/**
 * Wait for a container to hydrate
 */
export declare function waitForContainer(id: string): Promise<void>;
/**
 * Dispose a container
 */
export declare function disposeContainer(id: string): void;
/**
 * Dispose all containers
 */
export declare function disposeAllContainers(): void;
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
export declare function ErrorBoundary(props: ErrorBoundaryProps): unknown;
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
export declare function Suspense(props: SuspenseProps): unknown;
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
 * Get the current container context
 */
export declare function useContainerContext(): ContainerContextValue | null;
/**
 * Provide container context
 */
export declare function ContainerProvider(props: {
    value: ContainerContextValue;
    children: unknown;
}): unknown;
/**
 * Prefetch components in a container
 */
export declare function prefetchContainer(element: Element): void;
/**
 * Prefetch container on link hover
 */
export declare function setupContainerPrefetching(): void;
/**
 * Get container statistics
 */
export declare function getContainerStats(): {
    total: number;
    hydrated: number;
    loading: number;
    errored: number;
};
//# sourceMappingURL=container.d.ts.map