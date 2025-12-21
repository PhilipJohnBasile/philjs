/**
 * @file PhilJS 3D - WebGL and Game Engine Integrations
 * @description Complete 3D graphics and game engine integration for PhilJS
 *
 * This package provides:
 * - WebGL integration with shaders, buffers, textures, and primitives
 * - Three.js integration with hooks and components
 * - Godot HTML5 export embedding
 * - Unreal Engine Pixel Streaming support
 * - Unity WebGL build embedding
 * - Bevy WASM game engine integration (PhilJS exclusive!)
 *
 * @example
 * // WebGL
 * import { createWebGLContext, createCube, createCamera } from 'philjs-3d/webgl';
 *
 * // Three.js
 * import { useThree, useFrame, ThreeCanvas } from 'philjs-3d/three';
 *
 * // Godot
 * import { GodotEmbed, useGodot, callGodot } from 'philjs-3d/godot';
 *
 * // Unreal
 * import { UnrealEmbed, useUnreal } from 'philjs-3d/unreal';
 *
 * // Unity
 * import { UnityEmbed, useUnity, sendMessage } from 'philjs-3d/unity';
 *
 * // Bevy (Rust game engine - PhilJS exclusive!)
 * import { BevyEmbed, useBevy, spawnEntity, createTransformComponent } from 'philjs-3d/bevy';
 */

// ============================================================================
// WebGL Integration
// ============================================================================

export {
  // Types
  type WebGLContextOptions,
  type WebGLContextResult,
  type WebGLExtensions,
  type ShaderProgram,
  type ShaderSource,
  type BufferInfo,
  type VertexArrayInfo,
  type TextureInfo,
  type TextureOptions,
  type Camera,
  type CameraOptions,
  type Transform,
  type PrimitiveGeometry,
  type AnimationFrameInfo,
  type AnimationLoop,
  type WebGLState,
  type WebGLCanvasProps,
  type WebGLHookContext,

  // Context
  createWebGLContext,
  isWebGLSupported,
  isWebGL2Supported,
  getWebGLCapabilities,
  resizeCanvas,
  clearContext,
  enableDefaultFeatures,

  // Shaders
  compileShader,
  createProgram,
  useProgram,
  deleteProgram,
  setUniform,
  setUniforms,
  BASIC_VERTEX_SHADER,
  BASIC_FRAGMENT_SHADER,
  UNLIT_VERTEX_SHADER,
  UNLIT_FRAGMENT_SHADER,
  TEXTURED_VERTEX_SHADER,
  TEXTURED_FRAGMENT_SHADER,

  // Buffers
  createBuffer,
  createBufferInfo,
  updateBuffer,
  deleteBuffer,
  createVertexArray,
  bindVertexArray,
  deleteVertexArray,
  createVertexArrayInfo,
  setupVertexAttributes,
  drawVertexArray,
  deleteVertexArrayInfo,

  // Textures
  createTextureFromImage,
  loadTexture,
  createPlaceholderTexture,
  createDataTexture,
  createCubemapTexture,
  updateTexture,
  bindTexture,
  unbindTexture,
  deleteTexture,

  // Camera and Math
  mat4Identity,
  mat4Multiply,
  mat4Perspective,
  mat4Orthographic,
  mat4LookAt,
  mat4Translate,
  mat4RotateX,
  mat4RotateY,
  mat4RotateZ,
  mat4Scale,
  mat4Invert,
  mat4Transpose,
  mat3FromMat4,
  mat3InvertTranspose,
  createCamera,
  updateCameraView,
  updateCameraProjection,
  setCameraPosition,
  setCameraTarget,
  setCameraAspect,
  orbitCamera,
  zoomCamera,
  getViewProjectionMatrix,

  // Primitives
  createCube,
  createSphere,
  createPlane,
  createCylinder,
  createCone,
  createTorus,
  createRoundedBox,
  mergeGeometries,
  transformGeometry,

  // Animation
  createAnimationLoop,
  createFixedTimestepLoop,
  createAnimator,
  Easing,
  lerp,
  lerpVec3,
  slerp,
  type FrameCallback,

  // Hooks
  useWebGL,
  useAnimationFrame,
  useShaderProgram,
  useActiveProgram,
  useUniforms,
  useCamera,
  useAutoResize,
  useRenderPass,
  cleanupWebGL,

  // Components
  WebGLCanvas,
  createWebGLCanvasElement,
} from './webgl/index';

// ============================================================================
// Three.js Integration
// ============================================================================

export {
  // Types
  type ThreeModule,
  type ThreeScene,
  type ThreeObject3D,
  type ThreeCamera,
  type ThreePerspectiveCamera,
  type ThreeOrthographicCamera,
  type ThreeRendererOptions,
  type ThreeRenderer,
  type ThreeClock,
  type ThreeVector3,
  type ThreeQuaternion,
  type ThreeEuler,
  type ThreeColor,
  type ThreeTexture,
  type ThreeTextureLoader,
  type ThreeGLTFLoader,
  type ThreeGLTF,
  type ThreeCanvasProps,
  type ThreeState,
  type FrameInfo,
  type LoaderResult,

  // Hooks
  loadThree,
  getThree,
  useThree,
  initThree,
  useFrame,
  removeFrameCallback,
  startAnimationLoop,
  useLoader,
  loadTextureAsync,
  loadGLTFAsync,
  resizeThree,
  disposeThree,
  addToScene,
  removeFromScene,
  setCameraPosition as setThreeCameraPosition,
  setCameraLookAt,

  // Components
  ThreeCanvas,
  createThreeCanvasElement,
} from './three/index';

