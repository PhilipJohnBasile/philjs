/**
 * PhilJS UI - Input Component
 */

import { JSX, signal } from 'philjs-core';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'outline' | 'filled' | 'flushed';

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  size?: InputSize;
  variant?: InputVariant;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: boolean | string;
  helperText?: string;
  label?: string;
  id?: string;
  name?: string;
  leftElement?: JSX.Element;
  rightElement?: JSX.Element;
  onInput?: (e: InputEvent) => void;
  onChange?: (e: Event) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  className?: string;
  inputClassName?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-5 text-lg',
};

const variantStyles: Record<InputVariant, { normal: string; error: string }> = {
  outline: {
    normal: 'border border-gray-300 rounded-md bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
    error: 'border border-red-500 rounded-md bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500',
  },
  filled: {
    normal: 'border-0 bg-gray-100 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500',
    error: 'border-0 bg-red-50 rounded-md focus:bg-white focus:ring-2 focus:ring-red-500',
  },
  flushed: {
    normal: 'border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-blue-500',
    error: 'border-0 border-b-2 border-red-500 rounded-none bg-transparent focus:border-red-500',
  },
};

export function Input(props: InputProps) {
  const {
    type = 'text',
    placeholder,
    value,
    defaultValue,
    size = 'md',
    variant = 'outline',
    disabled = false,
    readOnly = false,
    required = false,
    error = false,
    helperText,
    label,
    id,
    name,
    leftElement,
    rightElement,
    onInput,
    onChange,
    onFocus,
    onBlur,
    className = '',
    inputClassName = '',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    autoComplete,
    autoFocus,
    maxLength,
    minLength,
    pattern,
  } = props;

  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  const baseStyles = `
    w-full
    outline-none
    transition-colors duration-150
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
    placeholder:text-gray-400
  `.trim().replace(/\s+/g, ' ');

  const variantStyle = variantStyles[variant][hasError ? 'error' : 'normal'];

  const inputClasses = [
    baseStyles,
    sizeStyles[size],
    variantStyle,
    leftElement ? 'pl-10' : '',
    rightElement ? 'pr-10' : '',
    inputClassName,
  ].filter(Boolean).join(' ');

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftElement && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
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
          className={inputClasses}
          aria-label={ariaLabel || label}
          aria-invalid={hasError}
          aria-describedby={
            [ariaDescribedBy, helperText && helperId, errorMessage && errorId]
              .filter(Boolean)
              .join(' ') || undefined
          }
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
            {rightElement}
          </div>
        )}
      </div>

      {helperText && !hasError && (
        <p id={helperId} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}

      {errorMessage && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Textarea Component
 */
export interface TextareaProps extends Omit<InputProps, 'type' | 'leftElement' | 'rightElement'> {
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export function Textarea(props: TextareaProps) {
  const {
    placeholder,
    value,
    defaultValue,
    size = 'md',
    variant = 'outline',
    disabled = false,
    readOnly = false,
    required = false,
    error = false,
    helperText,
    label,
    id,
    name,
    rows = 4,
    resize = 'vertical',
    onInput,
    onChange,
    onFocus,
    onBlur,
    className = '',
    inputClassName = '',
    'aria-label': ariaLabel,
  } = props;

  const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  const paddingStyles: Record<InputSize, string> = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
  };

  const resizeStyles: Record<string, string> = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  const variantStyle = variantStyles[variant][hasError ? 'error' : 'normal'];

  const textareaClasses = [
    'w-full outline-none transition-colors duration-150',
    'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
    'placeholder:text-gray-400',
    paddingStyles[size],
    variantStyle,
    resizeStyles[resize],
    inputClassName,
  ].filter(Boolean).join(' ');

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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
        aria-label={ariaLabel || label}
        aria-invalid={hasError}
      />

      {helperText && !hasError && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}

      {errorMessage && (
        <p className="mt-1 text-sm text-red-600" role="alert">{errorMessage}</p>
      )}
    </div>
  );
}
