/**
 * PhilJS UI - Select Component
 */

import { signal, effect } from 'philjs-core';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: SelectSize;
  disabled?: boolean;
  required?: boolean;
  error?: boolean | string;
  helperText?: string;
  label?: string;
  id?: string;
  name?: string;
  onChange?: (value: string) => void;
  className?: string;
  'aria-label'?: string;
}

const sizeStyles: Record<SelectSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-5 text-lg',
};

export function Select(props: SelectProps) {
  const {
    options,
    value,
    defaultValue,
    placeholder,
    size = 'md',
    disabled = false,
    required = false,
    error = false,
    helperText,
    label,
    id,
    name,
    onChange,
    className = '',
    'aria-label': ariaLabel,
  } = props;

  const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  const baseStyles = `
    w-full appearance-none
    border rounded-md bg-white
    outline-none
    transition-colors duration-150
    cursor-pointer
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
    pr-10
  `.trim().replace(/\s+/g, ' ');

  const borderStyle = hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
    : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  const selectClasses = [
    baseStyles,
    sizeStyles[size],
    borderStyle,
  ].join(' ');

  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    onChange?.(target.value);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          required={required}
          onChange={handleChange}
          className={selectClasses}
          aria-label={ariaLabel || label}
          aria-invalid={hasError}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

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
 * Multi-Select Component
 */
export interface MultiSelectProps extends Omit<SelectProps, 'value' | 'defaultValue' | 'onChange'> {
  value?: string[];
  defaultValue?: string[];
  onChange?: (values: string[]) => void;
  maxSelections?: number;
}

export function MultiSelect(props: MultiSelectProps) {
  const {
    options,
    value = [],
    placeholder,
    size = 'md',
    disabled = false,
    required = false,
    error = false,
    helperText,
    label,
    onChange,
    maxSelections,
    className = '',
  } = props;

  const selectedValues = signal<string[]>(value);
  const isOpen = signal(false);

  effect(() => {
    selectedValues.set(value);
  });

  const toggleOption = (optionValue: string) => {
    const current = selectedValues();
    let newValues: string[];

    if (current.includes(optionValue)) {
      newValues = current.filter(v => v !== optionValue);
    } else {
      if (maxSelections && current.length >= maxSelections) {
        return; // Max reached
      }
      newValues = [...current, optionValue];
    }

    selectedValues.set(newValues);
    onChange?.(newValues);
  };

  const removeValue = (optionValue: string) => {
    const newValues = selectedValues().filter(v => v !== optionValue);
    selectedValues.set(newValues);
    onChange?.(newValues);
  };

  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          className={`
            min-h-10 w-full border rounded-md bg-white p-2
            flex flex-wrap gap-1
            ${hasError ? 'border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onClick={() => !disabled && isOpen.set(!isOpen())}
        >
          {selectedValues().length === 0 && (
            <span className="text-gray-400">{placeholder}</span>
          )}

          {selectedValues().map(val => {
            const option = options.find(o => o.value === val);
            return (
              <span
                key={val}
                className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm"
              >
                {option?.label || val}
                <button
                  type="button"
                  className="ml-1 hover:text-blue-600"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    removeValue(val);
                  }}
                >
                  &times;
                </button>
              </span>
            );
          })}
        </div>

        {isOpen() && !disabled && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {options.map(option => (
              <div
                key={option.value}
                className={`
                  px-4 py-2 cursor-pointer
                  ${option.disabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}
                  ${selectedValues().includes(option.value) ? 'bg-blue-50' : ''}
                `}
                onClick={() => !option.disabled && toggleOption(option.value)}
              >
                <input
                  type="checkbox"
                  checked={selectedValues().includes(option.value)}
                  disabled={option.disabled}
                  readOnly
                  className="mr-2"
                />
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {helperText && !hasError && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}

      {errorMessage && (
        <p className="mt-1 text-sm text-red-600" role="alert">{errorMessage}</p>
      )}
    </div>
  );
}
