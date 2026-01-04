/**
 * @file BevyEmbed Components
 * @description Bevy embed component and utilities for PhilJS
 */
import type { BevyEmbedProps } from './types.js';
/**
 * Create a Bevy embed element
 *
 * @param props - Bevy embed properties
 * @returns HTMLElement containing the Bevy canvas
 *
 * @example
 * ```ts
 * const embed = BevyEmbed({
 *   wasmPath: '/game.wasm',
 *   width: 1280,
 *   height: 720,
 *   onReady: (instance) => {
 *     console.log('Game ready!');
 *   },
 * });
 * document.body.appendChild(embed);
 * ```
 */
export declare function BevyEmbed(props: BevyEmbedProps): HTMLElement;
/**
 * Create a Bevy embed element (alias for BevyEmbed)
 */
export declare const createBevyEmbedElement: typeof BevyEmbed;
/**
 * Create a fullscreen toggle button for Bevy
 */
export declare function BevyFullscreenButton(props: {
    canvasOrKey?: HTMLCanvasElement | string;
    className?: string | undefined;
    style?: Record<string, string | number> | undefined;
}): HTMLButtonElement;
/**
 * Create a pause/resume button for Bevy
 */
export declare function BevyPauseButton(props: {
    canvasOrKey?: HTMLCanvasElement | string;
    className?: string | undefined;
    style?: Record<string, string | number> | undefined;
}): HTMLButtonElement;
/**
 * Create an FPS counter display for Bevy
 */
export declare function BevyFPSCounter(props: {
    canvasOrKey?: HTMLCanvasElement | string;
    className?: string | undefined;
    style?: Record<string, string | number> | undefined;
    updateInterval?: number | undefined;
}): HTMLDivElement;
//# sourceMappingURL=BevyEmbed.d.ts.map