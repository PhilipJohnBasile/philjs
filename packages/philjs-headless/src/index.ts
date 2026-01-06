/**
 * PhilJS Headless UI Components
 *
 * Completely unstyled, accessible UI components for building custom design systems.
 * Inspired by Headless UI, Radix, and Ark UI.
 *
 * @example
 * ```typescript
 * import { createDialog, createTabs, createSwitch, createMenu } from '@philjs/headless';
 *
 * // Create a dialog
 * const dialog = createDialog();
 * dialog.open.set(true);
 *
 * // Create tabs
 * const tabs = createTabs({ defaultValue: 'tab1' });
 * ```
 */

import { signal, computed, effect, type Signal, type Computed } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

export interface HeadlessProps {
  [key: string]: any;
}

export type Orientation = 'horizontal' | 'vertical';
export type Direction = 'ltr' | 'rtl';

// ============================================================================
// Dialog / Modal
// ============================================================================

export interface DialogOptions {
  /** Initially open state */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: Signal<boolean>;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Close when clicking outside */
  closeOnOutsideClick?: boolean;
  /** Modal mode (traps focus) */
  modal?: boolean;
  /** Role for accessibility */
  role?: 'dialog' | 'alertdialog';
}

export interface Dialog {
  /** Open state */
  open: Signal<boolean>;
  /** Open the dialog */
  openDialog: () => void;
  /** Close the dialog */
  closeDialog: () => void;
  /** Toggle the dialog */
  toggle: () => void;
  /** Props for the dialog trigger */
  triggerProps: HeadlessProps;
  /** Props for the dialog container */
  containerProps: HeadlessProps;
  /** Props for the dialog backdrop */
  backdropProps: HeadlessProps;
  /** Props for the dialog panel */
  panelProps: HeadlessProps;
  /** Props for the title */
  titleProps: HeadlessProps;
  /** Props for the description */
  descriptionProps: HeadlessProps;
  /** Props for the close button */
  closeButtonProps: HeadlessProps;
}

export function createDialog(options: DialogOptions = {}): Dialog {
  const {
    defaultOpen = false,
    open: controlledOpen,
    onOpenChange,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    modal = true,
    role = 'dialog',
  } = options;

  const open = controlledOpen ?? signal(defaultOpen);
  const titleId = `dialog-title-${Math.random().toString(36).slice(2)}`;
  const descId = `dialog-desc-${Math.random().toString(36).slice(2)}`;

  const setOpen = (value: boolean) => {
    open.set(value);
    onOpenChange?.(value);
  };

  // Handle escape key
  if (typeof window !== 'undefined' && closeOnEscape) {
    effect(() => {
      if (!open.get()) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    });
  }

  return {
    open,
    openDialog: () => setOpen(true),
    closeDialog: () => setOpen(false),
    toggle: () => setOpen(!open.get()),
    triggerProps: {
      onClick: () => setOpen(true),
      'aria-haspopup': 'dialog',
      'aria-expanded': () => open.get(),
    },
    containerProps: {
      role: 'presentation',
      'aria-hidden': () => !open.get(),
      hidden: () => !open.get(),
    },
    backdropProps: {
      'aria-hidden': 'true',
      onClick: closeOnOutsideClick ? () => setOpen(false) : undefined,
    },
    panelProps: {
      role,
      'aria-modal': modal,
      'aria-labelledby': titleId,
      'aria-describedby': descId,
      tabIndex: -1,
    },
    titleProps: {
      id: titleId,
    },
    descriptionProps: {
      id: descId,
    },
    closeButtonProps: {
      onClick: () => setOpen(false),
      'aria-label': 'Close dialog',
    },
  };
}

// ============================================================================
// Menu / Dropdown
// ============================================================================

