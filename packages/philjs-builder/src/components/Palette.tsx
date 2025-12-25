/**
 * Component Palette - Component picker sidebar for the visual builder
 */

import { signal, memo, effect } from 'philjs-core';
import type { BuilderStore } from '../state/store.js';
import type {
  ComponentDefinition,
  ComponentCategory,
  ComponentType,
} from '../types.js';
import { Draggable } from '../canvas/DragDrop.js';

// ============================================================================
// Types
// ============================================================================

export interface PaletteProps {
  store: BuilderStore;
  className?: string;
  style?: Record<string, string | number>;
  searchable?: boolean;
  collapsible?: boolean;
  onComponentDragStart?: (componentType: ComponentType) => void;
  onComponentDragEnd?: (componentType: ComponentType, dropped: boolean) => void;
}

export interface PaletteItemProps {
  store: BuilderStore;
  component: ComponentDefinition;
  onDragStart?: () => void;
  onDragEnd?: (dropped: boolean) => void;
}

export interface PaletteCategoryProps {
  category: ComponentCategory;
  components: ComponentDefinition[];
  store: BuilderStore;
  isCollapsed?: boolean;
  onToggle?: () => void;
  onComponentDragStart?: (componentType: ComponentType) => void;
  onComponentDragEnd?: (componentType: ComponentType, dropped: boolean) => void;
}

// ============================================================================
// Built-in Component Definitions
// ============================================================================

