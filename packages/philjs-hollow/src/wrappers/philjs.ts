/**
 * Native PhilJS Bindings for Hollow Components
 * Direct integration with PhilJS reactivity system
 */

import type { ButtonVariant, ButtonSize } from '../components/button.js';
import type { InputVariant, InputSize, InputType } from '../components/input.js';
import type { CardVariant, CardPadding } from '../components/card.js';
import type { ModalSize, ModalAnimation } from '../components/modal.js';
import type { SelectVariant, SelectSize, SelectOption } from '../components/select.js';
import type { CheckboxSize, CheckboxVariant } from '../components/checkbox.js';
import type { SwitchSize, SwitchVariant } from '../components/switch.js';
import type { TabsVariant, TabsSize, TabsAlignment, TabDefinition } from '../components/tabs.js';
import type { AccordionVariant, AccordionItem } from '../components/accordion.js';

// Import components to ensure registration
import '../components/index.js';

/**
 * Signal-like interface for reactive props
 */
export interface Accessor<T> {
  (): T;
}

/**
 * Create a reactive binding between a signal and an element attribute
 */
export function bindProp(
  element: HTMLElement,
  propName: string,
  accessor: Accessor<unknown>
): () => void {
  // Create an effect-like update function
  let currentValue = accessor();

  // Initial set
  setElementProp(element, propName, currentValue);

  // Return cleanup function that could be used with a signal library
  // In PhilJS, this would integrate with the effect system
  return () => {
    const newValue = accessor();
    if (newValue !== currentValue) {
      currentValue = newValue;
      setElementProp(element, propName, newValue);
    }
  };
}

/**
 * Set an element property/attribute
 */
function setElementProp(element: HTMLElement, name: string, value: unknown): void {
  if (typeof value === 'boolean') {
    if (value) {
      element.setAttribute(name, '');
    } else {
      element.removeAttribute(name);
    }
  } else if (value === null || value === undefined) {
    element.removeAttribute(name);
  } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    element.setAttribute(name, JSON.stringify(value));
  } else {
    element.setAttribute(name, String(value));
  }
}

/**
 * Props type for reactive binding
 */
export type ReactiveProps<T> = {
  [K in keyof T]: T[K] | Accessor<T[K]>;
};

/**
 * Resolve prop value (accessor or direct value)
 */
function resolveProp<T>(prop: T | Accessor<T>): T {
  return typeof prop === 'function' ? (prop as Accessor<T>)() : prop;
}

/**
 * Button props for PhilJS
 */
export interface HollowButtonProps {
  variant?: ButtonVariant | Accessor<ButtonVariant>;
  size?: ButtonSize | Accessor<ButtonSize>;
  disabled?: boolean | Accessor<boolean>;
  loading?: boolean | Accessor<boolean>;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (detail: { originalEvent: Event; timestamp: number }) => void;
  children?: unknown;
  ref?: (el: HTMLElement) => void;
}

/**
 * PhilJS Button component factory
 */
export function Button(props: HollowButtonProps): {
  type: string;
  props: Record<string, unknown>;
  ref?: (el: HTMLElement) => void;
} {
  const elementProps: Record<string, unknown> = {};
  const eventHandlers: Record<string, (detail: unknown) => void> = {};

  // Process props
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'ref') continue;

    if (key === 'onClick' && typeof value === 'function') {
      eventHandlers['hollow-click'] = value as (detail: unknown) => void;
    } else if (typeof value === 'function' && key !== 'onClick') {
      // Reactive accessor - resolve immediately, would be tracked in real PhilJS
      elementProps[key] = (value as Accessor<unknown>)();
    } else {
      elementProps[key] = value;
    }
  }

  return {
    type: 'hollow-button',
    props: {
      ...elementProps,
      children: props.children,
      // Event handlers would be attached via a directive in real PhilJS
      __eventHandlers: eventHandlers,
    },
    ref: props.ref,
  };
}

/**
 * Input props for PhilJS
 */
