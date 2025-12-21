/**
 * @file Bevy ECS Bridge
 * @description Bridge between Bevy ECS and PhilJS signals/state
 */

import type {
  BevyEntity,
  BevyComponent,
  BevyQuery,
  EntityId,
  ComponentType,
  EntityBridge,
  ComponentBridge,
  TransformComponent,
  VisibilityComponent,
  NameComponent,
  Vec3,
  Quat,
  QueryResult,
  BevyWorld,
} from './types';
import { getBevy, onBevyEvent } from './hooks';

// ============================================================================
// Signal Integration Types
// ============================================================================

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

// Default signal implementation for standalone use
let createSignalFn: CreateSignal = <T>(initialValue: T): Signal<T> => {
  let value = initialValue;
  const subscribers = new Set<(value: T) => void>();

  return {
    get value() {
      return value;
    },
    set value(newValue: T) {
      value = newValue;
      for (const subscriber of subscribers) {
        subscriber(value);
      }
    },
    subscribe(callback: (value: T) => void) {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
  };
};

/**
 * Set the signal creator function (for PhilJS integration)
 */
export function setSignalCreator(creator: CreateSignal): void {
  createSignalFn = creator;
}

// ============================================================================
// Entity Bridge
// ============================================================================

/** Active entity bridges */
const entityBridges = new Map<number, EntityBridge>();

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
export function createEntityBridge(entity: BevyEntity): EntityBridge {
  const entityId = entity.id as number;

  // Check for existing bridge
  const existing = entityBridges.get(entityId);
  if (existing) {
    return existing;
  }

  // Create component signals
  const componentSignals = new Map<string, Signal<BevyComponent | null>>();
  const subscribers = new Set<(entity: BevyEntity) => void>();

  // Initialize with current components
  for (const component of entity.getComponents()) {
    const signal = createSignalFn<BevyComponent | null>(component);
    componentSignals.set(component.componentName, signal);
  }

  // Listen for component changes
  const unsubscribeAdded = onBevyEvent('component-added', (event) => {
    if (event.data && event.data.entity.id === entityId) {
      const component = event.data.entity.getComponent({ componentName: event.data.component } as any);
      if (component) {
        let signal = componentSignals.get(event.data.component);
        if (!signal) {
          signal = createSignalFn<BevyComponent | null>(component);
          componentSignals.set(event.data.component, signal);
        } else {
          signal.value = component;
        }
      }
      notifySubscribers();
    }
  });

  const unsubscribeRemoved = onBevyEvent('component-removed', (event) => {
    if (event.data && event.data.entity.id === entityId) {
      const signal = componentSignals.get(event.data.component);
      if (signal) {
        signal.value = null;
      }
      notifySubscribers();
    }
  });

  const notifySubscribers = () => {
    for (const subscriber of subscribers) {
      subscriber(entity);
    }
  };

  const bridge: EntityBridge = {
    entity,
    components: new Map(
      Array.from(componentSignals.entries()).map(([name, signal]) => [
        name,
        signal.value!,
      ])
    ),

    subscribe(callback) {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },

    update(component) {
      entity.insertComponent(component);
      const signal = componentSignals.get(component.componentName);
      if (signal) {
        signal.value = component;
      } else {
        componentSignals.set(component.componentName, createSignalFn(component));
      }
      notifySubscribers();
    },

    dispose() {
      unsubscribeAdded();
      unsubscribeRemoved();
      subscribers.clear();
      componentSignals.clear();
      entityBridges.delete(entityId);
    },
  };

  entityBridges.set(entityId, bridge);
  return bridge;
}

// ============================================================================
// Component Bridge
// ============================================================================

/** Active component bridges */
const componentBridges = new Map<string, ComponentBridge<any>>();

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
export function createComponentBridge<T extends BevyComponent>(
  componentType: ComponentType<T>,
  entityId: EntityId
): ComponentBridge<T> {
  const bridgeKey = `${entityId}-${componentType.componentName}`;

  // Check for existing bridge
  const existing = componentBridges.get(bridgeKey);
  if (existing) {
    return existing;
  }

  const instance = getBevy();
  const entity = instance?.app?.getWorld().getEntity(entityId);
  const initialValue = entity?.getComponent(componentType) || null;

  const signal = createSignalFn<T | null>(initialValue);
  const subscribers = new Set<(component: T | null) => void>();

  // Listen for component changes
  const unsubscribeAdded = onBevyEvent('component-added', (event) => {
    if (
      event.data &&
      event.data.entity.id === entityId &&
      event.data.component === componentType.componentName
    ) {
      const component = event.data.entity.getComponent(componentType);
      signal.value = component || null;
      notifySubscribers();
    }
  });

  const unsubscribeRemoved = onBevyEvent('component-removed', (event) => {
    if (
      event.data &&
      event.data.entity.id === entityId &&
      event.data.component === componentType.componentName
    ) {
      signal.value = null;
      notifySubscribers();
    }
  });

  const notifySubscribers = () => {
    for (const subscriber of subscribers) {
      subscriber(signal.value);
    }
  };

  // Subscribe to signal changes
  signal.subscribe(notifySubscribers);

  const bridge: ComponentBridge<T> = {
    componentType,
    get value() {
      return signal.value;
    },

    subscribe(callback) {
      subscribers.add(callback);
      // Immediately call with current value
      callback(signal.value);
      return () => subscribers.delete(callback);
    },

    update(updates) {
      const current = signal.value;
      if (current && entity) {
        const updated = { ...current, ...updates } as T;
        entity.insertComponent(updated);
        signal.value = updated;
      }
    },

    dispose() {
      unsubscribeAdded();
      unsubscribeRemoved();
      subscribers.clear();
      componentBridges.delete(bridgeKey);
    },
  };

  componentBridges.set(bridgeKey, bridge);
  return bridge;
}

// ============================================================================
// Entity Spawning and Management
// ============================================================================

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
export function spawnEntity(
  components: BevyComponent[],
  canvasOrKey?: HTMLCanvasElement | string
): BevyEntity | null {
  const instance = getBevy(canvasOrKey);
  if (!instance?.app) return null;

  const world = instance.app.getWorld();
  const entity = world.spawnBundle(...components);

  return entity;
}

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
export function despawnEntity(
  entityId: EntityId,
  canvasOrKey?: HTMLCanvasElement | string
): void {
  const instance = getBevy(canvasOrKey);
  if (!instance?.app) return;

  const world = instance.app.getWorld();
  const entity = world.getEntity(entityId);
  if (entity) {
    world.despawn(entity);
  }

  // Clean up any bridges
  const bridge = entityBridges.get(entityId as number);
  if (bridge) {
    bridge.dispose();
  }
}

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
export function insertComponent<T extends BevyComponent>(
  entityId: EntityId,
  component: T,
  canvasOrKey?: HTMLCanvasElement | string
): void {
  const instance = getBevy(canvasOrKey);
  if (!instance?.app) return;

  const entity = instance.app.getWorld().getEntity(entityId);
  if (entity) {
    entity.insertComponent(component);
  }
}

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
export function removeComponent<T extends BevyComponent>(
  entityId: EntityId,
  componentType: ComponentType<T>,
  canvasOrKey?: HTMLCanvasElement | string
): void {
  const instance = getBevy(canvasOrKey);
  if (!instance?.app) return;

  const entity = instance.app.getWorld().getEntity(entityId);
  if (entity) {
    entity.removeComponent(componentType);
  }
}

// ============================================================================
// Entity Queries
// ============================================================================

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
export function queryEntities<T extends BevyComponent[]>(
  query: BevyQuery<T>,
  canvasOrKey?: HTMLCanvasElement | string
): QueryResult<T> | null {
  const instance = getBevy(canvasOrKey);
  if (!instance?.app) return null;

  return instance.app.getWorld().query(query);
}

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
export function findEntitiesWith(
  componentNames: string[],
  canvasOrKey?: HTMLCanvasElement | string
): BevyEntity[] {
  const result = queryEntities(
    { components: componentNames },
    canvasOrKey
  );
  return result?.entities || [];
}

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
export function findEntityWith(
  componentNames: string[],
  canvasOrKey?: HTMLCanvasElement | string
): BevyEntity | null {
  const result = queryEntities(
    { components: componentNames },
    canvasOrKey
  );
  return result?.entities[0] || null;
}

// ============================================================================
// Component Factories
// ============================================================================

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
export function createTransformComponent(
  translation: Vec3 = { x: 0, y: 0, z: 0 },
  rotation: Quat = { x: 0, y: 0, z: 0, w: 1 },
  scale: Vec3 = { x: 1, y: 1, z: 1 }
): TransformComponent {
  return {
    componentName: 'Transform',
    translation,
    rotation,
    scale,
    toBytes() {
      const buffer = new ArrayBuffer(40); // 3 + 4 + 3 floats = 10 * 4 bytes
      const view = new DataView(buffer);
      let offset = 0;

      // Translation
      view.setFloat32(offset, translation.x, true); offset += 4;
      view.setFloat32(offset, translation.y, true); offset += 4;
      view.setFloat32(offset, translation.z, true); offset += 4;

      // Rotation
      view.setFloat32(offset, rotation.x, true); offset += 4;
      view.setFloat32(offset, rotation.y, true); offset += 4;
      view.setFloat32(offset, rotation.z, true); offset += 4;
      view.setFloat32(offset, rotation.w, true); offset += 4;

      // Scale
      view.setFloat32(offset, scale.x, true); offset += 4;
      view.setFloat32(offset, scale.y, true); offset += 4;
      view.setFloat32(offset, scale.z, true);

      return new Uint8Array(buffer);
    },
    clone() {
      return createTransformComponent(
        { ...translation },
        { ...rotation },
        { ...scale }
      );
    },
  };
}

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
export function createVisibilityComponent(isVisible: boolean = true): VisibilityComponent {
  return {
    componentName: 'Visibility',
    isVisible,
    toBytes() {
      return new Uint8Array([isVisible ? 1 : 0]);
    },
    clone() {
      return createVisibilityComponent(isVisible);
    },
  };
}

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
export function createNameComponent(name: string): NameComponent {
  return {
    componentName: 'Name',
    name,
    toBytes() {
      const encoder = new TextEncoder();
      return encoder.encode(name);
    },
    clone() {
      return createNameComponent(name);
    },
  };
}

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
export function createCustomComponent<T extends Record<string, unknown>>(
  componentName: string,
  data: T
): BevyComponent & T {
  return {
    componentName,
    ...data,
    toBytes() {
      const json = JSON.stringify(data);
      const encoder = new TextEncoder();
      return encoder.encode(json);
    },
    clone() {
      return createCustomComponent(componentName, { ...data });
    },
  } as BevyComponent & T;
}

// ============================================================================
// Reactive Entity Tracking
// ============================================================================

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
export function trackEntities<T extends BevyComponent[]>(
  query: BevyQuery<T>,
  callback: (entities: BevyEntity[]) => void,
  canvasOrKey?: HTMLCanvasElement | string
): () => void {
  // Initial query
  const result = queryEntities(query, canvasOrKey);
  callback(result?.entities || []);

  // Track spawns and despawns
  const unsubscribeSpawned = onBevyEvent('entity-spawned', (event) => {
    if (event.data) {
      const entity = event.data.entity;
      const hasAllComponents = query.components.every((name) =>
        entity.getComponents().some((c) => c.componentName === name)
      );
      if (hasAllComponents) {
        const newResult = queryEntities(query, canvasOrKey);
        callback(newResult?.entities || []);
      }
    }
  });

  const unsubscribeDespawned = onBevyEvent('entity-despawned', () => {
    const newResult = queryEntities(query, canvasOrKey);
    callback(newResult?.entities || []);
  });

  const unsubscribeComponentAdded = onBevyEvent('component-added', () => {
    const newResult = queryEntities(query, canvasOrKey);
    callback(newResult?.entities || []);
  });

  const unsubscribeComponentRemoved = onBevyEvent('component-removed', () => {
    const newResult = queryEntities(query, canvasOrKey);
    callback(newResult?.entities || []);
  });

  return () => {
    unsubscribeSpawned();
    unsubscribeDespawned();
    unsubscribeComponentAdded();
    unsubscribeComponentRemoved();
  };
}

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
export function trackEntity(
  entityId: EntityId,
  callback: (entity: BevyEntity | null) => void,
  canvasOrKey?: HTMLCanvasElement | string
): () => void {
  const bridge = createEntityBridge(
    getBevy(canvasOrKey)?.app?.getWorld().getEntity(entityId) ||
    ({} as BevyEntity)
  );

  const unsubscribe = bridge.subscribe(callback);

  // Call callback immediately with current entity state
  callback(bridge.entity);

  const unsubscribeDespawned = onBevyEvent('entity-despawned', (event) => {
    if (event.data?.entityId === entityId) {
      callback(null);
    }
  });

  return () => {
    unsubscribe();
    unsubscribeDespawned();
    bridge.dispose();
  };
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Dispose all entity and component bridges
 */
export function disposeAllBridges(): void {
  for (const bridge of entityBridges.values()) {
    bridge.dispose();
  }
  entityBridges.clear();

  for (const bridge of componentBridges.values()) {
    bridge.dispose();
  }
  componentBridges.clear();
}
