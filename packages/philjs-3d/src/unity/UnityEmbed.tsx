/**
 * @file UnityEmbed Component
 * @description PhilJS component to embed Unity WebGL builds
 */

import type { UnityEmbedProps, UnityInstanceWrapper, UnityLoadingProgress } from './types';
import { createUnityInstance, disposeUnity, getLoadingProgress } from './hooks';

/**
 * Create a Unity embed component for PhilJS
 */
export function UnityEmbed(props: UnityEmbedProps) {
  const {
    buildUrl,
    width = 960,
    height = 600,
    pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    showProgress = true,
    style = {},
    className = '',
  } = props;

  let canvasRef: HTMLCanvasElement | null = null;
  let unityWrapper: UnityInstanceWrapper | null = null;
  let isLoading = true;
  let progress: UnityLoadingProgress = { progress: 0, phase: 'downloading' };

  const handleCanvasMount = async (canvas: HTMLCanvasElement) => {
    canvasRef = canvas;
    isLoading = true;

    try {
      unityWrapper = await createUnityInstance(canvas, {
        ...props,
        onProgress: (p) => {
          progress = p;
          props.onProgress?.(p);
        },
      });
      isLoading = false;
    } catch (error) {
      console.error('Failed to initialize Unity:', error);
      isLoading = false;
    }
  };

  const handleCanvasUnmount = async () => {
    if (canvasRef) {
      await disposeUnity(canvasRef);
    }
    canvasRef = null;
    unityWrapper = null;
  };

  // Create the canvas element
  const canvasStyle = {
    display: 'block',
    backgroundColor: '#231F20',
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
          id: `unity-canvas-${Date.now()}`,
          width: Math.floor(width * pixelRatio),
          height: Math.floor(height * pixelRatio),
          style: {
            ...canvasStyle,
            width: `${width}px`,
            height: `${height}px`,
          },
          tabindex: 0,
          ref: (el: HTMLCanvasElement | null) => {
            if (el) {
              handleCanvasMount(el);
            } else {
              handleCanvasUnmount();
            }
          },
        },
      },
      // Loading overlay
      showProgress && {
        type: 'div',
        props: {
          id: 'unity-loading-overlay',
          style: {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#231F20',
            color: '#fff',
            transition: 'opacity 0.5s',
            opacity: isLoading ? 1 : 0,
            pointerEvents: isLoading ? 'auto' : 'none',
          },
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                marginBottom: '20px',
                fontSize: '18px',
              },
            },
            children: ['Loading Unity...'],
          },
          {
            type: 'div',
            props: {
              style: {
                width: '200px',
                height: '10px',
                backgroundColor: '#444',
                borderRadius: '5px',
                overflow: 'hidden',
              },
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: `${progress.progress * 100}%`,
                    height: '100%',
                    backgroundColor: '#4CAF50',
                    transition: 'width 0.3s',
                  },
                },
              },
            ],
          },
          {
            type: 'div',
            props: {
              style: {
                marginTop: '10px',
                fontSize: '14px',
                textTransform: 'capitalize',
              },
            },
            children: [progress.phase],
          },
        ],
      },
    ].filter(Boolean),
  };
}

/**
 * Create a Unity embed element imperatively
 */
export async function createUnityEmbedElement(
  props: UnityEmbedProps
): Promise<HTMLDivElement> {
  const container = document.createElement('div');

  const {
    width = 960,
    height = 600,
    pixelRatio = window.devicePixelRatio || 1,
    showProgress = true,
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
  canvas.id = `unity-canvas-${Date.now()}`;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.display = 'block';
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.backgroundColor = '#231F20';
  canvas.tabIndex = 0;

  // Apply custom styles
  for (const [key, value] of Object.entries(style)) {
    (canvas.style as unknown as Record<string, string>)[key] = String(value);
  }

  container.appendChild(canvas);

  // Create loading overlay
  let loadingOverlay: HTMLDivElement | null = null;
  if (showProgress) {
    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'unity-loading-overlay';
    loadingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #231F20;
      color: #fff;
      transition: opacity 0.5s;
    `;

    const loadingText = document.createElement('div');
    loadingText.style.marginBottom = '20px';
    loadingText.style.fontSize = '18px';
    loadingText.textContent = 'Loading Unity...';

    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 200px;
      height: 10px;
      background-color: #444;
      border-radius: 5px;
      overflow: hidden;
    `;

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background-color: #4CAF50;
      transition: width 0.3s;
    `;
    progressContainer.appendChild(progressBar);

    const phaseText = document.createElement('div');
    phaseText.style.marginTop = '10px';
    phaseText.style.fontSize = '14px';
    phaseText.style.textTransform = 'capitalize';

    loadingOverlay.appendChild(loadingText);
    loadingOverlay.appendChild(progressContainer);
    loadingOverlay.appendChild(phaseText);
    container.appendChild(loadingOverlay);

    // Update progress callback
    const originalOnProgress = props.onProgress;
    props.onProgress = (progress) => {
      progressBar.style.width = `${progress.progress * 100}%`;
      phaseText.textContent = progress.phase;
      originalOnProgress?.(progress);

      if (progress.phase === 'complete' && loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.pointerEvents = 'none';
        setTimeout(() => {
          loadingOverlay?.remove();
        }, 500);
      }
    };
  }

  // Initialize Unity
  try {
    const wrapper = await createUnityInstance(canvas, props);

    // Attach cleanup and instance
    (container as HTMLDivElement & {
      cleanup?: () => Promise<void>;
      unity?: UnityInstanceWrapper;
    }).cleanup = async () => {
      await disposeUnity(canvas);
    };

    (container as HTMLDivElement & { unity?: UnityInstanceWrapper }).unity = wrapper;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    props.onError?.(err);

    // Show error in loading overlay
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div style="color: #f44336; font-size: 18px;">Failed to load Unity</div>
        <div style="margin-top: 10px; font-size: 14px;">${err.message}</div>
      `;
    }
  }

  return container;
}

/**
 * Unity loading progress bar component
 */
export function UnityProgressBar(props: {
  progress: UnityLoadingProgress;
  width?: number;
  height?: number;
  style?: Record<string, string | number>;
}) {
  const { progress, width = 200, height = 10, style = {} } = props;

  return {
    type: 'div',
    props: {
      style: {
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#444',
        borderRadius: '5px',
        overflow: 'hidden',
        ...style,
      },
    },
    children: [
      {
        type: 'div',
        props: {
          style: {
            width: `${progress.progress * 100}%`,
            height: '100%',
            backgroundColor: '#4CAF50',
            transition: 'width 0.3s ease',
          },
        },
      },
    ],
  };
}

/**
 * Unity fullscreen button component
 */
export function UnityFullscreenButton(props: {
  unity: UnityInstanceWrapper | null;
  style?: Record<string, string | number>;
}) {
  const { unity, style = {} } = props;

  return {
    type: 'button',
    props: {
      onclick: () => unity?.requestFullscreen(),
      disabled: !unity,
      style: {
        padding: '8px 16px',
        cursor: unity ? 'pointer' : 'not-allowed',
        backgroundColor: unity ? '#4CAF50' : '#ccc',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        ...style,
      },
    },
    children: ['Fullscreen'],
  };
}

export default UnityEmbed;
