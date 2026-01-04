/**
 * Shared storage types and base client.
 */
/**
 * Storage file metadata
 */
export interface StorageFile {
    /** Unique file key/path */
    key: string;
    /** File size in bytes */
    size: number;
    /** MIME type */
    contentType: string;
    /** Last modified timestamp */
    lastModified: Date;
    /** ETag for cache validation */
    etag?: string;
    /** Custom metadata */
    metadata?: Record<string, string>;
}
/**
 * Upload options
 */
export interface UploadOptions {
    /** MIME type (auto-detected if not provided) */
    contentType?: string;
    /** Custom metadata */
    metadata?: Record<string, string>;
    /** Cache control header */
    cacheControl?: string;
    /** Content disposition (inline/attachment) */
    contentDisposition?: string;
    /** Access control (public-read, private, etc.) */
    acl?: 'private' | 'public-read' | 'authenticated-read';
    /** Enable multipart upload for large files */
    multipart?: boolean;
    /** Part size for multipart uploads (default: 5MB) */
    partSize?: number;
    /** Progress callback */
    onProgress?: (progress: UploadProgress) => void;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
}
/**
 * Upload progress information
 */
export interface UploadProgress {
    /** Bytes uploaded so far */
    loaded: number;
    /** Total bytes to upload */
    total: number;
    /** Upload percentage (0-100) */
    percentage: number;
}
/**
 * Download options
 */
export interface DownloadOptions {
    /** Range start byte */
    rangeStart?: number;
    /** Range end byte */
    rangeEnd?: number;
    /** Progress callback */
    onProgress?: (progress: DownloadProgress) => void;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
}
/**
 * Download progress information
 */
export interface DownloadProgress {
    /** Bytes downloaded so far */
    loaded: number;
    /** Total bytes to download (-1 if unknown) */
    total: number;
    /** Download percentage (0-100, -1 if unknown) */
    percentage: number;
}
/**
 * List options
 */
export interface ListOptions {
    /** Prefix filter */
    prefix?: string;
    /** Delimiter for virtual directories */
    delimiter?: string;
    /** Maximum number of results */
    maxResults?: number;
    /** Continuation token for pagination */
    continuationToken?: string;
}
/**
 * List result
 */
export interface ListResult {
    /** Files in the result */
    files: StorageFile[];
    /** Common prefixes (virtual directories) */
    prefixes: string[];
    /** Token for next page (undefined if no more results) */
    nextToken?: string;
    /** Whether there are more results */
    isTruncated: boolean;
}
/**
 * Signed URL options
 */
export interface SignedUrlOptions {
    /** URL expiration in seconds (default: 3600) */
    expiresIn?: number;
    /** HTTP method (GET for download, PUT for upload) */
    method?: 'GET' | 'PUT';
    /** Content type for PUT operations */
    contentType?: string;
    /** Response content type override */
    responseContentType?: string;
    /** Response content disposition override */
    responseContentDisposition?: string;
}
/**
 * Copy options
 */
export interface CopyOptions {
    /** Destination bucket (same bucket if not provided) */
    destinationBucket?: string;
    /** Override content type */
    contentType?: string;
    /** Override metadata */
    metadata?: Record<string, string>;
    /** Access control */
    acl?: 'private' | 'public-read' | 'authenticated-read';
}
/**
 * Move options (same as copy)
 */
export type MoveOptions = CopyOptions;
/**
 * Storage client configuration
 */
export interface StorageConfig {
    /** Default bucket name */
    bucket: string;
    /** Region (for cloud providers) */
    region?: string;
    /** Custom endpoint URL */
    endpoint?: string;
    /** Base path prefix for all operations */
    basePath?: string;
}
export interface S3Config extends StorageConfig {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    /** Force path-style URLs (required for some S3-compatible services) */
    forcePathStyle?: boolean;
}
export interface GCSConfig extends StorageConfig {
    projectId?: string;
    keyFilename?: string;
    credentials?: {
        client_email: string;
        private_key: string;
    };
}
export interface AzureConfig extends StorageConfig {
    connectionString?: string;
    accountName?: string;
    accountKey?: string;
    sasToken?: string;
}
export interface LocalConfig extends StorageConfig {
    /** Base directory for file storage */
    directory: string;
    /** Base URL for public access */
    publicUrl?: string;
}
export interface MemoryConfig extends StorageConfig {
    /** Maximum storage size in bytes */
    maxSize?: number;
}
export type StorageProviderType = 's3' | 'gcs' | 'azure' | 'local' | 'memory';
/**
 * Abstract storage client - base class for all storage providers
 */
export declare abstract class StorageClient {
    protected config: StorageConfig;
    constructor(config: StorageConfig);
    /**
     * Get the bucket name
     */
    get bucket(): string;
    /**
     * Build full key with base path
     */
    protected buildKey(key: string): string;
    /**
     * Strip base path from key
     */
    protected stripBasePath(key: string): string;
    /**
     * Upload a file to storage
     *
     * @param key - File key/path
     * @param data - File data (Buffer, Blob, ReadableStream, or string)
     * @param options - Upload options
     * @returns Uploaded file metadata
     */
    abstract upload(key: string, data: Buffer | Blob | ReadableStream<Uint8Array> | string, options?: UploadOptions): Promise<StorageFile>;
    /**
     * Download a file from storage
     *
     * @param key - File key/path
     * @param options - Download options
     * @returns File data as Buffer
     */
    abstract download(key: string, options?: DownloadOptions): Promise<Buffer>;
    /**
     * Download a file as a readable stream
     *
     * @param key - File key/path
     * @param options - Download options
     * @returns Readable stream
     */
    abstract downloadStream(key: string, options?: DownloadOptions): Promise<ReadableStream<Uint8Array>>;
    /**
     * Delete a file from storage
     *
     * @param key - File key/path
     */
    abstract delete(key: string): Promise<void>;
    /**
     * Delete multiple files from storage
     *
     * @param keys - Array of file keys/paths
     */
    abstract deleteMany(keys: string[]): Promise<void>;
    /**
     * List files in storage
     *
     * @param options - List options
     * @returns List result with files and pagination
     */
    abstract list(options?: ListOptions): Promise<ListResult>;
    /**
     * Get file metadata without downloading
     *
     * @param key - File key/path
     * @returns File metadata or null if not found
     */
    abstract getMetadata(key: string): Promise<StorageFile | null>;
    /**
     * Check if a file exists
     *
     * @param key - File key/path
     * @returns True if file exists
     */
    abstract exists(key: string): Promise<boolean>;
    /**
     * Generate a pre-signed URL for direct access
     *
     * @param key - File key/path
     * @param options - Signed URL options
     * @returns Pre-signed URL
     */
    abstract getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
    /**
     * Copy a file to a new location
     *
     * @param sourceKey - Source file key/path
     * @param destinationKey - Destination file key/path
     * @param options - Copy options
     * @returns Copied file metadata
     */
    abstract copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<StorageFile>;
    /**
     * Move a file to a new location
     *
     * @param sourceKey - Source file key/path
     * @param destinationKey - Destination file key/path
     * @param options - Move options
     * @returns Moved file metadata
     */
    move(sourceKey: string, destinationKey: string, options?: MoveOptions): Promise<StorageFile>;
    /**
     * Get public URL for a file (if public access is enabled)
     *
     * @param key - File key/path
     * @returns Public URL
     */
    abstract getPublicUrl(key: string): string;
}
//# sourceMappingURL=client.d.ts.map