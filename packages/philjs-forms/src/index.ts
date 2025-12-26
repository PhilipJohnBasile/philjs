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

// Advanced Validation
export {
  // Advanced validators
  advancedValidators,
  // Schema validator
  SchemaValidator,
  createSchemaValidator,
  // Utilities
  when,
  crossField,
  dependsOn,
  messageWithField,
  combineResults,
  formatErrors,
  hasErrors,
  getFirstError,
  // Types
  type AsyncValidationRule,
  type ConditionalRule,
  type ValidationContext,
  type ValidationGroup,
  type CrossFieldRule,
  type ValidationSchema,
  type ValidationResult,
  type FieldValidationResult,
} from './advanced-validation.js';

// Multi-Step Wizard
export {
  createWizard,
  useWizard,
  getStepIndicatorData,
  calculateProgress,
  getStepTransitionStyles,
  createCheckoutWizard,
  createSignupWizard,
  createSurveyWizard,
  type WizardStep,
  type WizardConfig,
  type WizardState,
  type WizardController,
  type StepIndicatorProps,
  type TransitionDirection,
  type StepTransitionConfig,
} from './wizard.js';

// Input Masking
export {
  parseMaskPattern,
  applyMask,
  unmask,
  phoneMask,
  creditCardMask,
  detectCardType,
  luhnCheck,
  currencyMask,
  dateMask,
  timeMask,
  ssnMask,
  zipCodeMask,
  createMaskInputHandler,
  maskChars,
  maskPresets,
  type MaskConfig,
  type MaskResult,
  type MaskChar,
  type MaskDefinition,
  type MaskInputHandler,
} from './input-mask.js';

// Auto-Save & Draft Recovery
export {
  createAutoSave,
  useAutoSave,
  resolveConflict,
  createIndexedDBStorage,
  createSessionStorage,
  formatDraftTimestamp,
  getRecoveryMessage,
  type AutoSaveConfig,
  type FormDraft,
  type AutoSaveState,
  type AutoSaveController,
  type ConflictStrategy,
  type RecoveryDialogProps,
} from './auto-save.js';
