import React from 'react';
import type { Bounds } from '../state/EditorStore';

export interface SelectionBoxProps {
  bounds: Bounds;
  isSelected: boolean;
  isHovered: boolean;
  isLocked: boolean;
  zoom: number;
  showLabel?: boolean;
  label?: string;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  bounds,
  isSelected,
  isHovered,
  isLocked,
  zoom,
  showLabel = true,
  label,
}) => {
  const borderWidth = 2 / zoom;
  const padding = 0;

  const getBorderColor = () => {
    if (isLocked) return '#9CA3AF';
    if (isSelected) return '#3B82F6';
    if (isHovered) return '#60A5FA';
    return 'transparent';
  };

  const getBackgroundColor = () => {
    if (isSelected) return 'rgba(59, 130, 246, 0.05)';
    if (isHovered) return 'rgba(59, 130, 246, 0.02)';
    return 'transparent';
  };

  return (
    <div
      className="selection-box"
      style={{
        position: 'absolute',
        left: bounds.x - padding,
        top: bounds.y - padding,
        width: bounds.width + padding * 2,
        height: bounds.height + padding * 2,
        border: `${borderWidth}px solid ${getBorderColor()}`,
        backgroundColor: getBackgroundColor(),
        pointerEvents: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
      }}
    >
      {/* Label */}
      {showLabel && label && (isSelected || isHovered) && (
        <div
          className="selection-label"
          style={{
            position: 'absolute',
            top: -20 / zoom,
            left: -borderWidth,
            padding: `${2 / zoom}px ${6 / zoom}px`,
            fontSize: 11 / zoom,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 500,
            color: '#fff',
            backgroundColor: getBorderColor(),
            borderRadius: `${3 / zoom}px ${3 / zoom}px 0 0`,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 4 / zoom,
          }}
        >
          {isLocked && (
            <svg
              width={10 / zoom}
              height={10 / zoom}
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M8 1a4 4 0 0 0-4 4v2H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1V5a4 4 0 0 0-4-4zm2 6V5a2 2 0 1 0-4 0v2h4z" />
            </svg>
          )}
          {label}
        </div>
      )}

      {/* Corner indicators for selected state */}
      {isSelected && !isLocked && (
        <>
          <CornerDot position="top-left" zoom={zoom} />
          <CornerDot position="top-right" zoom={zoom} />
          <CornerDot position="bottom-left" zoom={zoom} />
          <CornerDot position="bottom-right" zoom={zoom} />
        </>
      )}
    </div>
  );
};

interface CornerDotProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  zoom: number;
}

const CornerDot: React.FC<CornerDotProps> = ({ position, zoom }) => {
  const size = 6 / zoom;
  const offset = -size / 2;

  const positions: Record<string, React.CSSProperties> = {
    'top-left': { top: offset, left: offset },
    'top-right': { top: offset, right: offset },
    'bottom-left': { bottom: offset, left: offset },
    'bottom-right': { bottom: offset, right: offset },
  };

  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        backgroundColor: '#3B82F6',
        border: `${1 / zoom}px solid #fff`,
        borderRadius: '50%',
        ...positions[position],
      }}
    />
  );
};

export interface MultiSelectionBoxProps {
  selectedBounds: Bounds[];
  zoom: number;
}

export const MultiSelectionBox: React.FC<MultiSelectionBoxProps> = ({
  selectedBounds,
  zoom,
}) => {
  if (selectedBounds.length < 2) return null;

  // Calculate bounding box that contains all selected components
  const minX = Math.min(...selectedBounds.map((b) => b.x));
  const minY = Math.min(...selectedBounds.map((b) => b.y));
  const maxX = Math.max(...selectedBounds.map((b) => b.x + b.width));
  const maxY = Math.max(...selectedBounds.map((b) => b.y + b.height));

  const combinedBounds: Bounds = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };

  const borderWidth = 1 / zoom;
  const padding = 8 / zoom;

  return (
    <div
      className="multi-selection-box"
      style={{
        position: 'absolute',
        left: combinedBounds.x - padding,
        top: combinedBounds.y - padding,
        width: combinedBounds.width + padding * 2,
        height: combinedBounds.height + padding * 2,
        border: `${borderWidth}px dashed #3B82F6`,
        backgroundColor: 'rgba(59, 130, 246, 0.03)',
        pointerEvents: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* Selection count label */}
      <div
        style={{
          position: 'absolute',
          top: -20 / zoom,
          left: -borderWidth,
          padding: `${2 / zoom}px ${6 / zoom}px`,
          fontSize: 11 / zoom,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 500,
          color: '#fff',
          backgroundColor: '#3B82F6',
          borderRadius: `${3 / zoom}px`,
          whiteSpace: 'nowrap',
        }}
      >
        {selectedBounds.length} selected
      </div>
    </div>
  );
};

export interface MarqueeSelectionProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  zoom: number;
}

export const MarqueeSelection: React.FC<MarqueeSelectionProps> = ({
  startX,
  startY,
  endX,
  endY,
  zoom,
}) => {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  if (width < 2 && height < 2) return null;

  return (
    <div
      className="marquee-selection"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        border: `${1 / zoom}px solid #3B82F6`,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointerEvents: 'none',
        boxSizing: 'border-box',
      }}
    />
  );
};

export default SelectionBox;
