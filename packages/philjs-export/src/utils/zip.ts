/**
 * ZIP Compression Utilities
 * Utilities for creating compressed ZIP archives
 */

import JSZip from 'jszip';

export interface ZipFileEntry {
  /** File name (can include path) */
  name: string;
  /** File content */
  content: string | Blob | ArrayBuffer | Uint8Array;
  /** Optional compression level (0-9) */
  compressionLevel?: number;
  /** Optional comment */
  comment?: string;
  /** Optional date */
  date?: Date;
}

export interface ZipOptions {
  /** Compression type */
  compression?: 'STORE' | 'DEFLATE';
  /** Compression level (1-9, 6 is default) */
  compressionLevel?: number;
  /** Archive comment */
  comment?: string;
  /** Progress callback */
  onProgress?: (progress: number) => void;
}

export interface ZipStreamOptions extends ZipOptions {
  /** Chunk size for streaming */
  chunkSize?: number;
  /** Progress callback with detailed info */
  onFileProgress?: (fileName: string, progress: number) => void;
}

/**
 * Create a ZIP archive from multiple files
 */
export async function createZip(
  files: ZipFileEntry[],
  options: ZipOptions = {}
): Promise<Blob> {
  const {
    compression = 'DEFLATE',
    compressionLevel = 6,
    comment,
    onProgress,
  } = options;

  const zip = new JSZip();

  // Add comment if provided
  if (comment) {
    // JSZip doesn't directly support archive comments in the same way,
    // but we can set it on the generated file
  }

  // Add files to the archive
  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;

    zip.file(file.name, file.content as string | ArrayBuffer | Uint8Array | Blob, {
      compression,
      compressionOptions: {
        level: file.compressionLevel ?? compressionLevel,
      },
      ...(file.comment !== undefined && { comment: file.comment }),
      ...(file.date !== undefined && { date: file.date }),
    });

    onProgress?.((i + 1) / files.length);
  }

  // Generate the ZIP file
  return zip.generateAsync(
    {
      type: 'blob',
      compression,
      compressionOptions: {
        level: compressionLevel,
      },
      ...(comment !== undefined && { comment }),
    },
    (metadata) => {
      onProgress?.(metadata.percent / 100);
    }
  );
}

/**
 * Create a ZIP archive with folders
 */
export async function createZipWithFolders(
  structure: Record<string, ZipFileEntry[] | string | Blob | ArrayBuffer>,
  options: ZipOptions = {}
): Promise<Blob> {
  const {
    compression = 'DEFLATE',
    compressionLevel = 6,
    comment,
    onProgress,
  } = options;

  const zip = new JSZip();

  const addToZip = (
    parent: JSZip,
    path: string,
    content: ZipFileEntry[] | string | Blob | ArrayBuffer
  ) => {
    if (Array.isArray(content)) {
      // It's a folder with files
      const folder = parent.folder(path);
      if (folder) {
        for (const file of content) {
          folder.file(file.name, file.content as string | ArrayBuffer | Uint8Array | Blob, {
            compression,
            compressionOptions: {
              level: file.compressionLevel ?? compressionLevel,
            },
            ...(file.comment !== undefined && { comment: file.comment }),
            ...(file.date !== undefined && { date: file.date }),
          });
        }
      }
    } else {
      // It's a file at root level
      parent.file(path, content as string | ArrayBuffer | Blob, {
        compression,
        compressionOptions: {
          level: compressionLevel,
        },
      });
    }
  };

  const entries = Object.entries(structure);
  for (let i = 0; i < entries.length; i++) {
    const [path, content] = entries[i]!;
    addToZip(zip, path, content);
    onProgress?.((i + 1) / entries.length * 0.5); // First 50% for adding
  }

  return zip.generateAsync(
    {
      type: 'blob',
      compression,
      compressionOptions: {
        level: compressionLevel,
      },
      ...(comment !== undefined && { comment }),
    },
    (metadata) => {
      onProgress?.(0.5 + (metadata.percent / 100) * 0.5); // Last 50% for compression
    }
  );
}

/**
 * Stream files into a ZIP archive
 */
