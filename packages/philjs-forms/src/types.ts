/**
 * Core form types for PhilJS Forms
 */

export type FieldValue = string | number | boolean | File | File[] | null | undefined;

export type FormValues = Record<string, FieldValue>;

export type FieldError = string | null;

export type FormErrors<T extends FormValues = FormValues> = {
  [K in keyof T]?: FieldError;
};

export type TouchedFields<T extends FormValues = FormValues> = {
  [K in keyof T]?: boolean;
};

export interface ValidationRule<T = FieldValue> {
  validate: (value: T, values?: FormValues) => boolean | Promise<boolean>;
  message: string;
}

export interface FieldConfig<T = FieldValue> {
  initialValue?: T;
  required?: boolean | string;
  validate?: ValidationRule<T> | ValidationRule<T>[];
  validateOn?: 'change' | 'blur' | 'submit';
  transform?: (value: T) => T;
  disabled?: boolean;
}

export interface FormConfig<T extends FormValues = FormValues> {
  initialValues?: Partial<T>;
  validateOn?: 'change' | 'blur' | 'submit';
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnMount?: boolean;
}

export interface FieldState<T = FieldValue> {
  value: T;
  error: FieldError;
  touched: boolean;
  dirty: boolean;
  validating: boolean;
}

export interface FormState<T extends FormValues = FormValues> {
  values: T;
  errors: FormErrors<T>;
  touched: TouchedFields<T>;
  isValid: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
  submitCount: number;
}
