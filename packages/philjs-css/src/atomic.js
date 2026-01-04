import { css } from './css.js';
/**
 * Atomic CSS class registry
 */
class AtomicRegistry {
    atomicClasses = new Map();
    register(key, style) {
        if (!this.atomicClasses.has(key)) {
            this.atomicClasses.set(key, css(style));
        }
        return this.atomicClasses.get(key);
    }
    get(key) {
        return this.atomicClasses.get(key);
    }
    clear() {
        this.atomicClasses.clear();
    }
    getAll() {
        return new Map(this.atomicClasses);
    }
}
export const atomicRegistry = new AtomicRegistry();
/**
 * Property shorthand mappings
 */
const propertyShorthands = {
    m: 'margin',
    mt: 'marginTop',
    mr: 'marginRight',
    mb: 'marginBottom',
    ml: 'marginLeft',
    mx: 'marginInline',
    my: 'marginBlock',
    p: 'padding',
    pt: 'paddingTop',
    pr: 'paddingRight',
    pb: 'paddingBottom',
    pl: 'paddingLeft',
    px: 'paddingInline',
    py: 'paddingBlock',
    w: 'width',
    h: 'height',
    bg: 'backgroundColor',
    text: 'color',
    rounded: 'borderRadius'
};
/**
 * Generate atomic utility classes
 *
 * @example
 * ```ts
 * const utilities = generateAtomicClasses({
 *   properties: ['margin', 'padding', 'color'],
 *   values: {
 *     '0': '0',
 *     '1': '0.25rem',
 *     '2': '0.5rem',
 *     '4': '1rem',
 *     'blue': '#3b82f6',
 *     'red': '#ef4444'
 *   }
 * });
 *
 * // Access: utilities.m1, utilities.p2, utilities.colorBlue
 * ```
 */
export function generateAtomicClasses(config) {
    const utilities = {};
    for (const property of config.properties) {
        for (const [valueName, value] of Object.entries(config.values)) {
            const key = `${property}${valueName.charAt(0).toUpperCase()}${valueName.slice(1)}`;
            const atomicKey = `${property}-${valueName}`;
            const result = atomicRegistry.register(atomicKey, {
                [property]: value
            });
            utilities[key] = result.className;
        }
    }
    // Generate responsive variants if breakpoints provided
    if (config.breakpoints) {
        for (const [breakpoint, mediaQuery] of Object.entries(config.breakpoints)) {
            for (const property of config.properties) {
                for (const [valueName, value] of Object.entries(config.values)) {
                    const key = `${breakpoint}:${property}${valueName.charAt(0).toUpperCase()}${valueName.slice(1)}`;
                    const atomicKey = `${breakpoint}-${property}-${valueName}`;
                    const result = atomicRegistry.register(atomicKey, {
                        [`@media (min-width: ${mediaQuery})`]: {
                            [property]: value
                        }
                    });
                    utilities[key] = result.className;
                }
            }
        }
    }
    return utilities;
}
/**
 * Create spacing utilities (margin and padding)
 *
 * @example
 * ```ts
 * const spacing = createSpacingUtilities({
 *   0: '0',
 *   1: '0.25rem',
 *   2: '0.5rem',
 *   4: '1rem',
 *   8: '2rem'
 * });
 *
 * // spacing.m4, spacing.p2, spacing.mt1, etc.
 * ```
 */
export function createSpacingUtilities(scale) {
    const utilities = {};
    const properties = [
        { key: 'm', prop: 'margin' },
        { key: 'mt', prop: 'marginTop' },
        { key: 'mr', prop: 'marginRight' },
        { key: 'mb', prop: 'marginBottom' },
        { key: 'ml', prop: 'marginLeft' },
        { key: 'mx', props: ['marginLeft', 'marginRight'] },
        { key: 'my', props: ['marginTop', 'marginBottom'] },
        { key: 'p', prop: 'padding' },
        { key: 'pt', prop: 'paddingTop' },
        { key: 'pr', prop: 'paddingRight' },
        { key: 'pb', prop: 'paddingBottom' },
        { key: 'pl', prop: 'paddingLeft' },
        { key: 'px', props: ['paddingLeft', 'paddingRight'] },
        { key: 'py', props: ['paddingTop', 'paddingBottom'] }
    ];
    for (const [spacingKey, spacingValue] of Object.entries(scale)) {
        for (const { key, prop, props } of properties) {
            const utilityKey = `${key}${spacingKey}`;
            const atomicKey = `${key}-${spacingKey}`;
            const styleObj = {};
            if (prop) {
                styleObj[prop] = spacingValue;
            }
            else if (props) {
                for (const p of props) {
                    styleObj[p] = spacingValue;
                }
            }
            const result = atomicRegistry.register(atomicKey, styleObj);
            utilities[utilityKey] = result.className;
        }
    }
    return utilities;
}
/**
 * Create color utilities
 *
 * @example
 * ```ts
 * const colors = createColorUtilities({
 *   blue: '#3b82f6',
 *   red: '#ef4444',
 *   green: '#10b981'
 * });
 *
 * // colors.textBlue, colors.bgRed, colors.borderGreen
 * ```
 */
export function createColorUtilities(palette) {
    const utilities = {};
    const properties = [
        { key: 'text', prop: 'color' },
        { key: 'bg', prop: 'backgroundColor' },
        { key: 'border', prop: 'borderColor' }
    ];
    for (const [colorName, colorValue] of Object.entries(palette)) {
        for (const { key, prop } of properties) {
            const utilityKey = `${key}${colorName.charAt(0).toUpperCase()}${colorName.slice(1)}`;
            const atomicKey = `${key}-${colorName}`;
            const result = atomicRegistry.register(atomicKey, {
                [prop]: colorValue
            });
            utilities[utilityKey] = result.className;
        }
    }
    return utilities;
}
/**
 * Create typography utilities
 *
 * @example
 * ```ts
 * const typography = createTypographyUtilities({
 *   fontSize: { sm: '14px', base: '16px', lg: '18px' },
 *   fontWeight: { normal: 400, bold: 700 },
 *   lineHeight: { tight: 1.25, normal: 1.5 }
 * });
 * ```
 */
