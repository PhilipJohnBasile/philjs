/**
 * @file BevyEmbed Component
 * @description Component for embedding Bevy WASM games in PhilJS applications
 */

import type {
  BevyEmbedProps,
  BevyInstance,
  BevyState,
  KeyCode,
  MouseButton,
  Vec2,
} from './types';
import { createBevyInstance, disposeBevy, onBevyEvent } from './hooks';

// ============================================================================
// Input Forwarding
// ============================================================================

/**
 * Input state manager for Bevy
 */
interface InputState {
  keyboard: {
    pressed: Set<string>;
    justPressed: Set<string>;
    justReleased: Set<string>;
  };
  mouse: {
    position: Vec2;
    delta: Vec2;
    buttons: Set<number>;
    wheel: Vec2;
  };
  gamepad: Map<number, GamepadState>;
  touch: Map<number, TouchState>;
}

interface GamepadState {
  buttons: number[];
  axes: number[];
}

interface TouchState {
  position: Vec2;
  startPosition: Vec2;
  force: number;
}

/**
 * Create input state manager
 */
function createInputState(): InputState {
  return {
    keyboard: {
      pressed: new Set(),
      justPressed: new Set(),
      justReleased: new Set(),
    },
    mouse: {
      position: { x: 0, y: 0 },
      delta: { x: 0, y: 0 },
      buttons: new Set(),
      wheel: { x: 0, y: 0 },
    },
    gamepad: new Map(),
    touch: new Map(),
  };
}

/**
 * Setup keyboard input forwarding
 */
function setupKeyboardInput(
  canvas: HTMLCanvasElement,
  inputState: InputState,
  enabled: boolean
): () => void {
  if (!enabled) return () => {};

  const handleKeyDown = (e: KeyboardEvent) => {
    if (document.activeElement === canvas) {
      e.preventDefault();
      inputState.keyboard.pressed.add(e.code);
      inputState.keyboard.justPressed.add(e.code);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (document.activeElement === canvas) {
      e.preventDefault();
      inputState.keyboard.pressed.delete(e.code);
      inputState.keyboard.justReleased.add(e.code);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}

/**
 * Setup mouse input forwarding
 */
function setupMouseInput(
  canvas: HTMLCanvasElement,
  inputState: InputState,
  enabled: boolean
): () => void {
  if (!enabled) return () => {};

  let lastPosition = { x: 0, y: 0 };

  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    inputState.mouse.delta.x = x - lastPosition.x;
    inputState.mouse.delta.y = y - lastPosition.y;
    inputState.mouse.position.x = x;
    inputState.mouse.position.y = y;

    lastPosition = { x, y };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.target === canvas) {
      e.preventDefault();
      canvas.focus();
      inputState.mouse.buttons.add(e.button);
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    inputState.mouse.buttons.delete(e.button);
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.target === canvas) {
      e.preventDefault();
      inputState.mouse.wheel.x = e.deltaX;
      inputState.mouse.wheel.y = e.deltaY;
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    if (e.target === canvas) {
      e.preventDefault();
    }
  };

  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('wheel', handleWheel, { passive: false });
  canvas.addEventListener('contextmenu', handleContextMenu);

  return () => {
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('wheel', handleWheel);
    canvas.removeEventListener('contextmenu', handleContextMenu);
  };
}

/**
 * Setup gamepad input forwarding
 */
function setupGamepadInput(
  inputState: InputState,
  enabled: boolean
): () => void {
  if (!enabled) return () => {};

  let animationFrameId: number | null = null;

  const pollGamepads = () => {
    const gamepads = navigator.getGamepads();

    for (const gamepad of gamepads) {
      if (gamepad) {
        inputState.gamepad.set(gamepad.index, {
          buttons: gamepad.buttons.map((b) => b.value),
          axes: Array.from(gamepad.axes),
        });
      }
    }

    animationFrameId = requestAnimationFrame(pollGamepads);
  };

  const handleGamepadConnected = (e: GamepadEvent) => {
    inputState.gamepad.set(e.gamepad.index, {
      buttons: e.gamepad.buttons.map((b) => b.value),
      axes: Array.from(e.gamepad.axes),
    });
  };

  const handleGamepadDisconnected = (e: GamepadEvent) => {
    inputState.gamepad.delete(e.gamepad.index);
  };

  window.addEventListener('gamepadconnected', handleGamepadConnected);
  window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
  animationFrameId = requestAnimationFrame(pollGamepads);

  return () => {
    window.removeEventListener('gamepadconnected', handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}

/**
 * Setup touch input forwarding
 */
function setupTouchInput(
  canvas: HTMLCanvasElement,
  inputState: InputState,
  enabled: boolean
): () => void {
  if (!enabled) return () => {};

  const getTouchPosition = (touch: Touch): Vec2 => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.target === canvas) {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const pos = getTouchPosition(touch);
        inputState.touch.set(touch.identifier, {
          position: pos,
          startPosition: { ...pos },
          force: touch.force,
        });
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.target === canvas) {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const state = inputState.touch.get(touch.identifier);
        if (state) {
          state.position = getTouchPosition(touch);
          state.force = touch.force;
        }
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    for (const touch of e.changedTouches) {
      inputState.touch.delete(touch.identifier);
    }
  };

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('touchend', handleTouchEnd);
  window.addEventListener('touchcancel', handleTouchEnd);

  return () => {
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('touchcancel', handleTouchEnd);
  };
}

// ============================================================================
// Resize Handling
// ============================================================================

/**
 * Setup resize observer for auto-resizing
 */
function setupResizeObserver(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  instance: BevyInstance | null,
  pixelRatio: number,
  onResize?: (width: number, height: number) => void
): () => void {
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      const scaledWidth = Math.floor(width * pixelRatio);
      const scaledHeight = Math.floor(height * pixelRatio);

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      if (instance?.app) {
        instance.app.resize(width, height);
      }

      onResize?.(width, height);
    }
  });

  resizeObserver.observe(container);

  return () => {
    resizeObserver.disconnect();
  };
}

