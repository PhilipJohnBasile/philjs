import { getAdjacentDocs } from '../lib/docs-structure';

interface DocNavigationProps {
  section: string;
  file: string;
  navigate: (path: string) => void;
}

export function DocNavigation({ section, file, navigate }: DocNavigationProps) {
  const { prev, next } = getAdjacentDocs(section, file);

  // Always render structure, use opacity/pointer-events to hide
  const hasPrev = !!prev;
  const hasNext = !!next;

  return (
    <nav
      style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-top: 4rem;
        padding-top: 2rem;
        border-top: 1px solid var(--color-border);
      "
    >
      {/* Previous */}
      <button
        onClick={() => hasPrev && prev && navigate(`/docs/${prev.path}/${prev.file}`)}
        style={`
          text-align: left;
          padding: 1.25rem;
          background: var(--color-bg-alt);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          cursor: ${hasPrev ? 'pointer' : 'default'};
          transition: all 0.2s;
          opacity: ${hasPrev ? '1' : '0'};
          pointer-events: ${hasPrev ? 'auto' : 'none'};
        `}
        onMouseEnter={(e) => {
          if (hasPrev) {
            (e.target as HTMLElement).style.borderColor = 'var(--color-brand)';
            (e.target as HTMLElement).style.transform = 'translateX(-4px)';
          }
        }}
        onMouseLeave={(e) => {
          if (hasPrev) {
            (e.target as HTMLElement).style.borderColor = 'var(--color-border)';
            (e.target as HTMLElement).style.transform = 'translateX(0)';
          }
        }}
      >
        <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>←</span>
          <span>Previous</span>
        </div>
        <div style="font-weight: 500; color: var(--color-text);">
          {prev?.title || ''}
        </div>
        <div style="font-size: 0.8125rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
          {prev?.section || ''}
        </div>
      </button>

      {/* Next */}
      <button
        onClick={() => hasNext && next && navigate(`/docs/${next.path}/${next.file}`)}
        style={`
          text-align: right;
          padding: 1.25rem;
          background: var(--color-bg-alt);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          cursor: ${hasNext ? 'pointer' : 'default'};
          transition: all 0.2s;
          grid-column: ${hasPrev ? 'auto' : '2'};
          opacity: ${hasNext ? '1' : '0'};
          pointer-events: ${hasNext ? 'auto' : 'none'};
        `}
        onMouseEnter={(e) => {
          if (hasNext) {
            (e.target as HTMLElement).style.borderColor = 'var(--color-brand)';
            (e.target as HTMLElement).style.transform = 'translateX(4px)';
          }
        }}
        onMouseLeave={(e) => {
          if (hasNext) {
            (e.target as HTMLElement).style.borderColor = 'var(--color-border)';
            (e.target as HTMLElement).style.transform = 'translateX(0)';
          }
        }}
      >
        <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
          <span>Next</span>
          <span>→</span>
        </div>
        <div style="font-weight: 500; color: var(--color-text);">
          {next?.title || ''}
        </div>
        <div style="font-size: 0.8125rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
          {next?.section || ''}
        </div>
      </button>
    </nav>
  );
}
