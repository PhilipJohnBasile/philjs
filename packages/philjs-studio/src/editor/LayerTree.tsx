import React, { useState, useCallback, useMemo } from 'react';
import { useEditorStore, useIsSelected } from '../state/EditorStore';
import type { ComponentNode } from '../state/EditorStore';

// ============================================================================
// Types
// ============================================================================

export interface LayerTreeProps {
  className?: string;
  style?: React.CSSProperties;
}

interface LayerItemProps {
  component: ComponentNode;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string, position: 'before' | 'inside' | 'after') => void;
  onDragEnd: () => void;
  onDrop: (targetId: string, position: 'before' | 'inside' | 'after') => void;
  dragOverTarget: { id: string; position: 'before' | 'inside' | 'after' } | null;
  draggedId: string | null;
}

// ============================================================================
// Icons
// ============================================================================

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      style={{
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.15s ease',
      }}
    >
      <polyline points="4,2 8,6 4,10" />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" />
        <circle cx="7" cy="7" r="2" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" />
      <line x1="2" y1="2" x2="12" y2="12" />
    </svg>
  );
}

function LockIcon({ locked }: { locked: boolean }) {
  if (locked) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="6" width="8" height="6" rx="1" />
        <path d="M5 6V4a2 2 0 0 1 4 0v2" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="6" width="8" height="6" rx="1" />
      <path d="M5 6V4a2 2 0 0 1 4 0" />
    </svg>
  );
}

function getComponentIcon(type: string): React.ReactNode {
  const iconStyle = { width: 14, height: 14 };

  switch (type) {
    case 'Container':
      return (
        <svg {...iconStyle} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="10" height="10" rx="1" />
        </svg>
      );
    case 'Button':
      return (
        <svg {...iconStyle} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="4" width="10" height="6" rx="3" />
        </svg>
      );
    case 'Text':
      return (
        <svg {...iconStyle} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="3" y1="5" x2="11" y2="5" />
          <line x1="3" y1="7" x2="9" y2="7" />
          <line x1="3" y1="9" x2="7" y2="9" />
        </svg>
      );
    case 'Image':
      return (
        <svg {...iconStyle} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="3" width="10" height="8" rx="1" />
          <circle cx="5" cy="6" r="1" />
          <path d="M12 9l-3-3-5 5" />
        </svg>
      );
    case 'Input':
      return (
        <svg {...iconStyle} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="4" width="10" height="6" rx="1" />
          <line x1="4" y1="7" x2="4" y2="7.01" strokeWidth="2" />
        </svg>
      );
    case 'Card':
      return (
        <svg {...iconStyle} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="10" height="10" rx="1" />
          <line x1="2" y1="5" x2="12" y2="5" />
        </svg>
      );
    default:
      return (
        <svg {...iconStyle} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="10" height="10" rx="1" strokeDasharray="2 1" />
        </svg>
      );
  }
}

// ============================================================================
// Layer Item Component
// ============================================================================

