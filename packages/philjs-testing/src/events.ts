/**
 * PhilJS Testing - Event Utilities
 */

import { fireEvent as dtlFireEvent, createEvent as dtlCreateEvent } from '@testing-library/dom';

// Re-export from @testing-library/dom
export const fireEvent = dtlFireEvent;
export const createEvent = dtlCreateEvent;

/**
 * Extended fireEvent with PhilJS-specific event handling
 */
export const fire = {
  ...dtlFireEvent,

  /**
   * Fire input event with value change
   */
  inputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    // Set the value
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
    } else {
      element.value = value;
    }

    // Dispatch input event
    dtlFireEvent.input(element, { target: { value } });
  },

  /**
   * Fire change event with value
   */
  changeValue(element: HTMLElement, value: string): void {
    dtlFireEvent.change(element, { target: { value } });
  },

  /**
   * Fire select change event
   */
  selectOption(element: HTMLSelectElement, value: string): void {
    element.value = value;
    dtlFireEvent.change(element, { target: { value } });
  },

  /**
   * Fire checkbox toggle
   */
  toggleCheckbox(element: HTMLInputElement): void {
    element.checked = !element.checked;
    dtlFireEvent.click(element);
    dtlFireEvent.change(element, { target: { checked: element.checked } });
  },

  /**
   * Fire form submission
   */
  submitForm(form: HTMLFormElement): void {
    dtlFireEvent.submit(form);
  },

  /**
   * Fire keyboard events for a key sequence
   */
  type(element: HTMLElement, text: string): void {
    element.focus();

    for (const char of text) {
      dtlFireEvent.keyDown(element, { key: char });
      dtlFireEvent.keyPress(element, { key: char });

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value += char;
        dtlFireEvent.input(element, { target: { value: element.value } });
      }

      dtlFireEvent.keyUp(element, { key: char });
    }
  },

  /**
   * Fire special key
   */
  pressKey(element: HTMLElement, key: string, options: KeyboardEventInit = {}): void {
    dtlFireEvent.keyDown(element, { key, ...options });
    dtlFireEvent.keyUp(element, { key, ...options });
  },

  /**
   * Simulate Enter key press
   */
  pressEnter(element: HTMLElement): void {
    fire.pressKey(element, 'Enter', { code: 'Enter' });
  },

  /**
   * Simulate Escape key press
   */
  pressEscape(element: HTMLElement): void {
    fire.pressKey(element, 'Escape', { code: 'Escape' });
  },

  /**
   * Simulate Tab key press
   */
  pressTab(element: HTMLElement, shiftKey = false): void {
    fire.pressKey(element, 'Tab', { code: 'Tab', shiftKey });
  },

  /**
   * Fire hover events
   */
  hover(element: HTMLElement): void {
    dtlFireEvent.mouseOver(element);
    dtlFireEvent.mouseEnter(element);
  },

  /**
   * Fire unhover events
   */
  unhover(element: HTMLElement): void {
    dtlFireEvent.mouseOut(element);
    dtlFireEvent.mouseLeave(element);
  },

  /**
   * Fire focus events
   */
  focus(element: HTMLElement): void {
    dtlFireEvent.focus(element);
    dtlFireEvent.focusIn(element);
  },

  /**
   * Fire blur events
   */
  blur(element: HTMLElement): void {
    dtlFireEvent.blur(element);
    dtlFireEvent.focusOut(element);
  },

  /**
   * Fire drag and drop sequence
   */
  dragAndDrop(source: HTMLElement, target: HTMLElement): void {
    const dataTransfer = new DataTransfer();

    dtlFireEvent.dragStart(source, { dataTransfer });
    dtlFireEvent.drag(source, { dataTransfer });
    dtlFireEvent.dragEnter(target, { dataTransfer });
    dtlFireEvent.dragOver(target, { dataTransfer });
    dtlFireEvent.drop(target, { dataTransfer });
    dtlFireEvent.dragEnd(source, { dataTransfer });
  },
};
