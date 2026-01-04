/**
 * @file Bevy ECS Bridge
 * @description Bridge between Bevy ECS and PhilJS signals/state
 */
import type { BevyEntity, BevyComponent, BevyQuery, EntityId, ComponentType, EntityBridge, ComponentBridge, TransformComponent, VisibilityComponent, NameComponent, Vec3, Quat, QueryResult } from './types.js';
/**
 * PhilJS signal type for reactive updates
 */
interface Signal<T> {
    value: T;
    subscribe(callback: (value: T) => void): () => void;
}
/**
 * Signal creator function
 */
type CreateSignal = <T>(value: T) => Signal<T>;
/**
 * Set the signal creator function (for PhilJS integration)
 */
export declare function setSignalCreator(creator: CreateSignal): void;
/**
 * Create a bridge between a Bevy entity and PhilJS signals
 *
 * @param entity - Bevy entity to bridge
 * @param options - Bridge options
 * @returns Entity bridge
 *
 * @example
 * ```ts
 * const playerBridge = createEntityBridge(playerEntity);
 *
 * // Subscribe to all component changes
 * playerBridge.subscribe((entity) => {
 *   console.log('Player updated:', entity.getComponents());
 * });
 *
 * // Update a component from JS
 * playerBridge.update({
 *   componentName: 'Transform',
 *   translation: { x: 10, y: 0, z: 5 },
 *   rotation: { x: 0, y: 0, z: 0, w: 1 },
 *   scale: { x: 1, y: 1, z: 1 },
 *   toBytes: () => new Uint8Array(),
 *   clone: () => ({ ...this }),
 * });
 * ```
 */
export declare function createEntityBridge(entity: BevyEntity): EntityBridge;
/**
 * Create a bridge for a specific component type
 *
 * @param componentType - Component type to bridge
 * @param entityId - Entity ID to track
 * @returns Component bridge
 *
 * @example
 * ```ts
 * const transformBridge = createComponentBridge(TransformComponent, playerId);
 *
 * // Subscribe to transform changes
 * transformBridge.subscribe((transform) => {
 *   if (transform) {
 *     console.log('Position:', transform.translation);
 *   }
 * });
 *
 * // Update transform from JS
 * transformBridge.update({
 *   translation: { x: newX, y: newY, z: newZ },
 * });
 * ```
 */
export declare function createComponentBridge<T extends BevyComponent>(componentType: ComponentType<T>, entityId: EntityId): ComponentBridge<T>;
/**
 * Spawn a new entity with components
 *
 * @param components - Components to add to the entity
 * @param canvasOrKey - Canvas element or instance key
 * @returns The spawned entity
 *
 * @example
 * ```ts
 * const enemy = spawnEntity([
 *   createTransformComponent({ x: 10, y: 0, z: 5 }),
 *   createEnemyComponent({ health: 100, damage: 10 }),
 *   createVisibilityComponent(true),
 * ]);
 * ```
 */
export declare function spawnEntity(components: BevyComponent[], canvasOrKey?: HTMLCanvasElement | string): BevyEntity | null;
/**
 * Despawn an entity
 *
 * @param entityId - Entity ID to despawn
 * @param canvasOrKey - Canvas element or instance key
 *
 * @example
 * ```ts
 * despawnEntity(enemyId);
 * ```
 */
export declare function despawnEntity(entityId: EntityId, canvasOrKey?: HTMLCanvasElement | string): void;
/**
 * Insert a component into an entity
 *
 * @param entityId - Entity ID
 * @param component - Component to insert
 * @param canvasOrKey - Canvas element or instance key
 *
 * @example
 * ```ts
 * insertComponent(playerId, createHealthComponent(100));
 * ```
 */
export declare function insertComponent<T extends BevyComponent>(entityId: EntityId, component: T, canvasOrKey?: HTMLCanvasElement | string): void;
/**
 * Remove a component from an entity
 *
 * @param entityId - Entity ID
 * @param componentType - Component type to remove
 * @param canvasOrKey - Canvas element or instance key
 *
 * @example
 * ```ts
 * removeComponent(playerId, InvincibilityComponent);
 * ```
 */
