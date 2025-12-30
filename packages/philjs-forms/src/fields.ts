/**
 * Field Components for PhilJS Forms
 *
 * A collection of form field components that work with the Form class.
 * These provide consistent styling, validation, and accessibility features.
 */

import type { FieldValue, FieldConfig, FieldState } from './types.js';

// =============================================================================
// Types
// =============================================================================

export interface BaseFieldProps<T = FieldValue> {
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  'aria-describedby'?: string;
  value?: T;
  error?: string | null;
  touched?: boolean;
  onChange?: (value: T) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export interface TextFieldProps extends BaseFieldProps<string> {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}

export interface TextAreaFieldProps extends BaseFieldProps<string> {
  rows?: number;
  cols?: number;
  minLength?: number;
  maxLength?: number;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

export interface SelectFieldProps extends BaseFieldProps<string | string[]> {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  multiple?: boolean;
  size?: number;
}

export interface CheckboxFieldProps extends BaseFieldProps<boolean> {
  indeterminate?: boolean;
}

export interface RadioFieldProps extends BaseFieldProps<string> {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  inline?: boolean;
}

export interface FileFieldProps extends BaseFieldProps<File | File[] | null> {
  accept?: string;
  multiple?: boolean;
  capture?: 'user' | 'environment';
}

export interface NumberFieldProps extends BaseFieldProps<number | null> {
  min?: number;
  max?: number;
  step?: number;
}

// =============================================================================
// Field Component Factories
// =============================================================================

/**
 * Create a text input field configuration
 */
export function TextField(props: TextFieldProps): {
  type: 'text';
  props: TextFieldProps;
  render: () => { tag: 'input'; attributes: Record<string, unknown> };
} {
  const {
    name,
    label,
    type = 'text',
    placeholder,
    disabled,
    required,
    className,
    id,
    value,
    error,
    touched,
    onChange,
    onBlur,
    onFocus,
    minLength,
    maxLength,
    pattern,
    autoComplete,
    autoFocus,
  } = props;

  return {
    type: 'text',
    props,
    render: () => ({
      tag: 'input',
      attributes: {
        type,
        name,
        id: id ?? name,
        placeholder,
        disabled,
        required,
        className,
        value,
        minLength,
        maxLength,
        pattern,
        autoComplete,
        autoFocus,
        'aria-invalid': touched && error ? 'true' : undefined,
        'aria-describedby': props['aria-describedby'],
      },
    }),
  };
}

/**
 * Create a textarea field configuration
 */
export function TextAreaField(props: TextAreaFieldProps): {
  type: 'textarea';
  props: TextAreaFieldProps;
  render: () => { tag: 'textarea'; attributes: Record<string, unknown> };
} {
  const {
    name,
    id,
    placeholder,
    disabled,
    required,
    className,
    value,
    error,
    touched,
    rows,
    cols,
    minLength,
    maxLength,
  } = props;

  return {
    type: 'textarea',
    props,
    render: () => ({
      tag: 'textarea',
      attributes: {
        name,
        id: id ?? name,
        placeholder,
        disabled,
        required,
        className,
        value,
        rows,
        cols,
        minLength,
        maxLength,
        'aria-invalid': touched && error ? 'true' : undefined,
        'aria-describedby': props['aria-describedby'],
      },
    }),
  };
}

/**
 * Create a select field configuration
 */
export function SelectField(props: SelectFieldProps): {
  type: 'select';
  props: SelectFieldProps;
  render: () => { tag: 'select'; attributes: Record<string, unknown>; options: SelectFieldProps['options'] };
} {
  const {
    name,
    id,
    disabled,
    required,
    className,
    value,
    error,
    touched,
    options,
    multiple,
    size,
  } = props;

  return {
    type: 'select',
    props,
    render: () => ({
      tag: 'select',
      attributes: {
        name,
        id: id ?? name,
        disabled,
        required,
        className,
        value,
        multiple,
        size,
        'aria-invalid': touched && error ? 'true' : undefined,
        'aria-describedby': props['aria-describedby'],
      },
      options,
    }),
  };
}

/**
 * Create a checkbox field configuration
 */
export function CheckboxField(props: CheckboxFieldProps): {
  type: 'checkbox';
  props: CheckboxFieldProps;
  render: () => { tag: 'input'; attributes: Record<string, unknown> };
} {
  const {
    name,
    id,
    disabled,
    required,
    className,
    value,
    error,
    touched,
    indeterminate,
  } = props;

  return {
    type: 'checkbox',
    props,
    render: () => ({
      tag: 'input',
      attributes: {
        type: 'checkbox',
        name,
        id: id ?? name,
        disabled,
        required,
        className,
        checked: value,
        'aria-invalid': touched && error ? 'true' : undefined,
        'aria-describedby': props['aria-describedby'],
        'data-indeterminate': indeterminate ? 'true' : undefined,
      },
    }),
  };
}

/**
 * Create a radio field configuration
 */
export function RadioField(props: RadioFieldProps): {
  type: 'radio';
  props: RadioFieldProps;
  render: () => { tag: 'fieldset'; options: RadioFieldProps['options']; attributes: Record<string, unknown> };
} {
  const {
    name,
    id,
    disabled,
    required,
    className,
    value,
    error,
    touched,
    options,
    inline,
  } = props;

  return {
    type: 'radio',
    props,
    render: () => ({
      tag: 'fieldset',
      options,
      attributes: {
        name,
        id: id ?? name,
        disabled,
        required,
        className,
        'data-inline': inline ? 'true' : undefined,
        'data-value': value,
        'aria-invalid': touched && error ? 'true' : undefined,
        'aria-describedby': props['aria-describedby'],
      },
    }),
  };
}

/**
 * Create a file input field configuration
 */
export function FileField(props: FileFieldProps): {
  type: 'file';
  props: FileFieldProps;
  render: () => { tag: 'input'; attributes: Record<string, unknown> };
} {
  const {
    name,
    id,
    disabled,
    required,
    className,
    error,
    touched,
    accept,
    multiple,
    capture,
  } = props;

  return {
    type: 'file',
    props,
    render: () => ({
      tag: 'input',
      attributes: {
        type: 'file',
        name,
        id: id ?? name,
        disabled,
        required,
        className,
        accept,
        multiple,
        capture,
        'aria-invalid': touched && error ? 'true' : undefined,
        'aria-describedby': props['aria-describedby'],
      },
    }),
  };
}

/**
 * Create a number input field configuration
 */
export function NumberField(props: NumberFieldProps): {
  type: 'number';
  props: NumberFieldProps;
  render: () => { tag: 'input'; attributes: Record<string, unknown> };
} {
  const {
    name,
    id,
    placeholder,
    disabled,
    required,
    className,
    value,
    error,
    touched,
    min,
    max,
    step,
  } = props;

  return {
    type: 'number',
    props,
    render: () => ({
      tag: 'input',
      attributes: {
        type: 'number',
        name,
        id: id ?? name,
        placeholder,
        disabled,
        required,
        className,
        value: value ?? '',
        min,
        max,
        step,
        'aria-invalid': touched && error ? 'true' : undefined,
        'aria-describedby': props['aria-describedby'],
      },
    }),
  };
}

// =============================================================================
// Generic Field Factory
// =============================================================================

export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'number';

export type FieldProps =
  | TextFieldProps
  | TextAreaFieldProps
  | SelectFieldProps
  | CheckboxFieldProps
  | RadioFieldProps
  | FileFieldProps
  | NumberFieldProps;

/**
 * Generic field factory that creates the appropriate field type
 */
export function Field(
  type: 'text',
  props: TextFieldProps
): ReturnType<typeof TextField>;
export function Field(
  type: 'textarea',
  props: TextAreaFieldProps
): ReturnType<typeof TextAreaField>;
export function Field(
  type: 'select',
  props: SelectFieldProps
): ReturnType<typeof SelectField>;
export function Field(
  type: 'checkbox',
  props: CheckboxFieldProps
): ReturnType<typeof CheckboxField>;
export function Field(
  type: 'radio',
  props: RadioFieldProps
): ReturnType<typeof RadioField>;
export function Field(
  type: 'file',
  props: FileFieldProps
): ReturnType<typeof FileField>;
export function Field(
  type: 'number',
  props: NumberFieldProps
): ReturnType<typeof NumberField>;
export function Field(type: FieldType, props: FieldProps): unknown {
  switch (type) {
    case 'text':
      return TextField(props as TextFieldProps);
    case 'textarea':
      return TextAreaField(props as TextAreaFieldProps);
    case 'select':
      return SelectField(props as SelectFieldProps);
    case 'checkbox':
      return CheckboxField(props as CheckboxFieldProps);
    case 'radio':
      return RadioField(props as RadioFieldProps);
    case 'file':
      return FileField(props as FileFieldProps);
    case 'number':
      return NumberField(props as NumberFieldProps);
    default:
      throw new Error(`Unknown field type: ${type}`);
  }
}
