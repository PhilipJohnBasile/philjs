/**
 * @file Unreal Engine Integration Tests
 * @description Comprehensive tests for Unreal Engine Pixel Streaming integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => this.onopen?.(), 0);
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  });
}

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  connectionState: RTCPeerConnectionState = 'new';
  ontrack: ((event: unknown) => void) | null = null;
  onicecandidate: ((event: unknown) => void) | null = null;
  ondatachannel: ((event: unknown) => void) | null = null;

  setRemoteDescription = vi.fn(() => Promise.resolve());
  setLocalDescription = vi.fn(() => Promise.resolve());
  createAnswer = vi.fn(() => Promise.resolve({ type: 'answer', sdp: 'test' }));
  addIceCandidate = vi.fn(() => Promise.resolve());
  getStats = vi.fn(() => Promise.resolve(new Map()));
  close = vi.fn();
}

// Setup global mocks
beforeEach(() => {
  (global as Record<string, unknown>).WebSocket = MockWebSocket as unknown as typeof WebSocket;
  (global as Record<string, unknown>).RTCPeerConnection = MockRTCPeerConnection as unknown as typeof RTCPeerConnection;
  (global as Record<string, unknown>).RTCSessionDescription = vi.fn((desc) => desc);
  (global as Record<string, unknown>).RTCIceCandidate = vi.fn((candidate) => candidate);
});

afterEach(() => {
  vi.clearAllMocks();
});

import {
  createPixelStreamingInstance,
  useUnreal,
  setupInputForwarding,
  disposeUnreal,
} from './hooks';

describe('Unreal Engine Pixel Streaming', () => {
  describe('useUnreal', () => {
    it('should return empty result for null video', () => {
      const result = useUnreal(null);
      expect(result.unreal).toBeNull();
      expect(result.isConnecting).toBe(false);
      expect(result.isConnected).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should return state for valid video element', () => {
      const video = document.createElement('video');
      const result = useUnreal(video);
      expect(result.unreal).toBeNull(); // Not connected yet
      expect(typeof result.executeCommand).toBe('function');
      expect(typeof result.sendMessage).toBe('function');
    });
  });

  describe('disposeUnreal', () => {
    it('should cleanup video state', () => {
      const video = document.createElement('video');
      expect(() => disposeUnreal(video)).not.toThrow();
    });
  });

  describe('setupInputForwarding', () => {
    it('should setup input handlers', () => {
      const video = document.createElement('video');
      const mockInstance = {
        sendKeyboardInput: vi.fn(),
        sendMouseInput: vi.fn(),
        sendTouchInput: vi.fn(),
        sendGamepadInput: vi.fn(),
      };

      const cleanup = setupInputForwarding(video, mockInstance as never);
      expect(typeof cleanup).toBe('function');
    });

    it('should forward keyboard events', () => {
      const video = document.createElement('video');
      const mockInstance = {
        sendKeyboardInput: vi.fn(),
        sendMouseInput: vi.fn(),
        sendTouchInput: vi.fn(),
        sendGamepadInput: vi.fn(),
      };

      setupInputForwarding(video, mockInstance as never);

      const keyEvent = new KeyboardEvent('keydown', { keyCode: 65 });
      video.dispatchEvent(keyEvent);

      expect(mockInstance.sendKeyboardInput).toHaveBeenCalledWith({
        type: 'keydown',
        keyCode: 65,
        repeat: false,
      });
    });

    it('should forward mouse events', () => {
      const video = document.createElement('video');
      Object.defineProperty(video, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      });

      const mockInstance = {
        sendKeyboardInput: vi.fn(),
        sendMouseInput: vi.fn(),
        sendTouchInput: vi.fn(),
        sendGamepadInput: vi.fn(),
      };

      setupInputForwarding(video, mockInstance as never);

      const mouseEvent = new MouseEvent('mousemove', { clientX: 400, clientY: 300 });
      video.dispatchEvent(mouseEvent);

      expect(mockInstance.sendMouseInput).toHaveBeenCalledWith({
        type: 'mousemove',
        x: 0.5,
        y: 0.5,
      });
    });

    it('should cleanup handlers', () => {
      const video = document.createElement('video');
      const mockInstance = {
        sendKeyboardInput: vi.fn(),
        sendMouseInput: vi.fn(),
        sendTouchInput: vi.fn(),
        sendGamepadInput: vi.fn(),
      };

      const cleanup = setupInputForwarding(video, mockInstance as never);
      cleanup();

      const keyEvent = new KeyboardEvent('keydown', { keyCode: 65 });
      video.dispatchEvent(keyEvent);

      // Should not be called after cleanup
      expect(mockInstance.sendKeyboardInput).not.toHaveBeenCalled();
    });
  });
});

describe('UnrealEmbed Component', () => {
  it('should export UnrealEmbed', async () => {
    const { UnrealEmbed } = await import('./UnrealEmbed');
    expect(UnrealEmbed).toBeDefined();
  });

  it('should export createUnrealEmbedElement', async () => {
    const { createUnrealEmbedElement } = await import('./UnrealEmbed');
    expect(createUnrealEmbedElement).toBeDefined();
  });

  it('should export UnrealStatsOverlay', async () => {
    const { UnrealStatsOverlay } = await import('./UnrealEmbed');
    expect(UnrealStatsOverlay).toBeDefined();
  });
});

describe('Pixel Streaming Types', () => {
  it('should export types', async () => {
    const types = await import('./types');
    expect(types).toBeDefined();
  });
});
