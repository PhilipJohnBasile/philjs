/**
 * PhilJS Playground Compiler
 */

import type { CompileResult } from './types';

export async function compileCode(code: string): Promise<CompileResult> {
  const start = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Use Babel for transpilation
    const Babel = (window as any).Babel || (await import('@babel/standalone')).default;

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
  } catch (error) {
    errors.push((error as Error).message);
    return {
      success: false,
      output: '',
      errors,
      warnings,
      duration: Date.now() - start,
    };
  }
}

export async function transpileCode(code: string): Promise<string> {
  const result = await compileCode(code);
  if (!result.success) {
    throw new Error(result.errors.join('\n'));
  }
  return result.output;
}
