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
 * Export data to PDF and optionally download
 */
export declare function exportToPDF<T extends Record<string, unknown>>(data: T[] | HTMLElement | string, options?: ExportOptions & PDFExportOptions): Promise<Blob>;
/**
 * PDF-specific export options
 */
export interface PDFExportOptions {
    /** Document author */
    author?: string;
    /** Document subject */
    subject?: string;
    /** Document keywords */
    keywords?: string;
    /** Page orientation */
    orientation?: 'portrait' | 'landscape';
    /** Page format */
    pageFormat?: 'a4' | 'letter' | 'legal' | [number, number];
    /** Default font size */
    fontSize?: number;
    /** Header text to show on each page */
    header?: string;
    /** Footer text to show on each page */
    footer?: string;
    /** Show page numbers */
    showPageNumbers?: boolean;
    /** Page margins */
    margin?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    /** Render images from HTML */
    renderImages?: boolean;
    /** Scale factor for HTML rendering */
    scale?: number;
}
//# sourceMappingURL=index.d.ts.map