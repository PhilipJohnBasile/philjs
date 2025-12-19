/**
 * PhilJS Forms - Form handling with validation
 * @packageDocumentation
 */

// Types
export type {
  FieldValue,
  FormValues,
  FieldError,
  FormErrors,
  TouchedFields,
  ValidationRule,
  FieldConfig,
  FormConfig,
  FieldState,
  FormState
} from './types.js';

// Form management
export {
  Form,
  createForm,
  useForm
} from './form.js';

// Validation
export {
  validators,
  validateValue,
  zodValidator,
  createZodValidator,
  composeValidators,
  debounceValidation,
  patterns
} from './validation.js';

// Field components
export {
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  RadioField,
  FileField,
  NumberField,
  Field
} from './fields.js';
