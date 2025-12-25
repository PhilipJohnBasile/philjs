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
    start: { row: number; col: number };
    end: { row: number; col: number };
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
export function createWorkbook<T extends Record<string, unknown>>(
  sheets: SheetConfig<T>[],
  options: ExcelOptions = {}
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Set workbook properties
  workbook.Props = {
    Title: options.title,
    Author: options.author,
    CreatedDate: new Date(),
  };

  for (const sheetConfig of sheets) {
    const worksheet = createSheet(sheetConfig, options);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetConfig.name);
  }

  return workbook;
}

/**
 * Create a single worksheet
 */
export function createSheet<T extends Record<string, unknown>>(
  config: SheetConfig<T>,
  options: ExcelOptions = {}
): XLSX.WorkSheet {
  const { data, columns, headerStyle, freezeRows, freezeCols, autoFilter, merges } = config;

  // Determine columns
  const cols: ColumnConfig[] =
    columns ||
    (data[0]
      ? Object.keys(data[0]).map(key => ({
          key,
          header: key,
        }))
      : []);

  // Build the worksheet data
  const wsData: unknown[][] = [];

  // Add header row
  const headerRow = cols.map(col => col.header);
  wsData.push(headerRow);

  // Add data rows
  for (const row of data) {
    const rowData = cols.map(col => {
      const value = row[col.key];
      if (col.format) {
        return col.format(value);
      }
      return formatCellValue(value, options);
    });
    wsData.push(rowData);
  }

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  worksheet['!cols'] = cols.map(col => ({
    wch: col.width || calculateColumnWidth(col.header, data, col.key),
  }));

  // Apply header styles
  const defaultHeader = options.defaultHeaderStyle || headerStyle;
  if (defaultHeader) {
    for (let i = 0; i < cols.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = convertStyleToXLSX(cols[i].headerStyle || defaultHeader);
      }
    }
  }

  // Apply cell styles
  if (config.rowStyles || options.defaultCellStyle) {
    for (let r = 1; r <= data.length; r++) {
      const isEven = r % 2 === 0;
      const rowStyle = isEven ? config.rowStyles?.even : config.rowStyles?.odd;
      const style = rowStyle || options.defaultCellStyle;

      if (style) {
        for (let c = 0; c < cols.length; c++) {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = convertStyleToXLSX(cols[c].style || style);
          }
        }
      }
    }
  }

  // Apply freeze panes
  if (freezeRows || freezeCols) {
    worksheet['!freeze'] = {
      xSplit: freezeCols || 0,
      ySplit: freezeRows || 0,
    };
  }

  // Apply auto filter
  if (autoFilter) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  }

  // Apply merges
  if (merges && merges.length > 0) {
    worksheet['!merges'] = merges.map(merge => ({
      s: { r: merge.start.row, c: merge.start.col },
      e: { r: merge.end.row, c: merge.end.col },
    }));
  }

  return worksheet;
}

/**
 * Convert data to Excel buffer
 */
export function toExcelBuffer<T extends Record<string, unknown>>(
  sheets: SheetConfig<T>[],
  options: ExcelOptions = {}
): ArrayBuffer {
  const workbook = createWorkbook(sheets, options);
  return XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    compression: true,
  });
}

/**
 * Convert data to Excel Blob
 */
export function toExcelBlob<T extends Record<string, unknown>>(
  sheets: SheetConfig<T>[],
  options: ExcelOptions = {}
): Blob {
  const buffer = toExcelBuffer(sheets, options);
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Stream large datasets to Excel with progress tracking
 */
export async function streamToExcel<T extends Record<string, unknown>>(
  data: T[] | AsyncIterable<T>,
  sheetName: string,
  options: StreamingExcelOptions = {}
): Promise<Blob> {
  const { chunkSize = 10000, onProgress } = options;

  const allData: T[] = [];
  let processedRows = 0;
  const isArray = Array.isArray(data);
  const totalRows = isArray ? data.length : undefined;

  const iterate = async function* () {
    if (isArray) {
      for (const item of data) {
        yield item;
      }
    } else {
      for await (const item of data as AsyncIterable<T>) {
        yield item;
      }
    }
  };

  for await (const item of iterate()) {
    allData.push(item);
    processedRows++;

    if (processedRows % chunkSize === 0) {
      if (totalRows) {
        onProgress?.(processedRows / totalRows, processedRows);
      }
      // Yield to event loop for large datasets
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  onProgress?.(1, processedRows);

  return toExcelBlob([{ name: sheetName, data: allData }], options);
}

/**
 * Calculate optimal column width
 */
function calculateColumnWidth(header: string, data: unknown[], key: string): number {
  let maxWidth = header.length;

  for (const row of data.slice(0, 100)) {
    // Sample first 100 rows
    const value = (row as Record<string, unknown>)[key];
    if (value !== null && value !== undefined) {
      const length = String(value).length;
      if (length > maxWidth) {
        maxWidth = length;
      }
    }
  }

  // Add some padding and cap at reasonable max
  return Math.min(Math.max(maxWidth + 2, 8), 50);
}

/**
 * Format cell value for Excel
 */
function formatCellValue(value: unknown, _options: ExcelOptions): unknown {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return String(value);
}

/**
 * Convert our style format to XLSX style format
 */
function convertStyleToXLSX(style: CellStyle): Record<string, unknown> {
  const xlsxStyle: Record<string, unknown> = {};

  if (style.font) {
    xlsxStyle.font = {
      name: style.font.name,
      sz: style.font.size,
      bold: style.font.bold,
      italic: style.font.italic,
      underline: style.font.underline,
      color: style.font.color ? { rgb: style.font.color.replace('#', '') } : undefined,
    };
  }

  if (style.fill) {
    xlsxStyle.fill = {
      patternType: style.fill.patternType || 'solid',
      fgColor: style.fill.fgColor ? { rgb: style.fill.fgColor.replace('#', '') } : undefined,
      bgColor: style.fill.bgColor ? { rgb: style.fill.bgColor.replace('#', '') } : undefined,
    };
  }

  if (style.border) {
    xlsxStyle.border = {
      top: style.border.top
        ? { style: style.border.top.style, color: { rgb: style.border.top.color?.replace('#', '') } }
        : undefined,
      bottom: style.border.bottom
        ? { style: style.border.bottom.style, color: { rgb: style.border.bottom.color?.replace('#', '') } }
        : undefined,
      left: style.border.left
        ? { style: style.border.left.style, color: { rgb: style.border.left.color?.replace('#', '') } }
        : undefined,
      right: style.border.right
        ? { style: style.border.right.style, color: { rgb: style.border.right.color?.replace('#', '') } }
        : undefined,
    };
  }

  if (style.alignment) {
    xlsxStyle.alignment = {
      horizontal: style.alignment.horizontal,
      vertical: style.alignment.vertical,
      wrapText: style.alignment.wrapText,
    };
  }

  if (style.numFmt) {
    xlsxStyle.numFmt = style.numFmt;
  }

  return xlsxStyle;
}

/**
 * Parse Excel file to data
 */
export function parseExcel(
  buffer: ArrayBuffer,
  options: {
    sheetName?: string;
    sheetIndex?: number;
    header?: boolean;
  } = {}
): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheetName =
    options.sheetName || (options.sheetIndex !== undefined
      ? workbook.SheetNames[options.sheetIndex]
      : workbook.SheetNames[0]);

  const worksheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(worksheet, {
    header: options.header === false ? 1 : undefined,
    defval: '',
  });
}
