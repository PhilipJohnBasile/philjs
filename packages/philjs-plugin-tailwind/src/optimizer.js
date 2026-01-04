/**
 * CSS Optimizer for Tailwind CSS
 * Production-ready CSS optimization utilities
 */
/**
 * CSS Optimizer class
 */
export class CSSOptimizer {
    options;
    constructor(options = {}) {
        this.options = {
            minify: true,
            removeComments: true,
            deduplicateRules: true,
            mergeMediaQueries: true,
            sortProperties: false,
            removeEmptyRules: true,
            sourcemap: false,
            ...options,
        };
    }
    /**
     * Optimize CSS content
     */
    optimize(css) {
        const originalSize = Buffer.byteLength(css, "utf-8");
        let optimized = css;
        if (this.options.removeComments) {
            optimized = this.removeComments(optimized);
        }
        if (this.options.removeEmptyRules) {
            optimized = this.removeEmptyRules(optimized);
        }
        if (this.options.deduplicateRules) {
            optimized = this.deduplicateRules(optimized);
        }
        if (this.options.mergeMediaQueries) {
            optimized = this.mergeMediaQueries(optimized);
        }
        if (this.options.sortProperties) {
            optimized = this.sortProperties(optimized);
        }
        if (this.options.minify) {
            optimized = this.minify(optimized);
        }
        const optimizedSize = Buffer.byteLength(optimized, "utf-8");
        const reduction = originalSize > 0
            ? Math.round(((originalSize - optimizedSize) / originalSize) * 100)
            : 0;
        return {
            css: optimized,
            originalSize,
            optimizedSize,
            reduction,
        };
    }
    /**
     * Remove CSS comments
     */
    removeComments(css) {
        // Remove block comments
        return css.replace(/\/\*[\s\S]*?\*\//g, "");
    }
    /**
     * Remove empty rules
     */
    removeEmptyRules(css) {
        // Match selectors with empty bodies
        return css.replace(/[^{}]+\{\s*\}/g, "");
    }
    /**
     * Deduplicate identical rules
     */
    deduplicateRules(css) {
        const rules = new Map();
        const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
        let match;
        // Extract all rules
        while ((match = ruleRegex.exec(css)) !== null) {
            const selector = match[1].trim();
            const properties = match[2].trim();
            // Merge properties for same selector
            if (rules.has(selector)) {
                const existing = rules.get(selector);
                const merged = this.mergeProperties(existing, properties);
                rules.set(selector, merged);
            }
            else {
                rules.set(selector, properties);
            }
        }
        // Rebuild CSS
        let result = "";
        for (const [selector, properties] of rules) {
            if (properties.trim()) {
                result += `${selector}{${properties}}`;
            }
        }
        // Preserve @rules that weren't captured
        const atRules = css.match(/@[^{]+\{[^{}]+\{[^}]+\}[^}]*\}/g) || [];
        result += atRules.join("");
        return result;
    }
    /**
     * Merge media queries with same conditions
     */
    mergeMediaQueries(css) {
        const mediaQueries = new Map();
        const mediaRegex = /@media\s*([^{]+)\{([\s\S]*?)\}\s*(?=@media|$)/g;
        let match;
        // Extract media queries
        while ((match = mediaRegex.exec(css)) !== null) {
            const condition = match[1].trim();
            const content = match[2].trim();
            if (mediaQueries.has(condition)) {
                mediaQueries.get(condition).push(content);
            }
            else {
                mediaQueries.set(condition, [content]);
            }
        }
        // If no media queries found, return original
        if (mediaQueries.size === 0)
            return css;
        // Remove original media queries from CSS
        let result = css.replace(/@media[^{]+\{[\s\S]*?\}\s*\}/g, "");
        // Add merged media queries
        for (const [condition, contents] of mediaQueries) {
            result += `@media ${condition}{${contents.join("")}}`;
        }
        return result;
    }
    /**
     * Sort CSS properties alphabetically
     */
    sortProperties(css) {
        return css.replace(/\{([^{}]+)\}/g, (match, properties) => {
            const sorted = properties
                .split(";")
                .filter((p) => p.trim())
                .map((p) => p.trim())
                .sort()
                .join(";");
            return `{${sorted}${sorted ? ";" : ""}}`;
        });
    }
    /**
     * Merge CSS properties (last one wins for duplicates)
     */
    mergeProperties(existing, incoming) {
        const props = new Map();
        // Parse existing properties
        existing.split(";").forEach((prop) => {
            const colonIndex = prop.indexOf(":");
            if (colonIndex > -1) {
                const key = prop.substring(0, colonIndex).trim();
                const value = prop.substring(colonIndex + 1).trim();
                if (key)
                    props.set(key, value);
            }
        });
        // Parse incoming properties (overwriting duplicates)
        incoming.split(";").forEach((prop) => {
            const colonIndex = prop.indexOf(":");
            if (colonIndex > -1) {
                const key = prop.substring(0, colonIndex).trim();
                const value = prop.substring(colonIndex + 1).trim();
                if (key)
                    props.set(key, value);
            }
        });
        // Rebuild property string
        return Array.from(props.entries())
            .map(([key, value]) => `${key}:${value}`)
            .join(";");
    }
    /**
     * Minify CSS
     */
    minify(css) {
        return css
            // Remove newlines and extra whitespace
            .replace(/\s+/g, " ")
            // Remove whitespace around special characters
            .replace(/\s*([{};:,>+~])\s*/g, "$1")
            // Remove trailing semicolons before closing braces
            .replace(/;}/g, "}")
            // Remove whitespace at start and end
            .trim();
    }
}
/**
 * Quick optimization function
 */
