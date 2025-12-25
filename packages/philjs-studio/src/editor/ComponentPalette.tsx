import React, { useState, useMemo, useCallback } from 'react';
import { useEditorStore } from '../state/EditorStore';

// ============================================================================
// Types
// ============================================================================

export interface ComponentDefinition {
  type: string;
  name: string;
  description: string;
  category: ComponentCategory;
  icon: React.ReactNode;
  defaultProps?: Record<string, unknown>;
  tags?: string[];
}

export type ComponentCategory =
  | 'layout'
  | 'inputs'
  | 'display'
  | 'feedback'
  | 'navigation'
  | 'media'
  | 'data';

export interface ComponentPaletteProps {
  className?: string;
  style?: React.CSSProperties;
  onComponentSelect?: (type: string) => void;
  customComponents?: ComponentDefinition[];
}

// ============================================================================
// Default Component Library
// ============================================================================

const defaultComponents: ComponentDefinition[] = [
  // Layout
  {
    type: 'Container',
    name: 'Container',
    description: 'A flexible container for layout',
    category: 'layout',
    icon: <LayoutIcon />,
    tags: ['box', 'div', 'wrapper'],
  },
  {
    type: 'Card',
    name: 'Card',
    description: 'A card with optional header and footer',
    category: 'layout',
    icon: <CardIcon />,
    tags: ['panel', 'box'],
  },
  {
    type: 'Spacer',
    name: 'Spacer',
    description: 'Empty space for layout purposes',
    category: 'layout',
    icon: <SpacerIcon />,
    tags: ['gap', 'space'],
  },
  {
    type: 'Divider',
    name: 'Divider',
    description: 'A horizontal divider line',
    category: 'layout',
    icon: <DividerIcon />,
    tags: ['separator', 'line', 'hr'],
  },
  {
    type: 'Grid',
    name: 'Grid',
    description: 'CSS Grid container',
    category: 'layout',
    icon: <GridIcon />,
    tags: ['columns', 'rows'],
  },
  {
    type: 'Flex',
    name: 'Flex',
    description: 'Flexbox container',
    category: 'layout',
    icon: <FlexIcon />,
    tags: ['row', 'column'],
  },

  // Inputs
  {
    type: 'Button',
    name: 'Button',
    description: 'A clickable button',
    category: 'inputs',
    icon: <ButtonIcon />,
    defaultProps: { children: 'Button', variant: 'primary' },
    tags: ['click', 'action', 'submit'],
  },
  {
    type: 'Input',
    name: 'Text Input',
    description: 'A text input field',
    category: 'inputs',
    icon: <InputIcon />,
    defaultProps: { placeholder: 'Enter text...' },
    tags: ['text', 'field', 'form'],
  },
  {
    type: 'Textarea',
    name: 'Textarea',
    description: 'Multi-line text input',
    category: 'inputs',
    icon: <TextareaIcon />,
    tags: ['multiline', 'text', 'form'],
  },
  {
    type: 'Select',
    name: 'Select',
    description: 'Dropdown select input',
    category: 'inputs',
    icon: <SelectIcon />,
    tags: ['dropdown', 'options', 'form'],
  },
  {
    type: 'Checkbox',
    name: 'Checkbox',
    description: 'A checkbox input',
    category: 'inputs',
    icon: <CheckboxIcon />,
    tags: ['toggle', 'check', 'form'],
  },
  {
    type: 'Radio',
    name: 'Radio',
    description: 'Radio button group',
    category: 'inputs',
    icon: <RadioIcon />,
    tags: ['option', 'choice', 'form'],
  },
  {
    type: 'Switch',
    name: 'Switch',
    description: 'Toggle switch',
    category: 'inputs',
    icon: <SwitchIcon />,
    tags: ['toggle', 'boolean', 'form'],
  },
  {
    type: 'Slider',
    name: 'Slider',
    description: 'Range slider input',
    category: 'inputs',
    icon: <SliderIcon />,
    tags: ['range', 'number', 'form'],
  },

  // Display
  {
    type: 'Text',
    name: 'Text',
    description: 'A text paragraph',
    category: 'display',
    icon: <TextIcon />,
    defaultProps: { children: 'Text content' },
    tags: ['paragraph', 'content'],
  },
  {
    type: 'Heading',
    name: 'Heading',
    description: 'A heading element (h1-h6)',
    category: 'display',
    icon: <HeadingIcon />,
    defaultProps: { level: 1, children: 'Heading' },
    tags: ['title', 'h1', 'h2', 'h3'],
  },
  {
    type: 'Badge',
    name: 'Badge',
    description: 'Status or label badge',
    category: 'display',
    icon: <BadgeIcon />,
    tags: ['tag', 'label', 'status'],
  },
  {
    type: 'Avatar',
    name: 'Avatar',
    description: 'User avatar image',
    category: 'display',
    icon: <AvatarIcon />,
    tags: ['user', 'profile', 'image'],
  },
  {
    type: 'Icon',
    name: 'Icon',
    description: 'SVG icon',
    category: 'display',
    icon: <IconIcon />,
    tags: ['svg', 'symbol'],
  },

  // Media
  {
    type: 'Image',
    name: 'Image',
    description: 'An image element',
    category: 'media',
    icon: <ImageIcon />,
    defaultProps: { src: '', alt: 'Image' },
    tags: ['picture', 'photo', 'img'],
  },
  {
    type: 'Video',
    name: 'Video',
    description: 'Video player',
    category: 'media',
    icon: <VideoIcon />,
    tags: ['player', 'media'],
  },

  // Feedback
  {
    type: 'Alert',
    name: 'Alert',
    description: 'Alert message box',
    category: 'feedback',
    icon: <AlertIcon />,
    tags: ['message', 'notification', 'warning'],
  },
  {
    type: 'Progress',
    name: 'Progress',
    description: 'Progress bar',
    category: 'feedback',
    icon: <ProgressIcon />,
    tags: ['loading', 'bar', 'percent'],
  },
  {
    type: 'Spinner',
    name: 'Spinner',
    description: 'Loading spinner',
    category: 'feedback',
    icon: <SpinnerIcon />,
    tags: ['loading', 'wait'],
  },
  {
    type: 'Tooltip',
    name: 'Tooltip',
    description: 'Hover tooltip',
    category: 'feedback',
    icon: <TooltipIcon />,
    tags: ['hint', 'help', 'info'],
  },

  // Navigation
  {
    type: 'Link',
    name: 'Link',
    description: 'Hyperlink element',
    category: 'navigation',
    icon: <LinkIcon />,
    tags: ['anchor', 'href', 'url'],
  },
  {
    type: 'Tabs',
    name: 'Tabs',
    description: 'Tab navigation',
    category: 'navigation',
    icon: <TabsIcon />,
    tags: ['panel', 'switch'],
  },
  {
    type: 'Breadcrumb',
    name: 'Breadcrumb',
    description: 'Breadcrumb navigation',
    category: 'navigation',
    icon: <BreadcrumbIcon />,
    tags: ['path', 'trail'],
  },

  // Data
  {
    type: 'Table',
    name: 'Table',
    description: 'Data table',
    category: 'data',
    icon: <TableIcon />,
    tags: ['grid', 'list', 'rows'],
  },
  {
    type: 'List',
    name: 'List',
    description: 'List of items',
    category: 'data',
    icon: <ListIcon />,
    tags: ['items', 'ul', 'ol'],
  },
];

