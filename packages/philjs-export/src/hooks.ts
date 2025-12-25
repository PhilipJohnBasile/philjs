/**
 * Export Hooks
 * React hooks for data export functionality
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import type { ExportFormat } from './components/ExportButton';

export interface ExportState {
  /** Is currently exporting */
  isExporting: boolean;
  /** Export progress (0-1) */
  progress: number;
  /** Current export format */
  format: ExportFormat | null;
  /** Error from last export attempt */
  error: Error | null;
  /** Last successful export time */
  lastExportTime: Date | null;
}

export interface ExportOptions {
  /** File name (without extension) */
  fileName?: string;
  /** Format-specific options */
  formatOptions?: Record<string, unknown>;
  /** Progress callback */
  onProgress?: (progress: number) => void;
  /** Success callback */
  onSuccess?: (format: ExportFormat, blob: Blob) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

export interface UseExportResult<_T> {
  /** Current export state */
  state: ExportState;
  /** Export to CSV */
  exportToCSV: (options?: ExportOptions) => Promise<void>;
  /** Export to Excel */
  exportToExcel: (options?: ExportOptions) => Promise<void>;
  /** Export to JSON */
  exportToJSON: (options?: ExportOptions) => Promise<void>;
  /** Export to XML */
  exportToXML: (options?: ExportOptions) => Promise<void>;
  /** Export to YAML */
  exportToYAML: (options?: ExportOptions) => Promise<void>;
  /** Export to PDF */
  exportToPDF: (options?: ExportOptions) => Promise<void>;
  /** Export to any format */
  exportTo: (format: ExportFormat, options?: ExportOptions) => Promise<void>;
  /** Cancel current export */
  cancel: () => void;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for exporting data to various formats
 */
export function useExport<T extends Record<string, unknown>>(
  data: T[] | (() => T[] | Promise<T[]>),
  defaultOptions: ExportOptions = {}
): UseExportResult<T> {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    format: null,
    error: null,
    lastExportTime: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const getData = useCallback(async (): Promise<T[]> => {
    if (typeof data === 'function') {
      return await data();
    }
    return data;
  }, [data]);

  const exportTo = useCallback(
    async (format: ExportFormat, options: ExportOptions = {}) => {
      const { fileName = 'export', formatOptions = {}, onProgress, onSuccess, onError } = {
        ...defaultOptions,
        ...options,
      };

      // Cancel any existing export
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState(prev => ({
        ...prev,
        isExporting: true,
        progress: 0,
        format,
        error: null,
      }));

      try {
        const exportData = await getData();

        const handleProgress = (progress: number) => {
          setState(prev => ({ ...prev, progress }));
          onProgress?.(progress);
        };

        // Dynamic imports for code splitting
        const { downloadFile } = await import('./index');
        let blob: Blob;

        switch (format) {
          case 'csv': {
            const { toCSV, createCSVBlob } = await import('./formats/csv');
            const csv = toCSV(exportData, formatOptions);
            blob = createCSVBlob(csv);
            downloadFile(blob, `${fileName}.csv`);
            break;
          }

          case 'excel': {
            const { toExcelBlob } = await import('./formats/excel');
            blob = toExcelBlob(
              [{ name: (formatOptions.sheetName as string) || 'Sheet1', data: exportData }],
              formatOptions
            );
            downloadFile(blob, `${fileName}.xlsx`);
            break;
          }

          case 'json': {
            const { toJSON, createJSONBlob } = await import('./formats/json');
            const json = toJSON(exportData, formatOptions);
            blob = createJSONBlob(json);
            downloadFile(blob, `${fileName}.json`);
            break;
          }

          case 'xml': {
            const { arrayToXML, createXMLBlob } = await import('./formats/xml');
            const xml = arrayToXML(exportData, formatOptions);
            blob = createXMLBlob(xml);
            downloadFile(blob, `${fileName}.xml`);
            break;
          }

          case 'yaml': {
            const { toYAML, createYAMLBlob } = await import('./formats/yaml');
            const yaml = toYAML(exportData, formatOptions);
            blob = createYAMLBlob(yaml);
            downloadFile(blob, `${fileName}.yaml`);
            break;
          }

          case 'pdf': {
            const { exportToPDF: pdfExport } = await import('./index');
            blob = await pdfExport(exportData, { title: fileName, ...formatOptions });
            downloadFile(blob, `${fileName}.pdf`);
            break;
          }

          default:
            throw new Error(`Unsupported format: ${format}`);
        }

        handleProgress(1);

        setState(prev => ({
          ...prev,
          isExporting: false,
          progress: 1,
          lastExportTime: new Date(),
        }));

        onSuccess?.(format, blob);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (err.name === 'AbortError') {
          setState(prev => ({
            ...prev,
            isExporting: false,
            progress: 0,
          }));
          return;
        }

        setState(prev => ({
          ...prev,
          isExporting: false,
          error: err,
        }));

        onError?.(err);
      }
    },
    [getData, defaultOptions]
  );

  const exportToCSV = useCallback(
    (options?: ExportOptions) => exportTo('csv', options),
    [exportTo]
  );

  const exportToExcel = useCallback(
    (options?: ExportOptions) => exportTo('excel', options),
    [exportTo]
  );

  const exportToJSON = useCallback(
    (options?: ExportOptions) => exportTo('json', options),
    [exportTo]
  );

  const exportToXML = useCallback(
    (options?: ExportOptions) => exportTo('xml', options),
    [exportTo]
  );

  const exportToYAML = useCallback(
    (options?: ExportOptions) => exportTo('yaml', options),
    [exportTo]
  );

  const exportToPDF = useCallback(
    (options?: ExportOptions) => exportTo('pdf', options),
    [exportTo]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      isExporting: false,
      progress: 0,
      format: null,
      error: null,
      lastExportTime: null,
    });
  }, [cancel]);

  return {
    state,
    exportToCSV,
    exportToExcel,
    exportToJSON,
    exportToXML,
    exportToYAML,
    exportToPDF,
    exportTo,
    cancel,
    reset,
  };
}

