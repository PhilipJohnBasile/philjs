/**
 * PhilJS CLI - Context Generator
 *
 * Generate context providers with hooks
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import { toPascalCase, toCamelCase } from './template-engine.js';
/**
 * Generate a context provider
 */
export async function generateContext(options) {
    const { name, directory = 'src/contexts', typescript = true, withTest = true, } = options;
    const contextName = toPascalCase(name);
    const camelName = toCamelCase(name);
    const ext = typescript ? 'tsx' : 'jsx';
    const contextDir = path.join(process.cwd(), directory, contextName);
    const createdFiles = [];
    // Create directory
    await fs.mkdir(contextDir, { recursive: true });
    // Generate context file
    const contextContent = generateContextTemplate(contextName, camelName, typescript);
    const contextPath = path.join(contextDir, `${contextName}Context.${ext}`);
    await fs.writeFile(contextPath, contextContent);
    createdFiles.push(contextPath);
    console.log(pc.green(`  + Created ${contextName}/${contextName}Context.${ext}`));
    // Generate hook file
    const hookContent = generateHookTemplate(contextName, camelName, typescript);
    const hookPath = path.join(contextDir, `use${contextName}.${typescript ? 'ts' : 'js'}`);
    await fs.writeFile(hookPath, hookContent);
    createdFiles.push(hookPath);
    console.log(pc.green(`  + Created ${contextName}/use${contextName}.${typescript ? 'ts' : 'js'}`));
    // Generate index file
    const indexContent = generateIndexTemplate(contextName, typescript);
    const indexPath = path.join(contextDir, `index.${typescript ? 'ts' : 'js'}`);
    await fs.writeFile(indexPath, indexContent);
    createdFiles.push(indexPath);
    console.log(pc.green(`  + Created ${contextName}/index.${typescript ? 'ts' : 'js'}`));
    // Generate test file
    if (withTest) {
        const testContent = generateTestTemplate(contextName, camelName, typescript);
        const testPath = path.join(contextDir, `${contextName}Context.test.${ext}`);
        await fs.writeFile(testPath, testContent);
        createdFiles.push(testPath);
        console.log(pc.green(`  + Created ${contextName}/${contextName}Context.test.${ext}`));
    }
    return createdFiles;
}
function generateContextTemplate(name, camelName, typescript) {
    return `/**
 * ${name} Context
 *
 * Provides ${camelName} state and actions to child components.
 */

import { JSX, createContext, signal } from 'philjs-core';

${typescript ? `export interface ${name}State {\n  // Add your state properties here\n  value: string;\n  isLoading: boolean;\n}\n` : ''}
${typescript ? `export interface ${name}Actions {\n  // Add your action methods here\n  setValue: (value: string) => void;\n  setLoading: (loading: boolean) => void;\n  reset: () => void;\n}\n` : ''}
${typescript ? `export interface ${name}ContextValue extends ${name}State, ${name}Actions {}\n` : ''}
${typescript ? `export interface ${name}ProviderProps {\n  children: JSX.Element;\n  initialValue?: Partial<${name}State>;\n}\n` : ''}
const defaultState${typescript ? `: ${name}State` : ''} = {
  value: '',
  isLoading: false,
};

export const ${name}Context = createContext${typescript ? `<${name}ContextValue | null>` : ''}(null);

export function ${name}Provider(${typescript ? `props: ${name}ProviderProps` : 'props'}) {
  const { children, initialValue = {} } = props;

  const state = signal${typescript ? `<${name}State>` : ''}({
    ...defaultState,
    ...initialValue,
  });

  const setValue = (value${typescript ? ': string' : ''}) => {
    state.set({ ...state.get(), value });
  };

  const setLoading = (isLoading${typescript ? ': boolean' : ''}) => {
    state.set({ ...state.get(), isLoading });
  };

  const reset = () => {
    state.set(defaultState);
  };

  const contextValue${typescript ? `: ${name}ContextValue` : ''} = {
    get value() { return state.get().value; },
    get isLoading() { return state.get().isLoading; },
    setValue,
    setLoading,
    reset,
  };

  return (
    <${name}Context.Provider value={contextValue}>
      {children}
    </${name}Context.Provider>
  );
}
`;
}
function generateHookTemplate(name, camelName, typescript) {
    return `/**
 * use${name} - Hook to access ${name} context
 */

import { useContext } from 'philjs-core';
import { ${name}Context } from './${name}Context';
${typescript ? `import type { ${name}ContextValue } from './${name}Context';\n` : ''}
export function use${name}()${typescript ? `: ${name}ContextValue` : ''} {
  const context = useContext(${name}Context);

  if (!context) {
    throw new Error('use${name} must be used within a ${name}Provider');
  }

  return context;
}
`;
}
function generateIndexTemplate(name, typescript) {
    if (typescript) {
        return `export { ${name}Context, ${name}Provider } from './${name}Context';
export { use${name} } from './use${name}';
export type {
  ${name}State,
  ${name}Actions,
  ${name}ContextValue,
  ${name}ProviderProps,
} from './${name}Context';
`;
    }
    return `export { ${name}Context, ${name}Provider } from './${name}Context';
export { use${name} } from './use${name}';
`;
}
function generateTestTemplate(name, camelName, typescript) {
    return `import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from 'philjs-testing';
import { ${name}Provider, ${name}Context } from './${name}Context';
import { use${name} } from './use${name}';

// Test component that uses the context
function TestConsumer() {
  const { value, setValue, isLoading } = use${name}();

  return (
    <div>
      <span data-testid="value">{value}</span>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <button onClick={() => setValue('updated')}>Update</button>
    </div>
  );
}

describe('${name}Context', () => {
  it('provides default values', () => {
    render(
      <${name}Provider>
        <TestConsumer />
      </${name}Provider>
    );

    expect(screen.getByTestId('value').textContent).toBe('');
    expect(screen.getByTestId('loading').textContent).toBe('ready');
  });

  it('accepts initial values', () => {
    render(
      <${name}Provider initialValue={{ value: 'initial', isLoading: true }}>
        <TestConsumer />
      </${name}Provider>
    );

    expect(screen.getByTestId('value').textContent).toBe('initial');
    expect(screen.getByTestId('loading').textContent).toBe('loading');
  });

  it('updates value through context', async () => {
    render(
      <${name}Provider>
        <TestConsumer />
      </${name}Provider>
    );

    const button = screen.getByRole('button');

    await act(() => {
      button.click();
    });

    expect(screen.getByTestId('value').textContent).toBe('updated');
  });

  it('throws error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('use${name} must be used within a ${name}Provider');

    consoleError.mockRestore();
  });
});
`;
}
//# sourceMappingURL=context.js.map