/**
 * @file GodotEmbed Components
 * @description Godot HTML5 export embed component for PhilJS
 */
import type { GodotEmbedProps } from './types.js';
/**
 * Create a Godot embed element
 *
 * @param props - Godot embed properties
 * @returns HTMLElement containing the Godot canvas
 *
 * @example
 * ```ts
 * const embed = GodotEmbed({
 *   exportPath: '/game.pck',
 *   width: 1280,
 *   height: 720,
 *   onReady: (instance) => {
 *     console.log('Game ready!');
 *   },
 * });
 * document.body.appendChild(embed);
 * ```
 */
export declare function GodotEmbed(props: GodotEmbedProps): HTMLElement;
/**
 * Create a Godot embed element (alias)
 */
export declare const createGodotEmbedElement: typeof GodotEmbed;
/**
 * Loading indicator component for Godot
 */
export declare function GodotLoadingIndicator(props: {
    progress?: number | undefined;
    className?: string | undefined;
    style?: Record<string, string | number> | undefined;
}): HTMLDivElement;
//# sourceMappingURL=GodotEmbed.d.ts.map