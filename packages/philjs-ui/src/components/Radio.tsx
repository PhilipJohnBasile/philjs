/**
 * PhilJS UI - Radio Component
 */

import { JSX, signal, createContext, useContext } from 'philjs-core';

export type RadioSize = 'sm' | 'md' | 'lg';

interface RadioContextValue {
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
  disabled: boolean;
  size: RadioSize;
}

const RadioContext = createContext<RadioContextValue | null>(null);

export interface RadioProps {
  value: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

const sizeStyles: Record<RadioSize, { radio: string; label: string }> = {
  sm: { radio: 'h-4 w-4', label: 'text-sm' },
  md: { radio: 'h-5 w-5', label: 'text-base' },
  lg: { radio: 'h-6 w-6', label: 'text-lg' },
};

export function Radio(props: RadioProps) {
  const {
    value,
    label,
    description,
    disabled: localDisabled,
    id,
    className = '',
    'aria-label': ariaLabel,
  } = props;

  const context = useContext(RadioContext);

  if (!context) {
    throw new Error('Radio must be used within a RadioGroup');
  }

  const { name, value: groupValue, onChange, disabled: groupDisabled, size } = context;
  const isDisabled = localDisabled ?? groupDisabled;
  const isChecked = groupValue === value;
  const radioId = id || `radio-${name}-${value}`;
  const descriptionId = description ? `${radioId}-description` : undefined;

  const handleChange = () => {
    if (!isDisabled) {
      onChange(value);
    }
  };

  const radioClasses = [
    sizeStyles[size].radio,
    'rounded-full border-2 transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
    'border-gray-300 text-blue-600',
    isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer',
  ].join(' ');

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          type="radio"
          id={radioId}
          name={name}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={handleChange}
          className={radioClasses}
          aria-label={ariaLabel || label}
          aria-describedby={descriptionId}
        />
      </div>

      {(label || description) && (
        <div className="ml-3">
          {label && (
            <label
              htmlFor={radioId}
              className={`${sizeStyles[size].label} font-medium ${
                isDisabled ? 'text-gray-400' : 'text-gray-700'
              } ${isDisabled ? '' : 'cursor-pointer'}`}
            >
              {label}
            </label>
          )}
          {description && (
            <p id={descriptionId} className="text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Radio Group
 */
export interface RadioGroupProps {
  name: string;
  value?: string;
  defaultValue?: string;
  children: JSX.Element | JSX.Element[];
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean | string;
  size?: RadioSize;
  orientation?: 'horizontal' | 'vertical';
  onChange?: (value: string) => void;
  className?: string;
}

export function RadioGroup(props: RadioGroupProps) {
  const {
    name,
    value,
    defaultValue,
    children,
    label,
    description,
    required = false,
    disabled = false,
    error = false,
    size = 'md',
    orientation = 'vertical',
    onChange,
    className = '',
  } = props;

  const internalValue = signal(value ?? defaultValue ?? '');
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  const handleChange = (newValue: string) => {
    internalValue.set(newValue);
    onChange?.(newValue);
  };

  const contextValue: RadioContextValue = {
    name,
    value: value ?? internalValue.get(),
    onChange: handleChange,
    disabled,
    size,
  };

  return (
    <RadioContext.Provider value={contextValue}>
      <fieldset
        className={`${className}`}
        role="radiogroup"
        aria-required={required}
        aria-invalid={hasError}
      >
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
    </RadioContext.Provider>
  );
}
