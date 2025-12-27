# @philjs/storage

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

File storage abstractions for PhilJS applications. Unified API for local filesystem, S3, Google Cloud Storage, and other storage providers.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Installation

```bash
pnpm add @philjs/storage
```

## Basic Usage

```typescript
import { createStorage, StorageProvider } from '@philjs/storage';

const storage = createStorage({
  provider: 's3',
  bucket: 'my-bucket',
  region: 'us-east-1',
});

// Upload file
await storage.put('uploads/image.png', fileBuffer, {
  contentType: 'image/png',
  public: true,
});

// Download file
const file = await storage.get('uploads/image.png');

// Get public URL
const url = await storage.getUrl('uploads/image.png');

// Delete file
await storage.delete('uploads/image.png');
```

## Features

- **Multiple Providers** - S3, GCS, Azure Blob, local filesystem
- **Unified API** - Same interface across all providers
- **Streaming** - Stream large files efficiently
- **Signed URLs** - Generate temporary access URLs
- **File Metadata** - Store and retrieve file metadata
- **Directory Operations** - List, copy, move directories
- **Image Processing** - Resize, crop, optimize images
- **CDN Integration** - CloudFront, Cloudflare CDN support
- **Chunked Uploads** - Resume interrupted uploads
- **Access Control** - Fine-grained file permissions
- **Versioning** - File version management
- **Encryption** - Server-side and client-side encryption

## Providers

| Provider | Configuration |
|----------|---------------|
| AWS S3 | `provider: 's3'` |
| Google Cloud | `provider: 'gcs'` |
| Azure Blob | `provider: 'azure'` |
| Local | `provider: 'local'` |
| Memory | `provider: 'memory'` |
| Cloudflare R2 | `provider: 'r2'` |

## React Components

```tsx
import { FileUpload, FileList, ImagePreview } from '@philjs/storage/react';

<FileUpload
  storage={storage}
  path="uploads/"
  onUpload={(file) => console.log('Uploaded:', file)}
/>

<FileList storage={storage} path="uploads/" />
```

## Hooks

| Hook | Description |
|------|-------------|
| `useStorage` | Access storage instance |
| `useUpload` | File upload with progress |
| `useFileList` | List files in path |
| `useSignedUrl` | Generate signed URLs |

## License

MIT
