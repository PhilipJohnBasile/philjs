/**
 * Camera API
 *
 * Native camera access for photos and video.
 */

import { signal, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Camera type
 */
export type CameraType = 'front' | 'back';

/**
 * Flash mode
 */
export type FlashMode = 'auto' | 'on' | 'off' | 'torch';

/**
 * Camera permission status
 */
export type CameraPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'restricted';

/**
 * Photo options
 */
export interface PhotoOptions {
  quality?: number; // 0-1
  width?: number;
  height?: number;
  base64?: boolean;
  exif?: boolean;
  skipProcessing?: boolean;
}

/**
 * Video options
 */
export interface VideoOptions {
  quality?: 'low' | 'medium' | 'high' | '480p' | '720p' | '1080p' | '2160p';
  maxDuration?: number; // seconds
  maxFileSize?: number; // bytes
  mute?: boolean;
}

/**
 * Photo result
 */
export interface PhotoResult {
  uri: string;
  width: number;
  height: number;
  base64?: string | undefined;
  exif?: Record<string, any>;
}

/**
 * Video result
 */
export interface VideoResult {
  uri: string;
  duration: number;
  width: number;
  height: number;
  fileSize: number;
}

/**
 * Camera props for component
 */
export interface CameraProps {
  type?: CameraType;
  flashMode?: FlashMode;
  zoom?: number;
  autoFocus?: boolean;
  whiteBalance?: 'auto' | 'sunny' | 'cloudy' | 'shadow' | 'incandescent' | 'fluorescent';
  ratio?: string;
  onCameraReady?: () => void;
  onMountError?: (error: Error) => void;
  onBarCodeRead?: (data: { type: string; data: string }) => void;
  style?: Record<string, any>;
}

// ============================================================================
// Camera API
// ============================================================================

/**
 * Camera API singleton
 */
export const Camera = {
  /**
   * Request camera permission
   */
  async requestPermission(): Promise<CameraPermissionStatus> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return 'granted';
      } catch (error) {
        if ((error as any).name === 'NotAllowedError') {
          return 'denied';
        }
        return 'denied';
      }
    }

    return nativeBridge.call<CameraPermissionStatus>('Camera', 'requestPermission');
  },

  /**
   * Check camera permission status
   */
  async getPermissionStatus(): Promise<CameraPermissionStatus> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (result.state === 'granted') return 'granted';
        if (result.state === 'denied') return 'denied';
        return 'undetermined';
      } catch {
        return 'undetermined';
      }
    }

    return nativeBridge.call<CameraPermissionStatus>('Camera', 'getPermissionStatus');
  },

  /**
   * Take a photo
   */
  async takePicture(options: PhotoOptions = {}): Promise<PhotoResult> {
    const platform = detectPlatform();

    if (platform === 'web') {
      return takePictureWeb(options);
    }

    return nativeBridge.call<PhotoResult>('Camera', 'takePicture', options);
  },

  /**
   * Record video
   */
  async recordVideo(options: VideoOptions = {}): Promise<VideoResult> {
    const platform = detectPlatform();

    if (platform === 'web') {
      return recordVideoWeb(options);
    }

    return nativeBridge.call<VideoResult>('Camera', 'recordVideo', options);
  },

  /**
   * Stop video recording
   */
  async stopRecording(): Promise<void> {
    const platform = detectPlatform();

    if (platform !== 'web') {
      await nativeBridge.call('Camera', 'stopRecording');
    }
  },

  /**
   * Get available cameras
   */
  async getAvailableCameras(): Promise<{ type: CameraType; id: string }[]> {
    const platform = detectPlatform();

    if (platform === 'web') {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(d => d.kind === 'videoinput')
        .map((d, i) => ({
          type: (d.label.toLowerCase().includes('front') ? 'front' : 'back') as CameraType,
          id: d.deviceId,
        }));
    }

    return nativeBridge.call('Camera', 'getAvailableCameras');
  },

  /**
   * Pick image from library
   */
  async pickImage(options: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    mediaTypes?: 'Images' | 'Videos' | 'All';
    allowsMultipleSelection?: boolean;
    selectionLimit?: number;
  } = {}): Promise<PhotoResult | PhotoResult[]> {
    const platform = detectPlatform();

    if (platform === 'web') {
      return pickImageWeb(options);
    }

    return nativeBridge.call('Camera', 'pickImage', options);
  },

  /**
   * Camera component for rendering camera preview
   */
  Component(props: CameraProps): any {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Return video element for web
      return {
        type: 'video',
        props: {
          autoPlay: true,
          playsInline: true,
          muted: true,
          style: {
            width: '100%',
            height: '100%',
            'object-fit': 'cover',
            transform: props.type === 'front' ? 'scaleX(-1)' : 'none',
            ...props.style,
          },
          ref: async (video: HTMLVideoElement) => {
            if (!video) return;
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                  facingMode: props.type === 'front' ? 'user' : 'environment',
                },
              });
              video.srcObject = stream;
              props.onCameraReady?.();
            } catch (error) {
              props.onMountError?.(error as Error);
            }
          },
        },
        children: null,
      };
    }

    return {
      type: 'NativeCamera',
      props,
      children: null,
    };
  },
};

