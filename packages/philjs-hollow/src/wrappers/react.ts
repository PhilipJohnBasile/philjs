/**
 * React Wrappers for Hollow Components
 * Thin wrappers that provide React-idiomatic APIs for Hollow Web Components
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
 * React types (simplified to avoid React dependency at build time)
 */
interface ReactElement<P = unknown> {
  type: unknown;
  props: P;
  key: string | null;
}

interface ReactRef<T> {
  current: T | null;
}

/**
 * Property definition for wrapper generation
 */
interface PropDefinition {
  name: string;
  attribute?: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

/**
 * Create a React wrapper for a Hollow Web Component
 */
export function createReactWrapper<P extends Record<string, unknown>>(
  tagName: string,
  propDefs: PropDefinition[],
  eventMappings: Record<string, string> = {}
): React.ForwardRefExoticComponent<P & React.RefAttributes<HTMLElement>> {
  // This is a factory that returns a React component
  // In production, React would be imported at runtime

  const displayName = tagName
    .replace('hollow-', '')
    .replace(/-./g, (x) => x[1]!.toUpperCase())
    .replace(/^./, (x) => x.toUpperCase());

  // Create wrapper component
  const Wrapper = function (props: P & { ref?: ReactRef<HTMLElement> }) {
    // Extract event handlers
    const eventProps: Record<string, unknown> = {};
    const elementProps: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(props)) {
      if (key === 'ref' || key === 'children') continue;

      if (key.startsWith('on') && typeof value === 'function') {
        // Map React event to Hollow event
        const hollowEvent = eventMappings[key] ?? `hollow-${key.slice(2).toLowerCase()}`;
        eventProps[hollowEvent] = value;
      } else {
        // Find matching prop definition
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

    // Return element descriptor (React.createElement would be used at runtime)
    return {
      type: tagName,
      props: {
        ...elementProps,
        ref: props.ref,
        children: (props as unknown as { children?: unknown }).children,
        // Event handlers would be attached via useEffect in full implementation
      },
      key: null,
    } as unknown as ReactElement<P>;
  };

  // Add display name
  (Wrapper as unknown as { displayName: string }).displayName = displayName;

  return Wrapper as unknown as React.ForwardRefExoticComponent<P & React.RefAttributes<HTMLElement>>;
}

/**
 * Button props for React
 */
export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: CustomEvent<{ originalEvent: Event; timestamp: number }>) => void;
  children?: unknown;
  className?: string;
}

/**
 * React Button component
 */
export const Button = createReactWrapper<ButtonProps>('hollow-button', [
  { name: 'variant', type: 'string' },
  { name: 'size', type: 'string' },
  { name: 'disabled', type: 'boolean' },
  { name: 'loading', type: 'boolean' },
  { name: 'type', type: 'string' },
], {
  onClick: 'hollow-click',
});

/**
 * Input props for React
 */
export interface InputProps {
  variant?: InputVariant;
  size?: InputSize;
  type?: InputType;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  minlength?: number;
  maxlength?: number;
  pattern?: string;
  name?: string;
  autocomplete?: string;
  error?: string;
  onInput?: (event: CustomEvent<{ value: string; previousValue: string; originalEvent: Event }>) => void;
  onChange?: (event: CustomEvent<{ value: string; valid: boolean; originalEvent: Event }>) => void;
  className?: string;
}

/**
 * React Input component
 */
export const Input = createReactWrapper<InputProps>('hollow-input', [
  { name: 'variant', type: 'string' },
  { name: 'size', type: 'string' },
  { name: 'type', type: 'string' },
  { name: 'value', type: 'string' },
  { name: 'placeholder', type: 'string' },
  { name: 'disabled', type: 'boolean' },
  { name: 'readonly', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  { name: 'minlength', type: 'number' },
  { name: 'maxlength', type: 'number' },
  { name: 'pattern', type: 'string' },
  { name: 'name', type: 'string' },
  { name: 'autocomplete', type: 'string' },
  { name: 'error', type: 'string' },
], {
  onInput: 'hollow-input',
  onChange: 'hollow-change',
});

/**
 * Card props for React
 */
export interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  selected?: boolean;
  onClick?: (event: CustomEvent<{ selected: boolean; originalEvent: Event }>) => void;
  children?: unknown;
  className?: string;
}

/**
 * React Card component
 */
export const Card = createReactWrapper<CardProps>('hollow-card', [
  { name: 'variant', type: 'string' },
  { name: 'padding', type: 'string' },
  { name: 'interactive', type: 'boolean' },
  { name: 'selected', type: 'boolean' },
], {
  onClick: 'hollow-click',
});

