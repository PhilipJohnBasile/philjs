/**
 * Form validation system with progressive enhancement.
 * Type-safe validation with schema builder.
 */

import { signal, type Signal } from "./signals.js";

// ============================================================================
// Schema Definition
// ============================================================================

export type ValidationRule<T = any> = {
  validate: (value: T) => boolean | Promise<boolean>;
  message: string | ((value: T) => string);
};

export type FieldSchema<T = any> = {
  type: "string" | "number" | "boolean" | "date" | "email" | "url" | "custom";
  required?: boolean;
  rules?: ValidationRule<T>[];
  transform?: (value: any) => T;
  defaultValue?: T;
};

export type FormSchema<T extends Record<string, any>> = {
  [K in keyof T]: FieldSchema<T[K]>;
};

export type ValidationError = {
  field: string;
  message: string;
};

export type FormState<T> = {
  values: T;
  errors: Record<keyof T, string[]>;
  touched: Record<keyof T, boolean>;
  dirty: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
};

// ============================================================================
// Schema Builder API
// ============================================================================

class Schema<T> {
  constructor(private config: FieldSchema<T>) {}

  required(message?: string): Schema<T> {
    this.config.required = true;
    if (message) {
      this.config.rules = this.config.rules || [];
      this.config.rules.unshift({
        validate: (val) => val != null && val !== "",
        message,
      });
    }
    return this;
  }

  min(min: number, message?: string): Schema<T> {
    this.config.rules = this.config.rules || [];
    this.config.rules.push({
      validate: (val) => {
        if (typeof val === "string" || Array.isArray(val)) return val.length >= min;
        if (typeof val === "number") return val >= min;
        return false;
      },
      message: message || ((val) => {
        if (typeof val === "string") return `Must be at least ${min} characters`;
        if (typeof val === "number") return `Must be at least ${min}`;
        return `Must have at least ${min} items`;
      }),
    });
    return this;
  }

  max(max: number, message?: string): Schema<T> {
    this.config.rules = this.config.rules || [];
    this.config.rules.push({
      validate: (val) => {
        if (typeof val === "string" || Array.isArray(val)) return val.length <= max;
        if (typeof val === "number") return val <= max;
        return false;
      },
      message: message || ((val) => {
        if (typeof val === "string") return `Must be at most ${max} characters`;
        if (typeof val === "number") return `Must be at most ${max}`;
        return `Must have at most ${max} items`;
      }),
    });
    return this;
  }

  pattern(regex: RegExp, message?: string): Schema<T> {
    this.config.rules = this.config.rules || [];
    this.config.rules.push({
      validate: (val) => {
        if (typeof val !== "string") return false;
        return regex.test(val);
      },
      message: message || `Invalid format`,
    });
    return this;
  }

  email(message?: string): Schema<T> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.pattern(emailRegex, message || "Invalid email address");
  }

  url(message?: string): Schema<T> {
    this.config.rules = this.config.rules || [];
    this.config.rules.push({
      validate: (val) => {
        if (typeof val !== "string") return false;
        return URL.parse(val) !== null;
      },
      message: message || "Invalid URL",
    });
    return this;
  }

  custom(rule: ValidationRule<T>): Schema<T> {
    this.config.rules = this.config.rules || [];
    this.config.rules.push(rule);
    return this;
  }

  transform(fn: (value: any) => T): Schema<T> {
    this.config.transform = fn;
    return this;
  }

  default(value: T): Schema<T> {
    this.config.defaultValue = value;
    return this;
  }

  getConfig(): FieldSchema<T> {
    return this.config;
  }
}

// ============================================================================
// Schema Builders
// ============================================================================

export const v = {
  string(): Schema<string> {
    return new Schema<string>({ type: "string" });
  },

  number(): Schema<number> {
    return new Schema<number>({
      type: "number",
      transform: (val) => {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      },
    });
  },

  boolean(): Schema<boolean> {
    return new Schema<boolean>({
      type: "boolean",
      transform: (val) => val === true || val === "true" || val === "on",
    });
  },

  email(): Schema<string> {
    return new Schema<string>({ type: "email" }).email();
  },

  url(): Schema<string> {
    return new Schema<string>({ type: "url" }).url();
  },

  date(): Schema<Date> {
    return new Schema<Date>({
      type: "date",
      transform: (val) => {
        if (val instanceof Date) return val;
        return new Date(val);
      },
    });
  },

  custom<T>(validator: (val: any) => val is T): Schema<T> {
    return new Schema<T>({ type: "custom" });
  },
};

// ============================================================================
// Form Hook
// ============================================================================

export type UseFormOptions<T extends Record<string, any>> = {
  schema: Record<keyof T, Schema<any>>;
  initialValues?: Partial<T>;
  onSubmit: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
};

