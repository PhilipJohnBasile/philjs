/**
 * @file UnityEmbed Components
 * @description Unity WebGL embed component for PhilJS
 */
import type { UnityEmbedProps, UnityInstanceWrapper } from './types.js';
/**
 * Create a Unity embed element
 *
 * @param props - Unity embed properties
 * @returns HTMLElement containing the Unity canvas
 *
 * @example
 * ```ts
 * const embed = UnityEmbed({
 *   buildUrl: '/Build',
 *   width: 1280,
 *   height: 720,
 *   onReady: (wrapper) => {
 *     wrapper.sendMessage('GameManager', 'StartGame');
 *   },
 * });
 * document.body.appendChild(embed);
 * ```
 */
export declare function UnityEmbed(props: UnityEmbedProps): HTMLElement;
/**
 * Create a Unity embed element (alias)
 */
export declare const createUnityEmbedElement: typeof UnityEmbed;
/**
 * Unity progress bar component
 */
export declare function UnityProgressBar(props: {
    className?: string | undefined;
    style?: Record<string, string | number> | undefined;
}): HTMLDivElement;
/**
 * Unity fullscreen button component
 */
export declare function UnityFullscreenButton(props: {
    wrapper: UnityInstanceWrapper;
    className?: string | undefined;
    style?: Record<string, string | number> | undefined;
}): HTMLButtonElement;
//# sourceMappingURL=UnityEmbed.d.ts.map