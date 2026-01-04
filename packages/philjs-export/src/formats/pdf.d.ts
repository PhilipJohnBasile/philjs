/**
 * PDF Export Module
 * Handles PDF generation with tables and styling using jsPDF
 */
import { jsPDF } from 'jspdf';
export interface PDFStyle {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
    textColor?: string | [number, number, number];
    fillColor?: string | [number, number, number];
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    cellPadding?: number;
}
export interface PDFColumnConfig {
    key: string;
    header: string;
    width?: number | 'auto' | 'wrap';
    style?: PDFStyle;
    headerStyle?: PDFStyle;
    format?: (value: unknown) => string;
}
export interface PDFTableConfig<T = Record<string, unknown>> {
    data: T[];
    columns?: PDFColumnConfig[];
    title?: string;
    headerStyle?: PDFStyle;
    bodyStyle?: PDFStyle;
    alternateRowStyle?: PDFStyle;
    showHeader?: boolean;
    margin?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
}
export interface PDFOptions {
    /** Document title */
    title?: string;
    /** Document author */
    author?: string;
    /** Document subject */
    subject?: string;
    /** Document keywords */
    keywords?: string;
    /** Page orientation */
    orientation?: 'portrait' | 'landscape';
    /** Page format */
    format?: 'a4' | 'letter' | 'legal' | [number, number];
    /** Default font size */
    fontSize?: number;
    /** Header text to show on each page */
    header?: string;
    /** Footer text to show on each page */
    footer?: string;
    /** Show page numbers */
    showPageNumbers?: boolean;
    /** Margins */
    margin?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
}
export interface StreamingPDFOptions extends PDFOptions {
    /** Chunk size for processing */
    chunkSize?: number;
    /** Progress callback */
    onProgress?: (progress: number, processedRows: number) => void;
}
/**
 * Create a PDF document from data
 */
export declare function createPDF<T extends Record<string, unknown>>(data: T[], options?: PDFOptions): jsPDF;
/**
 * Create a PDF with multiple tables
 */
export declare function createMultiTablePDF<T extends Record<string, unknown>>(tables: PDFTableConfig<T>[], options?: PDFOptions): jsPDF;
/**
 * Convert data to PDF ArrayBuffer
 */
export declare function toPDFBuffer<T extends Record<string, unknown>>(data: T[], options?: PDFOptions): ArrayBuffer;
/**
 * Convert data to PDF Blob
 */
export declare function toPDFBlob<T extends Record<string, unknown>>(data: T[], options?: PDFOptions): Blob;
/**
 * Convert data to PDF base64 string
 */
export declare function toPDFBase64<T extends Record<string, unknown>>(data: T[], options?: PDFOptions): string;
/**
 * Stream large datasets to PDF with progress tracking
 */
export declare function streamToPDF<T extends Record<string, unknown>>(data: T[] | AsyncIterable<T>, options?: StreamingPDFOptions): Promise<Blob>;
/**
 * Add a chart or image to PDF
 */
export declare function addImageToPDF(doc: jsPDF, imageData: string | HTMLImageElement | HTMLCanvasElement, x: number, y: number, width: number, height: number, format?: 'JPEG' | 'PNG' | 'GIF' | 'WEBP'): void;
//# sourceMappingURL=pdf.d.ts.map