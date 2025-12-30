/**
 * Vue Wrappers for Hollow Components
 * Vue 3 compatible components wrapping Hollow Web Components
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
 * Property definition for Vue wrapper
 */
interface VuePropDef {
  name: string;
  type: 'String' | 'Number' | 'Boolean' | 'Array' | 'Object';
  default?: unknown;
  attribute?: string;
}

/**
 * Create a Vue wrapper for a Hollow Web Component
 *
 * Note: This is a simplified implementation.
 * In production, use Vue's defineComponent properly.
 */
export function createVueWrapper(
  tagName: string,
  props: VuePropDef[],
  emits: string[] = []
) {
  const displayName = tagName
    .replace('hollow-', 'Hollow')
    .replace(/-./g, (x) => x[1]!.toUpperCase());

  return {
    name: displayName,
    props: Object.fromEntries(
      props.map((prop) => [
        prop.name,
        {
          type: prop.type === 'Boolean' ? Boolean :
                prop.type === 'Number' ? Number :
                prop.type === 'Array' ? Array :
                prop.type === 'Object' ? Object : String,
          default: prop.default,
          required: false,
        },
      ])
    ),
    emits,
    setup(propsData: Record<string, unknown>, { emit, slots }: { emit: (event: string, ...args: unknown[]) => void; slots: Record<string, (() => unknown) | undefined> }) {
      // Return render function
      return () => {
        const elementProps: Record<string, unknown> = {};

        for (const prop of props) {
          if (propsData[prop.name] !== undefined) {
            const attrName = prop.attribute ?? prop.name;
            if (prop.type === 'Array' || prop.type === 'Object') {
              elementProps[attrName] = JSON.stringify(propsData[prop.name]);
            } else {
              elementProps[attrName] = propsData[prop.name];
            }
          }
        }

        // In Vue 3, h() would be used here
        return {
          type: tagName,
          props: {
            ...elementProps,
            // Event handlers
            ...Object.fromEntries(
              emits.map((eventName) => [
                `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`,
                (event: CustomEvent) => emit(eventName, event.detail),
              ])
            ),
          },
          children: slots.default?.(),
        };
      };
    },
  };
}

/**
 * Vue Button component
 */
export const HollowButton = createVueWrapper(
  'hollow-button',
  [
    { name: 'variant', type: 'String', default: 'primary' },
    { name: 'size', type: 'String', default: 'md' },
    { name: 'disabled', type: 'Boolean', default: false },
    { name: 'loading', type: 'Boolean', default: false },
    { name: 'type', type: 'String', default: 'button' },
  ],
  ['hollow-click']
);

/**
 * Vue Input component
 */
export const HollowInput = createVueWrapper(
  'hollow-input',
  [
    { name: 'variant', type: 'String', default: 'default' },
    { name: 'size', type: 'String', default: 'md' },
    { name: 'type', type: 'String', default: 'text' },
    { name: 'value', type: 'String', default: '' },
    { name: 'placeholder', type: 'String', default: '' },
    { name: 'disabled', type: 'Boolean', default: false },
    { name: 'readonly', type: 'Boolean', default: false },
    { name: 'required', type: 'Boolean', default: false },
    { name: 'name', type: 'String', default: '' },
    { name: 'error', type: 'String', default: '' },
  ],
  ['hollow-input', 'hollow-change']
);

/**
 * Vue Card component
 */
export const HollowCard = createVueWrapper(
  'hollow-card',
  [
    { name: 'variant', type: 'String', default: 'default' },
    { name: 'padding', type: 'String', default: 'md' },
    { name: 'interactive', type: 'Boolean', default: false },
    { name: 'selected', type: 'Boolean', default: false },
  ],
  ['hollow-click']
);

/**
 * Vue Modal component
 */
export const HollowModal = createVueWrapper(
  'hollow-modal',
  [
    { name: 'open', type: 'Boolean', default: false },
    { name: 'size', type: 'String', default: 'md' },
    { name: 'animation', type: 'String', default: 'scale' },
    { name: 'closable', type: 'Boolean', default: true },
    { name: 'closeOnBackdrop', type: 'Boolean', default: true, attribute: 'close-on-backdrop' },
    { name: 'closeOnEscape', type: 'Boolean', default: true, attribute: 'close-on-escape' },
    { name: 'persistent', type: 'Boolean', default: false },
  ],
  ['hollow-open', 'hollow-close']
);

/**
 * Vue Select component
 */
export const HollowSelect = createVueWrapper(
  'hollow-select',
  [
    { name: 'variant', type: 'String', default: 'default' },
    { name: 'size', type: 'String', default: 'md' },
    { name: 'value', type: 'String', default: '' },
    { name: 'placeholder', type: 'String', default: 'Select...' },
    { name: 'disabled', type: 'Boolean', default: false },
    { name: 'required', type: 'Boolean', default: false },
    { name: 'searchable', type: 'Boolean', default: false },
    { name: 'clearable', type: 'Boolean', default: false },
    { name: 'multiple', type: 'Boolean', default: false },
    { name: 'options', type: 'Array', default: () => [] },
    { name: 'name', type: 'String', default: '' },
    { name: 'error', type: 'String', default: '' },
  ],
  ['hollow-change', 'hollow-toggle']
);

/**
 * Vue Checkbox component
 */
