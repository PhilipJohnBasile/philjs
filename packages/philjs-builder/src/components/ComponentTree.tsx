// @ts-nocheck
/**
 * Component Tree View for hierarchical navigation
 * Displays the component hierarchy and allows selection, reordering, and editing
 */

import { signal, memo, effect, batch } from 'philjs-core';
import type { BuilderStore } from '../state/store.js';
import type {
  NodeId,
  ComponentNode,
  ComponentDefinition,
} from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface ComponentTreeProps {
  store: BuilderStore;
  className?: string;
  style?: Record<string, string | number>;
  onNodeSelect?: (nodeId: NodeId) => void;
  onNodeDoubleClick?: (nodeId: NodeId) => void;
  showIcons?: boolean;
  showVisibilityToggles?: boolean;
  showLockToggles?: boolean;
  collapsible?: boolean;
  draggable?: boolean;
}

export interface TreeNodeProps {
  store: BuilderStore;
  nodeId: NodeId;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isDragging: boolean;
  dropPosition: 'before' | 'inside' | 'after' | null;
  onToggle: () => void;
  onSelect: () => void;
  onDoubleClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (position: 'before' | 'inside' | 'after') => void;
  onDragLeave: () => void;
  onDrop: () => void;
  showIcons: boolean;
  showVisibilityToggle: boolean;
  showLockToggle: boolean;
}

export interface TreeState {
  expandedNodes: Set<NodeId>;
  editingNodeId: NodeId | null;
  draggedNodeId: NodeId | null;
  dropTargetId: NodeId | null;
  dropPosition: 'before' | 'inside' | 'after' | null;
}

// ============================================================================
// Component Icons
// ============================================================================

const componentIcons: Record<string, string> = {
  // Layout
  Frame: 'L',
  Container: 'C',
  Flex: 'F',
  Grid: 'G',
  Stack: 'S',
  HStack: 'H',
  Center: '+',
  Spacer: '-',
  AspectRatio: 'A',

  // Typography
  Text: 'T',
  Heading: 'H',
  Paragraph: 'P',
  Code: '<>',
  Quote: '"',
  Label: 'L',

  // Forms
  Form: 'F',
  FormField: 'FF',
  Button: 'B',
  Input: 'I',
  Textarea: 'TA',
  Checkbox: '[]',
  Radio: '()',
  Select: 'V',
  Switch: 'O',
  Slider: '--',

  // Media
  Image: 'IM',
  Video: '>',
  Icon: '*',
  Avatar: '@',
  Iframe: 'IF',

  // Data Display
  Card: 'C',
  Badge: 'B',
  Divider: '--',
  List: 'UL',
  ListItem: 'LI',
  Table: 'TT',

  // Navigation
  Link: 'LK',
  Nav: 'N',
  NavItem: 'NI',
  Menu: 'M',

  // Feedback
  Alert: '!',
  Progress: '%',
  Spinner: 'O',
  Tooltip: 'TP',

  // Overlay
  Modal: 'M',
  Drawer: 'D',
  Popover: 'PO',
};

function getComponentIcon(type: string): string {
  return componentIcons[type] || type.charAt(0).toUpperCase();
}

// ============================================================================
// Tree Node Component
// ============================================================================

