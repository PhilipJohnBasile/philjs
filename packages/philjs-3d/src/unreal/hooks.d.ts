/**
 * @file Unreal Engine Hooks
 * @description PhilJS hooks for Unreal Engine Pixel Streaming integration
 */
import type { PixelStreamingInstance, UseUnrealResult, UnrealEmbedProps } from './types.js';
/**
 * Create a Pixel Streaming instance
 */
export declare function createPixelStreamingInstance(video: HTMLVideoElement, props: UnrealEmbedProps): Promise<PixelStreamingInstance>;
/**
 * Hook to use Unreal Pixel Streaming
 */
export declare function useUnreal(video: HTMLVideoElement | null): UseUnrealResult;
/**
 * Setup input forwarding for Pixel Streaming
 */
export declare function setupInputForwarding(video: HTMLVideoElement, instance: PixelStreamingInstance): () => void;
/**
 * Cleanup Unreal instance
 */
export declare function disposeUnreal(video: HTMLVideoElement): void;
//# sourceMappingURL=hooks.d.ts.map