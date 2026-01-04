/**
 * PhilJS Scoped Styles
 *
 * Svelte-style scoped CSS with automatic class name generation.
 */
import { generateHash, cssPropertyToString, injectStyles } from './utils.js';
const styleCache = new Map();
const injectedStyles = new Set();
/**
 * Create scoped CSS from a template literal
 */
export function css(strings, ...values) {
    // Combine template strings with values
    let cssText = '';
    strings.forEach((str, i) => {
        cssText += str;
        if (i < values.length) {
            cssText += String(values[i]);
        }
    });
    // Generate hash for scoping
    const hash = generateHash(cssText);
    const scopedClass = `philjs-${hash}`;
    // Check cache
    if (styleCache.has(hash)) {
        return scopedClass;
    }
    // Scope the CSS
    const scopedCSS = scopeCSS(cssText, scopedClass);
    // Cache and inject
    styleCache.set(hash, scopedCSS);
    injectStyles(scopedCSS, hash);
    return scopedClass;
}
/**
 * Create a styled component
 */
export function styled(tag, styles) {
    return function StyledComponent(props) {
        const { className = '', children, ...rest } = props;
        // Get styles (call function if needed)
        const styleObj = typeof styles === 'function' ? styles(props) : styles;
        // Generate hash from styles
        const styleString = JSON.stringify(styleObj);
        const hash = generateHash(styleString);
        const scopedClass = `philjs-${hash}`;
        // Inject styles if not already
        if (!injectedStyles.has(hash)) {
            const cssText = `.${scopedClass} { ${objectToCSS(styleObj)} }`;
            injectStyles(cssText, hash);
            injectedStyles.add(hash);
        }
        // Create element
        const combinedClassName = `${scopedClass} ${className}`.trim();
        if (typeof tag === 'function') {
            return tag({ ...rest, className: combinedClassName, children });
        }
        return {
            type: tag,
            props: {
                ...rest,
                className: combinedClassName,
                children,
            },
        };
    };
}
/**
 * Create keyframe animations
 */
export function keyframes(strings, ...values) {
    let cssText = '';
    strings.forEach((str, i) => {
        cssText += str;
        if (i < values.length) {
            cssText += String(values[i]);
        }
    });
    const hash = generateHash(cssText);
    const animationName = `philjs-anim-${hash}`;
    if (!injectedStyles.has(hash)) {
        const keyframeCSS = `@keyframes ${animationName} { ${cssText} }`;
        injectStyles(keyframeCSS, `keyframe-${hash}`);
        injectedStyles.add(hash);
    }
    return animationName;
}
/**
 * Create global styles
 */
export function createGlobalStyle(strings, ...values) {
    let cssText = '';
    strings.forEach((str, i) => {
        cssText += str;
        if (i < values.length) {
            cssText += String(values[i]);
        }
    });
    const hash = generateHash(cssText);
    return function GlobalStyle() {
        if (!injectedStyles.has(hash)) {
            injectStyles(cssText, `global-${hash}`);
            injectedStyles.add(hash);
        }
        return null;
    };
}
/**
 * Scope CSS by adding class to selectors
 */
function scopeCSS(css, scopedClass) {
    // Simple regex-based scoping (production would use PostCSS)
    return css.replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g, (match, selector, ending) => {
        // Skip keyframes, media queries, etc.
        if (selector.trim().startsWith('@') || selector.trim().startsWith('from') ||
            selector.trim().startsWith('to') || /^\d+%$/.test(selector.trim())) {
            return match;
        }
        // Add scoped class to selector
        const scopedSelector = selector
            .split(',')
            .map((s) => {
            s = s.trim();
            if (s.startsWith(':global')) {
                return s.replace(':global', '').trim();
            }
            if (s === '&') {
                return `.${scopedClass}`;
            }
            if (s.startsWith('&')) {
                return `.${scopedClass}${s.slice(1)}`;
            }
            return `.${scopedClass} ${s}`;
        })
            .join(', ');
        return `${scopedSelector}${ending}`;
    });
}
/**
 * Convert style object to CSS string
 */
function objectToCSS(obj) {
    return Object.entries(obj)
        .map(([key, value]) => {
        const cssKey = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
        return `${cssKey}: ${value};`;
    })
        .join(' ');
}
/**
 * Create variant-based styles (like Stitches/CVA)
 */
export function cva(config) {
    const { base = {}, variants = {}, compoundVariants = [], defaultVariants = {} } = config;
    return function variantStyles(props = {}) {
        // Start with base styles
        let finalStyles = { ...base };
        // Apply variant styles
        for (const [variantKey, variantValue] of Object.entries({
            ...defaultVariants,
            ...props,
        })) {
            const variantStyles = variants[variantKey]?.[variantValue];
            if (variantStyles) {
                finalStyles = { ...finalStyles, ...variantStyles };
            }
        }
        // Apply compound variants
        for (const compound of compoundVariants) {
            const { css: compoundCSS, ...conditions } = compound;
            const allMatch = Object.entries(conditions).every(([key, value]) => {
                const propValue = props[key] ?? defaultVariants[key];
                return propValue === value;
            });
            if (allMatch) {
                finalStyles = { ...finalStyles, ...compoundCSS };
            }
        }
        // Generate class
        const styleString = JSON.stringify(finalStyles);
        const hash = generateHash(styleString);
        const className = `philjs-var-${hash}`;
        if (!injectedStyles.has(hash)) {
            const cssText = `.${className} { ${objectToCSS(finalStyles)} }`;
            injectStyles(cssText, `var-${hash}`);
            injectedStyles.add(hash);
        }
        return className;
    };
}
//# sourceMappingURL=scoped.js.map