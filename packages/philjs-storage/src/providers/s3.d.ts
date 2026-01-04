/**
 * AWS S3 / Cloudflare R2 Storage Provider
 *
 * Supports both AWS S3 and S3-compatible services like Cloudflare R2,
 * MinIO, DigitalOcean Spaces, etc.
 */
import { StorageClient, type S3Config, type StorageFile, type UploadOptions, type DownloadOptions, type ListOptions, type ListResult, type SignedUrlOptions, type CopyOptions } from '../client.js';
/**
 * AWS S3 / Cloudflare R2 storage client
 */
export declare class S3StorageClient extends StorageClient {
    private client;
    private s3Config;
    constructor(config: S3Config);
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
}
//# sourceMappingURL=s3.d.ts.map