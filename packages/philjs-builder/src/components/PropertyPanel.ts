/**
 * Property Panel components for the visual builder
 */

import type { ComponentNode, PropDefinition, NodeStyles } from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface PropertyPanelProps {
  node?: ComponentNode;
  propDefinitions?: PropDefinition[];
  onPropsChange?: (props: Record<string, unknown>) => void;
  onStylesChange?: (styles: Partial<NodeStyles>) => void;
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}

export interface PropertyGroupProps {
  title: string;
  children?: unknown;
  isCollapsed?: boolean;
  onToggle?: () => void;
  icon?: string;
}

// ============================================================================
// Components
// ============================================================================

export function PropertyPanel(_props: PropertyPanelProps): unknown {
  // Implementation placeholder
  return null;
}

export function PropertyGroup(_props: PropertyGroupProps): unknown {
  // Implementation placeholder
  return null;
}
