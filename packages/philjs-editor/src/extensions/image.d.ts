/**
 * Image Extension with Upload and Embed Support
 *
 * Supports drag-drop, paste, and manual upload of images
 */
import Image from '@tiptap/extension-image';
export interface ImageUploadOptions {
    /**
     * Function to upload image and return URL
     */
    uploadFn?: (file: File) => Promise<string>;
    /**
     * Maximum file size in bytes (default: 10MB)
     */
    maxSize?: number;
    /**
     * Allowed MIME types
     */
    allowedTypes?: string[];
    /**
     * Custom upload endpoint
     */
    uploadEndpoint?: string;
    /**
     * Additional headers for upload request
     */
    uploadHeaders?: Record<string, string>;
}
export interface ImageExtensionOptions extends ImageUploadOptions {
    /**
     * Allow inline images
     */
    inline?: boolean;
    /**
     * Allow image resizing
     */
    allowResize?: boolean;
    /**
     * Default image width
     */
    defaultWidth?: string;
}
/**
 * Image Upload Extension
 */
export declare const ImageUpload: any;
/**
 * Create configured image extension with upload support
 */
export declare function createImageExtension(options?: ImageExtensionOptions): any[];
/**
 * Helper to insert image by URL
 */
export declare function insertImageByUrl(editor: any, url: string, alt?: string): void;
/**
 * Helper to open file picker and upload image
 */
export declare function pickAndUploadImage(editor: any, uploadFn: (file: File) => Promise<string>): Promise<void>;
export { Image };
export default createImageExtension;
//# sourceMappingURL=image.d.ts.map