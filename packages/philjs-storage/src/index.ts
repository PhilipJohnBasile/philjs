/**
 * PhilJS Storage - Cloud Storage Abstraction Layer
 *
 * Unified interface for S3, GCS, Azure Blob Storage, local filesystem, and in-memory storage.
 * Supports direct uploads, streaming, multipart uploads, and signed URLs.
 */

import type {
  StorageClient,
  StorageConfig,
  StorageProviderType,
  S3Config,
  GCSConfig,
  AzureConfig,
  LocalConfig,
  MemoryConfig,
} from './client.js';

export {
  StorageClient,
} from './client.js';
export type {
  StorageFile,
  UploadOptions,
  UploadProgress,
  DownloadOptions,
  DownloadProgress,
  ListOptions,
  ListResult,
  SignedUrlOptions,
  CopyOptions,
  MoveOptions,
  StorageConfig,
  S3Config,
  GCSConfig,
  AzureConfig,
  LocalConfig,
  MemoryConfig,
  StorageProviderType,
} from './client.js';

// ============================================================================
// Storage Factory
// ============================================================================

/**
 * Create a storage client for the specified provider
 */
export async function createStorageClient(
  provider: 's3',
  config: S3Config
): Promise<StorageClient>;
export async function createStorageClient(
  provider: 'gcs',
  config: GCSConfig
): Promise<StorageClient>;
export async function createStorageClient(
  provider: 'azure',
  config: AzureConfig
): Promise<StorageClient>;
export async function createStorageClient(
  provider: 'local',
  config: LocalConfig
): Promise<StorageClient>;
export async function createStorageClient(
  provider: 'memory',
  config: MemoryConfig
): Promise<StorageClient>;
export async function createStorageClient(
  provider: StorageProviderType,
  config: StorageConfig
): Promise<StorageClient> {
  switch (provider) {
    case 's3': {
      const { S3StorageClient } = await import('./providers/s3.js');
      return new S3StorageClient(config as S3Config);
    }
    case 'gcs': {
      const { GCSStorageClient } = await import('./providers/gcs.js');
      return new GCSStorageClient(config as GCSConfig);
    }
    case 'azure': {
      const { AzureStorageClient } = await import('./providers/azure.js');
      return new AzureStorageClient(config as AzureConfig);
    }
    case 'local': {
      const { LocalStorageClient } = await import('./providers/local.js');
      return new LocalStorageClient(config as LocalConfig);
    }
    case 'memory': {
      const { MemoryStorageClient } = await import('./providers/memory.js');
      return new MemoryStorageClient(config as MemoryConfig);
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
export { resizeImage, type ResizeOptions } from './utils/resize.js';
export {
  createStreamingUpload,
  streamToBuffer,
  bufferToStream,
  type StreamingUploadOptions,
} from './utils/stream.js';

export { useUpload, useDownload, useFileList } from './hooks.js';
