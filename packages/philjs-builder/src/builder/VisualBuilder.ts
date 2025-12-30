/**
 * Visual Builder component - Main visual builder UI
 */

import type { ComponentNode, NodeId, BuilderState } from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface BuilderUIState {
  leftPanelWidth: number;
  rightPanelWidth: number;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  activeTab: 'layers' | 'components' | 'assets';
  inspectorTab: 'props' | 'styles' | 'events' | 'advanced';
}

export interface VisualBuilderProps {
  /**
   * Initial nodes to load
   */
  nodes?: Record<NodeId, ComponentNode>;

  /**
   * Root node ID
   */
  rootId?: NodeId;

  /**
   * Initial builder state
   */
  initialState?: Partial<BuilderState>;

  /**
   * Callback when nodes change
   */
  onNodesChange?: (nodes: Record<NodeId, ComponentNode>) => void;

  /**
   * Callback when selection changes
   */
  onSelectionChange?: (selectedIds: NodeId[]) => void;

  /**
   * Callback when document is saved
   */
  onSave?: (state: BuilderState) => void;

  /**
   * Callback when document is loaded
   */
  onLoad?: (state: BuilderState) => void;

  /**
   * Whether to show the component palette
   */
  showPalette?: boolean;

  /**
   * Whether to show the inspector panel
   */
  showInspector?: boolean;

  /**
   * Whether to show the layers panel
   */
  showLayers?: boolean;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Theme mode
   */
  theme?: 'light' | 'dark' | 'auto';
}

// ============================================================================
// Visual Builder Component
// ============================================================================

/**
 * Main Visual Builder component
 *
 * This is a stub implementation that provides the basic structure
 * for the visual builder UI. It creates a container with panels
 * for the component palette, canvas, and inspector.
 */
export function VisualBuilder(props: VisualBuilderProps): HTMLElement {
  const {
    className = '',
    showPalette = true,
    showInspector = true,
    showLayers = true,
    theme = 'auto',
  } = props;

  const container = document.createElement('div');
  container.className = `philjs-visual-builder ${className}`.trim();
  container.dataset['theme'] = theme;

  // Create main layout structure
  const layout = document.createElement('div');
  layout.className = 'philjs-builder-layout';

  // Left panel (component palette and layers)
  if (showPalette || showLayers) {
    const leftPanel = document.createElement('div');
    leftPanel.className = 'philjs-builder-panel philjs-builder-panel-left';
    layout.appendChild(leftPanel);
  }

  // Center (canvas)
  const centerPanel = document.createElement('div');
  centerPanel.className = 'philjs-builder-canvas-container';
  layout.appendChild(centerPanel);

  // Right panel (inspector)
  if (showInspector) {
    const rightPanel = document.createElement('div');
    rightPanel.className = 'philjs-builder-panel philjs-builder-panel-right';
    layout.appendChild(rightPanel);
  }

  container.appendChild(layout);

  return container;
}

export default VisualBuilder;
