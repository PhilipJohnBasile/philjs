/**
 * Image Extension with Upload and Embed Support
 *
 * Supports drag-drop, paste, and manual upload of images
 */
import Image from '@tiptap/extension-image';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
const imageUploadPluginKey = new PluginKey('imageUpload');
/**
 * Create image upload plugin for drag-drop and paste
 */
function createImageUploadPlugin(options) {
    const { uploadFn, maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], uploadEndpoint, uploadHeaders = {}, } = options;
    const upload = async (file) => {
        // Validate file size
        if (file.size > maxSize) {
            throw new Error(`File size exceeds maximum allowed (${maxSize / 1024 / 1024}MB)`);
        }
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} is not allowed`);
        }
        // Use custom upload function if provided
        if (uploadFn) {
            return uploadFn(file);
        }
        // Use upload endpoint if provided
        if (uploadEndpoint) {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(uploadEndpoint, {
                method: 'POST',
                headers: uploadHeaders,
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
            const data = await response.json();
            return data.url;
        }
        // Default: convert to base64 data URL
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };
    return new Plugin({
        key: imageUploadPluginKey,
        props: {
            handleDOMEvents: {
                drop: (view, event) => {
                    const hasFiles = event.dataTransfer?.files?.length;
                    if (!hasFiles) {
                        return false;
                    }
                    const images = Array.from(event.dataTransfer.files).filter((file) => allowedTypes.includes(file.type));
                    if (images.length === 0) {
                        return false;
                    }
                    event.preventDefault();
                    const { schema } = view.state;
                    const coordinates = view.posAtCoords({
                        left: event.clientX,
                        top: event.clientY,
                    });
                    if (!coordinates) {
                        return false;
                    }
                    images.forEach(async (image) => {
                        try {
                            const url = await upload(image);
                            const node = schema.nodes['image'].create({ src: url, alt: image.name });
                            const transaction = view.state.tr.insert(coordinates.pos, node);
                            view.dispatch(transaction);
                        }
                        catch (error) {
                            console.error('Image upload failed:', error);
                        }
                    });
                    return true;
                },
                paste: (view, event) => {
                    const hasFiles = event.clipboardData?.files?.length;
                    if (!hasFiles) {
                        return false;
                    }
                    const images = Array.from(event.clipboardData.files).filter((file) => allowedTypes.includes(file.type));
                    if (images.length === 0) {
                        return false;
                    }
                    event.preventDefault();
                    const { schema } = view.state;
                    images.forEach(async (image) => {
                        try {
                            const url = await upload(image);
                            const node = schema.nodes['image'].create({ src: url, alt: image.name });
                            const transaction = view.state.tr.replaceSelectionWith(node);
                            view.dispatch(transaction);
                        }
                        catch (error) {
                            console.error('Image upload failed:', error);
                        }
                    });
                    return true;
                },
            },
        },
    });
}
/**
 * Image Upload Extension
 */
export const ImageUpload = Extension.create({
    name: 'imageUpload',
    addOptions() {
        return {
            maxSize: 10 * 1024 * 1024,
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
            uploadHeaders: {},
        };
    },
    addProseMirrorPlugins() {
        return [createImageUploadPlugin(this.options)];
    },
});
/**
 * Create configured image extension with upload support
 */
export function createImageExtension(options = {}) {
    const { inline = false, allowResize = true, defaultWidth = '100%', ...uploadOptions } = options;
    return [
        Image.configure({
            inline,
            allowBase64: true,
            HTMLAttributes: {
                class: 'philjs-image',
                style: `max-width: ${defaultWidth}`,
            },
        }),
        ImageUpload.configure(uploadOptions),
    ];
}
/**
 * Helper to insert image by URL
 */
export function insertImageByUrl(editor, url, alt) {
    editor.chain().focus().setImage({ src: url, alt: alt || '' }).run();
}
/**
 * Helper to open file picker and upload image
 */
export async function pickAndUploadImage(editor, uploadFn) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file)
            return;
        try {
            const url = await uploadFn(file);
            insertImageByUrl(editor, url, file.name);
        }
        catch (error) {
            console.error('Image upload failed:', error);
        }
    };
    input.click();
}
export { Image };
export default createImageExtension;
//# sourceMappingURL=image.js.map