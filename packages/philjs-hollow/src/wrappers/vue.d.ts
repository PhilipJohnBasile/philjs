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
export declare function createVueWrapper(tagName: string, props: VuePropDef[], emits?: string[]): {
    name: string;
    props: {
        [k: string]: {
            type: StringConstructor | ObjectConstructor | ArrayConstructor | NumberConstructor | BooleanConstructor;
            default: unknown;
            required: boolean;
        };
    };
    emits: string[];
    setup(propsData: Record<string, unknown>, { emit, slots }: {
        emit: (event: string, ...args: unknown[]) => void;
        slots: Record<string, (() => unknown) | undefined>;
    }): () => {
        type: string;
        props: {
            [x: string]: unknown;
        };
        children: unknown;
    };
};
/**
 * Vue Button component
 */
export declare const HollowButton: {
    name: string;
    props: {
        [k: string]: {
            type: StringConstructor | ObjectConstructor | ArrayConstructor | NumberConstructor | BooleanConstructor;
            default: unknown;
            required: boolean;
        };
    };
    emits: string[];
    setup(propsData: Record<string, unknown>, { emit, slots }: {
        emit: (event: string, ...args: unknown[]) => void;
        slots: Record<string, (() => unknown) | undefined>;
    }): () => {
        type: string;
        props: {
            [x: string]: unknown;
        };
        children: unknown;
    };
};
/**
 * Vue Input component
 */
export declare const HollowInput: {
    name: string;
    props: {
        [k: string]: {
            type: StringConstructor | ObjectConstructor | ArrayConstructor | NumberConstructor | BooleanConstructor;
            default: unknown;
            required: boolean;
        };
    };
    emits: string[];
    setup(propsData: Record<string, unknown>, { emit, slots }: {
        emit: (event: string, ...args: unknown[]) => void;
        slots: Record<string, (() => unknown) | undefined>;
    }): () => {
        type: string;
        props: {
            [x: string]: unknown;
        };
        children: unknown;
    };
};
/**
 * Vue Card component
 */
export declare const HollowCard: {
    name: string;
    props: {
        [k: string]: {
            type: StringConstructor | ObjectConstructor | ArrayConstructor | NumberConstructor | BooleanConstructor;
            default: unknown;
            required: boolean;
        };
    };
    emits: string[];
    setup(propsData: Record<string, unknown>, { emit, slots }: {
        emit: (event: string, ...args: unknown[]) => void;
        slots: Record<string, (() => unknown) | undefined>;
    }): () => {
        type: string;
        props: {
            [x: string]: unknown;
        };
        children: unknown;
    };
};
/**
 * Vue Modal component
 */
export declare const HollowModal: {
    name: string;
    props: {
        [k: string]: {
            type: StringConstructor | ObjectConstructor | ArrayConstructor | NumberConstructor | BooleanConstructor;
            default: unknown;
            required: boolean;
        };
    };
    emits: string[];
    setup(propsData: Record<string, unknown>, { emit, slots }: {
        emit: (event: string, ...args: unknown[]) => void;
        slots: Record<string, (() => unknown) | undefined>;
    }): () => {
        type: string;
        props: {
            [x: string]: unknown;
        };
        children: unknown;
    };
};
/**
 * Vue Select component
 */
export declare const HollowSelect: {
    name: string;
    props: {
        [k: string]: {
            type: StringConstructor | ObjectConstructor | ArrayConstructor | NumberConstructor | BooleanConstructor;
            default: unknown;
            required: boolean;
        };
    };
    emits: string[];
    setup(propsData: Record<string, unknown>, { emit, slots }: {
        emit: (event: string, ...args: unknown[]) => void;
        slots: Record<string, (() => unknown) | undefined>;
    }): () => {
        type: string;
        props: {
            [x: string]: unknown;
        };
        children: unknown;
    };
};
/**
 * Vue Checkbox component
 */
export declare const HollowCheckbox: {
    name: string;
    props: {
        [k: string]: {
            type: StringConstructor | ObjectConstructor | ArrayConstructor | NumberConstructor | BooleanConstructor;
            default: unknown;
            required: boolean;
        };
    };
    emits: string[];
    setup(propsData: Record<string, unknown>, { emit, slots }: {
        emit: (event: string, ...args: unknown[]) => void;
        slots: Record<string, (() => unknown) | undefined>;
    }): () => {
        type: string;
        props: {
            [x: string]: unknown;
        };
        children: unknown;
    };
};
/**
 * Vue Switch component
 */
export declare const HollowSwitch: {
    name: string;
    props: {
        [k: string]: {
            type: StringConstructor | ObjectConstructor | ArrayConstructor | NumberConstructor | BooleanConstructor;
            default: unknown;
            required: boolean;
        };
    };
    emits: string[];
    setup(propsData: Record<string, unknown>, { emit, slots }: {
        emit: (event: string, ...args: unknown[]) => void;
        slots: Record<string, (() => unknown) | undefined>;
    }): () => {
        type: string;
        props: {
            [x: string]: unknown;
        };
        children: unknown;
    };
};
/**
 * Vue Tabs component
 */
export declare const HollowTabs: {
    name: string;
    props: {
        [k: string]: {
            type: StringConstructor | ObjectConstructor | ArrayConstructor | NumberConstructor | BooleanConstructor;
            default: unknown;
            required: boolean;
        };
    };
    emits: string[];
    setup(propsData: Record<string, unknown>, { emit, slots }: {
        emit: (event: string, ...args: unknown[]) => void;
        slots: Record<string, (() => unknown) | undefined>;
    }): () => {
        type: string;
        props: {
            [x: string]: unknown;
        };
        children: unknown;
    };
};
/**
 * Vue Accordion component
 */
export declare const HollowAccordion: {
    name: string;
    props: {
        [k: string]: {
            type: StringConstructor | ObjectConstructor | ArrayConstructor | NumberConstructor | BooleanConstructor;
            default: unknown;
            required: boolean;
        };
    };
    emits: string[];
    setup(propsData: Record<string, unknown>, { emit, slots }: {
        emit: (event: string, ...args: unknown[]) => void;
        slots: Record<string, (() => unknown) | undefined>;
    }): () => {
        type: string;
        props: {
            [x: string]: unknown;
        };
        children: unknown;
    };
};
/**
 * Vue AccordionItem component
 */
export declare const HollowAccordionItem: {
    name: string;
    props: {
        [k: string]: {
            type: StringConstructor | ObjectConstructor | ArrayConstructor | NumberConstructor | BooleanConstructor;
            default: unknown;
            required: boolean;
        };
    };
    emits: string[];
    setup(propsData: Record<string, unknown>, { emit, slots }: {
        emit: (event: string, ...args: unknown[]) => void;
        slots: Record<string, (() => unknown) | undefined>;
    }): () => {
        type: string;
        props: {
            [x: string]: unknown;
        };
        children: unknown;
    };
};
/**
 * Vue directive for Hollow components
 */
export declare const vHollowProps: {
    mounted(el: HTMLElement, binding: {
        value: Record<string, unknown>;
    }): void;
    updated(el: HTMLElement, binding: {
        value: Record<string, unknown>;
        oldValue: Record<string, unknown>;
    }): void;
};
/**
 * Vue plugin for registering Hollow components globally
 */
export declare const HollowPlugin: {
    install(app: {
        component: (name: string, component: unknown) => void;
        directive: (name: string, directive: unknown) => void;
    }): void;
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
//# sourceMappingURL=vue.d.ts.map