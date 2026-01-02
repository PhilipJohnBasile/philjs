/**
 * Form management with reactive signals
 */

import { signal, memo, batch, type Signal, type Memo } from '@philjs/core/signals';
import type {
  FormValues,
  FormErrors,
  TouchedFields,
  FormConfig,
  FormState,
  FieldError,
  ValidationRule
} from './types.js';

export class Form<T extends FormValues = FormValues> {
  private valuesSignal: Signal<T>;
  private errorsSignal: Signal<FormErrors<T>>;
  private touchedSignal: Signal<TouchedFields<T>>;
  private isSubmittingSignal: Signal<boolean>;
  private isValidatingSignal: Signal<boolean>;
  private submitCountSignal: Signal<number>;
  private initialValues: T;
  private config: FormConfig<T>;
  private isValidMemo: Memo<boolean>;
  private isDirtyMemo: Memo<boolean>;

  constructor(config: FormConfig<T> = {}) {
    this.config = config;
    this.initialValues = (config.initialValues || {}) as T;

    this.valuesSignal = signal<T>(this.initialValues);
    this.errorsSignal = signal<FormErrors<T>>({});
    this.touchedSignal = signal<TouchedFields<T>>({});
    this.isSubmittingSignal = signal(false);
    this.isValidatingSignal = signal(false);
    this.submitCountSignal = signal(0);
    this.isValidMemo = memo(() => {
      const errors = this.errorsSignal();
      return Object.values(errors).every(error => !error);
    });
    this.isDirtyMemo = memo(() => {
      const current = this.valuesSignal();
      return JSON.stringify(current) !== JSON.stringify(this.initialValues);
    });

    if (config.validateOnMount) {
      this.validate();
    }
  }

  /**
   * Get form values as signal
   */
  get values(): Signal<T> {
    return this.valuesSignal;
  }

  /**
   * Get form errors as signal
   */
  get errors(): Signal<FormErrors<T>> {
    return this.errorsSignal;
  }

  /**
   * Get touched fields as signal
   */
  get touched(): Signal<TouchedFields<T>> {
    return this.touchedSignal;
  }

  /**
   * Computed: is form valid
   */
  isValid() {
    return this.isValidMemo;
  }

  /**
   * Computed: is form dirty (has changes)
   */
  isDirty() {
    return this.isDirtyMemo;
  }

  /**
   * Get submitting state
   */
  isSubmitting(): Signal<boolean> {
    return this.isSubmittingSignal;
  }

  /**
   * Get validating state
   */
  isValidating(): Signal<boolean> {
    return this.isValidatingSignal;
  }

  /**
   * Get submit count
   */
  submitCount(): Signal<number> {
    return this.submitCountSignal;
  }

  /**
   * Get complete form state
   */
  get state(): Memo<FormState<T>> {
    return memo(() => ({
      values: this.valuesSignal(),
      errors: this.errorsSignal(),
      touched: this.touchedSignal(),
      isValid: this.isValid()(),
      isSubmitting: this.isSubmittingSignal(),
      isValidating: this.isValidatingSignal(),
      isDirty: this.isDirty()(),
      submitCount: this.submitCountSignal()
    }));
  }

  /**
   * Set field value
   */
  setFieldValue<K extends keyof T>(name: K, value: T[K]): void {
    const current = this.valuesSignal();
    this.valuesSignal.set({ ...current, [name]: value });

    if (this.config.validateOn === 'change') {
      this.validateField(name);
    }
  }

  /**
   * Set multiple field values
   */
  setValues(values: Partial<T>): void {
    const current = this.valuesSignal();
    this.valuesSignal.set({ ...current, ...values });

    if (this.config.validateOn === 'change') {
      this.validate();
    }
  }

  /**
   * Set field error
   */
  setFieldError<K extends keyof T>(name: K, error: FieldError): void {
    const current = this.errorsSignal();
    this.errorsSignal.set({ ...current, [name]: error });
  }

  /**
   * Set multiple errors
   */
  setErrors(errors: FormErrors<T>): void {
    this.errorsSignal.set(errors);
  }

