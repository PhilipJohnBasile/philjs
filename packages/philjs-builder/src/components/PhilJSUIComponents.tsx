/**
 * PhilJS UI Component Definitions
 *
 * Maps all philjs-ui components for use in the visual builder
 * with complete property definitions and default styles.
 */

import type { ComponentDefinition, ComponentCategory, PropDefinition } from '../types.js';

// ============================================================================
// PhilJS UI Component Categories
// ============================================================================

export const philjsUICategories: ComponentCategory[] = [
  { id: 'philjs-buttons', name: 'Buttons', icon: 'mouse-pointer', order: 1, description: 'Button components' },
  { id: 'philjs-inputs', name: 'Inputs', icon: 'edit', order: 2, description: 'Form input components' },
  { id: 'philjs-selection', name: 'Selection', icon: 'check-square', order: 3, description: 'Checkbox, radio, switch' },
  { id: 'philjs-overlays', name: 'Overlays', icon: 'layers', order: 4, description: 'Modal, drawer, tooltip' },
  { id: 'philjs-feedback', name: 'Feedback', icon: 'alert-circle', order: 5, description: 'Alert, toast, progress' },
  { id: 'philjs-display', name: 'Data Display', icon: 'grid', order: 6, description: 'Card, table, tabs' },
  { id: 'philjs-navigation', name: 'Navigation', icon: 'navigation', order: 7, description: 'Breadcrumb, dropdown' },
  { id: 'philjs-advanced', name: 'Advanced', icon: 'star', order: 8, description: 'Advanced components' },
];

// ============================================================================
// Button Components
// ============================================================================

