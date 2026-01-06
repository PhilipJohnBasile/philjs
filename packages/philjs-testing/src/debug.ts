/**
 * PhilJS Testing - Debug Utilities
 */

import { prettyDOM as dtlPrettyDOM } from '@testing-library/dom';

/**
 * Pretty print a DOM element
 */
export function prettyDOM(
  element?: Element | null,
  maxLength?: number,
  options?: any
): string {
  if (!element) {
    element = document.body;
  }

  return dtlPrettyDOM(element, maxLength, options) || '';
}

/**
 * Log DOM to console
 */
export function logDOM(
  element?: Element | null,
  maxLength?: number,
  options?: any
): void {
  console.log(prettyDOM(element, maxLength, options));
}

/**
 * Debug helper - logs container contents
 */
export function debug(
  element?: Element | null,
  maxLength?: number
): void {
  if (!element) {
    element = document.body;
  }

}

/**
 * Debug signals in the component
 */
export function debugSignals(element: Element): void {

  const signalElements = element.querySelectorAll('[data-signal]');

  if (signalElements.length === 0) {
  } else {
    signalElements.forEach((el, i) => {
      const name = el.getAttribute('data-signal');
      const value = el.textContent;
      console.log(`${i + 1}. ${name}: ${value}`);
    });
  }

}

/**
 * Debug accessibility tree
 */
export function debugA11y(element: Element): void {

  const roles = [
    'button', 'link', 'heading', 'textbox', 'checkbox', 'radio',
    'listbox', 'option', 'menu', 'menuitem', 'dialog', 'alert',
    'tab', 'tabpanel', 'tablist', 'navigation', 'main', 'banner',
    'contentinfo', 'complementary', 'form', 'search', 'region',
  ];

  for (const role of roles) {
    const elements = element.querySelectorAll(`[role="${role}"]`);
    const implicitElements = element.querySelectorAll(
      role === 'button' ? 'button' :
      role === 'link' ? 'a[href]' :
      role === 'textbox' ? 'input[type="text"], textarea' :
      role === 'checkbox' ? 'input[type="checkbox"]' :
      role === 'radio' ? 'input[type="radio"]' :
      role === 'heading' ? 'h1, h2, h3, h4, h5, h6' :
      ''
    );

    const allElements = new Set([...elements, ...implicitElements]);

    if (allElements.size > 0) {
      console.log(`\n${role} (${allElements.size}):`);
      allElements.forEach((el) => {
        const name = el.getAttribute('aria-label') ||
                    el.getAttribute('aria-labelledby') ||
                    el.textContent?.slice(0, 30) ||
                    '(no name)';
        console.log(`  - ${name}`);
      });
    }
  }

}

/**
 * Debug form state
 */
export function debugForm(form: HTMLFormElement): void {

  const formData = new FormData(form);

  formData.forEach((value, key) => {
    console.log(`  ${key}: ${value}`);
  });

  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach((input: Element) => {
    const name = (input as HTMLInputElement).name || input.id || '(unnamed)';
    const type = (input as HTMLInputElement).type || input.tagName.toLowerCase();
    const value = (input as HTMLInputElement).value;
    const validity = (input as HTMLInputElement).validity;

    let status = '✓';
    if (validity && !validity.valid) {
      status = `✗ (${validity.valueMissing ? 'required' : validity.typeMismatch ? 'type' : validity.patternMismatch ? 'pattern' : 'invalid'})`;
    }

    console.log(`  ${name} [${type}]: "${value}" ${status}`);
  });

}

/**
 * Take a DOM snapshot
 */
export function snapshot(element?: Element): string {
  const target = element || document.body;
  return target.innerHTML;
}

/**
 * Compare DOM snapshots
 */
export function compareSnapshots(before: string, after: string): { changed: boolean; diff: string } {
  if (before === after) {
    return { changed: false, diff: '' };
  }

  // Simple diff - show first difference
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');

  let diff = '';
  const maxLines = Math.max(beforeLines.length, afterLines.length);

  for (let i = 0; i < maxLines; i++) {
    if (beforeLines[i] !== afterLines[i]) {
      diff += `Line ${i + 1}:\n`;
      diff += `  - ${beforeLines[i] || '(removed)'}\n`;
      diff += `  + ${afterLines[i] || '(added)'}\n`;
    }
  }

  return { changed: true, diff };
}
