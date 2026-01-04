/**
 * Visual Builder component - Main visual builder UI
 */
import type { ComponentNode, NodeId, BuilderState } from '../types.js';
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
/**
 * Main Visual Builder component
 *
 * This is a stub implementation that provides the basic structure
 * for the visual builder UI. It creates a container with panels
 * for the component palette, canvas, and inspector.
 */
export declare function VisualBuilder(props: VisualBuilderProps): HTMLElement;
export default VisualBuilder;
//# sourceMappingURL=VisualBuilder.d.ts.map