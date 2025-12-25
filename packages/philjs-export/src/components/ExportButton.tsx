/**
 * Export Button Component
 * A dropdown button for triggering exports in various formats
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

export type ExportFormat = 'csv' | 'excel' | 'json' | 'xml' | 'yaml' | 'pdf' | 'image';

export interface ExportButtonProps<T = Record<string, unknown>> {
  /** Data to export */
  data: T[] | (() => T[] | Promise<T[]>);
  /** File name (without extension) */
  fileName?: string;
  /** Available formats */
  formats?: ExportFormat[];
  /** Default format */
  defaultFormat?: ExportFormat;
  /** Export handler */
  onExport?: (format: ExportFormat, data: T[]) => void | Promise<void>;
  /** Progress handler */
  onProgress?: (progress: number) => void;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Success handler */
  onSuccess?: (format: ExportFormat) => void;
  /** Custom export options per format */
  formatOptions?: Partial<Record<ExportFormat, Record<string, unknown>>>;
  /** Button label */
  label?: string;
  /** Button class name */
  className?: string;
  /** Button style */
  style?: React.CSSProperties;
  /** Disabled state */
  disabled?: boolean;
  /** Loading indicator */
  showLoading?: boolean;
  /** Dropdown position */
  dropdownPosition?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  /** Custom button renderer */
  renderButton?: (props: {
    onClick: () => void;
    isOpen: boolean;
    isLoading: boolean;
    disabled: boolean;
  }) => React.ReactNode;
  /** Custom dropdown renderer */
  renderDropdown?: (props: {
    formats: ExportFormat[];
    onSelect: (format: ExportFormat) => void;
    onClose: () => void;
  }) => React.ReactNode;
  /** Children for custom content */
  children?: React.ReactNode;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV',
  excel: 'Excel (.xlsx)',
  json: 'JSON',
  xml: 'XML',
  yaml: 'YAML',
  pdf: 'PDF',
  image: 'Image',
};

const FORMAT_ICONS: Record<ExportFormat, string> = {
  csv: '\u{1F4C4}', // Page icon
  excel: '\u{1F4CA}', // Chart icon
  json: '\u{1F4CB}', // Clipboard icon
  xml: '\u{1F4C3}', // Page with curl
  yaml: '\u{1F4DD}', // Memo icon
  pdf: '\u{1F4D5}', // Book icon
  image: '\u{1F5BC}', // Picture frame
};

