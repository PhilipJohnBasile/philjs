/**
 * PhilJS VS Code - Signature Help Provider
 * Provides parameter hints for PhilJS functions
 */

import * as vscode from 'vscode';

interface SignatureInfo {
  label: string;
  parameters: {
    label: string;
    documentation: string;
  }[];
  documentation: string;
}

const signatureHelp: Record<string, SignatureInfo> = {
  signal: {
    label: 'signal<T>(initialValue: T): Signal<T>',
    parameters: [
      {
        label: 'initialValue: T',
        documentation: 'The initial value of the signal',
      },
    ],
    documentation: 'Creates a reactive signal that triggers updates when its value changes.',
  },
  computed: {
    label: 'computed<T>(fn: () => T): Computed<T>',
    parameters: [
      {
        label: 'fn: () => T',
        documentation: 'The computation function that derives the value',
      },
    ],
    documentation: 'Creates a derived value that automatically updates when dependencies change.',
  },
  effect: {
    label: 'effect(fn: () => void | (() => void)): void',
    parameters: [
      {
        label: 'fn: () => void | (() => void)',
        documentation: 'The effect function, optionally returning a cleanup function',
      },
    ],
    documentation: 'Runs a side effect whenever its reactive dependencies change.',
  },
  memo: {
    label: 'memo<P>(component: Component<P>, equals?: (prev: P, next: P) => boolean): Component<P>',
    parameters: [
      {
        label: 'component: Component<P>',
        documentation: 'The component to memoize',
      },
      {
        label: 'equals?: (prev: P, next: P) => boolean',
        documentation: 'Optional equality function for prop comparison',
      },
    ],
    documentation: 'Memoizes a component to prevent unnecessary re-renders.',
  },
  onMount: {
    label: 'onMount(fn: () => void | (() => void)): void',
    parameters: [
      {
        label: 'fn: () => void | (() => void)',
        documentation: 'The function to run on mount, optionally returning a cleanup function',
      },
    ],
    documentation: 'Runs a callback when the component is mounted.',
  },
  onCleanup: {
    label: 'onCleanup(fn: () => void): void',
    parameters: [
      {
        label: 'fn: () => void',
        documentation: 'The cleanup function to run',
      },
    ],
    documentation: 'Registers a cleanup function.',
  },
  createContext: {
    label: 'createContext<T>(defaultValue: T): Context<T>',
    parameters: [
      {
        label: 'defaultValue: T',
        documentation: 'The default value for the context',
      },
    ],
    documentation: 'Creates a context for passing data through the component tree.',
  },
  useContext: {
    label: 'useContext<T>(context: Context<T>): T',
    parameters: [
      {
        label: 'context: Context<T>',
        documentation: 'The context to read from',
      },
    ],
    documentation: 'Accesses the value of a context.',
  },
  renderToString: {
    label: 'renderToString(element: JSX.Element, options?: SSROptions): Promise<string>',
    parameters: [
      {
        label: 'element: JSX.Element',
        documentation: 'The component to render',
      },
      {
        label: 'options?: SSROptions',
        documentation: 'Optional SSR configuration',
      },
    ],
    documentation: 'Renders a component to an HTML string for server-side rendering.',
  },
  hydrate: {
    label: 'hydrate(container: Element, element: JSX.Element): void',
    parameters: [
      {
        label: 'container: Element',
        documentation: 'The DOM element to hydrate into',
      },
      {
        label: 'element: JSX.Element',
        documentation: 'The component to hydrate',
      },
    ],
    documentation: 'Hydrates a server-rendered component on the client.',
  },
  island: {
    label: 'island<P>(component: Component<P>, options?: IslandOptions): Component<P>',
    parameters: [
      {
        label: 'component: Component<P>',
        documentation: 'The component to turn into an island',
      },
      {
        label: 'options?: IslandOptions',
        documentation: 'Optional island configuration (lazy, priority, etc.)',
      },
    ],
    documentation: 'Creates an interactive island component for partial hydration.',
  },
};

export class PhilJSSignatureHelpProvider implements vscode.SignatureHelpProvider {
  provideSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.SignatureHelpContext
  ): vscode.ProviderResult<vscode.SignatureHelp> {
    const line = document.lineAt(position.line).text;
    const beforeCursor = line.substring(0, position.character);

    // Find the function name before the opening parenthesis
    const functionMatch = beforeCursor.match(/(\w+)\s*\([^)]*$/);
    if (!functionMatch) return null;

    const functionName = functionMatch[1];
    const info = signatureHelp[functionName];

    if (!info) return null;

    const signature = new vscode.SignatureInformation(
      info.label,
      new vscode.MarkdownString(info.documentation)
    );

    for (const param of info.parameters) {
      signature.parameters.push(
        new vscode.ParameterInformation(
          param.label,
          new vscode.MarkdownString(param.documentation)
        )
      );
    }

    // Determine which parameter the cursor is on
    const parameterIndex = this.getActiveParameter(beforeCursor);

    const result = new vscode.SignatureHelp();
    result.signatures = [signature];
    result.activeSignature = 0;
    result.activeParameter = Math.min(parameterIndex, info.parameters.length - 1);

    return result;
  }

  private getActiveParameter(text: string): number {
    // Count commas after the opening parenthesis to determine parameter index
    const openParenIndex = text.lastIndexOf('(');
    if (openParenIndex === -1) return 0;

    const afterParen = text.substring(openParenIndex + 1);
    let commaCount = 0;
    let depth = 0;

    for (let i = 0; i < afterParen.length; i++) {
      const char = afterParen[i];
      if (char === '(' || char === '[' || char === '{') {
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
      } else if (char === ',' && depth === 0) {
        commaCount++;
      }
    }

    return commaCount;
  }
}
