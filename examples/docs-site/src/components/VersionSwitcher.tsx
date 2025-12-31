import { signal } from '@philjs/core';

interface Version {
  version: string;
  label: string;
  url: string;
  status: 'stable' | 'preview' | 'legacy';
}

const versions: Version[] = [
  { version: '0.1', label: '0.1 (Preview)', url: '/', status: 'preview' },
];

export function VersionSwitcher() {
  const isOpen = signal(false);
  const currentVersion = '0.1';

  const handleVersionChange = (version: Version) => {
    if (version.url !== '/') {
      window.location.href = version.url;
    }
    isOpen.set(false);
  };

  return (
    <div style="position: relative;">
      <button
        onClick={() => isOpen.set(!isOpen())}
        style="
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--color-bg-alt);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          color: var(--color-text);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        "
        aria-label="Select version"
        aria-expanded={isOpen()}
        aria-haspopup="listbox"
      >
        <span>v{currentVersion}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={`transform: rotate(${isOpen() ? '180deg' : '0deg'}); transition: transform var(--transition-fast);`}
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      {isOpen() && (
        <div
          style="
            position: absolute;
            top: calc(100% + 0.5rem);
            right: 0;
            min-width: 200px;
            background: var(--color-bg);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            padding: 0.5rem;
            z-index: 1000;
          "
          role="listbox"
        >
          {versions.map((version) => (
            <button
              key={version.version}
              onClick={() => handleVersionChange(version)}
              style={`
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem;
                border: none;
                background: ${version.version === currentVersion ? 'var(--color-bg-alt)' : 'transparent'};
                color: var(--color-text);
                text-align: left;
                border-radius: 6px;
                cursor: pointer;
                transition: background var(--transition-fast);
                font-size: 0.875rem;
              `}
              role="option"
              aria-selected={version.version === currentVersion}
            >
              <span>{version.label}</span>
              {version.status === 'stable' && (
                <span style="
                  padding: 0.125rem 0.5rem;
                  background: var(--color-success);
                  color: white;
                  border-radius: 4px;
                  font-size: 0.75rem;
                  font-weight: 600;
                ">
                  STABLE
                </span>
              )}
              {version.status === 'preview' && (
                <span style="
                  padding: 0.125rem 0.5rem;
                  background: var(--color-brand);
                  color: white;
                  border-radius: 4px;
                  font-size: 0.75rem;
                  font-weight: 600;
                ">
                  PREVIEW
                </span>
              )}
              {version.status === 'legacy' && (
                <span style="
                  padding: 0.125rem 0.5rem;
                  background: var(--color-text-tertiary);
                  color: white;
                  border-radius: 4px;
                  font-size: 0.75rem;
                  font-weight: 600;
                ">
                  LEGACY
                </span>
              )}
            </button>
          ))}

          <div style="
            border-top: 1px solid var(--color-border);
            margin-top: 0.5rem;
            padding-top: 0.5rem;
          ">
            <a
              href="/docs/changelog/overview"
              style="
                display: block;
                padding: 0.75rem;
                color: var(--color-brand);
                font-size: 0.875rem;
                text-decoration: none;
                border-radius: 6px;
                transition: background var(--transition-fast);
              "
            >
              View all releases →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
