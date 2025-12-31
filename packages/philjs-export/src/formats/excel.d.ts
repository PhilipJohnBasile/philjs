/**
 * Excel Export Module
 * Handles Excel generation with multiple sheets and styling
 */
import * as XLSX from 'xlsx';
export interface CellStyle {
    font?: {
        name?: string;
        size?: number;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        color?: string;
    };
    fill?: {
        type?: 'pattern' | 'gradient';
        patternType?: 'solid' | 'none';
        fgColor?: string;
        bgColor?: string;
    };
    border?: {
        top?: BorderStyle;
        bottom?: BorderStyle;
        left?: BorderStyle;
        right?: BorderStyle;
    };
    alignment?: {
        horizontal?: 'left' | 'center' | 'right';
        vertical?: 'top' | 'center' | 'bottom';
        wrapText?: boolean;
    };
    numFmt?: string;
}
export interface BorderStyle {
    style?: 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted';
    color?: string;
}
export interface ColumnConfig {
    key: string;
    header: string;
    width?: number;
    style?: CellStyle;
    headerStyle?: CellStyle;
    format?: (value: unknown) => string | number;
}
export interface SheetConfig<T = Record<string, unknown>> {
    name: string;
    data: T[];
    columns?: ColumnConfig[];
    headerStyle?: CellStyle;
    rowStyles?: {
        even?: CellStyle;
        odd?: CellStyle;
    };
    freezeRows?: number;
    freezeCols?: number;
    autoFilter?: boolean;
    merges?: Array<{
        start: {
            row: number;
            col: number;
        };
        end: {
            row: number;
            col: number;
        };
    }>;
}
export interface ExcelOptions {
    /** Workbook title */
    title?: string;
    /** Workbook author */
    author?: string;
    /** Default header style */
    defaultHeaderStyle?: CellStyle;
    /** Default cell style */
    defaultCellStyle?: CellStyle;
    /** Date format */
    dateFormat?: string;
    /** Number format */
    numberFormat?: string;
}
export interface StreamingExcelOptions extends ExcelOptions {
    /** Chunk size for processing */
    chunkSize?: number;
    /** Progress callback */
    onProgress?: (progress: number, processedRows: number) => void;
}
/**
 * Create an Excel workbook from multiple sheets
 */
export declare function createWorkbook<T extends Record<string, unknown>>(sheets: SheetConfig<T>[], options?: ExcelOptions): XLSX.WorkBook;
/**
 * Create a single worksheet
 */
export declare function createSheet<T extends Record<string, unknown>>(config: SheetConfig<T>, options?: ExcelOptions): XLSX.WorkSheet;
/**
 * Convert data to Excel buffer
 */
export declare function toExcelBuffer<T extends Record<string, unknown>>(sheets: SheetConfig<T>[], options?: ExcelOptions): ArrayBuffer;
/**
 * Convert data to Excel Blob
 */
export declare function toExcelBlob<T extends Record<string, unknown>>(sheets: SheetConfig<T>[], options?: ExcelOptions): Blob;
/**
 * Stream large datasets to Excel with progress tracking
 */
export declare function streamToExcel<T extends Record<string, unknown>>(data: T[] | AsyncIterable<T>, sheetName: string, options?: StreamingExcelOptions): Promise<Blob>;
/**
 * Parse Excel file to data
 */
export declare function parseExcel(buffer: ArrayBuffer, options?: {
    sheetName?: string;
    sheetIndex?: number;
    header?: boolean;
}): Record<string, unknown>[];
//# sourceMappingURL=excel.d.ts.map