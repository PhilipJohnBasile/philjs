/**
 * PhilJS Storage - Cloud Storage Abstraction Layer
 *
 * Unified interface for S3, GCS, Azure Blob Storage, local filesystem, and in-memory storage.
 * Supports direct uploads, streaming, multipart uploads, and signed URLs.
 */
import type { StorageClient, S3Config, GCSConfig, AzureConfig, LocalConfig, MemoryConfig } from './client.js';
export { StorageClient, } from './client.js';
export type { StorageFile, UploadOptions, UploadProgress, DownloadOptions, DownloadProgress, ListOptions, ListResult, SignedUrlOptions, CopyOptions, MoveOptions, StorageConfig, S3Config, GCSConfig, AzureConfig, LocalConfig, MemoryConfig, StorageProviderType, } from './client.js';
/**
 * Create a storage client for the specified provider
 */
export declare function createStorageClient(provider: 's3', config: S3Config): Promise<StorageClient>;
export declare function createStorageClient(provider: 'gcs', config: GCSConfig): Promise<StorageClient>;
export declare function createStorageClient(provider: 'azure', config: AzureConfig): Promise<StorageClient>;
export declare function createStorageClient(provider: 'local', config: LocalConfig): Promise<StorageClient>;
export declare function createStorageClient(provider: 'memory', config: MemoryConfig): Promise<StorageClient>;
export { S3StorageClient } from './providers/s3.js';
export { GCSStorageClient } from './providers/gcs.js';
export { AzureStorageClient } from './providers/azure.js';
export { LocalStorageClient } from './providers/local.js';
export { MemoryStorageClient } from './providers/memory.js';
export { detectMimeType, getMimeTypeFromExtension } from './utils/mime.js';
export { resizeImage, type ResizeOptions } from './utils/resize.js';
export { createStreamingUpload, streamToBuffer, bufferToStream, type StreamingUploadOptions, } from './utils/stream.js';
export { useUpload, useDownload, useFileList } from './hooks.js';
//# sourceMappingURL=index.d.ts.map