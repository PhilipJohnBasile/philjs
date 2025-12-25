/**
 * Extended Component Library for the Visual Builder
 * Provides a comprehensive set of draggable UI components
 */

import type {
  ComponentDefinition,
  ComponentCategory,
  PropDefinition,
  NodeStyles,
} from '../types.js';

// ============================================================================
// Component Categories
// ============================================================================

export const componentCategories: ComponentCategory[] = [
  { id: 'layout', name: 'Layout', icon: 'layout', order: 1, description: 'Container and layout components' },
  { id: 'typography', name: 'Typography', icon: 'type', order: 2, description: 'Text and heading components' },
  { id: 'forms', name: 'Forms', icon: 'edit-3', order: 3, description: 'Form input components' },
  { id: 'media', name: 'Media', icon: 'image', order: 4, description: 'Image, video, and icon components' },
  { id: 'data-display', name: 'Data Display', icon: 'grid', order: 5, description: 'Cards, badges, and data components' },
  { id: 'navigation', name: 'Navigation', icon: 'navigation', order: 6, description: 'Links and navigation components' },
  { id: 'feedback', name: 'Feedback', icon: 'alert-circle', order: 7, description: 'Alerts, toasts, and feedback components' },
  { id: 'overlay', name: 'Overlay', icon: 'layers', order: 8, description: 'Modals, dialogs, and overlays' },
];

// ============================================================================
// Layout Components
// ============================================================================

