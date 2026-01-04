# @philjs/storage

The `@philjs/storage` package provides a unified cloud storage abstraction supporting AWS S3, Google Cloud Storage, Azure Blob Storage, local filesystem, and in-memory storage with signal-based hooks.

## Installation

```bash
npm install @philjs/storage
```

## Features

- **Multi-Provider Support** - S3, GCS, Azure, local filesystem, memory
- **S3-Compatible** - Works with Cloudflare R2, MinIO, DigitalOcean Spaces
- **Streaming** - Upload/download via streams for large files
- **Multipart Uploads** - Efficient large file uploads
- **Signed URLs** - Pre-signed URLs for direct browser access
- **Progress Tracking** - Real-time upload/download progress
- **Signal-Based Hooks** - Reactive state management for file operations

## Quick Start

```typescript
import { createStorageClient } from '@philjs/storage';

// Create S3 client
const storage = await createStorageClient('s3', {
  bucket: 'my-bucket',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Upload a file
const file = await storage.upload('images/photo.jpg', imageBuffer, {
  contentType: 'image/jpeg',
  acl: 'public-read'
});

// Download a file
const data = await storage.download('images/photo.jpg');

// Get signed URL for direct access
const url = await storage.getSignedUrl('images/photo.jpg', {
  expiresIn: 3600 // 1 hour
});
```

---

## Storage Providers

### AWS S3

```typescript
import { createStorageClient, S3StorageClient } from '@philjs/storage';
import type { S3Config } from '@philjs/storage';

const config: S3Config = {
  bucket: 'my-bucket',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN, // Optional
  basePath: 'uploads/', // Optional prefix
};

const storage = await createStorageClient('s3', config);

// Or instantiate directly
const s3Client = new S3StorageClient(config);
```

### Cloudflare R2

```typescript
const r2 = await createStorageClient('s3', {
  bucket: 'my-r2-bucket',
  region: 'auto',
  endpoint: 'https://<account_id>.r2.cloudflarestorage.com',
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  forcePathStyle: true // Required for R2
});
```

### MinIO / S3-Compatible

```typescript
const minio = await createStorageClient('s3', {
  bucket: 'my-bucket',
  endpoint: 'http://localhost:9000',
  accessKeyId: 'minioadmin',
  secretAccessKey: 'minioadmin',
  forcePathStyle: true,
  region: 'us-east-1'
});
```

### Google Cloud Storage

```typescript
import { createStorageClient, GCSStorageClient } from '@philjs/storage';
import type { GCSConfig } from '@philjs/storage';

const config: GCSConfig = {
  bucket: 'my-gcs-bucket',
  projectId: 'my-project',
  keyFilename: './service-account.json',
  // Or use credentials directly:
  // credentials: {
  //   client_email: 'service@project.iam.gserviceaccount.com',
  //   private_key: '-----BEGIN PRIVATE KEY-----\n...'
  // }
};

const storage = await createStorageClient('gcs', config);
```

### Azure Blob Storage

```typescript
import { createStorageClient, AzureStorageClient } from '@philjs/storage';
import type { AzureConfig } from '@philjs/storage';

const config: AzureConfig = {
  bucket: 'my-container', // Container name
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  // Or use account credentials:
  // accountName: 'myaccount',
  // accountKey: 'xxx...',
  // Or SAS token:
  // sasToken: '?sv=2021-06-08&...'
};

const storage = await createStorageClient('azure', config);
```

### Local Filesystem

```typescript
import { createStorageClient, LocalStorageClient } from '@philjs/storage';
import type { LocalConfig } from '@philjs/storage';

const config: LocalConfig = {
  bucket: 'uploads', // Virtual bucket name
  directory: './storage/uploads', // Base directory
  publicUrl: 'http://localhost:3000/files' // URL prefix for public files
};

const storage = await createStorageClient('local', config);
```

### In-Memory Storage

Perfect for testing and development:

```typescript
import { createStorageClient, MemoryStorageClient } from '@philjs/storage';
import type { MemoryConfig } from '@philjs/storage';

const config: MemoryConfig = {
  bucket: 'test-bucket',
  maxSize: 100 * 1024 * 1024 // 100MB limit
};

const storage = await createStorageClient('memory', config);
```

---

## Core Operations

### Upload Files

