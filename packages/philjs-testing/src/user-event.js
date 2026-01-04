/**
 * PhilJS Testing - User Event Simulation
 *
 * High-level user interaction simulation similar to @testing-library/user-event
 */
import { fireEvent } from './events.js';
/**
 * Create a user event instance
 */
export function userEvent(options = {}) {
    const { delay = 0 } = options;
    async function wait() {
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return {
        /**
         * Click an element
         */
        async click(element) {
            if (!options.skipHover) {
                fireEvent.pointerOver(element);
                fireEvent.mouseOver(element);
            }
            fireEvent.pointerMove(element);
            fireEvent.mouseMove(element);
            fireEvent.pointerDown(element, { button: 0 });
            fireEvent.mouseDown(element, { button: 0 });
            await wait();
            if (element.focus) {
                element.focus();
            }
            fireEvent.pointerUp(element, { button: 0 });
            fireEvent.mouseUp(element, { button: 0 });
            fireEvent.click(element, { button: 0 });
        },
        /**
         * Double click an element
         */
        async dblClick(element) {
            await this.click(element);
            await wait();
            await this.click(element);
            fireEvent.dblClick(element);
        },
        /**
         * Triple click an element (selects all text)
         */
        async tripleClick(element) {
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
        async type(element, text, typeOptions = {}) {
            const { skipClick = false, initialSelectionStart, initialSelectionEnd, } = typeOptions;
            if (!skipClick) {
                await this.click(element);
            }
            const inputElement = element;
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
        async clear(element) {
            const inputElement = element;
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
        async selectOptions(element, values) {
            const selectElement = element;
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
        async deselectOptions(element, values) {
            const selectElement = element;
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
        async upload(element, files) {
            const inputElement = element;
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
        async hover(element) {
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
        async unhover(element) {
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
        async tab(options = {}) {
            const { shift = false } = options;
            const activeElement = document.activeElement;
            if (activeElement) {
                fireEvent.keyDown(activeElement, { key: 'Tab', shiftKey: shift });
            }
            // Get all focusable elements
            const focusable = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const focusableArray = Array.from(focusable).filter(el => !el.hidden && el.disabled !== true);
            if (focusableArray.length === 0)
                return;
            const currentIndex = focusableArray.indexOf(activeElement);
            let nextIndex;
            if (shift) {
                nextIndex = currentIndex <= 0 ? focusableArray.length - 1 : currentIndex - 1;
            }
            else {
                nextIndex = currentIndex >= focusableArray.length - 1 ? 0 : currentIndex + 1;
            }
            const nextElement = focusableArray[nextIndex];
            nextElement.focus();
            if (activeElement) {
                fireEvent.keyUp(activeElement, { key: 'Tab', shiftKey: shift });
            }
        },
        /**
         * Simulate keyboard input
         */
        async keyboard(text) {
            const activeElement = document.activeElement || document.body;
            // Parse keyboard sequence
            const keys = parseKeyboardSequence(text);
            for (const key of keys) {
                await wait();
                const eventInit = {
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
        async copy() {
            const activeElement = document.activeElement || document.body;
            fireEvent.copy(activeElement);
        },
        /**
         * Cut selected text
         */
        async cut() {
            const activeElement = document.activeElement || document.body;
            fireEvent.cut(activeElement);
        },
        /**
         * Paste text
         */
        async paste(text) {
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
                const input = activeElement;
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
        async pointer(actions) {
            const actionsArray = Array.isArray(actions) ? actions : [actions];
            for (const action of actionsArray) {
                await wait();
                if (action.target) {
                    const eventInit = {
                        pointerId: action.pointerId ?? 1,
                        pointerType: action.pointerType ?? 'mouse',
                        button: action.button ?? 0,
                        ...(action.coords?.x !== undefined && { clientX: action.coords.x }),
                        ...(action.coords?.y !== undefined && { clientY: action.coords.y }),
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
function parseKeyboardSequence(text) {
    const keys = [];
    const keyMap = {
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
    let currentModifiers = [];
    while (i < text.length) {
        if (text[i] === '{') {
            const endIndex = text.indexOf('}', i);
            if (endIndex === -1)
                break;
            const content = text.slice(i + 1, endIndex);
            let keyName = content;
            let action = 'press';
            // Check for modifiers and actions
            if (content.endsWith('>')) {
                keyName = content.slice(0, -1);
                action = 'down';
                if (keyMap[keyName]) {
                    currentModifiers.push(keyName);
                }
            }
            else if (content.startsWith('/')) {
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
        }
        else {
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
export function setup(options = {}) {
    return userEvent(options);
}
//# sourceMappingURL=user-event.js.map