export interface MenuOptions {
  /** Initially open state */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: Signal<boolean>;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Orientation */
  orientation?: Orientation;
  /** Loop navigation */
  loop?: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface Menu {
  /** Open state */
  open: Signal<boolean>;
  /** Active (highlighted) item index */
  activeIndex: Signal<number>;
  /** Registered items */
  items: Signal<MenuItem[]>;
  /** Toggle menu */
  toggle: () => void;
  /** Open menu */
  openMenu: () => void;
  /** Close menu */
  closeMenu: () => void;
  /** Register an item */
  registerItem: (item: MenuItem) => void;
  /** Unregister an item */
  unregisterItem: (id: string) => void;
  /** Highlight item by index */
  highlightIndex: (index: number) => void;
  /** Select current item */
  selectCurrent: () => void;
  /** Props for the menu button */
  buttonProps: HeadlessProps;
  /** Props for the menu items container */
  itemsProps: HeadlessProps;
  /** Get props for a menu item */
  getItemProps: (item: MenuItem, index: number) => HeadlessProps;
}

export function createMenu(options: MenuOptions = {}): Menu {
  const {
    defaultOpen = false,
    open: controlledOpen,
    onOpenChange,
    orientation = 'vertical',
    loop = true,
  } = options;

  const open = controlledOpen ?? signal(defaultOpen);
  const activeIndex = signal(-1);
  const items = signal<MenuItem[]>([]);
  const menuId = `menu-${Math.random().toString(36).slice(2)}`;

  const setOpen = (value: boolean) => {
    open.set(value);
    onOpenChange?.(value);
    if (!value) activeIndex.set(-1);
  };

  const navigateItems = (direction: 1 | -1) => {
    const itemList = items.get();
    const current = activeIndex.get();
    let next = current + direction;

    // Skip disabled items
    while (next >= 0 && next < itemList.length && itemList[next]?.disabled) {
      next += direction;
    }

    if (loop) {
      if (next < 0) next = itemList.length - 1;
      if (next >= itemList.length) next = 0;
    }

    next = Math.max(0, Math.min(itemList.length - 1, next));
    activeIndex.set(next);
  };

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open.get()) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        navigateItems(1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        navigateItems(-1);
        break;
      case 'Home':
        e.preventDefault();
        activeIndex.set(0);
        break;
      case 'End':
        e.preventDefault();
        activeIndex.set(items.get().length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const current = items.get()[activeIndex.get()];
        if (current && !current.disabled) {
          current.onSelect?.();
          setOpen(false);
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  };

  return {
    open,
    activeIndex,
    items,
    toggle: () => setOpen(!open.get()),
    openMenu: () => setOpen(true),
    closeMenu: () => setOpen(false),
    registerItem: (item: MenuItem) => {
      items.set([...items.get(), item]);
    },
    unregisterItem: (id: string) => {
      items.set(items.get().filter(i => i.id !== id));
    },
    highlightIndex: (index: number) => activeIndex.set(index),
    selectCurrent: () => {
      const current = items.get()[activeIndex.get()];
      if (current && !current.disabled) {
        current.onSelect?.();
        setOpen(false);
      }
    },
    buttonProps: {
      id: `${menuId}-button`,
      'aria-haspopup': 'menu',
      'aria-expanded': () => open.get(),
      'aria-controls': open.get() ? menuId : undefined,
      onClick: () => setOpen(!open.get()),
      onKeyDown: handleKeyDown,
    },
    itemsProps: {
      id: menuId,
      role: 'menu',
      'aria-orientation': orientation,
      'aria-labelledby': `${menuId}-button`,
      hidden: () => !open.get(),
      onKeyDown: handleKeyDown,
      tabIndex: -1,
    },
    getItemProps: (item: MenuItem, index: number) => ({
      id: item.id,
      role: 'menuitem',
      'aria-disabled': item.disabled,
      tabIndex: activeIndex.get() === index ? 0 : -1,
      'data-highlighted': activeIndex.get() === index,
      'data-disabled': item.disabled,
      onClick: () => {
        if (!item.disabled) {
          item.onSelect?.();
          setOpen(false);
        }
      },
      onMouseEnter: () => activeIndex.set(index),
      onMouseLeave: () => activeIndex.set(-1),
    }),
  };
}

// ============================================================================
// Listbox / Select
// ============================================================================

export interface ListboxOptions<T> {
  /** Default selected value */
  defaultValue?: T;
  /** Controlled value */
  value?: Signal<T | null>;
  /** Callback when value changes */
  onValueChange?: (value: T | null) => void;
  /** Multiple selection */
  multiple?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Orientation */
  orientation?: Orientation;
}

export interface ListboxOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface Listbox<T> {
  /** Selected value(s) */
  value: Signal<T | null>;
  /** Open state */
  open: Signal<boolean>;
  /** Active index */
  activeIndex: Signal<number>;
  /** Registered options */
  options: Signal<ListboxOption<T>[]>;
  /** Select a value */
  select: (value: T) => void;
  /** Toggle open state */
  toggle: () => void;
  /** Register an option */
  registerOption: (option: ListboxOption<T>) => void;
  /** Props for trigger button */
  buttonProps: HeadlessProps;
  /** Props for options container */
  optionsProps: HeadlessProps;
  /** Get props for an option */
  getOptionProps: (option: ListboxOption<T>, index: number) => HeadlessProps;
  /** Display value */
  displayValue: Computed<string>;
}

export function createListbox<T>(options: ListboxOptions<T> = {}): Listbox<T> {
  const {
    defaultValue,
    value: controlledValue,
    onValueChange,
    multiple = false,
    disabled = false,
    orientation = 'vertical',
  } = options;

  const value = controlledValue ?? signal<T | null>(defaultValue ?? null);
  const open = signal(false);
  const activeIndex = signal(0);
  const registeredOptions = signal<ListboxOption<T>[]>([]);
  const listboxId = `listbox-${Math.random().toString(36).slice(2)}`;

  const select = (newValue: T) => {
    value.set(newValue);
    onValueChange?.(newValue);
    if (!multiple) {
      open.set(false);
    }
  };

  const displayValue = computed(() => {
    const current = value.get();
    if (current === null) return '';
    const option = registeredOptions.get().find(o => o.value === current);
    return option?.label ?? String(current);
  });

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    const opts = registeredOptions.get();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open.get()) {
          open.set(true);
        } else {
          activeIndex.set(Math.min(activeIndex.get() + 1, opts.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open.get()) {
          activeIndex.set(Math.max(activeIndex.get() - 1, 0));
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open.get()) {
          const opt = opts[activeIndex.get()];
          if (opt && !opt.disabled) {
            select(opt.value);
          }
        } else {
          open.set(true);
        }
        break;
      case 'Escape':
        open.set(false);
        break;
      case 'Home':
        e.preventDefault();
        activeIndex.set(0);
        break;
      case 'End':
        e.preventDefault();
        activeIndex.set(opts.length - 1);
        break;
    }
  };

  return {
    value,
    open,
    activeIndex,
    options: registeredOptions,
    select,
    toggle: () => open.set(!open.get()),
    registerOption: (option: ListboxOption<T>) => {
      registeredOptions.set([...registeredOptions.get(), option]);
    },
    displayValue,
    buttonProps: {
      id: `${listboxId}-button`,
      role: 'combobox',
      'aria-haspopup': 'listbox',
      'aria-expanded': () => open.get(),
      'aria-controls': listboxId,
      'aria-disabled': disabled,
      tabIndex: disabled ? -1 : 0,
      onClick: () => !disabled && open.set(!open.get()),
      onKeyDown: handleKeyDown,
    },
    optionsProps: {
      id: listboxId,
      role: 'listbox',
      'aria-orientation': orientation,
      hidden: () => !open.get(),
      tabIndex: -1,
    },
    getOptionProps: (option: ListboxOption<T>, index: number) => ({
      role: 'option',
      'aria-selected': () => value.get() === option.value,
      'aria-disabled': option.disabled,
      'data-highlighted': () => activeIndex.get() === index,
      'data-selected': () => value.get() === option.value,
      tabIndex: -1,
      onClick: () => !option.disabled && select(option.value),
      onMouseEnter: () => activeIndex.set(index),
    }),
  };
}

// ============================================================================
// Combobox / Autocomplete
// ============================================================================

export interface ComboboxOptions<T> {
  /** Default value */
  defaultValue?: T;
  /** Controlled value */
  value?: Signal<T | null>;
  /** Callback when value changes */
  onValueChange?: (value: T | null) => void;
  /** Input value */
  inputValue?: Signal<string>;
  /** Callback when input changes */
  onInputChange?: (value: string) => void;
  /** Filter function */
  filter?: (option: T, inputValue: string) => boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Allow free-form input */
  freeform?: boolean;
}

export interface ComboboxOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface Combobox<T> {
  /** Selected value */
  value: Signal<T | null>;
  /** Input value */
  inputValue: Signal<string>;
  /** Open state */
  open: Signal<boolean>;
  /** Active index */
  activeIndex: Signal<number>;
  /** Filtered options */
  filteredOptions: Computed<ComboboxOption<T>[]>;
  /** Register option */
  registerOption: (option: ComboboxOption<T>) => void;
  /** Select value */
  select: (value: T) => void;
  /** Clear value */
  clear: () => void;
  /** Props for input */
  inputProps: HeadlessProps;
  /** Props for trigger button */
  buttonProps: HeadlessProps;
  /** Props for options container */
  optionsProps: HeadlessProps;
  /** Get props for option */
  getOptionProps: (option: ComboboxOption<T>, index: number) => HeadlessProps;
}

export function createCombobox<T>(options: ComboboxOptions<T> = {}): Combobox<T> {
  const {
    defaultValue,
    value: controlledValue,
    onValueChange,
    inputValue: controlledInputValue,
    onInputChange,
    filter = (option, input) => String(option).toLowerCase().includes(input.toLowerCase()),
    disabled = false,
    freeform = false,
  } = options;

  const value = controlledValue ?? signal<T | null>(defaultValue ?? null);
  const inputValue = controlledInputValue ?? signal('');
  const open = signal(false);
  const activeIndex = signal(0);
  const registeredOptions = signal<ComboboxOption<T>[]>([]);
  const comboboxId = `combobox-${Math.random().toString(36).slice(2)}`;

  const filteredOptions = computed(() => {
    const input = inputValue.get();
    if (!input) return registeredOptions.get();
    return registeredOptions.get().filter(opt =>
      opt.label.toLowerCase().includes(input.toLowerCase())
    );
  });

  const select = (newValue: T) => {
    value.set(newValue);
    onValueChange?.(newValue);
    const option = registeredOptions.get().find(o => o.value === newValue);
    if (option) {
      inputValue.set(option.label);
      onInputChange?.(option.label);
    }
    open.set(false);
  };

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    inputValue.set(target.value);
    onInputChange?.(target.value);
    open.set(true);
    activeIndex.set(0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const opts = filteredOptions.get();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open.get()) {
          open.set(true);
        } else {
          activeIndex.set(Math.min(activeIndex.get() + 1, opts.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex.set(Math.max(activeIndex.get() - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (open.get()) {
          const opt = opts[activeIndex.get()];
          if (opt && !opt.disabled) {
            select(opt.value);
          } else if (freeform && inputValue.get()) {
            value.set(inputValue.get() as unknown as T);
            open.set(false);
          }
        }
        break;
      case 'Escape':
        open.set(false);
        break;
    }
  };

  return {
    value,
    inputValue,
    open,
    activeIndex,
    filteredOptions,
    registerOption: (option) => {
      registeredOptions.set([...registeredOptions.get(), option]);
    },
    select,
    clear: () => {
      value.set(null);
      inputValue.set('');
      onValueChange?.(null);
      onInputChange?.('');
    },
    inputProps: {
      id: `${comboboxId}-input`,
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-haspopup': 'listbox',
      'aria-expanded': () => open.get(),
      'aria-controls': comboboxId,
      'aria-disabled': disabled,
      value: () => inputValue.get(),
      onInput: handleInputChange,
      onKeyDown: handleKeyDown,
      onFocus: () => open.set(true),
      onBlur: () => setTimeout(() => open.set(false), 150),
    },
    buttonProps: {
      tabIndex: -1,
      'aria-label': 'Toggle options',
      onClick: () => !disabled && open.set(!open.get()),
    },
    optionsProps: {
      id: comboboxId,
      role: 'listbox',
      hidden: () => !open.get(),
    },
    getOptionProps: (option, index) => ({
      role: 'option',
      'aria-selected': () => value.get() === option.value,
      'aria-disabled': option.disabled,
      'data-highlighted': () => activeIndex.get() === index,
      onClick: () => !option.disabled && select(option.value),
      onMouseEnter: () => activeIndex.set(index),
    }),
  };
}

// ============================================================================
// Tabs
// ============================================================================

export interface TabsOptions {
  /** Default selected tab */
  defaultValue?: string;
  /** Controlled value */
  value?: Signal<string>;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Orientation */
  orientation?: Orientation;
  /** Activation mode */
  activationMode?: 'automatic' | 'manual';
  /** Loop keyboard navigation */
  loop?: boolean;
}

export interface Tab {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface Tabs {
  /** Selected tab value */
  value: Signal<string>;
  /** Registered tabs */
  tabs: Signal<Tab[]>;
  /** Select a tab */
  select: (value: string) => void;
  /** Register a tab */
  registerTab: (tab: Tab) => void;
  /** Props for tab list */
  listProps: HeadlessProps;
  /** Get props for a tab trigger */
  getTriggerProps: (tab: Tab, index: number) => HeadlessProps;
  /** Get props for a tab panel */
  getPanelProps: (value: string) => HeadlessProps;
}

export function createTabs(options: TabsOptions = {}): Tabs {
  const {
    defaultValue = '',
    value: controlledValue,
    onValueChange,
    orientation = 'horizontal',
    activationMode = 'automatic',
    loop = true,
  } = options;

  const value = controlledValue ?? signal(defaultValue);
  const tabs = signal<Tab[]>([]);
  const focusedIndex = signal(0);
  const tabsId = `tabs-${Math.random().toString(36).slice(2)}`;

  const select = (newValue: string) => {
    value.set(newValue);
    onValueChange?.(newValue);
  };

  const navigateTabs = (direction: 1 | -1) => {
    const tabList = tabs.get();
    let next = focusedIndex.get() + direction;

    // Skip disabled tabs
    while (next >= 0 && next < tabList.length && tabList[next]?.disabled) {
      next += direction;
    }

    if (loop) {
      if (next < 0) next = tabList.length - 1;
      if (next >= tabList.length) next = 0;
    }

    next = Math.max(0, Math.min(tabList.length - 1, next));
    focusedIndex.set(next);

    if (activationMode === 'automatic') {
      const tab = tabList[next];
      if (tab && !tab.disabled) {
        select(tab.value);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const isHorizontal = orientation === 'horizontal';

    switch (e.key) {
      case isHorizontal ? 'ArrowRight' : 'ArrowDown':
        e.preventDefault();
        navigateTabs(1);
        break;
      case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
        e.preventDefault();
        navigateTabs(-1);
        break;
      case 'Home':
        e.preventDefault();
        focusedIndex.set(0);
        if (activationMode === 'automatic') {
          const tab = tabs.get()[0];
          if (tab && !tab.disabled) select(tab.value);
        }
        break;
      case 'End':
        e.preventDefault();
        focusedIndex.set(tabs.get().length - 1);
        if (activationMode === 'automatic') {
          const tab = tabs.get()[tabs.get().length - 1];
          if (tab && !tab.disabled) select(tab.value);
        }
        break;
    }
  };

  return {
    value,
    tabs,
    select,
    registerTab: (tab) => tabs.set([...tabs.get(), tab]),
    listProps: {
      role: 'tablist',
      'aria-orientation': orientation,
      onKeyDown: handleKeyDown,
    },
    getTriggerProps: (tab, index) => ({
      id: `${tabsId}-trigger-${tab.value}`,
      role: 'tab',
      'aria-selected': () => value.get() === tab.value,
      'aria-controls': `${tabsId}-panel-${tab.value}`,
      'aria-disabled': tab.disabled,
      tabIndex: () => value.get() === tab.value ? 0 : -1,
      'data-state': () => value.get() === tab.value ? 'active' : 'inactive',
      onClick: () => !tab.disabled && select(tab.value),
      onFocus: () => focusedIndex.set(index),
    }),
    getPanelProps: (panelValue) => ({
      id: `${tabsId}-panel-${panelValue}`,
      role: 'tabpanel',
      'aria-labelledby': `${tabsId}-trigger-${panelValue}`,
      tabIndex: 0,
      hidden: () => value.get() !== panelValue,
      'data-state': () => value.get() === panelValue ? 'active' : 'inactive',
    }),
  };
}

// ============================================================================
// Switch / Toggle
// ============================================================================

export interface SwitchOptions {
  /** Default checked state */
  defaultChecked?: boolean;
  /** Controlled checked state */
  checked?: Signal<boolean>;
  /** Callback when checked changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Required state */
  required?: boolean;
  /** Name for form submission */
  name?: string;
  /** Value for form submission */
  value?: string;
}

export interface Switch {
  /** Checked state */
  checked: Signal<boolean>;
  /** Toggle the switch */
  toggle: () => void;
  /** Set checked state */
  setChecked: (checked: boolean) => void;
  /** Props for the switch root */
  rootProps: HeadlessProps;
  /** Props for the thumb */
  thumbProps: HeadlessProps;
  /** Props for hidden input */
  inputProps: HeadlessProps;
}

export function createSwitch(options: SwitchOptions = {}): Switch {
  const {
    defaultChecked = false,
    checked: controlledChecked,
    onCheckedChange,
    disabled = false,
    required = false,
    name,
    value = 'on',
  } = options;

  const checked = controlledChecked ?? signal(defaultChecked);

  const setChecked = (newValue: boolean) => {
    checked.set(newValue);
    onCheckedChange?.(newValue);
  };

  const toggle = () => setChecked(!checked.get());

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled) toggle();
    }
  };

  return {
    checked,
    toggle,
    setChecked,
    rootProps: {
      role: 'switch',
      'aria-checked': () => checked.get(),
      'aria-disabled': disabled,
      'aria-required': required,
      tabIndex: disabled ? -1 : 0,
      'data-state': () => checked.get() ? 'checked' : 'unchecked',
      'data-disabled': disabled ? '' : undefined,
      onClick: () => !disabled && toggle(),
      onKeyDown: handleKeyDown,
    },
    thumbProps: {
      'data-state': () => checked.get() ? 'checked' : 'unchecked',
      'data-disabled': disabled ? '' : undefined,
    },
    inputProps: {
      type: 'checkbox',
      name,
      value,
      checked: () => checked.get(),
      disabled,
      required,
      hidden: true,
      'aria-hidden': true,
    },
  };
}

// ============================================================================
// Disclosure / Accordion Item
// ============================================================================

export interface DisclosureOptions {
  /** Default open state */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: Signal<boolean>;
  /** Callback when open changes */
  onOpenChange?: (open: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
}

export interface Disclosure {
  /** Open state */
  open: Signal<boolean>;
  /** Toggle open state */
  toggle: () => void;
  /** Open the disclosure */
  openDisclosure: () => void;
  /** Close the disclosure */
  closeDisclosure: () => void;
  /** Props for the trigger button */
  buttonProps: HeadlessProps;
  /** Props for the panel */
  panelProps: HeadlessProps;
}

export function createDisclosure(options: DisclosureOptions = {}): Disclosure {
  const {
    defaultOpen = false,
    open: controlledOpen,
    onOpenChange,
    disabled = false,
  } = options;

  const open = controlledOpen ?? signal(defaultOpen);
  const panelId = `disclosure-panel-${Math.random().toString(36).slice(2)}`;

  const setOpen = (value: boolean) => {
    if (disabled) return;
    open.set(value);
    onOpenChange?.(value);
  };

  return {
    open,
    toggle: () => setOpen(!open.get()),
    openDisclosure: () => setOpen(true),
    closeDisclosure: () => setOpen(false),
    buttonProps: {
      'aria-expanded': () => open.get(),
      'aria-controls': panelId,
      'aria-disabled': disabled,
      'data-state': () => open.get() ? 'open' : 'closed',
      onClick: () => setOpen(!open.get()),
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen(!open.get());
        }
      },
    },
    panelProps: {
      id: panelId,
      hidden: () => !open.get(),
      'data-state': () => open.get() ? 'open' : 'closed',
    },
  };
}

// ============================================================================
// Accordion
// ============================================================================

export interface AccordionOptions {
  /** Default expanded items */
  defaultValue?: string[];
  /** Controlled value */
  value?: Signal<string[]>;
  /** Callback when value changes */
  onValueChange?: (value: string[]) => void;
  /** Allow multiple items open */
  type?: 'single' | 'multiple';
  /** Collapsible (single only) */
  collapsible?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Orientation */
  orientation?: Orientation;
}

export interface AccordionItem {
  value: string;
  disabled?: boolean;
}

export interface Accordion {
  /** Expanded items */
  value: Signal<string[]>;
  /** Check if item is expanded */
  isExpanded: (value: string) => Computed<boolean>;
  /** Toggle an item */
  toggle: (value: string) => void;
  /** Expand an item */
  expand: (value: string) => void;
  /** Collapse an item */
  collapse: (value: string) => void;
  /** Props for accordion root */
  rootProps: HeadlessProps;
  /** Get props for item trigger */
  getTriggerProps: (item: AccordionItem) => HeadlessProps;
  /** Get props for item panel */
  getPanelProps: (value: string) => HeadlessProps;
}

export function createAccordion(options: AccordionOptions = {}): Accordion {
  const {
    defaultValue = [],
    value: controlledValue,
    onValueChange,
    type = 'single',
    collapsible = false,
    disabled = false,
    orientation = 'vertical',
  } = options;

  const value = controlledValue ?? signal<string[]>(defaultValue);
  const accordionId = `accordion-${Math.random().toString(36).slice(2)}`;

  const setValue = (newValue: string[]) => {
    value.set(newValue);
    onValueChange?.(newValue);
  };

  const toggle = (itemValue: string) => {
    const current = value.get();
    const isExpanded = current.includes(itemValue);

    if (type === 'single') {
      if (isExpanded && collapsible) {
        setValue([]);
      } else if (!isExpanded) {
        setValue([itemValue]);
      }
    } else {
      if (isExpanded) {
        setValue(current.filter(v => v !== itemValue));
      } else {
        setValue([...current, itemValue]);
      }
    }
  };

  return {
    value,
    isExpanded: (itemValue) => computed(() => value.get().includes(itemValue)),
    toggle,
    expand: (itemValue) => {
      if (!value.get().includes(itemValue)) {
        if (type === 'single') {
          setValue([itemValue]);
        } else {
          setValue([...value.get(), itemValue]);
        }
      }
    },
    collapse: (itemValue) => {
      setValue(value.get().filter(v => v !== itemValue));
    },
    rootProps: {
      'data-orientation': orientation,
      'data-disabled': disabled ? '' : undefined,
    },
    getTriggerProps: (item) => ({
      id: `${accordionId}-trigger-${item.value}`,
      'aria-expanded': () => value.get().includes(item.value),
      'aria-controls': `${accordionId}-panel-${item.value}`,
      'aria-disabled': item.disabled || disabled,
      'data-state': () => value.get().includes(item.value) ? 'open' : 'closed',
      onClick: () => !(item.disabled || disabled) && toggle(item.value),
    }),
    getPanelProps: (itemValue) => ({
      id: `${accordionId}-panel-${itemValue}`,
      role: 'region',
      'aria-labelledby': `${accordionId}-trigger-${itemValue}`,
      hidden: () => !value.get().includes(itemValue),
      'data-state': () => value.get().includes(itemValue) ? 'open' : 'closed',
    }),
  };
}

// ============================================================================
// Radio Group
// ============================================================================

export interface RadioGroupOptions<T> {
  /** Default value */
  defaultValue?: T;
  /** Controlled value */
  value?: Signal<T | null>;
  /** Callback when value changes */
  onValueChange?: (value: T) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Required state */
  required?: boolean;
  /** Name for form submission */
  name?: string;
  /** Orientation */
  orientation?: Orientation;
  /** Loop navigation */
  loop?: boolean;
}

export interface RadioOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface RadioGroup<T> {
  /** Selected value */
  value: Signal<T | null>;
  /** Registered options */
  options: Signal<RadioOption<T>[]>;
  /** Select a value */
  select: (value: T) => void;
  /** Register an option */
  registerOption: (option: RadioOption<T>) => void;
  /** Props for the group root */
  rootProps: HeadlessProps;
  /** Get props for a radio option */
  getOptionProps: (option: RadioOption<T>, index: number) => HeadlessProps;
}

export function createRadioGroup<T>(options: RadioGroupOptions<T> = {}): RadioGroup<T> {
  const {
    defaultValue,
    value: controlledValue,
    onValueChange,
    disabled = false,
    required = false,
    name,
    orientation = 'vertical',
    loop = true,
  } = options;

  const value = controlledValue ?? signal<T | null>(defaultValue ?? null);
  const registeredOptions = signal<RadioOption<T>[]>([]);
  const focusedIndex = signal(-1);
  const groupId = `radio-group-${Math.random().toString(36).slice(2)}`;

  const select = (newValue: T) => {
    if (disabled) return;
    value.set(newValue);
    onValueChange?.(newValue);
  };

  const navigateOptions = (direction: 1 | -1) => {
    const opts = registeredOptions.get().filter(o => !o.disabled);
    let current = opts.findIndex(o => o.value === value.get());
    if (current === -1) current = 0;

    let next = current + direction;
    if (loop) {
      if (next < 0) next = opts.length - 1;
      if (next >= opts.length) next = 0;
    }
    next = Math.max(0, Math.min(opts.length - 1, next));

    const opt = opts[next];
    if (opt) {
      select(opt.value);
      focusedIndex.set(registeredOptions.get().indexOf(opt));
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const isHorizontal = orientation === 'horizontal';

    switch (e.key) {
      case isHorizontal ? 'ArrowRight' : 'ArrowDown':
        e.preventDefault();
        navigateOptions(1);
        break;
      case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
        e.preventDefault();
        navigateOptions(-1);
        break;
    }
  };

  return {
    value,
    options: registeredOptions,
    select,
    registerOption: (option) => registeredOptions.set([...registeredOptions.get(), option]),
    rootProps: {
      role: 'radiogroup',
      'aria-orientation': orientation,
      'aria-required': required,
      'aria-disabled': disabled,
      onKeyDown: handleKeyDown,
    },
    getOptionProps: (option, index) => ({
      id: `${groupId}-option-${index}`,
      role: 'radio',
      'aria-checked': () => value.get() === option.value,
      'aria-disabled': option.disabled || disabled,
      tabIndex: () => {
        const current = value.get();
        if (current === option.value) return 0;
        if (current === null && index === 0) return 0;
        return -1;
      },
      'data-state': () => value.get() === option.value ? 'checked' : 'unchecked',
      onClick: () => !(option.disabled || disabled) && select(option.value),
      onFocus: () => focusedIndex.set(index),
    }),
  };
}

// ============================================================================
// Checkbox
// ============================================================================

export interface CheckboxOptions {
  /** Default checked state */
  defaultChecked?: boolean | 'indeterminate';
  /** Controlled checked state */
  checked?: Signal<boolean | 'indeterminate'>;
  /** Callback when checked changes */
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  /** Disabled state */
  disabled?: boolean;
  /** Required state */
  required?: boolean;
  /** Name for form submission */
  name?: string;
  /** Value for form submission */
  value?: string;
}

export interface Checkbox {
  /** Checked state */
  checked: Signal<boolean | 'indeterminate'>;
  /** Toggle the checkbox */
  toggle: () => void;
  /** Set checked state */
  setChecked: (checked: boolean | 'indeterminate') => void;
  /** Is indeterminate */
  isIndeterminate: Computed<boolean>;
  /** Props for the checkbox root */
  rootProps: HeadlessProps;
  /** Props for the indicator */
  indicatorProps: HeadlessProps;
  /** Props for hidden input */
  inputProps: HeadlessProps;
}

export function createCheckbox(options: CheckboxOptions = {}): Checkbox {
  const {
    defaultChecked = false,
    checked: controlledChecked,
    onCheckedChange,
    disabled = false,
    required = false,
    name,
    value = 'on',
  } = options;

  const checked = controlledChecked ?? signal<boolean | 'indeterminate'>(defaultChecked);

  const setChecked = (newValue: boolean | 'indeterminate') => {
    checked.set(newValue);
    onCheckedChange?.(newValue);
  };

  const toggle = () => {
    const current = checked.get();
    if (current === 'indeterminate') {
      setChecked(true);
    } else {
      setChecked(!current);
    }
  };

  const isIndeterminate = computed(() => checked.get() === 'indeterminate');

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (!disabled) toggle();
    }
  };

  return {
    checked,
    toggle,
    setChecked,
    isIndeterminate,
    rootProps: {
      role: 'checkbox',
      'aria-checked': () => {
        const val = checked.get();
        return val === 'indeterminate' ? 'mixed' : val;
      },
      'aria-disabled': disabled,
      'aria-required': required,
      tabIndex: disabled ? -1 : 0,
      'data-state': () => {
        const val = checked.get();
        if (val === 'indeterminate') return 'indeterminate';
        return val ? 'checked' : 'unchecked';
      },
      onClick: () => !disabled && toggle(),
      onKeyDown: handleKeyDown,
    },
    indicatorProps: {
      'data-state': () => {
        const val = checked.get();
        if (val === 'indeterminate') return 'indeterminate';
        return val ? 'checked' : 'unchecked';
      },
    },
    inputProps: {
      type: 'checkbox',
      name,
      value,
      checked: () => checked.get() === true,
      disabled,
      required,
      hidden: true,
      'aria-hidden': true,
    },
  };
}

// ============================================================================
// Tooltip
// ============================================================================

export interface TooltipOptions {
  /** Default open state */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: Signal<boolean>;
  /** Callback when open changes */
  onOpenChange?: (open: boolean) => void;
  /** Delay before showing (ms) */
  delayDuration?: number;
  /** Skip delay when navigating between tooltips */
  skipDelayDuration?: number;
  /** Disabled state */
  disabled?: boolean;
}

export interface Tooltip {
  /** Open state */
  open: Signal<boolean>;
  /** Show the tooltip */
  show: () => void;
  /** Hide the tooltip */
  hide: () => void;
  /** Props for the trigger */
  triggerProps: HeadlessProps;
  /** Props for the content */
  contentProps: HeadlessProps;
}

let lastTooltipCloseTime = 0;

export function createTooltip(options: TooltipOptions = {}): Tooltip {
  const {
    defaultOpen = false,
    open: controlledOpen,
    onOpenChange,
    delayDuration = 700,
    skipDelayDuration = 300,
    disabled = false,
  } = options;

  const open = controlledOpen ?? signal(defaultOpen);
  const tooltipId = `tooltip-${Math.random().toString(36).slice(2)}`;
  let showTimeout: ReturnType<typeof setTimeout> | null = null;
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;

  const setOpen = (value: boolean) => {
    if (disabled) return;
    open.set(value);
    onOpenChange?.(value);
    if (!value) {
      lastTooltipCloseTime = Date.now();
    }
  };

  const show = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    const timeSinceLastClose = Date.now() - lastTooltipCloseTime;
    const delay = timeSinceLastClose < skipDelayDuration ? 0 : delayDuration;

    showTimeout = setTimeout(() => setOpen(true), delay);
  };

  const hide = () => {
    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }

    hideTimeout = setTimeout(() => setOpen(false), 0);
  };

