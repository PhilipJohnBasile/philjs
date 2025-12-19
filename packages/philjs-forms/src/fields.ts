/**
 * Form field components
 */

import { computed } from 'philjs-core/signals';
import type { FieldValue } from './types.js';

/**
 * Text input field
 */
export function TextField(props: {
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
  onChange: (value: string) => void;
  onBlur?: () => void;
  class?: string;
  errorClass?: string;
}) {
  const showError = computed(() => props.touched && props.error);

  return (
    <div class={props.class}>
      <input
        type={props.type || 'text'}
        name={props.name}
        value={props.value()}
        placeholder={props.placeholder}
        disabled={props.disabled}
        oninput={(e: InputEvent) => props.onChange((e.target as HTMLInputElement).value)}
        onblur={props.onBlur}
        class={showError() ? props.errorClass : ''}
        aria-invalid={showError() ? 'true' : 'false'}
        aria-describedby={showError() ? `${props.name}-error` : undefined}
      />
      {showError() && (
        <div id={`${props.name}-error`} class="error" role="alert">
          {props.error}
        </div>
      )}
    </div>
  );
}

/**
 * Textarea field
 */
export function TextAreaField(props: {
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  cols?: number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  class?: string;
  errorClass?: string;
}) {
  const showError = computed(() => props.touched && props.error);

  return (
    <div class={props.class}>
      <textarea
        name={props.name}
        value={props.value()}
        placeholder={props.placeholder}
        disabled={props.disabled}
        rows={props.rows}
        cols={props.cols}
        oninput={(e: InputEvent) => props.onChange((e.target as HTMLTextAreaElement).value)}
        onblur={props.onBlur}
        class={showError() ? props.errorClass : ''}
        aria-invalid={showError() ? 'true' : 'false'}
        aria-describedby={showError() ? `${props.name}-error` : undefined}
      />
      {showError() && (
        <div id={`${props.name}-error`} class="error" role="alert">
          {props.error}
        </div>
      )}
    </div>
  );
}

/**
 * Select field
 */
export function SelectField(props: {
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  class?: string;
  errorClass?: string;
}) {
  const showError = computed(() => props.touched && props.error);

  return (
    <div class={props.class}>
      <select
        name={props.name}
        value={props.value()}
        disabled={props.disabled}
        onchange={(e: Event) => props.onChange((e.target as HTMLSelectElement).value)}
        onblur={props.onBlur}
        class={showError() ? props.errorClass : ''}
        aria-invalid={showError() ? 'true' : 'false'}
        aria-describedby={showError() ? `${props.name}-error` : undefined}
      >
        {props.placeholder && (
          <option value="" disabled>
            {props.placeholder}
          </option>
        )}
        {props.options.map(option => (
          <option value={option.value}>{option.label}</option>
        ))}
      </select>
      {showError() && (
        <div id={`${props.name}-error`} class="error" role="alert">
          {props.error}
        </div>
      )}
    </div>
  );
}

/**
 * Checkbox field
 */
export function CheckboxField(props: {
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
  label?: string;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  onBlur?: () => void;
  class?: string;
  errorClass?: string;
}) {
  const showError = computed(() => props.touched && props.error);

  return (
    <div class={props.class}>
      <label>
        <input
          type="checkbox"
          name={props.name}
          checked={props.value()}
          disabled={props.disabled}
          onchange={(e: Event) => props.onChange((e.target as HTMLInputElement).checked)}
          onblur={props.onBlur}
          class={showError() ? props.errorClass : ''}
          aria-invalid={showError() ? 'true' : 'false'}
          aria-describedby={showError() ? `${props.name}-error` : undefined}
        />
        {props.label && <span>{props.label}</span>}
      </label>
      {showError() && (
        <div id={`${props.name}-error`} class="error" role="alert">
          {props.error}
        </div>
      )}
    </div>
  );
}

/**
 * Radio field group
 */
export function RadioField(props: {
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
  options: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
  class?: string;
  errorClass?: string;
}) {
  const showError = computed(() => props.touched && props.error);

  return (
    <div class={props.class} role="radiogroup">
      {props.options.map(option => (
        <label>
          <input
            type="radio"
            name={props.name}
            value={option.value}
            checked={props.value() === option.value}
            disabled={props.disabled}
            onchange={(e: Event) => props.onChange((e.target as HTMLInputElement).value)}
            onblur={props.onBlur}
            class={showError() ? props.errorClass : ''}
            aria-invalid={showError() ? 'true' : 'false'}
            aria-describedby={showError() ? `${props.name}-error` : undefined}
          />
          <span>{option.label}</span>
        </label>
      ))}
      {showError() && (
        <div id={`${props.name}-error`} class="error" role="alert">
          {props.error}
        </div>
      )}
    </div>
  );
}

/**
 * File input field
 */
export function FileField(props: {
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onChange: (value: File | File[] | null) => void;
  onBlur?: () => void;
  class?: string;
  errorClass?: string;
}) {
  const showError = computed(() => props.touched && props.error);

  return (
    <div class={props.class}>
      <input
        type="file"
        name={props.name}
        accept={props.accept}
        multiple={props.multiple}
        disabled={props.disabled}
        onchange={(e: Event) => {
          const files = (e.target as HTMLInputElement).files;
          if (!files || files.length === 0) {
            props.onChange(null);
          } else if (props.multiple) {
            props.onChange(Array.from(files));
          } else {
            props.onChange(files[0]);
          }
        }}
        onblur={props.onBlur}
        class={showError() ? props.errorClass : ''}
        aria-invalid={showError() ? 'true' : 'false'}
        aria-describedby={showError() ? `${props.name}-error` : undefined}
      />
      {showError() && (
        <div id={`${props.name}-error`} class="error" role="alert">
          {props.error}
        </div>
      )}
    </div>
  );
}

/**
 * Number input field
 */
export function NumberField(props: {
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  class?: string;
  errorClass?: string;
}) {
  const showError = computed(() => props.touched && props.error);

  return (
    <div class={props.class}>
      <input
        type="number"
        name={props.name}
        value={props.value()}
        placeholder={props.placeholder}
        disabled={props.disabled}
        min={props.min}
        max={props.max}
        step={props.step}
        oninput={(e: InputEvent) => {
          const value = (e.target as HTMLInputElement).value;
          props.onChange(value ? parseFloat(value) : 0);
        }}
        onblur={props.onBlur}
        class={showError() ? props.errorClass : ''}
        aria-invalid={showError() ? 'true' : 'false'}
        aria-describedby={showError() ? `${props.name}-error` : undefined}
      />
      {showError() && (
        <div id={`${props.name}-error`} class="error" role="alert">
          {props.error}
        </div>
      )}
    </div>
  );
}

/**
 * Form field wrapper with label
 */
export function Field(props: {
  name: string;
  label?: string;
  hint?: string;
  required?: boolean;
  children: any;
  class?: string;
}) {
  return (
    <div class={props.class || 'form-field'}>
      {props.label && (
        <label for={props.name}>
          {props.label}
          {props.required && <span class="required" aria-label="required">*</span>}
        </label>
      )}
      {props.hint && (
        <div class="hint" id={`${props.name}-hint`}>
          {props.hint}
        </div>
      )}
      {props.children}
    </div>
  );
}
