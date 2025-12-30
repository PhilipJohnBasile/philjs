/**
 * Component Registry Tests
 * Tests for component registration, querying, and manifest generation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ComponentRegistry,
  createRegistry,
  getDefaultRegistry,
  setDefaultRegistry,
  registerBuiltins,
  builtinComponents,
  type ComponentCapability,
  type ComponentRenderer,
  type RenderContext,
  type A2UIComponent,
} from '../index.js';

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = createRegistry();
  });

  describe('register', () => {
    it('should register a component with capability and renderer', () => {
      const capability: ComponentCapability = {
        type: 'CustomButton',
        displayName: 'Custom Button',
        description: 'A custom button component',
        category: 'input',
        props: [
          { name: 'label', type: 'string', required: true, description: 'Button label' },
        ],
      };
      const renderer: ComponentRenderer = () => document.createElement('button');

      registry.register(capability, renderer);

      expect(registry.isAllowed('CustomButton')).toBe(true);
      expect(registry.getCapability('CustomButton')).toEqual(capability);
      expect(registry.getRenderer('CustomButton')).toBe(renderer);
    });

    it('should allow multiple components to be registered', () => {
      const button: ComponentCapability = {
        type: 'Button',
        displayName: 'Button',
        description: 'A button',
        category: 'input',
        props: [],
      };
      const input: ComponentCapability = {
        type: 'Input',
        displayName: 'Input',
        description: 'An input',
        category: 'input',
        props: [],
      };

      registry.register(button, () => document.createElement('button'));
      registry.register(input, () => document.createElement('input'));

      expect(registry.getRegisteredTypes()).toContain('Button');
      expect(registry.getRegisteredTypes()).toContain('Input');
      expect(registry.getRegisteredTypes()).toHaveLength(2);
    });

    it('should override existing component with same type', () => {
      const v1: ComponentCapability = {
        type: 'MyComp',
        displayName: 'My Component v1',
        description: 'Version 1',
        category: 'display',
        props: [],
      };
      const v2: ComponentCapability = {
        type: 'MyComp',
        displayName: 'My Component v2',
        description: 'Version 2',
        category: 'display',
        props: [{ name: 'newProp', type: 'string' }],
      };

      registry.register(v1, () => null);
      registry.register(v2, () => null);

      expect(registry.getCapability('MyComp')?.displayName).toBe('My Component v2');
      expect(registry.getRegisteredTypes()).toHaveLength(1);
    });
  });

  describe('unregister', () => {
    it('should remove a registered component', () => {
      const capability: ComponentCapability = {
        type: 'ToRemove',
        displayName: 'To Remove',
        description: 'Will be removed',
        category: 'display',
        props: [],
      };

      registry.register(capability, () => null);
      expect(registry.isAllowed('ToRemove')).toBe(true);

      const result = registry.unregister('ToRemove');

      expect(result).toBe(true);
      expect(registry.isAllowed('ToRemove')).toBe(false);
      expect(registry.getCapability('ToRemove')).toBeUndefined();
    });

    it('should return false when unregistering non-existent component', () => {
      const result = registry.unregister('NonExistent');

      expect(result).toBe(false);
    });
  });

  describe('isAllowed', () => {
    it('should return true for registered components', () => {
      registry.register(
        { type: 'AllowedComp', displayName: 'Allowed', description: 'Allowed', category: 'display', props: [] },
        () => null
      );

      expect(registry.isAllowed('AllowedComp')).toBe(true);
    });

    it('should return false for non-registered components', () => {
      expect(registry.isAllowed('NotRegistered')).toBe(false);
    });
  });

  describe('getCapabilities', () => {
    it('should return all registered capabilities', () => {
      registry.register(
        { type: 'Comp1', displayName: 'Component 1', description: 'First', category: 'display', props: [] },
        () => null
      );
      registry.register(
        { type: 'Comp2', displayName: 'Component 2', description: 'Second', category: 'input', props: [] },
        () => null
      );

      const capabilities = registry.getCapabilities();

      expect(capabilities).toHaveLength(2);
      expect(capabilities.map((c) => c.type)).toContain('Comp1');
      expect(capabilities.map((c) => c.type)).toContain('Comp2');
    });

    it('should return empty array when no components registered', () => {
      const capabilities = registry.getCapabilities();

      expect(capabilities).toHaveLength(0);
    });
  });

  describe('getCapabilitiesByCategory', () => {
    beforeEach(() => {
      registry.register(
        { type: 'Button', displayName: 'Button', description: 'Button', category: 'input', props: [] },
        () => null
      );
      registry.register(
        { type: 'Input', displayName: 'Input', description: 'Input', category: 'input', props: [] },
        () => null
      );
      registry.register(
        { type: 'Text', displayName: 'Text', description: 'Text', category: 'display', props: [] },
        () => null
      );
      registry.register(
        { type: 'Alert', displayName: 'Alert', description: 'Alert', category: 'feedback', props: [] },
        () => null
      );
    });

    it('should filter components by category', () => {
      const inputComponents = registry.getCapabilitiesByCategory('input');

      expect(inputComponents).toHaveLength(2);
      expect(inputComponents.every((c) => c.category === 'input')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const mediaComponents = registry.getCapabilitiesByCategory('media');

      expect(mediaComponents).toHaveLength(0);
    });
  });

  describe('searchCapabilities', () => {
    beforeEach(() => {
      registry.register(
        {
          type: 'PrimaryButton',
          displayName: 'Primary Button',
          description: 'A primary action button',
          category: 'input',
          props: [],
          tags: ['button', 'action', 'primary'],
        },
        () => null
      );
      registry.register(
        {
          type: 'TextField',
          displayName: 'Text Field',
          description: 'Single line text input',
          category: 'input',
          props: [],
          tags: ['input', 'text', 'form'],
        },
        () => null
      );
      registry.register(
        {
          type: 'StatusBadge',
          displayName: 'Status Badge',
          description: 'Displays status with color',
          category: 'display',
          props: [],
          tags: ['badge', 'status', 'indicator'],
        },
        () => null
      );
    });

    it('should search by type', () => {
      const results = registry.searchCapabilities('Button');

      expect(results).toHaveLength(1);
      expect(results[0]?.type).toBe('PrimaryButton');
    });

    it('should search by display name', () => {
      const results = registry.searchCapabilities('Text Field');

      expect(results).toHaveLength(1);
      expect(results[0]?.type).toBe('TextField');
    });

    it('should search by description', () => {
      const results = registry.searchCapabilities('status');

      expect(results).toHaveLength(1);
      expect(results[0]?.type).toBe('StatusBadge');
    });

    it('should search by tags', () => {
      const results = registry.searchCapabilities('form');

      expect(results).toHaveLength(1);
      expect(results[0]?.type).toBe('TextField');
    });

    it('should be case-insensitive', () => {
      const results = registry.searchCapabilities('PRIMARY');

      expect(results).toHaveLength(1);
      expect(results[0]?.type).toBe('PrimaryButton');
    });

    it('should return multiple matches', () => {
      const results = registry.searchCapabilities('input');

      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateManifest', () => {
    beforeEach(() => {
      registry.register(
        {
          type: 'Button',
          displayName: 'Button',
          description: 'Interactive button',
          category: 'input',
          props: [
            { name: 'label', type: 'string', required: true, description: 'Button text' },
            { name: 'disabled', type: 'boolean', required: false, default: false },
          ],
          slots: [{ name: 'icon', description: 'Icon slot' }],
          events: [{ name: 'onClick', description: 'Click event' }],
          tags: ['button', 'action'],
        },
        () => null
      );
      registry.register(
        {
          type: 'Text',
          displayName: 'Text',
          description: 'Display text',
          category: 'display',
          props: [{ name: 'children', type: 'string', required: true }],
          deprecated: true,
        },
        () => null
      );
    });

    it('should generate a complete manifest', () => {
      const manifest = registry.generateManifest();

      expect(manifest.version).toBe('1.0');
      expect(manifest.componentCount).toBe(2);
      expect(manifest.categories).toEqual({ input: 1, display: 1 });
    });

    it('should include component details in manifest', () => {
      const manifest = registry.generateManifest();
      const buttonManifest = manifest.components.find((c) => c.type === 'Button');

      expect(buttonManifest).toBeDefined();
      expect(buttonManifest?.displayName).toBe('Button');
      expect(buttonManifest?.props).toHaveLength(2);
      expect(buttonManifest?.props[0]?.required).toBe(true);
      expect(buttonManifest?.slots).toHaveLength(1);
      expect(buttonManifest?.events).toHaveLength(1);
      expect(buttonManifest?.tags).toContain('button');
    });

    it('should include deprecation info', () => {
      const manifest = registry.generateManifest();
      const textManifest = manifest.components.find((c) => c.type === 'Text');

      expect(textManifest?.deprecated).toBe(true);
    });
  });

  describe('generateCompactManifest', () => {
    beforeEach(() => {
      registry.register(
        {
          type: 'ComplexComponent',
          displayName: 'Complex Component',
          description: 'This is a very long description that should be truncated in the compact manifest to save tokens',
          category: 'display',
          props: [
            { name: 'required1', type: 'string', required: true },
            { name: 'required2', type: 'number', required: true },
            { name: 'optional1', type: 'boolean', required: false },
          ],
        },
        () => null
      );
    });

    it('should generate compact manifest with abbreviated keys', () => {
      const compact = registry.generateCompactManifest();

      expect(compact.v).toBe('1.0');
      expect(compact.c).toHaveLength(1);
      expect(compact.c[0]?.t).toBe('ComplexComponent');
      expect(compact.c[0]?.cat).toBe('display');
    });

    it('should truncate descriptions', () => {
      const compact = registry.generateCompactManifest();

      expect(compact.c[0]?.d.length).toBeLessThanOrEqual(100);
    });

    it('should only include required props', () => {
      const compact = registry.generateCompactManifest();

      expect(compact.c[0]?.p).toHaveLength(2);
      expect(compact.c[0]?.p).toContain('required1');
      expect(compact.c[0]?.p).toContain('required2');
      expect(compact.c[0]?.p).not.toContain('optional1');
    });
  });

  describe('clear', () => {
    it('should remove all registered components', () => {
      registry.register(
        { type: 'Comp1', displayName: 'C1', description: 'C1', category: 'display', props: [] },
        () => null
      );
      registry.register(
        { type: 'Comp2', displayName: 'C2', description: 'C2', category: 'display', props: [] },
        () => null
      );

      expect(registry.getRegisteredTypes()).toHaveLength(2);

      registry.clear();

      expect(registry.getRegisteredTypes()).toHaveLength(0);
      expect(registry.isAllowed('Comp1')).toBe(false);
    });
  });
});

describe('Default Registry', () => {
  it('should create and return a default registry', () => {
    const defaultReg = getDefaultRegistry();

    expect(defaultReg).toBeInstanceOf(ComponentRegistry);
  });

  it('should return the same instance on multiple calls', () => {
    const first = getDefaultRegistry();
    const second = getDefaultRegistry();

    expect(first).toBe(second);
  });

  it('should allow setting a custom default registry', () => {
    const customRegistry = createRegistry();
    customRegistry.register(
      { type: 'Custom', displayName: 'Custom', description: 'Custom', category: 'display', props: [] },
      () => null
    );

    setDefaultRegistry(customRegistry);
    const defaultReg = getDefaultRegistry();

    expect(defaultReg).toBe(customRegistry);
    expect(defaultReg.isAllowed('Custom')).toBe(true);
  });
});

describe('Built-in Components', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = createRegistry();
  });

  it('should provide built-in components array', () => {
    expect(Array.isArray(builtinComponents)).toBe(true);
    expect(builtinComponents.length).toBeGreaterThan(0);
  });

  it('should register all built-in components', () => {
    registerBuiltins(registry);

    expect(registry.getRegisteredTypes().length).toBe(builtinComponents.length);
  });

  it('should include layout components', () => {
    registerBuiltins(registry);

    expect(registry.isAllowed('Box')).toBe(true);
    expect(registry.isAllowed('Stack')).toBe(true);
    expect(registry.isAllowed('Grid')).toBe(true);
  });

  it('should include text components', () => {
    registerBuiltins(registry);

    expect(registry.isAllowed('Text')).toBe(true);
    expect(registry.isAllowed('Heading')).toBe(true);
  });

  it('should include input components', () => {
    registerBuiltins(registry);

    expect(registry.isAllowed('Button')).toBe(true);
    expect(registry.isAllowed('Input')).toBe(true);
  });

  it('should include feedback components', () => {
    registerBuiltins(registry);

    expect(registry.isAllowed('Alert')).toBe(true);
    expect(registry.isAllowed('Spinner')).toBe(true);
  });

  it('should have proper categories for built-in components', () => {
    registerBuiltins(registry);

    expect(registry.getCapability('Box')?.category).toBe('layout');
    expect(registry.getCapability('Text')?.category).toBe('display');
    expect(registry.getCapability('Button')?.category).toBe('input');
    expect(registry.getCapability('Alert')?.category).toBe('feedback');
  });

  it('should have renderers for all built-in components', () => {
    registerBuiltins(registry);

    for (const type of registry.getRegisteredTypes()) {
      const renderer = registry.getRenderer(type);
      expect(renderer).toBeDefined();
      expect(typeof renderer).toBe('function');
    }
  });

  describe('Built-in component capabilities', () => {
    beforeEach(() => {
      registerBuiltins(registry);
    });

    it('Button should have correct props', () => {
      const cap = registry.getCapability('Button');

      expect(cap?.props.find((p) => p.name === 'children')).toBeDefined();
      expect(cap?.props.find((p) => p.name === 'variant')).toBeDefined();
      expect(cap?.props.find((p) => p.name === 'disabled')).toBeDefined();
    });

    it('Input should have correct props', () => {
      const cap = registry.getCapability('Input');

      expect(cap?.props.find((p) => p.name === 'type')).toBeDefined();
      expect(cap?.props.find((p) => p.name === 'placeholder')).toBeDefined();
      expect(cap?.props.find((p) => p.name === 'value')).toBeDefined();
    });

    it('Stack should have direction and gap props', () => {
      const cap = registry.getCapability('Stack');

      expect(cap?.props.find((p) => p.name === 'direction')).toBeDefined();
      expect(cap?.props.find((p) => p.name === 'gap')).toBeDefined();
    });

    it('Alert should have variant prop with enum values', () => {
      const cap = registry.getCapability('Alert');
      const variantProp = cap?.props.find((p) => p.name === 'variant');

      expect(variantProp).toBeDefined();
      expect(variantProp?.enum).toContain('info');
      expect(variantProp?.enum).toContain('error');
    });
  });
});
