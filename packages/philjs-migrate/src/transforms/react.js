/**
 * PhilJS Migrate - React Transform
 *
 * Converts React code to PhilJS, handling:
 * - useState → signal
 * - useEffect → effect
 * - useMemo → computed
 * - useCallback → inline functions (signals are stable)
 * - useRef → signal
 * - useContext → useContext
 * - React.memo → memo
 * - Lifecycle methods → onMount/onCleanup
 */
export class ReactTransform {
    async transform(code, filename) {
        const result = {
            code,
            transformed: false,
            warnings: [],
            manualReview: [],
        };
        // Skip non-React files
        if (!this.isReactFile(code)) {
            return result;
        }
        let transformedCode = code;
        // Transform imports
        transformedCode = this.transformImports(transformedCode, result);
        // Transform hooks
        transformedCode = this.transformUseState(transformedCode, result);
        transformedCode = this.transformUseEffect(transformedCode, result);
        transformedCode = this.transformUseMemo(transformedCode, result);
        transformedCode = this.transformUseCallback(transformedCode, result);
        transformedCode = this.transformUseRef(transformedCode, result);
        transformedCode = this.transformUseContext(transformedCode, result);
        // Transform React.memo
        transformedCode = this.transformMemo(transformedCode, result);
        // Transform JSX specifics
        transformedCode = this.transformJSX(transformedCode, result);
        result.code = transformedCode;
        result.transformed = transformedCode !== code;
        return result;
    }
    isReactFile(code) {
        return code.includes('react') || code.includes('React');
    }
    transformImports(code, result) {
        let transformed = code;
        // Replace React import with @philjs/core
        transformed = transformed.replace(/import\s+React(?:\s*,\s*\{([^}]+)\})?\s+from\s+['"]react['"]/g, (match, namedImports) => {
            const philjsImports = new Set(['JSX']);
            if (namedImports) {
                const imports = namedImports.split(',').map((s) => s.trim());
                for (const imp of imports) {
                    const mapped = this.mapReactImport(imp);
                    if (mapped) {
                        philjsImports.add(mapped);
                    }
                }
            }
            return `import { ${[...philjsImports].join(', ')} } from '@philjs/core'`;
        });
        // Handle named-only imports
        transformed = transformed.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"]/g, (match, namedImports) => {
            const philjsImports = new Set();
            const imports = namedImports.split(',').map((s) => s.trim());
            for (const imp of imports) {
                const mapped = this.mapReactImport(imp);
                if (mapped) {
                    philjsImports.add(mapped);
                }
            }
            if (philjsImports.size === 0) {
                philjsImports.add('JSX');
            }
            return `import { ${[...philjsImports].join(', ')} } from '@philjs/core'`;
        });
        return transformed;
    }
    mapReactImport(reactImport) {
        const mapping = {
            useState: 'signal',
            useEffect: 'effect',
            useMemo: 'computed',
            useCallback: '', // Not needed in PhilJS
            useRef: 'signal',
            useContext: 'useContext',
            createContext: 'createContext',
            memo: 'memo',
            Fragment: '', // Use <> syntax
            forwardRef: '', // Not needed in PhilJS
        };
        return mapping[reactImport] ?? null;
    }
    transformUseState(code, result) {
        // const [value, setValue] = useState(initialValue)
        // → const value = signal(initialValue)
        return code.replace(/const\s+\[(\w+),\s*set(\w+)\]\s*=\s*useState(?:<[^>]+>)?\(([^)]*)\)/g, (match, valueName, setterSuffix, initialValue) => {
            result.warnings.push({
                line: this.getLineNumber(code, match),
                message: `useState converted to signal. Update ${valueName} access to use .get() and .set()`,
                suggestion: `Use ${valueName}.get() to read and ${valueName}.set(newValue) to write`,
            });
            return `const ${valueName} = signal(${initialValue})`;
        });
    }
    transformUseEffect(code, result) {
        let transformed = code;
        // useEffect with cleanup
        transformed = transformed.replace(/useEffect\(\s*\(\)\s*=>\s*\{([\s\S]*?)return\s+\(\)\s*=>\s*\{([\s\S]*?)\};\s*\},\s*\[([^\]]*)\]\)/g, (match, effectBody, cleanupBody, deps) => {
            if (deps.trim()) {
                result.manualReview.push({
                    line: this.getLineNumber(code, match),
                    type: 'useEffect-deps',
                    description: 'useEffect with dependencies. PhilJS effects auto-track dependencies.',
                    originalCode: match,
                    suggestedCode: `effect(() => {\n${effectBody.trim()}\n\n  onCleanup(() => {\n${cleanupBody.trim()}\n  });\n});`,
                });
            }
            return `effect(() => {\n${effectBody.trim()}\n\n  onCleanup(() => {\n${cleanupBody.trim()}\n  });\n})`;
        });
        // useEffect without cleanup
        transformed = transformed.replace(/useEffect\(\s*\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[([^\]]*)\]\)/g, (match, effectBody, deps) => {
            if (deps.trim()) {
                result.warnings.push({
                    line: this.getLineNumber(code, match),
                    message: 'Dependency array removed. PhilJS effects auto-track dependencies.',
                });
            }
            return `effect(() => {\n${effectBody.trim()}\n})`;
        });
        // Empty dependency array (mount effect)
        transformed = transformed.replace(/useEffect\(\s*\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[\]\)/g, (match, effectBody) => {
            return `onMount(() => {\n${effectBody.trim()}\n})`;
        });
        return transformed;
    }
    transformUseMemo(code, result) {
        // useMemo(() => expression, [deps])
        // → computed(() => expression)
        return code.replace(/useMemo\(\s*\(\)\s*=>\s*([^,]+),\s*\[([^\]]*)\]\)/g, (match, expression, deps) => {
            if (deps.trim()) {
                result.warnings.push({
                    line: this.getLineNumber(code, match),
                    message: 'Dependency array removed. PhilJS computed values auto-track dependencies.',
                });
            }
            return `computed(() => ${expression.trim()})`;
        });
    }
    transformUseCallback(code, result) {
        // useCallback is not needed in PhilJS - signals are stable references
        return code.replace(/useCallback\(\s*(\([^)]*\)\s*=>\s*\{[\s\S]*?\}),\s*\[([^\]]*)\]\)/g, (match, callback, deps) => {
            result.warnings.push({
                line: this.getLineNumber(code, match),
                message: 'useCallback removed. PhilJS signal callbacks are stable by default.',
            });
            return callback;
        });
    }
    transformUseRef(code, result) {
        // useRef(initialValue)
        // → signal(initialValue) for values, or element ref for DOM
        return code.replace(/const\s+(\w+)\s*=\s*useRef(?:<[^>]+>)?\(([^)]*)\)/g, (match, refName, initialValue) => {
            // Check if it's a DOM ref (null initial value)
            if (initialValue.trim() === 'null' || initialValue.trim() === '') {
                result.manualReview.push({
                    line: this.getLineNumber(code, match),
                    type: 'dom-ref',
                    description: 'DOM ref pattern. Use ref callback in PhilJS.',
                    originalCode: match,
                    suggestedCode: `let ${refName}: HTMLElement | null = null;\n// In JSX: ref={(el) => ${refName} = el}`,
                });
                return `let ${refName}: HTMLElement | null = null`;
            }
            return `const ${refName} = signal(${initialValue})`;
        });
    }
    transformUseContext(code, result) {
        // useContext works the same in PhilJS
        return code;
    }
    transformMemo(code, result) {
        // React.memo(Component) → memo(Component)
        return code.replace(/React\.memo\(/g, 'memo(');
    }
    transformJSX(code, result) {
        let transformed = code;
        // className → className (same in PhilJS)
        // htmlFor → htmlFor (same)
        // onChange for inputs - suggest using onInput for real-time updates
        if (code.includes('onChange={')) {
            result.warnings.push({
                message: 'Consider using onInput instead of onChange for real-time updates.',
            });
        }
        // Transform state access patterns
        // {count} where count is a signal → {count.get()}
        // This is complex to detect automatically, so we add a warning
        result.warnings.push({
            message: 'Remember to use .get() when reading signal values in JSX.',
        });
        return transformed;
    }
    getLineNumber(code, match) {
        const index = code.indexOf(match);
        if (index === -1)
            return 0;
        return code.substring(0, index).split('\n').length;
    }
}
//# sourceMappingURL=react.js.map