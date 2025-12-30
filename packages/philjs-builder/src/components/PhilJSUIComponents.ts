/**
 * PhilJS UI Components integration for the visual builder
 */

import type { ComponentDefinition, ComponentCategory } from '../types.js';

// ============================================================================
// PhilJS UI Categories
// ============================================================================

export const philjsUICategories: ComponentCategory[] = [
  { id: 'philjs-layout', name: 'PhilJS Layout', icon: 'layout', order: 1 },
  { id: 'philjs-forms', name: 'PhilJS Forms', icon: 'form', order: 2 },
  { id: 'philjs-display', name: 'PhilJS Display', icon: 'eye', order: 3 },
  { id: 'philjs-feedback', name: 'PhilJS Feedback', icon: 'bell', order: 4 },
];

// ============================================================================
// PhilJS UI Components
// ============================================================================

export const philjsUIComponents: ComponentDefinition[] = [
  // Layout components
  {
    type: 'PhilJS.Box',
    name: 'Box',
    category: 'philjs-layout',
    props: [
      { name: 'as', type: 'string', defaultValue: 'div' },
      { name: 'padding', type: 'string' },
      { name: 'margin', type: 'string' },
    ],
    isContainer: true,
    canHaveChildren: true,
  },
  {
    type: 'PhilJS.Flex',
    name: 'Flex',
    category: 'philjs-layout',
    props: [
      { name: 'direction', type: 'enum', enumValues: ['row', 'column', 'row-reverse', 'column-reverse'] },
      { name: 'align', type: 'enum', enumValues: ['start', 'center', 'end', 'stretch', 'baseline'] },
      { name: 'justify', type: 'enum', enumValues: ['start', 'center', 'end', 'between', 'around', 'evenly'] },
      { name: 'gap', type: 'string' },
      { name: 'wrap', type: 'boolean' },
    ],
    isContainer: true,
    canHaveChildren: true,
    defaultStyles: { display: 'flex' },
  },
  {
    type: 'PhilJS.Grid',
    name: 'Grid',
    category: 'philjs-layout',
    props: [
      { name: 'columns', type: 'number', defaultValue: 12 },
      { name: 'gap', type: 'string' },
      { name: 'rowGap', type: 'string' },
      { name: 'columnGap', type: 'string' },
    ],
    isContainer: true,
    canHaveChildren: true,
    defaultStyles: { display: 'grid' },
  },

  // Form components
  {
    type: 'PhilJS.Button',
    name: 'Button',
    category: 'philjs-forms',
    props: [
      { name: 'variant', type: 'enum', enumValues: ['solid', 'outline', 'ghost', 'link'] },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg'] },
      { name: 'colorScheme', type: 'string', defaultValue: 'blue' },
      { name: 'isLoading', type: 'boolean' },
      { name: 'isDisabled', type: 'boolean' },
      { name: 'leftIcon', type: 'node' },
      { name: 'rightIcon', type: 'node' },
    ],
    canHaveChildren: true,
  },
  {
    type: 'PhilJS.Input',
    name: 'Input',
    category: 'philjs-forms',
    props: [
      { name: 'type', type: 'enum', enumValues: ['text', 'password', 'email', 'number', 'tel', 'url'] },
      { name: 'placeholder', type: 'string' },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg'] },
      { name: 'variant', type: 'enum', enumValues: ['outline', 'filled', 'flushed', 'unstyled'] },
      { name: 'isDisabled', type: 'boolean' },
      { name: 'isReadOnly', type: 'boolean' },
      { name: 'isRequired', type: 'boolean' },
    ],
    canHaveChildren: false,
  },

  // Display components
  {
    type: 'PhilJS.Text',
    name: 'Text',
    category: 'philjs-display',
    props: [
      { name: 'as', type: 'enum', enumValues: ['p', 'span', 'div', 'label'] },
      { name: 'fontSize', type: 'string' },
      { name: 'fontWeight', type: 'enum', enumValues: ['normal', 'medium', 'semibold', 'bold'] },
      { name: 'color', type: 'color' },
      { name: 'noOfLines', type: 'number' },
    ],
    canHaveChildren: true,
  },
  {
    type: 'PhilJS.Heading',
    name: 'Heading',
    category: 'philjs-display',
    props: [
      { name: 'as', type: 'enum', enumValues: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] },
    ],
    canHaveChildren: true,
  },

  // Feedback components
  {
    type: 'PhilJS.Alert',
    name: 'Alert',
    category: 'philjs-feedback',
    props: [
      { name: 'status', type: 'enum', enumValues: ['info', 'warning', 'success', 'error'] },
      { name: 'variant', type: 'enum', enumValues: ['subtle', 'solid', 'left-accent', 'top-accent'] },
    ],
    isContainer: true,
    canHaveChildren: true,
  },
  {
    type: 'PhilJS.Spinner',
    name: 'Spinner',
    category: 'philjs-feedback',
    props: [
      { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg', 'xl'] },
      { name: 'thickness', type: 'string' },
      { name: 'speed', type: 'string' },
      { name: 'color', type: 'color' },
    ],
    canHaveChildren: false,
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a PhilJS UI component definition by type
 */
export function getPhilJSUIComponent(type: string): ComponentDefinition | undefined {
  return philjsUIComponents.find((c) => c.type === type);
}

/**
 * Get all PhilJS UI components in a category
 */
export function getPhilJSUIComponentsByCategory(categoryId: string): ComponentDefinition[] {
  return philjsUIComponents.filter((c) => c.category === categoryId);
}

/**
 * Register all PhilJS UI components with a store
 */
export function registerPhilJSUIComponents(
  registerFn: (component: ComponentDefinition) => void
): void {
  for (const component of philjsUIComponents) {
    registerFn(component);
  }
}