  return {
    open,
    show: () => !disabled && show(),
    hide,
    triggerProps: {
      'aria-describedby': () => open.get() ? tooltipId : undefined,
      onMouseEnter: () => !disabled && show(),
      onMouseLeave: hide,
      onFocus: () => !disabled && show(),
      onBlur: hide,
    },
    contentProps: {
      id: tooltipId,
      role: 'tooltip',
      hidden: () => !open.get(),
      onMouseEnter: () => {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
      },
      onMouseLeave: hide,
    },
  };
}

// ============================================================================
// Popover
// ============================================================================

export interface PopoverOptions {
  /** Default open state */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: Signal<boolean>;
  /** Callback when open changes */
  onOpenChange?: (open: boolean) => void;
  /** Modal mode */
  modal?: boolean;
}

export interface Popover {
  /** Open state */
  open: Signal<boolean>;
  /** Toggle popover */
  toggle: () => void;
  /** Open popover */
  openPopover: () => void;
  /** Close popover */
  closePopover: () => void;
  /** Props for trigger */
  triggerProps: HeadlessProps;
  /** Props for content */
  contentProps: HeadlessProps;
  /** Props for close button */
  closeProps: HeadlessProps;
}

export function createPopover(options: PopoverOptions = {}): Popover {
  const {
    defaultOpen = false,
    open: controlledOpen,
    onOpenChange,
    modal = false,
  } = options;

  const open = controlledOpen ?? signal(defaultOpen);
  const popoverId = `popover-${Math.random().toString(36).slice(2)}`;

  const setOpen = (value: boolean) => {
    open.set(value);
    onOpenChange?.(value);
  };

  return {
    open,
    toggle: () => setOpen(!open.get()),
    openPopover: () => setOpen(true),
    closePopover: () => setOpen(false),
    triggerProps: {
      'aria-haspopup': 'dialog',
      'aria-expanded': () => open.get(),
      'aria-controls': () => open.get() ? popoverId : undefined,
      onClick: () => setOpen(!open.get()),
    },
    contentProps: {
      id: popoverId,
      role: 'dialog',
      'aria-modal': modal,
      hidden: () => !open.get(),
      tabIndex: -1,
    },
    closeProps: {
      onClick: () => setOpen(false),
      'aria-label': 'Close',
    },
  };
}

