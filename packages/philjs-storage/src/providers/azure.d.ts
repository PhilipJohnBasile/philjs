/**
 * Azure Blob Storage Provider
 *
 * Full-featured Azure Blob Storage integration with streaming,
 * SAS URLs, and block blob uploads.
 */
import { StorageClient, type AzureConfig, type StorageFile, type UploadOptions, type DownloadOptions, type ListOptions, type ListResult, type SignedUrlOptions, type CopyOptions } from '../index.js';
/**
 * Azure Blob Storage client
 */
export declare class AzureStorageClient extends StorageClient {
    private containerClient;
    private blobServiceClient;
    private azureConfig;
    private sharedKeyCredential?;
    constructor(config: AzureConfig);
    private getBlobClient;
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
//# sourceMappingURL=azure.d.ts.map