/**
 * Modal props for React
 */
export interface ModalProps {
  open?: boolean;
  size?: ModalSize;
  animation?: ModalAnimation;
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  persistent?: boolean;
  onOpen?: (event: CustomEvent<{ timestamp: number }>) => void;
  onClose?: (event: CustomEvent<{ timestamp: number }>) => void;
  children?: unknown;
  className?: string;
}

/**
 * React Modal component
 */
export const Modal = createReactWrapper<ModalProps>('hollow-modal', [
  { name: 'open', type: 'boolean' },
  { name: 'size', type: 'string' },
  { name: 'animation', type: 'string' },
  { name: 'closable', type: 'boolean' },
  { name: 'closeOnBackdrop', attribute: 'close-on-backdrop', type: 'boolean' },
  { name: 'closeOnEscape', attribute: 'close-on-escape', type: 'boolean' },
  { name: 'persistent', type: 'boolean' },
], {
  onOpen: 'hollow-open',
  onClose: 'hollow-close',
});

/**
 * Select props for React
 */
export interface SelectProps {
  variant?: SelectVariant;
  size?: SelectSize;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  options?: SelectOption[];
  name?: string;
  error?: string;
  onChange?: (event: CustomEvent<{ value: string; previousValue: string; option?: SelectOption }>) => void;
  onToggle?: (event: CustomEvent<{ open: boolean }>) => void;
  className?: string;
}

/**
 * React Select component
 */