```typescript
import type { UploadOptions, UploadProgress, StorageFile } from '@philjs/storage';

// Simple upload
const file = await storage.upload('path/to/file.txt', 'Hello, World!');

// Upload with options
const options: UploadOptions = {
  contentType: 'image/jpeg',
  metadata: { userId: '123', originalName: 'photo.jpg' },
  cacheControl: 'public, max-age=31536000',
  contentDisposition: 'inline',
  acl: 'public-read',

  // Progress tracking
  onProgress: (progress: UploadProgress) => {
    console.log(`${progress.percentage}% (${progress.loaded}/${progress.total})`);
  },

  // Cancellation
  signal: abortController.signal
};

const image = await storage.upload('images/photo.jpg', imageBuffer, options);
console.log(image.key);          // 'images/photo.jpg'
console.log(image.size);         // 1234567
console.log(image.contentType);  // 'image/jpeg'
console.log(image.lastModified); // Date
console.log(image.etag);         // 'abc123...'
```

### Multipart Uploads

For large files (>5MB), use multipart uploads:

```typescript
const largeFile = await storage.upload('videos/movie.mp4', videoBuffer, {
  multipart: true,
  partSize: 10 * 1024 * 1024, // 10MB parts
  onProgress: (progress) => {
    console.log(`Uploading: ${progress.percentage}%`);
  }
});
```

### Download Files

```typescript
import type { DownloadOptions, DownloadProgress } from '@philjs/storage';

// Download as buffer
const data = await storage.download('images/photo.jpg');

// Download with progress
const data = await storage.download('videos/movie.mp4', {
  onProgress: (progress: DownloadProgress) => {
    console.log(`${progress.percentage}%`);
  },
  signal: abortController.signal
});

// Range download (partial content)
const chunk = await storage.download('videos/movie.mp4', {
  rangeStart: 0,
  rangeEnd: 1024 * 1024 // First 1MB
});
```

### Download as Stream

For large files, stream instead of loading into memory:

```typescript
const stream = await storage.downloadStream('videos/movie.mp4');

// Pipe to response
return new Response(stream, {
  headers: { 'Content-Type': 'video/mp4' }
});

// Or process chunks
const reader = stream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  processChunk(value);
}
```

### Delete Files

```typescript
// Single file
await storage.delete('images/photo.jpg');

// Multiple files (batched automatically)
await storage.deleteMany([
  'images/photo1.jpg',
  'images/photo2.jpg',
  'images/photo3.jpg'
]);
```

### List Files

```typescript
import type { ListOptions, ListResult } from '@philjs/storage';

// List all files
const result = await storage.list();

// List with prefix filter
const images = await storage.list({
  prefix: 'images/',
  maxResults: 100
});

// List with virtual directories
const result = await storage.list({
  prefix: 'uploads/',
  delimiter: '/' // Group by "folder"
});

console.log(result.files);      // Files in this "folder"
console.log(result.prefixes);   // Subfolders: ['uploads/2024/', 'uploads/2025/']

// Pagination
let allFiles: StorageFile[] = [];
let continuationToken: string | undefined;

do {
  const result = await storage.list({
    prefix: 'images/',
    maxResults: 1000,
    continuationToken
  });

  allFiles = [...allFiles, ...result.files];
  continuationToken = result.nextToken;
} while (result.isTruncated);
```

### File Metadata

```typescript
// Get metadata without downloading
const metadata = await storage.getMetadata('images/photo.jpg');
if (metadata) {
  console.log(metadata.size);         // 1234567
  console.log(metadata.contentType);  // 'image/jpeg'
  console.log(metadata.lastModified); // Date
  console.log(metadata.etag);         // 'abc123...'
  console.log(metadata.metadata);     // { userId: '123' }
}

// Check if file exists
const exists = await storage.exists('images/photo.jpg');
```

### Copy and Move Files

```typescript
import type { CopyOptions, MoveOptions } from '@philjs/storage';

// Copy within same bucket
const copied = await storage.copy(
  'images/original.jpg',
  'images/backup/original.jpg'
);

// Copy to different bucket
const copied = await storage.copy(
  'images/photo.jpg',
  'images/photo.jpg',
  { destinationBucket: 'backup-bucket' }
);

// Copy with metadata override
const copied = await storage.copy(
  'images/photo.jpg',
  'images/photo-copy.jpg',
  {
    contentType: 'image/jpeg',
    metadata: { copied: 'true' },
    acl: 'private'
  }
);

// Move (copy + delete source)
const moved = await storage.move(
  'uploads/temp/photo.jpg',
  'images/photo.jpg'
);
```

---

## Signed URLs

