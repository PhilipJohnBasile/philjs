/**
 * PhilJS Native - Capacitor Camera Plugin
 *
 * Unified camera access for photo and video capture with
 * support for both native camera and photo library.
 */
import { type Signal } from 'philjs-core';
/**
 * Camera source type
 */
export type CameraSource = 'camera' | 'photos' | 'prompt';
/**
 * Camera result type
 */
export type CameraResultType = 'uri' | 'base64' | 'dataUrl';
/**
 * Camera direction
 */
export type CameraDirection = 'front' | 'rear';
/**
 * Photo options
 */
export interface CameraPhotoOptions {
    quality?: number;
    allowEditing?: boolean;
    resultType?: CameraResultType;
    source?: CameraSource;
    direction?: CameraDirection;
    saveToGallery?: boolean;
    width?: number;
    height?: number;
    correctOrientation?: boolean;
    presentationStyle?: 'fullscreen' | 'popover';
    promptLabelHeader?: string;
    promptLabelCancel?: string;
    promptLabelPhoto?: string;
    promptLabelPicture?: string;
}
/**
 * Photo result
 */
export interface CameraPhoto {
    base64String?: string;
    dataUrl?: string;
    path?: string;
    webPath?: string;
    format: string;
    saved: boolean;
    exif?: Record<string, unknown>;
}
/**
 * Camera permission status
 */
export type CameraPermissionState = 'prompt' | 'granted' | 'denied';
export interface CameraPermissions {
    camera: CameraPermissionState;
    photos: CameraPermissionState;
}
/**
 * Camera permission state
 */
export declare const cameraPermission: Signal<CameraPermissions>;
/**
 * Last captured photo
 */
export declare const lastPhoto: Signal<CameraPhoto | null>;
/**
 * Camera API
 */
export declare const CapacitorCamera: {
    /**
     * Capture a photo
     */
    getPhoto(options?: CameraPhotoOptions): Promise<CameraPhoto>;
    /**
     * Pick images from gallery
     */
    pickImages(options?: {
        quality?: number;
        width?: number;
        height?: number;
        limit?: number;
    }): Promise<CameraPhoto[]>;
    /**
     * Check camera permissions
     */
    checkPermissions(): Promise<CameraPermissions>;
    /**
     * Request camera permissions
     */
    requestPermissions(permissions?: {
        permissions: Array<"camera" | "photos">;
    }): Promise<CameraPermissions>;
    /**
     * Pick a video from gallery
     */
    pickVideo(): Promise<{
        path: string;
        webPath: string;
        duration?: number;
    }>;
};
/**
 * Hook to get camera permissions
 */
export declare function useCameraPermissions(): CameraPermissions;
/**
 * Hook to get last captured photo
 */
export declare function useLastPhoto(): CameraPhoto | null;
export default CapacitorCamera;
//# sourceMappingURL=camera.d.ts.map