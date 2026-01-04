/**
 * PhilJS Playground Compiler
 */
export async function compileCode(code) {
    const start = Date.now();
    const errors = [];
    const warnings = [];
    try {
        // Use Babel for transpilation
        const Babel = window.Babel || (await import('@babel/standalone')).default;
        const result = Babel.transform(code, {
            presets: ['react', 'typescript'],
            plugins: [],
            filename: 'playground.tsx',
        });
        return {
            success: true,
            output: result.code,
            errors,
            warnings,
            duration: Date.now() - start,
        };
    }
    catch (error) {
        errors.push(error.message);
        return {
            success: false,
            output: '',
            errors,
            warnings,
            duration: Date.now() - start,
        };
    }
}
export async function transpileCode(code) {
    const result = await compileCode(code);
    if (!result.success) {
        throw new Error(result.errors.join('\n'));
    }
    return result.output;
}
//# sourceMappingURL=compiler.js.map