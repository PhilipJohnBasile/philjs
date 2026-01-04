/**
 * @file Godot Hooks
 * @description PhilJS hooks for Godot HTML5 export integration
 */
import type { GodotEngine, GodotJSInterface, GodotInstance, UseGodotResult, SignalHandler, GodotEmbedProps } from './types.js';
declare global {
    interface Window {
        Engine?: new () => GodotEngine;
        godot?: GodotJSInterface;
    }
}
/**
 * Create a Godot instance
 */
export declare function createGodotInstance(canvas: HTMLCanvasElement, props: GodotEmbedProps): Promise<GodotInstance>;
/**
 * Hook to use Godot instance
 */
export declare function useGodot(canvas: HTMLCanvasElement | null): UseGodotResult;
/**
 * Call a method on a Godot node
 */
export declare function callGodot(canvas: HTMLCanvasElement, nodePath: string, method: string, ...args: unknown[]): unknown;
/**
 * Subscribe to a Godot signal
 */
export declare function onGodotSignal(canvas: HTMLCanvasElement, nodePath: string, signal: string, callback: SignalHandler): () => void;
/**
 * Cleanup Godot instance
 */
export declare function disposeGodot(canvas: HTMLCanvasElement): void;
/**
 * Sync PhilJS signal to Godot property
 */
export declare function syncToGodot<T>(canvas: HTMLCanvasElement, nodePath: string, property: string, getValue: () => T): () => void;
/**
 * Sync Godot signal to PhilJS signal
 */
export declare function syncFromGodot<T>(canvas: HTMLCanvasElement, nodePath: string, signal: string, setValue: (value: T) => void): () => void;
/**
 * Bidirectional sync between PhilJS and Godot
 */
export declare function createGodotBridge<T>(canvas: HTMLCanvasElement, nodePath: string, options: {
    property?: string;
    signal?: string;
    getValue: () => T;
    setValue: (value: T) => void;
}): () => void;
//# sourceMappingURL=hooks.d.ts.map