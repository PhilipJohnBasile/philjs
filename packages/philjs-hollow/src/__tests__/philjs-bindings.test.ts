/**
 * @philjs/hollow - PhilJS Bindings Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  bindProp,
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
  useHollowRef,
  hollowProps,
  type Accessor,
  type ReactiveProps,
  type HollowButtonProps,
  type HollowInputProps,
  type HollowCardProps,
  type HollowModalProps,
  type HollowSelectProps,
  type HollowCheckboxProps,
  type HollowSwitchProps,
  type HollowTabsProps,
  type HollowAccordionProps,
  type HollowAccordionItemProps,
} from '../wrappers/philjs.js';

describe('bindProp', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should set initial value from accessor', () => {
    const accessor: Accessor<string> = () => 'primary';
    bindProp(mockElement, 'variant', accessor);

    expect(mockElement.setAttribute).toHaveBeenCalledWith('variant', 'primary');
  });

  it('should handle boolean values', () => {
    const accessor: Accessor<boolean> = () => true;
    bindProp(mockElement, 'disabled', accessor);

    expect(mockElement.setAttribute).toHaveBeenCalledWith('disabled', '');
  });

  it('should remove attribute for false boolean', () => {
    const accessor: Accessor<boolean> = () => false;
    bindProp(mockElement, 'disabled', accessor);

    expect(mockElement.removeAttribute).toHaveBeenCalledWith('disabled');
  });

  it('should handle null values', () => {
    const accessor: Accessor<null> = () => null;
    bindProp(mockElement, 'value', accessor);

    expect(mockElement.removeAttribute).toHaveBeenCalledWith('value');
  });

  it('should serialize arrays', () => {
    const items = [{ id: '1' }];
    const accessor: Accessor<typeof items> = () => items;
    bindProp(mockElement, 'items', accessor);

    expect(mockElement.setAttribute).toHaveBeenCalledWith('items', JSON.stringify(items));
  });

  it('should serialize objects', () => {
    const config = { key: 'value' };
    const accessor: Accessor<typeof config> = () => config;
    bindProp(mockElement, 'config', accessor);

    expect(mockElement.setAttribute).toHaveBeenCalledWith('config', JSON.stringify(config));
  });

  it('should return update function', () => {
    let value = 'initial';
    const accessor: Accessor<string> = () => value;
    const update = bindProp(mockElement, 'value', accessor);

    expect(typeof update).toBe('function');

    // Update the value and call the update function
    value = 'updated';
    update();

    expect(mockElement.setAttribute).toHaveBeenCalledWith('value', 'updated');
  });
});

describe('Button component factory', () => {
  it('should return element descriptor with correct type', () => {
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

  it('should handle reactive accessor for variant', () => {
    const accessor: Accessor<string> = () => 'primary';
    const result = Button({ variant: accessor });

    expect(result.props.variant).toBe('primary');
  });

  it('should handle disabled state', () => {
    const result = Button({ disabled: true });

    expect(result.props.disabled).toBe(true);
  });

  it('should handle loading state', () => {
    const result = Button({ loading: true });

    expect(result.props.loading).toBe(true);
  });

  it('should attach onClick handler', () => {
    const handler = vi.fn();
    const result = Button({ onClick: handler });

    expect(result.props.__eventHandlers).toBeDefined();
    expect(result.props.__eventHandlers['hollow-click']).toBe(handler);
  });

  it('should pass children', () => {
    const result = Button({ children: 'Click me' });

    expect(result.props.children).toBe('Click me');
  });

  it('should pass ref callback', () => {
    const refCallback = vi.fn();
    const result = Button({ ref: refCallback });

    expect(result.ref).toBe(refCallback);
  });
});

describe('Input component factory', () => {
  it('should return element descriptor with correct type', () => {
    const result = Input({});

    expect(result.type).toBe('hollow-input');
  });

  it('should pass value prop', () => {
    const result = Input({ value: 'test' });

    expect(result.props.value).toBe('test');
  });

  it('should handle reactive accessor for value', () => {
    const accessor: Accessor<string> = () => 'reactive value';
    const result = Input({ value: accessor });

    expect(result.props.value).toBe('reactive value');
  });

  it('should attach onInput handler', () => {
    const handler = vi.fn();
    const result = Input({ onInput: handler });

    expect(result.props.__eventHandlers['hollow-input']).toBe(handler);
  });

  it('should attach onChange handler', () => {
    const handler = vi.fn();
    const result = Input({ onChange: handler });

    expect(result.props.__eventHandlers['hollow-change']).toBe(handler);
  });
});

describe('Card component factory', () => {
  it('should return element descriptor with correct type', () => {
    const result = Card({});

    expect(result.type).toBe('hollow-card');
  });

  it('should handle header slot', () => {
    const result = Card({ header: 'Header Content' });

    expect(result.props.children).toBeDefined();
    expect(Array.isArray(result.props.children)).toBe(true);
  });

  it('should handle footer slot', () => {
    const result = Card({ footer: 'Footer Content' });

    expect(result.props.children).toBeDefined();
  });

  it('should attach onClick handler', () => {
    const handler = vi.fn();
    const result = Card({ onClick: handler });

    expect(result.props.__eventHandlers['hollow-click']).toBe(handler);
  });
});

describe('Modal component factory', () => {
  it('should return element descriptor with correct type', () => {
    const result = Modal({});

    expect(result.type).toBe('hollow-modal');
  });

  it('should map closeOnBackdrop to kebab-case', () => {
    const result = Modal({ closeOnBackdrop: true });

    expect(result.props['close-on-backdrop']).toBe(true);
  });

  it('should map closeOnEscape to kebab-case', () => {
    const result = Modal({ closeOnEscape: true });

    expect(result.props['close-on-escape']).toBe(true);
  });

  it('should attach onOpen handler', () => {
    const handler = vi.fn();
    const result = Modal({ onOpen: handler });

    expect(result.props.__eventHandlers['hollow-open']).toBe(handler);
  });

  it('should attach onClose handler', () => {
    const handler = vi.fn();
    const result = Modal({ onClose: handler });

    expect(result.props.__eventHandlers['hollow-close']).toBe(handler);
  });

  it('should handle header and footer slots', () => {
    const result = Modal({ header: 'Title', footer: 'Actions' });

    expect(result.props.children).toBeDefined();
  });
});

describe('Select component factory', () => {
  it('should return element descriptor with correct type', () => {
    const result = Select({});

    expect(result.type).toBe('hollow-select');
  });

  it('should pass options prop', () => {
    const options = [{ value: 'a', label: 'A' }];
    const result = Select({ options });

    expect(result.props.options).toEqual(options);
  });

  it('should handle reactive accessor for options', () => {
    const options = [{ value: 'a', label: 'A' }];
    const accessor: Accessor<typeof options> = () => options;
    const result = Select({ options: accessor });

    expect(result.props.options).toEqual(options);
  });

  it('should attach onChange handler', () => {
    const handler = vi.fn();
    const result = Select({ onChange: handler });

    expect(result.props.__eventHandlers['hollow-change']).toBe(handler);
  });

  it('should attach onToggle handler', () => {
    const handler = vi.fn();
    const result = Select({ onToggle: handler });

    expect(result.props.__eventHandlers['hollow-toggle']).toBe(handler);
  });
});

describe('Checkbox component factory', () => {
  it('should return element descriptor with correct type', () => {
    const result = Checkbox({});

    expect(result.type).toBe('hollow-checkbox');
  });

  it('should handle reactive accessor for checked', () => {
    const accessor: Accessor<boolean> = () => true;
    const result = Checkbox({ checked: accessor });

    expect(result.props.checked).toBe(true);
  });

  it('should attach onChange handler', () => {
    const handler = vi.fn();
    const result = Checkbox({ onChange: handler });

    expect(result.props.__eventHandlers['hollow-change']).toBe(handler);
  });
});

describe('Switch component factory', () => {
  it('should return element descriptor with correct type', () => {
    const result = Switch({});

    expect(result.type).toBe('hollow-switch');
  });

  it('should map labelOn to kebab-case', () => {
    const result = Switch({ labelOn: 'ON' });

    expect(result.props['label-on']).toBe('ON');
  });

  it('should map labelOff to kebab-case', () => {
    const result = Switch({ labelOff: 'OFF' });

    expect(result.props['label-off']).toBe('OFF');
  });

  it('should attach onChange handler', () => {
    const handler = vi.fn();
    const result = Switch({ onChange: handler });

    expect(result.props.__eventHandlers['hollow-change']).toBe(handler);
  });
});

describe('Tabs component factory', () => {
  it('should return element descriptor with correct type', () => {
    const result = Tabs({});

    expect(result.type).toBe('hollow-tabs');
  });

  it('should pass tabs prop', () => {
    const tabs = [{ id: 'tab1', label: 'Tab 1' }];
    const result = Tabs({ tabs });

    expect(result.props.tabs).toEqual(tabs);
  });

  it('should handle reactive accessor for tabs', () => {
    const tabs = [{ id: 'tab1', label: 'Tab 1' }];
    const accessor: Accessor<typeof tabs> = () => tabs;
    const result = Tabs({ tabs: accessor });

    expect(result.props.tabs).toEqual(tabs);
  });

  it('should attach onChange handler', () => {
    const handler = vi.fn();
    const result = Tabs({ onChange: handler });

    expect(result.props.__eventHandlers['hollow-change']).toBe(handler);
  });
});

describe('Accordion component factory', () => {
  it('should return element descriptor with correct type', () => {
    const result = Accordion({});

    expect(result.type).toBe('hollow-accordion');
  });

  it('should pass items prop', () => {
    const items = [{ id: 'item1', title: 'Item 1' }];
    const result = Accordion({ items });

    expect(result.props.items).toEqual(items);
  });

  it('should attach onChange handler', () => {
    const handler = vi.fn();
    const result = Accordion({ onChange: handler });

    expect(result.props.__eventHandlers['hollow-change']).toBe(handler);
  });
});

describe('AccordionItem component factory', () => {
  it('should return element descriptor with correct type', () => {
    const result = AccordionItem({});

    expect(result.type).toBe('hollow-accordion-item');
  });

  it('should pass title prop', () => {
    const result = AccordionItem({ title: 'Section Title' });

    expect(result.props.title).toBe('Section Title');
  });

  it('should attach onToggle handler', () => {
    const handler = vi.fn();
    const result = AccordionItem({ onToggle: handler });

    expect(result.props.__eventHandlers['hollow-toggle']).toBe(handler);
  });
});

describe('useHollowRef', () => {
  it('should create ref object', () => {
    const ref = useHollowRef();

    expect(ref).toBeDefined();
    expect(ref.current).toBeNull();
    expect(typeof ref.set).toBe('function');
    expect(typeof ref.on).toBe('function');
  });

  it('should set current element', () => {
    const ref = useHollowRef<HTMLElement>();
    const element = {} as HTMLElement;

    ref.set(element);

    expect(ref.current).toBe(element);
  });

  it('should attach event listener when element is set', () => {
    const ref = useHollowRef<HTMLElement>();
    const element = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;

    ref.set(element);

    const handler = vi.fn();
    ref.on('hollow-click', handler);

    expect(element.addEventListener).toHaveBeenCalledWith('hollow-click', expect.any(Function));
  });

  it('should return cleanup function from on', () => {
    const ref = useHollowRef<HTMLElement>();
    const element = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;

    ref.set(element);

    const handler = vi.fn();
    const cleanup = ref.on('hollow-click', handler);

    expect(typeof cleanup).toBe('function');

    cleanup();

    expect(element.removeEventListener).toHaveBeenCalled();
  });

  it('should queue listeners when element not yet set', () => {
    const ref = useHollowRef<HTMLElement>();

    const handler = vi.fn();
    const cleanup = ref.on('hollow-click', handler);

    // Should not throw and return cleanup
    expect(typeof cleanup).toBe('function');
  });
});

describe('hollowProps directive', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should set static props', () => {
    hollowProps(mockElement, { variant: 'primary', size: 'md' });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('variant', 'primary');
    expect(mockElement.setAttribute).toHaveBeenCalledWith('size', 'md');
  });

  it('should set up reactive bindings for accessors', () => {
    const accessor: Accessor<string> = () => 'secondary';
    hollowProps(mockElement, { variant: accessor });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('variant', 'secondary');
  });

  it('should return cleanup function', () => {
    const cleanup = hollowProps(mockElement, { variant: 'primary' });

    expect(typeof cleanup).toBe('function');
  });

  it('should clean up reactive bindings', () => {
    const accessor: Accessor<string> = () => 'value';
    const cleanup = hollowProps(mockElement, { prop: accessor });

    // Should not throw
    expect(() => cleanup()).not.toThrow();
  });
});

describe('TypeScript types', () => {
  it('should accept valid Accessor type', () => {
    const accessor: Accessor<string> = () => 'value';
    expect(accessor()).toBe('value');
  });

  it('should accept valid ReactiveProps type', () => {
    const props: ReactiveProps<{ value: string }> = {
      value: () => 'reactive',
    };

    expect(typeof props.value).toBe('function');
  });

  it('should accept valid HollowButtonProps', () => {
    const props: HollowButtonProps = {
      variant: () => 'primary' as const,
      disabled: () => false,
      onClick: () => {},
    };

    expect(props.variant).toBeDefined();
  });

  it('should accept valid HollowInputProps', () => {
    const props: HollowInputProps = {
      value: () => 'test',
      onInput: () => {},
      onChange: () => {},
    };

    expect(props.value).toBeDefined();
  });

  it('should accept valid HollowModalProps', () => {
    const props: HollowModalProps = {
      open: () => true,
      onOpen: () => {},
      onClose: () => {},
    };

    expect(props.open).toBeDefined();
  });

  it('should accept valid HollowSelectProps', () => {
    const props: HollowSelectProps = {
      options: () => [{ value: 'a', label: 'A' }],
      onChange: () => {},
    };

    expect(props.options).toBeDefined();
  });

  it('should accept valid HollowTabsProps', () => {
    const props: HollowTabsProps = {
      tabs: () => [{ id: 'tab1', label: 'Tab 1' }],
      onChange: () => {},
    };

    expect(props.tabs).toBeDefined();
  });

  it('should accept valid HollowAccordionProps', () => {
    const props: HollowAccordionProps = {
      items: () => [{ id: 'item1', title: 'Item 1' }],
      onChange: () => {},
    };

    expect(props.items).toBeDefined();
  });
});
