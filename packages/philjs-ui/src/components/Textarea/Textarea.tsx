/**
 * PhilJS UI - Textarea Component
 *
 * Multi-line text input with auto-resize support.
 */

import type { JSX } from '@philjs/core/jsx-runtime';
import { cn } from '../../utils/cn.js';
import { variants, type VariantProps } from '../../utils/variants.js';
import { useId } from '../../hooks/useId.js';

const textareaVariants = variants({
  base: `
    w-full outline-none transition-colors duration-150
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
    placeholder:text-gray-400 dark:placeholder:text-gray-500
  `,
  variants: {
    size: {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    },
    variant: {
      outline: 'border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
      filled: 'border-0 bg-gray-100 dark:bg-gray-700 rounded-md focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500',
      flushed: 'border-0 border-b-2 border-gray-300 dark:border-gray-600 rounded-none bg-transparent focus:border-blue-500',
      unstyled: 'border-0 bg-transparent',
    },
    resize: {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    },
    isInvalid: {
      true: '',
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline',
    resize: 'vertical',
    isInvalid: false,
  },
  compoundVariants: [
    { variant: 'outline', isInvalid: true, class: 'border-red-500 focus:border-red-500 focus:ring-red-500' },
    { variant: 'filled', isInvalid: true, class: 'bg-red-50 dark:bg-red-900/20 focus:ring-red-500' },
    { variant: 'flushed', isInvalid: true, class: 'border-red-500 focus:border-red-500' },
  ],
});

export type TextareaSize = 'sm' | 'md' | 'lg';
export type TextareaVariant = 'outline' | 'filled' | 'flushed' | 'unstyled';
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export interface TextareaProps extends VariantProps<typeof textareaVariants> {
  /** Placeholder text */
  placeholder?: string;
  /** Controlled value */
  value?: string;
  /** Default value for uncontrolled usage */
  defaultValue?: string;
  /** Whether textarea is disabled */
  disabled?: boolean;
  /** Whether textarea is read-only */
  readOnly?: boolean;
  /** Whether textarea is required */
  required?: boolean;
  /** Error state or error message */
  error?: boolean | string;
  /** Helper text shown below textarea */
  helperText?: string;
  /** Label text */
  label?: string;
  /** Textarea ID */
  id?: string;
  /** Textarea name */
  name?: string;
  /** Number of visible rows */
  rows?: number;
  /** Minimum number of rows (for auto-resize) */
  minRows?: number;
  /** Maximum number of rows (for auto-resize) */
  maxRows?: number;
  /** Input event handler */
  onInput?: (e: Event) => void;
  /** Change event handler */
  onChange?: (e: Event) => void;
  /** Focus event handler */
  onFocus?: (e: FocusEvent) => void;
  /** Blur event handler */
  onBlur?: (e: FocusEvent) => void;
  /** Container class */
  className?: string;
  /** Textarea element class */
  textareaClassName?: string;
  /** ARIA label */
  'aria-label'?: string;
  /** ARIA describedby */
  'aria-describedby'?: string;
  /** Maximum length */
  maxLength?: number;
  /** Show character count */
  showCount?: boolean;
  /** Test ID */
  'data-testid'?: string;
}

/**
 * Textarea component for multi-line text input.
 *
 * @example
 * ```tsx
 * // Basic textarea
 * <Textarea placeholder="Enter your message" rows={4} />
 *
 * // With character count
 * <Textarea
 *   label="Bio"
 *   maxLength={500}
 *   showCount
 *   helperText="Tell us about yourself"
 * />
 *
 * // With validation
 * <Textarea
 *   label="Description"
 *   required
 *   error={errors.description}
 * />
 * ```
 */
export function Textarea(props: TextareaProps): JSX.Element {
  const {
    placeholder,
    value,
    defaultValue,
    size,
    variant,
    resize,
    disabled = false,
    readOnly = false,
    required = false,
    error = false,
    helperText,
    label,
    id: providedId,
    name,
    rows = 4,
    onInput,
    onChange,
    onFocus,
    onBlur,
    className,
    textareaClassName,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    maxLength,
    showCount = false,
    'data-testid': testId,
  } = props;

  const generatedId = useId('textarea');
  const textareaId = providedId || generatedId;
  const helperId = `${textareaId}-helper`;
  const errorId = `${textareaId}-error`;
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  const textareaClasses = cn(
    textareaVariants({ size, variant, resize, isInvalid: hasError }),
    textareaClassName
  );

  const describedBy = [
    ariaDescribedBy,
    helperText && !hasError && helperId,
    errorMessage && errorId,
  ].filter(Boolean).join(' ') || undefined;

  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className={cn('w-full', className)} data-testid={testId}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        rows={rows}
        onInput={onInput}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        className={textareaClasses}
        aria-label={ariaLabel || (label ? undefined : placeholder)}
        aria-invalid={hasError}
        aria-required={required}
        aria-describedby={describedBy}
        maxLength={maxLength}
      />

      <div className="flex justify-between mt-1.5">
        <div>
          {helperText && !hasError && (
            <p id={helperId} className="text-sm text-gray-500 dark:text-gray-400">
              {helperText}
            </p>
          )}
          {errorMessage && (
            <p id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
              {errorMessage}
            </p>
          )}
        </div>

        {showCount && maxLength && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

export default Textarea;
