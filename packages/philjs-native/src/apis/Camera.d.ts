/**
 * Camera API
 *
 * Native camera access for photos and video.
 */
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
    quality?: number;
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
    maxDuration?: number;
    maxFileSize?: number;
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
    onBarCodeRead?: (data: {
        type: string;
        data: string;
    }) => void;
    style?: Record<string, any>;
}
/**
 * Camera API singleton
 */
export declare const Camera: {
    /**
     * Request camera permission
     */
    requestPermission(): Promise<CameraPermissionStatus>;
    /**
     * Check camera permission status
     */
    getPermissionStatus(): Promise<CameraPermissionStatus>;
    /**
     * Take a photo
     */
    takePicture(options?: PhotoOptions): Promise<PhotoResult>;
    /**
     * Record video
     */
    recordVideo(options?: VideoOptions): Promise<VideoResult>;
    /**
     * Stop video recording
     */
    stopRecording(): Promise<void>;
    /**
     * Get available cameras
     */
    getAvailableCameras(): Promise<{
        type: CameraType;
        id: string;
    }[]>;
    /**
     * Pick image from library
     */
    pickImage(options?: {
        allowsEditing?: boolean;
        aspect?: [number, number];
        quality?: number;
        mediaTypes?: "Images" | "Videos" | "All";
        allowsMultipleSelection?: boolean;
        selectionLimit?: number;
    }): Promise<PhotoResult | PhotoResult[]>;
    /**
     * Camera component for rendering camera preview
     */
    Component(props: CameraProps): any;
};
export default Camera;
//# sourceMappingURL=Camera.d.ts.map