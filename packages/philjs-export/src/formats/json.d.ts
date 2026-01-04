/**
 * JSON Export Module
 * Handles JSON generation with formatting options
 */
export interface JSONOptions {
    /** Pretty print with indentation */
    pretty?: boolean;
    /** Indentation spaces (default: 2) */
    indent?: number;
    /** Include null values */
    includeNull?: boolean;
    /** Date format: 'iso' | 'timestamp' | 'string' */
    dateFormat?: 'iso' | 'timestamp' | 'string';
    /** Custom date formatter */
    formatDate?: (date: Date) => string | number;
    /** Sort object keys */
    sortKeys?: boolean;
    /** Transform function for values */
    transform?: (key: string, value: unknown) => unknown;
    /** Fields to include (whitelist) */
    fields?: string[];
    /** Fields to exclude (blacklist) */
    excludeFields?: string[];
    /** Maximum depth for nested objects */
    maxDepth?: number;
}
export interface StreamingJSONOptions extends JSONOptions {
    /** Chunk size for streaming arrays */
    chunkSize?: number;
    /** Progress callback */
    onProgress?: (progress: number, processedItems: number) => void;
    /** Chunk callback */
    onChunk?: (chunk: string, chunkIndex: number) => void;
}
/**
 * Convert data to JSON string with formatting
 */
export declare function toJSON<T>(data: T, options?: JSONOptions): string;
/**
 * Stream large arrays to JSON with progress tracking
 */
export declare function streamToJSON<T>(data: T[] | AsyncIterable<T>, options?: StreamingJSONOptions): AsyncGenerator<string, void, unknown>;
/**
 * Convert to JSON Lines format (NDJSON)
 */
export declare function toJSONLines<T>(data: T[], options?: JSONOptions): string;
/**
 * Stream to JSON Lines format
 */
export declare function streamToJSONLines<T>(data: T[] | AsyncIterable<T>, options?: StreamingJSONOptions): AsyncGenerator<string, void, unknown>;
/**
 * Create a JSON Blob for download
 */
export declare function createJSONBlob(json: string): Blob;
/**
 * Parse JSON string to data
 */
export declare function parseJSON<T = unknown>(json: string): T;
/**
 * Parse JSON Lines (NDJSON) to array
 */
export declare function parseJSONLines<T = unknown>(jsonLines: string): T[];
//# sourceMappingURL=json.d.ts.map