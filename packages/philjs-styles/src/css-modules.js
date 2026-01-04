/**
 * PhilJS CSS Modules Support
 *
 * Import and use CSS Modules with type safety.
 */
/**
 * Create a CSS Modules helper
 */
export function cssModules(classes) {
    return {
        ...classes,
        compose(...classNames) {
            return classNames
                .filter(Boolean)
                .map((name) => {
                if (typeof name === 'string' && name in classes) {
                    return classes[name];
                }
                return name;
            })
                .join(' ');
        },
    };
}
/**
 * Hook for using CSS Modules in components
 */
export function useCSSModule(styles) {
    return {
        styles,
        cx(...classNames) {
            return classNames
                .filter(Boolean)
                .map((name) => {
                if (typeof name === 'string' && name in styles) {
                    return styles[name];
                }
                return name;
            })
                .join(' ');
        },
        getClass(name) {
            return styles[name] || '';
        },
    };
}
/**
 * Bind styles to a component for easier usage
 */
export function bindStyles(styles) {
    const boundStyles = {};
    for (const key of Object.keys(styles)) {
        boundStyles[key] = styles[key];
    }
    boundStyles.cx = (...names) => {
        return names
            .filter(Boolean)
            .map((name) => {
            if (typeof name === 'string' && name in styles) {
                return styles[name];
            }
            return typeof name === 'string' ? name : '';
        })
            .filter(Boolean)
            .join(' ');
    };
    return boundStyles;
}
/**
 * Generate CSS Module loader config for build tools
 */
export function getCSSModuleConfig(options = {}) {
    const { scopeBehaviour = 'local', localIdentName = '[name]__[local]__[hash:base64:5]', exportLocalsConvention = 'camelCaseOnly', } = options;
    return {
        // For Vite
        vite: {
            css: {
                modules: {
                    scopeBehaviour,
                    localsConvention: exportLocalsConvention,
                    generateScopedName: localIdentName,
                },
            },
        },
        // For PostCSS
        postcss: {
            'postcss-modules': {
                scopeBehaviour,
                localsConvention: exportLocalsConvention,
                generateScopedName: localIdentName,
            },
        },
        // For Webpack
        webpack: {
            modules: {
                mode: scopeBehaviour,
                localIdentName,
                exportLocalsConvention,
            },
        },
    };
}
/**
 * Type-safe CSS Module import helper
 */
export function importCSSModule(modulePromise) {
    return modulePromise.then((m) => m.default);
}
/**
 * Create conditional class names from CSS Module
 */
export function createClassNames(styles) {
    return function classNames(conditions) {
        if (Array.isArray(conditions)) {
            return conditions.map((name) => styles[name]).join(' ');
        }
        return Object.entries(conditions)
            .filter(([, condition]) => condition)
            .map(([name]) => styles[name])
            .join(' ');
    };
}
//# sourceMappingURL=css-modules.js.map