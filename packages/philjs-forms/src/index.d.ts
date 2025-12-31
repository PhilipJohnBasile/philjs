/**
 * PhilJS Forms - Form handling with validation
 * @packageDocumentation
 */
export type { FieldValue, FormValues, FieldError, FormErrors, TouchedFields, ValidationRule, FieldConfig, FormConfig, FieldState, FormState } from './types.js';
export { Form, createForm, useForm } from './form.js';
export { validators, validateValue, zodValidator, createZodValidator, composeValidators, debounceValidation, patterns } from './validation.js';
export { TextField, TextAreaField, SelectField, CheckboxField, RadioField, FileField, NumberField, Field } from './fields.js';
export { useFormAction, type FormActionOptions, type FormActionState, type FormActionReturn } from './useFormAction.js';
export { useFetcher, type FetcherMethod, type FetcherSubmitOptions, type FetcherState, type FetcherReturn } from './useFetcher.js';
export { useOptimistic, useOptimisticValue, type OptimisticUpdate, type OptimisticOptions } from './optimistic.js';
export { useProgressiveForm, isProgressivelyEnhanced, addJavaScriptMarker, clientHasJavaScript, NoScript, ClientOnly, isJSEnabled, isHydrated, type ProgressiveFormOptions } from './progressive.js';
export { advancedValidators, SchemaValidator, createSchemaValidator, when, crossField, dependsOn, messageWithField, combineResults, formatErrors, hasErrors, getFirstError, type AsyncValidationRule, type ConditionalRule, type ValidationContext, type ValidationGroup, type CrossFieldRule, type ValidationSchema, type ValidationResult, type FieldValidationResult, } from './advanced-validation.js';
export { createWizard, useWizard, getStepIndicatorData, calculateProgress, getStepTransitionStyles, createCheckoutWizard, createSignupWizard, createSurveyWizard, type WizardStep, type WizardConfig, type WizardState, type WizardController, type StepIndicatorProps, type TransitionDirection, type StepTransitionConfig, } from './wizard.js';
export { parseMaskPattern, applyMask, unmask, phoneMask, creditCardMask, detectCardType, luhnCheck, currencyMask, dateMask, timeMask, ssnMask, zipCodeMask, createMaskInputHandler, maskChars, maskPresets, type MaskConfig, type MaskResult, type MaskChar, type MaskDefinition, type MaskInputHandler, } from './input-mask.js';
export { createAutoSave, useAutoSave, resolveConflict, createIndexedDBStorage, createSessionStorage, formatDraftTimestamp, getRecoveryMessage, type AutoSaveConfig, type FormDraft, type AutoSaveState, type AutoSaveController, type ConflictStrategy, type RecoveryDialogProps, } from './auto-save.js';
//# sourceMappingURL=index.d.ts.map