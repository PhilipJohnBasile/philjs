/**
 * PhilJS Forms - Form handling with validation
 * @packageDocumentation
 */
// Form management
export { Form, createForm, useForm } from './form.js';
// Validation
export { validators, validateValue, zodValidator, createZodValidator, composeValidators, debounceValidation, patterns } from './validation.js';
// Field components
export { TextField, TextAreaField, SelectField, CheckboxField, RadioField, FileField, NumberField, Field } from './fields.js';
// Remix-style form actions
export { useFormAction } from './useFormAction.js';
// Remix-style fetcher
export { useFetcher } from './useFetcher.js';
// Optimistic UI
export { useOptimistic, useOptimisticValue } from './optimistic.js';
// Progressive enhancement
export { useProgressiveForm, isProgressivelyEnhanced, addJavaScriptMarker, clientHasJavaScript, NoScript, ClientOnly, isJSEnabled, isHydrated } from './progressive.js';
// Advanced Validation
export { 
// Advanced validators
advancedValidators, 
// Schema validator
SchemaValidator, createSchemaValidator, 
// Utilities
when, crossField, dependsOn, messageWithField, combineResults, formatErrors, hasErrors, getFirstError, } from './advanced-validation.js';
// Multi-Step Wizard
export { createWizard, useWizard, getStepIndicatorData, calculateProgress, getStepTransitionStyles, createCheckoutWizard, createSignupWizard, createSurveyWizard, } from './wizard.js';
// Input Masking
export { parseMaskPattern, applyMask, unmask, phoneMask, creditCardMask, detectCardType, luhnCheck, currencyMask, dateMask, timeMask, ssnMask, zipCodeMask, createMaskInputHandler, maskChars, maskPresets, } from './input-mask.js';
// Auto-Save & Draft Recovery
export { createAutoSave, useAutoSave, resolveConflict, createIndexedDBStorage, createSessionStorage, formatDraftTimestamp, getRecoveryMessage, } from './auto-save.js';
//# sourceMappingURL=index.js.map