// ============================================================================
// Loading State Component
// ============================================================================

/**
 * Create default loading indicator
 */
function createDefaultLoadingIndicator(state: BevyState): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #1a1a2e;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 48px;
    height: 48px;
    border: 4px solid #333;
    border-top-color: #00d9ff;
    border-radius: 50%;
    animation: bevy-spin 1s linear infinite;
    margin-bottom: 16px;
  `;

  const text = document.createElement('div');
  text.style.cssText = `
    font-size: 16px;
    color: #888;
  `;

  const stateMessages: Record<BevyState, string> = {
    idle: 'Initializing...',
    loading: 'Loading WASM module...',
    compiling: 'Compiling shaders...',
    instantiating: 'Creating instance...',
    initializing: 'Starting engine...',
    running: 'Running',
    paused: 'Paused',
    error: 'Error occurred',
    disposed: 'Disposed',
  };

  text.textContent = stateMessages[state] || 'Loading...';

  // Add keyframes for spinner animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bevy-spin {
      to { transform: rotate(360deg); }
    }
  `;

  container.appendChild(style);
  container.appendChild(spinner);
  container.appendChild(text);

  return container;
}

/**
 * Create default error display
 */
function createDefaultErrorDisplay(error: Error): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #1a1a2e;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 20px;
    text-align: center;
  `;

  const icon = document.createElement('div');
  icon.style.cssText = `
    font-size: 48px;
    margin-bottom: 16px;
  `;
  icon.textContent = '!';

  const title = document.createElement('div');
  title.style.cssText = `
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 8px;
    color: #ff4757;
  `;
  title.textContent = 'Failed to load Bevy';

  const message = document.createElement('div');
  message.style.cssText = `
    font-size: 14px;
    color: #888;
    max-width: 400px;
    word-break: break-word;
  `;
  message.textContent = error.message;

  container.appendChild(icon);
  container.appendChild(title);
  container.appendChild(message);

  return container;
}

// ============================================================================
// BevyEmbed Component
// ============================================================================

/**
 * Create BevyEmbed component
 *
 * @param props - Component props
 * @returns Container element with embedded Bevy game
 *
 * @example
 * ```ts
 * const gameContainer = BevyEmbed({
 *   wasmPath: '/game.wasm',
 *   width: 1280,
 *   height: 720,
 *   onReady: (instance) => {
 *     console.log('Game ready!');
 *     instance.app.run();
 *   },
 *   onError: (error) => {
 *     console.error('Game failed:', error);
 *   },
 * });
 *
 * document.getElementById('app').appendChild(gameContainer);
 * ```
 */
export function BevyEmbed(props: BevyEmbedProps): HTMLElement {
  const {
    wasmPath,
    jsPath,
    width = '100%',
    height = '100%',
    className,
    style = {},
    pixelRatio = window.devicePixelRatio || 1,
    autoResize = true,
    keyboard = true,
    mouse = true,
    gamepad = true,
    touch = true,
    audio = true,
    targetFps,
    debug = false,
    preloadAssets,
    onReady,
    onError,
    onResize,
    loadingComponent,
    errorComponent,
  } = props;

  // Create container
  const container = document.createElement('div');
  container.className = className || '';
  container.style.cssText = `
    position: relative;
    width: ${typeof width === 'number' ? `${width}px` : width};
    height: ${typeof height === 'number' ? `${height}px` : height};
    overflow: hidden;
    ${Object.entries(style).map(([k, v]) => `${k}: ${v}`).join('; ')}
  `;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = `bevy-canvas-${Date.now()}`;
  canvas.tabIndex = 0; // Make focusable for keyboard input
  canvas.style.cssText = `
    display: block;
    width: 100%;
    height: 100%;
    outline: none;
  `;

  // Set initial canvas size
  const initialWidth = typeof width === 'number' ? width : container.clientWidth || 800;
  const initialHeight = typeof height === 'number' ? height : container.clientHeight || 600;
  canvas.width = initialWidth * pixelRatio;
  canvas.height = initialHeight * pixelRatio;

  // Create overlay for loading/error states
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  `;

  container.appendChild(canvas);
  container.appendChild(overlay);

  // Input state
  const inputState = createInputState();

  // Track cleanup functions
  const cleanupFunctions: (() => void)[] = [];

  // Current instance
  let currentInstance: BevyInstance | null = null;
  let currentState: BevyState = 'idle';

  // Update overlay
  const updateOverlay = (state: BevyState, error?: Error) => {
    overlay.innerHTML = '';

    if (state === 'running' || state === 'paused') {
      overlay.style.display = 'none';
      return;
    }

    overlay.style.display = 'block';
    overlay.style.pointerEvents = state === 'error' ? 'auto' : 'none';

    if (state === 'error' && error) {
      const errorEl = errorComponent
        ? errorComponent(error)
        : createDefaultErrorDisplay(error);
      if (errorEl) {
        overlay.appendChild(errorEl);
      }
    } else if (state !== 'disposed') {
      const loadingEl = loadingComponent
        ? loadingComponent()
        : createDefaultLoadingIndicator(state);
      if (loadingEl) {
        overlay.appendChild(loadingEl);
      }
    }
  };

  // Initialize Bevy
  const initialize = async () => {
    try {
      currentState = 'loading';
      updateOverlay(currentState);

      currentInstance = await createBevyInstance({
        wasmPath,
        jsPath,
        canvas,
        width: initialWidth,
        height: initialHeight,
        pixelRatio,
        audio,
        targetFps,
        debug,
        preloadAssets,
        input: { keyboard, mouse, gamepad, touch },
      });

      // Setup input forwarding
      cleanupFunctions.push(setupKeyboardInput(canvas, inputState, keyboard));
      cleanupFunctions.push(setupMouseInput(canvas, inputState, mouse));
      cleanupFunctions.push(setupGamepadInput(inputState, gamepad));
      cleanupFunctions.push(setupTouchInput(canvas, inputState, touch));

      // Setup auto-resize
      if (autoResize) {
        cleanupFunctions.push(
          setupResizeObserver(container, canvas, currentInstance, pixelRatio, onResize)
        );
      }

      // Listen for state changes
      cleanupFunctions.push(
        onBevyEvent('pause', () => {
          currentState = 'paused';
          updateOverlay(currentState);
        })
      );

      cleanupFunctions.push(
        onBevyEvent('resume', () => {
          currentState = 'running';
          updateOverlay(currentState);
        })
      );

      cleanupFunctions.push(
        onBevyEvent('error', (event) => {
          currentState = 'error';
          updateOverlay(currentState, event.data?.error);
        })
      );

      currentState = 'running';
      updateOverlay(currentState);
      onReady?.(currentInstance);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      currentState = 'error';
      updateOverlay(currentState, err);
      onError?.(err);
    }
  };

  // Start initialization when added to DOM
  const initObserver = new MutationObserver((mutations, observer) => {
    if (document.contains(container)) {
      observer.disconnect();
      initialize();
    }
  });

  // Check if already in DOM
  if (document.contains(container)) {
    initialize();
  } else {
    initObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Add dispose method to container
  (container as any).dispose = async () => {
    initObserver.disconnect();
    for (const cleanup of cleanupFunctions) {
      cleanup();
    }
    if (currentInstance) {
      await disposeBevy(canvas);
    }
    container.remove();
  };

  return container;
}

