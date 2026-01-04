# API Reference

Complete API reference for @philjs/forms.

## Table of Contents

- [Form Management](#form-management)
- [Validation](#validation)
- [Field Components](#field-components)
- [Form Actions](#form-actions)
- [Optimistic Updates](#optimistic-updates)
- [Progressive Enhancement](#progressive-enhancement)
- [Wizard System](#wizard-system)
- [Input Masking](#input-masking)
- [Auto-Save](#auto-save)
- [Types](#types)

---

## Form Management

### `Form<T>` Class

Core form management class with reactive signals.

```typescript
class Form<T extends FormValues = FormValues> {
  constructor(config?: FormConfig<T>)

  // Reactive state
  values: Signal<T>
  errors: Signal<FormErrors<T>>
  touched: Signal<TouchedFields<T>>

  // Computed state
  isValid(): Memo<boolean>
  isDirty(): Memo<boolean>
  isSubmitting(): Signal<boolean>
  isValidating(): Signal<boolean>
  submitCount(): Signal<number>

  // Complete state
  state: Memo<FormState<T>>

  // Field operations
  setFieldValue<K extends keyof T>(name: K, value: T[K]): void
  setValues(values: Partial<T>): void
  setFieldError<K extends keyof T>(name: K, error: FieldError): void
  setErrors(errors: FormErrors<T>): void
  setFieldTouched<K extends keyof T>(name: K, touched?: boolean): void
  setTouched(touched: TouchedFields<T>): void

  // Form operations
  reset(): void
  resetWith(values: Partial<T>): void
  validateField<K extends keyof T>(name: K): Promise<FieldError>
  validate(): Promise<FormErrors<T>>
  handleSubmit(e?: Event): Promise<void>
  getFieldProps<K extends keyof T>(name: K): FieldProps
}
```

### `createForm<T>(config?)`

Factory function to create a Form instance.

```typescript
function createForm<T extends FormValues = FormValues>(
  config?: FormConfig<T>
): Form<T>
```

**Parameters:**
- `config.initialValues` - Initial form values
- `config.validateOn` - When to validate: `'change'`, `'blur'`, or `'submit'`
- `config.validateOnMount` - Validate immediately on creation
- `config.onSubmit` - Submit handler function

### `useForm<T>(config?)`

Hook-style form management.

```typescript
function useForm<T extends FormValues = FormValues>(
  config?: FormConfig<T>
): {
  values: Signal<T>
  errors: Signal<FormErrors<T>>
  touched: Signal<TouchedFields<T>>
  isValid: () => Memo<boolean>
  isDirty: () => Memo<boolean>
  isSubmitting: () => Signal<boolean>
  isValidating: () => Signal<boolean>
  submitCount: () => Signal<number>
  state: Memo<FormState<T>>
  setFieldValue: <K extends keyof T>(name: K, value: T[K]) => void
  setValues: (values: Partial<T>) => void
  setFieldError: <K extends keyof T>(name: K, error: FieldError) => void
  setErrors: (errors: FormErrors<T>) => void
  setFieldTouched: <K extends keyof T>(name: K, touched?: boolean) => void
  setTouched: (touched: TouchedFields<T>) => void
  reset: () => void
  resetWith: (values: Partial<T>) => void
  validate: () => Promise<FormErrors<T>>
  validateField: <K extends keyof T>(name: K) => Promise<FieldError>
  handleSubmit: (e?: Event) => Promise<void>
  getFieldProps: <K extends keyof T>(name: K) => FieldProps
}
```

---

## Validation

### `validators`

Built-in validation rules.

```typescript
const validators = {
  required(message?: string): ValidationRule
  email(message?: string): ValidationRule<string>
  minLength(min: number, message?: string): ValidationRule<string>
  maxLength(max: number, message?: string): ValidationRule<string>
  min(min: number, message?: string): ValidationRule<number>
  max(max: number, message?: string): ValidationRule<number>
  pattern(regex: RegExp, message?: string): ValidationRule<string>
  url(message?: string): ValidationRule<string>
  matches(field: string, message?: string): ValidationRule
  oneOf(options: any[], message?: string): ValidationRule
  custom(fn: (value: any) => boolean | Promise<boolean>, message: string): ValidationRule
}
```

### `validateValue(value, rules, allValues?)`

Validate a single value against rules.

```typescript
function validateValue(
  value: FieldValue,
  rules: ValidationRule | ValidationRule[],
  allValues?: FormValues
): Promise<FieldError>
```

### `zodValidator<T>(schema)`

Create a validator from a Zod schema.

```typescript
function zodValidator<T extends FormValues>(
  schema: ZodSchema
): (values: T) => Promise<FormErrors<T>>
```

### `createZodValidator<T>(schema)`

Create a validator with field-level validation.

```typescript
function createZodValidator<T extends FormValues>(schema: ZodSchema): {
  validate: (values: T) => Promise<FormErrors<T>>
  validateField: (name: keyof T, value: any) => Promise<FieldError>
}
```

### `composeValidators<T>(...validators)`

Combine multiple validators.

```typescript
function composeValidators<T extends FormValues>(
  ...validators: Array<(values: T) => FormErrors<T> | Promise<FormErrors<T>>>
): (values: T) => Promise<FormErrors<T>>
```

### `debounceValidation<T>(fn, delay?)`

Debounce a validation function.

```typescript
function debounceValidation<T extends (...args: any[]) => any>(
  fn: T,
  delay?: number  // default: 300
): T
```

### `patterns`

Common regex patterns.

```typescript
const patterns = {
  email: RegExp
  phone: RegExp
  url: RegExp
  alphanumeric: RegExp
  numeric: RegExp
  alpha: RegExp
  username: RegExp
  password: RegExp
  zipCode: RegExp
  creditCard: RegExp
  hexColor: RegExp
  ipv4: RegExp
}
```

### `advancedValidators`

Advanced validation rules.

```typescript
const advancedValidators = {
  emailWithDomainCheck(allowedDomains?: string[], message?: string): AsyncValidationRule<string>
  usernameAvailable(checkFn: (username: string) => Promise<boolean>, message?: string): AsyncValidationRule<string>
  passwordStrength(minStrength?: 'weak' | 'medium' | 'strong' | 'very-strong', message?: string): ValidationRule<string>
  file(options: { maxSize?: number, allowedTypes?: string[], maxFiles?: number }): ValidationRule
  date(options: { min?: Date, max?: Date, excludeWeekends?: boolean, excludeDates?: Date[] }): ValidationRule
  array(options: { min?: number, max?: number, unique?: boolean, itemValidator?: ValidationRule }): ValidationRule<unknown[]>
  creditCard(message?: string): ValidationRule<string>
  iban(message?: string): ValidationRule<string>
  json(message?: string): ValidationRule<string>
  slug(message?: string): ValidationRule<string>
  uuid(version?: 1 | 4, message?: string): ValidationRule<string>
}
```

### `SchemaValidator<T>`

Schema-based validation with async support.

```typescript
class SchemaValidator<T extends FormValues> {
  constructor(schema: ValidationSchema<T>)

  validate(values: T, context?: Partial<ValidationContext>): Promise<ValidationResult<T>>
  validateField(field: keyof T, value: T[keyof T], allValues?: T, context?: Partial<ValidationContext>): Promise<FieldValidationResult>
  validateGroup(groupName: string, values: T): Promise<FormErrors<T>>
  cancelPending(): void
}
```

### `createSchemaValidator<T>(schema)`

Factory for SchemaValidator.

```typescript
function createSchemaValidator<T extends FormValues>(
  schema: ValidationSchema<T>
): SchemaValidator<T>
```

### `when<T>(condition, rule)`

Create conditional validation rule.

```typescript
function when<T = FieldValue>(
  condition: (values: FormValues) => boolean,
  rule: ValidationRule<T>
): ConditionalRule<T>
```

### `crossField(fields, validate, message, target?)`

Create cross-field validation.

```typescript
function crossField(
  fields: string[],
  validate: (values: Record<string, FieldValue>) => boolean | Promise<boolean>,
  message: string,
  target?: string
): CrossFieldRule
```

### `dependsOn<T>(fieldName, condition, rule)`

Validate based on another field's value.

```typescript
function dependsOn<T = FieldValue>(
  fieldName: string,
  condition: (dependentValue: FieldValue) => boolean,
  rule: ValidationRule<T>
): ConditionalRule<T>
```

### Utility Functions

```typescript
function messageWithField(template: string): (fieldName: string) => string
function combineResults<T extends FormValues>(results: ValidationResult<T>[]): ValidationResult<T>
function formatErrors<T extends FormValues>(errors: FormErrors<T>, labels?: Record<string, string>): string[]
function hasErrors<T extends FormValues>(errors: FormErrors<T>): boolean
function getFirstError<T extends FormValues>(errors: FormErrors<T>): [string, FieldError] | null
```

---

## Field Components

### `TextField(props)`

Text input field factory.

```typescript
function TextField(props: TextFieldProps): {
  type: 'text'
  props: TextFieldProps
  render: () => { tag: 'input', attributes: Record<string, unknown> }
}

interface TextFieldProps extends BaseFieldProps<string> {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search'
  minLength?: number
  maxLength?: number
  pattern?: string
  autoComplete?: string
  autoFocus?: boolean
}
```

### `TextAreaField(props)`

Multi-line text field factory.

```typescript
function TextAreaField(props: TextAreaFieldProps): {
  type: 'textarea'
  props: TextAreaFieldProps
  render: () => { tag: 'textarea', attributes: Record<string, unknown> }
}

interface TextAreaFieldProps extends BaseFieldProps<string> {
  rows?: number
  cols?: number
  minLength?: number
  maxLength?: number
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
}
```

### `SelectField(props)`

Select dropdown field factory.

```typescript
function SelectField(props: SelectFieldProps): {
  type: 'select'
  props: SelectFieldProps
  render: () => { tag: 'select', attributes: Record<string, unknown>, options: SelectFieldProps['options'] }
}

interface SelectFieldProps extends BaseFieldProps<string | string[]> {
  options: Array<{ value: string, label: string, disabled?: boolean }>
  multiple?: boolean
  size?: number
}
```

### `CheckboxField(props)`

Checkbox field factory.

```typescript
function CheckboxField(props: CheckboxFieldProps): {
  type: 'checkbox'
  props: CheckboxFieldProps
  render: () => { tag: 'input', attributes: Record<string, unknown> }
}

interface CheckboxFieldProps extends BaseFieldProps<boolean> {
  indeterminate?: boolean
}
```

### `RadioField(props)`

Radio button group factory.

```typescript
function RadioField(props: RadioFieldProps): {
  type: 'radio'
  props: RadioFieldProps
  render: () => { tag: 'fieldset', options: RadioFieldProps['options'], attributes: Record<string, unknown> }
}

interface RadioFieldProps extends BaseFieldProps<string> {
  options: Array<{ value: string, label: string, disabled?: boolean }>
  inline?: boolean
}
```

### `FileField(props)`

File upload field factory.

```typescript
function FileField(props: FileFieldProps): {
  type: 'file'
  props: FileFieldProps
  render: () => { tag: 'input', attributes: Record<string, unknown> }
}

interface FileFieldProps extends BaseFieldProps<File | File[] | null> {
  accept?: string
  multiple?: boolean
  capture?: 'user' | 'environment'
}
```

### `NumberField(props)`

Numeric input field factory.

```typescript
function NumberField(props: NumberFieldProps): {
  type: 'number'
  props: NumberFieldProps
  render: () => { tag: 'input', attributes: Record<string, unknown> }
}

interface NumberFieldProps extends BaseFieldProps<number | null> {
  min?: number
  max?: number
  step?: number
}
```

### `Field(type, props)`

Generic field factory.

```typescript
function Field(type: FieldType, props: FieldProps): ReturnType<typeof *Field>
```

---

## Form Actions

### `useFormAction<TData, TError>(options?)`

Remix-style form action hook.

```typescript
function useFormAction<TData = any, TError = Error>(
  options?: FormActionOptions<TData, TError>
): FormActionReturn<TData, TError>

interface FormActionOptions<TData, TError> {
  action?: string | ((formData: FormData) => Promise<TData>)
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  onSubmit?: (formData: FormData) => void | Promise<void>
  onSuccess?: (data: TData) => void | Promise<void>
  onError?: (error: TError) => void | Promise<void>
  onSettled?: () => void | Promise<void>
  encType?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain'
  resetOnSuccess?: boolean
  redirectTo?: string
  replace?: boolean
  transformData?: (formData: FormData) => FormData | Record<string, any>
  validate?: (formData: FormData) => Promise<Record<string, string> | null>
}

interface FormActionReturn<TData, TError> {
  state: FormActionState<TData, TError>
  isIdle: Memo<boolean>
  formProps: {
    action?: string
    method: string
    encType?: string
    onSubmit: (e: Event) => Promise<void>
  }
  submit: (formData?: FormData | HTMLFormElement) => Promise<void>
  reset: () => void
}
```

### `useFetcher<TData, TError>()`

Non-navigational form submissions.

```typescript
function useFetcher<TData = any, TError = Error>(): FetcherReturn<TData, TError>

interface FetcherReturn<TData, TError> {
  state: Signal<'idle' | 'submitting' | 'loading'>
  data: Signal<TData | null>
  error: Signal<TError | null>
  formData: Signal<FormData | null>
  formMethod: Signal<FetcherMethod | null>
  formAction: Signal<string | null>
  submit: (data: FormData | HTMLFormElement | Record<string, any>, options?: FetcherSubmitOptions) => Promise<void>
  load: (url: string) => Promise<void>
  Form: (props: FormProps) => VNode
}

interface FetcherSubmitOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  action?: string
  encType?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'application/json'
  navigate?: string
  replace?: boolean
}
```

---

## Optimistic Updates

### `useOptimistic<T>(initialData, options?)`

Manage optimistic UI updates for lists.

```typescript
function useOptimistic<T extends { id?: string | number }>(
  initialData: T[] | Signal<T[]>,
  options?: OptimisticOptions
): {
  data: Memo<T[]>
  pending: Signal<Map<string, OptimisticUpdate<T>>>
  addOptimistic: (type: 'add' | 'update' | 'delete', id: string, data: T) => void
  confirmUpdate: (id: string, realData?: T) => void
  rollbackUpdate: (id: string, error?: Error) => void
  clearPending: () => void
  hasPending: Memo<boolean>
}

interface OptimisticOptions {
  timeout?: number  // default: 30000
  onTimeout?: (update: OptimisticUpdate<any>) => void
  onRollback?: (update: OptimisticUpdate<any>) => void
}

interface OptimisticUpdate<T> {
  id: string
  type: 'add' | 'update' | 'delete'
  data: T
  timestamp: number
  pending: boolean
  error: Error | null
}
```

### `useOptimisticValue<T>(initialValue)`

Manage optimistic updates for single values.

```typescript
function useOptimisticValue<T>(initialValue: T): {
  value: Memo<T>
  isPending: Signal<boolean>
  update: (newValue: T) => void
  confirm: (confirmedValue?: T) => void
  rollback: () => void
  reset: () => void
}
```

---

## Progressive Enhancement

### `useProgressiveForm(options?)`

Enhance forms with progressive enhancement.

```typescript
function useProgressiveForm(options?: ProgressiveFormOptions): {
  formRef: (element: HTMLFormElement | null) => void
  isEnhanced: Signal<boolean>
  isSubmitting: Signal<boolean>
  save: () => void
  restore: () => void
  clearSaved: () => void
}

interface ProgressiveFormOptions {
  disableWhileLoading?: boolean
  showLoadingIndicator?: boolean
  preventMultipleSubmit?: boolean
  focusFirstError?: boolean
  persistToLocalStorage?: boolean
  storageKey?: string
  restoreFromLocalStorage?: boolean
}
```

### Utility Functions

```typescript
const isJSEnabled: Signal<boolean>
const isHydrated: Signal<boolean>

function isProgressivelyEnhanced(form: HTMLFormElement): boolean
function addJavaScriptMarker(): HTMLInputElement | null
function clientHasJavaScript(formData: FormData): boolean
function NoScript(props: { children: any }): VNode
function ClientOnly(props: { children: any, fallback?: any }): any
```

---

## Wizard System

### `createWizard(config)`

Create a multi-step wizard.

```typescript
function createWizard(config: WizardConfig): WizardController

interface WizardConfig {
  steps: WizardStep[]
  initialStep?: number
  allowJumpToStep?: boolean
  validateOnStepChange?: boolean
  persistKey?: string
  onStepChange?: (from: number, to: number) => void
  onComplete?: (data: Record<string, unknown>) => void | Promise<void>
}

interface WizardStep {
  id: string
  title: string
  description?: string
  icon?: string
  fields: string[]
  validate?: () => boolean | Promise<boolean>
  canSkip?: boolean
  condition?: (data: Record<string, unknown>) => boolean
}

interface WizardController {
  state: WizardState
  steps: WizardStep[]
  activeSteps: WizardStep[]
  currentStepData: WizardStep
  progress: number
  isFirstStep: boolean
  isLastStep: boolean
  canGoNext: boolean
  canGoPrev: boolean
  goToStep: (index: number) => Promise<boolean>
  nextStep: () => Promise<boolean>
  prevStep: () => Promise<boolean>
  skipStep: () => Promise<boolean>
  reset: () => void
  submit: () => Promise<void>
  setData: (key: string, value: unknown) => void
  getData: () => Record<string, unknown>
  validateCurrentStep: () => Promise<boolean>
}
```

### `useWizard(config)`

Hook version of createWizard.

```typescript
function useWizard(config: WizardConfig): WizardController
```

### Wizard Templates

```typescript
function createCheckoutWizard(options: {
  onComplete: (data: Record<string, unknown>) => Promise<void>
  hasShipping?: boolean
  hasBilling?: boolean
}): WizardConfig

function createSignupWizard(options: {
  onComplete: (data: Record<string, unknown>) => Promise<void>
  requireEmailVerification?: boolean
  hasProfileStep?: boolean
}): WizardConfig

function createSurveyWizard(
  questions: Array<{
    id: string
    title: string
    type: 'text' | 'choice' | 'rating' | 'multiselect'
    required?: boolean
  }>,
  onComplete: (data: Record<string, unknown>) => Promise<void>
): WizardConfig
```

### Helper Functions

```typescript
function getStepIndicatorData(props: StepIndicatorProps): Array<{
  step: WizardStep
  index: number
  status: 'completed' | 'current' | 'upcoming' | 'skipped'
  isClickable: boolean
}>

function calculateProgress(
  currentStep: number,
  totalSteps: number,
  completedSteps: Set<number>
): {
  percentage: number
  completedCount: number
  remainingCount: number
}

function getStepTransitionStyles(config: StepTransitionConfig): {
  enter: Record<string, string>
  enterActive: Record<string, string>
  exit: Record<string, string>
  exitActive: Record<string, string>
}
```

---

## Input Masking

### Core Functions

```typescript
function parseMaskPattern(pattern: string): MaskChar[]
function applyMask(value: string, pattern: string | MaskChar[]): MaskResult
function unmask(maskedValue: string, pattern: string | MaskChar[]): string

interface MaskResult {
  maskedValue: string
  rawValue: string
  isComplete: boolean
  isValid: boolean
}

const maskChars: Record<string, RegExp> = {
  '9': /\d/,           // Digit
  'a': /[a-zA-Z]/,     // Letter
  'A': /[A-Z]/,        // Uppercase letter
  '*': /[a-zA-Z0-9]/,  // Alphanumeric
  '#': /\d/,           // Digit (alias)
}
```

### Predefined Masks

```typescript
function phoneMask(value: string, options?: {
  format?: 'us' | 'international' | 'simple'
  countryCode?: string
}): MaskResult

function creditCardMask(value: string): MaskResult & { cardType: string | null }

function detectCardType(number: string): string | null
function luhnCheck(number: string): boolean

function currencyMask(value: string, options?: {
  symbol?: string
  symbolPosition?: 'prefix' | 'suffix'
  thousandsSeparator?: string
  decimalSeparator?: string
  decimalPlaces?: number
  allowNegative?: boolean
}): MaskResult

function dateMask(value: string, options?: {
  format?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY'
}): MaskResult & { date: Date | null }

function timeMask(value: string, options?: {
  format?: '12h' | '24h'
  showSeconds?: boolean
}): MaskResult

function ssnMask(value: string): MaskResult

function zipCodeMask(value: string, options?: {
  format?: 'us' | 'us-extended' | 'canada' | 'uk'
}): MaskResult
```

### Input Handler

```typescript
function createMaskInputHandler(
  maskFn: (value: string) => MaskResult,
  onChange: (result: MaskResult) => void
): MaskInputHandler

interface MaskInputHandler {
  onInput: (event: { target: { value: string } }) => void
  onKeyDown: (event: KeyboardEvent) => void
  onFocus: () => void
  onBlur: () => void
}
```

### Presets

```typescript
const maskPresets: {
  phone: { us: string, international: string }
  creditCard: { standard: string, amex: string }
  date: Record<string, string>
  time: Record<string, string>
  ssn: string
  zip: { us: string, usExtended: string }
}
```

---

## Auto-Save

### `createAutoSave(config)`

Create auto-save controller.

```typescript
function createAutoSave(config: AutoSaveConfig): AutoSaveController

interface AutoSaveConfig {
  key: string
  debounceMs?: number
  maxVersions?: number
  storage?: Storage
  encrypt?: boolean
  onSave?: (data: FormDraft) => void
  onRestore?: (data: FormDraft) => void
  onConflict?: (local: FormDraft, remote: FormDraft) => FormDraft
}

interface AutoSaveController {
  state: AutoSaveState
  save: () => Promise<void>
  restore: () => FormDraft | null
  clear: () => void
  getVersions: () => FormDraft[]
  restoreVersion: (version: number) => FormDraft | null
  setData: (data: Record<string, unknown>) => void
  markClean: () => void
  checkRecovery: () => boolean
  discardRecovery: () => void
}

interface FormDraft {
  id: string
  data: Record<string, unknown>
  timestamp: number
  version: number
  checksum: string
  metadata?: Record<string, unknown>
}

interface AutoSaveState {
  isDirty: boolean
  lastSaved: number | null
  isSaving: boolean
  hasRecovery: boolean
  versions: FormDraft[]
}
```

### `useAutoSave<T>(formData, config)`

React hook for auto-save.

```typescript
function useAutoSave<T extends Record<string, unknown>>(
  formData: T,
  config: AutoSaveConfig
): {
  controller: AutoSaveController
  hasRecovery: boolean
  recover: () => T | null
  discard: () => void
}
```

### Conflict Resolution

```typescript
function resolveConflict(
  local: FormDraft,
  remote: FormDraft,
  strategy: ConflictStrategy
): FormDraft

type ConflictStrategy = 'local' | 'remote' | 'merge' | 'manual'
```

### Storage Adapters

```typescript
function createIndexedDBStorage(dbName?: string): Promise<Storage>
function createSessionStorage(): Storage
```

### Helpers

```typescript
function formatDraftTimestamp(timestamp: number): string
function getRecoveryMessage(draft: FormDraft): string
```

---

## Types

### Core Types

```typescript
type FieldValue = string | number | boolean | File | File[] | null | undefined
type FormValues = Record<string, FieldValue>
type FieldError = string | null
type FormErrors<T extends FormValues> = { [K in keyof T]?: FieldError }
type TouchedFields<T extends FormValues> = { [K in keyof T]?: boolean }
```

### Validation Types

```typescript
interface ValidationRule<T = FieldValue> {
  validate: (value: T, values?: FormValues) => boolean | Promise<boolean>
  message: string
}

interface AsyncValidationRule<T = FieldValue> {
  validate: (value: T, allValues?: FormValues, context?: ValidationContext) => Promise<boolean>
  message: string | ((value: T) => string)
  debounce?: number
}

interface ConditionalRule<T = FieldValue> {
  when: (values: FormValues) => boolean
  rule: ValidationRule<T>
}

interface ValidationContext {
  fieldName: string
  touched: boolean
  dirty: boolean
  submitting: boolean
  submitted: boolean
  signal?: AbortSignal
}

interface CrossFieldRule {
  fields: string[]
  validate: (values: Record<string, FieldValue>) => boolean | Promise<boolean>
  message: string
  target?: string
}

interface ValidationSchema<T extends FormValues> {
  rules: { [K in keyof T]?: ValidationRule<T[K]> | ValidationRule<T[K]>[] }
  asyncRules?: { [K in keyof T]?: AsyncValidationRule<T[K]> | AsyncValidationRule<T[K]>[] }
  conditionalRules?: { [K in keyof T]?: ConditionalRule<T[K]>[] }
  crossFieldRules?: CrossFieldRule[]
  groups?: ValidationGroup[]
}

interface ValidationResult<T extends FormValues> {
  valid: boolean
  errors: FormErrors<T>
  warnings: FormErrors<T>
  fieldResults: Map<keyof T, FieldValidationResult>
}

interface FieldValidationResult {
  valid: boolean
  error?: string
  warning?: string
  asyncPending: boolean
}
```

### Form Types

```typescript
interface FieldConfig<T = FieldValue> {
  initialValue?: T
  required?: boolean | string
  validate?: ValidationRule<T> | ValidationRule<T>[]
  validateOn?: 'change' | 'blur' | 'submit'
  transform?: (value: T) => T
  disabled?: boolean
}

interface FormConfig<T extends FormValues> {
  initialValues?: Partial<T>
  validateOn?: 'change' | 'blur' | 'submit'
  onSubmit?: (values: T) => void | Promise<void>
  validateOnMount?: boolean
}

interface FieldState<T = FieldValue> {
  value: T
  error: FieldError
  touched: boolean
  dirty: boolean
  validating: boolean
}

interface FormState<T extends FormValues> {
  values: T
  errors: FormErrors<T>
  touched: TouchedFields<T>
  isValid: boolean
  isSubmitting: boolean
  isValidating: boolean
  isDirty: boolean
  submitCount: number
}
```

### Field Props Types

```typescript
interface BaseFieldProps<T = FieldValue> {
  name: string
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
  'aria-describedby'?: string
  value?: T
  error?: string | null
  touched?: boolean
  onChange?: (value: T) => void
  onBlur?: () => void
  onFocus?: () => void
}

type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'number'
```

### Wizard Types

```typescript
interface WizardStep {
  id: string
  title: string
  description?: string
  icon?: string
  fields: string[]
  validate?: () => boolean | Promise<boolean>
  canSkip?: boolean
  condition?: (data: Record<string, unknown>) => boolean
}

interface WizardState {
  currentStep: number
  visitedSteps: Set<number>
  completedSteps: Set<number>
  isSubmitting: boolean
  isValidating: boolean
  direction: 'forward' | 'backward'
  data: Record<string, unknown>
}

type TransitionDirection = 'forward' | 'backward'

interface StepTransitionConfig {
  direction: TransitionDirection
  duration?: number
  easing?: string
}
```

### Mask Types

```typescript
interface MaskConfig {
  pattern: string
  placeholder?: string
  guide?: boolean
  keepCharPositions?: boolean
  showMaskOnFocus?: boolean
  showMaskOnHover?: boolean
}

interface MaskResult {
  maskedValue: string
  rawValue: string
  isComplete: boolean
  isValid: boolean
}

type MaskChar = string | RegExp

interface MaskDefinition {
  pattern: MaskChar[]
  placeholder: string
  validator?: (value: string) => boolean
}
```

---

## Package Exports

```typescript
// Main entry
import {
  // Form management
  Form, createForm, useForm,

  // Validation
  validators, validateValue, zodValidator, createZodValidator,
  composeValidators, debounceValidation, patterns,

  // Advanced validation
  advancedValidators, SchemaValidator, createSchemaValidator,
  when, crossField, dependsOn, messageWithField,
  combineResults, formatErrors, hasErrors, getFirstError,

  // Fields
  TextField, TextAreaField, SelectField, CheckboxField,
  RadioField, FileField, NumberField, Field,

  // Form actions
  useFormAction, useFetcher,

  // Optimistic updates
  useOptimistic, useOptimisticValue,

  // Progressive enhancement
  useProgressiveForm, isProgressivelyEnhanced,
  addJavaScriptMarker, clientHasJavaScript,
  NoScript, ClientOnly, isJSEnabled, isHydrated,

  // Wizard
  createWizard, useWizard, getStepIndicatorData,
  calculateProgress, getStepTransitionStyles,
  createCheckoutWizard, createSignupWizard, createSurveyWizard,

  // Input masking
  parseMaskPattern, applyMask, unmask,
  phoneMask, creditCardMask, detectCardType, luhnCheck,
  currencyMask, dateMask, timeMask, ssnMask, zipCodeMask,
  createMaskInputHandler, maskChars, maskPresets,

  // Auto-save
  createAutoSave, useAutoSave, resolveConflict,
  createIndexedDBStorage, createSessionStorage,
  formatDraftTimestamp, getRecoveryMessage,
} from '@philjs/forms';

// Sub-entries
import { validators, zodValidator, patterns } from '@philjs/forms/validation';
import { TextField, SelectField, ... } from '@philjs/forms/fields';
```
