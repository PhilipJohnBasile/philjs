/**
 * Global stylesheet registry
 */
class StyleRegistry {
    styles = new Map();
    counter = 0;
    /**
     * Register a style and return a unique class name
     */
    register(css) {
        // Check if this exact CSS already exists
        for (const [className, existingCss] of this.styles.entries()) {
            if (existingCss === css) {
                return className;
            }
        }
        // Generate new class name
        const className = `css-${this.counter++}`;
        this.styles.set(className, css);
        return className;
    }
    /**
     * Get all registered styles as CSS string
     */
    getStyles() {
        return Array.from(this.styles.entries())
            .map(([className, css]) => `.${className} { ${css} }`)
            .join('\n');
    }
    /**
     * Clear all styles
     */
    reset() {
        this.styles.clear();
        this.counter = 0;
    }
    /**
     * Get style for specific class
     */
    getStyle(className) {
        return this.styles.get(className);
    }
}
export const styleRegistry = new StyleRegistry();
/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}
/**
 * Convert a CSS value to string
 */
function valueToString(value) {
    if (typeof value === 'number') {
        // Properties that should not have units
        const unitlessProps = new Set([
            'opacity',
            'z-index',
            'font-weight',
            'line-height',
            'flex',
            'flex-grow',
            'flex-shrink',
            'order'
        ]);
        return unitlessProps.has(camelToKebab(String(value))) ? String(value) : `${value}px`;
    }
    return value;
}
function processStyleObject(obj, parentSelector = '') {
    const rules = [];
    const properties = [];
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null)
            continue;
        // Handle nested selectors (pseudo, combinators, etc.)
        if (key.startsWith('&') || key.startsWith('@')) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                // Handle media queries and other @ rules
                if (key.startsWith('@media') || key.startsWith('@supports') || key.startsWith('@container')) {
                    const nestedRules = processStyleObject(value, parentSelector);
                    rules.push({
                        selector: key,
                        css: nestedRules.map(r => `${r.selector} { ${r.css} }`).join(' ')
                    });
                }
                else {
                    // Handle pseudo selectors and combinators
                    const selector = parentSelector + key.replace('&', '');
                    const nestedRules = processStyleObject(value, selector);
                    rules.push(...nestedRules);
                }
            }
        }
        else {
            // Regular CSS property
            const cssKey = camelToKebab(key);
            const cssValue = valueToString(value);
            properties.push(`${cssKey}: ${cssValue};`);
        }
    }
    if (properties.length > 0) {
        rules.unshift({
            selector: parentSelector || '&',
            css: properties.join(' ')
        });
    }
    return rules;
}
/**
 * Generate complete CSS from style object
 */
function generateCSS(styleObj, className) {
    const rules = processStyleObject(styleObj);
    const cssBlocks = [];
    for (const rule of rules) {
        const selector = rule.selector.replace('&', `.${className}`);
        // Handle @ rules (media queries, etc.)
        if (rule.selector.startsWith('@')) {
            cssBlocks.push(`${rule.selector} { ${rule.css} }`);
        }
        else {
            cssBlocks.push(`${selector} { ${rule.css} }`);
        }
    }
    return cssBlocks.join('\n');
}
/**
 * Core css() function for creating type-safe styles
 *
 * @example
 * ```ts
 * const button = css({
 *   padding: '10px 20px',
 *   backgroundColor: '#3b82f6',
 *   color: 'white',
 *   borderRadius: '4px',
 *   '&:hover': {
 *     backgroundColor: '#2563eb'
 *   }
 * });
 *
 * // Use in component
 * <button class={button}>Click me</button>
 * ```
 */
export function css(styleObj) {
    const rules = processStyleObject(styleObj);
    // Generate simple CSS for base properties
    const baseProperties = rules
        .filter(r => r.selector === '&')
        .map(r => r.css)
        .join(' ');
    const className = styleRegistry.register(baseProperties);
    // Generate full CSS with nested rules
    const fullCSS = generateCSS(styleObj, className);
    const result = {
        className,
        css: fullCSS,
        toString() {
            return this.className;
        }
    };
    return result;
}
/**
 * Compose multiple CSS results
 *
 * @example
 * ```ts
 * const base = css({ padding: '10px' });
 * const primary = css({ backgroundColor: 'blue' });
 * const button = compose(base, primary);
 * ```
 */
export function compose(...styles) {
    return styles
        .filter((s) => Boolean(s))
        .map(s => (typeof s === 'string' ? s : s.className))
        .join(' ');
}
/**
 * Conditional class helper
 *
 * @example
 * ```ts
 * const className = cx(
 *   'base-class',
 *   isActive && 'active',
 *   isDisabled && 'disabled',
 *   conditionalClass
 * );
 * ```
 */
export function cx(...classNames) {
    return classNames.filter(Boolean).join(' ');
}
/**
 * Global styles helper
 *
 * @example
 * ```ts
 * globalStyle('body', {
 *   margin: 0,
 *   padding: 0,
 *   fontFamily: 'system-ui, sans-serif'
 * });
 * ```
 */
export function globalStyle(selector, styles) {
    const rules = processStyleObject(styles);
    const css = rules.map(r => r.css).join(' ');
    styleRegistry.register(`/* global */ ${selector} { ${css} }`);
}
/**
 * Keyframe animation helper
 *
 * @example
 * ```ts
 * const fadeIn = keyframes({
 *   from: { opacity: 0 },
 *   to: { opacity: 1 }
 * });
 *
 * const animated = css({
 *   animation: `${fadeIn} 300ms ease-in`
 * });
 * ```
 */
export function keyframes(frames) {
    const name = `animation-${styleRegistry['counter']++}`;
    const frameRules = Object.entries(frames)
        .map(([key, props]) => {
        const rules = processStyleObject(props);
        const css = rules.map(r => r.css).join(' ');
        return `  ${key} { ${css} }`;
    })
        .join('\n');
    const animationCSS = `@keyframes ${name} {\n${frameRules}\n}`;
    styleRegistry.register(animationCSS);
    return name;
}
/**
 * Create a CSS style factory with default props
 *
 * @example
 * ```ts
 * const createButton = styleFactory({
 *   padding: '10px 20px',
 *   borderRadius: '4px'
 * });
 *
 * const primaryButton = createButton({
 *   backgroundColor: 'blue',
 *   color: 'white'
 * });
 * ```
 */
export function styleFactory(defaults) {
    return (overrides = {}) => {
        return css({ ...defaults, ...overrides });
    };
}
/**
 * Batch create multiple styles at once
 *
 * @example
 * ```ts
 * const styles = createStyles({
 *   container: { maxWidth: '1200px', margin: '0 auto' },
 *   header: { fontSize: '24px', fontWeight: 'bold' },
 *   button: { padding: '10px 20px', borderRadius: '4px' }
 * });
 * ```
 */
export function createStyles(styles) {
    const result = {};
    for (const [key, style] of Object.entries(styles)) {
        result[key] = css(style);
    }
    return result;
}
/**
 * Extract all registered CSS
 */
export function extractCSS() {
    return styleRegistry.getStyles();
}
/**
 * Reset the style registry (useful for testing)
 */
export function resetStyles() {
    styleRegistry.reset();
}
//# sourceMappingURL=css.js.map