// ============================================================================
// Slider
// ============================================================================

export interface SliderOptions {
  /** Default value */
  defaultValue?: number[];
  /** Controlled value */
  value?: Signal<number[]>;
  /** Callback when value changes */
  onValueChange?: (value: number[]) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step */
  step?: number;
  /** Orientation */
  orientation?: Orientation;
  /** Disabled state */
  disabled?: boolean;
}

export interface Slider {
  /** Current value(s) */
  value: Signal<number[]>;
  /** Set value at index */
  setValue: (index: number, newValue: number) => void;
  /** Percentage for each thumb */
  getPercentage: (index: number) => Computed<number>;
  /** Props for root */
  rootProps: HeadlessProps;
  /** Props for track */
  trackProps: HeadlessProps;
  /** Props for range */
  rangeProps: HeadlessProps;
  /** Get props for thumb */
  getThumbProps: (index: number) => HeadlessProps;
}

export function createSlider(options: SliderOptions = {}): Slider {
  const {
    defaultValue = [0],
    value: controlledValue,
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    orientation = 'horizontal',
    disabled = false,
  } = options;

  const value = controlledValue ?? signal<number[]>(defaultValue);
  const sliderId = `slider-${Math.random().toString(36).slice(2)}`;

  const clamp = (val: number) => Math.min(max, Math.max(min, val));
  const snap = (val: number) => Math.round(val / step) * step;

  const setValue = (index: number, newValue: number) => {
    if (disabled) return;
    const values = [...value.get()];
    values[index] = clamp(snap(newValue));
    value.set(values);
    onValueChange?.(values);
  };

  const getPercentage = (index: number) => computed(() => {
    const val = value.get()[index] ?? min;
    return ((val - min) / (max - min)) * 100;
  });

  const handleKeyDown = (index: number) => (e: KeyboardEvent) => {
    if (disabled) return;
    const currentValue = value.get()[index] ?? min;
    const isHorizontal = orientation === 'horizontal';

    switch (e.key) {
      case isHorizontal ? 'ArrowRight' : 'ArrowUp':
        e.preventDefault();
        setValue(index, currentValue + step);
        break;
      case isHorizontal ? 'ArrowLeft' : 'ArrowDown':
        e.preventDefault();
        setValue(index, currentValue - step);
        break;
      case 'Home':
        e.preventDefault();
        setValue(index, min);
        break;
      case 'End':
        e.preventDefault();
        setValue(index, max);
        break;
      case 'PageUp':
        e.preventDefault();
        setValue(index, currentValue + step * 10);
        break;
      case 'PageDown':
        e.preventDefault();
        setValue(index, currentValue - step * 10);
        break;
    }
  };

  return {
    value,
    setValue,
    getPercentage,
    rootProps: {
      'data-orientation': orientation,
      'data-disabled': disabled ? '' : undefined,
    },
    trackProps: {
      'data-orientation': orientation,
    },
    rangeProps: {
      'data-orientation': orientation,
    },
    getThumbProps: (index) => ({
      id: `${sliderId}-thumb-${index}`,
      role: 'slider',
      'aria-valuemin': min,
      'aria-valuemax': max,
      'aria-valuenow': () => value.get()[index],
      'aria-orientation': orientation,
      'aria-disabled': disabled,
      tabIndex: disabled ? -1 : 0,
      onKeyDown: handleKeyDown(index),
    }),
  };
}

