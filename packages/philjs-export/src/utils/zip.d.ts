/**
 * ZIP Compression Utilities
 * Utilities for creating compressed ZIP archives
 */
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
export declare function createZip(files: ZipFileEntry[], options?: ZipOptions): Promise<Blob>;
/**
 * Create a ZIP archive with folders
 */
export declare function createZipWithFolders(structure: Record<string, ZipFileEntry[] | string | Blob | ArrayBuffer>, options?: ZipOptions): Promise<Blob>;
/**
 * Stream files into a ZIP archive
 */
export declare function streamToZip(fileStream: AsyncIterable<ZipFileEntry>, options?: ZipStreamOptions): Promise<Blob>;
/**
 * Extract files from a ZIP archive
 */
export declare function extractZip(zipData: Blob | ArrayBuffer, options?: {
    onProgress?: (progress: number, fileName: string) => void;
}): Promise<Map<string, Blob>>;
/**
 * Get file list from a ZIP archive
 */
export declare function listZipContents(zipData: Blob | ArrayBuffer): Promise<Array<{
    name: string;
    isDirectory: boolean;
    size: number;
    compressedSize: number;
    date: Date;
}>>;
/**
 * Add a file to an existing ZIP archive
 */
export declare function addToZip(existingZip: Blob | ArrayBuffer, newFiles: ZipFileEntry[], options?: ZipOptions): Promise<Blob>;
/**
 * Remove files from a ZIP archive
 */
export declare function removeFromZip(existingZip: Blob | ArrayBuffer, fileNames: string[], options?: ZipOptions): Promise<Blob>;
/**
 * Create a ZIP file for download with exported data
 */
export declare function createExportZip(exports: Array<{
    fileName: string;
    data: string | Blob;
    format: string;
}>, options?: ZipOptions): Promise<Blob>;
/**
 * Helper to create ZIP entries from export data
 */
export declare function createZipEntry(name: string, content: string | Blob | ArrayBuffer, options?: Partial<ZipFileEntry>): ZipFileEntry;
//# sourceMappingURL=zip.d.ts.map