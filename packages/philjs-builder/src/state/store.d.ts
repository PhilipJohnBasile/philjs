/**
 * Builder state store using PhilJS signals
 */
import { signal, memo } from 'philjs-core';
import type { BuilderState, BuilderAction, ComponentNode, NodeId, ComponentDefinition, ComponentCategory, SelectionState, DragState, ResizeState, ViewportState, CanvasSettings, DocumentMetadata, BuilderEvents, BuilderEventListener } from '../types.js';
import { type HistoryManager } from './history.js';
/**
 * Generate a unique ID
 */
export declare function generateId(): string;
export interface BuilderStore {
    document: ReturnType<typeof signal<DocumentMetadata>>;
    nodes: ReturnType<typeof signal<Record<NodeId, ComponentNode>>>;
    rootId: ReturnType<typeof signal<NodeId>>;
    selection: ReturnType<typeof signal<SelectionState>>;
    drag: ReturnType<typeof signal<DragState>>;
    resize: ReturnType<typeof signal<ResizeState>>;
    viewport: ReturnType<typeof signal<ViewportState>>;
    canvas: ReturnType<typeof signal<CanvasSettings>>;
    components: ReturnType<typeof signal<Record<string, ComponentDefinition>>>;
    categories: ReturnType<typeof signal<ComponentCategory[]>>;
    ui: ReturnType<typeof signal<BuilderState['ui']>>;
    preview: ReturnType<typeof signal<BuilderState['preview']>>;
    clipboard: ReturnType<typeof signal<ComponentNode[]>>;
    history: HistoryManager;
    selectedNodes: ReturnType<typeof memo<ComponentNode[]>>;
    canUndo: ReturnType<typeof memo<boolean>>;
    canRedo: ReturnType<typeof memo<boolean>>;
    dispatch: (action: BuilderAction) => void;
    getState: () => BuilderState;
    getNode: (id: NodeId) => ComponentNode | undefined;
    getChildren: (id: NodeId) => ComponentNode[];
    getParent: (id: NodeId) => ComponentNode | undefined;
    getAncestors: (id: NodeId) => ComponentNode[];
    getDescendants: (id: NodeId) => ComponentNode[];
    on: <K extends keyof BuilderEvents>(event: K, listener: BuilderEventListener<K>) => () => void;
    emit: <K extends keyof BuilderEvents>(event: K, payload: BuilderEvents[K]) => void;
    dispose: () => void;
}
/**
 * Create a new builder store
 */
export declare function createBuilderStore(initialState?: Partial<BuilderState>): BuilderStore;
/**
 * Get the default builder store instance
 */
export declare function getBuilderStore(): BuilderStore;
/**
 * Reset the default builder store
 */
export declare function resetBuilderStore(): void;
//# sourceMappingURL=store.d.ts.map