/**
 * VisualBuilder - Main Visual Builder Application Component
 *
 * Provides a complete drag-and-drop visual component builder with:
 * - Component palette sidebar
 * - Canvas with drag-and-drop support
 * - Property inspector panel
 * - Live preview pane
 * - Code export functionality
 * - Template system integration
 */

import { signal, memo, effect, batch } from 'philjs-core';
import { createBuilderStore, type BuilderStore } from '../state/store.js';
import { Canvas } from '../canvas/Canvas.js';
import { DragDropContext, DragPreview } from '../canvas/DragDrop.js';
import { Palette } from '../components/Palette.js';
import { PropertyPanel } from '../components/PropertyPanel.js';
import { ComponentTree } from '../components/ComponentTree.js';
import { ResponsivePreview, createResponsiveController, type DevicePreset } from '../preview/ResponsivePreview.js';
import { generateCode, type CodeGeneratorOptions } from '../serialization/CodeGenerator.js';
import { createTemplateManager, applyTemplate, type Template, type TemplateManager } from '../serialization/TemplateSystem.js';
import { registerBuiltInComponents, allComponents } from '../components/ComponentLibrary.js';
import type { NodeId, ComponentNode, ViewportMode } from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface VisualBuilderProps {
  /** Initial store to use (creates a new one if not provided) */
  store?: BuilderStore;
  /** Callback when the design changes */
  onChange?: (nodes: Record<NodeId, ComponentNode>, rootId: NodeId) => void;
  /** Callback when code is exported */
  onExport?: (code: string, format: string) => void;
  /** Initial template to load */
  initialTemplate?: Template;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: Record<string, string | number>;
  /** Show header toolbar */
  showHeader?: boolean;
  /** Show left panel (palette/layers) */
  showLeftPanel?: boolean;
  /** Show right panel (properties) */
  showRightPanel?: boolean;
  /** Show preview pane */
  showPreview?: boolean;
  /** Default left panel tab */
  defaultLeftTab?: 'components' | 'layers' | 'templates';
  /** Theme mode */
  theme?: 'light' | 'dark' | 'system';
}

export interface BuilderUIState {
  leftPanelTab: 'components' | 'layers' | 'templates';
  leftPanelWidth: number;
  rightPanelWidth: number;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  showPreview: boolean;
  showCodeExport: boolean;
  previewSplit: 'horizontal' | 'vertical' | 'none';
  codeExportFormat: 'tsx' | 'jsx' | 'philjs';
  isDarkMode: boolean;
}

// ============================================================================
// Default Values
// ============================================================================

const defaultUIState: BuilderUIState = {
  leftPanelTab: 'components',
  leftPanelWidth: 280,
  rightPanelWidth: 320,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  showPreview: false,
  showCodeExport: false,
  previewSplit: 'none',
  codeExportFormat: 'tsx',
  isDarkMode: false,
};

// ============================================================================
// Header Toolbar Component
// ============================================================================

interface HeaderToolbarProps {
  store: BuilderStore;
  uiState: ReturnType<typeof signal<BuilderUIState>>;
  templateManager: TemplateManager;
  onExport?: (code: string, format: string) => void;
}

