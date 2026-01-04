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
export type { BevyConfig, BevyApp, BevyInstance, BevyState, EntityId, EntityGeneration, BevyEntity, ComponentType, BevyComponent, TransformComponent, GlobalTransformComponent, VisibilityComponent, NameComponent, ParentComponent, ChildrenComponent, Vec2, Vec3, Vec4, Quat, Mat3, Mat4, ResourceType, BevyResource, TimeResource, InputResource, GamepadState, WindowResource, BevyEventType, BevyEvent, BevyEventData, BevyEventListener, QueryFilter, BevyQuery, QueryResult, BevyWorld, AssetState, AssetHandle, BevyAssetType, AssetMetadata, KeyCode, MouseButton, GamepadButton, GamepadAxis, BevyEmbedProps, UseBevyResult, UseBevyEntityResult, UseBevyResourceResult, UseBevyQueryResult, EntityBridge, ComponentBridge, } from './types.js';
export { createBevyInstance, getBevy, useBevy, useBevyEntity, useBevyResource, useBevyQuery, onBevyEvent, sendBevyEvent, disposeBevy, disposeAllBevy, isBevySupported, getAllBevyInstances, } from './hooks.js';
export { setSignalCreator, createEntityBridge, createComponentBridge, spawnEntity, despawnEntity, insertComponent, removeComponent, queryEntities, findEntitiesWith, findEntityWith, createTransformComponent, createVisibilityComponent, createNameComponent, createCustomComponent, trackEntities, trackEntity, disposeAllBridges, } from './ecs-bridge.js';
export { loadBevyAsset, preloadAssets, preloadAssetsWithPriority, streamAsset, getCachedAsset, isAssetCached, isAssetLoaded, getAssetMetadata, clearAsset, clearAssetCache, getCacheSize, getCacheCount, getCachedAssetPaths, watchAsset, defineAssetBundle, loadAssetBundle, unloadAssetBundle, getAssetBundle, isBundleLoaded, type AssetBundle, } from './assets.js';
export { BevyEmbed, createBevyEmbedElement, BevyFullscreenButton, BevyPauseButton, BevyFPSCounter, } from './BevyEmbed.js';
//# sourceMappingURL=index.d.ts.map