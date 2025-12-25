/**
 * PhilJS UI - Combobox Component
 *
 * Accessible autocomplete/combobox with search, keyboard navigation,
 * and virtual scrolling support for large lists.
 */

import { signal, effect, memo } from 'philjs-core';

export interface ComboboxOption<T = string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: any;
  group?: string;
}

export type ComboboxSize = 'sm' | 'md' | 'lg';

export interface ComboboxProps<T = string> {
  options: ComboboxOption<T>[];
  value?: T;
  defaultValue?: T;
  placeholder?: string;
  searchPlaceholder?: string;
  size?: ComboboxSize;
  disabled?: boolean;
  required?: boolean;
  error?: boolean | string;
  helperText?: string;
  label?: string;
  emptyMessage?: string;
  loading?: boolean;
  creatable?: boolean;
  clearable?: boolean;
  virtualize?: boolean;
  maxHeight?: number;
  filterFn?: (option: ComboboxOption<T>, search: string) => boolean;
  onChange?: (value: T | undefined) => void;
  onSearch?: (search: string) => void;
  onCreate?: (value: string) => void;
  className?: string;
  'aria-label'?: string;
}

const sizeStyles: Record<ComboboxSize, { input: string; option: string; icon: string }> = {
  sm: { input: 'h-8 px-3 text-sm', option: 'px-2 py-1.5 text-sm', icon: 'h-4 w-4' },
  md: { input: 'h-10 px-4 text-base', option: 'px-3 py-2', icon: 'h-5 w-5' },
  lg: { input: 'h-12 px-5 text-lg', option: 'px-4 py-3 text-lg', icon: 'h-6 w-6' },
};

