import { signal, effect } from 'philjs-core';
import { getAllDocs } from '../lib/docs-structure';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  navigate: (path: string) => void;
}

export function SearchModal({ isOpen, onClose, navigate }: SearchModalProps) {
  const query = signal('');
  const selectedIndex = signal(0);
  const results = signal<Array<{ section: string; title: string; path: string; file: string }>>([]);

  // Search functionality
  effect(() => {
    const q = query().toLowerCase().trim();
    if (!q) {
      results.set([]);
      return;
    }

    const allDocs = getAllDocs();
    const filtered = allDocs.filter(doc => {
      const searchText = `${doc.title} ${doc.section}`.toLowerCase();
      return searchText.includes(q);
    });

    results.set(filtered.slice(0, 10)); // Limit to 10 results
    selectedIndex.set(0);
  });

  // Keyboard navigation
  effect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const resultsList = results();

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex.set(Math.min(selectedIndex() + 1, resultsList.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex.set(Math.max(selectedIndex() - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = resultsList[selectedIndex()];
        if (selected) {
          navigate(`/docs/${selected.path}/${selected.file}`);
          onClose();
          query.set('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const resultsList = results();
  const hasResults = resultsList.length > 0;
  const hasQuery = query().length > 0;
  const showNoResults = !hasResults && hasQuery;
  const showPrompt = !hasResults && !hasQuery;

  return (
    <div
      style={`
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 9999;
        display: ${isOpen ? 'flex' : 'none'};
        align-items: flex-start;
        justify-content: center;
        padding-top: 10vh;
        animation: fadeIn 0.2s ease-out;
      `}
      onClick={onClose}
    >
      <div
        style="
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          animation: slideDown 0.2s ease-out;
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div style="padding: 1.25rem; border-bottom: 1px solid var(--color-border);">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.25rem; color: var(--color-text-secondary);">🔍</span>
            <input
              type="text"
              placeholder="Search documentation..."
              value={query()}
              onInput={(e) => query.set((e.target as HTMLInputElement).value)}
              style="
                flex: 1;
                font-size: 1rem;
                background: transparent;
                border: none;
                outline: none;
                color: var(--color-text);
              "
              autofocus
            />
            <kbd style="
              padding: 0.25rem 0.5rem;
              font-size: 0.75rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 4px;
              color: var(--color-text-secondary);
            ">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div style="max-height: 400px; overflow-y: auto; padding: 0.5rem;">
          <div style={`padding: 2rem; text-align: center; color: var(--color-text-secondary); display: ${showNoResults ? 'block' : 'none'};`}>
            No results found for "{query()}"
          </div>

          <div style={`padding: 2rem; text-align: center; color: var(--color-text-secondary); display: ${showPrompt ? 'block' : 'none'};`}>
            Type to search documentation...
          </div>

          {resultsList.map((result, index) => {
            const isSelected = index === selectedIndex();

            return (
              <button
                style={`
                  width: 100%;
                  text-align: left;
                  padding: 0.75rem 1rem;
                  border: none;
                  background: ${isSelected ? 'var(--color-hover)' : 'transparent'};
                  border-radius: 8px;
                  cursor: pointer;
                  transition: background 0.2s;
                  display: block;
                `}
                onClick={() => {
                  navigate(`/docs/${result.path}/${result.file}`);
                  onClose();
                  query.set('');
                }}
                onMouseEnter={() => selectedIndex.set(index)}
              >
                <div style="font-weight: 500; color: var(--color-text); margin-bottom: 0.25rem;">
                  {result.title}
                </div>
                <div style="font-size: 0.8125rem; color: var(--color-text-secondary);">
                  {result.section}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={`
          padding: 0.75rem 1rem;
          border-top: 1px solid var(--color-border);
          display: ${hasResults ? 'flex' : 'none'};
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        `}>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <kbd style="padding: 0.25rem 0.5rem; background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 4px;">↑</kbd>
              <kbd style="padding: 0.25rem 0.5rem; background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 4px;">↓</kbd>
              <span>Navigate</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <kbd style="padding: 0.25rem 0.5rem; background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 4px;">Enter</kbd>
              <span>Select</span>
            </div>
        </div>
      </div>
    </div>
  );
}
