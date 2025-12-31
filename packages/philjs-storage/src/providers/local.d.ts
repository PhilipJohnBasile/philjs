/**
 * Local Filesystem Storage Provider
 *
 * File-based storage for development, testing, and self-hosted deployments.
 * Supports all StorageClient operations with local files.
 *
 * Optimized for Node 24+ with:
 * - Native ReadableStream
 * - Efficient buffer operations
 * - Modern async patterns
 */
import { StorageClient, type LocalConfig, type StorageFile, type UploadOptions, type DownloadOptions, type ListOptions, type ListResult, type SignedUrlOptions, type CopyOptions } from '../index.js';
/**
 * Local filesystem storage client
 */
export declare class LocalStorageClient extends StorageClient {
    private directory;
    private publicUrl?;
    private localConfig;
    private metadataDir;
    constructor(config: LocalConfig);
    private getFilePath;
    private getMetadataPath;
    private saveMetadata;
    private loadMetadata;
    private deleteMetadata;
    upload(key: string, data: Buffer | Blob | ReadableStream<Uint8Array> | string, options?: UploadOptions): Promise<StorageFile>;
    download(key: string, options?: DownloadOptions): Promise<Buffer>;
    downloadStream(key: string, options?: DownloadOptions): Promise<ReadableStream<Uint8Array>>;
    delete(key: string): Promise<void>;
    deleteMany(keys: string[]): Promise<void>;
    list(options?: ListOptions): Promise<ListResult>;
    private listRecursive;
    getMetadata(key: string): Promise<StorageFile | null>;
    exists(key: string): Promise<boolean>;
    getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
    copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<StorageFile>;
    getPublicUrl(key: string): string;
}
//# sourceMappingURL=local.d.ts.map