/**
 * Create BevyEmbed element for use with appendChild
 */
export function createBevyEmbedElement(props: BevyEmbedProps): HTMLElement {
  return BevyEmbed(props);
}

// ============================================================================
// Utility Components
// ============================================================================

/**
 * Create a fullscreen button for Bevy canvas
 */
export function BevyFullscreenButton(canvas: HTMLCanvasElement): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = 'Fullscreen';
  button.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    z-index: 100;
    transition: background 0.2s;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.background = 'rgba(0, 0, 0, 0.9)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = 'rgba(0, 0, 0, 0.7)';
  });

  button.addEventListener('click', async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      button.textContent = 'Fullscreen';
    } else {
      await canvas.parentElement?.requestFullscreen();
      button.textContent = 'Exit Fullscreen';
    }
  });

  document.addEventListener('fullscreenchange', () => {
    button.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
  });

  return button;
}

/**
 * Create a pause/resume button for Bevy
 */
export function BevyPauseButton(instance: BevyInstance): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = 'Pause';
  button.style.cssText = `
    position: absolute;
    top: 10px;
    right: 120px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    z-index: 100;
    transition: background 0.2s;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.background = 'rgba(0, 0, 0, 0.9)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = 'rgba(0, 0, 0, 0.7)';
  });

  button.addEventListener('click', () => {
    if (instance.app.isRunning()) {
      instance.app.pause();
      button.textContent = 'Resume';
    } else {
      instance.app.resume();
      button.textContent = 'Pause';
    }
  });

  return button;
}

/**
 * Create FPS counter overlay
 */
export function BevyFPSCounter(instance: BevyInstance): HTMLDivElement {
  const counter = document.createElement('div');
  counter.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.7);
    color: #0f0;
    font-family: monospace;
    font-size: 14px;
    border-radius: 4px;
    z-index: 100;
  `;

  let animationFrameId: number | null = null;

  const update = () => {
    counter.textContent = `FPS: ${instance.app.getFps()}`;
    animationFrameId = requestAnimationFrame(update);
  };

  update();

  // Add dispose method
  (counter as any).dispose = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
  };

  return counter;
}
