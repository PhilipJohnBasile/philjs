/**
 * ExportButton Component
 *
 * A button component for triggering data exports in various formats.
 */

import type { ExportOptions } from '../index.js';

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
// Types
// ============================================================================

/**
 * ExportButton props
 */
export interface ExportButtonProps<T = unknown> {
  /**
   * Data to export
   */
  data: T | (() => T) | (() => Promise<T>);

  /**
   * Export format
   */
  format: 'csv' | 'excel' | 'json' | 'xml' | 'yaml' | 'pdf';

  /**
   * Button label
   */
  label?: string;

  /**
   * Export options
   */
  options?: ExportOptions;

  /**
   * Whether button is disabled
   */
  disabled?: boolean;

  /**
   * Callback when export starts
   */
  onExportStart?: () => void;

  /**
   * Callback when export completes
   */
  onExportComplete?: (blob: Blob) => void;

  /**
   * Callback when export fails
   */
  onExportError?: (error: Error) => void;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * ExportButton state
 */
export interface ExportButtonState {
  isExporting: boolean;
  progress: number;
  error: Error | null;
}

// ============================================================================
// ExportButton Component
// ============================================================================

/**
 * Create an ExportButton component
 */
export function ExportButton<T = unknown>(props: ExportButtonProps<T>): unknown {
  const state = signal<ExportButtonState>({
    isExporting: false,
    progress: 0,
    error: null,
  });

  const handleExport = async () => {
    if (state().isExporting || props.disabled) return;

    state.set({
      isExporting: true,
      progress: 0,
      error: null,
    });

    props.onExportStart?.();

    try {
      // Get data (supports function, async function, or direct value)
      const data = typeof props.data === 'function'
        ? await (props.data as () => T | Promise<T>)()
        : props.data;

      // Dynamic import to avoid circular dependencies
      const { useExport } = await import('../hooks.js');
      const exporter = useExport();

      const blob = await exporter.exportData(data, props.format, {
        ...props.options,
        onProgress: (progress) => {
          state.set({
            ...state(),
            progress: progress * 100,
          });
        },
      });

      state.set({
        isExporting: false,
        progress: 100,
        error: null,
      });

      if (blob) {
        props.onExportComplete?.(blob);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      state.set({
        isExporting: false,
        progress: 0,
        error: err,
      });
      props.onExportError?.(err);
    }
  };

  const formatLabels: Record<string, string> = {
    csv: 'CSV',
    excel: 'Excel',
    json: 'JSON',
    xml: 'XML',
    yaml: 'YAML',
    pdf: 'PDF',
  };

  const label = props.label || `Export to ${formatLabels[props.format] || props.format.toUpperCase()}`;
  const currentState = state();

  return {
    type: 'button',
    props: {
      className: props.className,
      disabled: props.disabled || currentState.isExporting,
      'data-testid': props.testID,
      'aria-label': label,
      'aria-busy': currentState.isExporting,
      onClick: handleExport,
      style: {
        cursor: props.disabled || currentState.isExporting ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
      },
    },
    children: currentState.isExporting
      ? `Exporting... ${Math.round(currentState.progress)}%`
      : label,
  };
}

/**
 * Get current state of an ExportButton (for external access)
 */
export function createExportButtonState(): {
  state: () => ExportButtonState;
  reset: () => void;
} {
  const state = signal<ExportButtonState>({
    isExporting: false,
    progress: 0,
    error: null,
  });

  return {
    state: () => state(),
    reset: () => state.set({
      isExporting: false,
      progress: 0,
      error: null,
    }),
  };
}

export default ExportButton;