export const HollowCheckbox = createVueWrapper(
  'hollow-checkbox',
  [
    { name: 'variant', type: 'String', default: 'primary' },
    { name: 'size', type: 'String', default: 'md' },
    { name: 'checked', type: 'Boolean', default: false },
    { name: 'indeterminate', type: 'Boolean', default: false },
    { name: 'disabled', type: 'Boolean', default: false },
    { name: 'required', type: 'Boolean', default: false },
    { name: 'name', type: 'String', default: '' },
    { name: 'value', type: 'String', default: 'on' },
  ],
  ['hollow-change']
);

/**
 * Vue Switch component
 */
export const HollowSwitch = createVueWrapper(
  'hollow-switch',
  [
    { name: 'variant', type: 'String', default: 'primary' },
    { name: 'size', type: 'String', default: 'md' },
    { name: 'checked', type: 'Boolean', default: false },
    { name: 'disabled', type: 'Boolean', default: false },
    { name: 'required', type: 'Boolean', default: false },
    { name: 'name', type: 'String', default: '' },
    { name: 'value', type: 'String', default: 'on' },
    { name: 'labelOn', type: 'String', default: '', attribute: 'label-on' },
    { name: 'labelOff', type: 'String', default: '', attribute: 'label-off' },
  ],
  ['hollow-change']
);

/**
 * Vue Tabs component
 */
export const HollowTabs = createVueWrapper(
  'hollow-tabs',
  [
    { name: 'variant', type: 'String', default: 'default' },
    { name: 'size', type: 'String', default: 'md' },
    { name: 'active', type: 'String', default: '' },
    { name: 'alignment', type: 'String', default: 'start' },
    { name: 'tabs', type: 'Array', default: () => [] },
  ],
  ['hollow-change']
);

/**
 * Vue Accordion component
 */
export const HollowAccordion = createVueWrapper(
  'hollow-accordion',
  [
    { name: 'variant', type: 'String', default: 'default' },
    { name: 'multiple', type: 'Boolean', default: false },
    { name: 'collapsible', type: 'Boolean', default: true },
    { name: 'expanded', type: 'String', default: '' },
    { name: 'items', type: 'Array', default: () => [] },
  ],
  ['hollow-change']
);

/**
 * Vue AccordionItem component
 */
export const HollowAccordionItem = createVueWrapper(
  'hollow-accordion-item',
  [
    { name: 'title', type: 'String', default: '' },
    { name: 'expanded', type: 'Boolean', default: false },
    { name: 'disabled', type: 'Boolean', default: false },
    { name: 'icon', type: 'String', default: '' },
  ],
  ['hollow-toggle']
);

/**
 * Vue directive for Hollow components
 */
export const vHollowProps = {
  mounted(el: HTMLElement, binding: { value: Record<string, unknown> }) {
    const props = binding.value;

    for (const [key, value] of Object.entries(props)) {
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = `hollow-${key.slice(2).toLowerCase()}`;
        el.addEventListener(eventName, (event) => {
          (value as (detail: unknown) => void)((event as CustomEvent).detail);
        });
      } else if (typeof value === 'boolean') {
        if (value) el.setAttribute(key, '');
        else el.removeAttribute(key);
      } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        el.setAttribute(key, JSON.stringify(value));
      } else {
        el.setAttribute(key, String(value));
      }
    }
  },
  updated(el: HTMLElement, binding: { value: Record<string, unknown>; oldValue: Record<string, unknown> }) {
    const props = binding.value;
    const oldProps = binding.oldValue;

    for (const [key, value] of Object.entries(props)) {
      if (key.startsWith('on')) continue;

      if (value !== oldProps[key]) {
        if (typeof value === 'boolean') {
          if (value) el.setAttribute(key, '');
          else el.removeAttribute(key);
        } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
          el.setAttribute(key, JSON.stringify(value));
        } else {
          el.setAttribute(key, String(value));
        }
      }
    }
  },
};

/**
 * Vue plugin for registering Hollow components globally
 */
export const HollowPlugin = {
  install(app: { component: (name: string, component: unknown) => void; directive: (name: string, directive: unknown) => void }) {
    // Register components
    app.component('HollowButton', HollowButton);
    app.component('HollowInput', HollowInput);
    app.component('HollowCard', HollowCard);
    app.component('HollowModal', HollowModal);
    app.component('HollowSelect', HollowSelect);
    app.component('HollowCheckbox', HollowCheckbox);
    app.component('HollowSwitch', HollowSwitch);
    app.component('HollowTabs', HollowTabs);
    app.component('HollowAccordion', HollowAccordion);
    app.component('HollowAccordionItem', HollowAccordionItem);

    // Register directives
    app.directive('hollow-props', vHollowProps);

    // Configure Vue to recognize hollow-* elements
    // app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('hollow-');
  },
};

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

// Declare module augmentation for Vue
declare module 'vue' {
  interface GlobalComponents {
    HollowButton: typeof HollowButton;
    HollowInput: typeof HollowInput;
    HollowCard: typeof HollowCard;
    HollowModal: typeof HollowModal;
    HollowSelect: typeof HollowSelect;
    HollowCheckbox: typeof HollowCheckbox;
    HollowSwitch: typeof HollowSwitch;
    HollowTabs: typeof HollowTabs;
    HollowAccordion: typeof HollowAccordion;
    HollowAccordionItem: typeof HollowAccordionItem;
  }

  interface GlobalDirectives {
    vHollowProps: typeof vHollowProps;
  }
}
