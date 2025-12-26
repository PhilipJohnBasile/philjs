// @ts-nocheck
/**
 * PhilJS UI - Tree Component
 *
 * Hierarchical tree view with expand/collapse, selection,
 * drag-and-drop, and keyboard navigation.
 */

import { signal, effect, memo } from 'philjs-core';

export interface TreeNode {
  id: string;
  label: string;
  icon?: any;
  children?: TreeNode[];
  disabled?: boolean;
  data?: any;
}

export type TreeSelectionMode = 'none' | 'single' | 'multiple';

export interface TreeProps {
  data: TreeNode[];
  selectionMode?: TreeSelectionMode;
  selectedIds?: string[];
  expandedIds?: string[];
  defaultExpandedIds?: string[];
  defaultSelectedIds?: string[];
  showCheckboxes?: boolean;
  showIcons?: boolean;
  showLines?: boolean;
  draggable?: boolean;
  onSelect?: (selectedIds: string[]) => void;
  onExpand?: (expandedIds: string[]) => void;
  onNodeClick?: (node: TreeNode) => void;
  onNodeDoubleClick?: (node: TreeNode) => void;
  onDrop?: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  className?: string;
}

export function Tree(props: TreeProps) {
  const {
    data,
    selectionMode = 'single',
    selectedIds: externalSelected,
    expandedIds: externalExpanded,
    defaultExpandedIds = [],
    defaultSelectedIds = [],
    showCheckboxes = false,
    showIcons = true,
    showLines = false,
    draggable = false,
    onSelect,
    onExpand,
    onNodeClick,
    onNodeDoubleClick,
    onDrop,
    className = '',
  } = props;

  const selected = signal<Set<string>>(new Set(externalSelected ?? defaultSelectedIds));
  const expanded = signal<Set<string>>(new Set(externalExpanded ?? defaultExpandedIds));
  const focusedId = signal<string | null>(null);
  const draggedId = signal<string | null>(null);
  const dropTarget = signal<{ id: string; position: 'before' | 'after' | 'inside' } | null>(null);

  // Sync external state
  effect(() => {
    if (externalSelected) {
      selected.set(new Set(externalSelected));
    }
  });

  effect(() => {
    if (externalExpanded) {
      expanded.set(new Set(externalExpanded));
    }
  });

  // Flatten tree for keyboard navigation
  const flatNodes = memo(() => {
    const result: { node: TreeNode; level: number; parentIds: string[] }[] = [];

    const traverse = (nodes: TreeNode[], level: number, parentIds: string[]) => {
      for (const node of nodes) {
        result.push({ node, level, parentIds });
        if (node.children && expanded().has(node.id)) {
          traverse(node.children, level + 1, [...parentIds, node.id]);
        }
      }
    };

    traverse(data, 0, []);
    return result;
  });

  const toggleExpand = (nodeId: string) => {
    const exp = new Set(expanded());
    if (exp.has(nodeId)) {
      exp.delete(nodeId);
    } else {
      exp.add(nodeId);
    }
    expanded.set(exp);
    onExpand?.(Array.from(exp));
  };

  const handleSelect = (node: TreeNode, e?: MouseEvent) => {
    if (node.disabled) return;
    if (selectionMode === 'none') return;

    const sel = new Set(selected());

    if (selectionMode === 'single') {
      sel.clear();
      sel.add(node.id);
    } else if (selectionMode === 'multiple') {
      if (e?.ctrlKey || e?.metaKey) {
        if (sel.has(node.id)) {
          sel.delete(node.id);
        } else {
          sel.add(node.id);
        }
      } else if (e?.shiftKey && focusedId()) {
        // Range selection
        const flat = flatNodes();
        const focusedIndex = flat.findIndex(f => f.node.id === focusedId());
        const currentIndex = flat.findIndex(f => f.node.id === node.id);
        const [start, end] = [Math.min(focusedIndex, currentIndex), Math.max(focusedIndex, currentIndex)];

        for (let i = start; i <= end; i++) {
          if (!flat[i].node.disabled) {
            sel.add(flat[i].node.id);
          }
        }
      } else {
        sel.clear();
        sel.add(node.id);
      }
    }

    focusedId.set(node.id);
    selected.set(sel);
    onSelect?.(Array.from(sel));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const flat = flatNodes();
    const currentIndex = flat.findIndex(f => f.node.id === focusedId());

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < flat.length - 1) {
          const next = flat[currentIndex + 1];
          focusedId.set(next.node.id);
          if (!e.ctrlKey) handleSelect(next.node, e as any);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          const prev = flat[currentIndex - 1];
          focusedId.set(prev.node.id);
          if (!e.ctrlKey) handleSelect(prev.node, e as any);
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex >= 0) {
          const current = flat[currentIndex].node;
          if (current.children?.length) {
            if (!expanded().has(current.id)) {
              toggleExpand(current.id);
            } else {
              // Move to first child
              const firstChild = flat[currentIndex + 1];
              if (firstChild && flat[currentIndex].parentIds.length < firstChild.parentIds.length) {
                focusedId.set(firstChild.node.id);
              }
            }
          }
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex >= 0) {
          const current = flat[currentIndex];
          if (expanded().has(current.node.id)) {
            toggleExpand(current.node.id);
          } else if (current.parentIds.length > 0) {
            // Move to parent
            focusedId.set(current.parentIds[current.parentIds.length - 1]);
          }
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0) {
          const current = flat[currentIndex].node;
          handleSelect(current);
          onNodeClick?.(current);
        }
        break;

      case 'Home':
        e.preventDefault();
        if (flat.length > 0) {
          focusedId.set(flat[0].node.id);
          if (!e.ctrlKey) handleSelect(flat[0].node);
        }
        break;

      case 'End':
        e.preventDefault();
        if (flat.length > 0) {
          focusedId.set(flat[flat.length - 1].node.id);
          if (!e.ctrlKey) handleSelect(flat[flat.length - 1].node);
        }
        break;

      case '*':
        e.preventDefault();
        // Expand all siblings
        if (currentIndex >= 0) {
          const current = flat[currentIndex];
          const siblings = flat.filter(f =>
            f.parentIds.length === current.parentIds.length &&
            JSON.stringify(f.parentIds) === JSON.stringify(current.parentIds)
          );
          const exp = new Set(expanded());
          siblings.forEach(s => {
            if (s.node.children?.length) {
              exp.add(s.node.id);
            }
          });
          expanded.set(exp);
          onExpand?.(Array.from(exp));
        }
        break;
    }
  };

  const handleDragStart = (e: DragEvent, nodeId: string) => {
    if (!draggable) return;
    draggedId.set(nodeId);
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', nodeId);
  };

  const handleDragOver = (e: DragEvent, nodeId: string, position: 'before' | 'after' | 'inside') => {
    if (!draggable || !draggedId()) return;
    if (draggedId() === nodeId) return;

    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    dropTarget.set({ id: nodeId, position });
  };

  const handleDragLeave = () => {
    dropTarget.set(null);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const target = dropTarget();
    const dragged = draggedId();

    if (target && dragged) {
      onDrop?.(dragged, target.id, target.position);
    }

    draggedId.set(null);
    dropTarget.set(null);
  };

  const handleDragEnd = () => {
    draggedId.set(null);
    dropTarget.set(null);
  };

  const renderNode = (node: TreeNode, level: number) => {
    const isExpanded = expanded().has(node.id);
    const isSelected = selected().has(node.id);
    const isFocused = focusedId() === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isDragging = draggedId() === node.id;
    const isDropTarget = dropTarget()?.id === node.id;

    return (
      <div key={node.id} role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
        <div
          className={`
            flex items-center py-1 px-2 cursor-pointer select-none
            ${isSelected ? 'bg-blue-100' : ''}
            ${isFocused ? 'ring-2 ring-blue-500 ring-inset' : ''}
            ${node.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
            ${isDragging ? 'opacity-50' : ''}
            ${isDropTarget && dropTarget()?.position === 'inside' ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}
          `}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={(e: any) => {
            handleSelect(node, e);
            onNodeClick?.(node);
          }}
          onDoubleClick={() => {
            if (hasChildren) toggleExpand(node.id);
            onNodeDoubleClick?.(node);
          }}
          draggable={draggable && !node.disabled}
          onDragStart={(e: any) => handleDragStart(e, node.id)}
          onDragOver={(e: any) => handleDragOver(e, node.id, 'inside')}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        >
          {/* Drop indicator - before */}
          {isDropTarget && dropTarget()?.position === 'before' && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-blue-500"
              style={{ marginLeft: `${level * 20}px` }}
            />
          )}

          {/* Expand/Collapse Arrow */}
          <span
            className="w-4 h-4 flex items-center justify-center mr-1"
            onClick={(e: any) => {
              e.stopPropagation();
              if (hasChildren) toggleExpand(node.id);
            }}
          >
            {hasChildren && (
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6 6L14 10L6 14V6Z" />
              </svg>
            )}
          </span>

          {/* Checkbox */}
          {showCheckboxes && selectionMode === 'multiple' && (
            <input
              type="checkbox"
              checked={isSelected}
              disabled={node.disabled}
              onChange={() => handleSelect(node)}
              className="mr-2 rounded border-gray-300"
              onClick={(e: any) => e.stopPropagation()}
            />
          )}

          {/* Icon */}
          {showIcons && (
            <span className="w-4 h-4 mr-2 text-gray-500">
              {node.icon || (hasChildren ? (
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              ) : (
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              ))}
            </span>
          )}

          {/* Label */}
          <span className="flex-1 truncate text-sm">{node.label}</span>

          {/* Drop indicator - after */}
          {isDropTarget && dropTarget()?.position === 'after' && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-blue-500 bottom-0"
              style={{ marginLeft: `${level * 20}px` }}
            />
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div role="group" className={showLines ? 'border-l border-gray-200 ml-4' : ''}>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      role="tree"
      aria-multiselectable={selectionMode === 'multiple'}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`outline-none ${className}`}
    >
      {data.map(node => renderNode(node, 0))}
    </div>
  );
}

