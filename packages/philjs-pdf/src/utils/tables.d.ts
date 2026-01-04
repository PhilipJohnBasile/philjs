/**
 * Table Generation Utilities for PDF Generation
 */
import { PDFDocument, PDFPage, PDFFont } from 'pdf-lib';
export interface TableColumn {
    /** Column header text */
    header: string;
    /** Property key for data access */
    key: string;
    /** Column width (number for fixed, 'auto' for auto-size, '*' for flex) */
    width?: number | 'auto' | '*';
    /** Text alignment */
    align?: 'left' | 'center' | 'right';
    /** Custom formatter function */
    formatter?: (value: any, row: any) => string;
}
export interface TableStyle {
    /** Font for table content */
    font?: PDFFont;
    /** Font for header */
    headerFont?: PDFFont;
    /** Font size for content */
    fontSize?: number;
    /** Font size for header */
    headerFontSize?: number;
    /** Row height */
    rowHeight?: number;
    /** Header row height */
    headerHeight?: number;
    /** Cell padding */
    padding?: number | {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    /** Header background color */
    headerBackground?: {
        r: number;
        g: number;
        b: number;
    };
    /** Header text color */
    headerColor?: {
        r: number;
        g: number;
        b: number;
    };
    /** Alternate row background color */
    alternateRowBackground?: {
        r: number;
        g: number;
        b: number;
    };
    /** Border color */
    borderColor?: {
        r: number;
        g: number;
        b: number;
    };
    /** Border width */
    borderWidth?: number;
    /** Show horizontal borders */
    showHorizontalBorders?: boolean;
    /** Show vertical borders */
    showVerticalBorders?: boolean;
    /** Show outer border */
    showOuterBorder?: boolean;
}
export interface TableOptions {
    /** Starting X position */
    x: number;
    /** Starting Y position */
    y: number;
    /** Total table width */
    width: number;
    /** Table columns */
    columns: TableColumn[];
    /** Table data rows */
    data: Record<string, any>[];
    /** Table styling */
    style?: TableStyle;
    /** Show header row */
    showHeader?: boolean;
    /** Max rows per page (for pagination) */
    maxRowsPerPage?: number;
}
export interface TableResult {
    /** Final Y position after table */
    endY: number;
    /** Number of rows rendered */
    rowsRendered: number;
    /** Whether table was truncated */
    truncated: boolean;
    /** Height of the table */
    height: number;
}
/**
 * Renders tables in PDF documents
 */
export declare class TableRenderer {
    private pdfDoc;
    private defaultFont;
    private defaultBoldFont;
    /**
     * Initialize with a PDF document
     */
    init(pdfDoc: PDFDocument): Promise<void>;
    /**
     * Draw a table on a page
     */
    drawTable(page: PDFPage, options: TableOptions): TableResult;
    /**
     * Calculate column widths based on configuration
     */
    private calculateColumnWidths;
    /**
     * Get text X position based on alignment
     */
    private getTextX;
}
/**
 * Create a simple table definition
 */
export declare function createTable(columns: (string | TableColumn)[], data: Record<string, any>[]): {
    columns: TableColumn[];
    data: Record<string, any>[];
};
/**
 * Format currency value
 */
export declare function currencyFormatter(currency?: string): (value: number) => string;
/**
 * Format percentage value
 */
export declare function percentFormatter(decimals?: number): (value: number) => string;
/**
 * Format date value
 */
export declare function dateFormatter(format?: 'short' | 'medium' | 'long'): (value: Date | string) => string;
/**
 * Calculate table height based on rows
 */
export declare function calculateTableHeight(rowCount: number, options?: {
    showHeader?: boolean;
    rowHeight?: number;
    headerHeight?: number;
}): number;
/**
 * Generate HTML table from data (for HTML-based PDF generation)
 */
export declare function generateHtmlTable(columns: TableColumn[], data: Record<string, any>[], style?: {
    className?: string;
    striped?: boolean;
    bordered?: boolean;
    hover?: boolean;
}): string;
export declare const tableRenderer: TableRenderer;
export default TableRenderer;
//# sourceMappingURL=tables.d.ts.map