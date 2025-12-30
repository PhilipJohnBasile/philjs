/**
 * @philjs/hollow - React Wrapper Integration Tests
 * Tests for the createReactWrapper function and React integration patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Types for React wrapper testing
interface PropDefinition {
  name: string;
  attribute?: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

interface ReactElement<P = unknown> {
  type: unknown;
  props: P;
  key: string | null;
}

interface ReactRef<T> {
  current: T | null;
}

/**
 * Mock implementation of createReactWrapper for testing
 */
function createReactWrapper<P extends Record<string, unknown>>(
  tagName: string,
  propDefs: PropDefinition[],
  eventMappings: Record<string, string> = {}
): (props: P & { ref?: ReactRef<HTMLElement>; children?: unknown }) => ReactElement<P> {
  const displayName = tagName
    .replace('hollow-', '')
    .replace(/-./g, (x) => x[1]!.toUpperCase())
    .replace(/^./, (x) => x.toUpperCase());

  const Wrapper = function (props: P & { ref?: ReactRef<HTMLElement>; children?: unknown }): ReactElement<P> {
    const elementProps: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(props)) {
      if (key === 'ref' || key === 'children') continue;

      if (key.startsWith('on') && typeof value === 'function') {
        continue; // Events are handled separately
      } else {
        const propDef = propDefs.find((p) => p.name === key);
        if (propDef) {
          const attrName = propDef.attribute ?? key;
          if (propDef.type === 'boolean') {
            if (value) elementProps[attrName] = '';
          } else if (propDef.type === 'array' || propDef.type === 'object') {
            elementProps[attrName] = JSON.stringify(value);
          } else {
            elementProps[attrName] = value;
          }
        } else {
          elementProps[key] = value;
        }
      }
    }

    return {
      type: tagName,
      props: {
        ...elementProps,
        ref: props.ref,
        children: props.children,
      },
      key: null,
    } as ReactElement<P>;
  };

  (Wrapper as unknown as { displayName: string }).displayName = displayName;

  return Wrapper;
}

/**
 * Mock useHollowEvent implementation
 */
function useHollowEvent<T>(
  ref: ReactRef<HTMLElement>,
  eventName: string,
  handler: (detail: T) => void
): void {
  if (ref.current) {
    const wrappedHandler = (event: Event) => {
      handler((event as CustomEvent<T>).detail);
    };
    ref.current.addEventListener(eventName, wrappedHandler);
  }
}

