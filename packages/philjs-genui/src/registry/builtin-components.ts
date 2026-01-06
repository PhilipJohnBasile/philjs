/**
 * Built-in component registrations
 * These are safe, basic components that come pre-registered
 */

import type { ComponentCapability, ComponentRenderer, RenderContext } from './component-registry.js';
import type { A2UIComponent } from '../protocol/a2ui-schema.js';

/**
 * Create a basic DOM element renderer
 */
function createElementRenderer(tagName: string): ComponentRenderer {
  return (component: A2UIComponent, context: RenderContext): HTMLElement => {
    const element = document.createElement(tagName);
    element.id = component.id;

    // Apply props as attributes
    for (const [key, value] of Object.entries(component.props)) {
      if (key === 'children' || key === 'className' || key === 'style') continue;
      if (value === undefined || value === null) continue;

      if (typeof value === 'boolean') {
        if (value) element.setAttribute(key, '');
      } else {
        element.setAttribute(key, String(value));
      }
    }

    // Apply className
    if (component.className) {
      element.className = component.className;
    }

    // Apply styles
    if (component.style) {
      for (const [prop, value] of Object.entries(component.style)) {
        (element.style as unknown as Record<string, unknown>)[prop] = value;
      }
    }

    // Apply a11y attributes
    if (component.a11y) {
      if (component.a11y.role) element.setAttribute('role', component.a11y.role);
      if (component.a11y.label) element.setAttribute('aria-label', component.a11y.label);
      if (component.a11y.labelledBy) element.setAttribute('aria-labelledby', component.a11y.labelledBy);
      if (component.a11y.describedBy) element.setAttribute('aria-describedby', component.a11y.describedBy);
      if (component.a11y.live) element.setAttribute('aria-live', component.a11y.live);
      if (component.a11y.tabIndex !== undefined) element.tabIndex = component.a11y.tabIndex;
      if (component.a11y.hidden) element.setAttribute('aria-hidden', 'true');
    }

    // Render children
    if (component.children) {
      for (const child of component.children) {
        const childElement = context.renderChild(child);
        if (childElement) {
          element.appendChild(childElement);
        }
      }
    }

    // Handle text content
    if (typeof component.props.children === 'string') {
      element.textContent = component.props.children;
    }

    return element;
  };
}

/**
 * Built-in layout components
 */
export const layoutComponents: Array<{
  capability: ComponentCapability;
  renderer: ComponentRenderer;
}> = [
  {
    capability: {
      type: 'Box',
      displayName: 'Box',
      description: 'A generic container element for grouping content',
      category: 'layout',
      props: [
        { name: 'as', type: 'string', description: 'HTML element to render as', default: 'div' },
        { name: 'children', type: 'string', description: 'Text content or components' },
      ],
      slots: [{ name: 'default', description: 'Main content', multiple: true }],
      tags: ['container', 'wrapper', 'div'],
    },
    renderer: createElementRenderer('div'),
  },
  {
    capability: {
      type: 'Stack',
      displayName: 'Stack',
      description: 'A flex container that stacks children vertically or horizontally',
      category: 'layout',
      props: [
        { name: 'direction', type: 'string', enum: ['row', 'column'], default: 'column', description: 'Stack direction' },
        { name: 'gap', type: 'string', description: 'Space between items' },
        { name: 'align', type: 'string', enum: ['start', 'center', 'end', 'stretch'], description: 'Cross-axis alignment' },
        { name: 'justify', type: 'string', enum: ['start', 'center', 'end', 'between', 'around'], description: 'Main-axis alignment' },
      ],
      slots: [{ name: 'default', description: 'Stack items', multiple: true }],
      tags: ['flex', 'layout', 'vertical', 'horizontal'],
    },
    renderer: (component, context) => {
      const element = document.createElement('div');
      element.id = component.id;
      element.style.display = 'flex';
      element.style.flexDirection = (component.props.direction as string) || 'column';
      if (component.props.gap) element.style.gap = component.props.gap as string;
      if (component.props.align) element.style.alignItems = component.props.align as string;
      if (component.props.justify) {
        const justify = component.props.justify as string;
        element.style.justifyContent = justify === 'between' ? 'space-between' : justify === 'around' ? 'space-around' : justify;
      }
      if (component.className) element.className = component.className;

      if (component.children) {
        for (const child of component.children) {
          const childElement = context.renderChild(child);
          if (childElement) element.appendChild(childElement);
        }
      }

      return element;
    },
  },
  {
    capability: {
      type: 'Grid',
      displayName: 'Grid',
      description: 'A CSS grid container for complex layouts',
      category: 'layout',
      props: [
        { name: 'columns', type: 'string', description: 'Grid column template', default: '1fr' },
        { name: 'rows', type: 'string', description: 'Grid row template' },
        { name: 'gap', type: 'string', description: 'Gap between grid items' },
      ],
      slots: [{ name: 'default', description: 'Grid items', multiple: true }],
      tags: ['grid', 'layout', 'responsive'],
    },
    renderer: (component, context) => {
      const element = document.createElement('div');
      element.id = component.id;
      element.style.display = 'grid';
      if (component.props.columns) element.style.gridTemplateColumns = component.props.columns as string;
      if (component.props.rows) element.style.gridTemplateRows = component.props.rows as string;
      if (component.props.gap) element.style.gap = component.props.gap as string;
      if (component.className) element.className = component.className;

      if (component.children) {
        for (const child of component.children) {
          const childElement = context.renderChild(child);
          if (childElement) element.appendChild(childElement);
        }
      }

      return element;
    },
  },
];

