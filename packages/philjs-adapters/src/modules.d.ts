/**
 * Type declarations for external modules
 */

declare module '@philjs/ssr' {
  export function handleRequest(request: any, options?: any): Promise<Response>;
  export function renderToString(component: any, options?: any): Promise<string>;
}

// Vercel optional dependencies
declare module '@vercel/kv' {
  export function get<T = any>(key: string): Promise<T | null>;
  export function set(key: string, value: any, options?: { ex?: number; px?: number }): Promise<'OK'>;
  export function del(...keys: string[]): Promise<number>;
  export function incr(key: string): Promise<number>;
  export function decr(key: string): Promise<number>;
  export function hget<T = any>(key: string, field: string): Promise<T | null>;
  export function hset(key: string, field: string, value: any): Promise<number>;
  export function expire(key: string, seconds: number): Promise<number>;
}

declare module '@vercel/blob' {
  export interface PutBlobResult {
    url: string;
    downloadUrl: string;
    pathname: string;
    contentType: string;
    contentDisposition: string;
  }

  export interface BlobInfo {
    url: string;
    pathname: string;
    contentType: string;
    contentDisposition: string;
    size: number;
    uploadedAt: Date;
  }

  export interface ListBlobResult {
    blobs: BlobInfo[];
    cursor?: string;
    hasMore: boolean;
  }

  export function put(pathname: string, body: ReadableStream | string | Blob | ArrayBuffer, options?: any): Promise<PutBlobResult>;
  export function del(url: string | string[]): Promise<void>;
  export function head(url: string): Promise<BlobInfo | null>;
  export function list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<ListBlobResult>;
}

declare module '@vercel/edge-config' {
  export function get<T = any>(key: string): Promise<T | undefined>;
  export function has(key: string): Promise<boolean>;
  export function getAll<T = Record<string, any>>(): Promise<T>;
  export function digest(): Promise<string>;
}

// Netlify optional dependencies
declare module '@netlify/blobs' {
  export interface BlobStore {
    get(key: string, options?: { type?: 'text' | 'json' | 'blob' | 'arrayBuffer' | 'stream' }): Promise<any>;
    set(key: string, value: string | Blob | ArrayBuffer | ReadableStream, options?: { metadata?: Record<string, string> }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string; paginate?: boolean }): AsyncIterable<{ key: string; etag: string }>;
    getMetadata(key: string): Promise<{ etag: string; metadata?: Record<string, string> } | null>;
    setMetadata(key: string, metadata: Record<string, string>): Promise<void>;
  }

  export function getStore(name: string): BlobStore;
  export function getStore(options: { name: string; siteID?: string; token?: string }): BlobStore;
  export function getDeployStore(options?: { deployID?: string }): BlobStore;
}

// AWS optional dependencies
declare module '@aws-sdk/client-s3' {
  export class S3Client {
    constructor(config: { region?: string; credentials?: any });
    send(command: any): Promise<any>;
    destroy(): void;
  }

  export class GetObjectCommand {
    constructor(input: { Bucket: string; Key: string });
  }

  export class PutObjectCommand {
    constructor(input: { Bucket: string; Key: string; Body: any; ContentType?: string; Metadata?: Record<string, string> });
  }

  export class DeleteObjectCommand {
    constructor(input: { Bucket: string; Key: string });
  }

  export class ListObjectsV2Command {
    constructor(input: { Bucket: string; Prefix?: string; MaxKeys?: number; ContinuationToken?: string });
  }

  export class HeadObjectCommand {
    constructor(input: { Bucket: string; Key: string });
  }
}
