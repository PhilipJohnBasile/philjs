/**
 * @file UnityEmbed Components
 * @description Unity WebGL embed component for PhilJS
 */

import type { UnityEmbedProps, UnityInstanceWrapper, UnityLoadingProgress } from './types.js';
import { createUnityInstance as createUnityInstanceHook, disposeUnity, getLoadingProgress } from './hooks.js';

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
export function UnityEmbed(props: UnityEmbedProps): HTMLElement {
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
  canvas.id = props.canvasId ?? `unity-canvas-${Date.now()}`;

  const width = props.width ?? 960;
  const height = props.height ?? 600;
  const pixelRatio = props.pixelRatio ?? window.devicePixelRatio ?? 1;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.tabIndex = -1; // Make focusable for input

  container.appendChild(canvas);

  // Create progress bar
  const progressBar = UnityProgressBar({});
  progressBar.style.position = 'absolute';
  progressBar.style.top = '50%';
  progressBar.style.left = '50%';
  progressBar.style.transform = 'translate(-50%, -50%)';
  container.appendChild(progressBar);

  // Initialize Unity
  createUnityInstanceHook(canvas, {
    ...props,
    onProgress: (progress) => {
      updateProgressBar(progressBar, progress);
      props.onProgress?.(progress);
    },
  })
    .then((wrapper) => {
      progressBar.remove();
      props.onReady?.(wrapper);
    })
    .catch((error) => {
      progressBar.remove();
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'absolute';
      errorDiv.style.top = '50%';
      errorDiv.style.left = '50%';
      errorDiv.style.transform = 'translate(-50%, -50%)';
      errorDiv.style.color = '#ff4444';
      errorDiv.style.textAlign = 'center';
      errorDiv.textContent = `Error: ${error.message}`;
      container.appendChild(errorDiv);
      props.onError?.(error);
    });

  return container;
}

/**
 * Create a Unity embed element (alias)
 */
export const createUnityEmbedElement = UnityEmbed;

/**
 * Update progress bar element
 */
function updateProgressBar(element: HTMLElement, progress: UnityLoadingProgress): void {
  const fill = element.querySelector('.unity-progress-fill') as HTMLElement | null;
  const text = element.querySelector('.unity-progress-text') as HTMLElement | null;
  if (fill) {
    fill.style.width = `${progress.progress * 100}%`;
  }
  if (text) {
    text.textContent = `${progress.phase}: ${Math.round(progress.progress * 100)}%`;
  }
}

/**
 * Unity progress bar component
 */
export function UnityProgressBar(props: {
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

  div.innerHTML = `
    <div style="width: 300px; background: #333; border-radius: 4px; overflow: hidden;">
      <div class="unity-progress-fill" style="width: 0%; height: 24px; background: linear-gradient(90deg, #2196F3, #4CAF50); transition: width 0.3s;"></div>
    </div>
    <div class="unity-progress-text" style="text-align: center; margin-top: 8px; color: #fff; font-family: sans-serif;">
      Loading...
    </div>
  `;

  return div;
}

/**
 * Unity fullscreen button component
 */
export function UnityFullscreenButton(props: {
  wrapper: UnityInstanceWrapper;
  className?: string | undefined;
  style?: Record<string, string | number> | undefined;
}): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = 'Fullscreen';
  button.className = props.className ?? '';

  if (props.style) {
    Object.entries(props.style).forEach(([key, value]) => {
      button.style.setProperty(key, String(value));
    });
  }

  let isFullscreen = false;

  button.addEventListener('click', () => {
    if (isFullscreen) {
      props.wrapper.exitFullscreen();
      button.textContent = 'Fullscreen';
    } else {
      props.wrapper.requestFullscreen();
      button.textContent = 'Exit Fullscreen';
    }
    isFullscreen = !isFullscreen;
  });

  // Handle fullscreen change events
  document.addEventListener('fullscreenchange', () => {
    isFullscreen = !!document.fullscreenElement;
    button.textContent = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
  });

  return button;
}
