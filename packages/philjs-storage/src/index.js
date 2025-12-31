/**
 * PhilJS Storage - Cloud Storage Abstraction Layer
 *
 * Unified interface for S3, GCS, Azure Blob Storage, local filesystem, and in-memory storage.
 * Supports direct uploads, streaming, multipart uploads, and signed URLs.
 */
// ============================================================================
// Abstract Storage Client
// ============================================================================
/**
 * Abstract storage client - base class for all storage providers
 */
export class StorageClient {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Get the bucket name
     */
    get bucket() {
        return this.config.bucket;
    }
    /**
     * Build full key with base path
     */
    buildKey(key) {
        if (this.config.basePath) {
            return `${this.config.basePath.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
        }
        return key.replace(/^\//, '');
    }
    /**
     * Strip base path from key
     */
    stripBasePath(key) {
        if (this.config.basePath) {
            const prefix = this.config.basePath.replace(/\/$/, '') + '/';
            if (key.startsWith(prefix)) {
                return key.slice(prefix.length);
            }
        }
        return key;
    }
    /**
     * Move a file to a new location
     *
     * @param sourceKey - Source file key/path
     * @param destinationKey - Destination file key/path
     * @param options - Move options
     * @returns Moved file metadata
     */
    async move(sourceKey, destinationKey, options) {
        const copied = await this.copy(sourceKey, destinationKey, options);
        await this.delete(sourceKey);
        return copied;
    }
}
export async function createStorageClient(provider, config) {
    switch (provider) {
        case 's3': {
            const { S3StorageClient } = await import('./providers/s3.js');
            return new S3StorageClient(config);
        }
        case 'gcs': {
            const { GCSStorageClient } = await import('./providers/gcs.js');
            return new GCSStorageClient(config);
        }
        case 'azure': {
            const { AzureStorageClient } = await import('./providers/azure.js');
            return new AzureStorageClient(config);
        }
        case 'local': {
            const { LocalStorageClient } = await import('./providers/local.js');
            return new LocalStorageClient(config);
        }
        case 'memory': {
            const { MemoryStorageClient } = await import('./providers/memory.js');
            return new MemoryStorageClient(config);
        }
        default:
            throw new Error(`Unknown storage provider: ${provider}`);
    }
}
// ============================================================================
// Re-exports
// ============================================================================
export { S3StorageClient } from './providers/s3.js';
export { GCSStorageClient } from './providers/gcs.js';
export { AzureStorageClient } from './providers/azure.js';
export { LocalStorageClient } from './providers/local.js';
export { MemoryStorageClient } from './providers/memory.js';
export { detectMimeType, getMimeTypeFromExtension } from './utils/mime.js';
export { resizeImage } from './utils/resize.js';
export { createStreamingUpload, streamToBuffer, bufferToStream, } from './utils/stream.js';
export { useUpload, useDownload, useFileList } from './hooks.js';
//# sourceMappingURL=index.js.map