/**
 * Camera API
 *
 * Native camera access for photos and video.
 */
import { signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
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
    async requestPermission() {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
                return 'granted';
            }
            catch (error) {
                if (error.name === 'NotAllowedError') {
                    return 'denied';
                }
                return 'denied';
            }
        }
        return nativeBridge.call('Camera', 'requestPermission');
    },
    /**
     * Check camera permission status
     */
    async getPermissionStatus() {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                const result = await navigator.permissions.query({ name: 'camera' });
                if (result.state === 'granted')
                    return 'granted';
                if (result.state === 'denied')
                    return 'denied';
                return 'undetermined';
            }
            catch {
                return 'undetermined';
            }
        }
        return nativeBridge.call('Camera', 'getPermissionStatus');
    },
    /**
     * Take a photo
     */
    async takePicture(options = {}) {
        const platform = detectPlatform();
        if (platform === 'web') {
            return takePictureWeb(options);
        }
        return nativeBridge.call('Camera', 'takePicture', options);
    },
    /**
     * Record video
     */
    async recordVideo(options = {}) {
        const platform = detectPlatform();
        if (platform === 'web') {
            return recordVideoWeb(options);
        }
        return nativeBridge.call('Camera', 'recordVideo', options);
    },
    /**
     * Stop video recording
     */
    async stopRecording() {
        const platform = detectPlatform();
        if (platform !== 'web') {
            await nativeBridge.call('Camera', 'stopRecording');
        }
    },
    /**
     * Get available cameras
     */
    async getAvailableCameras() {
        const platform = detectPlatform();
        if (platform === 'web') {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices
                .filter(d => d.kind === 'videoinput')
                .map((d, i) => ({
                type: (d.label.toLowerCase().includes('front') ? 'front' : 'back'),
                id: d.deviceId,
            }));
        }
        return nativeBridge.call('Camera', 'getAvailableCameras');
    },
    /**
     * Pick image from library
     */
    async pickImage(options = {}) {
        const platform = detectPlatform();
        if (platform === 'web') {
            return pickImageWeb(options);
        }
        return nativeBridge.call('Camera', 'pickImage', options);
    },
    /**
     * Camera component for rendering camera preview
     */
    Component(props) {
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
                    ref: async (video) => {
                        if (!video)
                            return;
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({
                                video: {
                                    facingMode: props.type === 'front' ? 'user' : 'environment',
                                },
                            });
                            video.srcObject = stream;
                            props.onCameraReady?.();
                        }
                        catch (error) {
                            props.onMountError?.(error);
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
let activeStream = null;
let mediaRecorder = null;
let recordedChunks = [];
async function takePictureWeb(options) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();
    const canvas = document.createElement('canvas');
    canvas.width = options.width || video.videoWidth;
    canvas.height = options.height || video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stream.getTracks().forEach(track => track.stop());
    const quality = options.quality || 0.9;
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const result = {
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
async function recordVideoWeb(options) {
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
        }
        catch (error) {
            reject(error);
        }
    });
}
async function pickImageWeb(options) {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        const acceptTypes = [];
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
            const results = [];
            for (const file of files) {
                const uri = URL.createObjectURL(file);
                // Get dimensions for images
                let width = 0;
                let height = 0;
                if (file.type.startsWith('image/')) {
                    const img = new globalThis.Image();
                    await new Promise((res) => {
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
            resolve(options.allowsMultipleSelection ? results : results[0]);
        };
        input.click();
    });
}
// ============================================================================
// Export
// ============================================================================
export default Camera;
//# sourceMappingURL=Camera.js.map