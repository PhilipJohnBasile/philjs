/**
 * @file Unity Integration
 * @description Complete Unity WebGL build integration for PhilJS
 */
export type { UnityInstance, UnityModule, UnityConfig, UnityLoadingProgress, UnityEventType, UnityEventHandler, UnityEmbedProps, UnityInstanceWrapper, UnityState, UseUnityResult, UnityMessage, UnityCallback, } from './types.js';
export { createUnityInstance, useUnity, sendMessage, onUnityEvent, registerUnityCallback, createUnitySignalBridge, createPhilJSSignalBridge, disposeUnity, getLoadingProgress, } from './hooks.js';
export { UnityEmbed, createUnityEmbedElement, UnityProgressBar, UnityFullscreenButton, } from './UnityEmbed.js';
//# sourceMappingURL=index.d.ts.map