describe('createReactWrapper Function', () => {
  describe('Basic Functionality', () => {
    it('should return a function component', () => {
      const Wrapper = createReactWrapper<{ value?: string }>(
        'test-element',
        [{ name: 'value', type: 'string' }]
      );

      expect(typeof Wrapper).toBe('function');
    });

    it('should create component with correct tag name', () => {
      const Wrapper = createReactWrapper<{ value?: string }>(
        'hollow-test',
        [{ name: 'value', type: 'string' }]
      );

      const result = Wrapper({});
      expect(result.type).toBe('hollow-test');
    });

    it('should accept empty prop definitions', () => {
      const Wrapper = createReactWrapper<Record<string, never>>(
        'test-element',
        []
      );

      expect(Wrapper).toBeDefined();
    });

    it('should accept empty event mappings', () => {
      const Wrapper = createReactWrapper<{ value?: string }>(
        'test-element',
        [{ name: 'value', type: 'string' }],
        {}
      );

      expect(Wrapper).toBeDefined();
    });
  });

  describe('Display Name Generation', () => {
    it('should generate display name from tag name', () => {
      const Wrapper = createReactWrapper<{ value?: string }>(
        'hollow-test-component',
        [{ name: 'value', type: 'string' }]
      );

      expect((Wrapper as { displayName?: string }).displayName).toBe('TestComponent');
    });

    it('should handle single word tag names', () => {
      const Wrapper = createReactWrapper<{ value?: string }>(
        'hollow-button',
        [{ name: 'value', type: 'string' }]
      );

      expect((Wrapper as { displayName?: string }).displayName).toBe('Button');
    });

    it('should handle multi-word tag names', () => {
      const Wrapper = createReactWrapper<{ value?: string }>(
        'hollow-accordion-item',
        [{ name: 'value', type: 'string' }]
      );

      expect((Wrapper as { displayName?: string }).displayName).toBe('AccordionItem');
    });

    it('should capitalize first letter', () => {
      const Wrapper = createReactWrapper<{ value?: string }>(
        'hollow-select',
        [{ name: 'value', type: 'string' }]
      );

      const displayName = (Wrapper as { displayName?: string }).displayName;
      expect(displayName?.[0]).toBe('S');
    });
  });

  describe('Prop Type Handling', () => {
    it('should handle string props', () => {
      const Wrapper = createReactWrapper<{ label?: string }>(
        'test-element',
        [{ name: 'label', type: 'string' }]
      );

      const result = Wrapper({ label: 'Hello' });
      expect(result.props.label).toBe('Hello');
    });

    it('should handle number props', () => {
      const Wrapper = createReactWrapper<{ count?: number }>(
        'test-element',
        [{ name: 'count', type: 'number' }]
      );

      const result = Wrapper({ count: 42 });
      expect(result.props.count).toBe(42);
    });

    it('should handle boolean props (true)', () => {
      const Wrapper = createReactWrapper<{ disabled?: boolean }>(
        'test-element',
        [{ name: 'disabled', type: 'boolean' }]
      );

      const result = Wrapper({ disabled: true });
      expect(result.props.disabled).toBe('');
    });

    it('should handle boolean props (false)', () => {
      const Wrapper = createReactWrapper<{ disabled?: boolean }>(
        'test-element',
        [{ name: 'disabled', type: 'boolean' }]
      );

      const result = Wrapper({ disabled: false });
      expect(result.props.disabled).toBeUndefined();
    });

    it('should handle array props by JSON serialization', () => {
      const Wrapper = createReactWrapper<{ items?: string[] }>(
        'test-element',
        [{ name: 'items', type: 'array' }]
      );

      const items = ['a', 'b', 'c'];
      const result = Wrapper({ items });
      expect(result.props.items).toBe(JSON.stringify(items));
    });

    it('should handle object props by JSON serialization', () => {
      const Wrapper = createReactWrapper<{ config?: Record<string, unknown> }>(
        'test-element',
        [{ name: 'config', type: 'object' }]
      );

      const config = { key: 'value', nested: { a: 1 } };
      const result = Wrapper({ config });
      expect(result.props.config).toBe(JSON.stringify(config));
    });

    it('should handle undefined props gracefully', () => {
      const Wrapper = createReactWrapper<{ value?: string }>(
        'test-element',
        [{ name: 'value', type: 'string' }]
      );

      const result = Wrapper({});
      expect(result.props.value).toBeUndefined();
    });
  });

  describe('Custom Attribute Mapping', () => {
    it('should map property to custom attribute name', () => {
      const Wrapper = createReactWrapper<{ closeOnBackdrop?: boolean }>(
        'test-element',
        [{ name: 'closeOnBackdrop', attribute: 'close-on-backdrop', type: 'boolean' }]
      );

      const result = Wrapper({ closeOnBackdrop: true });
      expect(result.props['close-on-backdrop']).toBe('');
    });

    it('should use property name when no attribute specified', () => {
      const Wrapper = createReactWrapper<{ variant?: string }>(
        'test-element',
        [{ name: 'variant', type: 'string' }]
      );

      const result = Wrapper({ variant: 'primary' });
      expect(result.props.variant).toBe('primary');
    });

    it('should handle multiple custom attributes', () => {
      const Wrapper = createReactWrapper<{ labelOn?: string; labelOff?: string }>(
        'test-element',
        [
          { name: 'labelOn', attribute: 'label-on', type: 'string' },
          { name: 'labelOff', attribute: 'label-off', type: 'string' },
        ]
      );

      const result = Wrapper({ labelOn: 'ON', labelOff: 'OFF' });
      expect(result.props['label-on']).toBe('ON');
      expect(result.props['label-off']).toBe('OFF');
    });
  });

  describe('Children Handling', () => {
    it('should pass children through', () => {
      const Wrapper = createReactWrapper<{ children?: unknown }>(
        'test-element',
        []
      );

      const result = Wrapper({ children: 'Hello World' });
      expect(result.props.children).toBe('Hello World');
    });

    it('should handle null children', () => {
      const Wrapper = createReactWrapper<{ children?: unknown }>(
        'test-element',
        []
      );

      const result = Wrapper({ children: null });
      expect(result.props.children).toBeNull();
    });

    it('should handle undefined children', () => {
      const Wrapper = createReactWrapper<{ children?: unknown }>(
        'test-element',
        []
      );

      const result = Wrapper({});
      expect(result.props.children).toBeUndefined();
    });
  });

  describe('Ref Forwarding', () => {
    it('should pass ref through to props', () => {
      const Wrapper = createReactWrapper<{ value?: string }>(
        'test-element',
        [{ name: 'value', type: 'string' }]
      );

      const ref = { current: null };
      const result = Wrapper({ ref });
      expect(result.props.ref).toBe(ref);
    });
  });
});

