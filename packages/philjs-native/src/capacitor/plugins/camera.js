// @ts-nocheck
/**
 * PhilJS Native - Capacitor Camera Plugin
 *
 * Unified camera access for photo and video capture with
 * support for both native camera and photo library.
 */
import { signal } from '@philjs/core';
import { isCapacitor, isNativePlatform, callPlugin, registerPlugin, } from '../index.js';
// ============================================================================
// State
// ============================================================================
/**
 * Camera permission state
 */
export const cameraPermission = signal({
    camera: 'prompt',
    photos: 'prompt',
});
/**
 * Last captured photo
 */
export const lastPhoto = signal(null);
// ============================================================================
// Web Implementation
// ============================================================================
/**
 * Web camera implementation
 */
const WebCamera = {
    async getPhoto(options) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            if (options.source === 'camera') {
                input.capture = options.direction === 'front' ? 'user' : 'environment';
            }
            input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) {
                    reject(new Error('No file selected'));
                    return;
                }
                try {
                    const result = await processImageFile(file, options);
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            };
            input.oncancel = () => {
                reject(new Error('User cancelled'));
            };
            input.click();
        });
    },
    async checkPermissions() {
        // Web permissions are handled by the browser
        try {
            const result = await navigator.permissions.query({
                name: 'camera',
            });
            return {
                camera: result.state,
                photos: 'granted', // Photos don't require permission on web
            };
        }
        catch {
            return { camera: 'prompt', photos: 'granted' };
        }
    },
    async requestPermissions() {
        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((track) => track.stop());
            return { camera: 'granted', photos: 'granted' };
        }
        catch {
            return { camera: 'denied', photos: 'granted' };
        }
    },
};
/**
 * Process image file from input
 */
async function processImageFile(file, options) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                let dataUrl = reader.result;
                // Resize if dimensions specified
                if (options.width || options.height) {
                    dataUrl = await resizeImage(dataUrl, options.width, options.height, options.quality);
                }
                const base64String = dataUrl.split(',')[1];
                const format = file.type.split('/')[1] || 'jpeg';
                const photo = {
                    dataUrl: options.resultType === 'dataUrl' ? dataUrl : undefined,
                    base64String: options.resultType === 'base64' ? base64String : undefined,
                    webPath: URL.createObjectURL(file),
                    format,
                    saved: false,
                };
                resolve(photo);
            }
            catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}
/**
 * Resize image
 */
async function resizeImage(dataUrl, maxWidth, maxHeight, quality = 90) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            // Calculate new dimensions
            if (maxWidth && width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (maxHeight && height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
            // Create canvas and draw resized image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality / 100));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}
// ============================================================================
// Camera API
// ============================================================================
/**
 * Register the camera plugin
 */
registerPlugin('Camera', { web: WebCamera });
/**
 * Camera API
 */
export const CapacitorCamera = {
    /**
     * Capture a photo
     */
    async getPhoto(options = {}) {
        const defaultOptions = {
            quality: 90,
            allowEditing: false,
            resultType: 'uri',
            source: 'prompt',
            direction: 'rear',
            saveToGallery: false,
            correctOrientation: true,
        };
        const mergedOptions = { ...defaultOptions, ...options };
        if (!isNativePlatform()) {
            const photo = await WebCamera.getPhoto(mergedOptions);
            lastPhoto.set(photo);
            return photo;
        }
        try {
            const photo = await callPlugin('Camera', 'getPhoto', mergedOptions);
            lastPhoto.set(photo);
            return photo;
        }
        catch (error) {
            throw new Error(`Camera error: ${error.message}`);
        }
    },
    /**
     * Pick images from gallery
     */
    async pickImages(options = {}) {
        if (!isNativePlatform()) {
            return new Promise((resolve, reject) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.multiple = true;
                input.onchange = async () => {
                    const files = Array.from(input.files || []);
                    if (files.length === 0) {
                        reject(new Error('No files selected'));
                        return;
                    }
                    try {
                        const limit = options.limit || files.length;
                        const selectedFiles = files.slice(0, limit);
                        const photos = await Promise.all(selectedFiles.map((file) => processImageFile(file, {
                            resultType: 'uri',
                            width: options.width,
                            height: options.height,
                            quality: options.quality,
                        })));
                        resolve(photos);
                    }
                    catch (error) {
                        reject(error);
                    }
                };
                input.click();
            });
        }
        try {
            const result = await callPlugin('Camera', 'pickImages', options);
            return result.photos;
        }
        catch (error) {
            throw new Error(`Pick images error: ${error.message}`);
        }
    },
    /**
     * Check camera permissions
     */
    async checkPermissions() {
        if (!isNativePlatform()) {
            const permissions = await WebCamera.checkPermissions();
            cameraPermission.set(permissions);
            return permissions;
        }
        try {
            const permissions = await callPlugin('Camera', 'checkPermissions');
            cameraPermission.set(permissions);
            return permissions;
        }
        catch {
            return { camera: 'prompt', photos: 'prompt' };
        }
    },
    /**
     * Request camera permissions
     */
    async requestPermissions(permissions) {
        if (!isNativePlatform()) {
            const result = await WebCamera.requestPermissions();
            cameraPermission.set(result);
            return result;
        }
        try {
            const result = await callPlugin('Camera', 'requestPermissions', permissions);
            cameraPermission.set(result);
            return result;
        }
        catch {
            return { camera: 'denied', photos: 'denied' };
        }
    },
    /**
     * Pick a video from gallery
     */
    async pickVideo() {
        if (!isNativePlatform()) {
            return new Promise((resolve, reject) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'video/*';
                input.onchange = () => {
                    const file = input.files?.[0];
                    if (!file) {
                        reject(new Error('No file selected'));
                        return;
                    }
                    const webPath = URL.createObjectURL(file);
                    resolve({
                        path: file.name,
                        webPath,
                    });
                };
                input.click();
            });
        }
        try {
            return await callPlugin('Camera', 'pickVideo');
        }
        catch (error) {
            throw new Error(`Pick video error: ${error.message}`);
        }
    },
};
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to get camera permissions
 */
export function useCameraPermissions() {
    return cameraPermission();
}
/**
 * Hook to get last captured photo
 */
export function useLastPhoto() {
    return lastPhoto();
}
// ============================================================================
// Exports
// ============================================================================
export default CapacitorCamera;
//# sourceMappingURL=camera.js.map