function HeaderToolbar({ store, uiState, templateManager, onExport }: HeaderToolbarProps) {
  const handleUndo = () => store.dispatch({ type: 'UNDO' });
  const handleRedo = () => store.dispatch({ type: 'REDO' });

  const handlePreviewToggle = () => {
    uiState.set({ ...uiState(), showPreview: !uiState().showPreview });
  };

  const handleCodeExportToggle = () => {
    uiState.set({ ...uiState(), showCodeExport: !uiState().showCodeExport });
  };

  const handleExportCode = () => {
    const nodes = store.nodes();
    const rootId = store.rootId();
    const format = uiState().codeExportFormat;

    const result = generateCode(nodes, rootId, {
      format,
      indent: '  ',
      quotes: 'single',
      semicolons: true,
      componentImports: true,
      styleFormat: 'object',
      signalBindings: true,
      includeComments: false,
      minify: false,
      componentName: 'GeneratedComponent',
      exportType: 'default',
      wrapInFunction: true,
      addPropsInterface: format === 'tsx',
    });

    onExport?.(result.code, format);
  };

  const handleSaveAsTemplate = async () => {
    const nodes = store.nodes();
    const rootId = store.rootId();
    const name = prompt('Enter template name:', 'My Template');

    if (name) {
      await templateManager.saveTemplate({
        name,
        description: 'Custom template',
        category: 'custom',
        tags: ['custom'],
        nodes,
        rootId,
      });
      alert('Template saved!');
    }
  };

  const handleNewDocument = () => {
    if (confirm('Start a new document? Unsaved changes will be lost.')) {
      store.dispatch({ type: 'NEW_DOCUMENT', payload: { name: 'Untitled' } });
    }
  };

  const buttonStyle = {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#f0f0f0',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s ease',
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#0066ff',
    color: '#ffffff',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        height: '48px',
        gap: '16px',
      }}
    >
      {/* Left section - Logo and document */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontWeight: 700, fontSize: '16px', color: '#0066ff' }}>
          PhilJS Builder
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={buttonStyle} onClick={handleNewDocument} title="New Document">
            New
          </button>
        </div>
      </div>

      {/* Center section - Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button style={buttonStyle} onClick={handleUndo} title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button style={buttonStyle} onClick={handleRedo} title="Redo (Ctrl+Shift+Z)">
          Redo
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#e0e0e0', margin: '0 8px' }} />

        <button
          style={uiState().showPreview ? activeButtonStyle : buttonStyle}
          onClick={handlePreviewToggle}
          title="Toggle Preview"
        >
          Preview
        </button>

        <button
          style={uiState().showCodeExport ? activeButtonStyle : buttonStyle}
          onClick={handleCodeExportToggle}
          title="Export Code"
        >
          Export
        </button>
      </div>

      {/* Right section - Export and save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button style={buttonStyle} onClick={handleSaveAsTemplate} title="Save as Template">
          Save Template
        </button>
        <button
          style={{ ...buttonStyle, backgroundColor: '#0066ff', color: '#ffffff' }}
          onClick={handleExportCode}
          title="Export Code"
        >
          Export Code
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Left Panel Component
// ============================================================================

interface LeftPanelProps {
  store: BuilderStore;
  uiState: ReturnType<typeof signal<BuilderUIState>>;
  templateManager: TemplateManager;
}

function LeftPanel({ store, uiState, templateManager }: LeftPanelProps) {
  const state = uiState();
  const { leftPanelTab, leftPanelWidth, leftPanelCollapsed } = state;

  if (leftPanelCollapsed) {
    return (
      <div
        style={{
          width: '40px',
          backgroundColor: '#fafafa',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '8px',
        }}
      >
        <button
          onClick={() => uiState.set({ ...state, leftPanelCollapsed: false })}
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
          }}
          title="Expand Panel"
        >
          {'>'}
        </button>
      </div>
    );
  }

  const tabStyle = (isActive: boolean) => ({
    flex: 1,
    padding: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '11px',
    fontWeight: 500,
    color: isActive ? '#0066ff' : '#666',
    borderBottom: isActive ? '2px solid #0066ff' : '2px solid transparent',
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  });

  return (
    <div
      style={{
        width: leftPanelWidth,
        backgroundColor: '#fafafa',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', backgroundColor: '#ffffff' }}>
        <button
          style={tabStyle(leftPanelTab === 'components')}
          onClick={() => uiState.set({ ...state, leftPanelTab: 'components' })}
        >
          Components
        </button>
        <button
          style={tabStyle(leftPanelTab === 'layers')}
          onClick={() => uiState.set({ ...state, leftPanelTab: 'layers' })}
        >
          Layers
        </button>
        <button
          style={tabStyle(leftPanelTab === 'templates')}
          onClick={() => uiState.set({ ...state, leftPanelTab: 'templates' })}
        >
          Templates
        </button>
        <button
          onClick={() => uiState.set({ ...state, leftPanelCollapsed: true })}
          style={{
            width: '32px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#999',
          }}
          title="Collapse Panel"
        >
          {'<'}
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {leftPanelTab === 'components' && (
          <Palette store={store} searchable collapsible />
        )}
        {leftPanelTab === 'layers' && (
          <ComponentTree
            store={store}
            showIcons
            showVisibilityToggles
            showLockToggles
            collapsible
            draggable
          />
        )}
        {leftPanelTab === 'templates' && (
          <TemplatePanel store={store} templateManager={templateManager} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Template Panel Component
// ============================================================================

interface TemplatePanelProps {
  store: BuilderStore;
  templateManager: TemplateManager;
}

function TemplatePanel({ store, templateManager }: TemplatePanelProps) {
  const searchQuery = signal('');
  const selectedCategory = signal<string | null>(null);

  const filteredTemplates = memo(() => {
    const query = searchQuery().toLowerCase();
    const category = selectedCategory();
    let templates = templateManager.templates();

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (query) {
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return templates;
  });

  const handleApplyTemplate = (template: Template) => {
    const { nodes, rootId } = applyTemplate(template);
    store.dispatch({
      type: 'LOAD_DOCUMENT',
      payload: {
        document: {
          id: `doc_${Date.now()}`,
          name: template.name,
          version: '1.0.0',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        nodes,
        rootId,
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px' }}>
      {/* Search */}
      <input
        type="text"
        placeholder="Search templates..."
        value={searchQuery()}
        onInput={(e) => searchQuery.set((e.target as HTMLInputElement).value)}
        style={{
          padding: '8px 12px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          fontSize: '13px',
          marginBottom: '12px',
        }}
      />

      {/* Categories */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
        <button
          onClick={() => selectedCategory.set(null)}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            border: selectedCategory() === null ? '1px solid #0066ff' : '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: selectedCategory() === null ? '#e6f0ff' : '#fff',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {templateManager.categories().map(cat => (
          <button
            key={cat.id}
            onClick={() => selectedCategory.set(cat.id)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: selectedCategory() === cat.id ? '1px solid #0066ff' : '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: selectedCategory() === cat.id ? '#e6f0ff' : '#fff',
              cursor: 'pointer',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
          {filteredTemplates().map(template => (
            <div
              key={template.id}
              style={{
                padding: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onClick={() => handleApplyTemplate(template)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#0066ff';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#e0e0e0';
              }}
            >
              <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '4px' }}>
                {template.name}
              </div>
              {template.description && (
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                  {template.description}
                </div>
              )}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {template.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '4px',
                      color: '#666',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates().length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
            No templates found
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Right Panel Component
// ============================================================================

interface RightPanelProps {
  store: BuilderStore;
  uiState: ReturnType<typeof signal<BuilderUIState>>;
}

function RightPanel({ store, uiState }: RightPanelProps) {
  const state = uiState();
  const { rightPanelWidth, rightPanelCollapsed } = state;

  if (rightPanelCollapsed) {
    return (
      <div
        style={{
          width: '40px',
          backgroundColor: '#fafafa',
          borderLeft: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '8px',
        }}
      >
        <button
          onClick={() => uiState.set({ ...state, rightPanelCollapsed: false })}
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
          }}
          title="Expand Panel"
        >
          {'<'}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: rightPanelWidth,
        backgroundColor: '#fafafa',
        borderLeft: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#ffffff' }}>
        <button
          onClick={() => uiState.set({ ...state, rightPanelCollapsed: true })}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#999',
          }}
          title="Collapse Panel"
        >
          {'>'}
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PropertyPanel store={store} />
      </div>
    </div>
  );
}

// ============================================================================
// Code Export Panel Component
// ============================================================================

interface CodeExportPanelProps {
  store: BuilderStore;
  uiState: ReturnType<typeof signal<BuilderUIState>>;
  onExport?: (code: string, format: string) => void;
}

function CodeExportPanel({ store, uiState, onExport }: CodeExportPanelProps) {
  const state = uiState();
  const generatedCode = signal('');
  const codeOptions = signal<Partial<CodeGeneratorOptions>>({
    format: state.codeExportFormat,
    indent: '  ',
    quotes: 'single',
    semicolons: true,
    componentImports: true,
    styleFormat: 'object',
    signalBindings: true,
    includeComments: false,
    minify: false,
  });

  // Generate code whenever options or nodes change
  effect(() => {
    const nodes = store.nodes();
    const rootId = store.rootId();
    const options = codeOptions();

    try {
      const result = generateCode(nodes, rootId, {
        ...options,
        componentName: 'GeneratedComponent',
        exportType: 'default',
        wrapInFunction: true,
        addPropsInterface: options.format === 'tsx',
      } as CodeGeneratorOptions);
      generatedCode.set(result.code);
    } catch (e) {
      generatedCode.set(`// Error generating code: ${e}`);
    }
  });

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode());
      alert('Code copied to clipboard!');
    } catch (e) {
      alert('Failed to copy code');
    }
  };

  const handleDownload = () => {
    const options = codeOptions();
    const extension = options.format === 'tsx' ? 'tsx' : options.format === 'jsx' ? 'jsx' : 'js';
    const blob = new Blob([generatedCode()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GeneratedComponent.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '500px',
        height: '100vh',
        backgroundColor: '#ffffff',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Export Code</h3>
        <button
          onClick={() => uiState.set({ ...state, showCodeExport: false })}
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          X
        </button>
      </div>

      {/* Options */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {(['tsx', 'jsx', 'philjs'] as const).map(format => (
            <button
              key={format}
              onClick={() => {
                codeOptions.set({ ...codeOptions(), format });
                uiState.set({ ...state, codeExportFormat: format });
              }}
              style={{
                padding: '6px 16px',
                border: codeOptions().format === format ? '1px solid #0066ff' : '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: codeOptions().format === format ? '#e6f0ff' : '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={codeOptions().componentImports}
              onChange={(e) => codeOptions.set({ ...codeOptions(), componentImports: (e.target as HTMLInputElement).checked })}
            />
            Import components
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={codeOptions().signalBindings}
              onChange={(e) => codeOptions.set({ ...codeOptions(), signalBindings: (e.target as HTMLInputElement).checked })}
            />
            Signal bindings
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={codeOptions().semicolons}
              onChange={(e) => codeOptions.set({ ...codeOptions(), semicolons: (e.target as HTMLInputElement).checked })}
            />
            Semicolons
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={codeOptions().minify}
              onChange={(e) => codeOptions.set({ ...codeOptions(), minify: (e.target as HTMLInputElement).checked })}
            />
            Minify
          </label>
        </div>

        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px' }}>Style Format</label>
          <select
            value={codeOptions().styleFormat}
            onChange={(e) => codeOptions.set({ ...codeOptions(), styleFormat: (e.target as HTMLSelectElement).value as any })}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            <option value="object">Style Object</option>
            <option value="inline">Inline String</option>
            <option value="tailwind">Tailwind Classes</option>
          </select>
        </div>
      </div>

      {/* Code Preview */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <pre
          style={{
            margin: 0,
            padding: '16px',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'Monaco, Consolas, monospace',
            lineHeight: 1.5,
            overflow: 'auto',
            height: '100%',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <code>{generatedCode()}</code>
        </pre>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '16px',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <button
          onClick={handleCopyToClipboard}
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          Copy to Clipboard
        </button>
        <button
          onClick={handleDownload}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#0066ff',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          Download File
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Preview Pane Component
// ============================================================================

interface PreviewPaneProps {
  store: BuilderStore;
  uiState: ReturnType<typeof signal<BuilderUIState>>;
}

function PreviewPane({ store, uiState }: PreviewPaneProps) {
  const responsiveController = createResponsiveController(store);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        borderLeft: '1px solid #e0e0e0',
      }}
    >
      <ResponsivePreview store={store}>
        <CanvasPreviewRenderer store={store} />
      </ResponsivePreview>
    </div>
  );
}

// ============================================================================
// Canvas Preview Renderer
// ============================================================================

interface CanvasPreviewRendererProps {
  store: BuilderStore;
}

function CanvasPreviewRenderer({ store }: CanvasPreviewRendererProps) {
  const nodes = store.nodes;
  const rootId = store.rootId;

  const renderNode = (nodeId: NodeId): any => {
    const currentNodes = nodes();
    const node = currentNodes[nodeId];
    if (!node) return null;

    const cssStyles = nodeStylesToCSS(node.styles);
    const children = node.children.map(renderNode);
    const content = node.type === 'Text' || node.type === 'Heading' || node.type === 'Paragraph'
      ? node.props.content as string
      : null;

    return (
      <div key={nodeId} style={cssStyles}>
        {content || children}
      </div>
    );
  };

  return renderNode(rootId());
}

function nodeStylesToCSS(styles: Record<string, any>): Record<string, string | number> {
  const css: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === null) continue;

    if (typeof value === 'object' && 'value' in value) {
      const unit = value.unit || 'px';
      css[key] = unit === 'none' || unit === 'auto' ? String(value.value) : `${value.value}${unit}`;
    } else {
      css[key] = value;
    }
  }

  return css;
}

// ============================================================================
// Main VisualBuilder Component
// ============================================================================

export function VisualBuilder({
  store: providedStore,
  onChange,
  onExport,
  initialTemplate,
  className,
  style,
  showHeader = true,
  showLeftPanel = true,
  showRightPanel = true,
  showPreview: initialShowPreview = false,
  defaultLeftTab = 'components',
  theme = 'light',
}: VisualBuilderProps) {
  // Create or use provided store
  const store = providedStore || createBuilderStore();

  // Initialize template manager
  const templateManager = createTemplateManager();

  // UI state
  const uiState = signal<BuilderUIState>({
    ...defaultUIState,
    leftPanelTab: defaultLeftTab,
    showPreview: initialShowPreview,
    isDarkMode: theme === 'dark',
  });

  // Register built-in components
  effect(() => {
    registerBuiltInComponents(store.dispatch.bind(store));
  });

  // Apply initial template
  effect(() => {
    if (initialTemplate) {
      const { nodes, rootId } = applyTemplate(initialTemplate);
      store.dispatch({
        type: 'LOAD_DOCUMENT',
        payload: {
          document: {
            id: `doc_${Date.now()}`,
            name: initialTemplate.name,
            version: '1.0.0',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          nodes,
          rootId,
        },
      });
    }
  });

  // Notify changes
  effect(() => {
    const nodes = store.nodes();
    const rootId = store.rootId();
    onChange?.(nodes, rootId);
  });

  const currentUIState = uiState();

  return (
    <DragDropContext store={store}>
      <div
        class={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100%',
          backgroundColor: '#f5f5f5',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          ...style,
        }}
      >
        {/* Header */}
        {showHeader && (
          <HeaderToolbar
            store={store}
            uiState={uiState}
            templateManager={templateManager}
            onExport={onExport}
          />
        )}

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel */}
          {showLeftPanel && (
            <LeftPanel store={store} uiState={uiState} templateManager={templateManager} />
          )}

          {/* Canvas Area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: currentUIState.showPreview && currentUIState.previewSplit === 'horizontal' ? 'column' : 'row',
              overflow: 'hidden',
            }}
          >
            {/* Canvas */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <Canvas
                store={store}
                onNodeClick={(nodeId) => store.dispatch({ type: 'SELECT_NODE', payload: { nodeId } })}
                onNodeDoubleClick={(nodeId) => {
                  // Could open inline editing
                }}
                onCanvasClick={() => store.dispatch({ type: 'DESELECT_ALL' })}
              />
            </div>

            {/* Preview Pane */}
            {currentUIState.showPreview && (
              <PreviewPane store={store} uiState={uiState} />
            )}
          </div>

          {/* Right Panel */}
          {showRightPanel && (
            <RightPanel store={store} uiState={uiState} />
          )}
        </div>

        {/* Code Export Panel */}
        {currentUIState.showCodeExport && (
          <CodeExportPanel store={store} uiState={uiState} onExport={onExport} />
        )}

        {/* Drag Preview */}
        <DragPreview store={store} />
      </div>
    </DragDropContext>
  );
}

export default VisualBuilder;