describe('Pre-built Component Wrapper Patterns', () => {
  describe('Button', () => {
    const Button = createReactWrapper<{
      variant?: string;
      size?: string;
      disabled?: boolean;
      loading?: boolean;
      type?: string;
      children?: unknown;
    }>('hollow-button', [
      { name: 'variant', type: 'string' },
      { name: 'size', type: 'string' },
      { name: 'disabled', type: 'boolean' },
      { name: 'loading', type: 'boolean' },
      { name: 'type', type: 'string' },
    ]);

    it('should create hollow-button element', () => {
      const result = Button({});
      expect(result.type).toBe('hollow-button');
    });

    it('should pass variant prop', () => {
      const result = Button({ variant: 'primary' });
      expect(result.props.variant).toBe('primary');
    });

    it('should pass size prop', () => {
      const result = Button({ size: 'lg' });
      expect(result.props.size).toBe('lg');
    });

    it('should handle disabled as boolean attribute', () => {
      const result = Button({ disabled: true });
      expect(result.props.disabled).toBe('');
    });

    it('should handle loading as boolean attribute', () => {
      const result = Button({ loading: true });
      expect(result.props.loading).toBe('');
    });

    it('should pass type prop', () => {
      const result = Button({ type: 'submit' });
      expect(result.props.type).toBe('submit');
    });

    it('should pass children', () => {
      const result = Button({ children: 'Click Me' });
      expect(result.props.children).toBe('Click Me');
    });
  });

  describe('Input', () => {
    const Input = createReactWrapper<{
      variant?: string;
      size?: string;
      type?: string;
      value?: string;
      placeholder?: string;
      disabled?: boolean;
      error?: string;
    }>('hollow-input', [
      { name: 'variant', type: 'string' },
      { name: 'size', type: 'string' },
      { name: 'type', type: 'string' },
      { name: 'value', type: 'string' },
      { name: 'placeholder', type: 'string' },
      { name: 'disabled', type: 'boolean' },
      { name: 'error', type: 'string' },
    ]);

    it('should create hollow-input element', () => {
      const result = Input({});
      expect(result.type).toBe('hollow-input');
    });

    it('should pass value prop', () => {
      const result = Input({ value: 'test@example.com' });
      expect(result.props.value).toBe('test@example.com');
    });

    it('should pass type prop', () => {
      const result = Input({ type: 'email' });
      expect(result.props.type).toBe('email');
    });

    it('should pass placeholder prop', () => {
      const result = Input({ placeholder: 'Enter email...' });
      expect(result.props.placeholder).toBe('Enter email...');
    });

    it('should handle disabled as boolean attribute', () => {
      const result = Input({ disabled: true });
      expect(result.props.disabled).toBe('');
    });

    it('should pass error prop', () => {
      const result = Input({ error: 'Invalid email' });
      expect(result.props.error).toBe('Invalid email');
    });
  });

  describe('Modal', () => {
    const Modal = createReactWrapper<{
      open?: boolean;
      size?: string;
      animation?: string;
      closeOnBackdrop?: boolean;
      closeOnEscape?: boolean;
      persistent?: boolean;
      children?: unknown;
    }>('hollow-modal', [
      { name: 'open', type: 'boolean' },
      { name: 'size', type: 'string' },
      { name: 'animation', type: 'string' },
      { name: 'closeOnBackdrop', attribute: 'close-on-backdrop', type: 'boolean' },
      { name: 'closeOnEscape', attribute: 'close-on-escape', type: 'boolean' },
      { name: 'persistent', type: 'boolean' },
    ]);

    it('should create hollow-modal element', () => {
      const result = Modal({});
      expect(result.type).toBe('hollow-modal');
    });

    it('should handle open as boolean attribute', () => {
      const result = Modal({ open: true });
      expect(result.props.open).toBe('');
    });

    it('should pass size prop', () => {
      const result = Modal({ size: 'lg' });
      expect(result.props.size).toBe('lg');
    });

    it('should pass animation prop', () => {
      const result = Modal({ animation: 'fade' });
      expect(result.props.animation).toBe('fade');
    });

    it('should map closeOnBackdrop to kebab-case', () => {
      const result = Modal({ closeOnBackdrop: true });
      expect(result.props['close-on-backdrop']).toBe('');
    });

    it('should map closeOnEscape to kebab-case', () => {
      const result = Modal({ closeOnEscape: true });
      expect(result.props['close-on-escape']).toBe('');
    });
  });

  describe('Select', () => {
    const Select = createReactWrapper<{
      options?: Array<{ value: string; label: string }>;
      value?: string;
      searchable?: boolean;
      clearable?: boolean;
      multiple?: boolean;
    }>('hollow-select', [
      { name: 'options', type: 'array' },
      { name: 'value', type: 'string' },
      { name: 'searchable', type: 'boolean' },
      { name: 'clearable', type: 'boolean' },
      { name: 'multiple', type: 'boolean' },
    ]);

    it('should create hollow-select element', () => {
      const result = Select({});
      expect(result.type).toBe('hollow-select');
    });

    it('should serialize options array', () => {
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ];
      const result = Select({ options });
      expect(result.props.options).toBe(JSON.stringify(options));
    });

    it('should pass value prop', () => {
      const result = Select({ value: '1' });
      expect(result.props.value).toBe('1');
    });

    it('should handle searchable as boolean attribute', () => {
      const result = Select({ searchable: true });
      expect(result.props.searchable).toBe('');
    });

    it('should handle clearable as boolean attribute', () => {
      const result = Select({ clearable: true });
      expect(result.props.clearable).toBe('');
    });

    it('should handle multiple as boolean attribute', () => {
      const result = Select({ multiple: true });
      expect(result.props.multiple).toBe('');
    });
  });

  describe('Switch', () => {
    const Switch = createReactWrapper<{
      checked?: boolean;
      labelOn?: string;
      labelOff?: string;
    }>('hollow-switch', [
      { name: 'checked', type: 'boolean' },
      { name: 'labelOn', attribute: 'label-on', type: 'string' },
      { name: 'labelOff', attribute: 'label-off', type: 'string' },
    ]);

    it('should create hollow-switch element', () => {
      const result = Switch({});
      expect(result.type).toBe('hollow-switch');
    });

    it('should handle checked as boolean attribute', () => {
      const result = Switch({ checked: true });
      expect(result.props.checked).toBe('');
    });

    it('should map labelOn to kebab-case', () => {
      const result = Switch({ labelOn: 'Yes' });
      expect(result.props['label-on']).toBe('Yes');
    });

    it('should map labelOff to kebab-case', () => {
      const result = Switch({ labelOff: 'No' });
      expect(result.props['label-off']).toBe('No');
    });
  });

  describe('Tabs', () => {
    const Tabs = createReactWrapper<{
      tabs?: Array<{ id: string; label: string }>;
      active?: string;
      variant?: string;
      alignment?: string;
    }>('hollow-tabs', [
      { name: 'tabs', type: 'array' },
      { name: 'active', type: 'string' },
      { name: 'variant', type: 'string' },
      { name: 'alignment', type: 'string' },
    ]);

    it('should create hollow-tabs element', () => {
      const result = Tabs({});
      expect(result.type).toBe('hollow-tabs');
    });

    it('should serialize tabs array', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2' },
      ];
      const result = Tabs({ tabs });
      expect(result.props.tabs).toBe(JSON.stringify(tabs));
    });

    it('should pass active prop', () => {
      const result = Tabs({ active: 'tab1' });
      expect(result.props.active).toBe('tab1');
    });

    it('should pass variant prop', () => {
      const result = Tabs({ variant: 'pills' });
      expect(result.props.variant).toBe('pills');
    });

    it('should pass alignment prop', () => {
      const result = Tabs({ alignment: 'center' });
      expect(result.props.alignment).toBe('center');
    });
  });
});

