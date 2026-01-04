/**
 * @file Bevy Game Engine Hooks
 * @description PhilJS hooks for Bevy WASM integration
 */
import type { BevyConfig, BevyInstance, BevyComponent, BevyResource, BevyQuery, BevyEventType, BevyEventListener, BevyEventData, EntityId, ResourceType, UseBevyResult, UseBevyEntityResult, UseBevyResourceResult, UseBevyQueryResult } from './types.js';
/**
 * Create and initialize a Bevy WASM application instance
 *
 * @param config - Bevy configuration
 * @returns Promise resolving to Bevy instance
 *
 * @example
 * ```ts
 * const instance = await createBevyInstance({
 *   wasmPath: '/game.wasm',
 *   canvas: '#game-canvas',
 *   width: 1280,
 *   height: 720,
 * });
 *
 * instance.app.run();
 * ```
 */
export declare function createBevyInstance(config: BevyConfig): Promise<BevyInstance>;
/**
 * Get Bevy instance for a canvas
 */
export declare function getBevy(canvasOrKey?: HTMLCanvasElement | string): BevyInstance | null;
/**
 * Hook for accessing Bevy app
 *
 * @param canvasOrKey - Canvas element or instance key
 * @returns Bevy hook result
 *
 * @example
 * ```tsx
 * function GameUI() {
 *   const { instance, isReady, pause, resume } = useBevy();
 *
 *   if (!isReady) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <button onClick={pause}>Pause</button>
 *       <button onClick={resume}>Resume</button>
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useBevy(canvasOrKey?: HTMLCanvasElement | string): UseBevyResult;
/**
 * Hook for accessing a specific entity
 *
 * @param entityId - Entity ID to access
 * @param canvasOrKey - Canvas element or instance key
 * @returns Entity hook result
 *
 * @example
 * ```tsx
 * function PlayerStats({ playerId }: { playerId: EntityId }) {
 *   const { entity, getComponent } = useBevyEntity(playerId);
 *
 *   if (!entity) return null;
 *
 *   const health = getComponent(HealthComponent);
 *   return <div>Health: {health?.value || 0}</div>;
 * }
 * ```
 */
export declare function useBevyEntity(entityId: EntityId, canvasOrKey?: HTMLCanvasElement | string): UseBevyEntityResult;
/**
 * Hook for accessing a resource
 *
 * @param resourceType - Resource type constructor
 * @param canvasOrKey - Canvas element or instance key
 * @returns Resource hook result
 *
 * @example
 * ```tsx
 * function TimeDisplay() {
 *   const { resource } = useBevyResource(TimeResource);
 *
 *   return <div>Elapsed: {resource?.elapsedSecs.toFixed(2)}s</div>;
 * }
 * ```
 */
export declare function useBevyResource<T extends BevyResource>(resourceType: ResourceType<T>, canvasOrKey?: HTMLCanvasElement | string): UseBevyResourceResult<T>;
/**
 * Hook for querying entities
 *
 * @param query - Query descriptor
 * @param canvasOrKey - Canvas element or instance key
 * @returns Query hook result
 *
 * @example
 * ```tsx
 * function EnemyList() {
 *   const { results, count } = useBevyQuery({
 *     components: ['Transform', 'Enemy', 'Health'],
 *     filters: [{ type: 'with', component: 'Visible' }],
 *   });
 *
 *   return (
 *     <div>
 *       <h2>Enemies: {count}</h2>
 *       {results?.map((entity) => (
 *         <EnemyCard key={entity.id} entity={entity} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useBevyQuery<T extends BevyComponent[]>(query: BevyQuery<T>, canvasOrKey?: HTMLCanvasElement | string): UseBevyQueryResult<T>;
/**
 * Listen to Bevy events
 *
 * @param event - Event type to listen for
 * @param callback - Callback function
 * @param canvasOrKey - Canvas element or instance key
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = onBevyEvent('entity-spawned', (event) => {
 *   console.log('Entity spawned:', event.data.entity.id);
 * });
 *
 * // Later...
 * unsubscribe();
 * ```
 */
export declare function onBevyEvent<T extends BevyEventType>(event: T, callback: BevyEventListener<T>, canvasOrKey?: HTMLCanvasElement | string): () => void;
/**
 * Send a custom event to Bevy
 *
 * @param event - Event type (use 'custom' for custom events)
 * @param data - Event data
 * @param canvasOrKey - Canvas element or instance key
 *
 * @example
 * ```ts
 * sendBevyEvent('custom', {
 *   action: 'player-action',
 *   payload: { type: 'jump', force: 10 },
 * });
 * ```
 */
export declare function sendBevyEvent<T extends BevyEventType>(event: T, data: BevyEventData<T>, canvasOrKey?: HTMLCanvasElement | string): void;
/**
 * Dispose a Bevy instance
 *
 * @param canvasOrKey - Canvas element or instance key
 */
export declare function disposeBevy(canvasOrKey?: HTMLCanvasElement | string): Promise<void>;
/**
 * Dispose all Bevy instances
 */
export declare function disposeAllBevy(): Promise<void>;
/**
 * Check if Bevy WASM is supported
 */
export declare function isBevySupported(): boolean;
/**
 * Get all active Bevy instances
 */
export declare function getAllBevyInstances(): BevyInstance[];
//# sourceMappingURL=hooks.d.ts.map