export interface HollowInputProps {
  variant?: InputVariant | Accessor<InputVariant>;
  size?: InputSize | Accessor<InputSize>;
  type?: InputType;
  value?: string | Accessor<string>;
  placeholder?: string;
  disabled?: boolean | Accessor<boolean>;
  readonly?: boolean;
  required?: boolean;
  minlength?: number;
  maxlength?: number;
  pattern?: string;
  name?: string;
  autocomplete?: string;
  error?: string | Accessor<string>;
  onInput?: (detail: { value: string; previousValue: string; originalEvent: Event }) => void;
  onChange?: (detail: { value: string; valid: boolean; originalEvent: Event }) => void;
  ref?: (el: HTMLElement) => void;
}

/**
 * PhilJS Input component factory
 */
export function Input(props: HollowInputProps): {
  type: string;
  props: Record<string, unknown>;
  ref?: (el: HTMLElement) => void;
} {
  const elementProps: Record<string, unknown> = {};
  const eventHandlers: Record<string, (detail: unknown) => void> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key === 'ref') continue;

    if (key === 'onInput' && typeof value === 'function') {
      eventHandlers['hollow-input'] = value as (detail: unknown) => void;
    } else if (key === 'onChange' && typeof value === 'function') {
      eventHandlers['hollow-change'] = value as (detail: unknown) => void;
    } else if (typeof value === 'function') {
      elementProps[key] = (value as Accessor<unknown>)();
    } else {
      elementProps[key] = value;
    }
  }

  return {
    type: 'hollow-input',
    props: {
      ...elementProps,
      __eventHandlers: eventHandlers,
    },
    ref: props.ref,
  };
}

/**
 * Card props for PhilJS
 */
export interface HollowCardProps {
  variant?: CardVariant | Accessor<CardVariant>;
  padding?: CardPadding | Accessor<CardPadding>;
  interactive?: boolean;
  selected?: boolean | Accessor<boolean>;
  onClick?: (detail: { selected: boolean; originalEvent: Event }) => void;
  children?: unknown;
  header?: unknown;
  footer?: unknown;
  ref?: (el: HTMLElement) => void;
}

/**
 * PhilJS Card component factory
 */
export function Card(props: HollowCardProps): {
  type: string;
  props: Record<string, unknown>;
  ref?: (el: HTMLElement) => void;
} {
  const elementProps: Record<string, unknown> = {};
  const eventHandlers: Record<string, (detail: unknown) => void> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'header' || key === 'footer' || key === 'ref') continue;

    if (key === 'onClick' && typeof value === 'function') {
      eventHandlers['hollow-click'] = value as (detail: unknown) => void;
    } else if (typeof value === 'function') {
      elementProps[key] = (value as Accessor<unknown>)();
    } else {
      elementProps[key] = value;
    }
  }

  return {
    type: 'hollow-card',
    props: {
      ...elementProps,
      children: [
        props.header && { type: 'template', props: { slot: 'header', children: props.header } },
        props.children,
        props.footer && { type: 'template', props: { slot: 'footer', children: props.footer } },
      ].filter(Boolean),
      __eventHandlers: eventHandlers,
    },
    ref: props.ref,
  };
}

/**
 * Modal props for PhilJS
 */
export interface HollowModalProps {
  open?: boolean | Accessor<boolean>;
  size?: ModalSize | Accessor<ModalSize>;
  animation?: ModalAnimation;
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  persistent?: boolean;
  onOpen?: (detail: { timestamp: number }) => void;
  onClose?: (detail: { timestamp: number }) => void;
  children?: unknown;
  header?: unknown;
  footer?: unknown;
  ref?: (el: HTMLElement) => void;
}

/**
 * PhilJS Modal component factory
 */