Generate pre-signed URLs for direct browser access:

```typescript
import type { SignedUrlOptions } from '@philjs/storage';

// Download URL (GET)
const downloadUrl = await storage.getSignedUrl('images/photo.jpg', {
  expiresIn: 3600, // 1 hour
  responseContentType: 'image/jpeg',
  responseContentDisposition: 'attachment; filename="photo.jpg"'
});

// Upload URL (PUT) - for direct browser uploads
const uploadUrl = await storage.getSignedUrl('uploads/new-photo.jpg', {
  method: 'PUT',
  expiresIn: 300, // 5 minutes
  contentType: 'image/jpeg'
});

// Client-side direct upload
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': 'image/jpeg' }
});
```

### Public URLs

Get permanent public URL (requires public ACL):

```typescript
// Upload as public
await storage.upload('images/logo.png', logoBuffer, {
  acl: 'public-read'
});

// Get public URL
const publicUrl = storage.getPublicUrl('images/logo.png');
// https://my-bucket.s3.us-east-1.amazonaws.com/images/logo.png
```

---

## Signal-Based Hooks

Use reactive hooks for file operations in components:

### useUpload

```typescript
import { useUpload } from '@philjs/storage';

function FileUploader({ storage }) {
  const { state, upload, reset } = useUpload(storage);

  const handleFileSelect = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const result = await upload(`uploads/${file.name}`, file, {
      contentType: file.type
    });

    if (result) {
      console.log('Uploaded:', result.key);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileSelect} disabled={state().isUploading} />

      {state().isUploading && (
        <div class="progress">
          <div style={{ width: `${state().progress}%` }} />
        </div>
      )}

      {state().error && (
        <div class="error">{state().error.message}</div>
      )}

      {state().metadata && (
        <div class="success">
          Uploaded: {state().metadata.key} ({state().metadata.size} bytes)
        </div>
      )}

      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### useDownload

```typescript
import { useDownload } from '@philjs/storage';

