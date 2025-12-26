// @ts-nocheck
/**
 * PhilJS LiveView - Form Handling
 *
 * Handles form submissions, validation, and file uploads.
 */

import type {
  LiveViewForm,
  FormValidation,
  UploadConfig,
  UploadEntry,
} from './types';

// ============================================================================
// Form State Management
// ============================================================================

interface FormState {
  data: Record<string, any>;
  errors: Record<string, string[]>;
  submitting: boolean;
  submitted: boolean;
  valid: boolean;
}

/**
 * Create a form state manager
 */
export function createFormState(initialData: Record<string, any> = {}): FormState {
  return {
    data: { ...initialData },
    errors: {},
    submitting: false,
    submitted: false,
    valid: true,
  };
}

/**
 * Update form field
 */
export function updateField(
  state: FormState,
  field: string,
  value: any
): FormState {
  return {
    ...state,
    data: { ...state.data, [field]: value },
    errors: { ...state.errors, [field]: [] }, // Clear field errors on change
  };
}

/**
 * Set form errors
 */
export function setErrors(
  state: FormState,
  errors: Record<string, string[]>
): FormState {
  return {
    ...state,
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

// ============================================================================
// Form Validation
// ============================================================================

export interface ValidationRule {
  validate: (value: any, params?: any) => boolean;
  message: (field: string, params?: any) => string;
}

const builtinRules: Record<string, ValidationRule> = {
  required: {
    validate: (value) => value !== null && value !== undefined && value !== '',
    message: (field) => `${field} is required`,
  },

  email: {
    validate: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
    message: () => 'Invalid email address',
  },

  min: {
    validate: (value, params) => {
      if (!value) return true;
      if (typeof value === 'string') return value.length >= params;
      if (typeof value === 'number') return value >= params;
      return true;
    },
    message: (field, params) => `${field} must be at least ${params}`,
  },

  max: {
    validate: (value, params) => {
      if (!value) return true;
      if (typeof value === 'string') return value.length <= params;
      if (typeof value === 'number') return value <= params;
      return true;
    },
    message: (field, params) => `${field} must be at most ${params}`,
  },

  pattern: {
    validate: (value, params) => !value || new RegExp(params).test(String(value)),
    message: (field) => `${field} is invalid`,
  },

  matches: {
    validate: (value, params) => value === params.value,
    message: (field, params) => `${field} must match ${params.field}`,
  },

  url: {
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(String(value));
        return true;
      } catch {
        return false;
      }
    },
    message: () => 'Invalid URL',
  },

  number: {
    validate: (value) => !value || !isNaN(Number(value)),
    message: (field) => `${field} must be a number`,
  },

  integer: {
    validate: (value) => !value || Number.isInteger(Number(value)),
    message: (field) => `${field} must be an integer`,
  },

  date: {
    validate: (value) => {
      if (!value) return true;
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message: (field) => `${field} must be a valid date`,
  },
};

/**
 * Validate form data against rules
 */
export function validateForm(
  data: Record<string, any>,
  validations: FormValidation[]
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const validation of validations) {
    const { field, rule, message, params } = validation;
    const value = data[field];

    if (rule === 'custom') {
      // Custom validation via callback
      if (params?.validate && !params.validate(value, data)) {
        if (!errors[field]) errors[field] = [];
        errors[field].push(message);
      }
    } else {
      const ruleHandler = builtinRules[rule];
      if (ruleHandler && !ruleHandler.validate(value, params)) {
        if (!errors[field]) errors[field] = [];
        errors[field].push(message || ruleHandler.message(field, params));
      }
    }
  }

  return errors;
}

/**
 * Validate a single field
 */
export function validateField(
  field: string,
  value: any,
  validations: FormValidation[],
  data?: Record<string, any>
): string[] {
  const fieldValidations = validations.filter(v => v.field === field);
  const errors: string[] = [];

  for (const validation of fieldValidations) {
    const { rule, message, params } = validation;

    if (rule === 'custom') {
      if (params?.validate && !params.validate(value, data)) {
        errors.push(message);
      }
    } else {
      const ruleHandler = builtinRules[rule];
      if (ruleHandler && !ruleHandler.validate(value, params)) {
        errors.push(message || ruleHandler.message(field, params));
      }
    }
  }

  return errors;
}

// ============================================================================
// Form Serialization
// ============================================================================

/**
 * Serialize form element to object
 */
export function serializeForm(form: HTMLFormElement): Record<string, any> {
  const formData = new FormData(form);
  const data: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    // Handle array fields (name[])
    if (key.endsWith('[]')) {
      const arrayKey = key.slice(0, -2);
      if (!data[arrayKey]) data[arrayKey] = [];
      data[arrayKey].push(value);
    }
    // Handle nested fields (name[nested])
    else if (key.includes('[')) {
      const matches = key.match(/^(\w+)\[(\w+)\]$/);
      if (matches) {
        const [, parent, child] = matches;
        if (!data[parent]) data[parent] = {};
        data[parent][child] = value;
      }
    }
    // Handle checkboxes
    else if (value === 'on') {
      const input = form.querySelector(`[name="${key}"]`);
      if (input instanceof HTMLInputElement && input.type === 'checkbox') {
        data[key] = input.checked;
      } else {
        data[key] = value;
      }
    }
    // Handle multiple values for same key
    else if (key in data) {
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]];
      }
      data[key].push(value);
    }
    else {
      data[key] = value;
    }
  }

  // Handle unchecked checkboxes (they're not included in FormData)
  form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    const checkbox = input as HTMLInputElement;
    if (checkbox.name && !(checkbox.name in data)) {
      data[checkbox.name] = false;
    }
  });

  return data;
}

