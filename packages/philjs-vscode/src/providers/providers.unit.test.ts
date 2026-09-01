import { describe, expect, it } from 'vitest';
import { PhilJSCompletionProvider } from './completion-enhanced.js';
import { PhilJSHoverProvider } from './hover.js';

function documentWith(text: string) {
  const lines = text.split('\n');
  return {
    getText: (range?: unknown) => range ? 'signal' : text,
    lineAt: (position: { line: number }) => ({ text: lines[position.line] ?? '' }),
    getWordRangeAtPosition: () => ({ start: 0, end: 6 }),
  };
}

describe('PhilJS VS Code providers', () => {
  it('offers reactive completions in a PhilJS document', () => {
    const provider = new PhilJSCompletionProvider();
    const document = documentWith('import { signal } from "@philjs/core";\nconst count = sig');
    const items = provider.provideCompletionItems(
      document as never,
      { line: 1, character: 17 } as never,
      {} as never,
      { triggerKind: 0 } as never,
    ) as Array<{ label: string }>;

    expect(items.some((item) => item.label === 'signal')).toBe(true);
    expect(items.some((item) => item.label === 'effect')).toBe(true);
  });

  it('offers component completions after a JSX opening bracket', () => {
    const provider = new PhilJSCompletionProvider();
    const items = provider.provideCompletionItems(
      documentWith('const view = <') as never,
      { line: 0, character: 14 } as never,
      {} as never,
      { triggerKind: 1, triggerCharacter: '<' } as never,
    ) as Array<{ label: string }>;

    expect(items.some((item) => item.label === 'Button')).toBe(true);
  });

  it('returns trusted PhilJS documentation for known symbols', () => {
    const provider = new PhilJSHoverProvider();
    const hover = provider.provideHover(
      documentWith('signal') as never,
      { line: 0, character: 2 } as never,
      {} as never,
    ) as { contents: { value: string; isTrusted: boolean } };

    expect(hover.contents.isTrusted).toBe(true);
    expect(hover.contents.value).toContain('Creates a reactive signal');
  });
});
