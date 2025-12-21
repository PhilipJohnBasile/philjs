/**
 * @file Bevy Integration Index
 * @description Exports for Bevy WASM game engine integration
 *
 * PhilJS is the first JavaScript framework with native Bevy integration!
 *
 * @example
 * ```tsx
 * import {
 *   BevyEmbed,
 *   createBevyInstance,
 *   useBevy,
 *   useBevyEntity,
 *   spawnEntity,
 *   createTransformComponent,
 *   loadBevyAsset,
 * } from 'philjs-3d/bevy';
 *
 * // Create a Bevy game embed
 * const game = BevyEmbed({
 *   wasmPath: '/game.wasm',
 *   width: 1280,
 *   height: 720,
 *   onReady: (instance) => {
 *     console.log('Game ready!');
 *
 *     // Spawn an entity from JavaScript
 *     spawnEntity([
 *       createTransformComponent({ x: 0, y: 1, z: 0 }),
 *       createNameComponent('Player'),
 *     ]);
 *   },
 * });
 *
 * document.getElementById('app').appendChild(game);
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
  // Core types
  BevyConfig,
  BevyApp,
  BevyInstance,
  BevyState,

  // ECS types
  EntityId,
  EntityGeneration,
  BevyEntity,
  ComponentType,
  BevyComponent,
  TransformComponent,
  GlobalTransformComponent,
  VisibilityComponent,
  NameComponent,
  ParentComponent,
  ChildrenComponent,

  // Math types
  Vec2,
  Vec3,
  Vec4,
  Quat,
  Mat3,
  Mat4,

  // Resource types
  ResourceType,
  BevyResource,
  TimeResource,
  InputResource,
  GamepadState,
  WindowResource,

  // Event types
  BevyEventType,
  BevyEvent,
  BevyEventData,
  BevyEventListener,

  // Query types
  QueryFilter,
  BevyQuery,
  QueryResult,

  // World types
  BevyWorld,

  // Asset types
  AssetState,
  AssetHandle,
  BevyAssetType,
  AssetMetadata,

  // Input types
  KeyCode,
  MouseButton,
  GamepadButton,
  GamepadAxis,

  // Component props
  BevyEmbedProps,
  UseBevyResult,
  UseBevyEntityResult,
  UseBevyResourceResult,
  UseBevyQueryResult,

  // Bridge types
  EntityBridge,
  ComponentBridge,
} from './types';

// ============================================================================
// Hooks
// ============================================================================

export {
  // Instance creation
  createBevyInstance,
  getBevy,

  // Hooks
  useBevy,
  useBevyEntity,
  useBevyResource,
  useBevyQuery,

  // Events
  onBevyEvent,
  sendBevyEvent,

  // Cleanup
  disposeBevy,
  disposeAllBevy,

  // Utilities
  isBevySupported,
  getAllBevyInstances,
} from './hooks';

// ============================================================================
// ECS Bridge
// ============================================================================

export {
  // Signal integration
  setSignalCreator,

  // Entity bridges
  createEntityBridge,
  createComponentBridge,

  // Entity operations
  spawnEntity,
  despawnEntity,
  insertComponent,
  removeComponent,

  // Entity queries
  queryEntities,
  findEntitiesWith,
  findEntityWith,

  // Component factories
  createTransformComponent,
  createVisibilityComponent,
  createNameComponent,
  createCustomComponent,

  // Reactive tracking
  trackEntities,
  trackEntity,

  // Cleanup
  disposeAllBridges,
} from './ecs-bridge';

// ============================================================================
// Assets
// ============================================================================

export {
  // Loading
  loadBevyAsset,
  preloadAssets,
  preloadAssetsWithPriority,
  streamAsset,

  // Cache management
  getCachedAsset,
  isAssetCached,
  isAssetLoaded,
  getAssetMetadata,
  clearAsset,
  clearAssetCache,
  getCacheSize,
  getCacheCount,
  getCachedAssetPaths,

  // Watching
  watchAsset,

  // Bundles
  defineAssetBundle,
  loadAssetBundle,
  unloadAssetBundle,
  getAssetBundle,
  isBundleLoaded,
  type AssetBundle,
} from './assets';

// ============================================================================
// Components
// ============================================================================

export {
  // Main embed component
  BevyEmbed,
  createBevyEmbedElement,

  // Utility components
  BevyFullscreenButton,
  BevyPauseButton,
  BevyFPSCounter,
} from './BevyEmbed';
