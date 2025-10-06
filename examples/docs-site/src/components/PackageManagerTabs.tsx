import { signal } from 'philjs-core';

interface PackageManagerTabsProps {
  npm: string;
  pnpm?: string;
  yarn?: string;
  bun?: string;
}

export function PackageManagerTabs(props: PackageManagerTabsProps) {
  const activeTab = signal<'npm' | 'pnpm' | 'yarn' | 'bun'>('npm');
  const copied = signal(false);

  const tabs: Array<{ key: 'npm' | 'pnpm' | 'yarn' | 'bun'; label: string; command?: string }> = [
    { key: 'npm', label: 'npm', command: props.npm },
    { key: 'pnpm', label: 'pnpm', command: props.pnpm || props.npm.replace('npm install', 'pnpm add').replace('npm run', 'pnpm') },
    { key: 'yarn', label: 'yarn', command: props.yarn || props.npm.replace('npm install', 'yarn add').replace('npm run', 'yarn') },
    { key: 'bun', label: 'bun', command: props.bun || props.npm.replace('npm install', 'bun add').replace('npm run', 'bun') },
  ];

  const currentCommand = () => {
    const tab = tabs.find(t => t.key === activeTab());
    return tab?.command || '';
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(currentCommand());
    copied.set(true);
    setTimeout(() => copied.set(false), 2000);
  };

  return (
    <div style="margin: 1.5rem 0;">
      {/* Tabs */}
      <div style="
        display: flex;
        gap: 0.25rem;
        border-bottom: 1px solid var(--color-border);
        background: var(--color-bg-alt);
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        padding: 0.5rem 0.5rem 0;
      ">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => activeTab.set(tab.key)}
            style={`
              padding: 0.5rem 1rem;
              border: none;
              background: ${activeTab() === tab.key ? 'var(--color-bg-code)' : 'transparent'};
              color: ${activeTab() === tab.key ? 'var(--color-text)' : 'var(--color-text-secondary)'};
              cursor: pointer;
              font-size: 0.875rem;
              font-family: var(--font-mono);
              border-top-left-radius: 6px;
              border-top-right-radius: 6px;
              transition: all var(--transition-fast);
              border-bottom: 2px solid ${activeTab() === tab.key ? 'var(--color-brand)' : 'transparent'};
            `}
            aria-selected={activeTab() === tab.key}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
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
            {currentCommand()}
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
          aria-label="Copy command"
        >
          {copied() ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
