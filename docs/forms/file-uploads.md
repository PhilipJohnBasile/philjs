# File Uploads

Handle file uploads with drag-and-drop, preview, progress tracking, and validation.

## What You'll Learn

- Basic file uploads
- Drag and drop
- File preview
- Progress tracking
- File validation
- Multiple files
- Image compression
- Best practices

## Basic File Upload

### Simple File Input

```typescript
import { signal } from '@philjs/core';

function FileUpload() {
  const file = signal<File | null>(null);
  const uploading = signal(false);
  const error = signal('');

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selectedFile = input.files?.[0];

    if (selectedFile) {
      file.set(selectedFile);
    }
  };

  const handleUpload = async () => {
    const currentFile = file();
    if (!currentFile) return;

    uploading.set(true);
    error.set('');

    try {
      const formData = new FormData();
      formData.append('file', currentFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      console.log('Upload success:', data);

      // Clear file
      file.set(null);
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      uploading.set(false);
    }
  };

  return (
    <div className="file-upload">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading()}
      />

      {file() && (
        <div className="file-info">
          <p>Selected: {file()!.name}</p>
          <p>Size: {(file()!.size / 1024).toFixed(2)} KB</p>
        </div>
      )}

      {error() && <div className="error">{error()}</div>}

      <button
        onClick={handleUpload}
        disabled={!file() || uploading()}
      >
        {uploading() ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
```

## Drag and Drop

### Drop Zone

```typescript
function DragDropUpload() {
  const file = signal<File | null>(null);
  const dragging = signal(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    dragging.set(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragging.set(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    dragging.set(false);

    const droppedFile = e.dataTransfer?.files[0];
    if (droppedFile) {
      file.set(droppedFile);
    }
  };

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selectedFile = input.files?.[0];
    if (selectedFile) {
      file.set(selectedFile);
    }
  };

  return (
    <div
      className={`drop-zone ${dragging() ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {file() ? (
        <div className="file-preview">
          <p>{file()!.name}</p>
          <button onClick={() => file.set(null)}>Remove</button>
        </div>
      ) : (
        <div className="drop-prompt">
          <p>Drag & drop a file here, or click to select</p>
          <input
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input" className="file-button">
            Choose File
          </label>
        </div>
      )}
    </div>
  );
}

