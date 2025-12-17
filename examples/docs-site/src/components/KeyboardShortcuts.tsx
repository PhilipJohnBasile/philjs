import { signal, effect } from 'philjs-core';

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  action: () => void;
  category?: string;
  enabled?: boolean;
}

export interface KeyboardShortcutsProps {
  shortcuts?: KeyboardShortcut[];
  showHelp?: boolean;
}

/**
 * KeyboardShortcuts Component
 *
 * Provides keyboard navigation and actions throughout the documentation.
 * Press '?' to view all available shortcuts.
 */
export function KeyboardShortcuts({
  shortcuts: customShortcuts = [],
  showHelp: initialShowHelp = false,
}: KeyboardShortcutsProps = {}) {
  const showHelp = signal(initialShowHelp);
  const searchQuery = signal('');

  // Default shortcuts for documentation
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      modifiers: ['meta'],
      description: 'Open search',
      action: () => {
        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
        window.dispatchEvent(event);
      },
      category: 'Navigation',
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => showHelp.set(!showHelp()),
      category: 'Help',
    },
    {
      key: 'Escape',
      description: 'Close modals/overlays',
      action: () => {
        showHelp.set(false);
        // Dispatch escape event for other components
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      },
      category: 'General',
    },
    {
      key: '/',
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      },
      category: 'Navigation',
    },
    {
      key: 'g',
      modifiers: ['shift'],
      description: 'Go to GitHub',
      action: () => window.open('https://github.com/philjs/philjs', '_blank'),
      category: 'Navigation',
    },
    {
      key: 'h',
      modifiers: ['shift'],
      description: 'Go to home',
      action: () => (window.location.href = '/'),
      category: 'Navigation',
    },
    {
      key: 'd',
      modifiers: ['shift'],
      description: 'Go to docs',
      action: () => (window.location.href = '/docs'),
      category: 'Navigation',
    },
    {
      key: 't',
      modifiers: ['shift'],
      description: 'Toggle theme',
      action: () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      },
      category: 'Appearance',
    },
    {
      key: 'c',
      modifiers: ['shift'],
      description: 'Copy current URL',
      action: () => {
        navigator.clipboard.writeText(window.location.href);
        // Show toast notification
        const toast = document.createElement('div');
        toast.textContent = 'URL copied to clipboard!';
        toast.style.cssText = `
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: var(--color-success);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.animation = 'fadeOut 0.2s ease-out';
          setTimeout(() => toast.remove(), 200);
        }, 2000);
      },
      category: 'Actions',
    },
    {
      key: 'p',
      modifiers: ['meta'],
      description: 'Print page',
      action: () => window.print(),
      category: 'Actions',
    },
    {
      key: '[',
      modifiers: ['meta'],
      description: 'Previous page',
      action: () => {
        const prevLink = document.querySelector('a[rel="prev"]') as HTMLAnchorElement;
        if (prevLink) prevLink.click();
      },
      category: 'Navigation',
    },
    {
      key: ']',
      modifiers: ['meta'],
      description: 'Next page',
      action: () => {
        const nextLink = document.querySelector('a[rel="next"]') as HTMLAnchorElement;
        if (nextLink) nextLink.click();
      },
      category: 'Navigation',
    },
  ];

  const allShortcuts = [...defaultShortcuts, ...customShortcuts];

  // Set up keyboard event listener
  effect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Except for Escape key
        if (e.key !== 'Escape') return;
      }

      for (const shortcut of allShortcuts) {
        if (shortcut.enabled === false) continue;

        const modifiersMatch =
          (!shortcut.modifiers || shortcut.modifiers.length === 0) ||
          shortcut.modifiers.every((mod) => {
            switch (mod) {
              case 'ctrl':
                return e.ctrlKey;
              case 'alt':
                return e.altKey;
              case 'shift':
                return e.shiftKey;
              case 'meta':
                return e.metaKey;
              default:
                return false;
            }
          });

        if (e.key === shortcut.key && modifiersMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Filter shortcuts by search query
  const filteredShortcuts = () => {
    if (!searchQuery()) return allShortcuts;
    const query = searchQuery().toLowerCase();
    return allShortcuts.filter(
      (s) =>
        s.description.toLowerCase().includes(query) ||
        s.key.toLowerCase().includes(query) ||
        s.category?.toLowerCase().includes(query)
    );
  };

  // Group shortcuts by category
  const groupedShortcuts = () => {
    const groups: Record<string, KeyboardShortcut[]> = {};
    for (const shortcut of filteredShortcuts()) {
      const category = shortcut.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(shortcut);
    }
    return groups;
  };

  // Format shortcut display
  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const keys: string[] = [];
    if (shortcut.modifiers) {
      for (const mod of shortcut.modifiers) {
        switch (mod) {
          case 'meta':
            keys.push('⌘');
            break;
          case 'ctrl':
            keys.push('Ctrl');
            break;
          case 'alt':
            keys.push('Alt');
            break;
          case 'shift':
            keys.push('Shift');
            break;
        }
      }
    }
    keys.push(shortcut.key.toUpperCase());
    return keys.join(' + ');
  };

  if (!showHelp()) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '2rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={() => showHelp.set(false)}
      role="dialog"
      aria-label="Keyboard shortcuts"
      aria-modal="true"
    >
      <div
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                margin: 0,
                marginBottom: '0.25rem',
              }}
            >
              ⌨️ Keyboard Shortcuts
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              Navigate and perform actions quickly
            </p>
          </div>
          <button
            onClick={() => showHelp.set(false)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-alt)',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              fontSize: '1.25rem',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery()}
            onInput={(e: Event) => searchQuery.set((e.target as HTMLInputElement).value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'var(--color-bg-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text)',
              fontSize: '0.9375rem',
              outline: 'none',
              transition: 'border-color var(--transition-fast)',
            }}
          />
        </div>

        {/* Shortcuts List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {Object.entries(groupedShortcuts()).map(([category, shortcuts]) => (
            <div key={category} style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1rem',
                }}
              >
                {category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={`${category}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--color-bg-alt)',
                      borderRadius: '8px',
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.9375rem',
                        color: 'var(--color-text)',
                      }}
                    >
                      {shortcut.description}
                    </span>
                    <kbd
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          <kbd
            style={{
              padding: '0.25rem 0.5rem',
              background: 'var(--color-bg-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ?
          </kbd>
          <span>to toggle this menu</span>
          <span style={{ margin: '0 0.5rem' }}>•</span>
          <kbd
            style={{
              padding: '0.25rem 0.5rem',
              background: 'var(--color-bg-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ESC
          </kbd>
          <span>to close</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to register custom keyboard shortcuts
 */
export function useKeyboardShortcut(
  key: string,
  action: () => void,
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[]
) {
  effect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifiersMatch =
        (!modifiers || modifiers.length === 0) ||
        modifiers.every((mod) => {
          switch (mod) {
            case 'ctrl':
              return e.ctrlKey;
            case 'alt':
              return e.altKey;
            case 'shift':
              return e.shiftKey;
            case 'meta':
              return e.metaKey;
            default:
              return false;
          }
        });

      if (e.key === key && modifiersMatch) {
        e.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
}

/**
 * Example usage:
 *
 * ```tsx
 * // Add to your app root
 * <KeyboardShortcuts
 *   shortcuts={[
 *     {
 *       key: 'b',
 *       modifiers: ['meta'],
 *       description: 'Toggle sidebar',
 *       action: () => toggleSidebar(),
 *       category: 'Navigation',
 *     },
 *   ]}
 * />
 *
 * // Or use the hook in components
 * useKeyboardShortcut('s', () => save(), ['meta']);
 * ```
 */