export function ExportButton<T extends Record<string, unknown>>({
  data,
  fileName = 'export',
  formats = ['csv', 'excel', 'json'],
  defaultFormat,
  onExport,
  onProgress,
  onError,
  onSuccess,
  formatOptions = {},
  label = 'Export',
  className = '',
  style,
  disabled = false,
  showLoading = true,
  dropdownPosition = 'bottom-left',
  renderButton,
  renderDropdown,
  children,
}: ExportButtonProps<T>): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setIsOpen(false);
      setIsLoading(true);
      setProgress(0);

      try {
        // Get data
        const exportData = typeof data === 'function' ? await data() : data;

        if (onExport) {
          await onExport(format, exportData);
        } else {
          // Default export behavior using dynamic imports
          const { downloadFile, exportToCSV, exportToExcel, exportToJSON, exportToXML, exportToPDF } = await import('../index');

          const options = formatOptions[format] || {};

          switch (format) {
            case 'csv':
              const csvContent = await exportToCSV(exportData, {
                ...options,
                onProgress: (p) => {
                  setProgress(p);
                  onProgress?.(p);
                },
              });
              downloadFile(csvContent, `${fileName}.csv`, 'text/csv');
              break;

            case 'excel':
              const excelBlob = await exportToExcel(exportData, {
                sheetName: 'Data',
                ...options,
                onProgress: (p) => {
                  setProgress(p);
                  onProgress?.(p);
                },
              });
              downloadFile(excelBlob, `${fileName}.xlsx`);
              break;

            case 'json':
              const jsonContent = await exportToJSON(exportData, options);
              downloadFile(jsonContent, `${fileName}.json`, 'application/json');
              break;

            case 'xml':
              const xmlContent = await exportToXML(exportData, options);
              downloadFile(xmlContent, `${fileName}.xml`, 'application/xml');
              break;

            case 'yaml':
              const { toYAML, createYAMLBlob } = await import('../formats/yaml');
              const yamlContent = toYAML(exportData, options);
              const yamlBlob = createYAMLBlob(yamlContent);
              downloadFile(yamlBlob, `${fileName}.yaml`);
              break;

            case 'pdf':
              const pdfBlob = await exportToPDF(exportData, {
                title: fileName,
                ...options,
              });
              downloadFile(pdfBlob, `${fileName}.pdf`);
              break;

            case 'image':
              // Image export requires a canvas element
              console.warn('Image export requires a canvas element. Use exportToImage directly.');
              break;
          }
        }

        setProgress(1);
        onSuccess?.(format);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        console.error('Export failed:', err);
      } finally {
        setIsLoading(false);
        setProgress(0);
      }
    },
    [data, fileName, formatOptions, onExport, onProgress, onError, onSuccess]
  );

  const toggleDropdown = useCallback(() => {
    if (!disabled && !isLoading) {
      setIsOpen(prev => !prev);
    }
  }, [disabled, isLoading]);

  const handleFormatSelect = useCallback(
    (format: ExportFormat) => {
      handleExport(format);
    },
    [handleExport]
  );

  // If only one format, export directly on click
  const handleButtonClick = useCallback(() => {
    if (formats.length === 1 || defaultFormat) {
      handleExport(defaultFormat || formats[0]);
    } else {
      toggleDropdown();
    }
  }, [formats, defaultFormat, handleExport, toggleDropdown]);

  // Custom button renderer
  if (renderButton) {
    return (
      <div className={`philjs-export ${className}`} style={style}>
        {renderButton({
          onClick: handleButtonClick,
          isOpen,
          isLoading,
          disabled,
        })}
        {isOpen && renderDropdown && (
          <div ref={dropdownRef}>
            {renderDropdown({
              formats,
              onSelect: handleFormatSelect,
              onClose: () => setIsOpen(false),
            })}
          </div>
        )}
      </div>
    );
  }

  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-left': { top: '100%', left: 0 },
    'bottom-right': { top: '100%', right: 0 },
    'top-left': { bottom: '100%', left: 0 },
    'top-right': { bottom: '100%', right: 0 },
  };

  return (
    <div
      className={`philjs-export ${className}`}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || isLoading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          padding: '8px 16px',
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {showLoading && isLoading ? (
          <>
            <span
              style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            {Math.round(progress * 100)}%
          </>
        ) : (
          <>
            {children || label}
            {formats.length > 1 && !defaultFormat && (
              <span style={{ marginLeft: '4px' }}>{isOpen ? '\u25B2' : '\u25BC'}</span>
            )}
          </>
        )}
      </button>

      {isOpen && formats.length > 1 && (
        <div
          ref={dropdownRef}
          role="listbox"
          style={{
            position: 'absolute',
            ...positionStyles[dropdownPosition],
            minWidth: '150px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            marginTop: dropdownPosition.startsWith('bottom') ? '4px' : undefined,
            marginBottom: dropdownPosition.startsWith('top') ? '4px' : undefined,
          }}
        >
          {renderDropdown ? (
            renderDropdown({
              formats,
              onSelect: handleFormatSelect,
              onClose: () => setIsOpen(false),
            })
          ) : (
            formats.map(format => (
              <button
                key={format}
                type="button"
                role="option"
                onClick={() => handleFormatSelect(format)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                <span>{FORMAT_ICONS[format]}</span>
                <span>{FORMAT_LABELS[format]}</span>
              </button>
            ))
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default ExportButton;
