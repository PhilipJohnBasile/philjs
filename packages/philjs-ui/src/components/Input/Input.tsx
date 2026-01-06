/**
 * PhilJS UI - Input Component
 *
 * Text input field with variants, validation, and accessibility features.
 */

import type { JSX } from '@philjs/core/jsx-runtime';
import { cn } from '../../utils/cn.js';
import { variants, type VariantProps } from '../../utils/variants.js';
import { useId } from '../../hooks/useId.js';

const inputVariants = variants({
  base: `
    w-full outline-none transition-colors duration-150
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
    placeholder:text-gray-400 dark:placeholder:text-gray-500
  `,
  variants: {
    size: {
      xs: 'h-7 px-2.5 text-xs',
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-5 text-lg',
      xl: 'h-14 px-6 text-xl',
    },
    variant: {
      outline: 'border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
      filled: 'border-0 bg-gray-100 dark:bg-gray-700 rounded-md focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500',
      flushed: 'border-0 border-b-2 border-gray-300 dark:border-gray-600 rounded-none bg-transparent focus:border-blue-500',
      unstyled: 'border-0 bg-transparent',
    },
    isInvalid: {
      true: '',
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline',
    isInvalid: false,
  },
  compoundVariants: [
    { variant: 'outline', isInvalid: true, class: 'border-red-500 focus:border-red-500 focus:ring-red-500' },
    { variant: 'filled', isInvalid: true, class: 'bg-red-50 dark:bg-red-900/20 focus:ring-red-500' },
    { variant: 'flushed', isInvalid: true, class: 'border-red-500 focus:border-red-500' },
  ],
});

export type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type InputVariant = 'outline' | 'filled' | 'flushed' | 'unstyled';

export interface InputProps extends VariantProps<typeof inputVariants> {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
  /** Placeholder text */
  placeholder?: string;
  /** Controlled value */
  value?: string;
  /** Default value for uncontrolled usage */
  defaultValue?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether input is read-only */
  readOnly?: boolean;
  /** Whether input is required */
  required?: boolean;
  /** Error state or error message */
  error?: boolean | string;
  /** Helper text shown below input */
  helperText?: string;
  /** Label text */
  label?: string;
  /** Input ID */
  id?: string;
  /** Input name */
  name?: string;
  /** Left addon element */
  leftElement?: JSX.Element;
  /** Right addon element */
  rightElement?: JSX.Element;
  /** Left addon text */
  leftAddon?: string;
  /** Right addon text */
  rightAddon?: string;
  /** Input event handler */
  onInput?: (e: Event) => void;
  /** Change event handler */
  onChange?: (e: Event) => void;
  /** Focus event handler */
  onFocus?: (e: FocusEvent) => void;
  /** Blur event handler */
  onBlur?: (e: FocusEvent) => void;
  /** Keydown event handler */
  onKeyDown?: (e: KeyboardEvent) => void;
  /** Container class */
  className?: string;
  /** Input element class */
  inputClassName?: string;
  /** ARIA label */
  'aria-label'?: string;
  /** ARIA describedby */
  'aria-describedby'?: string;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Autofocus on mount */
  autoFocus?: boolean;
  /** Maximum length */
  maxLength?: number;
  /** Minimum length */
  minLength?: number;
  /** Validation pattern */
  pattern?: string;
  /** Minimum value (for number inputs) */
  min?: number | string;
  /** Maximum value (for number inputs) */
  max?: number | string;
  /** Step value (for number inputs) */
  step?: number | string;
  /** Test ID */
  'data-testid'?: string;
}

/**
 * Input component for text entry.
 *
 * @example
 * ```tsx
 * // Basic input
 * <Input placeholder="Enter your name" />
 *
 * // With label and validation
 * <Input
 *   label="Email"
 *   type="email"
 *   required
 *   error={!isValidEmail && "Please enter a valid email"}
 * />
 *
 * // With addons
 * <Input
 *   leftAddon="https://"
 *   rightElement={<Icon name="globe" />}
 *   placeholder="example.com"
 * />
 * ```
 */
export function Input(props: InputProps): JSX.Element {
  const {
    type = 'text',
    placeholder,
    value,
    defaultValue,
    size,
    variant,
    disabled = false,
    readOnly = false,
    required = false,
    error = false,
    helperText,
    label,
    id: providedId,
    name,
    leftElement,
    rightElement,
    leftAddon,
    rightAddon,
    onInput,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    className,
    inputClassName,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    autoComplete,
    autoFocus,
    maxLength,
    minLength,
    pattern,
    min,
    max,
    step,
    'data-testid': testId,
  } = props;

  const generatedId = useId('input');
  const inputId = providedId || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  const inputClasses = cn(
    inputVariants({ size, variant, isInvalid: hasError }),
    leftElement && 'pl-10',
    rightElement && 'pr-10',
    leftAddon && 'rounded-l-none',
    rightAddon && 'rounded-r-none',
    inputClassName
  );

  const describedBy = [
    ariaDescribedBy,
    helperText && !hasError && helperId,
    errorMessage && errorId,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('w-full', className)} data-testid={testId}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="flex">
        {leftAddon && (
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
            {leftAddon}
          </span>
        )}

        <div className="relative flex-1">
          {leftElement && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
              {leftElement}
            </div>
          )}

          <input
            type={type}
            id={inputId}
            name={name}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            onInput={onInput}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className={inputClasses}
            aria-label={ariaLabel || (label ? undefined : placeholder)}
            aria-invalid={hasError}
            aria-required={required}
            aria-describedby={describedBy}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            maxLength={maxLength}
            minLength={minLength}
            pattern={pattern}
            min={min}
            max={max}
            step={step}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400">
              {rightElement}
            </div>
          )}
        </div>

        {rightAddon && (
          <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
            {rightAddon}
          </span>
        )}
      </div>

      {helperText && !hasError && (
        <p id={helperId} className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}

      {errorMessage && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default Input;
