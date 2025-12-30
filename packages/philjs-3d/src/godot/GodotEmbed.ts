/**
 * @file GodotEmbed Components
 * @description Godot HTML5 export embed component for PhilJS
 */

import type { GodotEmbedProps, GodotInstance } from './types.js';
import { createGodotInstance, disposeGodot } from './hooks.js';

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
export function GodotEmbed(props: GodotEmbedProps): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.display = 'inline-block';

  if (props.className) {
    container.className = props.className;
  }

  if (props.style) {
    Object.entries(props.style).forEach(([key, value]) => {
      container.style.setProperty(key, String(value));
    });
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = props.canvasId ?? `godot-canvas-${Date.now()}`;

  const width = props.width ?? 800;
  const height = props.height ?? 600;
  const pixelRatio = props.pixelRatio ?? window.devicePixelRatio ?? 1;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  container.appendChild(canvas);

  // Show loading indicator
  const loadingDiv = document.createElement('div');
  loadingDiv.style.position = 'absolute';
  loadingDiv.style.top = '50%';
  loadingDiv.style.left = '50%';
  loadingDiv.style.transform = 'translate(-50%, -50%)';
  loadingDiv.textContent = 'Loading...';
  container.appendChild(loadingDiv);

  // Initialize Godot
  createGodotInstance(canvas, props)
    .then((instance) => {
      loadingDiv.remove();
      props.onReady?.(instance);
    })
    .catch((error) => {
      loadingDiv.textContent = `Error: ${error.message}`;
      props.onError?.(error);
    });

  return container;
}

/**
 * Create a Godot embed element (alias)
 */
export const createGodotEmbedElement = GodotEmbed;

/**
 * Loading indicator component for Godot
 */
export function GodotLoadingIndicator(props: {
  progress?: number | undefined;
  className?: string | undefined;
  style?: Record<string, string | number> | undefined;
}): HTMLDivElement {
  const div = document.createElement('div');
  div.className = props.className ?? '';

  if (props.style) {
    Object.entries(props.style).forEach(([key, value]) => {
      div.style.setProperty(key, String(value));
    });
  }

  const progress = props.progress ?? 0;
  div.innerHTML = `
    <div style="width: 200px; background: #333; border-radius: 4px; overflow: hidden;">
      <div style="width: ${progress * 100}%; height: 20px; background: #4CAF50; transition: width 0.3s;"></div>
    </div>
    <div style="text-align: center; margin-top: 8px; color: #fff;">
      ${Math.round(progress * 100)}%
    </div>
  `;

  return div;
}
