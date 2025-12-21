/**
 * @file Bevy Game Engine Types
 * @description Type definitions for Bevy WASM integration with PhilJS
 */

// ============================================================================
// Core Bevy Types
// ============================================================================

/**
 * Bevy application configuration
 */
export interface BevyConfig {
  /** Path to the Bevy WASM module */
  wasmPath: string;
  /** Path to the JavaScript bindings */
  jsPath?: string;
  /** Canvas element or selector to render to */
  canvas: HTMLCanvasElement | string;
  /** Initial window width */
  width?: number;
  /** Initial window height */
  height?: number;
  /** Pixel ratio for high-DPI displays */
  pixelRatio?: number;
  /** Enable VSync */
  vsync?: boolean;
  /** Target frames per second */
  targetFps?: number;
  /** Enable WebGL2 (recommended) */
  webgl2?: boolean;
  /** Enable audio */
  audio?: boolean;
  /** Initial assets to preload */
  preloadAssets?: string[];
  /** Custom environment variables */
  env?: Record<string, string>;
  /** Debug mode */
  debug?: boolean;
  /** Memory configuration */
  memory?: {
    initial?: number;
    maximum?: number;
  };
  /** Input configuration */
  input?: {
    keyboard?: boolean;
    mouse?: boolean;
    gamepad?: boolean;
    touch?: boolean;
  };
}

/**
 * Bevy application instance
 */
export interface BevyApp {
  /** Run the Bevy app */
  run(): Promise<void>;
  /** Pause the app */
  pause(): void;
  /** Resume the app */
  resume(): void;
  /** Check if running */
  isRunning(): boolean;
  /** Get the canvas element */
  getCanvas(): HTMLCanvasElement;
  /** Resize the canvas */
  resize(width: number, height: number): void;
  /** Set target FPS */
  setTargetFps(fps: number): void;
  /** Get current FPS */
  getFps(): number;
  /** Get delta time */
  getDeltaTime(): number;
  /** Get total elapsed time */
  getElapsedTime(): number;
  /** Dispatch a custom event */
  dispatchEvent(event: BevyEvent): void;
  /** Register event listener */
  addEventListener<T extends BevyEventType>(
    type: T,
    listener: BevyEventListener<T>
  ): () => void;
  /** Get the ECS world */
  getWorld(): BevyWorld;
  /** Dispose the app */
  dispose(): Promise<void>;
}

/**
 * Bevy instance wrapper
 */
export interface BevyInstance {
  /** The Bevy app */
  app: BevyApp;
  /** WASM module reference */
  module: WebAssembly.Module;
  /** WASM instance reference */
  instance: WebAssembly.Instance;
  /** Memory buffer */
  memory: WebAssembly.Memory;
  /** Loading state */
  state: BevyState;
  /** Error if failed */
  error?: Error;
  /** Configuration used */
  config: BevyConfig;
}

/**
 * Bevy loading state
 */
export type BevyState =
  | 'idle'
  | 'loading'
  | 'compiling'
  | 'instantiating'
  | 'initializing'
  | 'running'
  | 'paused'
  | 'error'
  | 'disposed';

// ============================================================================
// ECS Types
// ============================================================================

/**
 * Entity ID type
 */
export type EntityId = number & { readonly __brand: 'EntityId' };

/**
 * Entity generation for validation
 */
export type EntityGeneration = number & { readonly __brand: 'EntityGeneration' };

/**
 * Full entity reference with generation
 */
export interface BevyEntity {
  /** Entity ID */
  id: EntityId;
  /** Entity generation (for validation) */
  generation: EntityGeneration;
  /** Check if entity is valid */
  isValid(): boolean;
  /** Get all components */
  getComponents(): BevyComponent[];
  /** Check if has component */
  hasComponent<T extends BevyComponent>(type: ComponentType<T>): boolean;
  /** Get component by type */
  getComponent<T extends BevyComponent>(type: ComponentType<T>): T | undefined;
  /** Insert component */
  insertComponent<T extends BevyComponent>(component: T): void;
  /** Remove component */
  removeComponent<T extends BevyComponent>(type: ComponentType<T>): void;
  /** Despawn entity */
  despawn(): void;
}

