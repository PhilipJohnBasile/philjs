/**
 * PhilJS Tailwind Utilities
 *
 * Helper functions for working with Tailwind CSS.
 */
/**
 * Conditionally join class names (clsx compatible)
 */
export function clsx(...inputs) {
    const classes = [];
    for (const input of inputs) {
        if (!input)
            continue;
        if (typeof input === 'string' || typeof input === 'number') {
            classes.push(String(input));
        }
        else if (Array.isArray(input)) {
            const inner = clsx(...input);
            if (inner)
                classes.push(inner);
        }
        else if (typeof input === 'object') {
            for (const [key, value] of Object.entries(input)) {
                if (value)
                    classes.push(key);
            }
        }
    }
    return classes.join(' ');
}
/**
 * Merge Tailwind classes intelligently
 */
export function twMerge(...inputs) {
    const classes = clsx(...inputs);
    return mergeClasses(classes);
}
/**
 * Alias for clsx (class name helper)
 */
export const cn = twMerge;
/**
 * Join Tailwind classes (simple join without merging)
 */
export function twJoin(...inputs) {
    return clsx(...inputs);
}
/**
 * Tagged template for Tailwind classes
 */
export function tw(strings, ...values) {
    let result = '';
    strings.forEach((str, i) => {
        result += str;
        if (i < values.length) {
            const value = values[i];
            if (typeof value === 'string') {
                result += value;
            }
            else if (Array.isArray(value)) {
                result += value.filter(Boolean).join(' ');
            }
        }
    });
    return result.trim().replace(/\s+/g, ' ');
}
export function cva(config) {
    const { base = '', variants = {}, compoundVariants = [], defaultVariants = {} } = config;
    return function variantClass(props) {
        const { class: classOverride, className, ...variantProps } = props || {};
        const classes = [base];
        // Apply variant classes
        for (const [variantKey, variantOptions] of Object.entries(variants)) {
            const selectedVariant = variantProps[variantKey] ?? defaultVariants[variantKey];
            if (selectedVariant && variantOptions[selectedVariant]) {
                classes.push(variantOptions[selectedVariant]);
            }
        }
        // Apply compound variants
        for (const compound of compoundVariants) {
            const { class: compoundClass, ...conditions } = compound;
            const matches = Object.entries(conditions).every(([key, value]) => {
                const propValue = variantProps[key] ?? defaultVariants[key];
                if (Array.isArray(value)) {
                    return value.includes(propValue);
                }
                return propValue === value;
            });
            if (matches && compoundClass) {
                classes.push(compoundClass);
            }
        }
        // Add override classes
        if (classOverride)
            classes.push(classOverride);
        if (className)
            classes.push(className);
        return twMerge(...classes);
    };
}
/**
 * Simple class merging (resolves Tailwind conflicts)
 */
function mergeClasses(classString) {
    const classes = classString.split(/\s+/).filter(Boolean);
    const classMap = new Map();
    // Tailwind class prefixes that should be deduplicated
    const prefixGroups = [
        // Layout
        ['w-', 'min-w-', 'max-w-'],
        ['h-', 'min-h-', 'max-h-'],
        // Spacing
        ['p-', 'px-', 'py-', 'pt-', 'pr-', 'pb-', 'pl-', 'ps-', 'pe-'],
        ['m-', 'mx-', 'my-', 'mt-', 'mr-', 'mb-', 'ml-', 'ms-', 'me-'],
        // Typography
        ['text-', 'font-', 'leading-', 'tracking-'],
        // Background
        ['bg-'],
        // Border
        ['border-', 'rounded-'],
        // Flexbox
        ['flex-', 'justify-', 'items-', 'content-', 'gap-'],
        // Grid
        ['grid-', 'col-', 'row-'],
        // Position
        ['top-', 'right-', 'bottom-', 'left-', 'inset-'],
        // Display
        ['block', 'inline', 'flex', 'grid', 'hidden', 'table', 'contents', 'list-item', 'inline-block', 'inline-flex', 'inline-grid'],
        // Position type
        ['static', 'fixed', 'absolute', 'relative', 'sticky'],
    ];
    for (const className of classes) {
        // Find the prefix group this class belongs to
        let foundGroup = false;
        for (const prefixes of prefixGroups) {
            for (const prefix of prefixes) {
                if (className.startsWith(prefix) || prefixes.includes(className)) {
                    // Use the prefix as the key to allow later classes to override
                    const key = prefixes[0];
                    classMap.set(key + (className.match(/^[^-]+-/)?.[0] || className), className);
                    foundGroup = true;
                    break;
                }
            }
            if (foundGroup)
                break;
        }
        // If no group found, just add the class
        if (!foundGroup) {
            classMap.set(className, className);
        }
    }
    return Array.from(classMap.values()).join(' ');
}
/**
 * Focus ring utility
 */
export const focusRing = 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
/**
 * Common class patterns
 */
export const patterns = {
    // Button variants
    button: {
        base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
    },
    // Input variants
    input: {
        base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    },
    // Card variants
    card: {
        base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
    },
};
//# sourceMappingURL=utils.js.map