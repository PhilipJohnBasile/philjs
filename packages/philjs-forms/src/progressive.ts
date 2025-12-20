/**
 * Progressive Enhancement utilities
 *
 * Ensure forms work without JavaScript, then enhance with JS when available.
 */

import { signal, effect, type Signal } from 'philjs-core/signals';

/**
 * Detect if JavaScript is available
 */
export const isJSEnabled = signal(typeof window !== 'undefined');

/**
 * Detect if the page has been hydrated
 */
export const isHydrated = signal(false);

// Mark as hydrated when this module loads in browser
if (typeof window !== 'undefined') {
  // Wait for next tick to ensure everything is ready
  Promise.resolve().then(() => {
    isHydrated.set(true);
  });
}

/**
 * Progressive form enhancement options
 */
export interface ProgressiveFormOptions {
  /**
   * Disable form while JavaScript loads
   * @default false
   */
  disableWhileLoading?: boolean;

  /**
   * Show loading indicator
   * @default true
   */
  showLoadingIndicator?: boolean;

  /**
   * Prevent multiple submissions
   * @default true
   */
  preventMultipleSubmit?: boolean;

  /**
   * Auto-focus first error field
   * @default true
   */
  focusFirstError?: boolean;

  /**
   * Save form data to localStorage on change
   * @default false
   */
  persistToLocalStorage?: boolean;

  /**
   * LocalStorage key for persistence
   */
  storageKey?: string;

  /**
   * Restore from localStorage on mount
   * @default true
   */
  restoreFromLocalStorage?: boolean;
}

/**
 * Enhance a form with progressive enhancement
 *
 * @example
 * ```tsx
 * const { formRef, isEnhanced } = useProgressiveForm({
 *   preventMultipleSubmit: true,
 *   focusFirstError: true,
 *   persistToLocalStorage: true,
 *   storageKey: 'checkout-form'
 * });
 *
 * return (
 *   <form ref={formRef} action="/checkout" method="POST">
 *     <input name="email" required />
 *     <button>Checkout</button>
 *     {!isEnhanced() && <noscript>Form works without JavaScript</noscript>}
 *   </form>
 * );
 * ```
 */