export function Modal(props: HollowModalProps): {
  type: string;
  props: Record<string, unknown>;
  ref?: (el: HTMLElement) => void;
} {
  const elementProps: Record<string, unknown> = {};
  const eventHandlers: Record<string, (detail: unknown) => void> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'header' || key === 'footer' || key === 'ref') continue;

    if (key === 'onOpen' && typeof value === 'function') {
      eventHandlers['hollow-open'] = value as (detail: unknown) => void;
    } else if (key === 'onClose' && typeof value === 'function') {
      eventHandlers['hollow-close'] = value as (detail: unknown) => void;
    } else if (key === 'closeOnBackdrop') {
      elementProps['close-on-backdrop'] = value;
    } else if (key === 'closeOnEscape') {
      elementProps['close-on-escape'] = value;
    } else if (typeof value === 'function') {
      elementProps[key] = (value as Accessor<unknown>)();
    } else {
      elementProps[key] = value;
    }
  }

  return {
    type: 'hollow-modal',
    props: {
      ...elementProps,
      children: [
        props.header && { type: 'template', props: { slot: 'header', children: props.header } },
        props.children,
        props.footer && { type: 'template', props: { slot: 'footer', children: props.footer } },
      ].filter(Boolean),
      __eventHandlers: eventHandlers,
    },
    ref: props.ref,
  };
}

/**
 * Select props for PhilJS
 */
export interface HollowSelectProps {
  variant?: SelectVariant | Accessor<SelectVariant>;
  size?: SelectSize | Accessor<SelectSize>;
  value?: string | Accessor<string>;
  placeholder?: string;
  disabled?: boolean | Accessor<boolean>;
  required?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  options?: SelectOption[] | Accessor<SelectOption[]>;
  name?: string;
  error?: string | Accessor<string>;
  onChange?: (detail: { value: string; previousValue: string; option?: SelectOption }) => void;
  onToggle?: (detail: { open: boolean }) => void;
  ref?: (el: HTMLElement) => void;
}

/**
 * PhilJS Select component factory
 */
export function Select(props: HollowSelectProps): {
  type: string;
  props: Record<string, unknown>;
  ref?: (el: HTMLElement) => void;
} {
  const elementProps: Record<string, unknown> = {};
  const eventHandlers: Record<string, (detail: unknown) => void> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key === 'ref') continue;

    if (key === 'onChange' && typeof value === 'function') {
      eventHandlers['hollow-change'] = value as (detail: unknown) => void;
    } else if (key === 'onToggle' && typeof value === 'function') {
      eventHandlers['hollow-toggle'] = value as (detail: unknown) => void;
    } else if (typeof value === 'function') {
      elementProps[key] = (value as Accessor<unknown>)();
    } else {
      elementProps[key] = value;
    }
  }

  return {
    type: 'hollow-select',
    props: {
      ...elementProps,
      __eventHandlers: eventHandlers,
    },
    ref: props.ref,
  };
}

/**
 * Checkbox props for PhilJS
 */
export interface HollowCheckboxProps {
  variant?: CheckboxVariant | Accessor<CheckboxVariant>;
  size?: CheckboxSize | Accessor<CheckboxSize>;
  checked?: boolean | Accessor<boolean>;
  indeterminate?: boolean | Accessor<boolean>;
  disabled?: boolean | Accessor<boolean>;
  required?: boolean;
  name?: string;
  value?: string;
  onChange?: (detail: { checked: boolean; previousChecked: boolean; value: string; originalEvent?: Event }) => void;
  children?: unknown;
  ref?: (el: HTMLElement) => void;
}

/**
 * PhilJS Checkbox component factory
 */
export function Checkbox(props: HollowCheckboxProps): {
  type: string;
  props: Record<string, unknown>;
  ref?: (el: HTMLElement) => void;
} {
  const elementProps: Record<string, unknown> = {};
  const eventHandlers: Record<string, (detail: unknown) => void> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'ref') continue;

    if (key === 'onChange' && typeof value === 'function') {
      eventHandlers['hollow-change'] = value as (detail: unknown) => void;
    } else if (typeof value === 'function') {
      elementProps[key] = (value as Accessor<unknown>)();
    } else {
      elementProps[key] = value;
    }
  }

  return {
    type: 'hollow-checkbox',
    props: {
      ...elementProps,
      children: props.children,
      __eventHandlers: eventHandlers,
    },
    ref: props.ref,
  };
}

