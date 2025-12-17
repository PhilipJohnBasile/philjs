/**
 * PhilJS Testing - User Event Simulation
 *
 * High-level user interaction simulation similar to @testing-library/user-event
 */

import { fireEvent } from './events';

export interface UserEventOptions {
  delay?: number;
  skipHover?: boolean;
  skipClick?: boolean;
}

export interface TypeOptions extends UserEventOptions {
  skipAutoClose?: boolean;
  initialSelectionStart?: number;
  initialSelectionEnd?: number;
}

/**
 * Create a user event instance
 */
export function userEvent(options: UserEventOptions = {}) {
  const { delay = 0 } = options;

  async function wait(): Promise<void> {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    /**
     * Click an element
     */
    async click(element: Element): Promise<void> {
      if (!options.skipHover) {
        fireEvent.pointerOver(element);
        fireEvent.mouseOver(element);
      }

      fireEvent.pointerMove(element);
      fireEvent.mouseMove(element);
      fireEvent.pointerDown(element, { button: 0 });
      fireEvent.mouseDown(element, { button: 0 });

      await wait();

      if ((element as HTMLElement).focus) {
        (element as HTMLElement).focus();
      }

      fireEvent.pointerUp(element, { button: 0 });
      fireEvent.mouseUp(element, { button: 0 });
      fireEvent.click(element, { button: 0 });
    },

    /**
     * Double click an element
     */
    async dblClick(element: Element): Promise<void> {
      await this.click(element);
      await wait();
      await this.click(element);
      fireEvent.dblClick(element);
    },

    /**
     * Triple click an element (selects all text)
     */
    async tripleClick(element: Element): Promise<void> {
      await this.click(element);
      await wait();
      await this.click(element);
      await wait();
      await this.click(element);

      // Select all text in input/textarea
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.select();
      }
    },

    /**
     * Type text into an element
     */
    async type(element: Element, text: string, typeOptions: TypeOptions = {}): Promise<void> {
      const {
        skipClick = false,
        initialSelectionStart,
        initialSelectionEnd,
      } = typeOptions;

      if (!skipClick) {
        await this.click(element);
      }

      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;

      // Set initial selection if specified
      if (initialSelectionStart !== undefined) {
        inputElement.selectionStart = initialSelectionStart;
        inputElement.selectionEnd = initialSelectionEnd ?? initialSelectionStart;
      }

      // Process each character
      for (const char of text) {
        await wait();

        // Handle special characters
        if (char === '{') {
          const endIndex = text.indexOf('}', text.indexOf(char));
          if (endIndex > -1) {
            const key = text.slice(text.indexOf(char) + 1, endIndex);
            await this.keyboard(`{${key}}`);
            continue;
          }
        }

        // Regular character
        fireEvent.keyDown(element, { key: char });
        fireEvent.keyPress(element, { key: char });

        // Update value
        if (inputElement.value !== undefined) {
          const start = inputElement.selectionStart ?? inputElement.value.length;
          const end = inputElement.selectionEnd ?? inputElement.value.length;
          const before = inputElement.value.slice(0, start);
          const after = inputElement.value.slice(end);

          inputElement.value = before + char + after;
          inputElement.selectionStart = inputElement.selectionEnd = start + 1;

          fireEvent.input(element, { inputType: 'insertText', data: char });
        }

        fireEvent.keyUp(element, { key: char });
      }

      fireEvent.change(element);
    },

    /**
     * Clear an input element
     */
    async clear(element: Element): Promise<void> {
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;

      await this.click(element);
      await this.tripleClick(element);

      if (inputElement.value !== undefined) {
        inputElement.value = '';
        fireEvent.input(element, { inputType: 'deleteContentBackward' });
        fireEvent.change(element);
      }
    },

    /**
     * Select options in a select element
     */
    async selectOptions(element: Element, values: string | string[]): Promise<void> {
      const selectElement = element as HTMLSelectElement;
      const valuesArray = Array.isArray(values) ? values : [values];

      await this.click(element);

      for (const option of selectElement.options) {
        const shouldSelect = valuesArray.includes(option.value) || valuesArray.includes(option.text);
        option.selected = shouldSelect;
      }

      fireEvent.change(element);
    },

    /**
     * Deselect options in a multi-select
     */
    async deselectOptions(element: Element, values: string | string[]): Promise<void> {
      const selectElement = element as HTMLSelectElement;
      const valuesArray = Array.isArray(values) ? values : [values];

      for (const option of selectElement.options) {
        if (valuesArray.includes(option.value) || valuesArray.includes(option.text)) {
          option.selected = false;
        }
      }

      fireEvent.change(element);
    },

    /**
     * Upload files to a file input
     */
    async upload(element: Element, files: File | File[]): Promise<void> {
      const inputElement = element as HTMLInputElement;
      const fileList = Array.isArray(files) ? files : [files];

      // Create a DataTransfer to build FileList
      const dataTransfer = new DataTransfer();
      fileList.forEach(file => dataTransfer.items.add(file));

      Object.defineProperty(inputElement, 'files', {
        value: dataTransfer.files,
        writable: false,
      });

      fireEvent.change(element);
    },

    /**
     * Hover over an element
     */
    async hover(element: Element): Promise<void> {
      fireEvent.pointerOver(element);
      fireEvent.pointerEnter(element);
      fireEvent.mouseOver(element);
      fireEvent.mouseEnter(element);
      fireEvent.pointerMove(element);
      fireEvent.mouseMove(element);
    },

    /**
     * Unhover from an element
     */
    async unhover(element: Element): Promise<void> {
      fireEvent.pointerMove(element);
      fireEvent.mouseMove(element);
      fireEvent.pointerOut(element);
      fireEvent.pointerLeave(element);
      fireEvent.mouseOut(element);
      fireEvent.mouseLeave(element);
    },

    /**
     * Tab to next focusable element
     */
    async tab(options: { shift?: boolean } = {}): Promise<void> {
      const { shift = false } = options;
      const activeElement = document.activeElement;

      if (activeElement) {
        fireEvent.keyDown(activeElement, { key: 'Tab', shiftKey: shift });
      }

      // Get all focusable elements
      const focusable = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const focusableArray = Array.from(focusable).filter(
        el => !(el as HTMLElement).hidden && (el as HTMLButtonElement).disabled !== true
      );

      if (focusableArray.length === 0) return;

      const currentIndex = focusableArray.indexOf(activeElement as Element);
      let nextIndex: number;

      if (shift) {
        nextIndex = currentIndex <= 0 ? focusableArray.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex >= focusableArray.length - 1 ? 0 : currentIndex + 1;
      }

      const nextElement = focusableArray[nextIndex] as HTMLElement;
      nextElement.focus();

      if (activeElement) {
        fireEvent.keyUp(activeElement, { key: 'Tab', shiftKey: shift });
      }
    },

    /**
     * Simulate keyboard input
     */
    async keyboard(text: string): Promise<void> {
      const activeElement = document.activeElement || document.body;

      // Parse keyboard sequence
      const keys = parseKeyboardSequence(text);

      for (const key of keys) {
        await wait();

        const eventInit: KeyboardEventInit = {
          key: key.key,
          code: key.code,
          shiftKey: key.modifiers.includes('Shift'),
          ctrlKey: key.modifiers.includes('Control'),
          altKey: key.modifiers.includes('Alt'),
          metaKey: key.modifiers.includes('Meta'),
        };

        if (key.action === 'down' || key.action === 'press') {
          fireEvent.keyDown(activeElement, eventInit);
        }

        if (key.action === 'up' || key.action === 'press') {
          fireEvent.keyUp(activeElement, eventInit);
        }
      }
    },

    /**
     * Copy selected text
     */
    async copy(): Promise<void> {
      const activeElement = document.activeElement || document.body;
      fireEvent.copy(activeElement);
    },

    /**
     * Cut selected text
     */
    async cut(): Promise<void> {
      const activeElement = document.activeElement || document.body;
      fireEvent.cut(activeElement);
    },

    /**
     * Paste text
     */
    async paste(text?: string): Promise<void> {
      const activeElement = document.activeElement || document.body;

      const clipboardData = new DataTransfer();
      if (text) {
        clipboardData.setData('text/plain', text);
      }

      const event = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData,
      });

      activeElement.dispatchEvent(event);

      // If paste wasn't prevented and we have an input, insert the text
      if (!event.defaultPrevented && text) {
        const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
        if (input.value !== undefined) {
          const start = input.selectionStart ?? input.value.length;
          const end = input.selectionEnd ?? input.value.length;
          input.value = input.value.slice(0, start) + text + input.value.slice(end);
          input.selectionStart = input.selectionEnd = start + text.length;
          fireEvent.input(activeElement, { inputType: 'insertFromPaste' });
        }
      }
    },

    /**
     * Pointer events
     */
    async pointer(actions: PointerAction | PointerAction[]): Promise<void> {
      const actionsArray = Array.isArray(actions) ? actions : [actions];

      for (const action of actionsArray) {
        await wait();

        if (action.target) {
          const eventInit: PointerEventInit = {
            pointerId: action.pointerId ?? 1,
            pointerType: action.pointerType ?? 'mouse',
            button: action.button ?? 0,
            clientX: action.coords?.x,
            clientY: action.coords?.y,
          };

          switch (action.keys) {
            case '[MouseLeft]':
              fireEvent.pointerDown(action.target, eventInit);
              fireEvent.pointerUp(action.target, eventInit);
              break;
            case '[MouseLeft>]':
              fireEvent.pointerDown(action.target, eventInit);
              break;
            case '[/MouseLeft]':
              fireEvent.pointerUp(action.target, eventInit);
              break;
            default:
              fireEvent.pointerMove(action.target, eventInit);
          }
        }
      }
    },
  };
}

