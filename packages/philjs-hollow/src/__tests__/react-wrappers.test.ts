/**
 * @philjs/hollow - React Wrappers Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createReactWrapper,
  Button,
  Input,
  Card,
  Modal,
  Select,
  Checkbox,
  Switch,
  Tabs,
  Accordion,
  AccordionItem,
  useHollowEvent,
  type ButtonProps,
  type InputProps,
  type CardProps,
  type ModalProps,
  type SelectProps,
  type CheckboxProps,
  type SwitchProps,
  type TabsProps,
  type AccordionProps,
} from '../wrappers/react.js';

describe('createReactWrapper', () => {
  it('should create a wrapper with correct tag name', () => {
    const TestWrapper = createReactWrapper<{ value?: string }>(
      'test-element',
      [{ name: 'value', type: 'string' }]
    );

    expect(TestWrapper).toBeDefined();
    expect(typeof TestWrapper).toBe('function');
  });

  it('should create wrapper with display name', () => {
    const TestWrapper = createReactWrapper<{ value?: string }>(
      'hollow-test-component',
      [{ name: 'value', type: 'string' }]
    );

    expect((TestWrapper as { displayName?: string }).displayName).toBe('TestComponent');
  });

  it('should handle boolean props', () => {
    const TestWrapper = createReactWrapper<{ disabled?: boolean }>(
      'test-element',
      [{ name: 'disabled', type: 'boolean' }]
    );

    const result = TestWrapper({ disabled: true });

    expect(result).toBeDefined();
    expect(result.props.disabled).toBe('');
  });

  it('should handle array props by serializing to JSON', () => {
    const TestWrapper = createReactWrapper<{ items?: string[] }>(
      'test-element',
      [{ name: 'items', type: 'array' }]
    );

    const items = ['a', 'b', 'c'];
    const result = TestWrapper({ items });

    expect(result).toBeDefined();
    expect(result.props.items).toBe(JSON.stringify(items));
  });

  it('should handle object props by serializing to JSON', () => {
    const TestWrapper = createReactWrapper<{ config?: Record<string, unknown> }>(
      'test-element',
      [{ name: 'config', type: 'object' }]
    );

    const config = { key: 'value' };
    const result = TestWrapper({ config });

    expect(result).toBeDefined();
    expect(result.props.config).toBe(JSON.stringify(config));
  });

  it('should map custom attribute names', () => {
    const TestWrapper = createReactWrapper<{ closeOnBackdrop?: boolean }>(
      'test-element',
      [{ name: 'closeOnBackdrop', attribute: 'close-on-backdrop', type: 'boolean' }]
    );

    const result = TestWrapper({ closeOnBackdrop: true });

    expect(result.props['close-on-backdrop']).toBe('');
  });
});

describe('Button wrapper', () => {
  it('should create button with default props', () => {
    const result = Button({});

    expect(result.type).toBe('hollow-button');
  });

  it('should pass variant prop', () => {
    const result = Button({ variant: 'secondary' });

    expect(result.props.variant).toBe('secondary');
  });

  it('should pass size prop', () => {
    const result = Button({ size: 'lg' });

    expect(result.props.size).toBe('lg');
  });

  it('should handle disabled state', () => {
    const result = Button({ disabled: true });

    expect(result.props.disabled).toBe('');
  });

  it('should handle loading state', () => {
    const result = Button({ loading: true });

    expect(result.props.loading).toBe('');
  });

  it('should pass children', () => {
    const result = Button({ children: 'Click me' });

    expect(result.props.children).toBe('Click me');
  });
});

describe('Input wrapper', () => {
  it('should create input with default props', () => {
    const result = Input({});

    expect(result.type).toBe('hollow-input');
  });

  it('should pass value prop', () => {
    const result = Input({ value: 'test value' });

    expect(result.props.value).toBe('test value');
  });

  it('should pass type prop', () => {
    const result = Input({ type: 'email' });

    expect(result.props.type).toBe('email');
  });

  it('should pass placeholder prop', () => {
    const result = Input({ placeholder: 'Enter text...' });

    expect(result.props.placeholder).toBe('Enter text...');
  });

  it('should handle disabled state', () => {
    const result = Input({ disabled: true });

    expect(result.props.disabled).toBe('');
  });

  it('should pass error prop', () => {
    const result = Input({ error: 'This field is required' });

    expect(result.props.error).toBe('This field is required');
  });
});

describe('Card wrapper', () => {
  it('should create card with default props', () => {
    const result = Card({});

    expect(result.type).toBe('hollow-card');
  });

  it('should pass variant prop', () => {
    const result = Card({ variant: 'elevated' });

    expect(result.props.variant).toBe('elevated');
  });

  it('should pass padding prop', () => {
    const result = Card({ padding: 'lg' });

    expect(result.props.padding).toBe('lg');
  });

  it('should handle interactive state', () => {
    const result = Card({ interactive: true });

    expect(result.props.interactive).toBe('');
  });

  it('should handle selected state', () => {
    const result = Card({ selected: true });

    expect(result.props.selected).toBe('');
  });
});

describe('Modal wrapper', () => {
  it('should create modal with default props', () => {
    const result = Modal({});

    expect(result.type).toBe('hollow-modal');
  });

  it('should pass open prop', () => {
    const result = Modal({ open: true });

    expect(result.props.open).toBe('');
  });

  it('should pass size prop', () => {
    const result = Modal({ size: 'lg' });

    expect(result.props.size).toBe('lg');
  });

  it('should map closeOnBackdrop to attribute', () => {
    const result = Modal({ closeOnBackdrop: true });

    expect(result.props['close-on-backdrop']).toBe('');
  });

  it('should map closeOnEscape to attribute', () => {
    const result = Modal({ closeOnEscape: true });

    expect(result.props['close-on-escape']).toBe('');
  });

  it('should handle persistent state', () => {
    const result = Modal({ persistent: true });

    expect(result.props.persistent).toBe('');
  });
});

describe('Select wrapper', () => {
  it('should create select with default props', () => {
    const result = Select({});

    expect(result.type).toBe('hollow-select');
  });

  it('should serialize options array', () => {
    const options = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ];
    const result = Select({ options });

    expect(result.props.options).toBe(JSON.stringify(options));
  });

  it('should pass value prop', () => {
    const result = Select({ value: 'selected' });

    expect(result.props.value).toBe('selected');
  });

  it('should handle searchable state', () => {
    const result = Select({ searchable: true });

    expect(result.props.searchable).toBe('');
  });

  it('should handle clearable state', () => {
    const result = Select({ clearable: true });

    expect(result.props.clearable).toBe('');
  });

  it('should handle multiple state', () => {
    const result = Select({ multiple: true });

    expect(result.props.multiple).toBe('');
  });
});

describe('Checkbox wrapper', () => {
  it('should create checkbox with default props', () => {
    const result = Checkbox({});

    expect(result.type).toBe('hollow-checkbox');
  });

  it('should pass variant prop', () => {
    const result = Checkbox({ variant: 'success' });

    expect(result.props.variant).toBe('success');
  });

  it('should handle checked state', () => {
    const result = Checkbox({ checked: true });

    expect(result.props.checked).toBe('');
  });

  it('should handle indeterminate state', () => {
    const result = Checkbox({ indeterminate: true });

    expect(result.props.indeterminate).toBe('');
  });

  it('should pass name and value', () => {
    const result = Checkbox({ name: 'agree', value: 'yes' });

    expect(result.props.name).toBe('agree');
    expect(result.props.value).toBe('yes');
  });
});

describe('Switch wrapper', () => {
  it('should create switch with default props', () => {
    const result = Switch({});

    expect(result.type).toBe('hollow-switch');
  });

  it('should handle checked state', () => {
    const result = Switch({ checked: true });

    expect(result.props.checked).toBe('');
  });

  it('should map labelOn to attribute', () => {
    const result = Switch({ labelOn: 'ON' });

    expect(result.props['label-on']).toBe('ON');
  });

  it('should map labelOff to attribute', () => {
    const result = Switch({ labelOff: 'OFF' });

    expect(result.props['label-off']).toBe('OFF');
  });
});

describe('Tabs wrapper', () => {
  it('should create tabs with default props', () => {
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

describe('Accordion wrapper', () => {
  it('should create accordion with default props', () => {
    const result = Accordion({});

    expect(result.type).toBe('hollow-accordion');
  });

  it('should serialize items array', () => {
    const items = [
      { id: 'item1', title: 'Section 1' },
      { id: 'item2', title: 'Section 2' },
    ];
    const result = Accordion({ items });

    expect(result.props.items).toBe(JSON.stringify(items));
  });

  it('should handle multiple state', () => {
    const result = Accordion({ multiple: true });

    expect(result.props.multiple).toBe('');
  });

  it('should handle collapsible state', () => {
    const result = Accordion({ collapsible: true });

    expect(result.props.collapsible).toBe('');
  });

  it('should pass expanded prop', () => {
    const result = Accordion({ expanded: 'item1,item2' });

    expect(result.props.expanded).toBe('item1,item2');
  });
});

describe('AccordionItem wrapper', () => {
  it('should create accordion item with default props', () => {
    const result = AccordionItem({});

    expect(result.type).toBe('hollow-accordion-item');
  });

  it('should pass title prop', () => {
    const result = AccordionItem({ title: 'Section Title' });

    expect(result.props.title).toBe('Section Title');
  });

  it('should handle expanded state', () => {
    const result = AccordionItem({ expanded: true });

    expect(result.props.expanded).toBe('');
  });

  it('should handle disabled state', () => {
    const result = AccordionItem({ disabled: true });

    expect(result.props.disabled).toBe('');
  });

  it('should pass icon prop', () => {
    const result = AccordionItem({ icon: '<svg>...</svg>' });

    expect(result.props.icon).toBe('<svg>...</svg>');
  });
});

describe('useHollowEvent hook', () => {
  it('should attach event listener to element', () => {
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

  it('should handle null ref gracefully', () => {
    const ref = { current: null };
    const handler = vi.fn();

    // Should not throw
    expect(() => useHollowEvent(ref, 'hollow-click', handler)).not.toThrow();
  });
});

describe('TypeScript types', () => {
  it('should accept valid ButtonProps', () => {
    const props: ButtonProps = {
      variant: 'primary',
      size: 'md',
      disabled: false,
      loading: false,
      type: 'button',
    };

    expect(props.variant).toBe('primary');
  });

  it('should accept valid InputProps', () => {
    const props: InputProps = {
      variant: 'default',
      size: 'md',
      type: 'text',
      value: 'test',
      placeholder: 'Enter...',
    };

    expect(props.type).toBe('text');
  });

  it('should accept valid CardProps', () => {
    const props: CardProps = {
      variant: 'default',
      padding: 'md',
      interactive: true,
      selected: false,
    };

    expect(props.interactive).toBe(true);
  });

  it('should accept valid ModalProps', () => {
    const props: ModalProps = {
      open: true,
      size: 'md',
      animation: 'scale',
      closable: true,
      closeOnBackdrop: true,
      closeOnEscape: true,
    };

    expect(props.open).toBe(true);
  });

  it('should accept valid SelectProps', () => {
    const props: SelectProps = {
      options: [{ value: 'a', label: 'A' }],
      value: 'a',
      searchable: true,
      clearable: true,
      multiple: false,
    };

    expect(props.options).toHaveLength(1);
  });

  it('should accept valid CheckboxProps', () => {
    const props: CheckboxProps = {
      variant: 'primary',
      size: 'md',
      checked: true,
      indeterminate: false,
    };

    expect(props.checked).toBe(true);
  });

  it('should accept valid SwitchProps', () => {
    const props: SwitchProps = {
      variant: 'primary',
      size: 'md',
      checked: true,
      labelOn: 'ON',
      labelOff: 'OFF',
    };

    expect(props.labelOn).toBe('ON');
  });

  it('should accept valid TabsProps', () => {
    const props: TabsProps = {
      variant: 'default',
      size: 'md',
      active: 'tab1',
      alignment: 'start',
      tabs: [{ id: 'tab1', label: 'Tab 1' }],
    };

    expect(props.tabs).toHaveLength(1);
  });

  it('should accept valid AccordionProps', () => {
    const props: AccordionProps = {
      variant: 'default',
      multiple: true,
      collapsible: true,
      items: [{ id: 'item1', title: 'Item 1' }],
    };

    expect(props.items).toHaveLength(1);
  });
});
