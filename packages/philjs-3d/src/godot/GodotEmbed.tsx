/**
 * @file GodotEmbed Component
 * @description PhilJS component to embed Godot HTML5 exports
 */

import type { GodotEmbedProps, GodotInstance } from './types';
import { createGodotInstance, disposeGodot } from './hooks';

/**
 * Create a Godot embed component for PhilJS
 */
export function GodotEmbed(props: GodotEmbedProps) {
  const {
    pckPath,
    width = 800,
    height = 600,
    focusOnStart = true,
    style = {},
    className = '',
  } = props;

  let canvasRef: HTMLCanvasElement | null = null;
  let godotInstance: GodotInstance | null = null;

  const handleCanvasMount = async (canvas: HTMLCanvasElement) => {
    canvasRef = canvas;

    try {
      godotInstance = await createGodotInstance(canvas, props);

      if (focusOnStart) {
        canvas.focus();
      }
    } catch (error) {
      console.error('Failed to initialize Godot:', error);
    }
  };

  const handleCanvasUnmount = () => {
    if (canvasRef) {
      disposeGodot(canvasRef);
    }
    canvasRef = null;
    godotInstance = null;
  };

  // Create the canvas element
  const canvasStyle = {
    display: 'block',
    ...style,
  };

  // Return JSX-like structure for PhilJS
  return {
    type: 'div',
    props: {
      style: {
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative' as const,
      },
      class: className,
    },
    children: [
      {
        type: 'canvas',
        props: {
          id: `godot-canvas-${Date.now()}`,
          width,
          height,
          style: canvasStyle,
          tabindex: 0,
          ref: (el: HTMLCanvasElement | null) => {
            if (el) {
              handleCanvasMount(el);
            } else {
              handleCanvasUnmount();
            }
          },
          oncontextmenu: (e: Event) => e.preventDefault(),
        },
      },
    ],
  };
}

/**
 * Create a Godot embed element imperatively
 */
export async function createGodotEmbedElement(
  props: GodotEmbedProps
): Promise<HTMLDivElement> {
  const container = document.createElement('div');

  const {
    width = 800,
    height = 600,
    focusOnStart = true,
    style = {},
    className = '',
  } = props;

  // Setup container
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = 'relative';

  if (className) {
    container.className = className;
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'block';
  canvas.tabIndex = 0;

  // Apply custom styles
  for (const [key, value] of Object.entries(style)) {
    (canvas.style as unknown as Record<string, string>)[key] = String(value);
  }

  // Prevent context menu
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  container.appendChild(canvas);

  // Initialize Godot
  const instance = await createGodotInstance(canvas, props);

  if (focusOnStart) {
    canvas.focus();
  }

  // Attach cleanup and instance
  (container as HTMLDivElement & {
    cleanup?: () => void;
    godot?: GodotInstance;
  }).cleanup = () => {
    disposeGodot(canvas);
  };

  (container as HTMLDivElement & { godot?: GodotInstance }).godot = instance;

  return container;
}

/**
 * Loading indicator component
 */
export function GodotLoadingIndicator(props: {
  progress: number;
  width?: number;
  height?: number;
}) {
  const { progress, width = 200, height = 20 } = props;

  return {
    type: 'div',
    props: {
      style: {
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#333',
        borderRadius: '4px',
        overflow: 'hidden',
      },
    },
    children: [
      {
        type: 'div',
        props: {
          style: {
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#4CAF50',
            transition: 'width 0.3s ease',
          },
        },
      },
    ],
  };
}

export default GodotEmbed;