export function Combobox<T = string>(props: ComboboxProps<T>) {
  const {
    options,
    value,
    defaultValue,
    placeholder = 'Select option...',
    searchPlaceholder = 'Search...',
    size = 'md',
    disabled = false,
    required = false,
    error = false,
    helperText,
    label,
    emptyMessage = 'No results found.',
    loading = false,
    creatable = false,
    clearable = true,
    virtualize = false,
    maxHeight = 300,
    filterFn,
    onChange,
    onSearch,
    onCreate,
    className = '',
    'aria-label': ariaLabel,
  } = props;

  const isOpen = signal(false);
  const search = signal('');
  const highlightedIndex = signal(0);
  const selectedValue = signal<T | undefined>(value ?? defaultValue);
  const inputRef = signal<HTMLInputElement | null>(null);
  const listRef = signal<HTMLDivElement | null>(null);

  // Sync external value
  effect(() => {
    if (value !== undefined) {
      selectedValue.set(value);
    }
  });

  // Default filter function
  const defaultFilter = (option: ComboboxOption<T>, searchText: string): boolean => {
    const lowerSearch = searchText.toLowerCase();
    return (
      option.label.toLowerCase().includes(lowerSearch) ||
      (option.description?.toLowerCase().includes(lowerSearch) ?? false)
    );
  };

  const filter = filterFn || defaultFilter;

  // Filtered options
  const filteredOptions = memo(() => {
    const searchText = search();
    if (!searchText) return options;
    return options.filter(opt => filter(opt, searchText));
  });

  // Group options
  const groupedOptions = memo(() => {
    const filtered = filteredOptions();
    const groups = new Map<string, ComboboxOption<T>[]>();
    const ungrouped: ComboboxOption<T>[] = [];

    filtered.forEach(opt => {
      if (opt.group) {
        const group = groups.get(opt.group) || [];
        group.push(opt);
        groups.set(opt.group, group);
      } else {
        ungrouped.push(opt);
      }
    });

    return { groups, ungrouped };
  });

  // Selected option label
  const selectedLabel = memo(() => {
    const val = selectedValue();
    if (val === undefined) return '';
    const option = options.find(o => o.value === val);
    return option?.label ?? String(val);
  });

  const handleOpen = () => {
    if (!disabled) {
      isOpen.set(true);
      search.set('');
      highlightedIndex.set(0);
      setTimeout(() => inputRef()?.focus(), 0);
    }
  };

  const handleClose = () => {
    isOpen.set(false);
    search.set('');
  };

  const handleSelect = (option: ComboboxOption<T>) => {
    if (option.disabled) return;
    selectedValue.set(option.value);
    onChange?.(option.value);
    handleClose();
  };

  const handleClear = (e: Event) => {
    e.stopPropagation();
    selectedValue.set(undefined);
    onChange?.(undefined);
  };

  const handleCreate = () => {
    const searchText = search();
    if (creatable && searchText && onCreate) {
      onCreate(searchText);
      handleClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const filtered = filteredOptions();
    const currentIndex = highlightedIndex();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        highlightedIndex.set(Math.min(currentIndex + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        highlightedIndex.set(Math.max(currentIndex - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[currentIndex]) {
          handleSelect(filtered[currentIndex]);
        } else if (creatable && search()) {
          handleCreate();
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'Home':
        e.preventDefault();
        highlightedIndex.set(0);
        break;
      case 'End':
        e.preventDefault();
        highlightedIndex.set(filtered.length - 1);
        break;
    }
  };

  const handleSearchChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    search.set(target.value);
    highlightedIndex.set(0);
    onSearch?.(target.value);
  };

  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;
  const styles = sizeStyles[size];

  const renderOption = (option: ComboboxOption<T>, index: number) => {
    const isHighlighted = highlightedIndex() === index;
    const isSelected = selectedValue() === option.value;

    return (
      <div
        key={String(option.value)}
        role="option"
        aria-selected={isSelected}
        aria-disabled={option.disabled}
        className={`
          ${styles.option}
          cursor-pointer flex items-center gap-2
          ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isHighlighted ? 'bg-blue-50' : ''}
          ${isSelected ? 'bg-blue-100 font-medium' : ''}
          hover:bg-gray-100
        `}
        onClick={() => handleSelect(option)}
        onMouseEnter={() => highlightedIndex.set(index)}
      >
        {option.icon && <span className={styles.icon}>{option.icon}</span>}
        <div className="flex-1 min-w-0">
          <div className="truncate">{option.label}</div>
          {option.description && (
            <div className="text-xs text-gray-500 truncate">{option.description}</div>
          )}
        </div>
        {isSelected && (
          <svg className={`${styles.icon} text-blue-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={isOpen()}
        aria-haspopup="listbox"
        aria-label={ariaLabel || label}
        className={`
          ${styles.input}
          w-full border rounded-md bg-white
          flex items-center gap-2 cursor-pointer
          ${hasError ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400'}
          focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
        `}
        onClick={handleOpen}
      >
        <span className={`flex-1 truncate ${selectedValue() === undefined ? 'text-gray-400' : ''}`}>
          {selectedLabel() || placeholder}
        </span>

        {clearable && selectedValue() !== undefined && !disabled && (
          <button
            type="button"
            className="p-1 hover:bg-gray-100 rounded"
            onClick={handleClear}
            aria-label="Clear selection"
          >
            <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        <svg className={`${styles.icon} text-gray-400`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen() && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
          />

          {/* Popover */}
          <div
            className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-100">
              <input
                ref={(el: HTMLInputElement) => inputRef.set(el)}
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={searchPlaceholder}
                value={search()}
                onInput={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Options List */}
            <div
              ref={(el: HTMLDivElement) => listRef.set(el)}
              role="listbox"
              className="overflow-auto"
              style={{ maxHeight: `${maxHeight - 60}px` }}
            >
              {loading && (
                <div className="px-4 py-8 text-center text-gray-500">
                  <svg className="animate-spin h-5 w-5 mx-auto mb-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </div>
              )}

              {!loading && filteredOptions().length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                  {creatable && search() && (
                    <button
                      type="button"
                      className="mt-2 block mx-auto text-blue-600 hover:underline"
                      onClick={handleCreate}
                    >
                      Create "{search()}"
                    </button>
                  )}
                </div>
              )}

              {!loading && (() => {
                const { groups, ungrouped } = groupedOptions();
                let globalIndex = 0;

                return (
                  <>
                    {ungrouped.map(opt => {
                      const idx = globalIndex++;
                      return renderOption(opt, idx);
                    })}

                    {Array.from(groups.entries()).map(([groupName, groupOptions]) => (
                      <div key={groupName}>
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                          {groupName}
                        </div>
                        {groupOptions.map(opt => {
                          const idx = globalIndex++;
                          return renderOption(opt, idx);
                        })}
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {helperText && !hasError && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}

      {errorMessage && (
        <p className="mt-1 text-sm text-red-600" role="alert">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * Multi-select Combobox variant
 */
export interface MultiComboboxProps<T = string> extends Omit<ComboboxProps<T>, 'value' | 'defaultValue' | 'onChange' | 'clearable'> {
  value?: T[];
  defaultValue?: T[];
  onChange?: (values: T[]) => void;
  maxSelections?: number;
}

export function MultiCombobox<T = string>(props: MultiComboboxProps<T>) {
  const {
    options,
    value = [],
    defaultValue = [],
    placeholder = 'Select options...',
    searchPlaceholder = 'Search...',
    size = 'md',
    disabled = false,
    error = false,
    label,
    emptyMessage = 'No results found.',
    maxSelections,
    filterFn,
    onChange,
    onSearch,
    className = '',
  } = props;

  const isOpen = signal(false);
  const search = signal('');
  const highlightedIndex = signal(0);
  const selectedValues = signal<T[]>(value.length > 0 ? value : defaultValue);
  const inputRef = signal<HTMLInputElement | null>(null);

  effect(() => {
    if (value.length > 0) {
      selectedValues.set(value);
    }
  });

  const defaultFilter = (option: ComboboxOption<T>, searchText: string): boolean => {
    return option.label.toLowerCase().includes(searchText.toLowerCase());
  };

  const filter = filterFn || defaultFilter;

  const filteredOptions = memo(() => {
    const searchText = search();
    if (!searchText) return options;
    return options.filter(opt => filter(opt, searchText));
  });

  const handleToggle = (option: ComboboxOption<T>) => {
    if (option.disabled) return;

    const current = selectedValues();
    const isSelected = current.includes(option.value);

    let newValues: T[];
    if (isSelected) {
      newValues = current.filter(v => v !== option.value);
    } else {
      if (maxSelections && current.length >= maxSelections) return;
      newValues = [...current, option.value];
    }

    selectedValues.set(newValues);
    onChange?.(newValues);
  };

  const removeValue = (val: T, e: Event) => {
    e.stopPropagation();
    const newValues = selectedValues().filter(v => v !== val);
    selectedValues.set(newValues);
    onChange?.(newValues);
  };

  const handleOpen = () => {
    if (!disabled) {
      isOpen.set(true);
      search.set('');
      setTimeout(() => inputRef()?.focus(), 0);
    }
  };

  const handleClose = () => {
    isOpen.set(false);
    search.set('');
  };

  const hasError = Boolean(error);
  const styles = sizeStyles[size];

  return (
    <div className={`w-full relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Trigger */}
      <div
        className={`
          min-h-10 w-full border rounded-md bg-white p-2
          flex flex-wrap gap-1 cursor-pointer
          ${hasError ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
        onClick={handleOpen}
      >
        {selectedValues().length === 0 && (
          <span className="text-gray-400 px-2 py-1">{placeholder}</span>
        )}

        {selectedValues().map(val => {
          const option = options.find(o => o.value === val);
          return (
            <span
              key={String(val)}
              className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm"
            >
              {option?.label ?? String(val)}
              {!disabled && (
                <button
                  type="button"
                  className="ml-1 hover:text-blue-600"
                  onClick={(e: any) => removeValue(val, e)}
                >
                  &times;
                </button>
              )}
            </span>
          );
        })}
      </div>

      {/* Dropdown */}
      {isOpen() && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                ref={(el: HTMLInputElement) => inputRef.set(el)}
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={searchPlaceholder}
                value={search()}
                onInput={(e: any) => {
                  search.set(e.target.value);
                  onSearch?.(e.target.value);
                }}
              />
            </div>

            <div className="overflow-auto max-h-60">
              {filteredOptions().length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">{emptyMessage}</div>
              )}

              {filteredOptions().map((option, idx) => {
                const isSelected = selectedValues().includes(option.value);
                const isHighlighted = highlightedIndex() === idx;

                return (
                  <div
                    key={String(option.value)}
                    className={`
                      ${styles.option}
                      cursor-pointer flex items-center gap-2
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      ${isHighlighted ? 'bg-blue-50' : ''}
                      hover:bg-gray-100
                    `}
                    onClick={() => handleToggle(option)}
                    onMouseEnter={() => highlightedIndex.set(idx)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={option.disabled}
                      readOnly
                      className="rounded border-gray-300"
                    />
                    <span className="flex-1">{option.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
