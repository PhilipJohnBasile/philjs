/**
 * Palette components for the visual builder
 */

import type { ComponentDefinition, ComponentCategory } from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface PaletteProps {
  components?: ComponentDefinition[];
  categories?: ComponentCategory[];
  onDragStart?: (component: ComponentDefinition) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  collapsedCategories?: Set<string>;
  onCategoryToggle?: (categoryId: string) => void;
}

export interface PaletteItemProps {
  component: ComponentDefinition;
  onDragStart?: (component: ComponentDefinition) => void;
  isDragging?: boolean;
}

export interface PaletteCategoryProps {
  category: ComponentCategory;
  components: ComponentDefinition[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  onDragStart?: (component: ComponentDefinition) => void;
}

// ============================================================================
// Built-in Components
// ============================================================================

export const builtInCategories: ComponentCategory[] = [
  { id: 'layout', name: 'Layout', icon: 'layout', order: 1 },
  { id: 'typography', name: 'Typography', icon: 'type', order: 2 },
  { id: 'forms', name: 'Forms', icon: 'form', order: 3 },
  { id: 'media', name: 'Media', icon: 'image', order: 4 },
  { id: 'data-display', name: 'Data Display', icon: 'table', order: 5 },
  { id: 'navigation', name: 'Navigation', icon: 'menu', order: 6 },
  { id: 'feedback', name: 'Feedback', icon: 'bell', order: 7 },
  { id: 'overlay', name: 'Overlay', icon: 'layers', order: 8 },
];

export const builtInComponents: ComponentDefinition[] = [
  // Layout components
  {
    type: 'Container',
    name: 'Container',
    category: 'layout',
    props: [],
    isContainer: true,
    canHaveChildren: true,
  },
  {
    type: 'Frame',
    name: 'Frame',
    category: 'layout',
    props: [],
    isContainer: true,
    canHaveChildren: true,
  },
  {
    type: 'Flex',
    name: 'Flex',
    category: 'layout',
    props: [
      { name: 'direction', type: 'enum', enumValues: ['row', 'column', 'row-reverse', 'column-reverse'] },
      { name: 'wrap', type: 'enum', enumValues: ['nowrap', 'wrap', 'wrap-reverse'] },
      { name: 'justify', type: 'enum', enumValues: ['start', 'end', 'center', 'between', 'around', 'evenly'] },
      { name: 'align', type: 'enum', enumValues: ['start', 'end', 'center', 'stretch', 'baseline'] },
      { name: 'gap', type: 'string' },
    ],
    isContainer: true,
    canHaveChildren: true,
    defaultStyles: { display: 'flex' },
  },
  {
    type: 'Grid',
    name: 'Grid',
    category: 'layout',
    props: [
      { name: 'columns', type: 'string' },
      { name: 'rows', type: 'string' },
      { name: 'gap', type: 'string' },
    ],
    isContainer: true,
    canHaveChildren: true,
    defaultStyles: { display: 'grid' },
  },
];

// ============================================================================
// Components
// ============================================================================

export function Palette(_props: PaletteProps): unknown {
  // Implementation placeholder
  return null;
}

export function PaletteItem(_props: PaletteItemProps): unknown {
  // Implementation placeholder
  return null;
}

export function PaletteCategory(_props: PaletteCategoryProps): unknown {
  // Implementation placeholder
  return null;
}
