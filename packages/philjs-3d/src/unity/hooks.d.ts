/**
 * @file Unity Hooks
 * @description PhilJS hooks for Unity WebGL build integration
 */
import type { UnityInstance, UnityConfig, UnityLoadingProgress, UnityInstanceWrapper, UseUnityResult, UnityEventType, UnityEventHandler, UnityEmbedProps } from './types.js';
declare global {
    interface Window {
        createUnityInstance?: (canvas: HTMLCanvasElement, config: UnityConfig, onProgress?: (progress: number) => void) => Promise<UnityInstance>;
        unityInstance?: UnityInstance;
    }
}
/**
 * Create a Unity instance
 */
export declare function createUnityInstance(canvas: HTMLCanvasElement, props: UnityEmbedProps): Promise<UnityInstanceWrapper>;
/**
 * Hook to use Unity instance
 */
export declare function useUnity(canvas: HTMLCanvasElement | null): UseUnityResult;
/**
 * Send message to Unity
 */
export declare function sendMessage(canvas: HTMLCanvasElement, gameObject: string, method: string, param?: string | number): void;
/**
 * Register Unity event callback
 * This is called from Unity to send messages to JavaScript
 */
export declare function onUnityEvent(canvas: HTMLCanvasElement, event: UnityEventType, handler: UnityEventHandler): () => void;
/**
 * Register a global callback that Unity can call
 */
export declare function registerUnityCallback(name: string, handler: (...args: unknown[]) => void): () => void;
/**
 * Unity-to-PhilJS signal bridge
 * Creates a callback that Unity can call to update a PhilJS signal
 */
export declare function createUnitySignalBridge<T>(callbackName: string, setValue: (value: T) => void): () => void;
/**
 * PhilJS-to-Unity signal bridge
 * Watches a PhilJS signal and sends updates to Unity
 */
export declare function createPhilJSSignalBridge<T>(canvas: HTMLCanvasElement, gameObject: string, method: string, getValue: () => T): () => void;
/**
 * Cleanup Unity instance
 */
export declare function disposeUnity(canvas: HTMLCanvasElement): Promise<void>;
/**
 * Get loading progress component props
 */
export declare function getLoadingProgress(canvas: HTMLCanvasElement): UnityLoadingProgress;
//# sourceMappingURL=hooks.d.ts.map