const layoutComponents: ComponentDefinition[] = [
  {
    type: 'Container',
    name: 'Container',
    description: 'A responsive container with max-width constraints',
    category: 'layout',
    icon: 'box',
    props: [
      { name: 'maxWidth', type: 'enum', enumValues: ['sm', 'md', 'lg', 'xl', 'full'], defaultValue: 'lg', description: 'Maximum width of the container' },
      { name: 'centered', type: 'boolean', defaultValue: true, description: 'Center the container horizontally' },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
      maxWidth: { value: 1200, unit: 'px' },
      marginLeft: { value: 0, unit: 'auto' },
      marginRight: { value: 0, unit: 'auto' },
      paddingLeft: { value: 16, unit: 'px' },
      paddingRight: { value: 16, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
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
      { name: 'direction', type: 'enum', enumValues: ['row', 'column', 'row-reverse', 'column-reverse'], defaultValue: 'row', group: 'Layout' },
      { name: 'wrap', type: 'enum', enumValues: ['nowrap', 'wrap', 'wrap-reverse'], defaultValue: 'nowrap', group: 'Layout' },
      { name: 'justify', type: 'enum', enumValues: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'], defaultValue: 'flex-start', group: 'Alignment' },
      { name: 'align', type: 'enum', enumValues: ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'], defaultValue: 'stretch', group: 'Alignment' },
      { name: 'gap', type: 'number', defaultValue: 8, min: 0, group: 'Spacing' },
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
      { name: 'columns', type: 'number', defaultValue: 2, min: 1, max: 12, group: 'Grid' },
      { name: 'rows', type: 'number', defaultValue: 2, min: 1, group: 'Grid' },
      { name: 'gap', type: 'number', defaultValue: 8, min: 0, group: 'Spacing' },
      { name: 'rowGap', type: 'number', defaultValue: 8, min: 0, group: 'Spacing' },
      { name: 'columnGap', type: 'number', defaultValue: 8, min: 0, group: 'Spacing' },
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
    description: 'A vertical stack of elements with consistent spacing',
    category: 'layout',
    icon: 'layers',
    props: [
      { name: 'spacing', type: 'number', defaultValue: 8, min: 0 },
      { name: 'align', type: 'enum', enumValues: ['stretch', 'flex-start', 'center', 'flex-end'], defaultValue: 'stretch' },
    ],
    defaultStyles: {
      display: 'flex',
      flexDirection: 'column',
      gap: { value: 8, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'HStack',
    name: 'Horizontal Stack',
    description: 'A horizontal stack of elements',
    category: 'layout',
    icon: 'columns',
    props: [
      { name: 'spacing', type: 'number', defaultValue: 8, min: 0 },
      { name: 'align', type: 'enum', enumValues: ['stretch', 'flex-start', 'center', 'flex-end'], defaultValue: 'center' },
    ],
    defaultStyles: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: { value: 8, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'Center',
    name: 'Center',
    description: 'Centers its children horizontally and vertically',
    category: 'layout',
    icon: 'crosshair',
    props: [],
    defaultStyles: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'Spacer',
    name: 'Spacer',
    description: 'A flexible spacer that expands to fill available space',
    category: 'layout',
    icon: 'move',
    props: [],
    defaultStyles: {
      flex: '1',
    },
    canHaveChildren: false,
  },
  {
    type: 'AspectRatio',
    name: 'Aspect Ratio',
    description: 'Maintains a consistent aspect ratio for content',
    category: 'layout',
    icon: 'maximize',
    props: [
      { name: 'ratio', type: 'number', defaultValue: 16 / 9, step: 0.1, min: 0.1 },
    ],
    defaultStyles: {
      position: 'relative',
      width: { value: 100, unit: '%' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
];

// ============================================================================
// Typography Components
// ============================================================================

const typographyComponents: ComponentDefinition[] = [
  {
    type: 'Text',
    name: 'Text',
    description: 'A text element for inline or block text',
    category: 'typography',
    icon: 'type',
    props: [
      { name: 'content', type: 'string', defaultValue: 'Text content', description: 'The text to display' },
      { name: 'as', type: 'enum', enumValues: ['span', 'p', 'div', 'label'], defaultValue: 'span' },
      { name: 'truncate', type: 'boolean', defaultValue: false },
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
    description: 'A heading element (h1-h6)',
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
      marginBottom: { value: 16, unit: 'px' },
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
      { name: 'content', type: 'string', defaultValue: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    ],
    defaultStyles: {
      fontSize: { value: 16, unit: 'px' },
      lineHeight: { value: 1.6, unit: 'none' },
      color: '#444444',
      marginBottom: { value: 16, unit: 'px' },
    },
    canHaveChildren: false,
  },
  {
    type: 'Code',
    name: 'Code',
    description: 'Inline code or code block',
    category: 'typography',
    icon: 'code',
    props: [
      { name: 'content', type: 'string', defaultValue: 'const x = 42;' },
      { name: 'language', type: 'enum', enumValues: ['javascript', 'typescript', 'html', 'css', 'json', 'text'], defaultValue: 'javascript' },
      { name: 'block', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      fontFamily: 'monospace',
      fontSize: { value: 14, unit: 'px' },
      backgroundColor: '#f5f5f5',
      padding: { value: 4, unit: 'px' },
      borderRadius: { value: 4, unit: 'px' },
    },
    canHaveChildren: false,
  },
  {
    type: 'Quote',
    name: 'Quote',
    description: 'A blockquote element',
    category: 'typography',
    icon: 'message-square',
    props: [
      { name: 'content', type: 'string', defaultValue: 'This is a quote.' },
      { name: 'author', type: 'string', defaultValue: '' },
    ],
    defaultStyles: {
      borderLeft: '4px solid #0066ff',
      paddingLeft: { value: 16, unit: 'px' },
      marginLeft: { value: 0, unit: 'px' },
      fontStyle: 'italic',
      color: '#666666',
    },
    canHaveChildren: false,
  },
  {
    type: 'Label',
    name: 'Label',
    description: 'A form label element',
    category: 'typography',
    icon: 'tag',
    props: [
      { name: 'content', type: 'string', defaultValue: 'Label' },
      { name: 'htmlFor', type: 'string', defaultValue: '' },
      { name: 'required', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      display: 'block',
      fontSize: { value: 14, unit: 'px' },
      fontWeight: 500,
      color: '#333333',
      marginBottom: { value: 4, unit: 'px' },
    },
    canHaveChildren: false,
  },
];

// ============================================================================
// Form Components
// ============================================================================

const formComponents: ComponentDefinition[] = [
  {
    type: 'Form',
    name: 'Form',
    description: 'A form container',
    category: 'forms',
    icon: 'file-text',
    props: [
      { name: 'action', type: 'string', defaultValue: '' },
      { name: 'method', type: 'enum', enumValues: ['get', 'post'], defaultValue: 'post' },
    ],
    defaultStyles: {
      display: 'flex',
      flexDirection: 'column',
      gap: { value: 16, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'FormField',
    name: 'Form Field',
    description: 'A form field wrapper with label and error message',
    category: 'forms',
    icon: 'edit-3',
    props: [
      { name: 'label', type: 'string', defaultValue: 'Field Label' },
      { name: 'error', type: 'string', defaultValue: '' },
      { name: 'hint', type: 'string', defaultValue: '' },
      { name: 'required', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      display: 'flex',
      flexDirection: 'column',
      gap: { value: 4, unit: 'px' },
      marginBottom: { value: 16, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'Button',
    name: 'Button',
    description: 'A clickable button',
    category: 'forms',
    icon: 'mouse-pointer',
    props: [
      { name: 'label', type: 'string', defaultValue: 'Button', group: 'Content' },
      { name: 'variant', type: 'enum', enumValues: ['primary', 'secondary', 'outline', 'ghost', 'destructive'], defaultValue: 'primary', group: 'Appearance' },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg', 'xl'], defaultValue: 'md', group: 'Appearance' },
      { name: 'disabled', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'loading', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'fullWidth', type: 'boolean', defaultValue: false, group: 'Layout' },
      { name: 'type', type: 'enum', enumValues: ['button', 'submit', 'reset'], defaultValue: 'button', group: 'Behavior' },
    ],
    defaultStyles: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
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
      { name: 'placeholder', type: 'string', defaultValue: 'Enter text...', group: 'Content' },
      { name: 'type', type: 'enum', enumValues: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'datetime-local'], defaultValue: 'text', group: 'Input Type' },
      { name: 'disabled', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'required', type: 'boolean', defaultValue: false, group: 'Validation' },
      { name: 'readOnly', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'min', type: 'number', group: 'Validation' },
      { name: 'max', type: 'number', group: 'Validation' },
      { name: 'pattern', type: 'string', group: 'Validation' },
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
      { name: 'required', type: 'boolean', defaultValue: false },
      { name: 'maxLength', type: 'number' },
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
      { name: 'indeterminate', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      display: 'flex',
      alignItems: 'center',
      gap: { value: 8, unit: 'px' },
      cursor: 'pointer',
    },
    canHaveChildren: false,
  },
  {
    type: 'Radio',
    name: 'Radio Button',
    description: 'A radio button input',
    category: 'forms',
    icon: 'circle',
    props: [
      { name: 'label', type: 'string', defaultValue: 'Radio option' },
      { name: 'value', type: 'string', defaultValue: '' },
      { name: 'name', type: 'string', defaultValue: 'radio-group' },
      { name: 'checked', type: 'boolean', defaultValue: false },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      display: 'flex',
      alignItems: 'center',
      gap: { value: 8, unit: 'px' },
      cursor: 'pointer',
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
      { name: 'required', type: 'boolean', defaultValue: false },
      { name: 'multiple', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      padding: { value: 12, unit: 'px' },
      border: '1px solid #cccccc',
      borderRadius: { value: 6, unit: 'px' },
      fontSize: { value: 14, unit: 'px' },
      width: { value: 100, unit: '%' },
      backgroundColor: '#ffffff',
    },
    canHaveChildren: false,
  },
  {
    type: 'Switch',
    name: 'Switch',
    description: 'A toggle switch',
    category: 'forms',
    icon: 'toggle-left',
    props: [
      { name: 'label', type: 'string', defaultValue: 'Toggle switch' },
      { name: 'checked', type: 'boolean', defaultValue: false },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      display: 'flex',
      alignItems: 'center',
      gap: { value: 8, unit: 'px' },
      cursor: 'pointer',
    },
    canHaveChildren: false,
  },
  {
    type: 'Slider',
    name: 'Slider',
    description: 'A range slider input',
    category: 'forms',
    icon: 'sliders',
    props: [
      { name: 'min', type: 'number', defaultValue: 0 },
      { name: 'max', type: 'number', defaultValue: 100 },
      { name: 'step', type: 'number', defaultValue: 1 },
      { name: 'value', type: 'number', defaultValue: 50 },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
    },
    canHaveChildren: false,
  },
];

// ============================================================================
// Media Components
// ============================================================================

const mediaComponents: ComponentDefinition[] = [
  {
    type: 'Image',
    name: 'Image',
    description: 'An image element',
    category: 'media',
    icon: 'image',
    props: [
      { name: 'src', type: 'image', defaultValue: 'https://via.placeholder.com/300x200', description: 'Image source URL' },
      { name: 'alt', type: 'string', defaultValue: 'Image description', description: 'Alt text for accessibility' },
      { name: 'objectFit', type: 'enum', enumValues: ['cover', 'contain', 'fill', 'none', 'scale-down'], defaultValue: 'cover' },
      { name: 'loading', type: 'enum', enumValues: ['eager', 'lazy'], defaultValue: 'lazy' },
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
      { name: 'strokeWidth', type: 'number', defaultValue: 2, min: 1, max: 4 },
    ],
    defaultStyles: {
      width: { value: 24, unit: 'px' },
      height: { value: 24, unit: 'px' },
    },
    canHaveChildren: false,
  },
  {
    type: 'Avatar',
    name: 'Avatar',
    description: 'A user avatar with image or initials',
    category: 'media',
    icon: 'user',
    props: [
      { name: 'src', type: 'image', defaultValue: '' },
      { name: 'name', type: 'string', defaultValue: 'User Name' },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg', 'xl'], defaultValue: 'md' },
    ],
    defaultStyles: {
      width: { value: 40, unit: 'px' },
      height: { value: 40, unit: 'px' },
      borderRadius: { value: 50, unit: '%' },
      backgroundColor: '#e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    canHaveChildren: false,
  },
  {
    type: 'Iframe',
    name: 'Iframe',
    description: 'An embedded iframe',
    category: 'media',
    icon: 'globe',
    props: [
      { name: 'src', type: 'string', defaultValue: '' },
      { name: 'title', type: 'string', defaultValue: 'Embedded content' },
      { name: 'allowFullscreen', type: 'boolean', defaultValue: true },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
      height: { value: 400, unit: 'px' },
      border: 'none',
    },
    canHaveChildren: false,
  },
];

// ============================================================================
// Data Display Components
// ============================================================================

const dataDisplayComponents: ComponentDefinition[] = [
  {
    type: 'Card',
    name: 'Card',
    description: 'A card container with shadow',
    category: 'data-display',
    icon: 'credit-card',
    props: [
      { name: 'elevation', type: 'enum', enumValues: ['none', 'sm', 'md', 'lg', 'xl'], defaultValue: 'md' },
      { name: 'hoverable', type: 'boolean', defaultValue: false },
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
    type: 'CardHeader',
    name: 'Card Header',
    description: 'Header section of a card',
    category: 'data-display',
    icon: 'credit-card',
    props: [],
    defaultStyles: {
      paddingBottom: { value: 12, unit: 'px' },
      borderBottom: '1px solid #e0e0e0',
      marginBottom: { value: 12, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
    allowedParents: ['Card'],
  },
  {
    type: 'CardBody',
    name: 'Card Body',
    description: 'Body content of a card',
    category: 'data-display',
    icon: 'credit-card',
    props: [],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
    allowedParents: ['Card'],
  },
  {
    type: 'CardFooter',
    name: 'Card Footer',
    description: 'Footer section of a card',
    category: 'data-display',
    icon: 'credit-card',
    props: [],
    defaultStyles: {
      paddingTop: { value: 12, unit: 'px' },
      borderTop: '1px solid #e0e0e0',
      marginTop: { value: 12, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
    allowedParents: ['Card'],
  },
  {
    type: 'Badge',
    name: 'Badge',
    description: 'A small badge or tag',
    category: 'data-display',
    icon: 'tag',
    props: [
      { name: 'label', type: 'string', defaultValue: 'Badge' },
      { name: 'variant', type: 'enum', enumValues: ['default', 'primary', 'success', 'warning', 'error', 'info'], defaultValue: 'default' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], defaultValue: 'md' },
    ],
    defaultStyles: {
      display: 'inline-flex',
      alignItems: 'center',
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
    type: 'Divider',
    name: 'Divider',
    description: 'A horizontal or vertical divider line',
    category: 'data-display',
    icon: 'minus',
    props: [
      { name: 'orientation', type: 'enum', enumValues: ['horizontal', 'vertical'], defaultValue: 'horizontal' },
      { name: 'label', type: 'string', defaultValue: '' },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
      height: { value: 1, unit: 'px' },
      backgroundColor: '#e0e0e0',
      marginTop: { value: 16, unit: 'px' },
      marginBottom: { value: 16, unit: 'px' },
    },
    canHaveChildren: false,
  },
  {
    type: 'List',
    name: 'List',
    description: 'A list container',
    category: 'data-display',
    icon: 'list',
    props: [
      { name: 'ordered', type: 'boolean', defaultValue: false },
      { name: 'spacing', type: 'number', defaultValue: 8, min: 0 },
    ],
    defaultStyles: {
      display: 'flex',
      flexDirection: 'column',
      gap: { value: 8, unit: 'px' },
      padding: { value: 0, unit: 'px' },
      margin: { value: 0, unit: 'px' },
      listStyle: 'none',
    },
    canHaveChildren: true,
    isContainer: true,
    allowedChildren: ['ListItem'],
  },
  {
    type: 'ListItem',
    name: 'List Item',
    description: 'An item in a list',
    category: 'data-display',
    icon: 'list',
    props: [],
    defaultStyles: {
      display: 'flex',
      alignItems: 'center',
      padding: { value: 8, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
    allowedParents: ['List'],
  },
  {
    type: 'Table',
    name: 'Table',
    description: 'A data table',
    category: 'data-display',
    icon: 'grid',
    props: [
      { name: 'striped', type: 'boolean', defaultValue: false },
      { name: 'bordered', type: 'boolean', defaultValue: false },
      { name: 'hoverable', type: 'boolean', defaultValue: true },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
      borderCollapse: 'collapse',
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'Accordion',
    name: 'Accordion',
    description: 'An expandable accordion',
    category: 'data-display',
    icon: 'chevron-down',
    props: [
      { name: 'allowMultiple', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      border: '1px solid #e0e0e0',
      borderRadius: { value: 8, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'Tabs',
    name: 'Tabs',
    description: 'A tabbed content container',
    category: 'data-display',
    icon: 'folder',
    props: [
      { name: 'defaultTab', type: 'number', defaultValue: 0 },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
];

// ============================================================================
// Navigation Components
// ============================================================================

const navigationComponents: ComponentDefinition[] = [
  {
    type: 'Link',
    name: 'Link',
    description: 'A hyperlink',
    category: 'navigation',
    icon: 'link',
    props: [
      { name: 'href', type: 'string', defaultValue: '#' },
      { name: 'label', type: 'string', defaultValue: 'Link' },
      { name: 'target', type: 'enum', enumValues: ['_self', '_blank', '_parent', '_top'], defaultValue: '_self' },
    ],
    defaultStyles: {
      color: '#0066ff',
      textDecoration: 'none',
      cursor: 'pointer',
    },
    canHaveChildren: false,
  },
  {
    type: 'Nav',
    name: 'Navigation',
    description: 'A navigation container',
    category: 'navigation',
    icon: 'navigation',
    props: [
      { name: 'orientation', type: 'enum', enumValues: ['horizontal', 'vertical'], defaultValue: 'horizontal' },
    ],
    defaultStyles: {
      display: 'flex',
      gap: { value: 16, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
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
      { name: 'icon', type: 'string', defaultValue: '' },
    ],
    defaultStyles: {
      padding: { value: 8, unit: 'px' },
      paddingLeft: { value: 16, unit: 'px' },
      paddingRight: { value: 16, unit: 'px' },
      cursor: 'pointer',
      borderRadius: { value: 4, unit: 'px' },
    },
    canHaveChildren: false,
    allowedParents: ['Nav'],
  },
  {
    type: 'Breadcrumb',
    name: 'Breadcrumb',
    description: 'A breadcrumb navigation',
    category: 'navigation',
    icon: 'chevrons-right',
    props: [
      { name: 'separator', type: 'string', defaultValue: '/' },
    ],
    defaultStyles: {
      display: 'flex',
      alignItems: 'center',
      gap: { value: 8, unit: 'px' },
      fontSize: { value: 14, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'Menu',
    name: 'Menu',
    description: 'A dropdown menu',
    category: 'navigation',
    icon: 'menu',
    props: [
      { name: 'trigger', type: 'string', defaultValue: 'Menu' },
    ],
    defaultStyles: {
      position: 'relative',
    },
    canHaveChildren: true,
    isContainer: true,
  },
];

// ============================================================================
// Feedback Components
// ============================================================================

const feedbackComponents: ComponentDefinition[] = [
  {
    type: 'Alert',
    name: 'Alert',
    description: 'An alert message',
    category: 'feedback',
    icon: 'alert-circle',
    props: [
      { name: 'title', type: 'string', defaultValue: 'Alert' },
      { name: 'message', type: 'string', defaultValue: 'This is an alert message.' },
      { name: 'variant', type: 'enum', enumValues: ['info', 'success', 'warning', 'error'], defaultValue: 'info' },
      { name: 'dismissible', type: 'boolean', defaultValue: false },
    ],
    defaultStyles: {
      padding: { value: 16, unit: 'px' },
      borderRadius: { value: 8, unit: 'px' },
      backgroundColor: '#e8f4fd',
      border: '1px solid #b8daff',
      color: '#004085',
    },
    canHaveChildren: false,
  },
  {
    type: 'Progress',
    name: 'Progress Bar',
    description: 'A progress bar',
    category: 'feedback',
    icon: 'loader',
    props: [
      { name: 'value', type: 'number', defaultValue: 50, min: 0, max: 100 },
      { name: 'max', type: 'number', defaultValue: 100 },
      { name: 'showLabel', type: 'boolean', defaultValue: true },
      { name: 'variant', type: 'enum', enumValues: ['default', 'success', 'warning', 'error'], defaultValue: 'default' },
    ],
    defaultStyles: {
      height: { value: 8, unit: 'px' },
      width: { value: 100, unit: '%' },
      backgroundColor: '#e0e0e0',
      borderRadius: { value: 4, unit: 'px' },
      overflow: 'hidden',
    },
    canHaveChildren: false,
  },
  {
    type: 'Spinner',
    name: 'Spinner',
    description: 'A loading spinner',
    category: 'feedback',
    icon: 'loader',
    props: [
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], defaultValue: 'md' },
      { name: 'color', type: 'color', defaultValue: '#0066ff' },
    ],
    defaultStyles: {
      width: { value: 24, unit: 'px' },
      height: { value: 24, unit: 'px' },
    },
    canHaveChildren: false,
  },
  {
    type: 'Skeleton',
    name: 'Skeleton',
    description: 'A loading skeleton placeholder',
    category: 'feedback',
    icon: 'box',
    props: [
      { name: 'variant', type: 'enum', enumValues: ['text', 'circular', 'rectangular'], defaultValue: 'text' },
      { name: 'animation', type: 'enum', enumValues: ['pulse', 'wave', 'none'], defaultValue: 'pulse' },
    ],
    defaultStyles: {
      height: { value: 20, unit: 'px' },
      width: { value: 100, unit: '%' },
      backgroundColor: '#e0e0e0',
      borderRadius: { value: 4, unit: 'px' },
    },
    canHaveChildren: false,
  },
  {
    type: 'Tooltip',
    name: 'Tooltip',
    description: 'A tooltip wrapper',
    category: 'feedback',
    icon: 'message-square',
    props: [
      { name: 'content', type: 'string', defaultValue: 'Tooltip text' },
      { name: 'placement', type: 'enum', enumValues: ['top', 'right', 'bottom', 'left'], defaultValue: 'top' },
    ],
    defaultStyles: {
      position: 'relative',
      display: 'inline-block',
    },
    canHaveChildren: true,
    isContainer: true,
  },
];

// ============================================================================
// Overlay Components
// ============================================================================

const overlayComponents: ComponentDefinition[] = [
  {
    type: 'Modal',
    name: 'Modal',
    description: 'A modal dialog',
    category: 'overlay',
    icon: 'maximize-2',
    props: [
      { name: 'title', type: 'string', defaultValue: 'Modal Title' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg', 'xl', 'full'], defaultValue: 'md' },
      { name: 'closeOnOverlay', type: 'boolean', defaultValue: true },
      { name: 'showClose', type: 'boolean', defaultValue: true },
    ],
    defaultStyles: {
      backgroundColor: '#ffffff',
      borderRadius: { value: 12, unit: 'px' },
      boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      padding: { value: 24, unit: 'px' },
      maxWidth: { value: 500, unit: 'px' },
      width: { value: 100, unit: '%' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'Drawer',
    name: 'Drawer',
    description: 'A slide-out drawer',
    category: 'overlay',
    icon: 'sidebar',
    props: [
      { name: 'placement', type: 'enum', enumValues: ['left', 'right', 'top', 'bottom'], defaultValue: 'right' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg', 'full'], defaultValue: 'md' },
    ],
    defaultStyles: {
      backgroundColor: '#ffffff',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
      padding: { value: 24, unit: 'px' },
    },
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'Popover',
    name: 'Popover',
    description: 'A popover trigger and content',
    category: 'overlay',
    icon: 'message-circle',
    props: [
      { name: 'placement', type: 'enum', enumValues: ['top', 'right', 'bottom', 'left'], defaultValue: 'bottom' },
      { name: 'trigger', type: 'enum', enumValues: ['click', 'hover'], defaultValue: 'click' },
    ],
    defaultStyles: {
      position: 'relative',
      display: 'inline-block',
    },
    canHaveChildren: true,
    isContainer: true,
  },
];

// ============================================================================
// Export All Components
// ============================================================================

export const allComponents: ComponentDefinition[] = [
  ...layoutComponents,
  ...typographyComponents,
  ...formComponents,
  ...mediaComponents,
  ...dataDisplayComponents,
  ...navigationComponents,
  ...feedbackComponents,
  ...overlayComponents,
];

/**
 * Get a component definition by type
 */
export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return allComponents.find((c) => c.type === type);
}

/**
 * Get components by category
 */
export function getComponentsByCategory(category: string): ComponentDefinition[] {
  return allComponents.filter((c) => c.category === category);
}

/**
 * Register all built-in components with a store
 */
export function registerBuiltInComponents(dispatch: (action: any) => void): void {
  for (const component of allComponents) {
    dispatch({ type: 'REGISTER_COMPONENT', payload: component });
  }
}

export default allComponents;