// ============================================================================
// Data Transform Hook
// ============================================================================

export interface TransformOptions<T, U> {
  /** Transform function */
  transform: (data: T[]) => U[];
  /** Filter function */
  filter?: (item: T) => boolean;
  /** Sort function */
  sort?: (a: T, b: T) => number;
  /** Fields to include */
  fields?: (keyof T)[];
  /** Fields to exclude */
  excludeFields?: (keyof T)[];
  /** Rename fields */
  renameFields?: Partial<Record<keyof T, string>>;
  /** Format values */
  formatters?: Partial<Record<keyof T, (value: unknown) => unknown>>;
}

export interface UseDataTransformResult<T, U> {
  /** Transformed data */
  transformedData: U[];
  /** Apply transformations */
  applyTransform: () => U[];
  /** Update transform options */
  setTransformOptions: (options: Partial<TransformOptions<T, U>>) => void;
  /** Reset to original data */
  reset: () => void;
}

/**
 * Hook for transforming data before export
 */
export function useDataTransform<T extends Record<string, unknown>, U = T>(
  data: T[],
  initialOptions: Partial<TransformOptions<T, U>> = {}
): UseDataTransformResult<T, U> {
  const [options, setOptions] = useState<Partial<TransformOptions<T, U>>>(initialOptions);

  const transformedData = useMemo(() => {
    let result: unknown[] = [...data];

    // Apply filter
    if (options.filter) {
      result = (result as T[]).filter(options.filter);
    }

    // Apply sort
    if (options.sort) {
      result = (result as T[]).sort(options.sort);
    }

    // Apply field selection
    if (options.fields || options.excludeFields) {
      result = (result as T[]).map(item => {
        const newItem: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(item)) {
          // Check include list
          if (options.fields && !options.fields.includes(key as keyof T)) {
            continue;
          }

          // Check exclude list
          if (options.excludeFields?.includes(key as keyof T)) {
            continue;
          }

          // Apply rename
          const newKey = options.renameFields?.[key as keyof T] ?? key;

          // Apply formatter
          const formatter = options.formatters?.[key as keyof T];
          const newValue = formatter ? formatter(value) : value;

          newItem[newKey] = newValue;
        }

        return newItem;
      });
    } else if (options.renameFields || options.formatters) {
      result = (result as T[]).map(item => {
        const newItem: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(item)) {
          const newKey = options.renameFields?.[key as keyof T] ?? key;
          const formatter = options.formatters?.[key as keyof T];
          const newValue = formatter ? formatter(value) : value;

          newItem[newKey] = newValue;
        }

        return newItem;
      });
    }

    // Apply custom transform
    if (options.transform) {
      result = options.transform(result as T[]);
    }

    return result as U[];
  }, [data, options]);

  const applyTransform = useCallback(() => {
    return transformedData;
  }, [transformedData]);

  const setTransformOptions = useCallback(
    (newOptions: Partial<TransformOptions<T, U>>) => {
      setOptions(prev => ({ ...prev, ...newOptions }));
    },
    []
  );

  const reset = useCallback(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  return {
    transformedData,
    applyTransform,
    setTransformOptions,
    reset,
  };
}

// ============================================================================
// Streaming Export Hook
// ============================================================================

export interface StreamingExportState extends ExportState {
  /** Number of processed items */
  processedItems: number;
  /** Total items (if known) */
  totalItems?: number;
  /** Bytes written */
  bytesWritten: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
}

export interface UseStreamingExportResult<T> extends Omit<UseExportResult<T>, 'state'> {
  /** Extended state with streaming info */
  state: StreamingExportState;
}

/**
 * Hook for streaming large datasets during export
 */