/**
 * Component type constructor
 */
export type ComponentType<T extends BevyComponent = BevyComponent> = {
  new (...args: any[]): T;
  readonly componentName: string;
};

/**
 * Base component interface
 */
export interface BevyComponent {
  /** Component type name */
  readonly componentName: string;
  /** Serialize to bytes for WASM */
  toBytes(): Uint8Array;
  /** Clone the component */
  clone(): BevyComponent;
}

/**
 * Transform component
 */
export interface TransformComponent extends BevyComponent {
  componentName: 'Transform';
  translation: Vec3;
  rotation: Quat;
  scale: Vec3;
}

/**
 * Global Transform component
 */
export interface GlobalTransformComponent extends BevyComponent {
  componentName: 'GlobalTransform';
  matrix: Mat4;
}

/**
 * Visibility component
 */
export interface VisibilityComponent extends BevyComponent {
  componentName: 'Visibility';
  isVisible: boolean;
}

/**
 * Name component
 */
export interface NameComponent extends BevyComponent {
  componentName: 'Name';
  name: string;
}

/**
 * Parent component
 */
export interface ParentComponent extends BevyComponent {
  componentName: 'Parent';
  parent: EntityId;
}

/**
 * Children component
 */
export interface ChildrenComponent extends BevyComponent {
  componentName: 'Children';
  children: EntityId[];
}

// ============================================================================
// Math Types
// ============================================================================

/**
 * 2D vector
 */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * 3D vector
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 4D vector
 */
export interface Vec4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Quaternion
 */
export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * 4x4 matrix
 */
export type Mat4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

/**
 * 3x3 matrix
 */
export type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number
];

// ============================================================================
// Resource Types
// ============================================================================

/**
 * Resource type constructor
 */
export type ResourceType<T extends BevyResource = BevyResource> = {
  new (...args: any[]): T;
  readonly resourceName: string;
};

/**
 * Base resource interface
 */
export interface BevyResource {
  /** Resource type name */
  readonly resourceName: string;
  /** Serialize to bytes for WASM */
  toBytes(): Uint8Array;
}

/**
 * Time resource
 */
export interface TimeResource extends BevyResource {
  resourceName: 'Time';
  /** Delta time in seconds */
  delta: number;
  /** Delta time as Duration */
  deltaSecs: number;
  /** Elapsed time since startup */
  elapsed: number;
  /** Elapsed time in seconds */
  elapsedSecs: number;
}

/**
 * Input resource
 */
export interface InputResource extends BevyResource {
  resourceName: 'Input';
  /** Pressed keys */
  pressedKeys: Set<string>;
  /** Just pressed keys */
  justPressedKeys: Set<string>;
  /** Just released keys */
  justReleasedKeys: Set<string>;
  /** Mouse position */
  mousePosition: Vec2;
  /** Mouse buttons */
  mouseButtons: Set<number>;
  /** Mouse delta */
  mouseDelta: Vec2;
  /** Mouse wheel delta */
  mouseWheelDelta: Vec2;
  /** Gamepad states */
  gamepads: Map<number, GamepadState>;
}

/**
 * Gamepad state
 */
export interface GamepadState {
  /** Gamepad ID */
  id: number;
  /** Is connected */
  connected: boolean;
  /** Button states (0-1) */
  buttons: number[];
  /** Axis values (-1 to 1) */
  axes: number[];
}

/**
 * Window resource
 */
