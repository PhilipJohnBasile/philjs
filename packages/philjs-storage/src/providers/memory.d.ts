/**
 * In-Memory Storage Provider
 *
 * Memory-based storage for testing and development.
 * Data is lost when the process exits.
 */
import { StorageClient, type MemoryConfig, type StorageFile, type UploadOptions, type DownloadOptions, type ListOptions, type ListResult, type SignedUrlOptions, type CopyOptions } from '../client.js';
interface StoredFile {
    data: Buffer;
    contentType: string;
    metadata?: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * In-memory storage client for testing
 */
export declare class MemoryStorageClient extends StorageClient {
    private storage;
    private memoryConfig;
    private currentSize;
    constructor(config: MemoryConfig);
    /**
     * Get current storage size in bytes
     */
    get size(): number;
    /**
     * Clear all stored files
     */
    clear(): void;
    /**
     * Get number of stored files
     */
    get count(): number;
    upload(key: string, data: Buffer | Blob | ReadableStream<Uint8Array> | string, options?: UploadOptions): Promise<StorageFile>;
    download(key: string, options?: DownloadOptions): Promise<Buffer>;
    downloadStream(key: string, options?: DownloadOptions): Promise<ReadableStream<Uint8Array>>;
    delete(key: string): Promise<void>;
    deleteMany(keys: string[]): Promise<void>;
    list(options?: ListOptions): Promise<ListResult>;
    getMetadata(key: string): Promise<StorageFile | null>;
    exists(key: string): Promise<boolean>;
    getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
    copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<StorageFile>;
    getPublicUrl(key: string): string;
    /**
     * Get raw file data (for testing)
     */
    getFile(key: string): StoredFile | undefined;
    /**
     * Set raw file data (for testing)
     */
    setFile(key: string, file: StoredFile): void;
}
export {};
//# sourceMappingURL=memory.d.ts.map