const buttonComponents: ComponentDefinition[] = [
  {
    type: 'PhilJSButton',
    name: 'Button',
    description: 'PhilJS UI Button with variants and sizes',
    category: 'philjs-buttons',
    icon: 'mouse-pointer',
    props: [
      { name: 'children', type: 'string', defaultValue: 'Button', group: 'Content' },
      { name: 'variant', type: 'enum', enumValues: ['solid', 'outline', 'ghost', 'link'], defaultValue: 'solid', group: 'Appearance' },
      { name: 'color', type: 'enum', enumValues: ['primary', 'secondary', 'success', 'warning', 'error'], defaultValue: 'primary', group: 'Appearance' },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg', 'xl'], defaultValue: 'md', group: 'Appearance' },
      { name: 'disabled', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'loading', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'fullWidth', type: 'boolean', defaultValue: false, group: 'Layout' },
      { name: 'leftIcon', type: 'string', group: 'Icons' },
      { name: 'rightIcon', type: 'string', group: 'Icons' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
    render: (props) => {
      return { type: 'Button', props };
    },
  },
  {
    type: 'PhilJSIconButton',
    name: 'Icon Button',
    description: 'Circular icon-only button',
    category: 'philjs-buttons',
    icon: 'circle',
    props: [
      { name: 'icon', type: 'string', defaultValue: 'settings', group: 'Content' },
      { name: 'ariaLabel', type: 'string', defaultValue: 'Icon button', group: 'Accessibility' },
      { name: 'variant', type: 'enum', enumValues: ['solid', 'outline', 'ghost'], defaultValue: 'ghost', group: 'Appearance' },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
      { name: 'disabled', type: 'boolean', defaultValue: false, group: 'State' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
  {
    type: 'PhilJSButtonGroup',
    name: 'Button Group',
    description: 'Group of attached buttons',
    category: 'philjs-buttons',
    icon: 'columns',
    props: [
      { name: 'attached', type: 'boolean', defaultValue: true, group: 'Layout' },
      { name: 'orientation', type: 'enum', enumValues: ['horizontal', 'vertical'], defaultValue: 'horizontal', group: 'Layout' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
    allowedChildren: ['PhilJSButton', 'PhilJSIconButton'],
  },
];

// ============================================================================
// Input Components
// ============================================================================

const inputComponents: ComponentDefinition[] = [
  {
    type: 'PhilJSInput',
    name: 'Input',
    description: 'Text input with variants',
    category: 'philjs-inputs',
    icon: 'edit',
    props: [
      { name: 'placeholder', type: 'string', defaultValue: 'Enter text...', group: 'Content' },
      { name: 'type', type: 'enum', enumValues: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'], defaultValue: 'text', group: 'Type' },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
      { name: 'variant', type: 'enum', enumValues: ['outline', 'filled', 'flushed', 'unstyled'], defaultValue: 'outline', group: 'Appearance' },
      { name: 'disabled', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'readOnly', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'isInvalid', type: 'boolean', defaultValue: false, group: 'Validation' },
      { name: 'required', type: 'boolean', defaultValue: false, group: 'Validation' },
      { name: 'leftElement', type: 'string', group: 'Addons' },
      { name: 'rightElement', type: 'string', group: 'Addons' },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
    },
    canHaveChildren: false,
  },
  {
    type: 'PhilJSTextarea',
    name: 'Textarea',
    description: 'Multi-line text input',
    category: 'philjs-inputs',
    icon: 'file-text',
    props: [
      { name: 'placeholder', type: 'string', defaultValue: 'Enter text...', group: 'Content' },
      { name: 'rows', type: 'number', defaultValue: 3, min: 1, group: 'Size' },
      { name: 'resize', type: 'enum', enumValues: ['none', 'vertical', 'horizontal', 'both'], defaultValue: 'vertical', group: 'Behavior' },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
      { name: 'disabled', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'isInvalid', type: 'boolean', defaultValue: false, group: 'Validation' },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
    },
    canHaveChildren: false,
  },
  {
    type: 'PhilJSSelect',
    name: 'Select',
    description: 'Dropdown select component',
    category: 'philjs-inputs',
    icon: 'chevron-down',
    props: [
      { name: 'placeholder', type: 'string', defaultValue: 'Select option', group: 'Content' },
      { name: 'options', type: 'array', defaultValue: [], group: 'Data' },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
      { name: 'disabled', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'isInvalid', type: 'boolean', defaultValue: false, group: 'Validation' },
      { name: 'isSearchable', type: 'boolean', defaultValue: false, group: 'Behavior' },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
    },
    canHaveChildren: false,
  },
  {
    type: 'PhilJSCombobox',
    name: 'Combobox',
    description: 'Searchable select with autocomplete',
    category: 'philjs-inputs',
    icon: 'search',
    props: [
      { name: 'placeholder', type: 'string', defaultValue: 'Search...', group: 'Content' },
      { name: 'options', type: 'array', defaultValue: [], group: 'Data' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
      { name: 'allowCustomValue', type: 'boolean', defaultValue: false, group: 'Behavior' },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
    },
    canHaveChildren: false,
  },
  {
    type: 'PhilJSSlider',
    name: 'Slider',
    description: 'Range slider input',
    category: 'philjs-inputs',
    icon: 'sliders',
    props: [
      { name: 'min', type: 'number', defaultValue: 0, group: 'Range' },
      { name: 'max', type: 'number', defaultValue: 100, group: 'Range' },
      { name: 'step', type: 'number', defaultValue: 1, group: 'Range' },
      { name: 'defaultValue', type: 'number', defaultValue: 50, group: 'Value' },
      { name: 'orientation', type: 'enum', enumValues: ['horizontal', 'vertical'], defaultValue: 'horizontal', group: 'Appearance' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
      { name: 'showMarks', type: 'boolean', defaultValue: false, group: 'Appearance' },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
    },
    canHaveChildren: false,
  },
];

// ============================================================================
// Selection Components
// ============================================================================

const selectionComponents: ComponentDefinition[] = [
  {
    type: 'PhilJSCheckbox',
    name: 'Checkbox',
    description: 'Checkbox with label',
    category: 'philjs-selection',
    icon: 'check-square',
    props: [
      { name: 'children', type: 'string', defaultValue: 'Checkbox label', group: 'Content' },
      { name: 'defaultChecked', type: 'boolean', defaultValue: false, group: 'Value' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
      { name: 'disabled', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'isIndeterminate', type: 'boolean', defaultValue: false, group: 'State' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
  {
    type: 'PhilJSCheckboxGroup',
    name: 'Checkbox Group',
    description: 'Group of checkboxes',
    category: 'philjs-selection',
    icon: 'list',
    props: [
      { name: 'defaultValue', type: 'array', defaultValue: [], group: 'Value' },
      { name: 'orientation', type: 'enum', enumValues: ['horizontal', 'vertical'], defaultValue: 'vertical', group: 'Layout' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
    allowedChildren: ['PhilJSCheckbox'],
  },
  {
    type: 'PhilJSRadio',
    name: 'Radio',
    description: 'Radio button with label',
    category: 'philjs-selection',
    icon: 'circle',
    props: [
      { name: 'children', type: 'string', defaultValue: 'Radio label', group: 'Content' },
      { name: 'value', type: 'string', defaultValue: '', group: 'Value' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
      { name: 'disabled', type: 'boolean', defaultValue: false, group: 'State' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
  {
    type: 'PhilJSRadioGroup',
    name: 'Radio Group',
    description: 'Group of radio buttons',
    category: 'philjs-selection',
    icon: 'list',
    props: [
      { name: 'name', type: 'string', defaultValue: 'radio-group', group: 'Identity' },
      { name: 'defaultValue', type: 'string', defaultValue: '', group: 'Value' },
      { name: 'orientation', type: 'enum', enumValues: ['horizontal', 'vertical'], defaultValue: 'vertical', group: 'Layout' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
    allowedChildren: ['PhilJSRadio'],
  },
  {
    type: 'PhilJSSwitch',
    name: 'Switch',
    description: 'Toggle switch',
    category: 'philjs-selection',
    icon: 'toggle-left',
    props: [
      { name: 'children', type: 'string', defaultValue: 'Switch label', group: 'Content' },
      { name: 'defaultChecked', type: 'boolean', defaultValue: false, group: 'Value' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
      { name: 'disabled', type: 'boolean', defaultValue: false, group: 'State' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
];

// ============================================================================
// Overlay Components
// ============================================================================

const overlayComponents: ComponentDefinition[] = [
  {
    type: 'PhilJSModal',
    name: 'Modal',
    description: 'Modal dialog',
    category: 'philjs-overlays',
    icon: 'maximize-2',
    props: [
      { name: 'isOpen', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg', 'xl', 'full'], defaultValue: 'md', group: 'Appearance' },
      { name: 'closeOnOverlayClick', type: 'boolean', defaultValue: true, group: 'Behavior' },
      { name: 'closeOnEsc', type: 'boolean', defaultValue: true, group: 'Behavior' },
      { name: 'isCentered', type: 'boolean', defaultValue: true, group: 'Position' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'PhilJSDrawer',
    name: 'Drawer',
    description: 'Slide-out drawer panel',
    category: 'philjs-overlays',
    icon: 'sidebar',
    props: [
      { name: 'isOpen', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'placement', type: 'enum', enumValues: ['left', 'right', 'top', 'bottom'], defaultValue: 'right', group: 'Position' },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg', 'xl', 'full'], defaultValue: 'md', group: 'Appearance' },
      { name: 'closeOnOverlayClick', type: 'boolean', defaultValue: true, group: 'Behavior' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'PhilJSTooltip',
    name: 'Tooltip',
    description: 'Hover tooltip',
    category: 'philjs-overlays',
    icon: 'message-square',
    props: [
      { name: 'label', type: 'string', defaultValue: 'Tooltip text', group: 'Content' },
      { name: 'placement', type: 'enum', enumValues: ['top', 'bottom', 'left', 'right', 'auto'], defaultValue: 'top', group: 'Position' },
      { name: 'hasArrow', type: 'boolean', defaultValue: true, group: 'Appearance' },
      { name: 'openDelay', type: 'number', defaultValue: 0, group: 'Timing' },
      { name: 'closeDelay', type: 'number', defaultValue: 0, group: 'Timing' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'PhilJSPopover',
    name: 'Popover',
    description: 'Popover with content',
    category: 'philjs-overlays',
    icon: 'message-circle',
    props: [
      { name: 'placement', type: 'enum', enumValues: ['top', 'bottom', 'left', 'right', 'auto'], defaultValue: 'bottom', group: 'Position' },
      { name: 'trigger', type: 'enum', enumValues: ['click', 'hover'], defaultValue: 'click', group: 'Behavior' },
      { name: 'closeOnBlur', type: 'boolean', defaultValue: true, group: 'Behavior' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'PhilJSDropdown',
    name: 'Dropdown',
    description: 'Dropdown menu',
    category: 'philjs-overlays',
    icon: 'menu',
    props: [
      { name: 'placement', type: 'enum', enumValues: ['bottom-start', 'bottom-end', 'top-start', 'top-end'], defaultValue: 'bottom-start', group: 'Position' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
];

// ============================================================================
// Feedback Components
// ============================================================================

const feedbackComponents: ComponentDefinition[] = [
  {
    type: 'PhilJSAlert',
    name: 'Alert',
    description: 'Alert message box',
    category: 'philjs-feedback',
    icon: 'alert-circle',
    props: [
      { name: 'status', type: 'enum', enumValues: ['info', 'success', 'warning', 'error'], defaultValue: 'info', group: 'Appearance' },
      { name: 'variant', type: 'enum', enumValues: ['subtle', 'solid', 'left-accent', 'top-accent'], defaultValue: 'subtle', group: 'Appearance' },
      { name: 'title', type: 'string', defaultValue: '', group: 'Content' },
      { name: 'description', type: 'string', defaultValue: 'Alert message', group: 'Content' },
      { name: 'closable', type: 'boolean', defaultValue: false, group: 'Behavior' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
  {
    type: 'PhilJSProgress',
    name: 'Progress',
    description: 'Progress bar',
    category: 'philjs-feedback',
    icon: 'loader',
    props: [
      { name: 'value', type: 'number', defaultValue: 50, min: 0, max: 100, group: 'Value' },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
      { name: 'color', type: 'enum', enumValues: ['primary', 'success', 'warning', 'error'], defaultValue: 'primary', group: 'Appearance' },
      { name: 'isIndeterminate', type: 'boolean', defaultValue: false, group: 'State' },
      { name: 'hasStripe', type: 'boolean', defaultValue: false, group: 'Appearance' },
      { name: 'isAnimated', type: 'boolean', defaultValue: false, group: 'Appearance' },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
    },
    canHaveChildren: false,
  },
  {
    type: 'PhilJSSpinner',
    name: 'Spinner',
    description: 'Loading spinner',
    category: 'philjs-feedback',
    icon: 'loader',
    props: [
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg', 'xl'], defaultValue: 'md', group: 'Appearance' },
      { name: 'color', type: 'color', defaultValue: '#0066ff', group: 'Appearance' },
      { name: 'thickness', type: 'number', defaultValue: 2, group: 'Appearance' },
      { name: 'speed', type: 'number', defaultValue: 0.65, group: 'Animation' },
      { name: 'label', type: 'string', defaultValue: 'Loading...', group: 'Accessibility' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
  {
    type: 'PhilJSSkeleton',
    name: 'Skeleton',
    description: 'Loading placeholder',
    category: 'philjs-feedback',
    icon: 'box',
    props: [
      { name: 'height', type: 'string', defaultValue: '20px', group: 'Size' },
      { name: 'width', type: 'string', defaultValue: '100%', group: 'Size' },
      { name: 'borderRadius', type: 'string', defaultValue: '4px', group: 'Appearance' },
      { name: 'startColor', type: 'color', defaultValue: '#e2e8f0', group: 'Colors' },
      { name: 'endColor', type: 'color', defaultValue: '#edf2f7', group: 'Colors' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
];

// ============================================================================
// Data Display Components
// ============================================================================

const displayComponents: ComponentDefinition[] = [
  {
    type: 'PhilJSCard',
    name: 'Card',
    description: 'Card container',
    category: 'philjs-display',
    icon: 'credit-card',
    props: [
      { name: 'variant', type: 'enum', enumValues: ['elevated', 'outline', 'filled', 'unstyled'], defaultValue: 'elevated', group: 'Appearance' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'PhilJSTabs',
    name: 'Tabs',
    description: 'Tabbed content',
    category: 'philjs-display',
    icon: 'folder',
    props: [
      { name: 'defaultIndex', type: 'number', defaultValue: 0, group: 'Value' },
      { name: 'variant', type: 'enum', enumValues: ['line', 'enclosed', 'soft-rounded', 'solid-rounded'], defaultValue: 'line', group: 'Appearance' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
      { name: 'orientation', type: 'enum', enumValues: ['horizontal', 'vertical'], defaultValue: 'horizontal', group: 'Layout' },
      { name: 'isFitted', type: 'boolean', defaultValue: false, group: 'Layout' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'PhilJSAccordion',
    name: 'Accordion',
    description: 'Expandable sections',
    category: 'philjs-display',
    icon: 'chevron-down',
    props: [
      { name: 'allowMultiple', type: 'boolean', defaultValue: false, group: 'Behavior' },
      { name: 'allowToggle', type: 'boolean', defaultValue: true, group: 'Behavior' },
      { name: 'defaultIndex', type: 'array', defaultValue: [], group: 'Value' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'PhilJSBadge',
    name: 'Badge',
    description: 'Small badge/tag',
    category: 'philjs-display',
    icon: 'tag',
    props: [
      { name: 'children', type: 'string', defaultValue: 'Badge', group: 'Content' },
      { name: 'variant', type: 'enum', enumValues: ['solid', 'subtle', 'outline'], defaultValue: 'subtle', group: 'Appearance' },
      { name: 'color', type: 'enum', enumValues: ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'], defaultValue: 'gray', group: 'Appearance' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
  {
    type: 'PhilJSAvatar',
    name: 'Avatar',
    description: 'User avatar',
    category: 'philjs-display',
    icon: 'user',
    props: [
      { name: 'src', type: 'image', defaultValue: '', group: 'Content' },
      { name: 'name', type: 'string', defaultValue: 'User Name', group: 'Content' },
      { name: 'size', type: 'enum', enumValues: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'], defaultValue: 'md', group: 'Appearance' },
      { name: 'showBorder', type: 'boolean', defaultValue: false, group: 'Appearance' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
  {
    type: 'PhilJSTable',
    name: 'Table',
    description: 'Data table',
    category: 'philjs-display',
    icon: 'grid',
    props: [
      { name: 'variant', type: 'enum', enumValues: ['simple', 'striped', 'unstyled'], defaultValue: 'simple', group: 'Appearance' },
      { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], defaultValue: 'md', group: 'Appearance' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'PhilJSDataTable',
    name: 'Data Table',
    description: 'Advanced data table with sorting and pagination',
    category: 'philjs-display',
    icon: 'database',
    props: [
      { name: 'columns', type: 'array', defaultValue: [], group: 'Data' },
      { name: 'data', type: 'array', defaultValue: [], group: 'Data' },
      { name: 'sortable', type: 'boolean', defaultValue: true, group: 'Features' },
      { name: 'selectable', type: 'boolean', defaultValue: false, group: 'Features' },
      { name: 'paginated', type: 'boolean', defaultValue: true, group: 'Features' },
      { name: 'pageSize', type: 'number', defaultValue: 10, group: 'Pagination' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
];

// ============================================================================
// Navigation Components
// ============================================================================

const navigationComponents: ComponentDefinition[] = [
  {
    type: 'PhilJSBreadcrumb',
    name: 'Breadcrumb',
    description: 'Breadcrumb navigation',
    category: 'philjs-navigation',
    icon: 'chevrons-right',
    props: [
      { name: 'separator', type: 'string', defaultValue: '/', group: 'Appearance' },
      { name: 'spacing', type: 'number', defaultValue: 8, group: 'Appearance' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'PhilJSContextMenu',
    name: 'Context Menu',
    description: 'Right-click context menu',
    category: 'philjs-navigation',
    icon: 'menu',
    props: [],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
  {
    type: 'PhilJSCommand',
    name: 'Command Palette',
    description: 'Command palette / search',
    category: 'philjs-navigation',
    icon: 'search',
    props: [
      { name: 'placeholder', type: 'string', defaultValue: 'Type a command or search...', group: 'Content' },
    ],
    defaultStyles: {},
    canHaveChildren: true,
    isContainer: true,
  },
];

// ============================================================================
// Advanced Components
// ============================================================================

const advancedComponents: ComponentDefinition[] = [
  {
    type: 'PhilJSCalendar',
    name: 'Calendar',
    description: 'Date calendar',
    category: 'philjs-advanced',
    icon: 'calendar',
    props: [
      { name: 'mode', type: 'enum', enumValues: ['single', 'range', 'multiple'], defaultValue: 'single', group: 'Mode' },
      { name: 'showOutsideDays', type: 'boolean', defaultValue: true, group: 'Appearance' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
  {
    type: 'PhilJSDatePicker',
    name: 'Date Picker',
    description: 'Date picker input',
    category: 'philjs-advanced',
    icon: 'calendar',
    props: [
      { name: 'placeholder', type: 'string', defaultValue: 'Pick a date', group: 'Content' },
      { name: 'format', type: 'string', defaultValue: 'yyyy-MM-dd', group: 'Format' },
      { name: 'minDate', type: 'string', group: 'Validation' },
      { name: 'maxDate', type: 'string', group: 'Validation' },
    ],
    defaultStyles: {
      width: { value: 100, unit: '%' },
    },
    canHaveChildren: false,
  },
  {
    type: 'PhilJSColorPicker',
    name: 'Color Picker',
    description: 'Color selection input',
    category: 'philjs-advanced',
    icon: 'droplet',
    props: [
      { name: 'defaultValue', type: 'color', defaultValue: '#0066ff', group: 'Value' },
      { name: 'showAlpha', type: 'boolean', defaultValue: false, group: 'Features' },
      { name: 'swatches', type: 'array', defaultValue: [], group: 'Presets' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
  {
    type: 'PhilJSFileUpload',
    name: 'File Upload',
    description: 'File upload dropzone',
    category: 'philjs-advanced',
    icon: 'upload',
    props: [
      { name: 'accept', type: 'string', defaultValue: '*/*', group: 'Validation' },
      { name: 'maxSize', type: 'number', defaultValue: 5242880, group: 'Validation' },
      { name: 'maxFiles', type: 'number', defaultValue: 1, group: 'Validation' },
      { name: 'multiple', type: 'boolean', defaultValue: false, group: 'Behavior' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
  {
    type: 'PhilJSTree',
    name: 'Tree View',
    description: 'Hierarchical tree view',
    category: 'philjs-advanced',
    icon: 'git-branch',
    props: [
      { name: 'data', type: 'array', defaultValue: [], group: 'Data' },
      { name: 'selectable', type: 'boolean', defaultValue: true, group: 'Features' },
      { name: 'checkable', type: 'boolean', defaultValue: false, group: 'Features' },
      { name: 'defaultExpandAll', type: 'boolean', defaultValue: false, group: 'State' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
  {
    type: 'PhilJSVirtualList',
    name: 'Virtual List',
    description: 'Virtualized scrollable list',
    category: 'philjs-advanced',
    icon: 'list',
    props: [
      { name: 'height', type: 'number', defaultValue: 400, group: 'Size' },
      { name: 'itemHeight', type: 'number', defaultValue: 50, group: 'Size' },
      { name: 'overscan', type: 'number', defaultValue: 3, group: 'Performance' },
    ],
    defaultStyles: {},
    canHaveChildren: false,
  },
];

// ============================================================================
// Export All Components
// ============================================================================

export const philjsUIComponents: ComponentDefinition[] = [
  ...buttonComponents,
  ...inputComponents,
  ...selectionComponents,
  ...overlayComponents,
  ...feedbackComponents,
  ...displayComponents,
  ...navigationComponents,
  ...advancedComponents,
];

/**
 * Get PhilJS UI component by type
 */
export function getPhilJSUIComponent(type: string): ComponentDefinition | undefined {
  return philjsUIComponents.find(c => c.type === type);
}

/**
 * Get PhilJS UI components by category
 */
export function getPhilJSUIComponentsByCategory(categoryId: string): ComponentDefinition[] {
  return philjsUIComponents.filter(c => c.category === categoryId);
}

/**
 * Register PhilJS UI components with a dispatcher
 */
export function registerPhilJSUIComponents(dispatch: (action: any) => void): void {
  for (const component of philjsUIComponents) {
    dispatch({ type: 'REGISTER_COMPONENT', payload: component });
  }
}

export default philjsUIComponents;
