/**
 * XML Export Module
 * Handles XML generation with customizable structure
 */
export interface XMLOptions {
    /** Root element name */
    rootElement?: string;
    /** Item element name */
    itemElement?: string;
    /** XML declaration */
    declaration?: boolean;
    /** XML version */
    version?: string;
    /** Encoding */
    encoding?: string;
    /** Pretty print with indentation */
    pretty?: boolean;
    /** Indentation string */
    indent?: string;
    /** Use attributes for primitive values */
    useAttributes?: boolean;
    /** Namespace */
    namespace?: {
        prefix?: string;
        uri?: string;
    };
    /** Custom element names for keys */
    elementNames?: Record<string, string>;
    /** Keys to render as attributes */
    attributeKeys?: string[];
    /** CDATA keys */
    cdataKeys?: string[];
    /** Date format */
    dateFormat?: 'iso' | 'timestamp' | 'string';
    /** Custom date formatter */
    formatDate?: (date: Date) => string;
    /** Transform function for elements */
    transform?: (key: string, value: unknown) => unknown;
}
export interface StreamingXMLOptions extends XMLOptions {
    /** Chunk size for streaming */
    chunkSize?: number;
    /** Progress callback */
    onProgress?: (progress: number, processedItems: number) => void;
    /** Chunk callback */
    onChunk?: (chunk: string, chunkIndex: number) => void;
}
/**
 * Convert data to XML string
 */
export declare function toXML<T>(data: T, options?: XMLOptions): string;
/**
 * Convert array of objects to XML
 */
export declare function arrayToXML<T extends Record<string, unknown>>(data: T[], options?: XMLOptions): string;
/**
 * Stream large datasets to XML with progress tracking
 */
export declare function streamToXML<T extends Record<string, unknown>>(data: T[] | AsyncIterable<T>, options?: StreamingXMLOptions): AsyncGenerator<string, void, unknown>;
/**
 * Create an XML Blob for download
 */
export declare function createXMLBlob(xml: string): Blob;
/**
 * Parse XML string to object (requires DOMParser)
 */
export declare function parseXML(xml: string): Document;
//# sourceMappingURL=xml.d.ts.map