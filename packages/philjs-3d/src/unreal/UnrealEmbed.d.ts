/**
 * @file UnrealEmbed Components
 * @description Unreal Engine Pixel Streaming embed component for PhilJS
 */
import type { UnrealEmbedProps, PixelStreamingInstance } from './types.js';
/**
 * Create an Unreal Engine Pixel Streaming embed element
 *
 * @param props - Unreal embed properties
 * @returns HTMLElement containing the video stream
 *
 * @example
 * ```ts
 * const embed = UnrealEmbed({
 *   serverUrl: 'ws://localhost:8080',
 *   width: 1920,
 *   height: 1080,
 *   onReady: (instance) => {
 *     console.log('Connected to Unreal Engine!');
 *   },
 * });
 * document.body.appendChild(embed);
 * ```
 */
export declare function UnrealEmbed(props: UnrealEmbedProps): HTMLElement;
/**
 * Create an Unreal embed element (alias)
 */
export declare const createUnrealEmbedElement: typeof UnrealEmbed;
/**
 * Stats overlay component for Unreal Pixel Streaming
 */
export declare function UnrealStatsOverlay(props: {
    instance: PixelStreamingInstance;
    className?: string | undefined;
    style?: Record<string, string | number> | undefined;
    updateInterval?: number | undefined;
}): HTMLDivElement;
//# sourceMappingURL=UnrealEmbed.d.ts.map