// ============================================================================
// Progress
// ============================================================================

export interface ProgressOptions {
  /** Current value */
  value?: Signal<number | null>;
  /** Maximum value */
  max?: number;
  /** Label for accessibility */
  getValueLabel?: (value: number, max: number) => string;
}

export interface Progress {
  /** Current value */
  value: Signal<number | null>;
  /** Maximum value */
  max: number;
  /** Percentage complete */
  percentage: Computed<number | null>;
  /** Props for root */
  rootProps: HeadlessProps;
  /** Props for indicator */
  indicatorProps: HeadlessProps;
}

export function createProgress(options: ProgressOptions = {}): Progress {
  const {
    value: controlledValue,
    max = 100,
    getValueLabel = (value, max) => `${Math.round((value / max) * 100)}%`,
  } = options;

  const value = controlledValue ?? signal<number | null>(null);

  const percentage = computed(() => {
    const val = value.get();
    if (val === null) return null;
    return (val / max) * 100;
  });

  const state = computed(() => {
    const val = value.get();
    if (val === null) return 'indeterminate';
    if (val >= max) return 'complete';
    return 'loading';
  });

  return {
    value,
    max,
    percentage,
    rootProps: {
      role: 'progressbar',
      'aria-valuenow': () => value.get(),
      'aria-valuemin': 0,
      'aria-valuemax': max,
      'aria-valuetext': () => {
        const val = value.get();
        return val !== null ? getValueLabel(val, max) : undefined;
      },
      'data-state': () => state.get(),
      'data-value': () => value.get(),
      'data-max': max,
    },
    indicatorProps: {
      'data-state': () => state.get(),
      'data-value': () => value.get(),
      'data-max': max,
    },
  };
}

