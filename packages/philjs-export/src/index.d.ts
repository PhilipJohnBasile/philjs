/**
 * PhilJS Export
 *
 * Data export utilities for CSV, Excel, JSON, XML, YAML, and PDF formats
 */
export * from './formats/index.js';
export * from './utils/index.js';
export * from './components/index.js';
export * from './hooks.js';
export interface ExportOptions {
    filename?: string;
    format?: 'csv' | 'excel' | 'json' | 'xml' | 'yaml' | 'pdf';
    download?: boolean;
    title?: string;
    onProgress?: (progress: number) => void;
    delimiter?: string;
    includeHeader?: boolean;
    sheetName?: string;
    autoFilter?: boolean;
    freezeHeader?: boolean;
    pretty?: boolean;
    indent?: number;
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'a3' | 'a4' | 'a5' | 'letter' | 'legal' | 'tabloid';
    columns?: string[];
    [key: string]: unknown;
}
/**
 * Download a file to the user's device
 */
export declare function downloadFile(blob: Blob, filename: string, _mimeType?: string): void;
/**
 * Export data to CSV and optionally download
 */
export declare function exportToCSV<T extends Record<string, unknown>>(data: T[], options?: ExportOptions): Promise<Blob>;
/**
 * Export data to Excel and optionally download
 */
export declare function exportToExcel<T extends Record<string, unknown>>(data: T[], options?: ExportOptions): Promise<Blob>;
/**
 * Export data to JSON and optionally download
 */
export declare function exportToJSON<T>(data: T, options?: ExportOptions): Promise<Blob>;
/**
 * Export data to XML and optionally download
 */
export declare function exportToXML<T>(data: T, options?: ExportOptions): Promise<Blob>;
/**
 * Export data to YAML and optionally download
 */
export declare function exportToYAML<T>(data: T, options?: ExportOptions): Promise<Blob>;
/**
 * Export data to PDF with table layout and configurable formatting
 */
export declare function exportToPDF<T>(data: T, options?: ExportOptions): Promise<Blob>;
//# sourceMappingURL=index.d.ts.map