const categoryLabels: Record<ComponentCategory, string> = {
  layout: 'Layout',
  inputs: 'Inputs',
  display: 'Display',
  feedback: 'Feedback',
  navigation: 'Navigation',
  media: 'Media',
  data: 'Data',
};

const categoryOrder: ComponentCategory[] = [
  'layout',
  'inputs',
  'display',
  'media',
  'feedback',
  'navigation',
  'data',
];

// ============================================================================
// Icons
// ============================================================================

function LayoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="16" height="16" rx="2" />
      <line x1="2" y1="7" x2="18" y2="7" />
      <line x1="7" y1="7" x2="7" y2="18" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <line x1="2" y1="8" x2="18" y2="8" />
    </svg>
  );
}

function SpacerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="3" y1="10" x2="17" y2="10" strokeDasharray="2 2" />
      <line x1="10" y1="3" x2="10" y2="17" strokeDasharray="2 2" />
    </svg>
  );
}

function DividerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="2" y1="10" x2="18" y2="10" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="6" height="6" rx="1" />
      <rect x="12" y="2" width="6" height="6" rx="1" />
      <rect x="2" y="12" width="6" height="6" rx="1" />
      <rect x="12" y="12" width="6" height="6" rx="1" />
    </svg>
  );
}

function FlexIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="4" height="8" rx="1" />
      <rect x="8" y="4" width="4" height="12" rx="1" />
      <rect x="14" y="7" width="4" height="6" rx="1" />
    </svg>
  );
}

function ButtonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="16" height="10" rx="5" />
    </svg>
  );
}

function InputIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="16" height="10" rx="2" />
      <line x1="5" y1="10" x2="5" y2="10.01" strokeWidth="2" />
    </svg>
  );
}

function TextareaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <line x1="5" y1="7" x2="15" y2="7" />
      <line x1="5" y1="10" x2="12" y2="10" />
      <line x1="5" y1="13" x2="10" y2="13" />
    </svg>
  );
}

function SelectIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="16" height="10" rx="2" />
      <polyline points="13,8 15,10 13,12" />
    </svg>
  );
}

function CheckboxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <polyline points="6,10 9,13 14,7" />
    </svg>
  );
}

function RadioIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="3" fill="currentColor" />
    </svg>
  );
}

function SwitchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="16" height="8" rx="4" />
      <circle cx="14" cy="10" r="2.5" fill="currentColor" />
    </svg>
  );
}

function SliderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="2" y1="10" x2="18" y2="10" />
      <circle cx="12" cy="10" r="3" fill="currentColor" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="4" y1="6" x2="16" y2="6" />
      <line x1="4" y1="10" x2="14" y2="10" />
      <line x1="4" y1="14" x2="10" y2="14" />
    </svg>
  );
}

function HeadingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <text x="3" y="15" fontSize="14" fill="currentColor" stroke="none" fontWeight="bold">H</text>
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="7" width="14" height="6" rx="3" />
    </svg>
  );
}

function AvatarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="8" r="3" />
      <path d="M4 17c0-3 3-5 6-5s6 2 6 5" />
    </svg>
  );
}

function IconIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <circle cx="7" cy="8" r="1.5" />
      <path d="M18 13l-4-4-6 6" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="12" height="12" rx="2" />
      <path d="M14 8l4-2v8l-4-2" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2L2 17h16L10 2z" />
      <line x1="10" y1="7" x2="10" y2="11" />
      <circle cx="10" cy="14" r="0.5" fill="currentColor" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="8" width="16" height="4" rx="2" />
      <rect x="2" y="8" width="10" height="4" rx="2" fill="currentColor" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="7" opacity="0.3" />
      <path d="M10 3a7 7 0 0 1 7 7" />
    </svg>
  );
}

function TooltipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="16" height="10" rx="2" />
      <polygon points="8,13 10,16 12,13" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 12l4-4" />
      <path d="M11 7h2a3 3 0 0 1 0 6h-2" />
      <path d="M9 13H7a3 3 0 0 1 0-6h2" />
    </svg>
  );
}

function TabsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="16" height="12" rx="2" />
      <rect x="2" y="5" width="6" height="4" rx="1" fill="currentColor" opacity="0.3" />
      <line x1="8" y1="5" x2="8" y2="9" />
      <line x1="12" y1="5" x2="12" y2="9" />
    </svg>
  );
}

function BreadcrumbIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="4" cy="10" r="1.5" fill="currentColor" />
      <line x1="6" y1="10" x2="8" y2="10" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <line x1="12" y1="10" x2="14" y2="10" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <line x1="2" y1="8" x2="18" y2="8" />
      <line x1="2" y1="13" x2="18" y2="13" />
      <line x1="8" y1="3" x2="8" y2="17" />
      <line x1="13" y1="3" x2="13" y2="17" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="4" cy="5" r="1" fill="currentColor" />
      <line x1="8" y1="5" x2="17" y2="5" />
      <circle cx="4" cy="10" r="1" fill="currentColor" />
      <line x1="8" y1="10" x2="17" y2="10" />
      <circle cx="4" cy="15" r="1" fill="currentColor" />
      <line x1="8" y1="15" x2="17" y2="15" />
    </svg>
  );
}

