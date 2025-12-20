/**
 * PhilJS CLI - Hook Generator
 *
 * Generate custom hooks with tests
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import { toPascalCase, toCamelCase } from './template-engine.js';

export interface HookOptions {
  name: string;
  directory?: string;
  typescript?: boolean;
  withTest?: boolean;
}

/**
 * Generate a custom hook
 */
export async function generateHook(options: HookOptions): Promise<string[]> {
  const {
    name,
    directory = 'src/hooks',
    typescript = true,
    withTest = true,
  } = options;

  // Ensure hook name starts with 'use'
  const hookName = name.startsWith('use')
    ? name
    : `use${toPascalCase(name)}`;

  const ext = typescript ? 'ts' : 'js';
  const hookDir = path.join(process.cwd(), directory);
  const createdFiles: string[] = [];

  // Create directory
  await fs.mkdir(hookDir, { recursive: true });

  // Generate hook file
  const hookContent = generateHookTemplate(hookName, typescript);
  const hookPath = path.join(hookDir, `${hookName}.${ext}`);
  await fs.writeFile(hookPath, hookContent);
  createdFiles.push(hookPath);
  console.log(pc.green(`  + Created ${hookName}.${ext}`));

  // Generate test file
  if (withTest) {
    const testContent = generateTestTemplate(hookName, typescript);
    const testPath = path.join(hookDir, `${hookName}.test.${ext}`);
    await fs.writeFile(testPath, testContent);
    createdFiles.push(testPath);
    console.log(pc.green(`  + Created ${hookName}.test.${ext}`));
  }

  // Update index file
  await updateIndexFile(hookDir, hookName, typescript);

  return createdFiles;
}

function generateHookTemplate(name: string, typescript: boolean): string {
  const returnType = typescript
    ? `: { value: string; setValue: (v: string) => void; reset: () => void }`
    : '';

  return `/**
 * ${name} - Custom hook
 */

import { signal, computed } from 'philjs-core';

${typescript ? `export interface ${name}Options {\n  initialValue?: string;\n}\n` : ''}
${typescript ? `export interface ${name}Return {\n  value: string;\n  setValue: (value: string) => void;\n  reset: () => void;\n}\n` : ''}
export function ${name}(${typescript ? `options: ${name}Options = {}` : 'options = {}'}): ${typescript ? `${name}Return` : 'object'} {
  const { initialValue = '' } = options;

  const state = signal(initialValue);

  const setValue = (newValue${typescript ? ': string' : ''}) => {
    state.set(newValue);
  };

  const reset = () => {
    state.set(initialValue);
  };

  return {
    get value() {
      return state.get();
    },
    setValue,
    reset,
  };
}
`;
}

function generateTestTemplate(name: string, typescript: boolean): string {
  return `import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from 'philjs-testing';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('returns initial value', () => {
    const { result } = renderHook(() => ${name}({ initialValue: 'test' }));
    expect(result.current.value).toBe('test');
  });

  it('returns empty string by default', () => {
    const { result } = renderHook(() => ${name}());
    expect(result.current.value).toBe('');
  });

  it('updates value with setValue', () => {
    const { result } = renderHook(() => ${name}());

    act(() => {
      result.current.setValue('new value');
    });

    expect(result.current.value).toBe('new value');
  });

  it('resets to initial value', () => {
    const { result } = renderHook(() => ${name}({ initialValue: 'initial' }));

    act(() => {
      result.current.setValue('changed');
    });
    expect(result.current.value).toBe('changed');

    act(() => {
      result.current.reset();
    });
    expect(result.current.value).toBe('initial');
  });
});
`;
}

async function updateIndexFile(
  hookDir: string,
  hookName: string,
  typescript: boolean
): Promise<void> {
  const indexPath = path.join(hookDir, `index.${typescript ? 'ts' : 'js'}`);
  const exportLine = `export { ${hookName} } from './${hookName}';\n`;
  const typeExportLine = typescript
    ? `export type { ${hookName}Options, ${hookName}Return } from './${hookName}';\n`
    : '';

  let existingContent = '';
  try {
    existingContent = await fs.readFile(indexPath, 'utf-8');
  } catch {
    // Index doesn't exist
  }

  let updated = false;
  if (!existingContent.includes(exportLine)) {
    existingContent += exportLine;
    updated = true;
  }
  if (typescript && typeExportLine && !existingContent.includes(typeExportLine)) {
    existingContent += typeExportLine;
    updated = true;
  }

  if (updated) {
    await fs.writeFile(indexPath, existingContent);
    console.log(pc.green(`  + Updated index.${typescript ? 'ts' : 'js'}`));
  }
}
