/**
 * Framework Wrappers for Hollow Components
 * @module @philjs/hollow/wrappers
 */

// React wrappers
export {
  createReactWrapper,
  Button as ReactButton,
  Input as ReactInput,
  Card as ReactCard,
  Modal as ReactModal,
  Select as ReactSelect,
  Checkbox as ReactCheckbox,
  Switch as ReactSwitch,
  Tabs as ReactTabs,
  Accordion as ReactAccordion,
  AccordionItem as ReactAccordionItem,
  useHollowEvent,
  type ButtonProps as ReactButtonProps,
  type InputProps as ReactInputProps,
  type CardProps as ReactCardProps,
  type ModalProps as ReactModalProps,
  type SelectProps as ReactSelectProps,
  type CheckboxProps as ReactCheckboxProps,
  type SwitchProps as ReactSwitchProps,
  type TabsProps as ReactTabsProps,
  type AccordionProps as ReactAccordionProps,
  type AccordionItemProps as ReactAccordionItemProps,
} from './react.js';

// Vue wrappers
export {
  createVueWrapper,
  HollowButton as VueButton,
  HollowInput as VueInput,
  HollowCard as VueCard,
  HollowModal as VueModal,
  HollowSelect as VueSelect,
  HollowCheckbox as VueCheckbox,
  HollowSwitch as VueSwitch,
  HollowTabs as VueTabs,
  HollowAccordion as VueAccordion,
  HollowAccordionItem as VueAccordionItem,
  vHollowProps,
  HollowPlugin,
} from './vue.js';

// Svelte actions
export {
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
  type HollowButtonProps as SvelteButtonProps,
  type HollowInputProps as SvelteInputProps,
  type HollowCardProps as SvelteCardProps,
  type HollowModalProps as SvelteModalProps,
  type HollowSelectProps as SvelteSelectProps,
  type HollowCheckboxProps as SvelteCheckboxProps,
  type HollowSwitchProps as SvelteSwitchProps,
  type HollowTabsProps as SvelteTabsProps,
  type HollowAccordionProps as SvelteAccordionProps,
  type HollowAccordionItemProps as SvelteAccordionItemProps,
} from './svelte.js';

// PhilJS bindings
export {
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
  bindProp,
  hollowProps,
  useHollowRef,
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
} from './philjs.js';
