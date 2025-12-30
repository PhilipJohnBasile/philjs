/**
 * @file UnrealEmbed Components
 * @description Unreal Engine Pixel Streaming embed component for PhilJS
 */

import type { UnrealEmbedProps, PixelStreamingInstance, WebRTCStats } from './types.js';
import { createPixelStreamingInstance, setupInputForwarding, disposeUnreal } from './hooks.js';

/**
 * Create an Unreal Engine Pixel Streaming embed element
 *
 * @param props - Unreal embed properties
 * @returns HTMLElement containing the video stream
 *
 * @example
 * ```ts
 * const embed = UnrealEmbed({
 *   serverUrl: 'ws://localhost:8080',
 *   width: 1920,
 *   height: 1080,
 *   onReady: (instance) => {
 *     console.log('Connected to Unreal Engine!');
 *   },
 * });
 * document.body.appendChild(embed);
 * ```
 */
export function UnrealEmbed(props: UnrealEmbedProps): HTMLElement {
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

  // Create video element
  const video = document.createElement('video');
  video.id = props.videoId ?? `unreal-video-${Date.now()}`;
  video.autoplay = true;
  video.playsInline = true;
  video.muted = props.startMuted ?? false;

  const width = props.width ?? 1280;
  const height = props.height ?? 720;

  video.style.width = `${width}px`;
  video.style.height = `${height}px`;
  video.style.backgroundColor = '#000';

  container.appendChild(video);

  // Create connecting overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  overlay.style.color = '#fff';
  overlay.style.fontFamily = 'sans-serif';
  overlay.textContent = 'Connecting...';
  container.appendChild(overlay);

  // Initialize Pixel Streaming
  (async () => {
    try {
      const instance = await createPixelStreamingInstance(video, props);

      // Setup input forwarding if enabled
      if (props.enableInput !== false) {
        setupInputForwarding(video, instance);
      }

      // Connect
      await instance.connect();

      overlay.remove();
      props.onReady?.(instance);

      // Handle events
      instance.on('disconnected', () => {
        overlay.textContent = 'Disconnected';
        container.appendChild(overlay);
        props.onDisconnect?.();
      });

      instance.on('error', (error) => {
        overlay.textContent = `Error: ${(error as Error).message}`;
        container.appendChild(overlay);
        props.onError?.(error as Error);
      });
    } catch (error) {
      overlay.textContent = `Connection failed: ${(error as Error).message}`;
      props.onError?.(error as Error);
    }
  })();

  return container;
}

/**
 * Create an Unreal embed element (alias)
 */
export const createUnrealEmbedElement = UnrealEmbed;

/**
 * Stats overlay component for Unreal Pixel Streaming
 */
export function UnrealStatsOverlay(props: {
  instance: PixelStreamingInstance;
  className?: string | undefined;
  style?: Record<string, string | number> | undefined;
  updateInterval?: number | undefined;
}): HTMLDivElement {
  const div = document.createElement('div');
  div.className = props.className ?? '';

  // Default styles
  div.style.position = 'absolute';
  div.style.top = '10px';
  div.style.left = '10px';
  div.style.padding = '10px';
  div.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  div.style.color = '#fff';
  div.style.fontFamily = 'monospace';
  div.style.fontSize = '12px';
  div.style.borderRadius = '4px';

  if (props.style) {
    Object.entries(props.style).forEach(([key, value]) => {
      div.style.setProperty(key, String(value));
    });
  }

  const updateInterval = props.updateInterval ?? 1000;

  const updateStats = async () => {
    const stats = await props.instance.getStats();
    div.innerHTML = `
      <div>Resolution: ${stats.width}x${stats.height}</div>
      <div>FPS: ${stats.fps.toFixed(1)}</div>
      <div>Bitrate: ${(stats.bitrate / 1024).toFixed(1)} kbps</div>
      <div>Latency: ${stats.latency.toFixed(0)} ms</div>
      <div>Packet Loss: ${(stats.packetLoss * 100).toFixed(2)}%</div>
      <div>Codec: ${stats.codec}</div>
      <div>State: ${stats.connectionState}</div>
    `;
  };

  updateStats();
  const intervalId = setInterval(updateStats, updateInterval);

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