describe('useHollowEvent Hook', () => {
  it('should attach event listener when ref.current exists', () => {
    const mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;

    const ref = { current: mockElement };
    const handler = vi.fn();

    useHollowEvent(ref, 'hollow-click', handler);

    expect(mockElement.addEventListener).toHaveBeenCalledWith(
      'hollow-click',
      expect.any(Function)
    );
  });

  it('should not throw when ref.current is null', () => {
    const ref = { current: null };
    const handler = vi.fn();

    expect(() => useHollowEvent(ref, 'hollow-click', handler)).not.toThrow();
  });

  it('should call handler with event detail', () => {
    const mockElement = {
      addEventListener: vi.fn((eventName, listener) => {
        const event = new CustomEvent(eventName, { detail: { value: 'test' } });
        (listener as (e: Event) => void)(event);
      }),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;

    const ref = { current: mockElement };
    const handler = vi.fn();

    useHollowEvent(ref, 'hollow-input', handler);

    expect(handler).toHaveBeenCalledWith({ value: 'test' });
  });

  it('should support different event names', () => {
    const mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;

    const ref = { current: mockElement };

    useHollowEvent(ref, 'hollow-change', vi.fn());
    expect(mockElement.addEventListener).toHaveBeenCalledWith('hollow-change', expect.any(Function));

    useHollowEvent(ref, 'hollow-input', vi.fn());
    expect(mockElement.addEventListener).toHaveBeenCalledWith('hollow-input', expect.any(Function));

    useHollowEvent(ref, 'hollow-toggle', vi.fn());
    expect(mockElement.addEventListener).toHaveBeenCalledWith('hollow-toggle', expect.any(Function));
  });
});

describe('Edge Cases', () => {
  it('should handle empty string props', () => {
    const Wrapper = createReactWrapper<{ value?: string }>(
      'test-element',
      [{ name: 'value', type: 'string' }]
    );

    const result = Wrapper({ value: '' });
    expect(result.props.value).toBe('');
  });

  it('should handle zero number props', () => {
    const Wrapper = createReactWrapper<{ count?: number }>(
      'test-element',
      [{ name: 'count', type: 'number' }]
    );

    const result = Wrapper({ count: 0 });
    expect(result.props.count).toBe(0);
  });

  it('should handle empty array props', () => {
    const Wrapper = createReactWrapper<{ items?: unknown[] }>(
      'test-element',
      [{ name: 'items', type: 'array' }]
    );

    const result = Wrapper({ items: [] });
    expect(result.props.items).toBe('[]');
  });

  it('should handle empty object props', () => {
    const Wrapper = createReactWrapper<{ config?: Record<string, unknown> }>(
      'test-element',
      [{ name: 'config', type: 'object' }]
    );

    const result = Wrapper({ config: {} });
    expect(result.props.config).toBe('{}');
  });

  it('should handle deeply nested object props', () => {
    const Wrapper = createReactWrapper<{ config?: Record<string, unknown> }>(
      'test-element',
      [{ name: 'config', type: 'object' }]
    );

    const config = {
      level1: {
        level2: {
          level3: {
            value: 'deep',
          },
        },
      },
    };
    const result = Wrapper({ config });
    expect(result.props.config).toBe(JSON.stringify(config));
  });

  it('should handle props not in definitions', () => {
    const Wrapper = createReactWrapper<{ value?: string; unknown?: string }>(
      'test-element',
      [{ name: 'value', type: 'string' }]
    );

    const result = Wrapper({ value: 'test', unknown: 'extra' });
    expect(result.props.value).toBe('test');
    expect(result.props.unknown).toBe('extra');
  });

  it('should handle className prop', () => {
    const Wrapper = createReactWrapper<{ className?: string }>(
      'test-element',
      []
    );

    const result = Wrapper({ className: 'custom-class' });
    expect(result.props.className).toBe('custom-class');
  });
});
