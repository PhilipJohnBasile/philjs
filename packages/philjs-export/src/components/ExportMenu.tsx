/**
 * Export Menu Component
 * A menu component for selecting export formats with preview and options
 */

import React, { useState, useCallback } from 'react';
import type { ExportFormat } from './ExportButton';

export interface ExportMenuProps<T = Record<string, unknown>> {
  /** Data to export */
  data: T[] | (() => T[] | Promise<T[]>);
  /** File name (without extension) */
  fileName?: string;
  /** Available formats */
  formats?: ExportFormat[];
  /** Export handler */
  onExport?: (format: ExportFormat, options: Record<string, unknown>) => void | Promise<void>;
  /** Close handler */
  onClose?: () => void;
  /** Progress handler */
  onProgress?: (progress: number) => void;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Success handler */
  onSuccess?: (format: ExportFormat) => void;
  /** Show preview */
  showPreview?: boolean;
  /** Preview row count */
  previewRows?: number;
  /** Allow format options */
  showOptions?: boolean;
  /** Class name */
  className?: string;
  /** Style */
  style?: React.CSSProperties;
  /** Custom format renderer */
  renderFormat?: (props: {
    format: ExportFormat;
    isSelected: boolean;
    onSelect: () => void;
  }) => React.ReactNode;
  /** Custom options renderer per format */
  renderOptions?: Partial<
    Record<ExportFormat, (props: { options: Record<string, unknown>; onChange: (options: Record<string, unknown>) => void }) => React.ReactNode>
  >;
}

interface FormatInfo {
  label: string;
  description: string;
  extension: string;
  icon: string;
}

const FORMAT_INFO: Record<ExportFormat, FormatInfo> = {
  csv: {
    label: 'CSV',
    description: 'Comma-separated values, compatible with spreadsheet applications',
    extension: '.csv',
    icon: '\u{1F4C4}',
  },
  excel: {
    label: 'Excel',
    description: 'Microsoft Excel format with formatting support',
    extension: '.xlsx',
    icon: '\u{1F4CA}',
  },
  json: {
    label: 'JSON',
    description: 'JavaScript Object Notation, ideal for web applications',
    extension: '.json',
    icon: '\u{1F4CB}',
  },
  xml: {
    label: 'XML',
    description: 'Extensible Markup Language for structured data',
    extension: '.xml',
    icon: '\u{1F4C3}',
  },
  yaml: {
    label: 'YAML',
    description: 'Human-readable data serialization format',
    extension: '.yaml',
    icon: '\u{1F4DD}',
  },
  pdf: {
    label: 'PDF',
    description: 'Portable Document Format for printing and sharing',
    extension: '.pdf',
    icon: '\u{1F4D5}',
  },
  image: {
    label: 'Image',
    description: 'Export as PNG or JPEG image',
    extension: '.png',
    icon: '\u{1F5BC}',
  },
};

interface CSVOptionsState {
  delimiter: string;
  includeHeader: boolean;
  [key: string]: unknown;
}

interface ExcelOptionsState {
  sheetName: string;
  autoFilter: boolean;
  freezeHeader: boolean;
  [key: string]: unknown;
}

interface JSONOptionsState {
  pretty: boolean;
  indent: number;
  [key: string]: unknown;
}

interface XMLOptionsState {
  rootElement: string;
  itemElement: string;
  declaration: boolean;
  [key: string]: unknown;
}

type FormatOptionsState = CSVOptionsState | ExcelOptionsState | JSONOptionsState | XMLOptionsState | Record<string, unknown>;

