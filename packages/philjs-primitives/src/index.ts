/**
 * PhilJS Primitives - Radix-style Headless UI Primitives
 * 
 * Unstyled, accessible components for building design systems.
 */

import { signal, effect, memo, type Signal } from '@philjs/core';

// ============ DIALOG PRIMITIVE ============

export interface DialogProps {
    open?: Signal<boolean> | boolean;
    onOpenChange?: (open: boolean) => void;
    modal?: boolean;
}

export function createDialog(props: DialogProps = {}) {
    const open = typeof props.open === 'function'
        ? props.open
        : signal(props.open ?? false);

    const triggerRef = signal<HTMLElement | null>(null);
    const contentRef = signal<HTMLElement | null>(null);

    const openDialog = () => {
        open.set(true);
        props.onOpenChange?.(true);
    };

    const closeDialog = () => {
        open.set(false);
        props.onOpenChange?.(false);
        triggerRef()?.focus();
    };

    const toggle = () => {
        if (open()) closeDialog();
        else openDialog();
    };

    // Handle escape key
    effect(() => {
        if (!open()) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeDialog();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    });

    // Focus trap
    effect(() => {
        if (!open() || !contentRef()) return;

        const focusableElements = contentRef()!.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        firstElement?.focus();

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleTab);
        return () => document.removeEventListener('keydown', handleTab);
    });

    return {
        open,
        openDialog,
        closeDialog,
        toggle,
        triggerProps: {
            ref: (el: HTMLElement) => triggerRef.set(el),
            onClick: toggle,
            'aria-haspopup': 'dialog',
            'aria-expanded': () => open(),
        },
        contentProps: {
            ref: (el: HTMLElement) => contentRef.set(el),
            role: 'dialog',
            'aria-modal': props.modal ?? true,
            tabIndex: -1,
        },
        overlayProps: {
            onClick: (e: MouseEvent) => {
                if (e.target === e.currentTarget) closeDialog();
            },
        },
    };
}

// ============ POPOVER PRIMITIVE ============