export async function streamToZip(
  fileStream: AsyncIterable<ZipFileEntry>,
  options: ZipStreamOptions = {}
): Promise<Blob> {
  const {
    compression = 'DEFLATE',
    compressionLevel = 6,
    comment,
    onProgress,
    onFileProgress,
  } = options;

  const zip = new JSZip();
  let fileCount = 0;

  for await (const file of fileStream) {
    zip.file(file.name, file.content as string | ArrayBuffer | Uint8Array | Blob, {
      compression,
      compressionOptions: {
        level: file.compressionLevel ?? compressionLevel,
      },
      ...(file.comment !== undefined && { comment: file.comment }),
      ...(file.date !== undefined && { date: file.date }),
    });

    fileCount++;
    onFileProgress?.(file.name, 1);
  }

  return zip.generateAsync(
    {
      type: 'blob',
      compression,
      compressionOptions: {
        level: compressionLevel,
      },
      ...(comment !== undefined && { comment }),
    },
    (metadata) => {
      onProgress?.(metadata.percent / 100);
    }
  );
}

/**
 * Extract files from a ZIP archive
 */
export async function extractZip(
  zipData: Blob | ArrayBuffer,
  options: {
    onProgress?: (progress: number, fileName: string) => void;
  } = {}
): Promise<Map<string, Blob>> {
  const { onProgress } = options;

  const zip = await JSZip.loadAsync(zipData);
  const files = new Map<string, Blob>();

  const fileNames = Object.keys(zip.files).filter(
    name => !zip.files[name]!.dir
  );

  for (let i = 0; i < fileNames.length; i++) {
    const name = fileNames[i]!;
    const file = zip.files[name]!;

    const blob = await file.async('blob');
    files.set(name, blob);

    onProgress?.((i + 1) / fileNames.length, name);
  }

  return files;
}

/**
 * Get file list from a ZIP archive
 */
export async function listZipContents(
  zipData: Blob | ArrayBuffer
): Promise<Array<{
  name: string;
  isDirectory: boolean;
  size: number;
  compressedSize: number;
  date: Date;
}>> {
  const zip = await JSZip.loadAsync(zipData);

  return Object.entries(zip.files).map(([name, file]) => {
    // Access internal _data property with type assertion
    const fileData = (file as unknown as { _data?: { uncompressedSize?: number; compressedSize?: number } })._data;
    return {
      name,
      isDirectory: file.dir,
      size: fileData?.uncompressedSize ?? 0,
      compressedSize: fileData?.compressedSize ?? 0,
      date: file.date,
    };
  });
}

/**
 * Add a file to an existing ZIP archive
 */
export async function addToZip(
  existingZip: Blob | ArrayBuffer,
  newFiles: ZipFileEntry[],
  options: ZipOptions = {}
): Promise<Blob> {
  const {
    compression = 'DEFLATE',
    compressionLevel = 6,
    onProgress,
  } = options;

  const zip = await JSZip.loadAsync(existingZip);

  for (const file of newFiles) {
    zip.file(file.name, file.content as string | ArrayBuffer | Uint8Array | Blob, {
      compression,
      compressionOptions: {
        level: file.compressionLevel ?? compressionLevel,
      },
      ...(file.comment !== undefined && { comment: file.comment }),
      ...(file.date !== undefined && { date: file.date }),
    });
  }

  return zip.generateAsync(
    {
      type: 'blob',
      compression,
      compressionOptions: {
        level: compressionLevel,
      },
    },
    (metadata) => {
      onProgress?.(metadata.percent / 100);
    }
  );
}

/**
 * Remove files from a ZIP archive
 */
export async function removeFromZip(
  existingZip: Blob | ArrayBuffer,
  fileNames: string[],
  options: ZipOptions = {}
): Promise<Blob> {
  const { compression = 'DEFLATE', compressionLevel = 6, onProgress } = options;

  const zip = await JSZip.loadAsync(existingZip);

  for (const name of fileNames) {
    zip.remove(name);
  }

  return zip.generateAsync(
    {
      type: 'blob',
      compression,
      compressionOptions: {
        level: compressionLevel,
      },
    },
    (metadata) => {
      onProgress?.(metadata.percent / 100);
    }
  );
}

/**
 * Create a ZIP file for download with exported data
 */
export async function createExportZip(
  exports: Array<{
    fileName: string;
    data: string | Blob;
    format: string;
  }>,
  options: ZipOptions = {}
): Promise<Blob> {
  const files: ZipFileEntry[] = exports.map(exp => ({
    name: exp.fileName,
    content: exp.data,
    date: new Date(),
  }));

  return createZip(files, options);
}

/**
 * Helper to create ZIP entries from export data
 */
export function createZipEntry(
  name: string,
  content: string | Blob | ArrayBuffer,
  options: Partial<ZipFileEntry> = {}
): ZipFileEntry {
  return {
    name,
    content,
    date: new Date(),
    ...options,
  };
}
