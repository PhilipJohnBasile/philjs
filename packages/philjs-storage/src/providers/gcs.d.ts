/**
 * Google Cloud Storage Provider
 *
 * Full-featured GCS integration with streaming, signed URLs, and multipart uploads.
 */
import { StorageClient, type GCSConfig, type StorageFile, type UploadOptions, type DownloadOptions, type ListOptions, type ListResult, type SignedUrlOptions, type CopyOptions } from '../index.js';
/**
 * Google Cloud Storage client
 */
export declare class GCSStorageClient extends StorageClient {
    private storage;
    private bucketRef;
    private gcsConfig;
    constructor(config: GCSConfig);
    private file;
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
//# sourceMappingURL=gcs.d.ts.map