export function createTypographyUtilities(config) {
    const utilities = {};
    if (config.fontSize) {
        for (const [key, value] of Object.entries(config.fontSize)) {
            const utilityKey = `text${key.charAt(0).toUpperCase()}${key.slice(1)}`;
            const result = atomicRegistry.register(`fontSize-${key}`, {
                fontSize: value
            });
            utilities[utilityKey] = result.className;
        }
    }
    if (config.fontWeight) {
        for (const [key, value] of Object.entries(config.fontWeight)) {
            const utilityKey = `font${key.charAt(0).toUpperCase()}${key.slice(1)}`;
            const result = atomicRegistry.register(`fontWeight-${key}`, {
                fontWeight: value
            });
            utilities[utilityKey] = result.className;
        }
    }
    if (config.lineHeight) {
        for (const [key, value] of Object.entries(config.lineHeight)) {
            const utilityKey = `leading${key.charAt(0).toUpperCase()}${key.slice(1)}`;
            const result = atomicRegistry.register(`lineHeight-${key}`, {
                lineHeight: value
            });
            utilities[utilityKey] = result.className;
        }
    }
    if (config.letterSpacing) {
        for (const [key, value] of Object.entries(config.letterSpacing)) {
            const utilityKey = `tracking${key.charAt(0).toUpperCase()}${key.slice(1)}`;
            const result = atomicRegistry.register(`letterSpacing-${key}`, {
                letterSpacing: value
            });
            utilities[utilityKey] = result.className;
        }
    }
    return utilities;
}
/**
 * Create layout utilities
 *
 * @example
 * ```ts
 * const layout = createLayoutUtilities();
 * // layout.flex, layout.grid, layout.block, layout.hidden, etc.
 * ```
 */
export function createLayoutUtilities() {
    const utilities = {};
    const displayValues = {
        block: 'block',
        inline: 'inline',
        inlineBlock: 'inline-block',
        flex: 'flex',
        inlineFlex: 'inline-flex',
        grid: 'grid',
        inlineGrid: 'inline-grid',
        hidden: 'none'
    };
    for (const [key, value] of Object.entries(displayValues)) {
        const result = atomicRegistry.register(`display-${key}`, {
            display: value
        });
        utilities[key] = result.className;
    }
    // Flex utilities
    const flexUtils = {
        flexRow: { flexDirection: 'row' },
        flexCol: { flexDirection: 'column' },
        flexWrap: { flexWrap: 'wrap' },
        flexNoWrap: { flexWrap: 'nowrap' },
        itemsCenter: { alignItems: 'center' },
        itemsStart: { alignItems: 'flex-start' },
        itemsEnd: { alignItems: 'flex-end' },
        justifyCenter: { justifyContent: 'center' },
        justifyStart: { justifyContent: 'flex-start' },
        justifyEnd: { justifyContent: 'flex-end' },
        justifyBetween: { justifyContent: 'space-between' },
        justifyAround: { justifyContent: 'space-around' }
    };
    for (const [key, style] of Object.entries(flexUtils)) {
        const result = atomicRegistry.register(key, style);
        utilities[key] = result.className;
    }
    // Position utilities
    const positionUtils = {
        relative: { position: 'relative' },
        absolute: { position: 'absolute' },
        fixed: { position: 'fixed' },
        sticky: { position: 'sticky' }
    };
    for (const [key, style] of Object.entries(positionUtils)) {
        const result = atomicRegistry.register(key, style);
        utilities[key] = result.className;
    }
    return utilities;
}
/**
 * Create a complete atomic CSS system
 *
 * @example
 * ```ts
 * const atoms = createAtomicSystem({
 *   spacing: { 0: '0', 1: '4px', 2: '8px', 4: '16px' },
 *   colors: { blue: '#3b82f6', red: '#ef4444' },
 *   fontSize: { sm: '14px', base: '16px', lg: '18px' }
 * });
 *
 * // atoms.m4, atoms.p2, atoms.textBlue, atoms.bgRed, atoms.textSm, etc.
 * ```
 */
export function createAtomicSystem(config) {
    let utilities = {};
    // Spacing utilities
    if (config.spacing) {
        utilities = { ...utilities, ...createSpacingUtilities(config.spacing) };
    }
    // Color utilities
    if (config.colors) {
        utilities = { ...utilities, ...createColorUtilities(config.colors) };
    }
    // Typography utilities
    const typoConfig = {};
    if (config.fontSize)
        typoConfig.fontSize = config.fontSize;
    if (config.fontWeight)
        typoConfig.fontWeight = config.fontWeight;
    if (config.lineHeight)
        typoConfig.lineHeight = config.lineHeight;
    if (config.letterSpacing)
        typoConfig.letterSpacing = config.letterSpacing;
    if (Object.keys(typoConfig).length > 0) {
        utilities = { ...utilities, ...createTypographyUtilities(typoConfig) };
    }
    // Layout utilities
    utilities = { ...utilities, ...createLayoutUtilities() };
    return utilities;
}
/**
 * Extract all atomic CSS
 */
export function extractAtomicCSS() {
    const classes = atomicRegistry.getAll();
    return Array.from(classes.values())
        .map(result => result.css)
        .join('\n');
}
/**
 * Reset atomic registry
 */
export function resetAtomicRegistry() {
    atomicRegistry.clear();
}
//# sourceMappingURL=atomic.js.map