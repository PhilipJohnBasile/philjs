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
export declare function bindProp(element: HTMLElement, propName: string, accessor: Accessor<unknown>): () => void;
/**
 * Props type for reactive binding
 */
export type ReactiveProps<T> = {
    [K in keyof T]: T[K] | Accessor<T[K]>;
};
/**
 * Button props for PhilJS
 */
export interface HollowButtonProps {
    variant?: ButtonVariant | Accessor<ButtonVariant>;
    size?: ButtonSize | Accessor<ButtonSize>;
    disabled?: boolean | Accessor<boolean>;
    loading?: boolean | Accessor<boolean>;
    type?: 'button' | 'submit' | 'reset';
    onClick?: (detail: {
        originalEvent: Event;
        timestamp: number;
    }) => void;
    children?: unknown;
    ref?: (el: HTMLElement) => void;
}
/**
 * PhilJS Button component factory
 */
export declare function Button(props: HollowButtonProps): {
    type: string;
    props: Record<string, unknown>;
    ref?: (el: HTMLElement) => void;
};
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
    onInput?: (detail: {
        value: string;
        previousValue: string;
        originalEvent: Event;
    }) => void;
    onChange?: (detail: {
        value: string;
        valid: boolean;
        originalEvent: Event;
    }) => void;
    ref?: (el: HTMLElement) => void;
}
/**
 * PhilJS Input component factory
 */
export declare function Input(props: HollowInputProps): {
    type: string;
    props: Record<string, unknown>;
    ref?: (el: HTMLElement) => void;
};
/**
 * Card props for PhilJS
 */
export interface HollowCardProps {
    variant?: CardVariant | Accessor<CardVariant>;
    padding?: CardPadding | Accessor<CardPadding>;
    interactive?: boolean;
    selected?: boolean | Accessor<boolean>;
    onClick?: (detail: {
        selected: boolean;
        originalEvent: Event;
    }) => void;
    children?: unknown;
    header?: unknown;
    footer?: unknown;
    ref?: (el: HTMLElement) => void;
}
/**
 * PhilJS Card component factory
 */
export declare function Card(props: HollowCardProps): {
    type: string;
    props: Record<string, unknown>;
    ref?: (el: HTMLElement) => void;
};
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
    onOpen?: (detail: {
        timestamp: number;
    }) => void;
    onClose?: (detail: {
        timestamp: number;
    }) => void;
    children?: unknown;
    header?: unknown;
    footer?: unknown;
    ref?: (el: HTMLElement) => void;
}
/**
 * PhilJS Modal component factory
 */
export declare function Modal(props: HollowModalProps): {
    type: string;
    props: Record<string, unknown>;
    ref?: (el: HTMLElement) => void;
};
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
    onChange?: (detail: {
        value: string;
        previousValue: string;
        option?: SelectOption;
    }) => void;
    onToggle?: (detail: {
        open: boolean;
    }) => void;
    ref?: (el: HTMLElement) => void;
}
/**
 * PhilJS Select component factory
 */
export declare function Select(props: HollowSelectProps): {
    type: string;
    props: Record<string, unknown>;
    ref?: (el: HTMLElement) => void;
};
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
    onChange?: (detail: {
        checked: boolean;
        previousChecked: boolean;
        value: string;
        originalEvent?: Event;
    }) => void;
    children?: unknown;
    ref?: (el: HTMLElement) => void;
}
/**
 * PhilJS Checkbox component factory
 */
export declare function Checkbox(props: HollowCheckboxProps): {
    type: string;
    props: Record<string, unknown>;
    ref?: (el: HTMLElement) => void;
};
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
    onChange?: (detail: {
        checked: boolean;
        previousChecked: boolean;
        value: string;
        originalEvent?: Event;
    }) => void;
    children?: unknown;
    ref?: (el: HTMLElement) => void;
}
/**
 * PhilJS Switch component factory
 */
export declare function Switch(props: HollowSwitchProps): {
    type: string;
    props: Record<string, unknown>;
    ref?: (el: HTMLElement) => void;
};
/**
 * Tabs props for PhilJS
 */
export interface HollowTabsProps {
    variant?: TabsVariant | Accessor<TabsVariant>;
    size?: TabsSize | Accessor<TabsSize>;
    active?: string | Accessor<string>;
    alignment?: TabsAlignment;
    tabs?: TabDefinition[] | Accessor<TabDefinition[]>;
    onChange?: (detail: {
        tab: string;
        previousTab: string;
        tabIndex: number;
    }) => void;
    children?: unknown;
    ref?: (el: HTMLElement) => void;
}
/**
 * PhilJS Tabs component factory
 */
export declare function Tabs(props: HollowTabsProps): {
    type: string;
    props: Record<string, unknown>;
    ref?: (el: HTMLElement) => void;
};
/**
 * Accordion props for PhilJS
 */
export interface HollowAccordionProps {
    variant?: AccordionVariant | Accessor<AccordionVariant>;
    multiple?: boolean;
    collapsible?: boolean;
    expanded?: string | Accessor<string>;
    items?: AccordionItem[] | Accessor<AccordionItem[]>;
    onChange?: (detail: {
        itemId?: string;
        expanded?: boolean;
        expandedItems: string[];
        action?: string;
    }) => void;
    children?: unknown;
    ref?: (el: HTMLElement) => void;
}
/**
 * PhilJS Accordion component factory
 */
export declare function Accordion(props: HollowAccordionProps): {
    type: string;
    props: Record<string, unknown>;
    ref?: (el: HTMLElement) => void;
};
/**
 * AccordionItem props for PhilJS
 */
export interface HollowAccordionItemProps {
    title?: string;
    expanded?: boolean | Accessor<boolean>;
    disabled?: boolean | Accessor<boolean>;
    icon?: string;
    onToggle?: (detail: {
        id: string;
        expanded: boolean;
    }) => void;
    children?: unknown;
    ref?: (el: HTMLElement) => void;
}
/**
 * PhilJS AccordionItem component factory
 */
export declare function AccordionItem(props: HollowAccordionItemProps): {
    type: string;
    props: Record<string, unknown>;
    ref?: (el: HTMLElement) => void;
};
/**
 * Hook to bind Hollow events in PhilJS effects
 */
export declare function useHollowRef<T extends HTMLElement>(): {
    current: T | null;
    set: (el: T) => void;
    on: <D>(event: string, handler: (detail: D) => void) => () => void;
};
/**
 * Directive to apply Hollow props reactively
 */
export declare function hollowProps(element: HTMLElement, props: ReactiveProps<Record<string, unknown>>): () => void;
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
//# sourceMappingURL=philjs.d.ts.map