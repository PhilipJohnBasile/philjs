/**
 * PhilJS Storage - Cloud Storage Abstraction Layer
 *
 * Unified interface for S3, GCS, Azure Blob Storage, local filesystem, and in-memory storage.
 * Supports direct uploads, streaming, multipart uploads, and signed URLs.
 */
export { StorageClient, } from './client.js';
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