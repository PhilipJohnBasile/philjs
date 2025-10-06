import { signal } from 'philjs-core';

interface LanguageTabsProps {
  js: string;
  ts: string;
  filename?: string;
}

export function LanguageTabs(props: LanguageTabsProps) {
  const activeTab = signal<'js' | 'ts'>('ts');
  const copied = signal(false);

  const currentCode = () => activeTab() === 'js' ? props.js : props.ts;

  const copyCode = async () => {
    await navigator.clipboard.writeText(currentCode());
    copied.set(true);
    setTimeout(() => copied.set(false), 2000);
  };

  return (
    <div style="margin: 1.5rem 0;">
      {/* Filename if provided */}
      {props.filename && (
        <div style="
          background: var(--color-bg-alt);
          padding: 0.5rem 1rem;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          font-family: var(--font-mono);
        ">
          {props.filename}
        </div>
      )}

      {/* Language Tabs */}
      <div style="
        display: flex;
        gap: 0.25rem;
        border-bottom: 1px solid var(--color-border);
        background: var(--color-bg-alt);
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        padding: 0.5rem 0.5rem 0;
      ">
        <button
          onClick={() => activeTab.set('ts')}
          style={`
            padding: 0.5rem 1rem;
            border: none;
            background: ${activeTab() === 'ts' ? 'var(--color-bg-code)' : 'transparent'};
            color: ${activeTab() === 'ts' ? 'var(--color-text)' : 'var(--color-text-secondary)'};
            cursor: pointer;
            font-size: 0.875rem;
            font-family: var(--font-mono);
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
            transition: all var(--transition-fast);
            border-bottom: 2px solid ${activeTab() === 'ts' ? 'var(--color-brand)' : 'transparent'};
          `}
          aria-selected={activeTab() === 'ts'}
          role="tab"
        >
          TypeScript
        </button>
        <button
          onClick={() => activeTab.set('js')}
          style={`
            padding: 0.5rem 1rem;
            border: none;
            background: ${activeTab() === 'js' ? 'var(--color-bg-code)' : 'transparent'};
            color: ${activeTab() === 'js' ? 'var(--color-text)' : 'var(--color-text-secondary)'};
            cursor: pointer;
            font-size: 0.875rem;
            font-family: var(--font-mono);
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
            transition: all var(--transition-fast);
            border-bottom: 2px solid ${activeTab() === 'js' ? 'var(--color-brand)' : 'transparent'};
          `}
          aria-selected={activeTab() === 'js'}
          role="tab"
        >
          JavaScript
        </button>
      </div>

      {/* Code block */}
      <div style="position: relative;">
        <pre style="
          background: var(--color-bg-code);
          padding: 1.25rem;
          margin: 0;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          overflow-x: auto;
          border: 1px solid var(--color-code-border);
          border-top: none;
        ">
          <code style="
            font-family: var(--font-mono);
            color: var(--color-code-text);
            font-size: 0.875rem;
            line-height: 1.7;
          ">
            {currentCode()}
          </code>
        </pre>

        <button
          onClick={copyCode}
          style="
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            padding: 0.5rem 0.75rem;
            background: var(--color-bg-alt);
            border: 1px solid var(--color-border);
            border-radius: 6px;
            font-size: 0.75rem;
            color: var(--color-text-secondary);
            transition: all var(--transition-fast);
            cursor: pointer;
          "
          aria-label="Copy code"
        >
          {copied() ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