export type FormApi<T extends Record<string, any>> = {
  values: Signal<T>;
  errors: Signal<Record<keyof T, string[]>>;
  touched: Signal<Record<keyof T, boolean>>;
  dirty: Signal<Record<keyof T, boolean>>;
  isValid: Signal<boolean>;
  isSubmitting: Signal<boolean>;
  submitCount: Signal<number>;

  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: (field: keyof T, message: string) => void;
  clearError: (field: keyof T) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  validate: (field?: keyof T) => Promise<boolean>;
  handleSubmit: (e?: Event) => Promise<void>;
  handleChange: <K extends keyof T>(field: K) => (e: Event) => void;
  handleBlur: (field: keyof T) => (e: Event) => void;
  reset: () => void;
};

export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): FormApi<T> {
  const { schema, initialValues, onSubmit, validateOnChange = false, validateOnBlur = true } = options;

  // Extract schemas and build initial values
  const schemaConfigs: Record<string, FieldSchema> = {};
  const defaults: Partial<T> = {};

  for (const [key, schemaInstance] of Object.entries(schema)) {
    const config = (schemaInstance as Schema<any>).getConfig();
    schemaConfigs[key] = config;
    if (config.defaultValue !== undefined) {
      defaults[key as keyof T] = config.defaultValue;
    }
  }

  // State signals
  const values = signal<T>({ ...defaults, ...initialValues } as T);
  const errors = signal<Record<keyof T, string[]>>({} as Record<keyof T, string[]>);
  const touched = signal<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const dirty = signal<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const isValid = signal<boolean>(true);
  const isSubmitting = signal<boolean>(false);
  const submitCount = signal<number>(0);

  // Validate single field
  async function validateField(field: keyof T): Promise<boolean> {
    const config = schemaConfigs[field as string];
    if (!config) return true;

    const value = values()[field];
    const fieldErrors: string[] = [];

    // Required check
    if (config.required && (value == null || value === "")) {
      fieldErrors.push(`${String(field)} is required`);
    }

    // Run validation rules
    if (config.rules && value != null && value !== "") {
      for (const rule of config.rules) {
        const isValid = await rule.validate(value);
        if (!isValid) {
          const message = typeof rule.message === "function" ? rule.message(value) : rule.message;
          fieldErrors.push(message);
        }
      }
    }

    // Update errors
    const currentErrors = errors();
    if (fieldErrors.length > 0) {
      errors.set({ ...currentErrors, [field]: fieldErrors });
      return false;
    } else {
      const { [field]: _, ...rest } = currentErrors;
      errors.set(rest as Record<keyof T, string[]>);
      return true;
    }
  }

  // Validate all fields
  async function validate(field?: keyof T): Promise<boolean> {
    if (field) {
      return validateField(field);
    }

    const validationResults = await Promise.all(
      Object.keys(schemaConfigs).map((key) => validateField(key as keyof T))
    );

    const allValid = validationResults.every((v) => v);
    isValid.set(allValid);
    return allValid;
  }

  // Set value and optionally validate
  function setValue<K extends keyof T>(field: K, value: T[K]): void {
    const config = schemaConfigs[field as string];

    // Apply transformation if defined
    let transformedValue = value;
    if (config?.transform) {
      transformedValue = config.transform(value) as T[K];
    }

    const currentValues = values();
    values.set({ ...currentValues, [field]: transformedValue });

    const currentDirty = dirty();
    dirty.set({ ...currentDirty, [field]: true });

    if (validateOnChange) {
      validateField(field);
    }
  }

  // Set error
  function setError(field: keyof T, message: string): void {
    const currentErrors = errors();
    errors.set({ ...currentErrors, [field]: [message] });
    isValid.set(false);
  }

  // Clear error
  function clearError(field: keyof T): void {
    const currentErrors = errors();
    const { [field]: _, ...rest } = currentErrors;
    errors.set(rest as Record<keyof T, string[]>);
  }

  // Set touched
  function setTouched(field: keyof T, touchedValue: boolean): void {
    const currentTouched = touched();
    touched.set({ ...currentTouched, [field]: touchedValue });
  }

  // Handle change event
  function handleChange<K extends keyof T>(field: K) {
    return (e: Event) => {
      const target = e.target as HTMLInputElement;
      const config = schemaConfigs[field as string];

      let value: any = target.value;

      // Type transformation
      if (config?.type === "number") {
        value = target.valueAsNumber;
      } else if (config?.type === "boolean") {
        value = target.checked;
      } else if (config?.type === "date") {
        value = target.valueAsDate;
      }

      // Custom transformation
      if (config?.transform) {
        value = config.transform(value);
      }

      setValue(field, value as T[K]);
    };
  }

  // Handle blur event
  function handleBlur(field: keyof T) {
    return (e: Event) => {
      setTouched(field, true);
      if (validateOnBlur) {
        validateField(field);
      }
    };
  }

  // Handle submit
  async function handleSubmit(e?: Event): Promise<void> {
    if (e) {
      e.preventDefault();
    }

    submitCount.set(submitCount() + 1);

    // Mark all fields as touched
    const allTouched: Record<keyof T, boolean> = {} as Record<keyof T, boolean>;
    for (const key of Object.keys(schemaConfigs)) {
      allTouched[key as keyof T] = true;
    }
    touched.set(allTouched);

    // Validate all fields
    const valid = await validate();
    if (!valid) {
      return;
    }

    // Submit
    isSubmitting.set(true);
    try {
      await onSubmit(values());
    } catch (error) {
      console.error("Form submission error:", error);
      throw error;
    } finally {
      isSubmitting.set(false);
    }
  }

  // Reset form
  function reset(): void {
    values.set({ ...defaults, ...initialValues } as T);
    errors.set({} as Record<keyof T, string[]>);
    touched.set({} as Record<keyof T, boolean>);
    dirty.set({} as Record<keyof T, boolean>);
    isValid.set(true);
    isSubmitting.set(false);
    submitCount.set(0);
  }

  return {
    values,
    errors,
    touched,
    dirty,
    isValid,
    isSubmitting,
    submitCount,
    setValue,
    setError,
    clearError,
    setTouched,
    validate,
    handleSubmit,
    handleChange,
    handleBlur,
    reset,
  };
}