export interface WindowResource extends BevyResource {
  resourceName: 'Window';
  /** Window width */
  width: number;
  /** Window height */
  height: number;
  /** Physical width */
  physicalWidth: number;
  /** Physical height */
  physicalHeight: number;
  /** Scale factor */
  scaleFactor: number;
  /** Is focused */
  focused: boolean;
  /** Cursor visible */
  cursorVisible: boolean;
  /** Cursor grabbed */
  cursorGrabbed: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Event type names
 */
export type BevyEventType =
  | 'ready'
  | 'error'
  | 'resize'
  | 'focus'
  | 'blur'
  | 'pause'
  | 'resume'
  | 'frame'
  | 'asset-loaded'
  | 'asset-error'
  | 'entity-spawned'
  | 'entity-despawned'
  | 'component-added'
  | 'component-removed'
  | 'custom';

/**
 * Base event interface
 */
export interface BevyEvent<T extends BevyEventType = BevyEventType> {
  /** Event type */
  type: T;
  /** Event timestamp */
  timestamp: number;
  /** Event data */
  data?: BevyEventData<T>;
}

/**
 * Event data mapping
 */
export type BevyEventData<T extends BevyEventType> =
  T extends 'ready' ? { app: BevyApp } :
  T extends 'error' ? { error: Error } :
  T extends 'resize' ? { width: number; height: number } :
  T extends 'focus' ? {} :
  T extends 'blur' ? {} :
  T extends 'pause' ? {} :
  T extends 'resume' ? {} :
  T extends 'frame' ? { delta: number; elapsed: number; fps: number } :
  T extends 'asset-loaded' ? { path: string; type: string } :
  T extends 'asset-error' ? { path: string; error: Error } :
  T extends 'entity-spawned' ? { entity: BevyEntity } :
  T extends 'entity-despawned' ? { entityId: EntityId } :
  T extends 'component-added' ? { entity: BevyEntity; component: string } :
  T extends 'component-removed' ? { entity: BevyEntity; component: string } :
  T extends 'custom' ? Record<string, unknown> :
  never;

/**
 * Event listener type
 */
export type BevyEventListener<T extends BevyEventType = BevyEventType> = (
  event: BevyEvent<T>
) => void;

// ============================================================================
// Query Types
// ============================================================================

/**
 * Query filter types
 */
export type QueryFilter =
  | { type: 'with'; component: string }
  | { type: 'without'; component: string }
  | { type: 'changed'; component: string }
  | { type: 'added'; component: string };

/**
 * Query descriptor
 */
export interface BevyQuery<T extends BevyComponent[] = BevyComponent[]> {
  /** Components to fetch */
  components: string[];
  /** Optional filters */
  filters?: QueryFilter[];
  /** Optional flag for immutable access */
  readonly?: boolean;
}

/**
 * Query result
 */
export interface QueryResult<T extends BevyComponent[] = BevyComponent[]> {
  /** Entities matching the query */
  entities: BevyEntity[];
  /** Iterate over results */
  iter(): IterableIterator<[BevyEntity, ...T]>;
  /** Get first result */
  single(): [BevyEntity, ...T] | undefined;
  /** Get count */
  count(): number;
  /** Check if empty */
  isEmpty(): boolean;
  /** Map over results */
  map<R>(fn: (entity: BevyEntity, ...components: T) => R): R[];
  /** Filter results */
  filter(fn: (entity: BevyEntity, ...components: T) => boolean): QueryResult<T>;
  /** For each */
  forEach(fn: (entity: BevyEntity, ...components: T) => void): void;
}

// ============================================================================
// World Types
// ============================================================================

/**
 * Bevy ECS World
 */
export interface BevyWorld {
  /** Spawn a new entity */
  spawn(): BevyEntity;
  /** Spawn with components */
  spawnBundle<T extends BevyComponent[]>(...components: T): BevyEntity;
  /** Get entity by ID */
  getEntity(id: EntityId): BevyEntity | undefined;
  /** Despawn entity */
  despawn(entity: BevyEntity): void;
  /** Query entities */
  query<T extends BevyComponent[]>(query: BevyQuery<T>): QueryResult<T>;
  /** Get resource */
  getResource<T extends BevyResource>(type: ResourceType<T>): T | undefined;
  /** Insert resource */
  insertResource<T extends BevyResource>(resource: T): void;
  /** Remove resource */
  removeResource<T extends BevyResource>(type: ResourceType<T>): void;
  /** Check if resource exists */
  hasResource<T extends BevyResource>(type: ResourceType<T>): boolean;
  /** Clear all entities */
  clear(): void;
  /** Get entity count */
  entityCount(): number;
}

// ============================================================================
// Asset Types
// ============================================================================

/**
 * Asset loading state
 */
export type AssetState = 'pending' | 'loading' | 'loaded' | 'error';

/**
 * Asset handle
 */
export interface AssetHandle<T = unknown> {
  /** Asset path */
  path: string;
  /** Asset type */
  type: string;
  /** Loading state */
  state: AssetState;
  /** The loaded asset */
  asset?: T;
  /** Error if loading failed */
  error?: Error;
  /** Is loaded */
  isLoaded(): boolean;
  /** Wait for load */
  wait(): Promise<T>;
}

/**
 * Supported asset types
 */
export type BevyAssetType =
  | 'texture'
  | 'audio'
  | 'mesh'
  | 'font'
  | 'scene'
  | 'shader'
  | 'material'
  | 'animation'
  | 'binary';

/**
 * Asset metadata
 */
export interface AssetMetadata {
  /** Asset path */
  path: string;
  /** Asset type */
  type: BevyAssetType;
  /** File size in bytes */
  size?: number;
  /** Last modified timestamp */
  lastModified?: number;
  /** Custom metadata */
  meta?: Record<string, unknown>;
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Keyboard key codes (subset)
 */
export type KeyCode =
  | 'KeyA' | 'KeyB' | 'KeyC' | 'KeyD' | 'KeyE' | 'KeyF' | 'KeyG' | 'KeyH'
  | 'KeyI' | 'KeyJ' | 'KeyK' | 'KeyL' | 'KeyM' | 'KeyN' | 'KeyO' | 'KeyP'
  | 'KeyQ' | 'KeyR' | 'KeyS' | 'KeyT' | 'KeyU' | 'KeyV' | 'KeyW' | 'KeyX'
  | 'KeyY' | 'KeyZ'
  | 'Digit0' | 'Digit1' | 'Digit2' | 'Digit3' | 'Digit4'
  | 'Digit5' | 'Digit6' | 'Digit7' | 'Digit8' | 'Digit9'
  | 'Space' | 'Enter' | 'Escape' | 'Tab' | 'Backspace'
  | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
  | 'ShiftLeft' | 'ShiftRight' | 'ControlLeft' | 'ControlRight'
  | 'AltLeft' | 'AltRight' | 'MetaLeft' | 'MetaRight'
  | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6'
  | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12';

/**
 * Mouse button codes
 */
export type MouseButton = 'Left' | 'Right' | 'Middle' | 'Back' | 'Forward';

/**
 * Gamepad button codes
 */
export type GamepadButton =
  | 'South' | 'East' | 'North' | 'West'
  | 'LeftTrigger' | 'LeftTrigger2' | 'RightTrigger' | 'RightTrigger2'
  | 'Select' | 'Start' | 'Mode'
  | 'LeftThumb' | 'RightThumb'
  | 'DPadUp' | 'DPadDown' | 'DPadLeft' | 'DPadRight';

/**
 * Gamepad axis codes
 */
export type GamepadAxis =
  | 'LeftStickX' | 'LeftStickY'
  | 'RightStickX' | 'RightStickY'
  | 'LeftZ' | 'RightZ';

// ============================================================================
// Embed Component Props
// ============================================================================

/**
 * BevyEmbed component props
 */
export interface BevyEmbedProps {
  /** Path to WASM module */
  wasmPath: string;
  /** Path to JS bindings */
  jsPath?: string;
  /** Canvas width */
  width?: number | string;
  /** Canvas height */
  height?: number | string;
  /** CSS class name */
  className?: string;
  /** CSS style */
  style?: Record<string, string | number>;
  /** Pixel ratio */
  pixelRatio?: number;
  /** Auto-resize with container */
  autoResize?: boolean;
  /** Enable keyboard input */
  keyboard?: boolean;
  /** Enable mouse input */
  mouse?: boolean;
  /** Enable gamepad input */
  gamepad?: boolean;
  /** Enable touch input */
  touch?: boolean;
  /** Enable audio */
  audio?: boolean;
  /** Target FPS */
  targetFps?: number;
  /** Debug mode */
  debug?: boolean;
  /** Assets to preload */
  preloadAssets?: string[];
  /** Called when Bevy is ready */
  onReady?: (instance: BevyInstance) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Called on resize */
  onResize?: (width: number, height: number) => void;
  /** Custom loading component */
  loadingComponent?: () => HTMLElement | null;
  /** Custom error component */
  errorComponent?: (error: Error) => HTMLElement | null;
}

/**
 * UseBevy hook result
 */
export interface UseBevyResult {
  /** Bevy instance */
  instance: BevyInstance | null;
  /** Loading state */
  state: BevyState;
  /** Error if any */
  error: Error | null;
  /** Is ready */
  isReady: boolean;
  /** Is loading */
  isLoading: boolean;
  /** Pause the app */
  pause: () => void;
  /** Resume the app */
  resume: () => void;
  /** Restart the app */
  restart: () => Promise<void>;
}

/**
 * UseBevyEntity hook result
 */
export interface UseBevyEntityResult {
  /** The entity */
  entity: BevyEntity | null;
  /** Is entity valid */
  isValid: boolean;
  /** Get component */
  getComponent: <T extends BevyComponent>(type: ComponentType<T>) => T | undefined;
  /** Has component */
  hasComponent: <T extends BevyComponent>(type: ComponentType<T>) => boolean;
  /** Insert component */
  insertComponent: <T extends BevyComponent>(component: T) => void;
  /** Remove component */
  removeComponent: <T extends BevyComponent>(type: ComponentType<T>) => void;
  /** Despawn entity */
  despawn: () => void;
}

/**
 * UseBevyResource hook result
 */
export interface UseBevyResourceResult<T extends BevyResource> {
  /** The resource */
  resource: T | null;
  /** Is resource available */
  isAvailable: boolean;
  /** Update resource */
  update: (updates: Partial<T>) => void;
  /** Remove resource */
  remove: () => void;
}

/**
 * UseBevyQuery hook result
 */
export interface UseBevyQueryResult<T extends BevyComponent[]> {
  /** Query results */
  results: QueryResult<T> | null;
  /** Number of results */
  count: number;
  /** Is empty */
  isEmpty: boolean;
  /** Refresh query */
  refresh: () => void;
}

// ============================================================================
// Bridge Types
// ============================================================================

/**
 * Entity bridge for syncing with PhilJS signals
 */
export interface EntityBridge {
  /** Entity being bridged */
  entity: BevyEntity;
  /** Synced components */
  components: Map<string, BevyComponent>;
  /** Subscribe to changes */
  subscribe(callback: (entity: BevyEntity) => void): () => void;
  /** Update from JS */
  update<T extends BevyComponent>(component: T): void;
  /** Dispose bridge */
  dispose(): void;
}

/**
 * Component bridge for syncing with PhilJS signals
 */
export interface ComponentBridge<T extends BevyComponent> {
  /** Component type */
  componentType: ComponentType<T>;
  /** Current value */
  value: T | null;
  /** Subscribe to changes */
  subscribe(callback: (component: T | null) => void): () => void;
  /** Update from JS */
  update(updates: Partial<T>): void;
  /** Dispose bridge */
  dispose(): void;
}