export function ExportMenu<T extends Record<string, unknown>>({
  data,
  fileName = 'export',
  formats = ['csv', 'excel', 'json', 'xml', 'yaml', 'pdf'],
  onExport,
  onClose,
  onProgress,
  onError,
  onSuccess,
  showPreview = true,
  previewRows = 5,
  showOptions = true,
  className = '',
  style,
  renderFormat,
  renderOptions,
}: ExportMenuProps<T>): React.ReactElement {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(formats[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formatOptions, setFormatOptions] = useState<Record<ExportFormat, FormatOptionsState>>({
    csv: { delimiter: ',', includeHeader: true },
    excel: { sheetName: 'Sheet1', autoFilter: true, freezeHeader: true },
    json: { pretty: true, indent: 2 },
    xml: { rootElement: 'items', itemElement: 'item', declaration: true },
    yaml: {},
    pdf: {},
    image: {},
  });

  const [previewData, setPreviewData] = useState<T[] | null>(null);

  // Load preview data
  React.useEffect(() => {
    const loadPreview = async () => {
      if (!showPreview) return;

      try {
        const exportData = typeof data === 'function' ? await data() : data;
        setPreviewData(exportData.slice(0, previewRows));
      } catch (error) {
        console.error('Failed to load preview:', error);
      }
    };

    loadPreview();
  }, [data, showPreview, previewRows]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      const exportData = typeof data === 'function' ? await data() : data;
      const options = formatOptions[selectedFormat];

      if (onExport) {
        await onExport(selectedFormat, options);
      } else {
        // Default export behavior
        const { downloadFile, exportToCSV, exportToExcel, exportToJSON, exportToXML, exportToPDF } = await import('../index');

        const progressHandler = (p: number) => {
          setProgress(p);
          onProgress?.(p);
        };

        switch (selectedFormat) {
          case 'csv':
            const csvContent = await exportToCSV(exportData, {
              ...options,
              onProgress: progressHandler,
            });
            downloadFile(csvContent, `${fileName}.csv`, 'text/csv');
            break;

          case 'excel':
            const excelBlob = await exportToExcel(exportData, {
              ...options,
              onProgress: progressHandler,
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
            const yamlContent = toYAML(exportData, options as Record<string, unknown>);
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
        }
      }

      setProgress(1);
      onSuccess?.(selectedFormat);
      onClose?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [data, fileName, selectedFormat, formatOptions, onExport, onProgress, onError, onSuccess, onClose]);

  const updateFormatOptions = useCallback(
    (format: ExportFormat, options: Record<string, unknown>) => {
      setFormatOptions(prev => ({
        ...prev,
        [format]: { ...prev[format], ...options },
      }));
    },
    []
  );

  const renderDefaultOptions = (format: ExportFormat) => {
    const options = formatOptions[format];

    switch (format) {
      case 'csv':
        const csvOpts = options as CSVOptionsState;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Delimiter:</span>
              <select
                value={csvOpts.delimiter}
                onChange={e => updateFormatOptions(format, { delimiter: e.target.value })}
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={csvOpts.includeHeader}
                onChange={e => updateFormatOptions(format, { includeHeader: e.target.checked })}
              />
              <span>Include header row</span>
            </label>
          </div>
        );

      case 'excel':
        const excelOpts = options as ExcelOptionsState;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Sheet name:</span>
              <input
                type="text"
                value={excelOpts.sheetName}
                onChange={e => updateFormatOptions(format, { sheetName: e.target.value })}
                style={{ flex: 1 }}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={excelOpts.autoFilter}
                onChange={e => updateFormatOptions(format, { autoFilter: e.target.checked })}
              />
              <span>Enable auto-filter</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={excelOpts.freezeHeader}
                onChange={e => updateFormatOptions(format, { freezeHeader: e.target.checked })}
              />
              <span>Freeze header row</span>
            </label>
          </div>
        );

      case 'json':
        const jsonOpts = options as JSONOptionsState;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={jsonOpts.pretty}
                onChange={e => updateFormatOptions(format, { pretty: e.target.checked })}
              />
              <span>Pretty print</span>
            </label>
            {jsonOpts.pretty && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Indent:</span>
                <input
                  type="number"
                  value={jsonOpts.indent}
                  onChange={e => updateFormatOptions(format, { indent: parseInt(e.target.value) || 2 })}
                  min={1}
                  max={8}
                  style={{ width: '60px' }}
                />
              </label>
            )}
          </div>
        );

      case 'xml':
        const xmlOpts = options as XMLOptionsState;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Root element:</span>
              <input
                type="text"
                value={xmlOpts.rootElement}
                onChange={e => updateFormatOptions(format, { rootElement: e.target.value })}
                style={{ flex: 1 }}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Item element:</span>
              <input
                type="text"
                value={xmlOpts.itemElement}
                onChange={e => updateFormatOptions(format, { itemElement: e.target.value })}
                style={{ flex: 1 }}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={xmlOpts.declaration}
                onChange={e => updateFormatOptions(format, { declaration: e.target.checked })}
              />
              <span>Include XML declaration</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`philjs-export-menu ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxWidth: '500px',
        ...style,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>Export Data</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#666',
            }}
          >
            &times;
          </button>
        )}
      </div>

      {/* Format selection */}
      <div>
        <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
          Select format:
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '8px',
          }}
        >
          {formats.map(format => {
            const info = FORMAT_INFO[format];
            const isSelected = selectedFormat === format;

            if (renderFormat) {
              return (
                <React.Fragment key={format}>
                  {renderFormat({
                    format,
                    isSelected,
                    onSelect: () => setSelectedFormat(format),
                  })}
                </React.Fragment>
              );
            }

            return (
              <button
                key={format}
                type="button"
                onClick={() => setSelectedFormat(format)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '12px',
                  border: isSelected ? '2px solid #007bff' : '1px solid #ddd',
                  borderRadius: '8px',
                  background: isSelected ? '#f0f7ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '24px' }}>{info.icon}</span>
                <span style={{ fontWeight: 'bold' }}>{info.label}</span>
                <span style={{ fontSize: '11px', color: '#666' }}>{info.extension}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format description */}
      <div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '14px' }}>
        {FORMAT_INFO[selectedFormat].description}
      </div>

      {/* Format options */}
      {showOptions && (
        <div>
          <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
            Options:
          </label>
          {renderOptions?.[selectedFormat]?.({
            options: formatOptions[selectedFormat],
            onChange: opts => updateFormatOptions(selectedFormat, opts),
          }) || renderDefaultOptions(selectedFormat)}
        </div>
      )}

      {/* Preview */}
      {showPreview && previewData && previewData.length > 0 && (
        <div>
          <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
            Preview (first {previewData.length} rows):
          </label>
          <div
            style={{
              maxHeight: '150px',
              overflow: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  {Object.keys(previewData[0]).map(key => (
                    <th key={key} style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((value, j) => (
                      <td key={j} style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>
                        {String(value ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export button */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            background: '#007bff',
            color: 'white',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            opacity: isExporting ? 0.7 : 1,
          }}
        >
          {isExporting ? `Exporting... ${Math.round(progress * 100)}%` : `Export as ${FORMAT_INFO[selectedFormat].label}`}
        </button>
      </div>

      {/* Progress bar */}
      {isExporting && (
        <div style={{ backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden', height: '4px' }}>
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              backgroundColor: '#007bff',
              transition: 'width 0.3s',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