const LayerItem: React.FC<LayerItemProps> = ({
  component,
  depth,
  isExpanded,
  onToggleExpand,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  dragOverTarget,
  draggedId,
}) => {
  const isSelected = useIsSelected(component.id);
  const components = useEditorStore((state) => state.components);
  const { select, toggleVisibility, toggleLock, setHovered } = useEditorStore();

  const [localDragOver, setLocalDragOver] = useState<'before' | 'inside' | 'after' | null>(null);

  const children = useMemo(() => {
    return component.children
      .map((childId) => components[childId])
      .filter((child): child is ComponentNode => child !== undefined);
  }, [component.children, components]);

  const hasChildren = children.length > 0;
  const isDragged = draggedId === component.id;
  const isDragTarget = dragOverTarget?.id === component.id;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      select(component.id, e.shiftKey);
    },
    [component.id, select]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasChildren) {
        onToggleExpand(component.id);
      }
    },
    [component.id, hasChildren, onToggleExpand]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.setData('layer/id', component.id);
      e.dataTransfer.effectAllowed = 'move';
      onDragStart(component.id);
    },
    [component.id, onDragStart]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;

      let position: 'before' | 'inside' | 'after';
      if (y < height * 0.25) {
        position = 'before';
      } else if (y > height * 0.75) {
        position = 'after';
      } else {
        position = 'inside';
      }

      setLocalDragOver(position);
      onDragOver(component.id, position);
    },
    [component.id, onDragOver]
  );

  const handleDragLeave = useCallback(() => {
    setLocalDragOver(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (localDragOver) {
        onDrop(component.id, localDragOver);
      }
      setLocalDragOver(null);
    },
    [component.id, localDragOver, onDrop]
  );

  const handleVisibilityClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleVisibility(component.id);
    },
    [component.id, toggleVisibility]
  );

  const handleLockClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleLock(component.id);
    },
    [component.id, toggleLock]
  );

  const handleMouseEnter = useCallback(() => {
    setHovered(component.id);
  }, [component.id, setHovered]);

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
  }, [setHovered]);

  return (
    <>
      {/* Drop indicator - before */}
      {isDragTarget && dragOverTarget?.position === 'before' && (
        <div
          style={{
            height: 2,
            backgroundColor: '#3B82F6',
            marginLeft: depth * 16 + 24,
            marginRight: 8,
          }}
        />
      )}

      <div
        className="layer-item"
        draggable={!component.isLocked}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={onDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 8px',
          paddingLeft: depth * 16 + 8,
          gap: 6,
          cursor: component.isLocked ? 'default' : 'grab',
          backgroundColor: isSelected
            ? '#EFF6FF'
            : isDragTarget && dragOverTarget?.position === 'inside'
            ? '#F0FDF4'
            : 'transparent',
          borderLeft: isSelected ? '2px solid #3B82F6' : '2px solid transparent',
          opacity: isDragged ? 0.5 : component.isVisible ? 1 : 0.4,
          userSelect: 'none',
          transition: 'background-color 0.1s ease',
        }}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(component.id);
          }}
          style={{
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: hasChildren ? 'pointer' : 'default',
            color: hasChildren ? '#6B7280' : 'transparent',
            padding: 0,
          }}
          disabled={!hasChildren}
        >
          {hasChildren && <ChevronIcon expanded={isExpanded} />}
        </button>

        {/* Component icon */}
        <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center' }}>
          {getComponentIcon(component.type)}
        </span>

        {/* Component name */}
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: isSelected ? 500 : 400,
            color: component.isVisible ? '#111827' : '#9CA3AF',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {component.name}
        </span>

        {/* Actions */}
        <div
          className="layer-actions"
          style={{
            display: 'flex',
            gap: 4,
            opacity: 0,
            transition: 'opacity 0.1s ease',
          }}
        >
          <button
            onClick={handleVisibilityClick}
            style={{
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: component.isVisible ? '#6B7280' : '#D1D5DB',
              padding: 0,
            }}
            title={component.isVisible ? 'Hide' : 'Show'}
          >
            <EyeIcon visible={component.isVisible} />
          </button>
          <button
            onClick={handleLockClick}
            style={{
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: component.isLocked ? '#F59E0B' : '#D1D5DB',
              padding: 0,
            }}
            title={component.isLocked ? 'Unlock' : 'Lock'}
          >
            <LockIcon locked={component.isLocked} />
          </button>
        </div>

        <style>{`
          .layer-item:hover .layer-actions {
            opacity: 1 !important;
          }
        `}</style>
      </div>

      {/* Drop indicator - after (only if no children or collapsed) */}
      {isDragTarget && dragOverTarget?.position === 'after' && (!hasChildren || !isExpanded) && (
        <div
          style={{
            height: 2,
            backgroundColor: '#3B82F6',
            marginLeft: depth * 16 + 24,
            marginRight: 8,
          }}
        />
      )}

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="layer-children">
          {children.map((child) => (
            <LayerItem
              key={child.id}
              component={child}
              depth={depth + 1}
              isExpanded={true}
              onToggleExpand={onToggleExpand}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
              dragOverTarget={dragOverTarget}
              draggedId={draggedId}
            />
          ))}

          {/* Drop indicator - after last child */}
          {isDragTarget && dragOverTarget?.position === 'after' && (
            <div
              style={{
                height: 2,
                backgroundColor: '#3B82F6',
                marginLeft: (depth + 1) * 16 + 24,
                marginRight: 8,
              }}
            />
          )}
        </div>
      )}
    </>
  );
};

