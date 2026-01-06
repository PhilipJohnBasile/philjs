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

// ============ CHECKBOX PRIMITIVE ============

export interface CheckboxProps {
    checked?: Signal<boolean | 'indeterminate'> | boolean | 'indeterminate';
    onCheckedChange?: (checked: boolean | 'indeterminate') => void;
    disabled?: boolean;
    required?: boolean;
    name?: string;
}

export function createCheckbox(props: CheckboxProps = {}) {
    const checked = typeof props.checked === 'function'
        ? props.checked
        : signal<boolean | 'indeterminate'>(props.checked ?? false);

    const toggle = () => {
        if (props.disabled) return;
        const current = checked();
        const newValue = current === 'indeterminate' ? true : !current;
        checked.set(newValue);
        props.onCheckedChange?.(newValue);
    };

    const setChecked = (value: boolean | 'indeterminate') => {
        checked.set(value);
        props.onCheckedChange?.(value);
    };

    return {
        checked,
        toggle,
        setChecked,
        isChecked: () => checked() === true,
        isIndeterminate: () => checked() === 'indeterminate',
        props: {
            role: 'checkbox',
            'aria-checked': () => {
                const c = checked();
                return c === 'indeterminate' ? 'mixed' : c;
            },
            'aria-disabled': props.disabled,
            'aria-required': props.required,
            tabIndex: props.disabled ? -1 : 0,
            onClick: toggle,
            onKeyDown: (e: KeyboardEvent) => {
                if (e.key === ' ') {
                    e.preventDefault();
                    toggle();
                }
            },
        },
        inputProps: {
            type: 'checkbox' as const,
            name: props.name,
            checked: () => checked() === true,
            disabled: props.disabled,
            required: props.required,
            onChange: (e: Event) => {
                const target = e.target as HTMLInputElement;
                setChecked(target.checked);
            },
        },
    };
}

// ============ SELECT PRIMITIVE ============

