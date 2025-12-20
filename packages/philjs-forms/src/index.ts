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

// Remix-style form actions
export {
  useFormAction,
  type FormActionOptions,
  type FormActionState,
  type FormActionReturn
} from './useFormAction.js';

// Remix-style fetcher
export {
  useFetcher,
  type FetcherMethod,
  type FetcherSubmitOptions,
  type FetcherState,
  type FetcherReturn
} from './useFetcher.js';

// Optimistic UI
export {
  useOptimistic,
  useOptimisticValue,
  type OptimisticUpdate,
  type OptimisticOptions
} from './optimistic.js';

// Progressive enhancement
export {
  useProgressiveForm,
  isProgressivelyEnhanced,
  addJavaScriptMarker,
  clientHasJavaScript,
  NoScript,
  ClientOnly,
  isJSEnabled,
  isHydrated,
  type ProgressiveFormOptions
} from './progressive.js';
