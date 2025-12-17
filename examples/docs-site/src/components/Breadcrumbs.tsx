import { docsStructure } from '../lib/docs-structure';

interface BreadcrumbsProps {
  section: string;
  file: string;
  navigate: (path: string) => void;
}

export function Breadcrumbs({ section, file, navigate }: BreadcrumbsProps) {
  const currentSection = docsStructure.find(s => s.path === section);
  const currentDoc = currentSection?.items.find(item => item.file === file);

  // Build breadcrumb parts
  const sectionTitle = currentSection?.title || section;
  const docTitle = currentDoc?.title || '';

  return (
    <nav
      style="
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--color-text-secondary);
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      "
    >
      <button
        onClick={() => navigate('/')}
        style="
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 0;
          text-decoration: none;
          transition: color 0.2s;
        "
        onMouseEnter={(e: MouseEvent) => (e.target as HTMLElement).style.color = 'var(--color-brand)'}
        onMouseLeave={(e: MouseEvent) => (e.target as HTMLElement).style.color = 'var(--color-text-secondary)'}
      >
        Home
      </button>

      <span style="color: var(--color-text-secondary);">/</span>

      <button
        onClick={() => navigate(`/docs/${section}`)}
        style="
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 0;
          text-decoration: none;
          transition: color 0.2s;
        "
        onMouseEnter={(e: MouseEvent) => (e.target as HTMLElement).style.color = 'var(--color-brand)'}
        onMouseLeave={(e: MouseEvent) => (e.target as HTMLElement).style.color = 'var(--color-text-secondary)'}
      >
        {sectionTitle}
      </button>

      <span style="color: var(--color-text-secondary);">/</span>
      <span style="color: var(--color-text); font-weight: 500;">
        {docTitle}
      </span>
    </nav>
  );
}
