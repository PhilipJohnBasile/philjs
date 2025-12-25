/**
 * YAML Export Module
 * Handles YAML generation with formatting options
 */

import YAML from 'yaml';

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
export function toYAML<T>(data: T, options: YAMLOptions = {}): string {
  const {
    indent = 2,
    lineWidth = 80,
    defaultQuoteType = 'single',
    forceQuotes = false,
    sortKeys = false,
    includeNulls = true,
    dateFormat = 'iso',
    formatDate,
    comment,
    transform,
    fields,
    excludeFields,
  } = options;

  // Pre-process data
  const processedData = processData(data, {
    includeNulls,
    dateFormat,
    formatDate,
    transform,
    fields,
    excludeFields,
  });

  // Create YAML document
  const doc = new YAML.Document(processedData);

  // Add comment if provided
  if (comment) {
    doc.commentBefore = comment;
  }

  // Generate YAML string
  return doc.toString({
    indent,
    lineWidth,
    defaultStringType: forceQuotes
      ? defaultQuoteType === 'double'
        ? YAML.Scalar.QUOTE_DOUBLE
        : YAML.Scalar.QUOTE_SINGLE
      : YAML.Scalar.PLAIN,
    sortMapEntries: sortKeys ? true : undefined,
  } as YAML.ToStringOptions);
}

/**
 * Convert array to YAML with document separators
 */
export function arrayToYAMLDocuments<T>(data: T[], options: YAMLOptions = {}): string {
  const {
    indent = 2,
    lineWidth = 80,
    sortKeys = false,
    includeNulls = true,
    dateFormat = 'iso',
    formatDate,
    transform,
    fields,
    excludeFields,
  } = options;

  const documents: string[] = [];

  for (const item of data) {
    const processedItem = processData(item, {
      includeNulls,
      dateFormat,
      formatDate,
      transform,
      fields,
      excludeFields,
    });

    const doc = new YAML.Document(processedItem);
    documents.push(
      doc.toString({
        indent,
        lineWidth,
        sortMapEntries: sortKeys ? true : undefined,
      } as YAML.ToStringOptions)
    );
  }

  return documents.join('---\n');
}

/**
 * Stream large datasets to YAML with progress tracking
 */
export async function* streamToYAML<T>(
  data: T[] | AsyncIterable<T>,
  options: StreamingYAMLOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    chunkSize = 100,
    onProgress,
    onChunk,
    indent = 2,
    lineWidth = 80,
    sortKeys = false,
    includeNulls = true,
    dateFormat = 'iso',
    formatDate,
    transform,
    fields,
    excludeFields,
  } = options;

  const isArray = Array.isArray(data);
  const totalItems = isArray ? data.length : undefined;

  let processedItems = 0;
  let chunkIndex = 0;
  let isFirst = true;

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

  let buffer: T[] = [];

  for await (const item of iterate()) {
    buffer.push(item);
    processedItems++;

    if (buffer.length >= chunkSize) {
      const chunks: string[] = [];

      for (const bufItem of buffer) {
        const processedItem = processData(bufItem, {
          includeNulls,
          dateFormat,
          formatDate,
          transform,
          fields,
          excludeFields,
        });

        const doc = new YAML.Document(processedItem);
        const yamlStr = doc.toString({
          indent,
          lineWidth,
          sortMapEntries: sortKeys ? true : undefined,
        } as YAML.ToStringOptions);

        chunks.push((isFirst ? '' : '---\n') + yamlStr);
        isFirst = false;
      }

      const chunkStr = chunks.join('');
      onChunk?.(chunkStr, chunkIndex);
      yield chunkStr;

      buffer = [];
      chunkIndex++;

      if (totalItems) {
        onProgress?.(processedItems / totalItems, processedItems);
      }
    }
  }

  // Process remaining items
  if (buffer.length > 0) {
    const chunks: string[] = [];

    for (const bufItem of buffer) {
      const processedItem = processData(bufItem, {
        includeNulls,
        dateFormat,
        formatDate,
        transform,
        fields,
        excludeFields,
      });

      const doc = new YAML.Document(processedItem);
      const yamlStr = doc.toString({
        indent,
        lineWidth,
        sortMapEntries: sortKeys ? true : undefined,
      } as YAML.ToStringOptions);

      chunks.push((isFirst ? '' : '---\n') + yamlStr);
      isFirst = false;
    }

    const chunkStr = chunks.join('');
    onChunk?.(chunkStr, chunkIndex);
    yield chunkStr;
  }

  onProgress?.(1, processedItems);
}

/**
 * Process data according to options
 */
function processData<T>(
  data: T,
  options: {
    includeNulls: boolean;
    dateFormat: 'iso' | 'timestamp' | 'string';
    formatDate?: (date: Date) => string;
    transform?: (key: string, value: unknown) => unknown;
    fields?: string[];
    excludeFields?: string[];
  }
): unknown {
  const { includeNulls, dateFormat, formatDate, transform, fields, excludeFields } = options;

  const processValue = (key: string, value: unknown): unknown => {
    // Handle null
    if (value === null || value === undefined) {
      return includeNulls ? null : undefined;
    }

    // Handle dates
    if (value instanceof Date) {
      if (formatDate) {
        return formatDate(value);
      }
      switch (dateFormat) {
        case 'timestamp':
          return value.getTime();
        case 'string':
          return value.toLocaleString();
        case 'iso':
        default:
          return value.toISOString();
      }
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item, index) => processValue(String(index), item));
    }

    // Handle objects
    if (typeof value === 'object') {
      return processObject(value as Record<string, unknown>);
    }

    // Apply transform
    if (transform) {
      return transform(key, value);
    }

    return value;
  };

  const processObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Field filtering
      if (fields && !fields.includes(key)) {
        continue;
      }
      if (excludeFields?.includes(key)) {
        continue;
      }

      const processed = processValue(key, value);
      if (processed !== undefined) {
        result[key] = processed;
      }
    }

    return result;
  };

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return processObject(data as Record<string, unknown>);
  }

  return processValue('', data);
}

/**
 * Create a YAML Blob for download
 */
export function createYAMLBlob(yaml: string): Blob {
  return new Blob([yaml], { type: 'application/x-yaml;charset=utf-8' });
}

/**
 * Parse YAML string to data
 */
export function parseYAML<T = unknown>(yaml: string): T {
  return YAML.parse(yaml);
}

/**
 * Parse YAML with multiple documents
 */
export function parseYAMLDocuments<T = unknown>(yaml: string): T[] {
  return YAML.parseAllDocuments(yaml).map(doc => doc.toJSON() as T);
}

/**
 * Validate YAML string
 */
export function validateYAML(yaml: string): { valid: boolean; errors: string[] } {
  try {
    YAML.parse(yaml);
    return { valid: true, errors: [] };
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