export function useProgressiveForm(options: ProgressiveFormOptions = {}): {
  /**
   * Ref to attach to form element
   */
  formRef: (element: HTMLFormElement | null) => void;

  /**
   * Is the form enhanced with JavaScript?
   */
  isEnhanced: Signal<boolean>;

  /**
   * Is the form currently submitting?
   */
  isSubmitting: Signal<boolean>;

  /**
   * Save form data to localStorage
   */
  save: () => void;

  /**
   * Restore form data from localStorage
   */
  restore: () => void;

  /**
   * Clear saved data from localStorage
   */
  clearSaved: () => void;
} {
  const {
    disableWhileLoading = false,
    showLoadingIndicator = true,
    preventMultipleSubmit = true,
    focusFirstError = true,
    persistToLocalStorage = false,
    storageKey = 'philjs-form-data',
    restoreFromLocalStorage = true,
  } = options;

  const isEnhanced = signal(false);
  const isSubmitting = signal(false);
  let formElement: HTMLFormElement | null = null;

  /**
   * Save form data to localStorage
   */
  const save = () => {
    if (!formElement || !persistToLocalStorage) return;

    const formData = new FormData(formElement);
    const data: Record<string, any> = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save form data to localStorage:', err);
    }
  };

  /**
   * Restore form data from localStorage
   */
  const restore = () => {
    if (!formElement || !restoreFromLocalStorage) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;

      const data = JSON.parse(saved);

      // Restore values
      Object.entries(data).forEach(([key, value]) => {
        const input = formElement!.elements.namedItem(key) as HTMLInputElement;
        if (input && value) {
          input.value = String(value);
        }
      });
    } catch (err) {
      console.warn('Failed to restore form data from localStorage:', err);
    }
  };

  /**
   * Clear saved data
   */
  const clearSaved = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.warn('Failed to clear saved form data:', err);
    }
  };

  /**
   * Form ref callback
   */
  const formRef = (element: HTMLFormElement | null) => {
    formElement = element;

    if (!element) return;

    // Mark as enhanced
    isEnhanced.set(true);
    element.setAttribute('data-enhanced', 'true');

    // Disable while loading if requested
    if (disableWhileLoading && !isHydrated()) {
      element.setAttribute('aria-busy', 'true');
      const submitButton = element.querySelector('[type="submit"]') as HTMLButtonElement;
      if (submitButton) {
        submitButton.disabled = true;
      }
    }

    // Enable when hydrated
    effect(() => {
      if (isHydrated()) {
        element.removeAttribute('aria-busy');
        const submitButton = element.querySelector('[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });

    // Restore from localStorage
    if (restoreFromLocalStorage) {
      restore();
    }

    // Auto-save on change
    if (persistToLocalStorage) {
      element.addEventListener('change', save);
      element.addEventListener('input', save);
    }

    // Handle form submission
    element.addEventListener('submit', (e) => {
      // Prevent multiple submissions
      if (preventMultipleSubmit && isSubmitting()) {
        e.preventDefault();
        return;
      }

      isSubmitting.set(true);

      // Add loading indicator
      if (showLoadingIndicator) {
        element.setAttribute('aria-busy', 'true');
        const submitButton = element.querySelector('[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.setAttribute('data-loading', 'true');
        }
      }

      // Clear saved data on successful submit
      if (persistToLocalStorage) {
        clearSaved();
      }

      // Re-enable after submission completes (for native form submission)
      // For AJAX submissions, the handler should call isSubmitting.set(false)
      setTimeout(() => {
        isSubmitting.set(false);
        element.removeAttribute('aria-busy');
        const submitButton = element.querySelector('[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.removeAttribute('data-loading');
        }
      }, 100);
    });

    // Focus first error field
    if (focusFirstError) {
      element.addEventListener('invalid', (e) => {
        const firstInvalid = element.querySelector(':invalid') as HTMLElement;
        if (firstInvalid) {
          firstInvalid.focus();
        }
      }, true);
    }
  };

  return {
    formRef,
    isEnhanced,
    isSubmitting,
    save,
    restore,
    clearSaved,
  };
}

/**
 * Check if form will work without JavaScript
 *
 * @example
 * ```tsx
 * const willWork = isProgressivelyEnhanced(formElement);
 * ```
 */
export function isProgressivelyEnhanced(form: HTMLFormElement): boolean {
  // Check if form has action and method
  if (!form.action) {
    console.warn('Form has no action attribute - will not work without JS');
    return false;
  }

  if (!form.method) {
    console.warn('Form has no method attribute - will default to GET');
  }

  // Check if all required fields have name attributes
  const requiredFields = form.querySelectorAll('[required]');
  const missingNames = Array.from(requiredFields).filter(
    field => !(field as HTMLInputElement).name
  );

  if (missingNames.length > 0) {
    console.warn('Some required fields are missing name attributes:', missingNames);
    return false;
  }

  return true;
}

/**
 * Add hidden input with JavaScript availability marker
 *
 * Useful for server-side detection of whether JS is enabled.
 *
 * @example
 * ```tsx
 * <form action="/submit">
 *   {addJavaScriptMarker()}
 *   <input name="email" required />
 *   <button>Submit</button>
 * </form>
 * ```
 */
export function addJavaScriptMarker(): HTMLInputElement | null {
  if (typeof window === 'undefined') return null;

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = '_js';
  input.value = '1';
  return input;
}

/**
 * Detect if client supports JavaScript (server-side check)
 *
 * @example
 * ```ts
 * const formData = await request.formData();
 * const hasJS = clientHasJavaScript(formData);
 *
 * if (!hasJS) {
 *   // Redirect to success page instead of returning JSON
 *   return redirect('/success');
 * } else {
 *   // Return JSON for client-side handling
 *   return json({ success: true });
 * }
 * ```
 */
export function clientHasJavaScript(formData: FormData): boolean {
  return formData.has('_js') && formData.get('_js') === '1';
}

/**
 * NoScript component - shows content only when JavaScript is disabled
 *
 * @example
 * ```tsx
 * <NoScript>
 *   <p>This form works without JavaScript.</p>
 *   <p>You will be redirected to a confirmation page after submission.</p>
 * </NoScript>
 * ```
 */
export function NoScript(props: { children: any }) {
  return {
    type: 'noscript',
    props: {},
    children: props.children,
  };
}

/**
 * ClientOnly component - shows content only when JavaScript is enabled
 *
 * @example
 * ```tsx
 * <ClientOnly fallback={<p>Loading...</p>}>
 *   <InteractiveWidget />
 * </ClientOnly>
 * ```
 */
export function ClientOnly(props: {
  children: any;
  fallback?: any;
}) {
  const showContent = signal(false);

  // Show content only after hydration
  if (typeof window !== 'undefined') {
    Promise.resolve().then(() => {
      showContent.set(true);
    });
  }

  return showContent() ? props.children : (props.fallback || null);
}
