/**
 * @file Unity Integration
 * @description Complete Unity WebGL build integration for PhilJS
 */

// Types
export type {
  UnityInstance,
  UnityModule,
  UnityConfig,
  UnityLoadingProgress,
  UnityEventType,
  UnityEventHandler,
  UnityEmbedProps,
  UnityInstanceWrapper,
  UnityState,
  UseUnityResult,
  UnityMessage,
  UnityCallback,
} from './types';

// Hooks
export {
  createUnityInstance,
  useUnity,
  sendMessage,
  onUnityEvent,
  registerUnityCallback,
  createUnitySignalBridge,
  createPhilJSSignalBridge,
  disposeUnity,
  getLoadingProgress,
} from './hooks';

// Components
export {
  UnityEmbed,
  createUnityEmbedElement,
  UnityProgressBar,
  UnityFullscreenButton,
} from './UnityEmbed';