export function optimizeCSS(css, options) {
    const optimizer = new CSSOptimizer(options);
    return optimizer.optimize(css);
}
/**
 * Critical CSS extractor
 */
export class CriticalCSSExtractor {
    viewportWidth;
    viewportHeight;
    constructor(viewportWidth = 1920, viewportHeight = 1080) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
    }
    /**
     * Extract critical CSS rules for above-the-fold content
     * Note: This is a simplified version - full implementation requires a DOM parser
     */
    extractCritical(css, html) {
        // Extract all class names from the HTML
        const classRegex = /class=["']([^"']+)["']/g;
        const usedClasses = new Set();
        let match;
        while ((match = classRegex.exec(html)) !== null) {
            match[1].split(/\s+/).forEach((cls) => usedClasses.add(cls));
        }
        // Also extract IDs
        const idRegex = /id=["']([^"']+)["']/g;
        const usedIds = new Set();
        while ((match = idRegex.exec(html)) !== null) {
            usedIds.add(match[1]);
        }
        // Extract tag names
        const tagRegex = /<([a-z][a-z0-9]*)[^>]*>/gi;
        const usedTags = new Set();
        while ((match = tagRegex.exec(html)) !== null) {
            usedTags.add(match[1].toLowerCase());
        }
        const critical = [];
        const deferred = [];
        // Parse CSS rules
        const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
        while ((match = ruleRegex.exec(css)) !== null) {
            const selector = match[1].trim();
            const body = match[2];
            const rule = `${selector}{${body}}`;
            // Check if selector is used
            if (this.isSelectorUsed(selector, usedClasses, usedIds, usedTags)) {
                critical.push(rule);
            }
            else {
                deferred.push(rule);
            }
        }
        // Also include @rules that are critical
        const atRuleRegex = /@(charset|import|font-face)[^{]+(\{[^}]+\})?/g;
        while ((match = atRuleRegex.exec(css)) !== null) {
            critical.unshift(match[0]);
        }
        return {
            critical: critical.join(""),
            deferred: deferred.join(""),
        };
    }
    /**
     * Check if a selector is used in the HTML
     */
    isSelectorUsed(selector, classes, ids, tags) {
        // Handle multiple selectors
        const selectors = selector.split(",").map((s) => s.trim());
        for (const sel of selectors) {
            // Check class selectors
            const classMatch = sel.match(/\.([a-z0-9_-]+)/gi);
            if (classMatch) {
                for (const cls of classMatch) {
                    if (classes.has(cls.substring(1)))
                        return true;
                }
            }
            // Check ID selectors
            const idMatch = sel.match(/#([a-z0-9_-]+)/gi);
            if (idMatch) {
                for (const id of idMatch) {
                    if (ids.has(id.substring(1)))
                        return true;
                }
            }
            // Check tag selectors
            const tagMatch = sel.match(/^[a-z]+/i);
            if (tagMatch && tags.has(tagMatch[0].toLowerCase())) {
                return true;
            }
            // Universal and pseudo-element selectors are always critical
            if (sel.startsWith("*") || sel.startsWith(":")) {
                return true;
            }
        }
        return false;
    }
}
/**
 * Extract critical CSS
 */
