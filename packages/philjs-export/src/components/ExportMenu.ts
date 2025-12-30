/**
 * ExportMenu Component
 *
 * A dropdown menu component for selecting export formats.
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
 * Export format configuration
 */
export interface ExportFormatConfig {
  format: 'csv' | 'excel' | 'json' | 'xml' | 'yaml' | 'pdf';
  label: string;
  icon?: string;
  disabled?: boolean;
  options?: ExportOptions;
}

/**
 * ExportMenu props
 */
export interface ExportMenuProps<T = unknown> {
  /**
   * Data to export
   */
  data: T | (() => T) | (() => Promise<T>);

  /**
   * Available formats (defaults to all)
   */
  formats?: ExportFormatConfig[];

  /**
   * Menu trigger label
   */
  label?: string;

  /**
   * Default export options
   */
  options?: ExportOptions;

  /**
   * Whether menu is disabled
   */
  disabled?: boolean;

  /**
   * Callback when export starts
   */
  onExportStart?: (format: string) => void;

  /**
   * Callback when export completes
   */
  onExportComplete?: (format: string, blob: Blob) => void;

  /**
   * Callback when export fails
   */
  onExportError?: (format: string, error: Error) => void;

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
 * ExportMenu state
 */
export interface ExportMenuState {
  isOpen: boolean;
  isExporting: boolean;
  currentFormat: string | null;
  progress: number;
  error: Error | null;
}

// ============================================================================
// Default Formats
// ============================================================================

const DEFAULT_FORMATS: ExportFormatConfig[] = [
  { format: 'csv', label: 'CSV (.csv)' },
  { format: 'excel', label: 'Excel (.xlsx)' },
  { format: 'json', label: 'JSON (.json)' },
  { format: 'xml', label: 'XML (.xml)' },
  { format: 'yaml', label: 'YAML (.yaml)' },
  { format: 'pdf', label: 'PDF (.pdf)' },
];

// ============================================================================
// ExportMenu Component
// ============================================================================

/**
 * Create an ExportMenu component
 */
export function ExportMenu<T = unknown>(props: ExportMenuProps<T>): unknown {
  const state = signal<ExportMenuState>({
    isOpen: false,
    isExporting: false,
    currentFormat: null,
    progress: 0,
    error: null,
  });

  const formats = props.formats || DEFAULT_FORMATS;

  const toggleMenu = () => {
    if (props.disabled || state().isExporting) return;
    state.set({
      ...state(),
      isOpen: !state().isOpen,
    });
  };

  const closeMenu = () => {
    state.set({
      ...state(),
      isOpen: false,
    });
  };

  const handleExport = async (formatConfig: ExportFormatConfig) => {
    if (state().isExporting || formatConfig.disabled) return;

    closeMenu();

    state.set({
      ...state(),
      isExporting: true,
      currentFormat: formatConfig.format,
      progress: 0,
      error: null,
    });

    props.onExportStart?.(formatConfig.format);

    try {
      // Get data (supports function, async function, or direct value)
      const data = typeof props.data === 'function'
        ? await (props.data as () => T | Promise<T>)()
        : props.data;

      // Dynamic import to avoid circular dependencies
      const { useExport } = await import('../hooks.js');
      const exporter = useExport();

      const mergedOptions: ExportOptions = {
        ...props.options,
        ...formatConfig.options,
        onProgress: (progress) => {
          state.set({
            ...state(),
            progress: progress * 100,
          });
        },
      };

      const blob = await exporter.exportData(data, formatConfig.format, mergedOptions);

      state.set({
        ...state(),
        isExporting: false,
        currentFormat: null,
        progress: 100,
        error: null,
      });

      if (blob) {
        props.onExportComplete?.(formatConfig.format, blob);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      state.set({
        ...state(),
        isExporting: false,
        currentFormat: null,
        progress: 0,
        error: err,
      });
      props.onExportError?.(formatConfig.format, err);
    }
  };

  const currentState = state();
  const label = props.label || 'Export';

  return {
    type: 'div',
    props: {
      className: `export-menu ${props.className || ''}`.trim(),
      'data-testid': props.testID,
      style: {
        position: 'relative',
        display: 'inline-block',
      },
    },
    children: [
      // Trigger button
      {
        type: 'button',
        props: {
          className: 'export-menu-trigger',
          disabled: props.disabled || currentState.isExporting,
          'aria-haspopup': 'menu',
          'aria-expanded': currentState.isOpen,
          onClick: toggleMenu,
          style: {
            cursor: props.disabled || currentState.isExporting ? 'not-allowed' : 'pointer',
            opacity: props.disabled ? 0.5 : 1,
          },
        },
        children: currentState.isExporting
          ? `Exporting ${currentState.currentFormat}... ${Math.round(currentState.progress)}%`
          : label,
      },
      // Dropdown menu
      currentState.isOpen && {
        type: 'div',
        props: {
          className: 'export-menu-dropdown',
          role: 'menu',
          style: {
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1000,
            minWidth: '150px',
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            marginTop: '4px',
          },
        },
        children: formats.map((formatConfig) => ({
          type: 'button',
          props: {
            className: 'export-menu-item',
            role: 'menuitem',
            disabled: formatConfig.disabled,
            onClick: () => handleExport(formatConfig),
            style: {
              display: 'block',
              width: '100%',
              padding: '8px 16px',
              textAlign: 'left',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: formatConfig.disabled ? 'not-allowed' : 'pointer',
              opacity: formatConfig.disabled ? 0.5 : 1,
            },
          },
          children: formatConfig.label,
        })),
      },
    ].filter(Boolean),
  };
}

/**
 * Create ExportMenu state for external access
 */
export function createExportMenuState(): {
  state: () => ExportMenuState;
  reset: () => void;
} {
  const state = signal<ExportMenuState>({
    isOpen: false,
    isExporting: false,
    currentFormat: null,
    progress: 0,
    error: null,
  });

  return {
    state: () => state(),
    reset: () => state.set({
      isOpen: false,
      isExporting: false,
      currentFormat: null,
      progress: 0,
      error: null,
    }),
  };
}

export default ExportMenu;
