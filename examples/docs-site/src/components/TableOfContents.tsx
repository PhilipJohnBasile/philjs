import { signal, effect } from 'philjs-core';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const tocItems = signal<TocItem[]>([]);
  const activeId = signal<string>('');

  // Parse headings from markdown HTML
  effect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');

    const items: TocItem[] = [];
    headings.forEach((heading, index) => {
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName[1]);
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

      items.push({ id, text, level });
    });

    tocItems.set(items);
  });

  // Track active heading on scroll
  effect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h2, h3');
      let currentId = '';

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100 && rect.top >= -rect.height) {
          currentId = heading.id;
        }
      });

      if (currentId) {
        activeId.set(currentId);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const items = tocItems();
  const hasItems = items.length > 0;

  return (
    <aside
      class="table-of-contents"
      style={`
        width: 240px;
        position: fixed;
        top: 80px;
        right: 0;
        height: calc(100vh - 80px);
        overflow-y: auto;
        padding: 1rem 1.5rem;
        border-left: 1px solid var(--color-border);
        background: var(--color-bg);
        display: ${hasItems ? 'block' : 'none'};
      `}
    >
      <h4 style="
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary);
        margin: 0 0 1rem 0;
      ">
        On This Page
      </h4>

      <nav>
        {items.map(item => {
          const isActive = activeId() === item.id;
          const paddingLeft = `${(item.level - 2) * 0.75}rem`;

          return (
            <a
              href={`#${item.id}`}
              style={`
                display: block;
                padding: 0.375rem 0;
                padding-left: ${paddingLeft};
                font-size: 0.8125rem;
                color: ${isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)'};
                text-decoration: none;
                border-left: ${isActive ? '2px solid var(--color-brand)' : '2px solid transparent'};
                margin-left: -2px;
                transition: all 0.2s;
                line-height: 1.4;
              `}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(item.id);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  window.history.replaceState(null, '', `#${item.id}`);
                }
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.target as HTMLElement).style.color = 'var(--color-text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.target as HTMLElement).style.color = 'var(--color-text-secondary)';
                }
              }}
            >
              {item.text}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
