/**
 * PhilJS VS Code - Hover Provider
 */

import * as vscode from 'vscode';

interface HoverInfo {
  description: string;
  signature?: string;
  example?: string;
  link?: string;
}

const philjsDocs: Record<string, HoverInfo> = {
  signal: {
    description: 'Creates a reactive signal that triggers updates when its value changes.',
    signature: 'signal<T>(initialValue: T): Signal<T>',
    example: 'const count = signal(0);\ncount.get(); // 0\ncount.set(1); // triggers reactivity',
    link: 'https://philjs.dev/docs/signals',
  },
  computed: {
    description: 'Creates a derived value that automatically updates when dependencies change.',
    signature: 'computed<T>(fn: () => T): Computed<T>',
    example: 'const count = signal(1);\nconst doubled = computed(() => count.get() * 2);',
    link: 'https://philjs.dev/docs/computed',
  },
  effect: {
    description: 'Runs a side effect whenever its reactive dependencies change.',
    signature: 'effect(fn: () => void | (() => void)): void',
    example: 'effect(() => {\n  console.log("Count changed:", count.get());\n});',
    link: 'https://philjs.dev/docs/effects',
  },
  memo: {
    description: 'Memoizes a component to prevent unnecessary re-renders.',
    signature: 'memo<P>(component: Component<P>): Component<P>',
    example: 'const MemoizedItem = memo((props) => <div>{props.name}</div>);',
    link: 'https://philjs.dev/docs/memo',
  },
  onMount: {
    description: 'Runs a callback when the component is mounted to the DOM.',
    signature: 'onMount(fn: () => void | (() => void)): void',
    example: 'onMount(() => {\n  console.log("Component mounted");\n  return () => console.log("Cleanup");\n});',
    link: 'https://philjs.dev/docs/lifecycle',
  },
  onCleanup: {
    description: 'Registers a cleanup function that runs when the component unmounts.',
    signature: 'onCleanup(fn: () => void): void',
    example: 'onCleanup(() => {\n  subscription.unsubscribe();\n});',
    link: 'https://philjs.dev/docs/lifecycle',
  },
  createContext: {
    description: 'Creates a context for passing data through the component tree.',
    signature: 'createContext<T>(defaultValue: T): Context<T>',
    example: 'const ThemeContext = createContext("light");',
    link: 'https://philjs.dev/docs/context',
  },
  useContext: {
    description: 'Accesses the value of a context from a parent provider.',
    signature: 'useContext<T>(context: Context<T>): T',
    example: 'const theme = useContext(ThemeContext);',
    link: 'https://philjs.dev/docs/context',
  },
};

export class PhilJSHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const range = document.getWordRangeAtPosition(position);
    if (!range) return null;

    const word = document.getText(range);
    const info = philjsDocs[word];

    if (!info) return null;

    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    // Add description
    markdown.appendMarkdown(`**${word}** - ${info.description}\n\n`);

    // Add signature
    if (info.signature) {
      markdown.appendCodeblock(info.signature, 'typescript');
    }

    // Add example
    if (info.example) {
      markdown.appendMarkdown('\n**Example:**\n');
      markdown.appendCodeblock(info.example, 'typescript');
    }

    // Add link
    if (info.link) {
      markdown.appendMarkdown(`\n[View documentation](${info.link})`);
    }

    return new vscode.Hover(markdown, range);
  }
}
