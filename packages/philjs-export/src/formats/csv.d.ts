/**
 * CSV Export Module
 * Handles CSV generation with streaming support for large datasets
 */
export interface CSVOptions {
    /** Delimiter character (default: ',') */
    delimiter?: string;
    /** Include header row */
    header?: boolean;
    /** Quote character */
    quoteChar?: string;
    /** Escape character */
    escapeChar?: string;
    /** Newline sequence */
    newline?: string;
    /** Column mapping */
    columns?: string[];
    /** Custom column headers */
    columnHeaders?: Record<string, string>;
    /** Skip empty values */
    skipEmptyLines?: boolean;
    /** Transform function for each row */
    transformRow?: (row: Record<string, unknown>) => Record<string, unknown>;
}
export interface StreamingCSVOptions extends CSVOptions {
    /** Chunk size for streaming */
    chunkSize?: number;
    /** Progress callback */
    onProgress?: (progress: number, processedRows: number) => void;
    /** Chunk callback */
    onChunk?: (chunk: string, chunkIndex: number) => void;
}
/**
 * Convert data to CSV string
 */
export declare function toCSV<T extends Record<string, unknown>>(data: T[], options?: CSVOptions): string;
/**
 * Stream large datasets to CSV with progress tracking
 */
export declare function streamToCSV<T extends Record<string, unknown>>(data: T[] | AsyncIterable<T>, options?: StreamingCSVOptions): AsyncGenerator<string, void, unknown>;
/**
 * Parse CSV string to data
 */
export declare function parseCSV<T = Record<string, unknown>>(csv: string, options?: {
    header?: boolean;
    dynamicTyping?: boolean;
    transformHeader?: (header: string, index: number) => string;
}): T[];
/**
 * Create a CSV Blob for download
 */
export declare function createCSVBlob(csv: string): Blob;
//# sourceMappingURL=csv.d.ts.map