export interface SelectProps {
    value?: Signal<string>;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function createSelect(props: SelectProps = {}) {
    const value = props.value ?? signal(props.defaultValue ?? '');
    const open = signal(false);
    const highlightedIndex = signal(-1);
    const options = signal<{ value: string; label: string; disabled?: boolean }[]>([]);
    const triggerRef = signal<HTMLElement | null>(null);
    const listRef = signal<HTMLElement | null>(null);

    const openSelect = () => {
        if (props.disabled) return;
        open.set(true);
        // Highlight current value
        const currentIndex = options().findIndex(o => o.value === value());
        highlightedIndex.set(currentIndex >= 0 ? currentIndex : 0);
    };

    const closeSelect = () => {
        open.set(false);
        highlightedIndex.set(-1);
        triggerRef()?.focus();
    };

    const toggle = () => {
        if (open()) closeSelect();
        else openSelect();
    };

    const selectOption = (optionValue: string) => {
        const option = options().find(o => o.value === optionValue);
        if (option?.disabled) return;
        value.set(optionValue);
        props.onValueChange?.(optionValue);
        closeSelect();
    };

    const registerOption = (option: { value: string; label: string; disabled?: boolean }) => {
        options.update(opts => [...opts, option]);
    };

    const selectedLabel = memo(() => {
        const selected = options().find(o => o.value === value());
        return selected?.label ?? props.placeholder ?? '';
    });

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!open()) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openSelect();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                highlightedIndex.update(i => Math.min(i + 1, options().length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                highlightedIndex.update(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (highlightedIndex() >= 0) {
                    selectOption(options()[highlightedIndex()].value);
                }
                break;
            case 'Escape':
                e.preventDefault();
                closeSelect();
                break;
            case 'Home':
                e.preventDefault();
                highlightedIndex.set(0);
                break;
            case 'End':
                e.preventDefault();
                highlightedIndex.set(options().length - 1);
                break;
        }
    };

    // Click outside to close
    effect(() => {
        if (!open()) return;

        const handleClickOutside = (e: MouseEvent) => {
            const trigger = triggerRef();
            const list = listRef();
            if (!trigger?.contains(e.target as Node) && !list?.contains(e.target as Node)) {
                closeSelect();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    });

    return {
        value,
        open,
        highlightedIndex,
        options,
        selectedLabel,
        openSelect,
        closeSelect,
        toggle,
        selectOption,
        registerOption,
        triggerProps: {
            ref: (el: HTMLElement) => triggerRef.set(el),
            role: 'combobox',
            'aria-expanded': () => open(),
            'aria-haspopup': 'listbox',
            'aria-disabled': props.disabled,
            tabIndex: props.disabled ? -1 : 0,
            onClick: toggle,
            onKeyDown: handleKeyDown,
        },
        listProps: {
            ref: (el: HTMLElement) => listRef.set(el),
            role: 'listbox',
            tabIndex: -1,
        },
        getOptionProps: (optionValue: string, index: number) => ({
            role: 'option',
            'aria-selected': () => value() === optionValue,
            'aria-disabled': options()[index]?.disabled,
            'data-highlighted': () => highlightedIndex() === index,
            onClick: () => selectOption(optionValue),
            onMouseEnter: () => highlightedIndex.set(index),
        }),
    };
}

// ============ TOOLTIP PRIMITIVE ============

export interface TooltipProps {
    delayDuration?: number;
    skipDelayDuration?: number;
}

let globalTooltipTimer: ReturnType<typeof setTimeout> | null = null;
let lastCloseTime = 0;

export function createTooltip(props: TooltipProps = {}) {
    const open = signal(false);
    const triggerRef = signal<HTMLElement | null>(null);
    const contentRef = signal<HTMLElement | null>(null);
    const delayDuration = props.delayDuration ?? 700;
    const skipDelayDuration = props.skipDelayDuration ?? 300;

    let openTimer: ReturnType<typeof setTimeout> | null = null;

    const openTooltip = () => {
        open.set(true);
    };

    const closeTooltip = () => {
        open.set(false);
        lastCloseTime = Date.now();
    };

    const handleMouseEnter = () => {
        if (globalTooltipTimer) {
            clearTimeout(globalTooltipTimer);
            globalTooltipTimer = null;
        }

        // Skip delay if recently closed another tooltip
        const timeSinceLastClose = Date.now() - lastCloseTime;
        const delay = timeSinceLastClose < skipDelayDuration ? 0 : delayDuration;

        openTimer = setTimeout(openTooltip, delay);
    };

    const handleMouseLeave = () => {
        if (openTimer) {
            clearTimeout(openTimer);
            openTimer = null;
        }
        closeTooltip();
    };

    // Position calculation
    const position = memo(() => {
        const trigger = triggerRef();
        if (!trigger || !open()) return { top: 0, left: 0 };

        const rect = trigger.getBoundingClientRect();
        const offset = 8;

        return {
            top: rect.top - offset,
            left: rect.left + rect.width / 2,
        };
    });

    return {
        open,
        openTooltip,
        closeTooltip,
        position,
        triggerProps: {
            ref: (el: HTMLElement) => triggerRef.set(el),
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            onFocus: handleMouseEnter,
            onBlur: handleMouseLeave,
            'aria-describedby': () => open() ? 'tooltip-content' : undefined,
        },
        contentProps: {
            ref: (el: HTMLElement) => contentRef.set(el),
            id: 'tooltip-content',
            role: 'tooltip',
            style: () => ({
                position: 'absolute',
                top: `${position().top}px`,
                left: `${position().left}px`,
                transform: 'translate(-50%, -100%)',
            }),
        },
    };
}

// ============ MENU PRIMITIVE ============

export interface MenuProps {
    onSelect?: (value: string) => void;
}

export function createMenu(props: MenuProps = {}) {
    const open = signal(false);
    const highlightedIndex = signal(-1);
    const items = signal<{ value: string; label: string; disabled?: boolean }[]>([]);
    const triggerRef = signal<HTMLElement | null>(null);
    const menuRef = signal<HTMLElement | null>(null);

    const openMenu = () => {
        open.set(true);
        highlightedIndex.set(0);
    };

    const closeMenu = () => {
        open.set(false);
        highlightedIndex.set(-1);
        triggerRef()?.focus();
    };

    const toggle = () => {
        if (open()) closeMenu();
        else openMenu();
    };

    const selectItem = (value: string) => {
        props.onSelect?.(value);
        closeMenu();
    };

    const registerItem = (item: { value: string; label: string; disabled?: boolean }) => {
        items.update(i => [...i, item]);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!open()) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openMenu();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                highlightedIndex.update(i => {
                    let next = i + 1;
                    while (next < items().length && items()[next].disabled) next++;
                    return next < items().length ? next : i;
                });
                break;
            case 'ArrowUp':
                e.preventDefault();
                highlightedIndex.update(i => {
                    let prev = i - 1;
                    while (prev >= 0 && items()[prev].disabled) prev--;
                    return prev >= 0 ? prev : i;
                });
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (highlightedIndex() >= 0 && !items()[highlightedIndex()].disabled) {
                    selectItem(items()[highlightedIndex()].value);
                }
                break;
            case 'Escape':
                e.preventDefault();
                closeMenu();
                break;
        }
    };

    // Click outside
    effect(() => {
        if (!open()) return;

        const handleClickOutside = (e: MouseEvent) => {
            const trigger = triggerRef();
            const menu = menuRef();
            if (!trigger?.contains(e.target as Node) && !menu?.contains(e.target as Node)) {
                closeMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    });

    return {
        open,
        highlightedIndex,
        items,
        openMenu,
        closeMenu,
        toggle,
        selectItem,
        registerItem,
        triggerProps: {
            ref: (el: HTMLElement) => triggerRef.set(el),
            'aria-haspopup': 'menu',
            'aria-expanded': () => open(),
            onClick: toggle,
            onKeyDown: handleKeyDown,
        },
        menuProps: {
            ref: (el: HTMLElement) => menuRef.set(el),
            role: 'menu',
            tabIndex: -1,
        },
        getItemProps: (value: string, index: number) => ({
            role: 'menuitem',
            'aria-disabled': items()[index]?.disabled,
            'data-highlighted': () => highlightedIndex() === index,
            tabIndex: -1,
            onClick: () => {
                if (!items()[index]?.disabled) selectItem(value);
            },
            onMouseEnter: () => {
                if (!items()[index]?.disabled) highlightedIndex.set(index);
            },
        }),
    };
}

// ============ RADIO GROUP PRIMITIVE ============

export interface RadioGroupProps {
    value?: Signal<string>;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
    orientation?: 'horizontal' | 'vertical';
    name?: string;
}

export function createRadioGroup(props: RadioGroupProps = {}) {
    const value = props.value ?? signal(props.defaultValue ?? '');
    const items = signal<string[]>([]);
    const orientation = props.orientation ?? 'vertical';

    const selectValue = (itemValue: string) => {
        if (props.disabled) return;
        value.set(itemValue);
        props.onValueChange?.(itemValue);
    };

    const registerItem = (itemValue: string) => {
        items.update(i => [...i, itemValue]);
    };

    const isSelected = (itemValue: string) => value() === itemValue;

    const handleKeyDown = (e: KeyboardEvent, itemValue: string) => {
        const currentIndex = items().indexOf(itemValue);
        let nextIndex = currentIndex;

        if (orientation === 'horizontal') {
            if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % items().length;
            if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + items().length) % items().length;
        } else {
            if (e.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items().length;
            if (e.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items().length) % items().length;
        }

        if (nextIndex !== currentIndex) {
            e.preventDefault();
            selectValue(items()[nextIndex]);
        }
    };

    return {
        value,
        items,
        selectValue,
        registerItem,
        isSelected,
        groupProps: {
            role: 'radiogroup',
            'aria-orientation': orientation,
            'aria-required': props.required,
            'aria-disabled': props.disabled,
        },
        getItemProps: (itemValue: string) => ({
            role: 'radio',
            'aria-checked': () => isSelected(itemValue),
            'aria-disabled': props.disabled,
            tabIndex: () => isSelected(itemValue) ? 0 : -1,
            onClick: () => selectValue(itemValue),
            onKeyDown: (e: KeyboardEvent) => handleKeyDown(e, itemValue),
        }),
        getInputProps: (itemValue: string) => ({
            type: 'radio' as const,
            name: props.name,
            value: itemValue,
            checked: () => isSelected(itemValue),
            disabled: props.disabled,
            required: props.required,
            onChange: () => selectValue(itemValue),
        }),
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
    createCheckbox as Checkbox,
    createSelect as Select,
    createTooltip as Tooltip,
    createMenu as Menu,
    createRadioGroup as RadioGroup,
};
