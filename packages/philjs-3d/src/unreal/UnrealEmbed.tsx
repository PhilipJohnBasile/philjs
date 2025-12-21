/**
 * @file UnrealEmbed Component
 * @description PhilJS component to embed Unreal Engine Pixel Streaming
 */

import type { UnrealEmbedProps, PixelStreamingInstance, WebRTCStats } from './types';
import { createPixelStreamingInstance, setupInputForwarding, disposeUnreal } from './hooks';

/**
 * Create an Unreal Engine embed component for PhilJS
 */
export function UnrealEmbed(props: UnrealEmbedProps) {
  const {
    serverUrl,
    width = 1280,
    height = 720,
    showControls = false,
    enableInput = true,
    style = {},
    className = '',
  } = props;

  let videoRef: HTMLVideoElement | null = null;
  let unrealInstance: PixelStreamingInstance | null = null;
  let cleanupInput: (() => void) | null = null;

  const handleVideoMount = async (video: HTMLVideoElement) => {
    videoRef = video;

    try {
      unrealInstance = await createPixelStreamingInstance(video, props);

      if (enableInput) {
        cleanupInput = setupInputForwarding(video, unrealInstance);
      }
    } catch (error) {
      console.error('Failed to initialize Pixel Streaming:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      props.onError?.(err);
    }
  };

  const handleVideoUnmount = () => {
    cleanupInput?.();
    if (videoRef) {
      disposeUnreal(videoRef);
    }
    videoRef = null;
    unrealInstance = null;
  };

  // Create the video element
  const videoStyle = {
    display: 'block',
    backgroundColor: '#000',
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
        overflow: 'hidden',
      },
      class: className,
    },
    children: [
      {
        type: 'video',
        props: {
          width,
          height,
          style: videoStyle,
          playsinline: true,
          muted: props.config?.startMuted ?? false,
          autoplay: true,
          ref: (el: HTMLVideoElement | null) => {
            if (el) {
              handleVideoMount(el);
            } else {
              handleVideoUnmount();
            }
          },
        },
      },
      // Optional controls overlay
      showControls && {
        type: 'div',
        props: {
          style: {
            position: 'absolute' as const,
            bottom: '10px',
            left: '10px',
            display: 'flex',
            gap: '10px',
            zIndex: 10,
          },
        },
        children: [
          {
            type: 'button',
            props: {
              onclick: () => unrealInstance?.setMuted(!videoRef?.muted),
              style: {
                padding: '8px 16px',
                cursor: 'pointer',
              },
            },
            children: ['Mute/Unmute'],
          },
          {
            type: 'button',
            props: {
              onclick: () => unrealInstance?.requestFullscreen(),
              style: {
                padding: '8px 16px',
                cursor: 'pointer',
              },
            },
            children: ['Fullscreen'],
          },
        ],
      },
    ].filter(Boolean),
  };
}

/**
 * Create an Unreal embed element imperatively
 */
export async function createUnrealEmbedElement(
  props: UnrealEmbedProps
): Promise<HTMLDivElement> {
  const container = document.createElement('div');

  const {
    width = 1280,
    height = 720,
    showControls = false,
    enableInput = true,
    style = {},
    className = '',
  } = props;

  // Setup container
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = 'relative';
  container.style.overflow = 'hidden';

  if (className) {
    container.className = className;
  }

  // Create video element
  const video = document.createElement('video');
  video.width = width;
  video.height = height;
  video.style.display = 'block';
  video.style.backgroundColor = '#000';
  video.playsInline = true;
  video.muted = props.config?.startMuted ?? false;
  video.autoplay = true;

  // Apply custom styles
  for (const [key, value] of Object.entries(style)) {
    (video.style as unknown as Record<string, string>)[key] = String(value);
  }

  container.appendChild(video);

  // Initialize Pixel Streaming
  let cleanupInput: (() => void) | null = null;

  try {
    const instance = await createPixelStreamingInstance(video, props);

    if (enableInput) {
      cleanupInput = setupInputForwarding(video, instance);
    }

    // Add controls if requested
    if (showControls) {
      const controls = document.createElement('div');
      controls.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 10px;
        display: flex;
        gap: 10px;
        z-index: 10;
      `;

      const muteBtn = document.createElement('button');
      muteBtn.textContent = 'Mute/Unmute';
      muteBtn.style.padding = '8px 16px';
      muteBtn.style.cursor = 'pointer';
      muteBtn.onclick = () => instance.setMuted(!video.muted);

      const fsBtn = document.createElement('button');
      fsBtn.textContent = 'Fullscreen';
      fsBtn.style.padding = '8px 16px';
      fsBtn.style.cursor = 'pointer';
      fsBtn.onclick = () => instance.requestFullscreen();

      controls.appendChild(muteBtn);
      controls.appendChild(fsBtn);
      container.appendChild(controls);
    }

    // Attach instance and cleanup
    (container as HTMLDivElement & {
      cleanup?: () => void;
      unreal?: PixelStreamingInstance;
    }).cleanup = () => {
      cleanupInput?.();
      disposeUnreal(video);
    };

    (container as HTMLDivElement & { unreal?: PixelStreamingInstance }).unreal = instance;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    props.onError?.(err);
  }

  return container;
}

/**
 * Stats overlay component
 */
export function UnrealStatsOverlay(props: {
  stats: WebRTCStats | null;
  style?: Record<string, string | number>;
}) {
  const { stats, style = {} } = props;

  if (!stats) {
    return null;
  }

  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute' as const,
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '12px',
        borderRadius: '4px',
        zIndex: 10,
        ...style,
      },
    },
    children: [
      { type: 'div', children: [`FPS: ${stats.fps.toFixed(0)}`] },
      { type: 'div', children: [`Resolution: ${stats.width}x${stats.height}`] },
      { type: 'div', children: [`Codec: ${stats.codec}`] },
      { type: 'div', children: [`Latency: ${stats.latency}ms`] },
      { type: 'div', children: [`State: ${stats.connectionState}`] },
    ],
  };
}

export default UnrealEmbed;
