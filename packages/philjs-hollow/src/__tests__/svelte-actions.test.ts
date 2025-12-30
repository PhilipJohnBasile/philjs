/**
 * @philjs/hollow - Svelte Actions Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  hollow,
  hollowButton,
  hollowInput,
  hollowCard,
  hollowModal,
  hollowSelect,
  hollowCheckbox,
  hollowSwitch,
  hollowTabs,
  hollowAccordion,
  hollowAccordionItem,
  createHollowStore,
  onHollowEvent,
  type HollowActionParams,
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
} from '../wrappers/svelte.js';

describe('hollow action', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should set string attributes', () => {
    hollow(mockElement, { variant: 'primary' });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('variant', 'primary');
  });

  it('should set boolean attributes as empty string when true', () => {
    hollow(mockElement, { disabled: true });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('disabled', '');
  });

  it('should remove boolean attributes when false', () => {
    hollow(mockElement, { disabled: false });

    expect(mockElement.removeAttribute).toHaveBeenCalledWith('disabled');
  });

  it('should serialize arrays to JSON', () => {
    const items = [{ id: '1' }, { id: '2' }];
    hollow(mockElement, { items });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('items', JSON.stringify(items));
  });

  it('should serialize objects to JSON', () => {
    const config = { key: 'value' };
    hollow(mockElement, { config });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('config', JSON.stringify(config));
  });

  it('should attach event handlers', () => {
    const handler = vi.fn();
    hollow(mockElement, { onClick: handler });

    expect(mockElement.addEventListener).toHaveBeenCalledWith('hollow-click', expect.any(Function));
  });

  it('should return update and destroy functions', () => {
    const result = hollow(mockElement, { variant: 'primary' });

    expect(typeof result.update).toBe('function');
    expect(typeof result.destroy).toBe('function');
  });

  describe('update function', () => {
    it('should update attributes when called', () => {
      const result = hollow(mockElement, { variant: 'primary' });

      result.update({ variant: 'secondary' });

      expect(mockElement.setAttribute).toHaveBeenCalledWith('variant', 'secondary');
    });

    it('should remove old event handlers and add new ones', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const result = hollow(mockElement, { onClick: handler1 });

      result.update({ onClick: handler2 });

      expect(mockElement.removeEventListener).toHaveBeenCalled();
      expect(mockElement.addEventListener).toHaveBeenCalled();
    });
  });

  describe('destroy function', () => {
    it('should remove event handlers', () => {
      const handler = vi.fn();
      const result = hollow(mockElement, { onClick: handler });

      result.destroy();

      expect(mockElement.removeEventListener).toHaveBeenCalledWith('hollow-click', expect.any(Function));
    });
  });
});

describe('hollowButton action', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should set variant', () => {
    hollowButton(mockElement, { variant: 'secondary' });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('variant', 'secondary');
  });

  it('should set size', () => {
    hollowButton(mockElement, { size: 'lg' });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('size', 'lg');
  });

  it('should set disabled', () => {
    hollowButton(mockElement, { disabled: true });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('disabled', '');
  });

  it('should set loading', () => {
    hollowButton(mockElement, { loading: true });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('loading', '');
  });

  it('should attach onClick handler', () => {
    const handler = vi.fn();
    hollowButton(mockElement, { onClick: handler });

    expect(mockElement.addEventListener).toHaveBeenCalledWith('hollow-click', expect.any(Function));
  });
});

describe('hollowInput action', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should set value', () => {
    hollowInput(mockElement, { value: 'test' });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('value', 'test');
  });

  it('should set type', () => {
    hollowInput(mockElement, { type: 'email' });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('type', 'email');
  });

  it('should attach onInput handler', () => {
    const handler = vi.fn();
    hollowInput(mockElement, { onInput: handler });

    expect(mockElement.addEventListener).toHaveBeenCalledWith('hollow-input', expect.any(Function));
  });

  it('should attach onChange handler', () => {
    const handler = vi.fn();
    hollowInput(mockElement, { onChange: handler });

    expect(mockElement.addEventListener).toHaveBeenCalledWith('hollow-change', expect.any(Function));
  });
});

describe('hollowModal action', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should map closeOnBackdrop to kebab-case', () => {
    hollowModal(mockElement, { closeOnBackdrop: true });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('close-on-backdrop', '');
  });

  it('should map closeOnEscape to kebab-case', () => {
    hollowModal(mockElement, { closeOnEscape: true });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('close-on-escape', '');
  });

  it('should attach onOpen handler', () => {
    const handler = vi.fn();
    hollowModal(mockElement, { onOpen: handler });

    expect(mockElement.addEventListener).toHaveBeenCalledWith('hollow-open', expect.any(Function));
  });

  it('should attach onClose handler', () => {
    const handler = vi.fn();
    hollowModal(mockElement, { onClose: handler });

    expect(mockElement.addEventListener).toHaveBeenCalledWith('hollow-close', expect.any(Function));
  });
});

describe('hollowSwitch action', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should map labelOn to kebab-case', () => {
    hollowSwitch(mockElement, { labelOn: 'ON' });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('label-on', 'ON');
  });

  it('should map labelOff to kebab-case', () => {
    hollowSwitch(mockElement, { labelOff: 'OFF' });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('label-off', 'OFF');
  });
});

describe('hollowSelect action', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should serialize options array', () => {
    const options = [{ value: 'a', label: 'A' }];
    hollowSelect(mockElement, { options });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('options', JSON.stringify(options));
  });

  it('should attach onChange handler', () => {
    const handler = vi.fn();
    hollowSelect(mockElement, { onChange: handler });

    expect(mockElement.addEventListener).toHaveBeenCalledWith('hollow-change', expect.any(Function));
  });

  it('should attach onToggle handler', () => {
    const handler = vi.fn();
    hollowSelect(mockElement, { onToggle: handler });

    expect(mockElement.addEventListener).toHaveBeenCalledWith('hollow-toggle', expect.any(Function));
  });
});

describe('hollowCheckbox action', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should set checked', () => {
    hollowCheckbox(mockElement, { checked: true });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('checked', '');
  });

  it('should set indeterminate', () => {
    hollowCheckbox(mockElement, { indeterminate: true });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('indeterminate', '');
  });
});

describe('hollowTabs action', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should serialize tabs array', () => {
    const tabs = [{ id: 'tab1', label: 'Tab 1' }];
    hollowTabs(mockElement, { tabs });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('tabs', JSON.stringify(tabs));
  });

  it('should set active', () => {
    hollowTabs(mockElement, { active: 'tab1' });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('active', 'tab1');
  });
});

describe('hollowAccordion action', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should serialize items array', () => {
    const items = [{ id: 'item1', title: 'Item 1' }];
    hollowAccordion(mockElement, { items });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('items', JSON.stringify(items));
  });

  it('should set multiple', () => {
    hollowAccordion(mockElement, { multiple: true });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('multiple', '');
  });
});

describe('hollowAccordionItem action', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should set title', () => {
    hollowAccordionItem(mockElement, { title: 'Section Title' });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('title', 'Section Title');
  });

  it('should set expanded', () => {
    hollowAccordionItem(mockElement, { expanded: true });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('expanded', '');
  });

  it('should attach onToggle handler', () => {
    const handler = vi.fn();
    hollowAccordionItem(mockElement, { onToggle: handler });

    expect(mockElement.addEventListener).toHaveBeenCalledWith('hollow-toggle', expect.any(Function));
  });
});

describe('hollowCard action', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;
  });

  it('should set variant', () => {
    hollowCard(mockElement, { variant: 'elevated' });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('variant', 'elevated');
  });

  it('should set interactive', () => {
    hollowCard(mockElement, { interactive: true });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('interactive', '');
  });
});

describe('createHollowStore', () => {
  it('should create a store with initial value', () => {
    const store = createHollowStore({ value: 'initial' });

    let currentValue: { value: string } | null = null;
    store.subscribe((v) => (currentValue = v));

    expect(currentValue).toEqual({ value: 'initial' });
  });

  it('should notify subscribers on set', () => {
    const store = createHollowStore({ count: 0 });
    const subscriber = vi.fn();

    store.subscribe(subscriber);
    store.set({ count: 1 });

    expect(subscriber).toHaveBeenCalledWith({ count: 1 });
  });

  it('should notify subscribers on update', () => {
    const store = createHollowStore({ count: 0 });
    const subscriber = vi.fn();

    store.subscribe(subscriber);
    store.update((v) => ({ count: v.count + 1 }));

    expect(subscriber).toHaveBeenCalledWith({ count: 1 });
  });

  it('should allow unsubscribing', () => {
    const store = createHollowStore({ value: 'test' });
    const subscriber = vi.fn();

    const unsubscribe = store.subscribe(subscriber);
    unsubscribe();

    store.set({ value: 'changed' });

    // Should only have been called once (initial subscription)
    expect(subscriber).toHaveBeenCalledTimes(1);
  });
});

describe('onHollowEvent', () => {
  it('should attach event listener', () => {
    const element = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;

    const handler = vi.fn();
    onHollowEvent(element, 'hollow-click', handler);

    expect(element.addEventListener).toHaveBeenCalledWith('hollow-click', expect.any(Function));
  });

  it('should return cleanup function', () => {
    const element = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;

    const handler = vi.fn();
    const cleanup = onHollowEvent(element, 'hollow-click', handler);

    expect(typeof cleanup).toBe('function');
  });

  it('should remove event listener on cleanup', () => {
    const element = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;

    const handler = vi.fn();
    const cleanup = onHollowEvent(element, 'hollow-click', handler);

    cleanup();

    expect(element.removeEventListener).toHaveBeenCalledWith('hollow-click', expect.any(Function));
  });

  it('should call handler with event detail', () => {
    let capturedHandler: EventListener | null = null;
    const element = {
      addEventListener: vi.fn((event, handler) => {
        capturedHandler = handler;
      }),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;

    const handler = vi.fn();
    onHollowEvent(element, 'hollow-click', handler);

    // Simulate event
    const mockEvent = new CustomEvent('hollow-click', { detail: { value: 'test' } });
    capturedHandler!(mockEvent);

    expect(handler).toHaveBeenCalledWith({ value: 'test' });
  });
});

describe('TypeScript types', () => {
  it('should accept valid HollowButtonProps', () => {
    const props: HollowButtonProps = {
      variant: 'primary',
      size: 'md',
      disabled: false,
      loading: false,
    };

    expect(props.variant).toBe('primary');
  });

  it('should accept valid HollowInputProps', () => {
    const props: HollowInputProps = {
      variant: 'default',
      size: 'md',
      type: 'text',
      value: 'test',
    };

    expect(props.type).toBe('text');
  });

  it('should accept valid HollowModalProps', () => {
    const props: HollowModalProps = {
      open: true,
      size: 'md',
      closeOnBackdrop: true,
      closeOnEscape: true,
    };

    expect(props.open).toBe(true);
  });

  it('should accept valid HollowSelectProps', () => {
    const props: HollowSelectProps = {
      options: [{ value: 'a', label: 'A' }],
      searchable: true,
      clearable: true,
    };

    expect(props.options).toHaveLength(1);
  });

  it('should accept valid HollowTabsProps', () => {
    const props: HollowTabsProps = {
      tabs: [{ id: 'tab1', label: 'Tab 1' }],
      active: 'tab1',
    };

    expect(props.tabs).toHaveLength(1);
  });

  it('should accept valid HollowAccordionProps', () => {
    const props: HollowAccordionProps = {
      items: [{ id: 'item1', title: 'Item 1' }],
      multiple: true,
      collapsible: true,
    };

    expect(props.items).toHaveLength(1);
  });
});