export function extractCriticalCSS(css, html) {
    const extractor = new CriticalCSSExtractor();
    return extractor.extractCritical(css, html);
}
/**
 * Unused CSS purger
 */
export function purgeUnusedCSS(css, content, options) {
    const safelist = new Set(options?.safelist || []);
    const blocklist = new Set(options?.blocklist || []);
    // Extract all potential class names from content
    const usedClasses = new Set();
    const classRegex = /class(?:Name)?=["']([^"']+)["']|className:\s*["']([^"']+)["']|className:\s*`([^`]+)`/g;
    for (const contentItem of content) {
        let match;
        while ((match = classRegex.exec(contentItem)) !== null) {
            const classes = (match[1] || match[2] || match[3] || "").split(/\s+/);
            classes.forEach((cls) => {
                if (cls && !blocklist.has(cls)) {
                    usedClasses.add(cls);
                }
            });
        }
    }
    // Add safelisted classes
    safelist.forEach((cls) => usedClasses.add(cls));
    // Filter CSS rules
    const purged = [];
    const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
    let match;
    while ((match = ruleRegex.exec(css)) !== null) {
        const selector = match[1].trim();
        const body = match[2];
        // Keep rule if any class in selector is used
        const classesInSelector = selector.match(/\.([a-z0-9_-]+)/gi) || [];
        const shouldKeep = classesInSelector.length === 0 ||
            classesInSelector.some((cls) => usedClasses.has(cls.substring(1)));
        if (shouldKeep) {
            purged.push(`${selector}{${body}}`);
        }
    }
    // Preserve @rules
    const atRules = css.match(/@[^{]+\{[\s\S]*?\}\s*\}/g) || [];
    return purged.join("") + atRules.join("");
}
export function analyzeCSSStats(css) {
    const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
    let ruleCount = 0;
    let selectorCount = 0;
    let declarationCount = 0;
    const properties = new Set();
    const colors = new Set();
    const specificities = [];
    let match;
    while ((match = ruleRegex.exec(css)) !== null) {
        ruleCount++;
        // Count selectors
        const selectors = match[1].split(",");
        selectorCount += selectors.length;
        // Calculate specificity for each selector
        for (const selector of selectors) {
            specificities.push(calculateSpecificity(selector));
        }
        // Count declarations and extract properties
        const declarations = match[2].split(";");
        for (const decl of declarations) {
            if (decl.trim()) {
                declarationCount++;
                const colonIndex = decl.indexOf(":");
                if (colonIndex > -1) {
                    const prop = decl.substring(0, colonIndex).trim();
                    const value = decl.substring(colonIndex + 1).trim();
                    properties.add(prop);
                    // Extract colors
                    const colorMatches = value.match(/#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)/gi);
                    if (colorMatches) {
                        colorMatches.forEach((color) => colors.add(color));
                    }
                }
            }
        }
    }
    // Count media queries
    const mediaQueryCount = (css.match(/@media/g) || []).length;
    return {
        size: Buffer.byteLength(css, "utf-8"),
        ruleCount,
        selectorCount,
        declarationCount,
        mediaQueryCount,
        uniqueProperties: Array.from(properties).sort(),
        uniqueColors: Array.from(colors),
        specificity: {
            max: Math.max(...specificities, 0),
            avg: specificities.length > 0
                ? Math.round(specificities.reduce((a, b) => a + b, 0) / specificities.length)
                : 0,
        },
    };
}
/**
 * Calculate selector specificity
 */
function calculateSpecificity(selector) {
    let a = 0; // ID selectors
    let b = 0; // Class, attribute, pseudo-class selectors
    let c = 0; // Type selectors, pseudo-elements
    // Count IDs
    a = (selector.match(/#[a-z0-9_-]+/gi) || []).length;
    // Count classes, attributes, pseudo-classes
    b = (selector.match(/\.[a-z0-9_-]+|\[[^\]]+\]|:[a-z-]+(?:\([^)]*\))?/gi) || []).length;
    // Count type selectors and pseudo-elements
    c = (selector.match(/^[a-z]+|::[a-z-]+/gi) || []).length;
    // Combine into a single number (simplified)
    return a * 100 + b * 10 + c;
}
//# sourceMappingURL=optimizer.js.map