// ============================================================================
// Field Component Helpers
// ============================================================================

export type FieldProps<T extends Record<string, any>, K extends keyof T> = {
  form: FormApi<T>;
  name: K;
  label?: string;
  placeholder?: string;
  type?: string;
  className?: string;
};

export function createField<T extends Record<string, any>>() {
  return {
    Input: <K extends keyof T>(props: FieldProps<T, K>) => {
      const { form, name, label, placeholder, type = "text", className } = props;

      const value = form.values()[name];
      const errorMessages = form.errors()[name] || [];
      const isTouched = form.touched()[name];
      const showError = isTouched && errorMessages.length > 0;

      return {
        type: "div",
        props: {
          className: `field ${className || ""}`.trim(),
          children: [
            label && {
              type: "label",
              props: {
                htmlFor: String(name),
                children: label,
              },
            },
            {
              type: "input",
              props: {
                id: String(name),
                name: String(name),
                type,
                value: value || "",
                placeholder,
                onChange: form.handleChange(name),
                onBlur: form.handleBlur(name),
                "aria-invalid": showError,
                "aria-describedby": showError ? `${String(name)}-error` : undefined,
              },
            },
            showError && {
              type: "div",
              props: {
                id: `${String(name)}-error`,
                className: "field-error",
                role: "alert",
                children: errorMessages[0],
              },
            },
          ].filter(Boolean),
        },
      };
    },

    TextArea: <K extends keyof T>(props: FieldProps<T, K> & { rows?: number }) => {
      const { form, name, label, placeholder, rows = 4, className } = props;

      const value = form.values()[name];
      const errorMessages = form.errors()[name] || [];
      const isTouched = form.touched()[name];
      const showError = isTouched && errorMessages.length > 0;

      return {
        type: "div",
        props: {
          className: `field ${className || ""}`.trim(),
          children: [
            label && {
              type: "label",
              props: {
                htmlFor: String(name),
                children: label,
              },
            },
            {
              type: "textarea",
              props: {
                id: String(name),
                name: String(name),
                value: value || "",
                placeholder,
                rows,
                onChange: form.handleChange(name),
                onBlur: form.handleBlur(name),
                "aria-invalid": showError,
                "aria-describedby": showError ? `${String(name)}-error` : undefined,
              },
            },
            showError && {
              type: "div",
              props: {
                id: `${String(name)}-error`,
                className: "field-error",
                role: "alert",
                children: errorMessages[0],
              },
            },
          ].filter(Boolean),
        },
      };
    },

    Checkbox: <K extends keyof T>(props: FieldProps<T, K>) => {
      const { form, name, label, className } = props;

      const value = form.values()[name];
      const errorMessages = form.errors()[name] || [];
      const isTouched = form.touched()[name];
      const showError = isTouched && errorMessages.length > 0;

      return {
        type: "div",
        props: {
          className: `field field-checkbox ${className || ""}`.trim(),
          children: [
            {
              type: "label",
              props: {
                children: [
                  {
                    type: "input",
                    props: {
                      id: String(name),
                      name: String(name),
                      type: "checkbox",
                      checked: !!value,
                      onChange: form.handleChange(name),
                      onBlur: form.handleBlur(name),
                      "aria-invalid": showError,
                      "aria-describedby": showError ? `${String(name)}-error` : undefined,
                    },
                  },
                  label && {
                    type: "span",
                    props: {
                      children: label,
                    },
                  },
                ].filter(Boolean),
              },
            },
            showError && {
              type: "div",
              props: {
                id: `${String(name)}-error`,
                className: "field-error",
                role: "alert",
                children: errorMessages[0],
              },
            },
          ].filter(Boolean),
        },
      };
    },
  };
}