// CSS
/*
.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: border-color 0.3s;
}

.drop-zone.dragging {
  border-color: #007bff;
  background-color: #f0f8ff;
}
*/
```

## File Preview

### Image Preview

```typescript
function ImageUpload() {
  const file = signal<File | null>(null);
  const preview = signal<string | null>(null);

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selectedFile = input.files?.[0];

    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      file.set(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.set(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const clearFile = () => {
    file.set(null);
    preview.set(null);
  };

  return (
    <div className="image-upload">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />

      {preview() && (
        <div className="preview">
          <img src={preview()!} alt="Preview" />
          <button onClick={clearFile}>Remove</button>
        </div>
      )}
    </div>
  );
}
```

### PDF Preview

```typescript
function PDFUpload() {
  const file = signal<File | null>(null);
  const previewUrl = signal<string | null>(null);

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selectedFile = input.files?.[0];

    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }

      file.set(selectedFile);

      // Create object URL for preview
      const url = URL.createObjectURL(selectedFile);
      previewUrl.set(url);
    }
  };

  const clearFile = () => {
    if (previewUrl()) {
      URL.revokeObjectURL(previewUrl()!);
    }
    file.set(null);
    previewUrl.set(null);
  };

  return (
    <div className="pdf-upload">
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
      />

      {previewUrl() && (
        <div className="preview">
          <embed
            src={previewUrl()!}
            type="application/pdf"
            width="100%"
            height="600px"
          />
          <button onClick={clearFile}>Remove</button>
        </div>
      )}
    </div>
  );
}
```

## Upload Progress

### Progress Tracking with XMLHttpRequest

```typescript
function UploadWithProgress() {
  const file = signal<File | null>(null);
  const uploadProgress = signal(0);
  const uploading = signal(false);

  const handleUpload = async () => {
    const currentFile = file();
    if (!currentFile) return;

    uploading.set(true);
    uploadProgress.set(0);

    const formData = new FormData();
    formData.append('file', currentFile);

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        uploadProgress.set(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        console.log('Upload complete:', xhr.response);
        uploadProgress.set(100);
        uploading.set(false);
      }
    });

    xhr.addEventListener('error', () => {
      console.error('Upload failed');
      uploading.set(false);
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };

  return (
    <div className="upload-with-progress">
      <input
        type="file"
        onChange={(e) => {
          const input = e.target as HTMLInputElement;
          file.set(input.files?.[0] || null);
        }}
      />

      {uploadProgress() > 0 && uploadProgress() < 100 && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${uploadProgress()}%` }}
          />
          <span className="progress-text">
            {Math.round(uploadProgress())}%
          </span>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file() || uploading()}
      >
        {uploading() ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
```

## File Validation

### Size and Type Validation

```typescript
function ValidatedUpload() {
  const file = signal<File | null>(null);
  const error = signal('');

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  const validateFile = (selectedFile: File): string | null => {
    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      return 'Only JPEG, PNG, and GIF images are allowed';
    }

    return null;
  };

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selectedFile = input.files?.[0];

    if (selectedFile) {
      const validationError = validateFile(selectedFile);

      if (validationError) {
        error.set(validationError);
        file.set(null);
      } else {
        error.set('');
        file.set(selectedFile);
      }
    }
  };

  return (
    <div className="validated-upload">
      <input
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
      />

      {error() && <div className="error">{error()}</div>}

      {file() && (
        <div className="file-info">
          ✓ {file()!.name} ({(file()!.size / 1024).toFixed(2)} KB)
        </div>
      )}
    </div>
  );
}
```

### Dimension Validation for Images

```typescript
function ImageDimensionValidator() {
  const file = signal<File | null>(null);
  const error = signal('');

  const MIN_WIDTH = 800;
  const MIN_HEIGHT = 600;

  const validateImageDimensions = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
          resolve(`Image must be at least ${MIN_WIDTH}x${MIN_HEIGHT}px`);
        } else {
          resolve(null);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('Invalid image file');
      };

      img.src = url;
    });
  };

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selectedFile = input.files?.[0];

    if (selectedFile) {
      const validationError = await validateImageDimensions(selectedFile);

      if (validationError) {
        error.set(validationError);
        file.set(null);
      } else {
        error.set('');
        file.set(selectedFile);
      }
    }
  };

  return (
    <div className="dimension-validator">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
      {error() && <div className="error">{error()}</div>}
    </div>
  );
}
```

## Multiple Files

### Multiple File Upload

```typescript
function MultipleFileUpload() {
  const files = signal<File[]>([]);
  const uploading = signal(false);

  const handleFilesChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files || []);

    files.set([...files(), ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    files.set(files().filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    uploading.set(true);

    const formData = new FormData();
    files().forEach((file, index) => {
      formData.append(`file-${index}`, file);
    });

    try {
      const res = await fetch('/api/upload-multiple', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');

      console.log('All files uploaded successfully');
      files.set([]);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      uploading.set(false);
    }
  };

  return (
    <div className="multiple-upload">
      <input
        type="file"
        multiple
        onChange={handleFilesChange}
        disabled={uploading()}
      />

      {files().length > 0 && (
        <div className="file-list">
          <h3>Selected Files ({files().length})</h3>
          {files().map((file, index) => (
            <div key={index} className="file-item">
              <span>{file.name}</span>
              <span>{(file.size / 1024).toFixed(2)} KB</span>
              <button
                onClick={() => removeFile(index)}
                disabled={uploading()}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={files().length === 0 || uploading()}
      >
        {uploading() ? 'Uploading...' : `Upload ${files().length} file(s)`}
      </button>
    </div>
  );
}
```

### Multiple Images with Preview

```typescript
function MultipleImageUpload() {
  const images = signal<Array<{ file: File; preview: string }>>([]);

  const handleImagesChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files || []);

    selectedFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          images.set([
            ...images(),
            { file, preview: e.target?.result as string }
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    images.set(images().filter((_, i) => i !== index));
  };

  return (
    <div className="multiple-image-upload">
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImagesChange}
      />

      <div className="image-grid">
        {images().map((img, index) => (
          <div key={index} className="image-item">
            <img src={img.preview} alt={`Preview ${index}`} />
            <button onClick={() => removeImage(index)}>×</button>
            <p className="image-name">{img.file.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// CSS
/*
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.image-item button {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
}
*/
```

## Image Compression

### Client-Side Compression

```typescript
function CompressedImageUpload() {
  const file = signal<File | null>(null);
  const compressed = signal<Blob | null>(null);

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          // Set max dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(blob!);
            },
            'image/jpeg',
            0.8 // Compression quality
          );
        };

        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selectedFile = input.files?.[0];

    if (selectedFile && selectedFile.type.startsWith('image/')) {
      file.set(selectedFile);

      const compressedBlob = await compressImage(selectedFile);
      compressed.set(compressedBlob);
    }
  };

  const handleUpload = async () => {
    const compressedFile = compressed();
    if (!compressedFile) return;

    const formData = new FormData();
    formData.append('file', compressedFile, file()!.name);

    await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
  };

  return (
    <div className="compressed-upload">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />

      {file() && compressed() && (
        <div className="compression-info">
          <p>Original: {(file()!.size / 1024).toFixed(2)} KB</p>
          <p>Compressed: {(compressed()!.size / 1024).toFixed(2)} KB</p>
          <p>
            Saved: {(((file()!.size - compressed()!.size) / file()!.size) * 100).toFixed(1)}%
          </p>
        </div>
      )}

      <button onClick={handleUpload} disabled={!compressed()}>
        Upload Compressed Image
      </button>
    </div>
  );
}
```

## Best Practices

### Validate File Type and Size

```typescript
// ✅ Validate on client and server
const validateFile = (file: File) => {
  if (file.size > MAX_SIZE) return 'File too large';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Invalid file type';
  return null;
};

// ❌ No validation
```

### Show Upload Progress

```typescript
// ✅ Track and display progress
<div className="progress-bar">
  <div style={{ width: `${uploadProgress()}%` }} />
  {Math.round(uploadProgress())}%
</div>

// ❌ No feedback during upload
```

### Handle Errors Gracefully

```typescript
// ✅ User-friendly error messages
try {
  await uploadFile();
} catch (err) {
  error.set('Upload failed. Please try again.');
}

// ❌ Silent failure or raw error
```

### Compress Images

```typescript
// ✅ Compress before upload
const compressed = await compressImage(file);
formData.append('file', compressed);

// ❌ Upload full-size images
```

### Clean Up Object URLs

```typescript
// ✅ Revoke URLs when done
effect(() => {
  return () => {
    if (previewUrl()) {
      URL.revokeObjectURL(previewUrl()!);
    }
  };
});

// ❌ Memory leak from unreleased URLs
```

### Use Accept Attribute

```typescript
// ✅ Filter file picker
<input type="file" accept="image/*" />
<input type="file" accept=".pdf,.doc,.docx" />

// ❌ Show all files
<input type="file" />
```

## Summary

You've learned:

✅ Basic file upload handling
✅ Drag and drop functionality
✅ File preview (images, PDFs)
✅ Upload progress tracking
✅ File validation (size, type, dimensions)
✅ Multiple file uploads
✅ Client-side image compression
✅ Best practices for file uploads

File uploads are essential for many applications!

---

**Next:** [Form Libraries →](./form-libraries.md) Integrate with popular form libraries
