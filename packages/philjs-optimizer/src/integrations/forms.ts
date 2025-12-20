/**
 * Form lazy loading integration
 */

import type { LazyHandler } from '../types.js';
import { executeHandler } from '../runtime.js';
import { $ } from 'philjs-core/lazy-handlers';

/**
 * Lazy form handler
 */
export interface LazyFormHandler {
  symbolId: string;
  handler: (formData: FormData, event?: Event) => any;
  loaded: boolean;
}

/**
 * Create a lazy form submit handler
 */
export function lazySubmit(
  handler: (formData: FormData, event?: Event) => any
): LazyFormHandler {
  const lazy = $(handler);

  return {
    symbolId: lazy.symbolId,
    handler: lazy.handler,
    loaded: lazy.loaded,
  };
}

/**
 * Create a lazy form change handler
 */
export function lazyChange(
  handler: (value: any, name: string, event?: Event) => any
): LazyFormHandler {
  const lazy = $(handler);

  return {
    symbolId: lazy.symbolId,
    handler: lazy.handler as any,
    loaded: lazy.loaded,
  };
}

/**
 * Create a lazy form validation handler
 */
export function lazyValidate(
  handler: (value: any, values: any) => string | null
): LazyFormHandler {
  const lazy = $(handler);

  return {
    symbolId: lazy.symbolId,
    handler: lazy.handler as any,
    loaded: lazy.loaded,
  };
}

/**
 * Handle form submission with lazy loading
 */
export async function handleLazySubmit(
  event: Event,
  handler: LazyFormHandler
): Promise<any> {
  event.preventDefault();

  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);

  return executeHandler(handler.symbolId, [formData, event]);
}

/**
 * Enhanced form with lazy handlers
 */
export class LazyForm {
  private form: HTMLFormElement;
  private submitHandler?: LazyFormHandler;
  private changeHandlers = new Map<string, LazyFormHandler>();
  private validators = new Map<string, LazyFormHandler>();

  constructor(form: HTMLFormElement) {
    this.form = form;
  }

  /**
   * Set submit handler
   */
  onSubmit(handler: LazyFormHandler): this {
    this.submitHandler = handler;

    this.form.addEventListener('submit', async (event) => {
      if (this.submitHandler) {
        await handleLazySubmit(event, this.submitHandler);
      }
    });

    return this;
  }

  /**
   * Set change handler for a field
   */
  onChange(name: string, handler: LazyFormHandler): this {
    this.changeHandlers.set(name, handler);

    const field = this.form.elements.namedItem(name) as HTMLInputElement;
    if (field) {
      field.addEventListener('change', async (event) => {
        const handler = this.changeHandlers.get(name);
        if (handler) {
          await executeHandler(handler.symbolId, [
            field.value,
            name,
            event,
          ]);
        }
      });
    }

    return this;
  }

  /**
   * Set validator for a field
   */
  validate(name: string, handler: LazyFormHandler): this {
    this.validators.set(name, handler);
    return this;
  }

  /**
   * Run validation for a field
   */
  async validateField(name: string, value: any): Promise<string | null> {
    const validator = this.validators.get(name);
    if (!validator) {
      return null;
    }

    const values = this.getValues();
    return executeHandler(validator.symbolId, [value, values]);
  }

  /**
   * Run validation for all fields
   */
  async validateAll(): Promise<Record<string, string | null>> {
    const errors: Record<string, string | null> = {};
    const values = this.getValues();

    for (const [name, validator] of this.validators) {
      const value = values[name];
      const error = await executeHandler(validator.symbolId, [
        value,
        values,
      ]);
      errors[name] = error;
    }

    return errors;
  }

  /**
   * Get form values
   */
  getValues(): Record<string, any> {
    const formData = new FormData(this.form);
    const values: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      values[key] = value;
    }

    return values;
  }

  /**
   * Set form values
   */
  setValues(values: Record<string, any>): void {
    for (const [name, value] of Object.entries(values)) {
      const field = this.form.elements.namedItem(name) as HTMLInputElement;
      if (field) {
        field.value = value;
      }
    }
  }

  /**
   * Reset form
   */
  reset(): void {
    this.form.reset();
  }
}

/**
 * Create a lazy form instance
 */
export function createLazyForm(form: HTMLFormElement): LazyForm {
  return new LazyForm(form);
}