/**
 * Switch props for PhilJS
 */
export interface HollowSwitchProps {
  variant?: SwitchVariant | Accessor<SwitchVariant>;
  size?: SwitchSize | Accessor<SwitchSize>;
  checked?: boolean | Accessor<boolean>;
  disabled?: boolean | Accessor<boolean>;
  required?: boolean;
  name?: string;
  value?: string;
  labelOn?: string;
  labelOff?: string;
  onChange?: (detail: { checked: boolean; previousChecked: boolean; value: string; originalEvent?: Event }) => void;
  children?: unknown;
  ref?: (el: HTMLElement) => void;
}

/**
 * PhilJS Switch component factory
 */
export function Switch(props: HollowSwitchProps): {
  type: string;
  props: Record<string, unknown>;
  ref?: (el: HTMLElement) => void;
} {
  const elementProps: Record<string, unknown> = {};
  const eventHandlers: Record<string, (detail: unknown) => void> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'ref') continue;

    if (key === 'onChange' && typeof value === 'function') {
      eventHandlers['hollow-change'] = value as (detail: unknown) => void;
    } else if (key === 'labelOn') {
      elementProps['label-on'] = value;
    } else if (key === 'labelOff') {
      elementProps['label-off'] = value;
    } else if (typeof value === 'function') {
      elementProps[key] = (value as Accessor<unknown>)();
    } else {
      elementProps[key] = value;
    }
  }

  return {
    type: 'hollow-switch',
    props: {
      ...elementProps,
      children: props.children,
      __eventHandlers: eventHandlers,
    },
    ref: props.ref,
  };
}

/**
 * Tabs props for PhilJS
 */
export interface HollowTabsProps {
  variant?: TabsVariant | Accessor<TabsVariant>;
  size?: TabsSize | Accessor<TabsSize>;
  active?: string | Accessor<string>;
  alignment?: TabsAlignment;
  tabs?: TabDefinition[] | Accessor<TabDefinition[]>;
  onChange?: (detail: { tab: string; previousTab: string; tabIndex: number }) => void;
  children?: unknown;
  ref?: (el: HTMLElement) => void;
}

/**
 * PhilJS Tabs component factory
 */
export function Tabs(props: HollowTabsProps): {
  type: string;
  props: Record<string, unknown>;
  ref?: (el: HTMLElement) => void;
} {
  const elementProps: Record<string, unknown> = {};
  const eventHandlers: Record<string, (detail: unknown) => void> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'ref') continue;

    if (key === 'onChange' && typeof value === 'function') {
      eventHandlers['hollow-change'] = value as (detail: unknown) => void;
    } else if (typeof value === 'function') {
      elementProps[key] = (value as Accessor<unknown>)();
    } else {
      elementProps[key] = value;
    }
  }

  return {
    type: 'hollow-tabs',
    props: {
      ...elementProps,
      children: props.children,
      __eventHandlers: eventHandlers,
    },
    ref: props.ref,
  };
}

/**
 * Accordion props for PhilJS
 */
export interface HollowAccordionProps {
  variant?: AccordionVariant | Accessor<AccordionVariant>;
  multiple?: boolean;
  collapsible?: boolean;
  expanded?: string | Accessor<string>;
  items?: AccordionItem[] | Accessor<AccordionItem[]>;
  onChange?: (detail: { itemId?: string; expanded?: boolean; expandedItems: string[]; action?: string }) => void;
  children?: unknown;
  ref?: (el: HTMLElement) => void;
}

/**
 * PhilJS Accordion component factory
 */
