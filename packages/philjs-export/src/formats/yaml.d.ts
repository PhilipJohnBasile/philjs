/**
 * YAML Export Module
 * Handles YAML generation with formatting options
 */
export interface YAMLOptions {
    /** Indentation spaces */
    indent?: number;
    /** Line width for wrapping */
    lineWidth?: number;
    /** Quote style: 'single' | 'double' */
    defaultQuoteType?: 'single' | 'double';
    /** Minimum string length to use quotes */
    minContentWidth?: number;
    /** Force quotes on strings */
    forceQuotes?: boolean;
    /** Use flow style for objects/arrays */
    flowLevel?: number;
    /** Sort keys alphabetically */
    sortKeys?: boolean;
    /** Include nulls */
    includeNulls?: boolean;
    /** Date format */
    dateFormat?: 'iso' | 'timestamp' | 'string';
    /** Custom date formatter */
    formatDate?: (date: Date) => string;
    /** Comment for the document */
    comment?: string;
    /** Transform function for values */
    transform?: (key: string, value: unknown) => unknown;
    /** Fields to include (whitelist) */
    fields?: string[];
    /** Fields to exclude (blacklist) */
    excludeFields?: string[];
}
export interface StreamingYAMLOptions extends YAMLOptions {
    /** Chunk size for streaming (items per chunk) */
    chunkSize?: number;
    /** Progress callback */
    onProgress?: (progress: number, processedItems: number) => void;
    /** Chunk callback */
    onChunk?: (chunk: string, chunkIndex: number) => void;
}
/**
 * Convert data to YAML string
 */
export declare function toYAML<T>(data: T, options?: YAMLOptions): string;
/**
 * Convert array to YAML with document separators
 */
export declare function arrayToYAMLDocuments<T>(data: T[], options?: YAMLOptions): string;
/**
 * Stream large datasets to YAML with progress tracking
 */
export declare function streamToYAML<T>(data: T[] | AsyncIterable<T>, options?: StreamingYAMLOptions): AsyncGenerator<string, void, unknown>;
/**
 * Create a YAML Blob for download
 */
export declare function createYAMLBlob(yaml: string): Blob;
/**
 * Parse YAML string to data
 */
export declare function parseYAML<T = unknown>(yaml: string): T;
/**
 * Parse YAML with multiple documents
 */
export declare function parseYAMLDocuments<T = unknown>(yaml: string): T[];
/**
 * Validate YAML string
 */
export declare function validateYAML(yaml: string): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=yaml.d.ts.map