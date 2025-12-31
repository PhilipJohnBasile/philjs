/**
 * Svelte Actions for Hollow Components
 * Svelte-compatible actions for Hollow Web Components
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
 * Action parameter type
 */
export interface HollowActionParams {
    [key: string]: unknown;
}
/**
 * Svelte action for Hollow components
 */
export declare function hollow(node: HTMLElement, params: HollowActionParams): {
    update: (newParams: HollowActionParams) => void;
    destroy(): void;
};
/**
 * Typed action for Hollow Button
 */
export declare function hollowButton(node: HTMLElement, params: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onClick?: (detail: {
        originalEvent: Event;
        timestamp: number;
    }) => void;
}): {
    update: (newParams: HollowActionParams) => void;
    destroy(): void;
};
/**
 * Typed action for Hollow Input
 */
export declare function hollowInput(node: HTMLElement, params: {
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
}): {
    update: (newParams: HollowActionParams) => void;
    destroy(): void;
};
/**
 * Typed action for Hollow Card
 */
export declare function hollowCard(node: HTMLElement, params: {
    variant?: CardVariant;
    padding?: CardPadding;
    interactive?: boolean;
    selected?: boolean;
    onClick?: (detail: {
        selected: boolean;
        originalEvent: Event;
    }) => void;
}): {
    update: (newParams: HollowActionParams) => void;
    destroy(): void;
};
/**
 * Typed action for Hollow Modal
 */
export declare function hollowModal(node: HTMLElement, params: {
    open?: boolean;
    size?: ModalSize;
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
}): {
    update: (newParams: HollowActionParams) => void;
    destroy(): void;
};
/**
 * Typed action for Hollow Select
 */
export declare function hollowSelect(node: HTMLElement, params: {
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
    onChange?: (detail: {
        value: string;
        previousValue: string;
        option?: SelectOption;
    }) => void;
    onToggle?: (detail: {
        open: boolean;
    }) => void;
}): {
    update: (newParams: HollowActionParams) => void;
    destroy(): void;
};
/**
 * Typed action for Hollow Checkbox
 */
export declare function hollowCheckbox(node: HTMLElement, params: {
    variant?: CheckboxVariant;
    size?: CheckboxSize;
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
    onChange?: (detail: {
        checked: boolean;
        previousChecked: boolean;
        value: string;
        originalEvent?: Event;
    }) => void;
}): {
    update: (newParams: HollowActionParams) => void;
    destroy(): void;
};
/**
 * Typed action for Hollow Switch
 */
export declare function hollowSwitch(node: HTMLElement, params: {
    variant?: SwitchVariant;
    size?: SwitchSize;
    checked?: boolean;
    disabled?: boolean;
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
}): {
    update: (newParams: HollowActionParams) => void;
    destroy(): void;
};
/**
 * Typed action for Hollow Tabs
 */
export declare function hollowTabs(node: HTMLElement, params: {
    variant?: TabsVariant;
    size?: TabsSize;
    active?: string;
    alignment?: TabsAlignment;
    tabs?: TabDefinition[];
    onChange?: (detail: {
        tab: string;
        previousTab: string;
        tabIndex: number;
    }) => void;
}): {
    update: (newParams: HollowActionParams) => void;
    destroy(): void;
};
/**
 * Typed action for Hollow Accordion
 */
export declare function hollowAccordion(node: HTMLElement, params: {
    variant?: AccordionVariant;
    multiple?: boolean;
    collapsible?: boolean;
    expanded?: string;
    items?: AccordionItem[];
    onChange?: (detail: {
        itemId?: string;
        expanded?: boolean;
        expandedItems: string[];
        action?: string;
    }) => void;
}): {
    update: (newParams: HollowActionParams) => void;
    destroy(): void;
};
/**
 * Typed action for Hollow AccordionItem
 */
export declare function hollowAccordionItem(node: HTMLElement, params: {
    title?: string;
    expanded?: boolean;
    disabled?: boolean;
    icon?: string;
    onToggle?: (detail: {
        id: string;
        expanded: boolean;
    }) => void;
}): {
    update: (newParams: HollowActionParams) => void;
    destroy(): void;
};
/**
 * Reactive store wrapper for Hollow components
 * Creates a Svelte store that syncs with component attributes
 */
export declare function createHollowStore<T extends Record<string, unknown>>(initial: T): {
    subscribe(callback: (value: T) => void): () => void;
    set(newValue: T): void;
    update(updater: (value: T) => T): void;
};
/**
 * Event dispatcher helper for Svelte components
 */
export declare function onHollowEvent<T>(element: HTMLElement, eventName: string, handler: (detail: T) => void): () => void;
/**
 * Type definitions for Svelte components
 */
export interface HollowButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
}
export interface HollowInputProps {
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
}
export interface HollowCardProps {
    variant?: CardVariant;
    padding?: CardPadding;
    interactive?: boolean;
    selected?: boolean;
}
export interface HollowModalProps {
    open?: boolean;
    size?: ModalSize;
    animation?: ModalAnimation;
    closable?: boolean;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    persistent?: boolean;
}
export interface HollowSelectProps {
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
}
export interface HollowCheckboxProps {
    variant?: CheckboxVariant;
    size?: CheckboxSize;
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
}
export interface HollowSwitchProps {
    variant?: SwitchVariant;
    size?: SwitchSize;
    checked?: boolean;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
    labelOn?: string;
    labelOff?: string;
}
export interface HollowTabsProps {
    variant?: TabsVariant;
    size?: TabsSize;
    active?: string;
    alignment?: TabsAlignment;
    tabs?: TabDefinition[];
}
export interface HollowAccordionProps {
    variant?: AccordionVariant;
    multiple?: boolean;
    collapsible?: boolean;
    expanded?: string;
    items?: AccordionItem[];
}
export interface HollowAccordionItemProps {
    title?: string;
    expanded?: boolean;
    disabled?: boolean;
    icon?: string;
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
declare global {
    namespace svelteHTML {
        interface HTMLAttributes<T extends EventTarget> {
            'on:hollow-click'?: (event: CustomEvent<{
                originalEvent: Event;
                timestamp: number;
            }>) => void;
            'on:hollow-input'?: (event: CustomEvent<{
                value: string;
                previousValue: string;
                originalEvent: Event;
            }>) => void;
            'on:hollow-change'?: (event: CustomEvent<unknown>) => void;
            'on:hollow-open'?: (event: CustomEvent<{
                timestamp: number;
            }>) => void;
            'on:hollow-close'?: (event: CustomEvent<{
                timestamp: number;
            }>) => void;
            'on:hollow-toggle'?: (event: CustomEvent<{
                open?: boolean;
                id?: string;
                expanded?: boolean;
            }>) => void;
        }
    }
}
//# sourceMappingURL=svelte.d.ts.map