export function useStreamingExport<T extends Record<string, unknown>>(
  data: T[] | AsyncIterable<T>,
  defaultOptions: ExportOptions & { chunkSize?: number } = {}
): UseStreamingExportResult<T> {
  const [state, setState] = useState<StreamingExportState>({
    isExporting: false,
    progress: 0,
    format: null,
    error: null,
    lastExportTime: null,
    processedItems: 0,
    totalItems: Array.isArray(data) ? data.length : undefined,
    bytesWritten: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  const exportTo = useCallback(
    async (format: ExportFormat, options: ExportOptions = {}) => {
      const { fileName = 'export', formatOptions = {}, onProgress, onSuccess, onError } = {
        ...defaultOptions,
        ...options,
      };

      // Cancel any existing export
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      startTimeRef.current = Date.now();

      const totalItems = Array.isArray(data) ? data.length : undefined;

      setState(prev => ({
        ...prev,
        isExporting: true,
        progress: 0,
        format,
        error: null,
        processedItems: 0,
        totalItems,
        bytesWritten: 0,
      }));

      try {
        const handleStreamProgress = (progress: number, processedItems: number) => {
          const elapsedMs = Date.now() - startTimeRef.current;
          const itemsPerSecond = processedItems / (elapsedMs / 1000);
          const remainingItems = (totalItems || 0) - processedItems;
          const estimatedTimeRemaining = itemsPerSecond > 0 ? remainingItems / itemsPerSecond : undefined;

          setState(prev => ({
            ...prev,
            progress,
            processedItems,
            estimatedTimeRemaining,
          }));
          onProgress?.(progress);
        };

        const { downloadFile } = await import('./index');
        const { streamToBlob } = await import('./utils/streaming');
        let blob: Blob;

        switch (format) {
          case 'csv': {
            const { streamToCSV } = await import('./formats/csv');
            const dataArray = Array.isArray(data) ? data : [];
            const stream = streamToCSV(dataArray, {
              ...formatOptions,
              onProgress: handleStreamProgress,
            });
            const content = await streamToBlob(stream, 'text/csv');
            blob = content;
            downloadFile(blob, `${fileName}.csv`);
            break;
          }

          case 'excel': {
            const { streamToExcel } = await import('./formats/excel');
            const dataArray = Array.isArray(data) ? data : [];
            blob = await streamToExcel(dataArray, (formatOptions.sheetName as string) || 'Sheet1', {
              ...formatOptions,
              onProgress: handleStreamProgress,
            });
            downloadFile(blob, `${fileName}.xlsx`);
            break;
          }

          case 'json': {
            const { streamToJSON } = await import('./formats/json');
            const dataArray = Array.isArray(data) ? data : [];
            const stream = streamToJSON(dataArray, {
              ...formatOptions,
              onProgress: handleStreamProgress,
            });
            blob = await streamToBlob(stream, 'application/json');
            downloadFile(blob, `${fileName}.json`);
            break;
          }

          case 'xml': {
            const { streamToXML } = await import('./formats/xml');
            const dataArray = Array.isArray(data) ? data : [];
            const stream = streamToXML(dataArray, {
              ...formatOptions,
              onProgress: handleStreamProgress,
            });
            blob = await streamToBlob(stream, 'application/xml');
            downloadFile(blob, `${fileName}.xml`);
            break;
          }

          default:
            throw new Error(`Streaming not supported for format: ${format}`);
        }

        setState(prev => ({
          ...prev,
          isExporting: false,
          progress: 1,
          lastExportTime: new Date(),
        }));

        onSuccess?.(format, blob);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (err.name === 'AbortError') {
          setState(prev => ({
            ...prev,
            isExporting: false,
            progress: 0,
          }));
          return;
        }

        setState(prev => ({
          ...prev,
          isExporting: false,
          error: err,
        }));

        onError?.(err);
      }
    },
    [data, defaultOptions]
  );

  const exportToCSV = useCallback(
    (options?: ExportOptions) => exportTo('csv', options),
    [exportTo]
  );

  const exportToExcel = useCallback(
    (options?: ExportOptions) => exportTo('excel', options),
    [exportTo]
  );

  const exportToJSON = useCallback(
    (options?: ExportOptions) => exportTo('json', options),
    [exportTo]
  );

  const exportToXML = useCallback(
    (options?: ExportOptions) => exportTo('xml', options),
    [exportTo]
  );

  const exportToYAML = useCallback(
    (options?: ExportOptions) => exportTo('yaml', options),
    [exportTo]
  );

  const exportToPDF = useCallback(
    (options?: ExportOptions) => exportTo('pdf', options),
    [exportTo]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      isExporting: false,
      progress: 0,
      format: null,
      error: null,
      lastExportTime: null,
      processedItems: 0,
      totalItems: Array.isArray(data) ? data.length : undefined,
      bytesWritten: 0,
    });
  }, [cancel, data]);

  return {
    state,
    exportToCSV,
    exportToExcel,
    exportToJSON,
    exportToXML,
    exportToYAML,
    exportToPDF,
    exportTo,
    cancel,
    reset,
  };
}
