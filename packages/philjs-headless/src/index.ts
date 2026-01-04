/**
 * PhilJS Headless UI Components
 */

import { signal, effect, memo } from '@philjs/core';

export function createMenu() {
    const open = signal(false);
    const activeIndex = signal(-1);

    return {
        open,
        activeIndex,
        toggle: () => open.update(v => !v),
        close: () => open.set(false),
        buttonProps: { onClick: () => open.update(v => !v), 'aria-expanded': () => open() },
        itemsProps: { role: 'menu', hidden: () => !open() },
    };
}

export function createListbox<T>() {
    const selected = signal<T | null>(null);
    const open = signal(false);

    return {
        selected,
        open,
        select: (value: T) => { selected.set(value); open.set(false); },
        buttonProps: { onClick: () => open.update(v => !v) },
        optionsProps: { role: 'listbox', hidden: () => !open() },
    };
}

export function createCombobox<T>() {
    const query = signal('');
    const selected = signal<T | null>(null);
    const open = signal(false);

    return {
        query, selected, open,
        inputProps: {
            value: () => query(),
            onInput: (e: any) => { query.set(e.target.value); open.set(true); }
        },
    };
}

export function createRadioGroup<T>() {
    const value = signal<T | null>(null);
    return {
        value,
        getOptionProps: (optionValue: T) => ({
            role: 'radio',
            'aria-checked': () => value() === optionValue,
            onClick: () => value.set(optionValue),
        }),
    };
}

export { createMenu as Menu, createListbox as Listbox, createCombobox as Combobox, createRadioGroup as RadioGroup };