function FileDownloader({ storage, fileKey }) {
  const { state, download, reset } = useDownload(storage);

  const handleDownload = async () => {
    const data = await download(fileKey);
    if (data) {
      // Create download link
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileKey.split('/').pop()!;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div>
      <button onClick={handleDownload} disabled={state().isDownloading}>
        {state().isDownloading ? `Downloading ${state().progress}%` : 'Download'}
      </button>

      {state().error && (
        <div class="error">{state().error.message}</div>
      )}
    </div>
  );
}
```

### useFileList

```typescript
import { useFileList } from '@philjs/storage';

function FileBrowser({ storage }) {
  const { state, list, loadMore, refresh, reset } = useFileList(storage);

  // Initial load
  onMount(() => {
    list({ prefix: 'images/', maxResults: 20 });
  });

  return (
    <div>
      <button onClick={refresh} disabled={state().isLoading}>
        Refresh
      </button>

      {state().isLoading && <div>Loading...</div>}

      <ul>
        {state().files.map(file => (
          <li key={file.key}>
            {file.key} - {file.size} bytes
          </li>
        ))}
      </ul>

      {state().hasMore && (
        <button onClick={() => loadMore({ prefix: 'images/' })}>
          Load More
        </button>
      )}

      {state().error && (
        <div class="error">{state().error.message}</div>
      )}
    </div>
  );
}
```

---

## Utilities

### MIME Type Detection

```typescript
import { detectMimeType, getMimeTypeFromExtension } from '@philjs/storage';

// Detect from filename
const type = detectMimeType('photo.jpg');
// 'image/jpeg'

// Get from extension
const type = getMimeTypeFromExtension('.png');
// 'image/png'
```

### Image Resizing

```typescript
import { resizeImage, type ResizeOptions } from '@philjs/storage';

const options: ResizeOptions = {
  width: 800,
  height: 600,
  fit: 'cover',      // 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  format: 'webp',    // 'jpeg' | 'png' | 'webp' | 'avif'
  quality: 80
};

const resized = await resizeImage(originalBuffer, options);
await storage.upload('thumbnails/photo.webp', resized);
```

### Streaming Utilities

```typescript
import {
  createStreamingUpload,
  streamToBuffer,
  bufferToStream,
  type StreamingUploadOptions
} from '@philjs/storage';

// Convert stream to buffer
const buffer = await streamToBuffer(readableStream);

// Convert buffer to stream
const stream = bufferToStream(buffer);

// Create streaming upload from request
const options: StreamingUploadOptions = {
  storage,
  key: 'uploads/large-file.zip',
  contentType: 'application/zip'
};

const result = await createStreamingUpload(request.body, options);
```

---

## Types Reference

### StorageFile

```typescript
interface StorageFile {
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
```

### UploadOptions

```typescript
interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  contentDisposition?: string;
  acl?: 'private' | 'public-read' | 'authenticated-read';
  multipart?: boolean;
  partSize?: number;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
```

### DownloadOptions

```typescript
interface DownloadOptions {
  rangeStart?: number;
  rangeEnd?: number;
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
}

interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
```

### ListOptions & ListResult

```typescript
interface ListOptions {
  prefix?: string;
  delimiter?: string;
  maxResults?: number;
  continuationToken?: string;
}

interface ListResult {
  files: StorageFile[];
  prefixes: string[];
  nextToken?: string;
  isTruncated: boolean;
}
```

### SignedUrlOptions

```typescript
interface SignedUrlOptions {
  expiresIn?: number;
  method?: 'GET' | 'PUT';
  contentType?: string;
  responseContentType?: string;
  responseContentDisposition?: string;
}
```

### Provider Configs

```typescript
interface S3Config extends StorageConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  forcePathStyle?: boolean;
}

interface GCSConfig extends StorageConfig {
  projectId?: string;
  keyFilename?: string;
  credentials?: { client_email: string; private_key: string };
}

interface AzureConfig extends StorageConfig {
  connectionString?: string;
  accountName?: string;
  accountKey?: string;
  sasToken?: string;
}

interface LocalConfig extends StorageConfig {
  directory: string;
  publicUrl?: string;
}

interface MemoryConfig extends StorageConfig {
  maxSize?: number;
}
```

---

## Best Practices

### 1. Use Signed URLs for Direct Uploads

```typescript
// Better - client uploads directly to storage
const uploadUrl = await storage.getSignedUrl('uploads/photo.jpg', {
  method: 'PUT',
  expiresIn: 300
});

// Avoid - uploading through your server
// const data = await request.arrayBuffer();
// await storage.upload('uploads/photo.jpg', data);
```

### 2. Use Streams for Large Files

```typescript
// Good - streaming download
const stream = await storage.downloadStream('videos/movie.mp4');
return new Response(stream);

// Avoid for large files - loads entire file into memory
// const data = await storage.download('videos/movie.mp4');
// return new Response(data);
```

### 3. Use Appropriate ACLs

```typescript
// Private by default - use signed URLs for access
await storage.upload('user-data/sensitive.json', data, {
  acl: 'private'
});

// Public only for truly public assets
await storage.upload('public/logo.png', logo, {
  acl: 'public-read'
});
```

### 4. Set Cache Headers

```typescript
// Immutable assets (versioned)
await storage.upload(`assets/${hash}.js`, js, {
  cacheControl: 'public, max-age=31536000, immutable'
});

// Dynamic content
await storage.upload('api/data.json', json, {
  cacheControl: 'public, max-age=60, s-maxage=300'
});
```

### 5. Use Base Paths for Organization

```typescript
const userStorage = await createStorageClient('s3', {
  bucket: 'my-app',
  basePath: `users/${userId}/` // All operations scoped to user
});

// Uploads to: users/123/avatar.jpg
await userStorage.upload('avatar.jpg', imageData);
```

---

## API Reference

| Export | Description |
|--------|-------------|
| `createStorageClient` | Factory function for storage clients |
| `S3StorageClient` | AWS S3 / R2 / MinIO client |
| `GCSStorageClient` | Google Cloud Storage client |
| `AzureStorageClient` | Azure Blob Storage client |
| `LocalStorageClient` | Local filesystem client |
| `MemoryStorageClient` | In-memory client (testing) |
| `useUpload` | Signal-based upload hook |
| `useDownload` | Signal-based download hook |
| `useFileList` | Signal-based file listing hook |
| `detectMimeType` | MIME type detection |
| `getMimeTypeFromExtension` | Get MIME from extension |
| `resizeImage` | Image resizing utility |
| `createStreamingUpload` | Streaming upload helper |
| `streamToBuffer` | Convert stream to buffer |
| `bufferToStream` | Convert buffer to stream |

---

## Next Steps

- [Image Processing Guide](./image-processing.md)
- [Direct Uploads from Browser](./direct-uploads.md)
- [@philjs/forms File Uploads](../forms/overview.md)