export declare function removeComponent<T extends BevyComponent>(entityId: EntityId, componentType: ComponentType<T>, canvasOrKey?: HTMLCanvasElement | string): void;
/**
 * Query entities from the ECS
 *
 * @param query - Query descriptor
 * @param canvasOrKey - Canvas element or instance key
 * @returns Query result
 *
 * @example
 * ```ts
 * const enemies = queryEntities({
 *   components: ['Transform', 'Enemy', 'Health'],
 *   filters: [
 *     { type: 'with', component: 'Visible' },
 *     { type: 'without', component: 'Dead' },
 *   ],
 * });
 *
 * for (const [entity, transform, enemy, health] of enemies.iter()) {
 *   console.log(`Enemy at ${transform.translation.x}, ${transform.translation.y}`);
 * }
 * ```
 */
export declare function queryEntities<T extends BevyComponent[]>(query: BevyQuery<T>, canvasOrKey?: HTMLCanvasElement | string): QueryResult<T> | null;
/**
 * Find entities with specific components
 *
 * @param componentNames - Component names to search for
 * @param canvasOrKey - Canvas element or instance key
 * @returns Array of matching entities
 *
 * @example
 * ```ts
 * const players = findEntitiesWith(['Player', 'Transform']);
 * ```
 */
export declare function findEntitiesWith(componentNames: string[], canvasOrKey?: HTMLCanvasElement | string): BevyEntity[];
/**
 * Find a single entity with specific components
 *
 * @param componentNames - Component names to search for
 * @param canvasOrKey - Canvas element or instance key
 * @returns First matching entity or null
 *
 * @example
 * ```ts
 * const player = findEntityWith(['Player']);
 * ```
 */
export declare function findEntityWith(componentNames: string[], canvasOrKey?: HTMLCanvasElement | string): BevyEntity | null;
/**
 * Create a Transform component
 *
 * @param translation - Position
 * @param rotation - Rotation quaternion
 * @param scale - Scale
 * @returns Transform component
 *
 * @example
 * ```ts
 * const transform = createTransformComponent(
 *   { x: 0, y: 1, z: 0 },
 *   { x: 0, y: 0, z: 0, w: 1 },
 *   { x: 1, y: 1, z: 1 }
 * );
 * ```
 */
export declare function createTransformComponent(translation?: Vec3, rotation?: Quat, scale?: Vec3): TransformComponent;
/**
 * Create a Visibility component
 *
 * @param isVisible - Whether the entity is visible
 * @returns Visibility component
 *
 * @example
 * ```ts
 * const visibility = createVisibilityComponent(true);
 * ```
 */
export declare function createVisibilityComponent(isVisible?: boolean): VisibilityComponent;
/**
 * Create a Name component
 *
 * @param name - Entity name
 * @returns Name component
 *
 * @example
 * ```ts
 * const nameComp = createNameComponent('Player');
 * ```
 */
export declare function createNameComponent(name: string): NameComponent;
/**
 * Create a custom component
 *
 * @param componentName - Component type name
 * @param data - Component data
 * @returns Custom component
 *
 * @example
 * ```ts
 * const health = createCustomComponent('Health', {
 *   current: 100,
 *   max: 100,
 * });
 * ```
 */
export declare function createCustomComponent<T extends Record<string, unknown>>(componentName: string, data: T): BevyComponent & T;
/**
 * Track entities matching a query reactively
 *
 * @param query - Query descriptor
 * @param callback - Callback when results change
 * @param canvasOrKey - Canvas element or instance key
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = trackEntities(
 *   { components: ['Enemy', 'Health'] },
 *   (entities) => {
 *     console.log(`Tracking ${entities.length} enemies`);
 *   }
 * );
 * ```
 */
export declare function trackEntities<T extends BevyComponent[]>(query: BevyQuery<T>, callback: (entities: BevyEntity[]) => void, canvasOrKey?: HTMLCanvasElement | string): () => void;
/**
 * Track a specific entity reactively
 *
 * @param entityId - Entity ID to track
 * @param callback - Callback when entity changes
 * @param canvasOrKey - Canvas element or instance key
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = trackEntity(playerId, (entity) => {
 *   if (entity) {
 *     const health = entity.getComponent(HealthComponent);
 *     updateHealthUI(health?.current || 0);
 *   }
 * });
 * ```
 */
export declare function trackEntity(entityId: EntityId, callback: (entity: BevyEntity | null) => void, canvasOrKey?: HTMLCanvasElement | string): () => void;
/**
 * Dispose all entity and component bridges
 */
export declare function disposeAllBridges(): void;
export {};
//# sourceMappingURL=ecs-bridge.d.ts.map