function TreeNode({
  store,
  nodeId,
  depth,
  isExpanded,
  isSelected,
  isHovered,
  isDragging,
  dropPosition,
  onToggle,
  onSelect,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  showIcons,
  showVisibilityToggle,
  showLockToggle,
}: TreeNodeProps) {
  const nodes = store.nodes;
  const node = nodes()[nodeId];

  if (!node) return null;

  const hasChildren = node.children.length > 0;
  const isLocked = node.isLocked || false;
  const isHidden = node.isHidden || false;
  const isRoot = nodeId === store.rootId();

  const handleVisibilityToggle = (e: MouseEvent) => {
    e.stopPropagation();
    const currentNodes = nodes();
    store.nodes.set({
      ...currentNodes,
      [nodeId]: { ...node, isHidden: !isHidden },
    });
  };

  const handleLockToggle = (e: MouseEvent) => {
    e.stopPropagation();
    const currentNodes = nodes();
    store.nodes.set({
      ...currentNodes,
      [nodeId]: { ...node, isLocked: !isLocked },
    });
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    if (y < height * 0.25) {
      onDragOver('before');
    } else if (y > height * 0.75) {
      onDragOver('after');
    } else {
      onDragOver('inside');
    }
  };

  // Styles
  const containerStyle: Record<string, any> = {
    position: 'relative',
  };

  const rowStyle: Record<string, any> = {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    paddingLeft: `${12 + depth * 16}px`,
    cursor: isLocked ? 'default' : 'pointer',
    backgroundColor: isSelected ? '#e6f0ff' : isHovered ? '#f5f5f5' : 'transparent',
    borderRadius: '4px',
    margin: '1px 4px',
    opacity: isHidden ? 0.5 : isDragging ? 0.5 : 1,
    transition: 'background-color 0.1s ease, opacity 0.1s ease',
    userSelect: 'none',
  };

  // Drop indicator styles
  if (dropPosition === 'before') {
    containerStyle.borderTop = '2px solid #0066ff';
    containerStyle.marginTop = '-2px';
  } else if (dropPosition === 'after') {
    containerStyle.borderBottom = '2px solid #0066ff';
    containerStyle.marginBottom = '-2px';
  } else if (dropPosition === 'inside') {
    rowStyle.outline = '2px dashed #0066ff';
    rowStyle.outlineOffset = '-2px';
  }

  return (
    <div style={containerStyle}>
      <div
        style={rowStyle}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        draggable={!isLocked && !isRoot}
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart();
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          onDragEnd();
        }}
        onDragOver={handleDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDrop();
        }}
      >
        {/* Expand/Collapse toggle */}
        <span
          style={{
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#666',
            cursor: hasChildren ? 'pointer' : 'default',
            marginRight: '4px',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle();
          }}
        >
          {hasChildren ? '>' : ''}
        </span>

        {/* Component icon */}
        {showIcons && (
          <span
            style={{
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              fontWeight: 600,
              backgroundColor: isSelected ? '#0066ff' : '#e0e0e0',
              color: isSelected ? '#fff' : '#666',
              borderRadius: '3px',
              marginRight: '8px',
            }}
          >
            {getComponentIcon(node.type)}
          </span>
        )}

        {/* Node name */}
        <span
          style={{
            flex: 1,
            fontSize: '12px',
            color: isSelected ? '#0066ff' : '#333',
            fontWeight: isSelected ? 500 : 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {node.name || node.type}
          {isRoot && (
            <span style={{ marginLeft: '4px', fontSize: '10px', color: '#999' }}>
              (root)
            </span>
          )}
        </span>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
          {/* Visibility toggle */}
          {showVisibilityToggle && !isRoot && (
            <button
              onClick={handleVisibilityToggle}
              style={{
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '11px',
                color: isHidden ? '#999' : '#666',
                opacity: isHovered || isSelected ? 1 : 0,
                transition: 'opacity 0.1s ease',
              }}
              title={isHidden ? 'Show' : 'Hide'}
            >
              {isHidden ? 'H' : 'V'}
            </button>
          )}

          {/* Lock toggle */}
          {showLockToggle && !isRoot && (
            <button
              onClick={handleLockToggle}
              style={{
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '11px',
                color: isLocked ? '#f59e0b' : '#666',
                opacity: isHovered || isSelected || isLocked ? 1 : 0,
                transition: 'opacity 0.1s ease',
              }}
              title={isLocked ? 'Unlock' : 'Lock'}
            >
              {isLocked ? 'L' : 'U'}
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(childId => (
            <TreeNodeWrapper
              key={childId}
              store={store}
              nodeId={childId}
              depth={depth + 1}
              showIcons={showIcons}
              showVisibilityToggle={showVisibilityToggle}
              showLockToggle={showLockToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tree Node Wrapper (with state management)
// ============================================================================

interface TreeNodeWrapperProps {
  store: BuilderStore;
  nodeId: NodeId;
  depth: number;
  showIcons: boolean;
  showVisibilityToggle: boolean;
  showLockToggle: boolean;
}

function TreeNodeWrapper({
  store,
  nodeId,
  depth,
  showIcons,
  showVisibilityToggle,
  showLockToggle,
}: TreeNodeWrapperProps) {
  const treeState = store.treeState as ReturnType<typeof signal<TreeState>> | undefined;

  const isExpanded = treeState ? treeState().expandedNodes.has(nodeId) : true;
  const isSelected = store.selection().selectedIds.includes(nodeId);
  const isHovered = store.selection().hoveredId === nodeId;
  const isDragging = treeState ? treeState().draggedNodeId === nodeId : false;
  const isDropTarget = treeState ? treeState().dropTargetId === nodeId : false;
  const dropPosition = isDropTarget && treeState ? treeState().dropPosition : null;

  const handleToggle = () => {
    if (treeState) {
      const expanded = new Set(treeState().expandedNodes);
      if (expanded.has(nodeId)) {
        expanded.delete(nodeId);
      } else {
        expanded.add(nodeId);
      }
      treeState.set({ ...treeState(), expandedNodes: expanded });
    }
  };

  const handleSelect = () => {
    store.dispatch({ type: 'SELECT_NODE', payload: { nodeId } });
  };

  const handleDoubleClick = () => {
    // Start inline editing or expand/collapse
    handleToggle();
  };

  const handleDragStart = () => {
    if (treeState) {
      treeState.set({ ...treeState(), draggedNodeId: nodeId });
    }
  };

  const handleDragEnd = () => {
    if (treeState) {
      treeState.set({
        ...treeState(),
        draggedNodeId: null,
        dropTargetId: null,
        dropPosition: null,
      });
    }
  };

  const handleDragOver = (position: 'before' | 'inside' | 'after') => {
    if (treeState) {
      const draggedId = treeState().draggedNodeId;
      if (draggedId && draggedId !== nodeId) {
        // Check if we're trying to drop into a descendant
        const descendants = store.getDescendants(draggedId);
        if (!descendants.some(d => d.id === nodeId)) {
          treeState.set({
            ...treeState(),
            dropTargetId: nodeId,
            dropPosition: position,
          });
        }
      }
    }
  };

  const handleDragLeave = () => {
    if (treeState) {
      treeState.set({
        ...treeState(),
        dropTargetId: null,
        dropPosition: null,
      });
    }
  };

  const handleDrop = () => {
    if (treeState) {
      const { draggedNodeId, dropTargetId, dropPosition } = treeState();

      if (draggedNodeId && dropTargetId && dropPosition) {
        const targetNode = store.getNode(dropTargetId);

        if (targetNode) {
          let newParentId: NodeId;
          let insertIndex: number | undefined;

          if (dropPosition === 'inside') {
            newParentId = dropTargetId;
            insertIndex = undefined;
          } else {
            newParentId = targetNode.parentId || store.rootId();
            const parent = store.getNode(newParentId);
            if (parent) {
              const targetIndex = parent.children.indexOf(dropTargetId);
              insertIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1;
            }
          }

          store.dispatch({
            type: 'MOVE_NODE',
            payload: {
              nodeId: draggedNodeId,
              newParentId,
              index: insertIndex,
            },
          });
        }
      }

      treeState.set({
        ...treeState(),
        draggedNodeId: null,
        dropTargetId: null,
        dropPosition: null,
      });
    }
  };

  return (
    <TreeNode
      store={store}
      nodeId={nodeId}
      depth={depth}
      isExpanded={isExpanded}
      isSelected={isSelected}
      isHovered={isHovered}
      isDragging={isDragging}
      dropPosition={dropPosition}
      onToggle={handleToggle}
      onSelect={handleSelect}
      onDoubleClick={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      showIcons={showIcons}
      showVisibilityToggle={showVisibilityToggle}
      showLockToggle={showLockToggle}
    />
  );
}

// ============================================================================
// Main Component Tree Component
// ============================================================================

export function ComponentTree({
  store,
  className,
  style,
  onNodeSelect,
  onNodeDoubleClick,
  showIcons = true,
  showVisibilityToggles = true,
  showLockToggles = true,
  collapsible = true,
  draggable = true,
}: ComponentTreeProps) {
  // Initialize tree state if not exists
  if (!store.treeState) {
    (store as any).treeState = signal<TreeState>({
      expandedNodes: new Set([store.rootId()]),
      editingNodeId: null,
      draggedNodeId: null,
      dropTargetId: null,
      dropPosition: null,
    });
  }

  const treeState = store.treeState as ReturnType<typeof signal<TreeState>>;
  const searchQuery = signal('');

  // Expand all nodes
  const expandAll = () => {
    const allIds = new Set(Object.keys(store.nodes()));
    treeState.set({ ...treeState(), expandedNodes: allIds });
  };

  // Collapse all nodes
  const collapseAll = () => {
    treeState.set({ ...treeState(), expandedNodes: new Set([store.rootId()]) });
  };

  // Filter nodes based on search
  const filteredTree = memo(() => {
    const query = searchQuery().toLowerCase();
    if (!query) return null;

    const nodes = store.nodes();
    const matchingIds = new Set<NodeId>();

    for (const [nodeId, node] of Object.entries(nodes)) {
      if (
        node.name?.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query)
      ) {
        matchingIds.add(nodeId);
        // Also add all ancestors
        let parentId = node.parentId;
        while (parentId) {
          matchingIds.add(parentId);
          parentId = nodes[parentId]?.parentId || null;
        }
      }
    }

    return matchingIds;
  });

  return (
    <div
      class={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#fafafa',
        borderRight: '1px solid #e0e0e0',
        minWidth: '220px',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#333' }}>
          Layers
        </h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={expandAll}
            style={{
              padding: '4px 8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '11px',
              color: '#666',
            }}
            title="Expand all"
          >
            +
          </button>
          <button
            onClick={collapseAll}
            style={{
              padding: '4px 8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '11px',
              color: '#666',
            }}
            title="Collapse all"
          >
            -
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>
        <input
          type="text"
          placeholder="Search layers..."
          value={searchQuery()}
          onInput={(e) => searchQuery.set((e.target as HTMLInputElement).value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontSize: '12px',
            outline: 'none',
          }}
        />
      </div>

      {/* Tree */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 0',
        }}
      >
        <TreeNodeWrapper
          store={store}
          nodeId={store.rootId()}
          depth={0}
          showIcons={showIcons}
          showVisibilityToggle={showVisibilityToggles}
          showLockToggle={showLockToggles}
        />
      </div>

      {/* Footer with count */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          fontSize: '11px',
          color: '#999',
        }}
      >
        {Object.keys(store.nodes()).length} layers
      </div>
    </div>
  );
}

export default ComponentTree;
