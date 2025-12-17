/**
 * PhilJS Testing - Debug Utilities
 */
import { prettyDOM as dtlPrettyDOM } from '@testing-library/dom';
/**
 * Pretty print a DOM element
 */
export function prettyDOM(element, maxLength, options) {
    if (!element) {
        element = document.body;
    }
    return dtlPrettyDOM(element, maxLength, options) || '';
}
/**
 * Log DOM to console
 */
export function logDOM(element, maxLength, options) {
    console.log(prettyDOM(element, maxLength, options));
}
/**
 * Debug helper - logs container contents
 */
export function debug(element, maxLength) {
    if (!element) {
        element = document.body;
    }
    console.log('\n--- Debug Output ---');
    console.log(prettyDOM(element, maxLength));
    console.log('--------------------\n');
}
/**
 * Debug signals in the component
 */
export function debugSignals(element) {
    console.log('\n--- Signal Debug ---');
    const signalElements = element.querySelectorAll('[data-signal]');
    if (signalElements.length === 0) {
        console.log('No signals found in DOM');
    }
    else {
        signalElements.forEach((el, i) => {
            const name = el.getAttribute('data-signal');
            const value = el.textContent;
            console.log(`${i + 1}. ${name}: ${value}`);
        });
    }
    console.log('--------------------\n');
}
/**
 * Debug accessibility tree
 */
export function debugA11y(element) {
    console.log('\n--- Accessibility Debug ---');
    const roles = [
        'button', 'link', 'heading', 'textbox', 'checkbox', 'radio',
        'listbox', 'option', 'menu', 'menuitem', 'dialog', 'alert',
        'tab', 'tabpanel', 'tablist', 'navigation', 'main', 'banner',
        'contentinfo', 'complementary', 'form', 'search', 'region',
    ];
    for (const role of roles) {
        const elements = element.querySelectorAll(`[role="${role}"]`);
        const implicitElements = element.querySelectorAll(role === 'button' ? 'button' :
            role === 'link' ? 'a[href]' :
                role === 'textbox' ? 'input[type="text"], textarea' :
                    role === 'checkbox' ? 'input[type="checkbox"]' :
                        role === 'radio' ? 'input[type="radio"]' :
                            role === 'heading' ? 'h1, h2, h3, h4, h5, h6' :
                                '');
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
    console.log('\n---------------------------\n');
}
/**
 * Debug form state
 */
export function debugForm(form) {
    console.log('\n--- Form Debug ---');
    const formData = new FormData(form);
    console.log('Form values:');
    formData.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
    });
    const inputs = form.querySelectorAll('input, select, textarea');
    console.log('\nInput states:');
    inputs.forEach((input) => {
        const name = input.name || input.id || '(unnamed)';
        const type = input.type || input.tagName.toLowerCase();
        const value = input.value;
        const validity = input.validity;
        let status = '✓';
        if (validity && !validity.valid) {
            status = `✗ (${validity.valueMissing ? 'required' : validity.typeMismatch ? 'type' : validity.patternMismatch ? 'pattern' : 'invalid'})`;
        }
        console.log(`  ${name} [${type}]: "${value}" ${status}`);
    });
    console.log('\n------------------\n');
}
/**
 * Take a DOM snapshot
 */
export function snapshot(element) {
    const target = element || document.body;
    return target.innerHTML;
}
/**
 * Compare DOM snapshots
 */
export function compareSnapshots(before, after) {
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
//# sourceMappingURL=debug.js.map