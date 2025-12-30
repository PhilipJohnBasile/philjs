/**
 * PhilJS Export Hooks
 * Signal-based hooks for export operations
 */

import type { ExportOptions } from './index.js';
import type { StreamProgress, StreamStats } from './utils/streaming.js';

// Simple signal implementation for standalone use (when @philjs/core is not available)
interface Signal<T> {
  (): T;
  set: (value: T) => void;
}

function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<() => void>();

  const getter = (() => value) as Signal<T>;
  getter.set = (newValue: T) => {
    value = newValue;
    subscribers.forEach(fn => fn());
  };

  return getter;
}

// ============================================================================
// Export State Hook
// ============================================================================

export interface ExportState {
  isExporting: boolean;
  progress: number;
  error: Error | null;
  result: Blob | null;
}

export function useExport() {
  const state = signal<ExportState>({
    isExporting: false,
    progress: 0,
    error: null,
    result: null,
  });

  const exportData = async <T>(
    data: T,
    format: 'csv' | 'excel' | 'json' | 'xml' | 'yaml' | 'pdf',
    options: ExportOptions = {}
  ): Promise<Blob | null> => {
    state.set({
      isExporting: true,
      progress: 0,
      error: null,
      result: null,
    });

    try {
      let blob: Blob;

      const progressCallback = (progress: number) => {
        state.set({
          ...state(),
          progress: progress * 100,
        });
        options.onProgress?.(progress);
      };

      const optionsWithProgress = { ...options, onProgress: progressCallback };

      switch (format) {
        case 'csv': {
          const { exportToCSV } = await import('./index.js');
          blob = await exportToCSV(data as Record<string, unknown>[], optionsWithProgress);
          break;
        }
        case 'excel': {
          const { exportToExcel } = await import('./index.js');
          blob = await exportToExcel(data as Record<string, unknown>[], optionsWithProgress);
          break;
        }
        case 'json': {
          const { exportToJSON } = await import('./index.js');
          blob = await exportToJSON(data, optionsWithProgress);
          break;
        }
        case 'xml': {
          const { exportToXML } = await import('./index.js');
          blob = await exportToXML(data, optionsWithProgress);
          break;
        }
        case 'yaml': {
          const { exportToYAML } = await import('./index.js');
          blob = await exportToYAML(data, optionsWithProgress);
          break;
        }
        case 'pdf': {
          const { exportToPDF } = await import('./index.js');
          blob = await exportToPDF(data, optionsWithProgress);
          break;
        }
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      state.set({
        isExporting: false,
        progress: 100,
        error: null,
        result: blob,
      });

      return blob;
    } catch (error) {
      state.set({
        isExporting: false,
        progress: 0,
        error: error instanceof Error ? error : new Error(String(error)),
        result: null,
      });
      return null;
    }
  };

  const reset = () => {
    state.set({
      isExporting: false,
      progress: 0,
      error: null,
      result: null,
    });
  };

  return {
    state: () => state(),
    exportData,
    reset,
  };
}

// ============================================================================
// Streaming Export Hook
// ============================================================================

export interface StreamingExportState {
  isStreaming: boolean;
  progress: StreamProgress | null;
  error: Error | null;
  stats: StreamStats | null;
}

export function useStreamingExport() {
  const state = signal<StreamingExportState>({
    isStreaming: false,
    progress: null,
    error: null,
    stats: null,
  });

  const streamExport = async <T>(
    generator: AsyncGenerator<T>,
    options: {
      onChunk?: (chunk: T) => void;
      onProgress?: (progress: StreamProgress) => void;
      onComplete?: (stats: StreamStats) => void;
    } = {}
  ): Promise<T[]> => {
    state.set({
      isStreaming: true,
      progress: null,
      error: null,
      stats: null,
    });

    const chunks: T[] = [];
    const startTime = Date.now();

    try {
      for await (const chunk of generator) {
        chunks.push(chunk);
        options.onChunk?.(chunk);

        const progress: StreamProgress = {
          progress: 0, // Unknown total
          processedItems: chunks.length,
          bytesWritten: 0,
          elapsedMs: Date.now() - startTime,
          itemsPerSecond: chunks.length / ((Date.now() - startTime) / 1000),
        };

        state.set({
          ...state(),
          progress,
        });

        options.onProgress?.(progress);
      }

      const stats: StreamStats = {
        totalItems: chunks.length,
        totalBytes: 0,
        totalTimeMs: Date.now() - startTime,
        averageItemsPerSecond: chunks.length / ((Date.now() - startTime) / 1000),
        chunks: chunks.length,
      };

      state.set({
        isStreaming: false,
        progress: null,
        error: null,
        stats,
      });

      options.onComplete?.(stats);

      return chunks;
    } catch (error) {
      state.set({
        isStreaming: false,
        progress: null,
        error: error instanceof Error ? error : new Error(String(error)),
        stats: null,
      });
      return [];
    }
  };

  const reset = () => {
    state.set({
      isStreaming: false,
      progress: null,
      error: null,
      stats: null,
    });
  };

  return {
    state: () => state(),
    streamExport,
    reset,
  };
}

// ============================================================================
// Batch Export Hook
// ============================================================================

export interface BatchExportState {
  isExporting: boolean;
  currentIndex: number;
  totalItems: number;
  completedItems: Blob[];
  errors: Array<{ index: number; error: Error }>;
}

export function useBatchExport() {
  const state = signal<BatchExportState>({
    isExporting: false,
    currentIndex: 0,
    totalItems: 0,
    completedItems: [],
    errors: [],
  });

  const batchExport = async <T>(
    items: T[],
    format: 'csv' | 'excel' | 'json' | 'xml' | 'yaml' | 'pdf',
    options: ExportOptions = {}
  ): Promise<Blob[]> => {
    state.set({
      isExporting: true,
      currentIndex: 0,
      totalItems: items.length,
      completedItems: [],
      errors: [],
    });

    const results: Blob[] = [];
    const errors: Array<{ index: number; error: Error }> = [];

    for (let i = 0; i < items.length; i++) {
      state.set({
        ...state(),
        currentIndex: i,
      });

      try {
        const { useExport } = await import('./hooks.js');
        const exporter = useExport();
        const blob = await exporter.exportData(items[i], format, {
          ...options,
          download: false,
        });

        if (blob) {
          results.push(blob);
        }
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }

      state.set({
        ...state(),
        completedItems: [...results],
        errors: [...errors],
      });
    }

    state.set({
      isExporting: false,
      currentIndex: items.length,
      totalItems: items.length,
      completedItems: results,
      errors,
    });

    return results;
  };

  const reset = () => {
    state.set({
      isExporting: false,
      currentIndex: 0,
      totalItems: 0,
      completedItems: [],
      errors: [],
    });
  };

  return {
    state: () => state(),
    batchExport,
    reset,
  };
}
