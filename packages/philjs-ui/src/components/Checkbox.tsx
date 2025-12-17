/**
 * PhilJS UI - Checkbox Component
 */

import { JSX, signal } from 'philjs-core';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: boolean | string;
  label?: string;
  description?: string;
  id?: string;
  name?: string;
  value?: string;
  size?: CheckboxSize;
  onChange?: (checked: boolean) => void;
  className?: string;
  'aria-label'?: string;
}

const sizeStyles: Record<CheckboxSize, { box: string; label: string }> = {
  sm: { box: 'h-4 w-4', label: 'text-sm' },
  md: { box: 'h-5 w-5', label: 'text-base' },
  lg: { box: 'h-6 w-6', label: 'text-lg' },
};

export function Checkbox(props: CheckboxProps) {
  const {
    checked,
    defaultChecked,
    indeterminate = false,
    disabled = false,
    required = false,
    error = false,
    label,
    description,
    id,
    name,
    value,
    size = 'md',
    onChange,
    className = '',
    'aria-label': ariaLabel,
  } = props;

  const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;
  const descriptionId = description ? `${checkboxId}-description` : undefined;
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    onChange?.(target.checked);
  };

  const checkboxClasses = [
    sizeStyles[size].box,
    'rounded border-2 transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
    hasError
      ? 'border-red-500 text-red-600'
      : 'border-gray-300 text-blue-600',
    disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer',
  ].join(' ');

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          id={checkboxId}
          name={name}
          value={value}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          onChange={handleChange}
          className={checkboxClasses}
          aria-label={ariaLabel || label}
          aria-invalid={hasError}
          aria-describedby={descriptionId}
          ref={(el: HTMLInputElement) => {
            if (el) el.indeterminate = indeterminate;
          }}
        />
      </div>

      {(label || description) && (
        <div className="ml-3">
          {label && (
            <label
              htmlFor={checkboxId}
              className={`${sizeStyles[size].label} font-medium ${
                disabled ? 'text-gray-400' : 'text-gray-700'
              } ${disabled ? '' : 'cursor-pointer'}`}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {description && (
            <p
              id={descriptionId}
              className="text-sm text-gray-500"
            >
              {description}
            </p>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Checkbox Group
 */
export interface CheckboxGroupProps {
  children: JSX.Element | JSX.Element[];
  label?: string;
  description?: string;
  required?: boolean;
  error?: boolean | string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function CheckboxGroup(props: CheckboxGroupProps) {
  const {
    children,
    label,
    description,
    required = false,
    error = false,
    orientation = 'vertical',
    className = '',
  } = props;

  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  return (
    <fieldset className={`${className}`} role="group">
      {label && (
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </legend>
      )}

      {description && (
        <p className="text-sm text-gray-500 mb-3">{description}</p>
      )}

      <div
        className={
          orientation === 'horizontal'
            ? 'flex flex-wrap gap-4'
            : 'flex flex-col gap-2'
        }
      >
        {children}
      </div>

      {errorMessage && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </fieldset>
  );
}