/**
 * File Tree - Specialized tree for file system navigation
 */
export interface FileTreeNode extends TreeNode {
  type: 'file' | 'folder';
  extension?: string;
  size?: number;
  modified?: Date;
}

export interface FileTreeProps extends Omit<TreeProps, 'data' | 'showIcons'> {
  data: FileTreeNode[];
  onFileOpen?: (file: FileTreeNode) => void;
}

export function FileTree(props: FileTreeProps) {
  const { data, onFileOpen, onNodeDoubleClick, ...rest } = props;

  const getFileIcon = (node: FileTreeNode) => {
    if (node.type === 'folder') {
      return (
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      );
    }

    const ext = node.extension?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return <span className="text-blue-500 text-xs font-bold">TS</span>;
      case 'js':
      case 'jsx':
        return <span className="text-yellow-500 text-xs font-bold">JS</span>;
      case 'json':
        return <span className="text-gray-500 text-xs font-bold">{'{}'}</span>;
      case 'css':
      case 'scss':
        return <span className="text-purple-500 text-xs font-bold">#</span>;
      case 'html':
        return <span className="text-orange-500 text-xs font-bold">{'<>'}</span>;
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const addIcons = (nodes: FileTreeNode[]): TreeNode[] => {
    return nodes.map(node => ({
      ...node,
      icon: getFileIcon(node),
      children: node.children ? addIcons(node.children as FileTreeNode[]) : undefined,
    }));
  };

  return (
    <Tree
      {...rest}
      data={addIcons(data)}
      showIcons={true}
      onNodeDoubleClick={(node) => {
        const fileNode = node as FileTreeNode;
        if (fileNode.type === 'file') {
          onFileOpen?.(fileNode);
        }
        onNodeDoubleClick?.(node);
      }}
    />
  );
}