export interface PopoverProps {
    open?: Signal<boolean> | boolean;
    onOpenChange?: (open: boolean) => void;
    placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function createPopover(props: PopoverProps = {}) {
    const open = typeof props.open === 'function'
        ? props.open
        : signal(props.open ?? false);

    const triggerRef = signal<HTMLElement | null>(null);
    const contentRef = signal<HTMLElement | null>(null);
    const placement = props.placement ?? 'bottom';

    const openPopover = () => {
        open.set(true);
        props.onOpenChange?.(true);
    };

    const closePopover = () => {
        open.set(false);
        props.onOpenChange?.(false);
    };

    const toggle = () => {
        if (open()) closePopover();
        else openPopover();
    };

    // Position calculation
    const position = memo(() => {
        const trigger = triggerRef();
        if (!trigger || !open()) return { top: 0, left: 0 };

        const rect = trigger.getBoundingClientRect();
        const offset = 8;

        switch (placement) {
            case 'top':
                return { top: rect.top - offset, left: rect.left + rect.width / 2 };
            case 'bottom':
                return { top: rect.bottom + offset, left: rect.left + rect.width / 2 };
            case 'left':
                return { top: rect.top + rect.height / 2, left: rect.left - offset };
            case 'right':
                return { top: rect.top + rect.height / 2, left: rect.right + offset };
        }
    });

    // Click outside to close
    effect(() => {
        if (!open()) return;

        const handleClickOutside = (e: MouseEvent) => {
            const trigger = triggerRef();
            const content = contentRef();
            if (!trigger?.contains(e.target as Node) && !content?.contains(e.target as Node)) {
                closePopover();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    });

    return {
        open,
        openPopover,
        closePopover,
        toggle,
        position,
        triggerProps: {
            ref: (el: HTMLElement) => triggerRef.set(el),
            onClick: toggle,
            'aria-haspopup': 'true',
            'aria-expanded': () => open(),
        },
        contentProps: {
            ref: (el: HTMLElement) => contentRef.set(el),
            role: 'dialog',
            style: () => ({
                position: 'absolute',
                top: `${position().top}px`,
                left: `${position().left}px`,
            }),
        },
    };
}

// ============ TABS PRIMITIVE ============

export interface TabsProps {
    defaultValue?: string;
    value?: Signal<string>;
    onValueChange?: (value: string) => void;
    orientation?: 'horizontal' | 'vertical';
}

export function createTabs(props: TabsProps = {}) {
    const value = props.value ?? signal(props.defaultValue ?? '');
    const orientation = props.orientation ?? 'horizontal';
    const tabs = signal<string[]>([]);

    const selectTab = (tabValue: string) => {
        value.set(tabValue);
        props.onValueChange?.(tabValue);
    };

    const registerTab = (tabValue: string) => {
        tabs.update(t => [...t, tabValue]);
    };

    const isSelected = (tabValue: string) => value() === tabValue;

    const getTabProps = (tabValue: string) => ({
        role: 'tab',
        'aria-selected': () => isSelected(tabValue),
        tabIndex: () => isSelected(tabValue) ? 0 : -1,
        onClick: () => selectTab(tabValue),
        onKeyDown: (e: KeyboardEvent) => {
            const currentIndex = tabs().indexOf(tabValue);
            let nextIndex = currentIndex;

            if (orientation === 'horizontal') {
                if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs().length;
                if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs().length) % tabs().length;
            } else {
                if (e.key === 'ArrowDown') nextIndex = (currentIndex + 1) % tabs().length;
                if (e.key === 'ArrowUp') nextIndex = (currentIndex - 1 + tabs().length) % tabs().length;
            }

            if (nextIndex !== currentIndex) {
                e.preventDefault();
                selectTab(tabs()[nextIndex]);
            }
        },
    });

    const getPanelProps = (tabValue: string) => ({
        role: 'tabpanel',
        hidden: () => !isSelected(tabValue),
        tabIndex: 0,
    });

    return {
        value,
        selectTab,
        registerTab,
        isSelected,
        getTabProps,
        getPanelProps,
        listProps: {
            role: 'tablist',
            'aria-orientation': orientation,
        },
    };
}

// ============ ACCORDION PRIMITIVE ============

export interface AccordionProps {
    type?: 'single' | 'multiple';
    defaultValue?: string | string[];
    collapsible?: boolean;
}

export function createAccordion(props: AccordionProps = {}) {
    const type = props.type ?? 'single';
    const collapsible = props.collapsible ?? false;

    const value = signal<string[]>(
        Array.isArray(props.defaultValue)
            ? props.defaultValue
            : props.defaultValue
                ? [props.defaultValue]
                : []
    );

    const toggle = (itemValue: string) => {
        if (type === 'single') {
            if (value().includes(itemValue)) {
                if (collapsible) value.set([]);
            } else {
                value.set([itemValue]);
            }
        } else {
            if (value().includes(itemValue)) {
                value.update(v => v.filter(i => i !== itemValue));
            } else {
                value.update(v => [...v, itemValue]);
            }
        }
    };

    const isOpen = (itemValue: string) => value().includes(itemValue);

    const getTriggerProps = (itemValue: string) => ({
        'aria-expanded': () => isOpen(itemValue),
        onClick: () => toggle(itemValue),
    });

    const getContentProps = (itemValue: string) => ({
        role: 'region',
        hidden: () => !isOpen(itemValue),
    });

    return {
        value,
        toggle,
        isOpen,
        getTriggerProps,
        getContentProps,
    };
}

// ============ SWITCH PRIMITIVE ============

export interface SwitchProps {
    checked?: Signal<boolean> | boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
}

export function createSwitch(props: SwitchProps = {}) {
    const checked = typeof props.checked === 'function'
        ? props.checked
        : signal(props.checked ?? false);

    const toggle = () => {
        if (props.disabled) return;
        const newValue = !checked();
        checked.set(newValue);
        props.onCheckedChange?.(newValue);
    };

    return {
        checked,
        toggle,
        props: {
            role: 'switch',
            'aria-checked': () => checked(),
            'aria-disabled': props.disabled,
            tabIndex: props.disabled ? -1 : 0,
            onClick: toggle,
            onKeyDown: (e: KeyboardEvent) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggle();
                }
            },
        },
    };
}

// ============ SLIDER PRIMITIVE ============

export interface SliderProps {
    value?: Signal<number> | number;
    min?: number;
    max?: number;
    step?: number;
    onValueChange?: (value: number) => void;
}

export function createSlider(props: SliderProps = {}) {
    const value = typeof props.value === 'function'
        ? props.value
        : signal(props.value ?? 0);

    const min = props.min ?? 0;
    const max = props.max ?? 100;
    const step = props.step ?? 1;

    const percentage = memo(() => ((value() - min) / (max - min)) * 100);

    const setValue = (newValue: number) => {
        const clamped = Math.min(max, Math.max(min, newValue));
        const stepped = Math.round(clamped / step) * step;
        value.set(stepped);
        props.onValueChange?.(stepped);
    };

    const increment = () => setValue(value() + step);
    const decrement = () => setValue(value() - step);

    return {
        value,
        percentage,
        setValue,
        increment,
        decrement,
        trackProps: {
            role: 'slider',
            'aria-valuemin': min,
            'aria-valuemax': max,
            'aria-valuenow': () => value(),
            tabIndex: 0,
            onKeyDown: (e: KeyboardEvent) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    increment();
                }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    decrement();
                }
            },
        },
        thumbProps: {
            style: () => ({ left: `${percentage()}%` }),
        },
    };
}

// Export all primitives
export {
    createDialog as Dialog,
    createPopover as Popover,
    createTabs as Tabs,
    createAccordion as Accordion,
    createSwitch as Switch,
    createSlider as Slider,
};