export const builtInComponents: ComponentDefinition[] = [
  // Layout Components
  {
    type: 'Frame',
    name: 'Frame',
    description: 'A basic container element',
    category: 'layout',
    icon: 'square',
    props: [],
    defaultStyles: {
      display: 'flex',
      flexDirection: 'column',
      padding: { value: 16, unit: 'px' },
      backgroundColor: '#ffffff',
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'Flex',
    name: 'Flex Container',
    description: 'A flexbox container for flexible layouts',
    category: 'layout',
    icon: 'columns',
    props: [
      { name: 'direction', type: 'enum', enumValues: ['row', 'column', 'row-reverse', 'column-reverse'], defaultValue: 'row' },
      { name: 'wrap', type: 'enum', enumValues: ['nowrap', 'wrap', 'wrap-reverse'], defaultValue: 'nowrap' },
      { name: 'justify', type: 'enum', enumValues: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'], defaultValue: 'flex-start' },
      { name: 'align', type: 'enum', enumValues: ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'], defaultValue: 'stretch' },
      { name: 'gap', type: 'number', defaultValue: 8, min: 0 },
    ],
    defaultStyles: {
      display: 'flex',
      flexDirection: 'row',
      gap: { value: 8, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'Grid',
    name: 'Grid Container',
    description: 'A CSS grid container for complex layouts',
    category: 'layout',
    icon: 'grid',
    props: [
      { name: 'columns', type: 'number', defaultValue: 2, min: 1 },
      { name: 'rows', type: 'number', defaultValue: 2, min: 1 },
      { name: 'gap', type: 'number', defaultValue: 8, min: 0 },
    ],
    defaultStyles: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridTemplateRows: 'repeat(2, 1fr)',
      gap: { value: 8, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'Stack',
    name: 'Stack',
    description: 'A vertical stack of elements',
    category: 'layout',
    icon: 'layers',
    props: [
      { name: 'spacing', type: 'number', defaultValue: 8, min: 0 },
    ],
    defaultStyles: {
      display: 'flex',
      flexDirection: 'column',
      gap: { value: 8, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
  },

  // Typography Components
  {
    type: 'Text',
    name: 'Text',
    description: 'A text element',
    category: 'typography',
    icon: 'type',
    props: [
      { name: 'content', type: 'string', defaultValue: 'Text content' },
    ],
    defaultStyles: {
      fontSize: { value: 16, unit: 'px' },
      lineHeight: { value: 1.5, unit: 'none' },
      color: '#333333',
    },
    canHaveChildren: false,
  },
  {
    type: 'Heading',
    name: 'Heading',
    description: 'A heading element',
    category: 'typography',
    icon: 'heading',
    props: [
      { name: 'content', type: 'string', defaultValue: 'Heading' },
      { name: 'level', type: 'enum', enumValues: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], defaultValue: 'h2' },
    ],
    defaultStyles: {
      fontSize: { value: 24, unit: 'px' },
      fontWeight: 600,
      lineHeight: { value: 1.3, unit: 'none' },
      color: '#111111',
    },
    canHaveChildren: false,
  },
  {
    type: 'Paragraph',
    name: 'Paragraph',
    description: 'A paragraph of text',
    category: 'typography',
    icon: 'align-left',
    props: [
      { name: 'content', type: 'string', defaultValue: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    ],
    defaultStyles: {
      fontSize: { value: 16, unit: 'px' },
      lineHeight: { value: 1.6, unit: 'none' },
      color: '#444444',
    },
    canHaveChildren: false,
  },

  // Form Components
  {
    type: 'Button',
    name: 'Button',
    description: 'A clickable button',
    category: 'forms',
    icon: 'mouse-pointer',
    props: [
      { name: 'label', type: 'string', defaultValue: 'Button' },
      { name: 'variant', type: 'enum', enumValues: ['primary', 'secondary', 'outline', 'ghost'], defaultValue: 'primary' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], defaultValue: 'md' },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      padding: { value: 12, unit: 'px' },
      paddingLeft: { value: 24, unit: 'px' },
      paddingRight: { value: 24, unit: 'px' },
      backgroundColor: '#0066ff',
      color: '#ffffff',
      borderRadius: { value: 6, unit: 'px' },
      fontSize: { value: 14, unit: 'px' },
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
    },
    canHaveChildren: false,
  },
  {
    type: 'Input',
    name: 'Input',
    description: 'A text input field',
    category: 'forms',
    icon: 'edit',
    props: [
      { name: 'placeholder', type: 'string', defaultValue: 'Enter text...' },
      { name: 'type', type: 'enum', enumValues: ['text', 'email', 'password', 'number', 'tel', 'url'], defaultValue: 'text' },
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'required', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      padding: { value: 12, unit: 'px' },
      border: '1px solid #cccccc',
      borderRadius: { value: 6, unit: 'px' },
      fontSize: { value: 14, unit: 'px' },
      width: { value: 100, unit: '%' },
    },
    canHaveChildren: false,
  },
  {
    type: 'Textarea',
    name: 'Textarea',
    description: 'A multi-line text input',
    category: 'forms',
    icon: 'file-text',
    props: [
      { name: 'placeholder', type: 'string', defaultValue: 'Enter text...' },
      { name: 'rows', type: 'number', defaultValue: 4, min: 1 },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      padding: { value: 12, unit: 'px' },
      border: '1px solid #cccccc',
      borderRadius: { value: 6, unit: 'px' },
      fontSize: { value: 14, unit: 'px' },
      width: { value: 100, unit: '%' },
      resize: 'vertical',
    },
    canHaveChildren: false,
  },
  {
    type: 'Checkbox',
    name: 'Checkbox',
    description: 'A checkbox input',
    category: 'forms',
    icon: 'check-square',
    props: [
      { name: 'label', type: 'string', defaultValue: 'Checkbox label' },
      { name: 'checked', type: 'boolean', defaultValue: false },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      display: 'flex',
      alignItems: 'center',
      gap: { value: 8, unit: 'px' },
    },
    canHaveChildren: false,
  },
  {
    type: 'Select',
    name: 'Select',
    description: 'A dropdown select',
    category: 'forms',
    icon: 'chevron-down',
    props: [
      { name: 'placeholder', type: 'string', defaultValue: 'Select an option' },
      { name: 'options', type: 'array', defaultValue: ['Option 1', 'Option 2', 'Option 3'] },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      padding: { value: 12, unit: 'px' },
      border: '1px solid #cccccc',
      borderRadius: { value: 6, unit: 'px' },
      fontSize: { value: 14, unit: 'px' },
      width: { value: 100, unit: '%' },
    },
    canHaveChildren: false,
  },

  // Media Components
  {
    type: 'Image',
    name: 'Image',
    description: 'An image element',
    category: 'media',
    icon: 'image',
    props: [
      { name: 'src', type: 'image', defaultValue: 'https://via.placeholder.com/300x200' },
      { name: 'alt', type: 'string', defaultValue: 'Image description' },
      { name: 'objectFit', type: 'enum', enumValues: ['cover', 'contain', 'fill', 'none'], defaultValue: 'cover' },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
      height: { value: 200, unit: 'px' },
      objectFit: 'cover',
      borderRadius: { value: 4, unit: 'px' },
    },
    canHaveChildren: false,
  },
  {
    type: 'Video',
    name: 'Video',
    description: 'A video element',
    category: 'media',
    icon: 'video',
    props: [
      { name: 'src', type: 'string', defaultValue: '' },
      { name: 'poster', type: 'image', defaultValue: '' },
      { name: 'autoplay', type: 'boolean', defaultValue: false },
      { name: 'loop', type: 'boolean', defaultValue: false },
      { name: 'muted', type: 'boolean', defaultValue: false },
      { name: 'controls', type: 'boolean', defaultValue: true },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
      height: { value: 300, unit: 'px' },
      backgroundColor: '#000000',
    },
    canHaveChildren: false,
  },
  {
    type: 'Icon',
    name: 'Icon',
    description: 'An icon element',
    category: 'media',
    icon: 'star',
    props: [
      { name: 'name', type: 'string', defaultValue: 'star' },
      { name: 'size', type: 'number', defaultValue: 24, min: 8 },
      { name: 'color', type: 'color', defaultValue: '#333333' },
    ],
    defaultStyles: {
      width: { value: 24, unit: 'px' },
      height: { value: 24, unit: 'px' },
    },
    canHaveChildren: false,
  },

  // Data Display
  {
    type: 'Card',
    name: 'Card',
    description: 'A card container with shadow',
    category: 'data-display',
    icon: 'credit-card',
    props: [
      { name: 'elevation', type: 'enum', enumValues: ['sm', 'md', 'lg', 'xl'], defaultValue: 'md' },
    ],
    defaultStyles: {
      backgroundColor: '#ffffff',
      borderRadius: { value: 8, unit: 'px' },
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: { value: 16, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'Badge',
    name: 'Badge',
    description: 'A small badge or tag',
    category: 'data-display',
    icon: 'tag',
    props: [
      { name: 'label', type: 'string', defaultValue: 'Badge' },
      { name: 'variant', type: 'enum', enumValues: ['default', 'success', 'warning', 'error', 'info'], defaultValue: 'default' },
    ],
    defaultStyles: {
      display: 'inline-block',
      padding: { value: 4, unit: 'px' },
      paddingLeft: { value: 8, unit: 'px' },
      paddingRight: { value: 8, unit: 'px' },
      backgroundColor: '#e0e0e0',
      borderRadius: { value: 12, unit: 'px' },
      fontSize: { value: 12, unit: 'px' },
      fontWeight: 500,
    },
    canHaveChildren: false,
  },
  {
    type: 'Avatar',
    name: 'Avatar',
    description: 'A user avatar',
    category: 'data-display',
    icon: 'user',
    props: [
      { name: 'src', type: 'image', defaultValue: '' },
      { name: 'name', type: 'string', defaultValue: 'User' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg', 'xl'], defaultValue: 'md' },
    ],
    defaultStyles: {
      width: { value: 40, unit: 'px' },
      height: { value: 40, unit: 'px' },
      borderRadius: { value: 50, unit: '%' },
      backgroundColor: '#e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    canHaveChildren: false,
  },
  {
    type: 'Divider',
    name: 'Divider',
    description: 'A horizontal divider line',
    category: 'data-display',
    icon: 'minus',
    props: [
      { name: 'orientation', type: 'enum', enumValues: ['horizontal', 'vertical'], defaultValue: 'horizontal' },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
      height: { value: 1, unit: 'px' },
      backgroundColor: '#e0e0e0',
      margin: { value: 16, unit: 'px' },
      marginLeft: { value: 0, unit: 'px' },
      marginRight: { value: 0, unit: 'px' },
    },
    canHaveChildren: false,
  },

  // Navigation
  {
    type: 'Link',
    name: 'Link',
    description: 'A hyperlink',
    category: 'navigation',
    icon: 'link',
    props: [
      { name: 'href', type: 'string', defaultValue: '#' },
      { name: 'label', type: 'string', defaultValue: 'Link' },
      { name: 'target', type: 'enum', enumValues: ['_self', '_blank'], defaultValue: '_self' },
    ],
    defaultStyles: {
      color: '#0066ff',
      textDecoration: 'none',
      cursor: 'pointer',
    },
    canHaveChildren: false,
  },
  {
    type: 'NavItem',
    name: 'Nav Item',
    description: 'A navigation item',
    category: 'navigation',
    icon: 'navigation',
    props: [
      { name: 'label', type: 'string', defaultValue: 'Nav Item' },
      { name: 'href', type: 'string', defaultValue: '#' },
      { name: 'active', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      padding: { value: 8, unit: 'px' },
      paddingLeft: { value: 16, unit: 'px' },
      paddingRight: { value: 16, unit: 'px' },
      cursor: 'pointer',
    },
    canHaveChildren: false,
  },
];

/**
 * Built-in categories
 */
export const builtInCategories: ComponentCategory[] = [
  { id: 'layout', name: 'Layout', icon: 'layout', order: 1 },
  { id: 'typography', name: 'Typography', icon: 'type', order: 2 },
  { id: 'forms', name: 'Forms', icon: 'edit-3', order: 3 },
  { id: 'media', name: 'Media', icon: 'image', order: 4 },
  { id: 'data-display', name: 'Data Display', icon: 'grid', order: 5 },
  { id: 'navigation', name: 'Navigation', icon: 'navigation', order: 6 },
];

// ============================================================================
// Palette Item Component
// ============================================================================

export function PaletteItem({
  store,
  component,
  onDragStart,
  onDragEnd,
}: PaletteItemProps) {
  return (
    <Draggable
      store={store}
      componentType={component.type}
      data={{ props: {}, styles: component.defaultStyles }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          cursor: 'grab',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = '#0066ff';
          (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f9ff';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = '#e0e0e0';
          (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff';
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {getComponentIcon(component.icon)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>
            {component.name}
          </div>
          {component.description && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              {component.description}
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
}

/**
 * Get icon for component (simplified - in production use an icon library)
 */
function getComponentIcon(iconName?: string): string {
  const icons: Record<string, string> = {
    'square': '\u25A1',
    'columns': '\u2261',
    'grid': '\u2630',
    'layers': '\u29C9',
    'type': 'T',
    'heading': 'H',
    'align-left': '\u2261',
    'mouse-pointer': '\u25B2',
    'edit': '\u270E',
    'file-text': '\u2630',
    'check-square': '\u2611',
    'chevron-down': '\u25BC',
    'image': '\u2606',
    'video': '\u25B6',
    'star': '\u2605',
    'credit-card': '\u25A0',
    'tag': '\u2606',
    'user': '\u263A',
    'minus': '\u2014',
    'link': '\u26D3',
    'navigation': '\u2192',
    'layout': '\u25A4',
    'edit-3': '\u270E',
  };
  return icons[iconName || ''] || '\u25A1';
}

// ============================================================================
// Palette Category Component
// ============================================================================

export function PaletteCategory({
  category,
  components,
  store,
  isCollapsed = false,
  onToggle,
  onComponentDragStart,
  onComponentDragEnd,
}: PaletteCategoryProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 0',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={onToggle}
      >
        <span
          style={{
            transition: 'transform 0.2s ease',
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        >
          \u25BC
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#666' }}>
          {category.name}
        </span>
        <span style={{ fontSize: '11px', color: '#999' }}>
          ({components.length})
        </span>
      </div>

      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {components.map((component) => (
            <PaletteItem
              key={component.type}
              store={store}
              component={component}
              onDragStart={() => onComponentDragStart?.(component.type)}
              onDragEnd={(dropped) => onComponentDragEnd?.(component.type, dropped)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Palette Component
// ============================================================================

export function Palette({
  store,
  className,
  style,
  searchable = true,
  collapsible = true,
  onComponentDragStart,
  onComponentDragEnd,
}: PaletteProps) {
  const searchQuery = signal('');
  const collapsedCategories = signal<Set<string>>(new Set());

  // Register built-in components on mount
  effect(() => {
    for (const component of builtInComponents) {
      if (!store.components()[component.type]) {
        store.dispatch({ type: 'REGISTER_COMPONENT', payload: component });
      }
    }
  });

  // Get components grouped by category
  const groupedComponents = memo(() => {
    const components = store.components();
    const query = searchQuery().toLowerCase();

    const groups = new Map<string, ComponentDefinition[]>();

    for (const component of Object.values(components)) {
      // Filter by search query
      if (query) {
        const matchesName = component.name.toLowerCase().includes(query);
        const matchesType = component.type.toLowerCase().includes(query);
        const matchesDescription = component.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesType && !matchesDescription) continue;
      }

      const category = component.category || 'other';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(component);
    }

    return groups;
  });

  // Get sorted categories
  const sortedCategories = memo(() => {
    const groups = groupedComponents();
    const allCategories = [...builtInCategories];

    // Add any custom categories
    for (const categoryId of groups.keys()) {
      if (!allCategories.find((c) => c.id === categoryId)) {
        allCategories.push({ id: categoryId, name: categoryId, order: 999 });
      }
    }

    return allCategories
      .filter((c) => groups.has(c.id))
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  });

  const toggleCategory = (categoryId: string) => {
    if (!collapsible) return;

    const collapsed = new Set(collapsedCategories());
    if (collapsed.has(categoryId)) {
      collapsed.delete(categoryId);
    } else {
      collapsed.add(categoryId);
    }
    collapsedCategories.set(collapsed);
  };

  return (
    <div
      class={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#fafafa',
        borderRight: '1px solid #e0e0e0',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#333' }}>
          Components
        </h3>
      </div>

      {/* Search */}
      {searchable && (
        <div style={{ padding: '12px' }}>
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery()}
            onInput={(e) => searchQuery.set((e.target as HTMLInputElement).value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Component List */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px',
        }}
      >
        {sortedCategories().map((category) => (
          <PaletteCategory
            key={category.id}
            category={category}
            components={groupedComponents().get(category.id) || []}
            store={store}
            isCollapsed={collapsedCategories().has(category.id)}
            onToggle={() => toggleCategory(category.id)}
            onComponentDragStart={onComponentDragStart}
            onComponentDragEnd={onComponentDragEnd}
          />
        ))}

        {sortedCategories().length === 0 && (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#999',
              fontSize: '13px',
            }}
          >
            No components found
          </div>
        )}
      </div>
    </div>
  );
}

export default Palette;