  /**
   * Mark field as touched
   */
  setFieldTouched<K extends keyof T>(name: K, touched = true): void {
    const current = this.touchedSignal();
    this.touchedSignal.set({ ...current, [name]: touched });

    if (touched && this.config.validateOn === 'blur') {
      this.validateField(name);
    }
  }

  /**
   * Mark all fields as touched
   */
  setTouched(touched: TouchedFields<T>): void {
    this.touchedSignal.set(touched);
  }

  /**
   * Reset form to initial values
   */
  reset(): void {
    batch(() => {
      this.valuesSignal.set(this.initialValues);
      this.errorsSignal.set({});
      this.touchedSignal.set({});
      this.isSubmittingSignal.set(false);
      this.isValidatingSignal.set(false);
      this.submitCountSignal.set(0);
    });
  }

  /**
   * Reset to new values
   */
  resetWith(values: Partial<T>): void {
    this.initialValues = { ...this.initialValues, ...values };
    this.reset();
  }

  /**
   * Validate a single field
   */
  async validateField<K extends keyof T>(name: K): Promise<FieldError> {
    // Override in subclass or use validation rules
    return null;
  }

  /**
   * Validate entire form
   */
  async validate(): Promise<FormErrors<T>> {
    this.isValidatingSignal.set(true);

    const errors: FormErrors<T> = {};
    const values = this.valuesSignal();

    for (const name in values) {
      const error = await this.validateField(name);
      if (error) {
        errors[name] = error;
      }
    }

    this.errorsSignal.set(errors);
    this.isValidatingSignal.set(false);

    return errors;
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e?: Event): Promise<void> {
    if (e) {
      e.preventDefault();
    }

    // Mark all fields as touched
    const values = this.valuesSignal();
    const touched: TouchedFields<T> = {};
    for (const name in values) {
      touched[name] = true;
    }
    this.setTouched(touched);

    this.isSubmittingSignal.set(true);
    try {
      // Validate
      const errors = await this.validate();
      const hasErrors = Object.values(errors).some(error => error);

      if (hasErrors) {
        return;
      }

      // Submit
      this.submitCountSignal.set(this.submitCountSignal() + 1);

      if (this.config.onSubmit) {
        try {
          await this.config.onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
          throw error;
        }
      }
    } finally {
      this.isSubmittingSignal.set(false);
    }
  }

  /**
   * Get field props for binding
   */
  getFieldProps<K extends keyof T>(name: K) {
    return {
      name: String(name),
      value: memo(() => this.valuesSignal()[name]),
      error: memo(() => this.errorsSignal()[name]),
      touched: memo(() => this.touchedSignal()[name]),
      onChange: (value: T[K]) => this.setFieldValue(name, value),
      onBlur: () => this.setFieldTouched(name, true)
    };
  }
}

/**
 * Create a form instance
 */
export function createForm<T extends FormValues = FormValues>(
  config?: FormConfig<T>
): Form<T> {
  return new Form(config);
}

/**
 * Hook-like function to use a form
 */
export function useForm<T extends FormValues = FormValues>(
  config?: FormConfig<T>
) {
  const form = new Form(config);

  return {
    values: form.values,
    errors: form.errors,
    touched: form.touched,
    isValid: form.isValid.bind(form),
    isDirty: form.isDirty.bind(form),
    isSubmitting: form.isSubmitting.bind(form),
    isValidating: form.isValidating.bind(form),
    submitCount: form.submitCount.bind(form),
    state: form.state,
    setFieldValue: form.setFieldValue.bind(form),
    setValues: form.setValues.bind(form),
    setFieldError: form.setFieldError.bind(form),
    setErrors: form.setErrors.bind(form),
    setFieldTouched: form.setFieldTouched.bind(form),
    setTouched: form.setTouched.bind(form),
    reset: form.reset.bind(form),
    resetWith: form.resetWith.bind(form),
    validate: form.validate.bind(form),
    validateField: form.validateField.bind(form),
    handleSubmit: form.handleSubmit.bind(form),
    getFieldProps: form.getFieldProps.bind(form)
  };
}