// ============================================================================
// Web Implementation Helpers
// ============================================================================

let activeStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

async function takePictureWeb(options: PhotoOptions): Promise<PhotoResult> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const video = document.createElement('video');
  video.srcObject = stream;
  await video.play();

  const canvas = document.createElement('canvas');
  canvas.width = options.width || video.videoWidth;
  canvas.height = options.height || video.videoHeight;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  stream.getTracks().forEach(track => track.stop());

  const quality = options.quality || 0.9;
  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  const result: PhotoResult = {
    uri: dataUrl,
    width: canvas.width,
    height: canvas.height,
  };

  if (options.base64) {
    const base64Data = dataUrl.split(',')[1];
    if (base64Data !== undefined) {
      result.base64 = base64Data;
    }
  }

  return result;
}

async function recordVideoWeb(options: VideoOptions): Promise<VideoResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: !options.mute,
      });

      activeStream = stream;
      recordedChunks = [];

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const uri = URL.createObjectURL(blob);

        stream.getTracks().forEach(track => track.stop());

        resolve({
          uri,
          duration: 0, // Would need to calculate
          width: 0,
          height: 0,
          fileSize: blob.size,
        });
      };

      mediaRecorder.start();

      if (options.maxDuration) {
        setTimeout(() => {
          if (mediaRecorder?.state === 'recording') {
            mediaRecorder.stop();
          }
        }, options.maxDuration * 1000);
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function pickImageWeb(options: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: 'Images' | 'Videos' | 'All';
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
}): Promise<PhotoResult | PhotoResult[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';

    const acceptTypes: string[] = [];
    if (options.mediaTypes !== 'Videos') {
      acceptTypes.push('image/*');
    }
    if (options.mediaTypes === 'Videos' || options.mediaTypes === 'All') {
      acceptTypes.push('video/*');
    }
    input.accept = acceptTypes.join(',');

    if (options.allowsMultipleSelection) {
      input.multiple = true;
    }

    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (files.length === 0) {
        reject(new Error('No file selected'));
        return;
      }

      const results: PhotoResult[] = [];

      for (const file of files) {
        const uri = URL.createObjectURL(file);

        // Get dimensions for images
        let width = 0;
        let height = 0;

        if (file.type.startsWith('image/')) {
          const img = new (globalThis as any).Image();
          await new Promise<void>((res) => {
            img.onload = () => {
              width = img.naturalWidth;
              height = img.naturalHeight;
              res();
            };
            img.src = uri;
          });
        }

        results.push({ uri, width, height });

        if (options.selectionLimit && results.length >= options.selectionLimit) {
          break;
        }
      }

      resolve(options.allowsMultipleSelection ? results : results[0]!);
    };

    input.click();
  });
}

// ============================================================================
// Export
// ============================================================================

export default Camera;
