/**
 * PhilJS Testing - Custom Matchers
 *
 * Jest/Vitest compatible matchers for DOM testing
 */
/**
 * Check if element is in the document
 */
export function toBeInTheDocument(element) {
    const pass = element !== null && document.body.contains(element);
    return {
        pass,
        message: () => pass
            ? `Expected element not to be in the document`
            : `Expected element to be in the document`,
    };
}
/**
 * Check if element has specific text content
 */
export function toHaveTextContent(element, expectedText) {
    if (!element) {
        return {
            pass: false,
            message: () => `Expected element to have text content, but element is null`,
        };
    }
    const actualText = element.textContent || '';
    const pass = typeof expectedText === 'string'
        ? actualText.includes(expectedText)
        : expectedText.test(actualText);
    return {
        pass,
        message: () => pass
            ? `Expected element not to have text content "${expectedText}"`
            : `Expected element to have text content "${expectedText}", but got "${actualText}"`,
    };
}
/**
 * Check if element is visible
 */
export function toBeVisible(element) {
    if (!element) {
        return {
            pass: false,
            message: () => `Expected element to be visible, but element is null`,
        };
    }
    const style = getComputedStyle(element);
    const isVisible = style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        element.offsetParent !== null;
    return {
        pass: isVisible,
        message: () => isVisible
            ? `Expected element not to be visible`
            : `Expected element to be visible`,
    };
}
/**
 * Check if element is disabled
 */
export function toBeDisabled(element) {
    if (!element) {
        return {
            pass: false,
            message: () => `Expected element to be disabled, but element is null`,
        };
    }
    const isDisabled = element.disabled === true ||
        element.getAttribute('aria-disabled') === 'true' ||
        element.hasAttribute('disabled');
    return {
        pass: isDisabled,
        message: () => isDisabled
            ? `Expected element not to be disabled`
            : `Expected element to be disabled`,
    };
}
/**
 * Check if element is enabled
 */
export function toBeEnabled(element) {
    const result = toBeDisabled(element);
    return {
        pass: !result.pass,
        message: () => result.pass
            ? `Expected element to be enabled`
            : `Expected element not to be enabled`,
    };
}
/**
 * Check if element has specific attribute
 */
export function toHaveAttribute(element, attribute, value) {
    if (!element) {
        return {
            pass: false,
            message: () => `Expected element to have attribute "${attribute}", but element is null`,
        };
    }
    const hasAttribute = element.hasAttribute(attribute);
    const actualValue = element.getAttribute(attribute);
    const pass = value !== undefined
        ? hasAttribute && actualValue === value
        : hasAttribute;
    return {
        pass,
        message: () => pass
            ? value !== undefined
                ? `Expected element not to have attribute "${attribute}" with value "${value}"`
                : `Expected element not to have attribute "${attribute}"`
            : value !== undefined
                ? `Expected element to have attribute "${attribute}" with value "${value}", but got "${actualValue}"`
                : `Expected element to have attribute "${attribute}"`,
    };
}
/**
 * Check if element has specific class
 */
export function toHaveClass(element, ...classNames) {
    if (!element) {
        return {
            pass: false,
            message: () => `Expected element to have class, but element is null`,
        };
    }
    const missingClasses = classNames.filter(cls => !element.classList.contains(cls));
    const pass = missingClasses.length === 0;
    return {
        pass,
        message: () => pass
            ? `Expected element not to have classes "${classNames.join(', ')}"`
            : `Expected element to have classes "${classNames.join(', ')}", missing: "${missingClasses.join(', ')}"`,
    };
}
/**
 * Check if element has specific style
 */
export function toHaveStyle(element, styles) {
    if (!element) {
        return {
            pass: false,
            message: () => `Expected element to have style, but element is null`,
        };
    }
    const computedStyle = getComputedStyle(element);
    const mismatches = [];
    for (const [prop, expectedValue] of Object.entries(styles)) {
        const actualValue = computedStyle.getPropertyValue(prop) ||
            computedStyle[prop];
        if (actualValue !== expectedValue) {
            mismatches.push(`${prop}: expected "${expectedValue}", got "${actualValue}"`);
        }
    }
    const pass = mismatches.length === 0;
    return {
        pass,
        message: () => pass
            ? `Expected element not to have specified styles`
            : `Style mismatches: ${mismatches.join('; ')}`,
    };
}
/**
 * Check if element has focus
 */
export function toHaveFocus(element) {
    const pass = element !== null && document.activeElement === element;
    return {
        pass,
        message: () => pass
            ? `Expected element not to have focus`
            : `Expected element to have focus`,
    };
}
/**
 * Check if form element has specific value
 */
export function toHaveValue(element, expectedValue) {
    if (!element) {
        return {
            pass: false,
            message: () => `Expected element to have value, but element is null`,
        };
    }
    let actualValue;
    if (element instanceof HTMLSelectElement && element.multiple) {
        actualValue = Array.from(element.selectedOptions).map(opt => opt.value);
    }
    else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        actualValue = element.value;
    }
    else {
        actualValue = element.value;
    }
    const pass = Array.isArray(expectedValue)
        ? Array.isArray(actualValue) &&
            expectedValue.length === actualValue.length &&
            expectedValue.every((v, i) => v === actualValue[i])
        : actualValue === String(expectedValue);
    return {
        pass,
        message: () => pass
            ? `Expected element not to have value "${expectedValue}"`
            : `Expected element to have value "${expectedValue}", but got "${actualValue}"`,
    };
}
/**
 * Check if checkbox/radio is checked
 */
export function toBeChecked(element) {
    if (!element) {
        return {
            pass: false,
            message: () => `Expected element to be checked, but element is null`,
        };
    }
    const isChecked = element.checked === true ||
        element.getAttribute('aria-checked') === 'true';
    return {
        pass: isChecked,
        message: () => isChecked
            ? `Expected element not to be checked`
            : `Expected element to be checked`,
    };
}
/**
 * Check if element is empty
 */
export function toBeEmptyDOMElement(element) {
    if (!element) {
        return {
            pass: false,
            message: () => `Expected element to be empty, but element is null`,
        };
    }
    const isEmpty = element.innerHTML.trim() === '';
    return {
        pass: isEmpty,
        message: () => isEmpty
            ? `Expected element not to be empty`
            : `Expected element to be empty`,
    };
}
//# sourceMappingURL=matchers.js.map