/**
 * Pointer action configuration
 */
interface PointerAction {
  target?: Element;
  keys?: string;
  pointerId?: number;
  pointerType?: 'mouse' | 'pen' | 'touch';
  button?: number;
  coords?: { x: number; y: number };
}

/**
 * Parse keyboard sequence string
 */
interface ParsedKey {
  key: string;
  code: string;
  action: 'press' | 'down' | 'up';
  modifiers: string[];
}

function parseKeyboardSequence(text: string): ParsedKey[] {
  const keys: ParsedKey[] = [];
  const keyMap: Record<string, { key: string; code: string }> = {
    Enter: { key: 'Enter', code: 'Enter' },
    Tab: { key: 'Tab', code: 'Tab' },
    Escape: { key: 'Escape', code: 'Escape' },
    Backspace: { key: 'Backspace', code: 'Backspace' },
    Delete: { key: 'Delete', code: 'Delete' },
    ArrowUp: { key: 'ArrowUp', code: 'ArrowUp' },
    ArrowDown: { key: 'ArrowDown', code: 'ArrowDown' },
    ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft' },
    ArrowRight: { key: 'ArrowRight', code: 'ArrowRight' },
    Home: { key: 'Home', code: 'Home' },
    End: { key: 'End', code: 'End' },
    PageUp: { key: 'PageUp', code: 'PageUp' },
    PageDown: { key: 'PageDown', code: 'PageDown' },
    Space: { key: ' ', code: 'Space' },
    Shift: { key: 'Shift', code: 'ShiftLeft' },
    Control: { key: 'Control', code: 'ControlLeft' },
    Alt: { key: 'Alt', code: 'AltLeft' },
    Meta: { key: 'Meta', code: 'MetaLeft' },
  };

  let i = 0;
  let currentModifiers: string[] = [];

  while (i < text.length) {
    if (text[i] === '{') {
      const endIndex = text.indexOf('}', i);
      if (endIndex === -1) break;

      const content = text.slice(i + 1, endIndex);
      let keyName = content;
      let action: 'press' | 'down' | 'up' = 'press';

      // Check for modifiers and actions
      if (content.endsWith('>')) {
        keyName = content.slice(0, -1);
        action = 'down';
        if (keyMap[keyName]) {
          currentModifiers.push(keyName);
        }
      } else if (content.startsWith('/')) {
        keyName = content.slice(1);
        action = 'up';
        currentModifiers = currentModifiers.filter(m => m !== keyName);
      }

      const mapped = keyMap[keyName] || { key: keyName, code: keyName };

      keys.push({
        key: mapped.key,
        code: mapped.code,
        action,
        modifiers: [...currentModifiers],
      });

      i = endIndex + 1;
    } else {
      // Regular character
      const char = text[i];
      keys.push({
        key: char,
        code: `Key${char.toUpperCase()}`,
        action: 'press',
        modifiers: [...currentModifiers],
      });
      i++;
    }
  }

  return keys;
}

/**
 * Default user event instance
 */
export const user = userEvent();

/**
 * Setup function for creating custom user event instances
 */
export function setup(options: UserEventOptions = {}): ReturnType<typeof userEvent> {
  return userEvent(options);
}
