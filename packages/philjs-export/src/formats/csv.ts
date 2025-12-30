/**
 * CSV Export Module
 * Handles CSV generation with streaming support for large datasets
 */

import * as Papa from 'papaparse';

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
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  options: CSVOptions = {}
): string {
  const {
    delimiter = ',',
    header = true,
    quoteChar = '"',
    escapeChar = '"',
    newline = '\r\n',
    columns,
    columnHeaders,
    skipEmptyLines = true,
    transformRow,
  } = options;

  // Transform rows if needed
  const transformedData = transformRow ? data.map(transformRow) : data;

  // Get columns from first row if not specified
  const cols = columns || (transformedData[0] ? Object.keys(transformedData[0]) : []);

  // Apply column header mapping
  const headerRow = cols.map(col => columnHeaders?.[col] ?? col);

  const result = Papa.unparse(
    {
      fields: header ? headerRow : [],
      data: transformedData.map(row => cols.map(col => row[col])),
    },
    {
      delimiter,
      quotes: true,
      quoteChar,
      escapeChar,
      newline,
      skipEmptyLines,
    }
  );

  return result;
}

/**
 * Stream large datasets to CSV with progress tracking
 */
export async function* streamToCSV<T extends Record<string, unknown>>(
  data: T[] | AsyncIterable<T>,
  options: StreamingCSVOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    delimiter = ',',
    header = true,
    quoteChar = '"',
    columns,
    columnHeaders,
    chunkSize = 1000,
    onProgress,
    onChunk,
    transformRow,
  } = options;

  let cols: string[] | null = null;
  let processedRows = 0;
  let chunkIndex = 0;
  let currentChunk: Record<string, unknown>[] = [];
  let isFirstChunk = true;

  const isArray = Array.isArray(data);
  const totalRows = isArray ? data.length : undefined;

  const processChunk = (chunk: Record<string, unknown>[], includeHeader: boolean): string => {
    if (!cols && chunk.length > 0) {
      cols = columns || Object.keys(chunk[0]!);
    }

    if (!cols) return '';

    const headerRow = cols.map(col => columnHeaders?.[col] ?? col);
    const rows = chunk.map(row => cols!.map(col => formatCSVValue(row[col], quoteChar, delimiter)));

    let result = '';
    if (includeHeader && header) {
      result = headerRow.map(h => formatCSVValue(h, quoteChar, delimiter)).join(delimiter) + '\r\n';
    }
    result += rows.map(row => row.join(delimiter)).join('\r\n');

    return result;
  };

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
    const transformedItem = transformRow ? transformRow(item as Record<string, unknown>) : item;
    currentChunk.push(transformedItem as Record<string, unknown>);
    processedRows++;

    if (currentChunk.length >= chunkSize) {
      const csvChunk = processChunk(currentChunk, isFirstChunk);
      if (csvChunk) {
        onChunk?.(csvChunk, chunkIndex);
        yield (isFirstChunk ? '' : '\r\n') + csvChunk;
      }
      currentChunk = [];
      isFirstChunk = false;
      chunkIndex++;

      if (totalRows) {
        onProgress?.(processedRows / totalRows, processedRows);
      }
    }
  }

  // Process remaining items
  if (currentChunk.length > 0) {
    const csvChunk = processChunk(currentChunk, isFirstChunk);
    if (csvChunk) {
      onChunk?.(csvChunk, chunkIndex);
      yield (isFirstChunk ? '' : '\r\n') + csvChunk;
    }
  }

  onProgress?.(1, processedRows);
}

/**
 * Format a value for CSV, handling escaping
 */
function formatCSVValue(value: unknown, quoteChar: string, delimiter: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Check if quoting is needed
  const needsQuoting =
    str.includes(delimiter) ||
    str.includes(quoteChar) ||
    str.includes('\n') ||
    str.includes('\r');

  if (needsQuoting) {
    // Escape quote characters by doubling them
    const escaped = str.replace(new RegExp(quoteChar, 'g'), quoteChar + quoteChar);
    return quoteChar + escaped + quoteChar;
  }

  return str;
}

/**
 * Parse CSV string to data
 */
export function parseCSV<T = Record<string, unknown>>(
  csv: string,
  options: {
    header?: boolean;
    dynamicTyping?: boolean;
    transformHeader?: (header: string, index: number) => string;
  } = {}
): T[] {
  const config: Papa.ParseConfig<T> & { download: false; worker: false } = {
    header: options.header ?? true,
    dynamicTyping: options.dynamicTyping ?? true,
    skipEmptyLines: true,
    download: false,
    worker: false,
  };

  if (options.transformHeader) {
    config.transformHeader = options.transformHeader;
  }

  const result = Papa.parse<T>(csv, config);

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  return result.data;
}

/**
 * Create a CSV Blob for download
 */
export function createCSVBlob(csv: string): Blob {
  // Add BOM for Excel compatibility
  const bom = '\uFEFF';
  return new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
}