// ============================================================================
// Godot Integration
// ============================================================================

export {
  // Types
  type GodotEngine,
  type GodotConfig,
  type GodotJSInterface,
  type GodotInstance,
  type GodotState,
  type GodotEmbedProps,
  type UseGodotResult,
  type SignalHandler,

  // Hooks
  createGodotInstance,
  useGodot,
  callGodot,
  onGodotSignal,
  disposeGodot,
  syncToGodot,
  syncFromGodot,
  createGodotBridge,

  // Components
  GodotEmbed,
  createGodotEmbedElement,
  GodotLoadingIndicator,
} from './godot/index';

// ============================================================================
// Unreal Engine Integration
// ============================================================================

export {
  // Types
  type PixelStreamingConfig,
  type WebRTCStats,
  type PixelStreamingInputEvent,
  type KeyboardInputData,
  type MouseInputData,
  type TouchInputData,
  type GamepadInputData,
  type ConsoleCommandOptions,
  type UnrealCustomEvent,
  type PixelStreamingInstance,
  type UnrealEmbedProps,
  type UnrealState,
  type UseUnrealResult,

  // Hooks
  createPixelStreamingInstance,
  useUnreal,
  setupInputForwarding,
  disposeUnreal,

  // Components
  UnrealEmbed,
  createUnrealEmbedElement,
  UnrealStatsOverlay,
} from './unreal/index';

// ============================================================================
// Unity Integration
// ============================================================================

export {
  // Types
  type UnityInstance,
  type UnityModule,
  type UnityConfig,
  type UnityLoadingProgress,
  type UnityEventType,
  type UnityEventHandler,
  type UnityEmbedProps,
  type UnityInstanceWrapper,
  type UnityState,
  type UseUnityResult,
  type UnityMessage,
  type UnityCallback,

  // Hooks
  createUnityInstance,
  useUnity,
  sendMessage,
  onUnityEvent,
  registerUnityCallback,
  createUnitySignalBridge,
  createPhilJSSignalBridge,
  disposeUnity,
  getLoadingProgress,

  // Components
  UnityEmbed,
  createUnityEmbedElement,
  UnityProgressBar,
  UnityFullscreenButton,
} from './unity/index';

// ============================================================================
// Bevy Integration (PhilJS Exclusive!)
// ============================================================================

export {
  // Types
  type BevyConfig,
  type BevyApp,
  type BevyInstance,
  type BevyState,
  type EntityId,
  type EntityGeneration,
  type BevyEntity,
  type ComponentType,
  type BevyComponent,
  type TransformComponent,
  type GlobalTransformComponent,
  type VisibilityComponent,
  type NameComponent,
  type ParentComponent,
  type ChildrenComponent,
  type Vec2,
  type Vec3,
  type Vec4,
  type Quat,
  type Mat3,
  type Mat4,
  type ResourceType,
  type BevyResource,
  type TimeResource,
  type InputResource,
  type GamepadState as BevyGamepadState,
  type WindowResource,
  type BevyEventType,
  type BevyEvent,
  type BevyEventData,
  type BevyEventListener,
  type QueryFilter,
  type BevyQuery,
  type QueryResult,
  type BevyWorld,
  type AssetState,
  type AssetHandle,
  type BevyAssetType,
  type AssetMetadata,
  type KeyCode,
  type MouseButton as BevyMouseButton,
  type GamepadButton,
  type GamepadAxis,
  type BevyEmbedProps,
  type UseBevyResult,
  type UseBevyEntityResult,
  type UseBevyResourceResult,
  type UseBevyQueryResult,
  type EntityBridge,
  type ComponentBridge,
  type AssetBundle,

  // Hooks
  createBevyInstance,
  getBevy,
  useBevy,
  useBevyEntity,
  useBevyResource,
  useBevyQuery,
  onBevyEvent,
  sendBevyEvent,
  disposeBevy,
  disposeAllBevy,
  isBevySupported,
  getAllBevyInstances,

  // ECS Bridge
  setSignalCreator,
  createEntityBridge,
  createComponentBridge,
  spawnEntity,
  despawnEntity,
  insertComponent,
  removeComponent,
  queryEntities,
  findEntitiesWith,
  findEntityWith,
  createTransformComponent,
  createVisibilityComponent,
  createNameComponent,
  createCustomComponent,
  trackEntities,
  trackEntity,
  disposeAllBridges,

  // Assets
  loadBevyAsset,
  preloadAssets,
  preloadAssetsWithPriority,
  streamAsset,
  getCachedAsset,
  isAssetCached,
  isAssetLoaded,
  getAssetMetadata,
  clearAsset,
  clearAssetCache,
  getCacheSize,
  getCacheCount,
  getCachedAssetPaths,
  watchAsset,
  defineAssetBundle,
  loadAssetBundle,
  unloadAssetBundle,
  getAssetBundle,
  isBundleLoaded,

  // Components
  BevyEmbed,
  createBevyEmbedElement,
  BevyFullscreenButton,
  BevyPauseButton,
  BevyFPSCounter,
} from './bevy/index';