export function Accordion(props: HollowAccordionProps): {
  type: string;
  props: Record<string, unknown>;
  ref?: (el: HTMLElement) => void;
} {
  const elementProps: Record<string, unknown> = {};
  const eventHandlers: Record<string, (detail: unknown) => void> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'ref') continue;

    if (key === 'onChange' && typeof value === 'function') {
      eventHandlers['hollow-change'] = value as (detail: unknown) => void;
    } else if (typeof value === 'function') {
      elementProps[key] = (value as Accessor<unknown>)();
    } else {
      elementProps[key] = value;
    }
  }

  return {
    type: 'hollow-accordion',
    props: {
      ...elementProps,
      children: props.children,
      __eventHandlers: eventHandlers,
    },
    ref: props.ref,
  };
}

/**
 * AccordionItem props for PhilJS
 */
export interface HollowAccordionItemProps {
  title?: string;
  expanded?: boolean | Accessor<boolean>;
  disabled?: boolean | Accessor<boolean>;
  icon?: string;
  onToggle?: (detail: { id: string; expanded: boolean }) => void;
  children?: unknown;
  ref?: (el: HTMLElement) => void;
}

/**
 * PhilJS AccordionItem component factory
 */
export function AccordionItem(props: HollowAccordionItemProps): {
  type: string;
  props: Record<string, unknown>;
  ref?: (el: HTMLElement) => void;
} {
  const elementProps: Record<string, unknown> = {};
  const eventHandlers: Record<string, (detail: unknown) => void> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'ref') continue;

    if (key === 'onToggle' && typeof value === 'function') {
      eventHandlers['hollow-toggle'] = value as (detail: unknown) => void;
    } else if (typeof value === 'function') {
      elementProps[key] = (value as Accessor<unknown>)();
    } else {
      elementProps[key] = value;
    }
  }

  return {
    type: 'hollow-accordion-item',
    props: {
      ...elementProps,
      children: props.children,
      __eventHandlers: eventHandlers,
    },
    ref: props.ref,
  };
}

/**
 * Hook to bind Hollow events in PhilJS effects
 */
export function useHollowRef<T extends HTMLElement>(): {
  current: T | null;
  set: (el: T) => void;
  on: <D>(event: string, handler: (detail: D) => void) => () => void;
} {
  let element: T | null = null;
  const listeners: Array<{ event: string; handler: EventListener }> = [];

  return {
    get current() {
      return element;
    },

    set(el: T) {
      element = el;
    },

    on<D>(event: string, handler: (detail: D) => void): () => void {
      if (!element) {
        // Queue for when element is available
        const wrappedHandler = (e: Event) => handler((e as CustomEvent<D>).detail);
        listeners.push({ event, handler: wrappedHandler });
        return () => {
          const idx = listeners.findIndex((l) => l.event === event && l.handler === wrappedHandler);
          if (idx >= 0) listeners.splice(idx, 1);
        };
      }

      const wrappedHandler = (e: Event) => handler((e as CustomEvent<D>).detail);
      element.addEventListener(event, wrappedHandler);

      return () => {
        element?.removeEventListener(event, wrappedHandler);
      };
    },
  };
}

/**
 * Directive to apply Hollow props reactively
 */
export function hollowProps(
  element: HTMLElement,
  props: ReactiveProps<Record<string, unknown>>
): () => void {
  const cleanups: Array<() => void> = [];

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'function') {
      // Set up reactive binding
      cleanups.push(bindProp(element, key, value as Accessor<unknown>));
    } else {
      // Static value
      setElementProp(element, key, value);
    }
  }

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
}

/**
 * Re-export types
 */
export type { ButtonVariant, ButtonSize };
export type { InputVariant, InputSize, InputType };
export type { CardVariant, CardPadding };
export type { ModalSize, ModalAnimation };
export type { SelectVariant, SelectSize, SelectOption };
export type { CheckboxSize, CheckboxVariant };
export type { SwitchSize, SwitchVariant };
export type { TabsVariant, TabsSize, TabsAlignment, TabDefinition };
export type { AccordionVariant, AccordionItem };