export const Select = createReactWrapper<SelectProps>('hollow-select', [
  { name: 'variant', type: 'string' },
  { name: 'size', type: 'string' },
  { name: 'value', type: 'string' },
  { name: 'placeholder', type: 'string' },
  { name: 'disabled', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  { name: 'searchable', type: 'boolean' },
  { name: 'clearable', type: 'boolean' },
  { name: 'multiple', type: 'boolean' },
  { name: 'options', type: 'array' },
  { name: 'name', type: 'string' },
  { name: 'error', type: 'string' },
], {
  onChange: 'hollow-change',
  onToggle: 'hollow-toggle',
});

/**
 * Checkbox props for React
 */
export interface CheckboxProps {
  variant?: CheckboxVariant;
  size?: CheckboxSize;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  onChange?: (event: CustomEvent<{ checked: boolean; previousChecked: boolean; value: string; originalEvent?: Event }>) => void;
  children?: unknown;
  className?: string;
}

/**
 * React Checkbox component
 */
export const Checkbox = createReactWrapper<CheckboxProps>('hollow-checkbox', [
  { name: 'variant', type: 'string' },
  { name: 'size', type: 'string' },
  { name: 'checked', type: 'boolean' },
  { name: 'indeterminate', type: 'boolean' },
  { name: 'disabled', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  { name: 'name', type: 'string' },
  { name: 'value', type: 'string' },
], {
  onChange: 'hollow-change',
});

/**
 * Switch props for React
 */
export interface SwitchProps {
  variant?: SwitchVariant;
  size?: SwitchSize;
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  labelOn?: string;
  labelOff?: string;
  onChange?: (event: CustomEvent<{ checked: boolean; previousChecked: boolean; value: string; originalEvent?: Event }>) => void;
  children?: unknown;
  className?: string;
}

/**
 * React Switch component
 */
export const Switch = createReactWrapper<SwitchProps>('hollow-switch', [
  { name: 'variant', type: 'string' },
  { name: 'size', type: 'string' },
  { name: 'checked', type: 'boolean' },
  { name: 'disabled', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  { name: 'name', type: 'string' },
  { name: 'value', type: 'string' },
  { name: 'labelOn', attribute: 'label-on', type: 'string' },
  { name: 'labelOff', attribute: 'label-off', type: 'string' },
], {
  onChange: 'hollow-change',
});

/**
 * Tabs props for React
 */
export interface TabsProps {
  variant?: TabsVariant;
  size?: TabsSize;
  active?: string;
  alignment?: TabsAlignment;
  tabs?: TabDefinition[];
  onChange?: (event: CustomEvent<{ tab: string; previousTab: string; tabIndex: number }>) => void;
  children?: unknown;
  className?: string;
}

/**
 * React Tabs component
 */
export const Tabs = createReactWrapper<TabsProps>('hollow-tabs', [
  { name: 'variant', type: 'string' },
  { name: 'size', type: 'string' },
  { name: 'active', type: 'string' },
  { name: 'alignment', type: 'string' },
  { name: 'tabs', type: 'array' },
], {
  onChange: 'hollow-change',
});

/**
 * Accordion props for React
 */
export interface AccordionProps {
  variant?: AccordionVariant;
  multiple?: boolean;
  collapsible?: boolean;
  expanded?: string;
  items?: AccordionItem[];
  onChange?: (event: CustomEvent<{ itemId?: string; expanded?: boolean; expandedItems: string[]; action?: string }>) => void;
  children?: unknown;
  className?: string;
}

/**
 * React Accordion component
 */
export const Accordion = createReactWrapper<AccordionProps>('hollow-accordion', [
  { name: 'variant', type: 'string' },
  { name: 'multiple', type: 'boolean' },
  { name: 'collapsible', type: 'boolean' },
  { name: 'expanded', type: 'string' },
  { name: 'items', type: 'array' },
], {
  onChange: 'hollow-change',
});

/**
 * AccordionItem props for React
 */
export interface AccordionItemProps {
  title?: string;
  expanded?: boolean;
  disabled?: boolean;
  icon?: string;
  onToggle?: (event: CustomEvent<{ id: string; expanded: boolean }>) => void;
  children?: unknown;
  className?: string;
}

/**
 * React AccordionItem component
 */
export const AccordionItem = createReactWrapper<AccordionItemProps>('hollow-accordion-item', [
  { name: 'title', type: 'string' },
  { name: 'expanded', type: 'boolean' },
  { name: 'disabled', type: 'boolean' },
  { name: 'icon', type: 'string' },
], {
  onToggle: 'hollow-toggle',
});

/**
 * Hook to use Hollow components with proper event handling
 */
export function useHollowEvent<T>(
  ref: ReactRef<HTMLElement>,
  eventName: string,
  handler: (detail: T) => void
): void {
  // In production, this would use useEffect
  // For now, provide the interface
  if (ref.current) {
    const wrappedHandler = (event: Event) => {
      handler((event as CustomEvent<T>).detail);
    };
    ref.current.addEventListener(eventName, wrappedHandler);
  }
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

// Declare global JSX types for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'hollow-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          variant?: ButtonVariant;
          size?: ButtonSize;
          disabled?: boolean;
          loading?: boolean;
          type?: 'button' | 'submit' | 'reset';
        },
        HTMLElement
      >;
      'hollow-input': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          variant?: InputVariant;
          size?: InputSize;
          type?: InputType;
          value?: string;
          placeholder?: string;
          disabled?: boolean;
          readonly?: boolean;
          required?: boolean;
          name?: string;
          error?: string;
        },
        HTMLElement
      >;
      'hollow-card': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          variant?: CardVariant;
          padding?: CardPadding;
          interactive?: boolean;
          selected?: boolean;
        },
        HTMLElement
      >;
      'hollow-modal': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          open?: boolean;
          size?: ModalSize;
          animation?: ModalAnimation;
          closable?: boolean;
          'close-on-backdrop'?: boolean;
          'close-on-escape'?: boolean;
          persistent?: boolean;
        },
        HTMLElement
      >;
      'hollow-select': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          variant?: SelectVariant;
          size?: SelectSize;
          value?: string;
          placeholder?: string;
          disabled?: boolean;
          searchable?: boolean;
          clearable?: boolean;
          options?: string;
          error?: string;
        },
        HTMLElement
      >;
      'hollow-checkbox': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          variant?: CheckboxVariant;
          size?: CheckboxSize;
          checked?: boolean;
          indeterminate?: boolean;
          disabled?: boolean;
          name?: string;
          value?: string;
        },
        HTMLElement
      >;
      'hollow-switch': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          variant?: SwitchVariant;
          size?: SwitchSize;
          checked?: boolean;
          disabled?: boolean;
          name?: string;
          value?: string;
          'label-on'?: string;
          'label-off'?: string;
        },
        HTMLElement
      >;
      'hollow-tabs': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          variant?: TabsVariant;
          size?: TabsSize;
          active?: string;
          alignment?: TabsAlignment;
          tabs?: string;
        },
        HTMLElement
      >;
      'hollow-accordion': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          variant?: AccordionVariant;
          multiple?: boolean;
          collapsible?: boolean;
          expanded?: string;
          items?: string;
        },
        HTMLElement
      >;
      'hollow-accordion-item': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          title?: string;
          expanded?: boolean;
          disabled?: boolean;
          icon?: string;
        },
        HTMLElement
      >;
    }
  }
}