/**
 * Built-in text components
 */
export const textComponents: Array<{
  capability: ComponentCapability;
  renderer: ComponentRenderer;
}> = [
  {
    capability: {
      type: 'Text',
      displayName: 'Text',
      description: 'Display text content with various styles',
      category: 'display',
      props: [
        { name: 'children', type: 'string', required: true, description: 'Text content' },
        { name: 'size', type: 'string', enum: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'], description: 'Text size' },
        { name: 'weight', type: 'string', enum: ['normal', 'medium', 'semibold', 'bold'], description: 'Font weight' },
        { name: 'color', type: 'string', description: 'Text color' },
      ],
      tags: ['text', 'typography', 'content'],
    },
    renderer: (component, context) => {
      const element = document.createElement('span');
      element.id = component.id;
      element.textContent = component.props.children as string;
      if (component.props.size) element.dataset.size = component.props.size as string;
      if (component.props.weight) element.style.fontWeight = component.props.weight as string;
      if (component.props.color) element.style.color = component.props.color as string;
      if (component.className) element.className = component.className;
      return element;
    },
  },
  {
    capability: {
      type: 'Heading',
      displayName: 'Heading',
      description: 'Display a heading (h1-h6)',
      category: 'display',
      props: [
        { name: 'children', type: 'string', required: true, description: 'Heading text' },
        { name: 'level', type: 'number', enum: [1, 2, 3, 4, 5, 6], default: 2, description: 'Heading level (1-6)' },
      ],
      tags: ['heading', 'title', 'typography'],
      a11yNotes: 'Use appropriate heading levels for document structure',
    },
    renderer: (component) => {
      const level = Math.min(6, Math.max(1, (component.props.level as number) || 2));
      const element = document.createElement(`h${level}`);
      element.id = component.id;
      element.textContent = component.props.children as string;
      if (component.className) element.className = component.className;
      return element;
    },
  },
];

/**
 * Built-in input components
 */
export const inputComponents: Array<{
  capability: ComponentCapability;
  renderer: ComponentRenderer;
}> = [
  {
    capability: {
      type: 'Button',
      displayName: 'Button',
      description: 'Interactive button with multiple variants',
      category: 'input',
      props: [
        { name: 'children', type: 'string', required: true, description: 'Button label' },
        { name: 'variant', type: 'string', enum: ['primary', 'secondary', 'outline', 'ghost', 'destructive'], default: 'primary' },
        { name: 'size', type: 'string', enum: ['sm', 'md', 'lg'], default: 'md' },
        { name: 'disabled', type: 'boolean', default: false },
        { name: 'loading', type: 'boolean', default: false },
        { name: 'type', type: 'string', enum: ['button', 'submit', 'reset'], default: 'button' },
      ],
      events: [
        { name: 'onClick', description: 'Fired when button is clicked' },
      ],
      tags: ['button', 'action', 'interactive', 'click'],
      a11yNotes: 'Automatically handles keyboard activation',
    },
    renderer: (component, context) => {
      const element = document.createElement('button');
      element.id = component.id;
      element.textContent = component.props.children as string;
      element.type = (component.props.type as 'submit' | 'reset' | 'button') || 'button';
      element.disabled = !!(component.props.disabled || component.props.loading);
      element.dataset.variant = (component.props.variant as string) || 'primary';
      element.dataset.size = (component.props.size as string) || 'md';
      if (component.className) element.className = component.className;

      // Handle click events
      element.addEventListener('click', (e) => {
        context.emitToAgent(component.id, { type: 'click', data: { timestamp: Date.now() } });
      });

      return element;
    },
  },
  {
    capability: {
      type: 'Input',
      displayName: 'Input',
      description: 'Text input field',
      category: 'input',
      props: [
        { name: 'type', type: 'string', enum: ['text', 'email', 'password', 'number', 'tel', 'url'], default: 'text' },
        { name: 'placeholder', type: 'string', description: 'Placeholder text' },
        { name: 'value', type: 'string', description: 'Current value' },
        { name: 'disabled', type: 'boolean', default: false },
        { name: 'required', type: 'boolean', default: false },
        { name: 'name', type: 'string', description: 'Form field name' },
      ],
      events: [
        { name: 'onChange', description: 'Fired when value changes' },
        { name: 'onBlur', description: 'Fired when input loses focus' },
      ],
      tags: ['input', 'text', 'form', 'field'],
    },
    renderer: (component, context) => {
      const element = document.createElement('input');
      element.id = component.id;
      element.type = (component.props.type as string) || 'text';
      if (component.props.placeholder) element.placeholder = component.props.placeholder as string;
      if (component.props.value) element.value = component.props.value as string;
      if (component.props.disabled) element.disabled = true;
      if (component.props.required) element.required = true;
      if (component.props.name) element.name = component.props.name as string;
      if (component.className) element.className = component.className;

      element.addEventListener('change', (e) => {
        context.emitToAgent(component.id, { type: 'change', data: { value: element.value } });
      });

      return element;
    },
  },
];

/**
 * Built-in feedback components
 */
export const feedbackComponents: Array<{
  capability: ComponentCapability;
  renderer: ComponentRenderer;
}> = [
  {
    capability: {
      type: 'Alert',
      displayName: 'Alert',
      description: 'Display an alert or notification message',
      category: 'feedback',
      props: [
        { name: 'children', type: 'string', required: true, description: 'Alert message' },
        { name: 'variant', type: 'string', enum: ['info', 'success', 'warning', 'error'], default: 'info' },
        { name: 'dismissible', type: 'boolean', default: false },
      ],
      events: [
        { name: 'onDismiss', description: 'Fired when alert is dismissed' },
      ],
      tags: ['alert', 'notification', 'message', 'feedback'],
      a11yNotes: 'Uses role="alert" for important messages',
    },
    renderer: (component, context) => {
      const element = document.createElement('div');
      element.id = component.id;
      element.setAttribute('role', 'alert');
      element.dataset.variant = (component.props.variant as string) || 'info';
      element.textContent = component.props.children as string;
      if (component.className) element.className = component.className;

      if (component.props.dismissible) {
        const dismissBtn = document.createElement('button');
        dismissBtn.textContent = '×';
        dismissBtn.setAttribute('aria-label', 'Dismiss');
        dismissBtn.addEventListener('click', () => {
          context.emitToAgent(component.id, { type: 'dismiss' });
          element.remove();
        });
        element.appendChild(dismissBtn);
      }

      return element;
    },
  },
  {
    capability: {
      type: 'Spinner',
      displayName: 'Spinner',
      description: 'Loading spinner indicator',
      category: 'feedback',
      props: [
        { name: 'size', type: 'string', enum: ['sm', 'md', 'lg'], default: 'md' },
        { name: 'label', type: 'string', description: 'Accessible label', default: 'Loading' },
      ],
      tags: ['loading', 'spinner', 'progress'],
      a11yNotes: 'Includes aria-label for screen readers',
    },
    renderer: (component) => {
      const element = document.createElement('div');
      element.id = component.id;
      element.setAttribute('role', 'status');
      element.setAttribute('aria-label', (component.props.label as string) || 'Loading');
      element.dataset.size = (component.props.size as string) || 'md';
      element.innerHTML = '<span class="spinner-animation"></span>';
      if (component.className) element.className = component.className;
      return element;
    },
  },
];

/**
 * All built-in components
 */
export const builtinComponents = [
  ...layoutComponents,
  ...textComponents,
  ...inputComponents,
  ...feedbackComponents,
];

/**
 * Register all built-in components to a registry
 */
export function registerBuiltins(registry: {
  register: (capability: ComponentCapability, renderer: ComponentRenderer) => void;
}): void {
  for (const { capability, renderer } of builtinComponents) {
    registry.register(capability, renderer);
  }
}