// ============================================================================
// Avatar
// ============================================================================

export interface AvatarOptions {
  /** Image source */
  src?: string;
  /** Alt text */
  alt?: string;
  /** Fallback delay (ms) */
  delayMs?: number;
}

export interface Avatar {
  /** Loading state */
  status: Signal<'idle' | 'loading' | 'loaded' | 'error'>;
  /** Props for image */
  imageProps: HeadlessProps;
  /** Props for fallback */
  fallbackProps: HeadlessProps;
}

export function createAvatar(options: AvatarOptions = {}): Avatar {
  const { src, alt, delayMs = 0 } = options;

  const status = signal<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  if (src && typeof window !== 'undefined') {
    status.set('loading');

    const img = new Image();
    img.src = src;
    img.onload = () => status.set('loaded');
    img.onerror = () => status.set('error');
  }

  return {
    status,
    imageProps: {
      src,
      alt,
      hidden: () => status.get() !== 'loaded',
    },
    fallbackProps: {
      hidden: () => {
        const s = status.get();
        if (s === 'loaded') return true;
        if (delayMs > 0 && s === 'loading') return true;
        return false;
      },
    },
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  createMenu as Menu,
  createListbox as Listbox,
  createCombobox as Combobox,
  createRadioGroup as RadioGroup,
  createDialog as Dialog,
  createTabs as Tabs,
  createSwitch as Switch,
  createDisclosure as Disclosure,
  createAccordion as Accordion,
  createCheckbox as Checkbox,
  createTooltip as Tooltip,
  createPopover as Popover,
  createSlider as Slider,
  createProgress as Progress,
  createAvatar as Avatar,
};