// ============================================================================
// Component Palette Item
// ============================================================================

interface PaletteItemProps {
  component: ComponentDefinition;
  onDragStart: (type: string) => void;
  onDragEnd: () => void;
  onClick?: () => void;
}

const PaletteItem: React.FC<PaletteItemProps> = ({
  component,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('component/type', component.type);
      e.dataTransfer.effectAllowed = 'copy';
      onDragStart(component.type);
    },
    [component.type, onDragStart]
  );

  return (
    <div
      className="palette-item"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 8px',
        backgroundColor: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        cursor: 'grab',
        transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#3B82F6';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#E5E7EB';
        e.currentTarget.style.boxShadow = 'none';
      }}
      title={component.description}
    >
      <div
        style={{
          color: '#6B7280',
          marginBottom: 6,
        }}
      >
        {component.icon}
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#374151',
          textAlign: 'center',
        }}
      >
        {component.name}
      </span>
    </div>
  );
};

// ============================================================================
// Main Component Palette
// ============================================================================

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  className,
  style,
  onComponentSelect,
  customComponents = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<ComponentCategory>>(
    new Set(categoryOrder)
  );

  const { setDragging, setDragSource } = useEditorStore();

  const allComponents = useMemo(
    () => [...defaultComponents, ...customComponents],
    [customComponents]
  );

  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return allComponents;

    const query = searchQuery.toLowerCase();
    return allComponents.filter(
      (comp) =>
        comp.name.toLowerCase().includes(query) ||
        comp.type.toLowerCase().includes(query) ||
        comp.description.toLowerCase().includes(query) ||
        comp.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [allComponents, searchQuery]);

  const groupedComponents = useMemo(() => {
    const groups: Record<ComponentCategory, ComponentDefinition[]> = {
      layout: [],
      inputs: [],
      display: [],
      feedback: [],
      navigation: [],
      media: [],
      data: [],
    };

    for (const comp of filteredComponents) {
      groups[comp.category].push(comp);
    }

    return groups;
  }, [filteredComponents]);

  const toggleCategory = useCallback((category: ComponentCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleDragStart = useCallback(
    (type: string) => {
      setDragging(true);
      setDragSource({ type: 'palette', componentType: type });
    },
    [setDragging, setDragSource]
  );

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    setDragSource(null);
  }, [setDragging, setDragSource]);

  return (
    <div
      className={`component-palette ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 240,
        height: '100%',
        backgroundColor: '#F9FAFB',
        borderRight: '1px solid #E5E7EB',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: '#111827',
            marginBottom: 12,
          }}
        >
          Components
        </h3>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              fontSize: 13,
              outline: 'none',
              backgroundColor: '#fff',
              boxSizing: 'border-box',
            }}
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="#9CA3AF"
            strokeWidth="1.5"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <circle cx="7" cy="7" r="4" />
            <line x1="10" y1="10" x2="14" y2="14" />
          </svg>
        </div>
      </div>

      {/* Component list */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 12px',
        }}
      >
        {categoryOrder.map((category) => {
          const components = groupedComponents[category];
          if (components.length === 0) return null;

          const isExpanded = expandedCategories.has(category);

          return (
            <div key={category} style={{ marginBottom: 8 }}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <span>{categoryLabels[category]}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="2,4 6,8 10,4" />
                </svg>
              </button>

              {/* Components grid */}
              {isExpanded && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {components.map((comp) => (
                    <PaletteItem
                      key={comp.type}
                      component={comp}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onClick={() => onComponentSelect?.(comp.type)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredComponents.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 16px',
              color: '#9CA3AF',
              fontSize: 13,
            }}
          >
            No components found
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentPalette;