// ============================================================================
// Main Layer Tree Component
// ============================================================================

export const LayerTree: React.FC<LayerTreeProps> = ({ className, style }) => {
  const components = useEditorStore((state) => state.components);
  const rootIds = useEditorStore((state) => state.rootIds);
  const { moveComponent, clearSelection } = useEditorStore();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    id: string;
    position: 'before' | 'inside' | 'after';
  } | null>(null);

  const rootComponents = useMemo(() => {
    return rootIds
      .map((id) => components[id])
      .filter((comp): comp is ComponentNode => comp !== undefined);
  }, [rootIds, components]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDragStart = useCallback((id: string) => {
    setDraggedId(id);
  }, []);

  const handleDragOver = useCallback(
    (id: string, position: 'before' | 'inside' | 'after') => {
      if (draggedId && draggedId !== id) {
        setDragOverTarget({ id, position });
      }
    },
    [draggedId]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverTarget(null);
  }, []);

  const handleDrop = useCallback(
    (targetId: string, position: 'before' | 'inside' | 'after') => {
      if (!draggedId || draggedId === targetId) return;

      const targetComponent = components[targetId];
      if (!targetComponent) return;

      // Prevent dropping on self or descendants
      const isDescendant = (parentId: string, childId: string): boolean => {
        const child = components[childId];
        if (!child) return false;
        if (child.parentId === parentId) return true;
        if (child.parentId) return isDescendant(parentId, child.parentId);
        return false;
      };

      if (isDescendant(draggedId, targetId)) {
        handleDragEnd();
        return;
      }

      if (position === 'inside') {
        // Drop as child
        moveComponent(draggedId, targetId);
        setExpandedIds((prev) => new Set(prev).add(targetId));
      } else {
        // Drop as sibling
        const parentId = targetComponent.parentId;
        const siblings = parentId
          ? components[parentId]?.children || []
          : rootIds;
        const targetIndex = siblings.indexOf(targetId);
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
        moveComponent(draggedId, parentId, insertIndex);
      }

      handleDragEnd();
    },
    [draggedId, components, rootIds, moveComponent, handleDragEnd]
  );

  const handleExpandAll = useCallback(() => {
    const allIds = new Set(Object.keys(components));
    setExpandedIds(allIds);
  }, [components]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return (
    <div
      className={`layer-tree ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 240,
        height: '100%',
        backgroundColor: '#fff',
        borderRight: '1px solid #E5E7EB',
        overflow: 'hidden',
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
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: '#111827',
          }}
        >
          Layers
        </h3>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={handleExpandAll}
            style={{
              padding: '4px 8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#6B7280',
              fontSize: 11,
              cursor: 'pointer',
              borderRadius: 4,
            }}
            title="Expand all"
          >
            Expand
          </button>
          <button
            onClick={handleCollapseAll}
            style={{
              padding: '4px 8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#6B7280',
              fontSize: 11,
              cursor: 'pointer',
              borderRadius: 4,
            }}
            title="Collapse all"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Layer list */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 0',
        }}
        onClick={() => clearSelection()}
      >
        {rootComponents.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: '#9CA3AF',
              fontSize: 13,
            }}
          >
            No components yet.
            <br />
            Drag components from the palette.
          </div>
        ) : (
          rootComponents.map((component) => (
            <LayerItem
              key={component.id}
              component={component}
              depth={0}
              isExpanded={expandedIds.has(component.id)}
              onToggleExpand={handleToggleExpand}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              dragOverTarget={dragOverTarget}
              draggedId={draggedId}
            />
          ))
        )}
      </div>

      {/* Footer with count */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #E5E7EB',
          fontSize: 11,
          color: '#9CA3AF',
        }}
      >
        {Object.keys(components).length} component{Object.keys(components).length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default LayerTree;