/**
 * Deserialize object to form
 */
export function deserializeToForm(form: HTMLFormElement, data: Record<string, any>): void {
  for (const [key, value] of Object.entries(data)) {
    const elements = form.querySelectorAll(`[name="${key}"]`);

    elements.forEach((el) => {
      if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox') {
          el.checked = Boolean(value);
        } else if (el.type === 'radio') {
          el.checked = el.value === String(value);
        } else {
          el.value = String(value ?? '');
        }
      } else if (el instanceof HTMLTextAreaElement) {
        el.value = String(value ?? '');
      } else if (el instanceof HTMLSelectElement) {
        el.value = String(value ?? '');
      }
    });
  }
}

// ============================================================================
// File Upload Handling
// ============================================================================

interface UploadState {
  entries: Map<string, UploadEntry>;
  configs: Map<string, UploadConfig>;
}

/**
 * Create upload state manager
 */
export function createUploadState(): UploadState {
  return {
    entries: new Map(),
    configs: new Map(),
  };
}

/**
 * Configure an upload
 */
export function configureUpload(
  state: UploadState,
  config: UploadConfig
): void {
  state.configs.set(config.name, config);
}

/**
 * Add files to upload queue
 */
export function addFiles(
  state: UploadState,
  uploadName: string,
  files: FileList
): { valid: UploadEntry[]; invalid: Array<{ file: File; error: string }> } {
  const config = state.configs.get(uploadName);
  const valid: UploadEntry[] = [];
  const invalid: Array<{ file: File; error: string }> = [];

  if (!config) {
    return { valid, invalid: Array.from(files).map(f => ({ file: f, error: 'Upload not configured' })) };
  }

  // Check max entries
  const currentCount = Array.from(state.entries.values()).filter(e => e.status !== 'error').length;
  const maxEntries = config.maxEntries || Infinity;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Check max entries
    if (currentCount + valid.length >= maxEntries) {
      invalid.push({ file, error: `Maximum ${maxEntries} files allowed` });
      continue;
    }

    // Check file size
    if (config.maxFileSize && file.size > config.maxFileSize) {
      invalid.push({ file, error: `File too large (max ${formatBytes(config.maxFileSize)})` });
      continue;
    }

    // Check file type
    if (config.accept && config.accept.length > 0) {
      const accepted = config.accept.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type);
        }
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!accepted) {
        invalid.push({ file, error: `File type not accepted` });
        continue;
      }
    }

    // Create entry
    const entry: UploadEntry = {
      id: `${uploadName}-${Date.now()}-${i}`,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'pending',
    };

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      entry.previewUrl = URL.createObjectURL(file);
    }

    state.entries.set(entry.id, entry);
    valid.push(entry);
  }

  return { valid, invalid };
}

/**
 * Update upload progress
 */
export function updateProgress(
  state: UploadState,
  entryId: string,
  progress: number
): void {
  const entry = state.entries.get(entryId);
  if (entry) {
    entry.progress = progress;
    entry.status = progress === 100 ? 'done' : 'uploading';
  }
}

/**
 * Mark upload as error
 */
export function markUploadError(
  state: UploadState,
  entryId: string,
  error: string
): void {
  const entry = state.entries.get(entryId);
  if (entry) {
    entry.status = 'error';
    entry.error = error;
  }
}

/**
 * Remove an upload entry
 */
export function removeEntry(state: UploadState, entryId: string): void {
  const entry = state.entries.get(entryId);
  if (entry?.previewUrl) {
    URL.revokeObjectURL(entry.previewUrl);
  }
  state.entries.delete(entryId);
}

/**
 * Get all entries for an upload
 */
export function getEntries(state: UploadState, uploadName: string): UploadEntry[] {
  return Array.from(state.entries.values()).filter(e => e.id.startsWith(uploadName));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================================
// Form Component Helpers
// ============================================================================

/**
 * Create a form configuration for a LiveView
 */
export interface FormConfig {
  validations?: FormValidation[];
  uploads?: UploadConfig[];
  debounce?: number;
  throttle?: number;
}

/**
 * Create form submit handler
 */
export function createSubmitHandler(
  config: FormConfig,
  onSubmit: (data: Record<string, any>) => void,
  onError?: (errors: Record<string, string[]>) => void
) {
  return (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = serializeForm(form);

    if (config.validations) {
      const errors = validateForm(data, config.validations);
      if (Object.keys(errors).length > 0) {
        onError?.(errors);
        return;
      }
    }

    onSubmit(data);
  };
}

/**
 * Create change handler with validation
 */
export function createChangeHandler(
  config: FormConfig,
  onChange: (field: string, value: any, errors: string[]) => void
) {
  let debounceTimer: ReturnType<typeof setTimeout>;

  return (event: Event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const field = target.name;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;

    const handler = () => {
      let errors: string[] = [];
      if (config.validations) {
        errors = validateField(field, value, config.validations);
      }
      onChange(field, value, errors);
    };

    if (config.debounce) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handler, config.debounce);
    } else {
      handler();
    }
  };
}

// ============================================================================
// Exports
// ============================================================================

export type { FormState, UploadState };
