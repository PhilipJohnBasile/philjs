/**
 * @file Three.js Integration
 * @description Complete Three.js integration for PhilJS
 */

// Types
export type {
  ThreeModule,
  ThreeScene,
  ThreeObject3D,
  ThreeCamera,
  ThreePerspectiveCamera,
  ThreeOrthographicCamera,
  ThreeRendererOptions,
  ThreeRenderer,
  ThreeClock,
  ThreeVector3,
  ThreeQuaternion,
  ThreeEuler,
  ThreeColor,
  ThreeTexture,
  ThreeTextureLoader,
  ThreeGLTFLoader,
  ThreeGLTF,
  ThreeCanvasProps,
  ThreeState,
  FrameInfo,
  LoaderResult,
} from './types.js';

// Hooks
export {
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
  setCameraPosition,
  setCameraLookAt,
} from './hooks.js';

// Components
export { ThreeCanvas, createThreeCanvasElement } from './ThreeCanvas.js';
