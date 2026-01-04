/**
 * @file BevyEmbed Components
 * @description Bevy embed component and utilities for PhilJS
 */

import type { BevyEmbedProps, BevyInstance } from './types.js';
import { createBevyInstance, getBevy, disposeBevy } from './hooks.js';

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
export function BevyEmbed(props: BevyEmbedProps): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.display = 'inline-block';
  let isDisposed = false;
  let instancePromise: Promise<BevyInstance> | null = null;

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
  canvas.id = `bevy-canvas-${Date.now()}`;

  const width = typeof props.width === 'number' ? props.width : 800;
  const height = typeof props.height === 'number' ? props.height : 600;
  const pixelRatio = props.pixelRatio ?? window.devicePixelRatio ?? 1;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = typeof props.width === 'string' ? props.width : `${width}px`;
  canvas.style.height = typeof props.height === 'string' ? props.height : `${height}px`;

  container.appendChild(canvas);

  // Show loading component if provided
  let loadingElement: HTMLElement | null = null;
  if (props.loadingComponent) {
    loadingElement = props.loadingComponent();
    if (loadingElement) {
      loadingElement.style.position = 'absolute';
      loadingElement.style.top = '50%';
      loadingElement.style.left = '50%';
      loadingElement.style.transform = 'translate(-50%, -50%)';
      container.appendChild(loadingElement);
    }
  }

  // Initialize Bevy
  instancePromise = createBevyInstance({
    wasmPath: props.wasmPath,
    ...(props.jsPath !== undefined ? { jsPath: props.jsPath } : {}),
    canvas,
    width,
    height,
    pixelRatio,
    ...(props.targetFps !== undefined ? { targetFps: props.targetFps } : {}),
    ...(props.debug !== undefined ? { debug: props.debug } : {}),
    ...(props.preloadAssets !== undefined ? { preloadAssets: props.preloadAssets } : {}),
    ...(props.audio !== undefined ? { audio: props.audio } : {}),
    input: {
      ...(props.keyboard !== undefined ? { keyboard: props.keyboard } : {}),
      ...(props.mouse !== undefined ? { mouse: props.mouse } : {}),
      ...(props.gamepad !== undefined ? { gamepad: props.gamepad } : {}),
      ...(props.touch !== undefined ? { touch: props.touch } : {}),
    },
  });
  instancePromise
    .then(async (instance) => {
      if (isDisposed) {
        await instance.app.dispose();
        return;
      }
      // Remove loading element
      if (loadingElement) {
        loadingElement.remove();
      }

      // Start the app
      instance.app.run();

      // Call onReady callback
      props.onReady?.(instance);
    })
    .catch((error) => {
      if (isDisposed) {
        return;
      }
      // Remove loading element
      if (loadingElement) {
        loadingElement.remove();
      }

      // Show error component if provided
      if (props.errorComponent) {
        const errorElement = props.errorComponent(error);
        if (errorElement) {
          errorElement.style.position = 'absolute';
          errorElement.style.top = '50%';
          errorElement.style.left = '50%';
          errorElement.style.transform = 'translate(-50%, -50%)';
          container.appendChild(errorElement);
        }
      }

      props.onError?.(error);
    });

  const dispose = async () => {
    if (isDisposed) {
      return;
    }
    isDisposed = true;
    if (loadingElement) {
      loadingElement.remove();
    }
    const instance = await instancePromise?.catch(() => null);
    if (instance?.app) {
      await instance.app.dispose();
    } else {
      await disposeBevy(canvas);
    }
  };
  Object.defineProperty(container, 'dispose', {
    value: dispose,
    configurable: true,
  });

  return container;
}

/**
 * Create a Bevy embed element (alias for BevyEmbed)
 */
export const createBevyEmbedElement = BevyEmbed;

/**
 * Create a fullscreen toggle button for Bevy
 */
export function BevyFullscreenButton(props: {
  canvasOrKey?: HTMLCanvasElement | string;
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

  button.addEventListener('click', () => {
    const instance = getBevy(props.canvasOrKey);
    if (instance?.app) {
      const canvas = instance.app.getCanvas();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        canvas.requestFullscreen();
      }
    }
  });

  return button;
}

/**
 * Create a pause/resume button for Bevy
 */
export function BevyPauseButton(props: {
  canvasOrKey?: HTMLCanvasElement | string;
  className?: string | undefined;
  style?: Record<string, string | number> | undefined;
}): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = 'Pause';
  button.className = props.className ?? '';

  if (props.style) {
    Object.entries(props.style).forEach(([key, value]) => {
      button.style.setProperty(key, String(value));
    });
  }

  let isPaused = false;

  button.addEventListener('click', () => {
    const instance = getBevy(props.canvasOrKey);
    if (instance?.app) {
      if (isPaused) {
        instance.app.resume();
        button.textContent = 'Pause';
      } else {
        instance.app.pause();
        button.textContent = 'Resume';
      }
      isPaused = !isPaused;
    }
  });

  return button;
}

/**
 * Create an FPS counter display for Bevy
 */
export function BevyFPSCounter(props: {
  canvasOrKey?: HTMLCanvasElement | string;
  className?: string | undefined;
  style?: Record<string, string | number> | undefined;
  updateInterval?: number | undefined;
}): HTMLDivElement {
  const div = document.createElement('div');
  div.textContent = 'FPS: --';
  div.className = props.className ?? '';

  if (props.style) {
    Object.entries(props.style).forEach(([key, value]) => {
      div.style.setProperty(key, String(value));
    });
  }

  const updateInterval = props.updateInterval ?? 500;

  const update = () => {
    const instance = getBevy(props.canvasOrKey);
    if (instance?.app) {
      const fps = instance.app.getFps();
      div.textContent = `FPS: ${fps.toFixed(1)}`;
    }
  };

  const intervalId = setInterval(update, updateInterval);

  // Clean up on removal
  const observer = new MutationObserver(() => {
    if (!document.contains(div)) {
      clearInterval(intervalId);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return div;
}
