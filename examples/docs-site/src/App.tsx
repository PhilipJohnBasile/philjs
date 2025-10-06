import { signal, effect, render } from 'philjs-core';
import { HomePage } from './pages/HomePage';
import { Sidebar } from './components/Sidebar';
import { TableOfContents } from './components/TableOfContents';
import { SearchModal } from './components/SearchModal';
import { Breadcrumbs } from './components/Breadcrumbs';
import { DocNavigation } from './components/DocNavigation';
import { renderMarkdown } from './lib/markdown-renderer';
import { docsStructure } from './lib/docs-structure';
import { Router } from './Router';
import './styles/global.css';
import 'highlight.js/styles/github-dark.css';

// Client-side routing
const currentPath = signal(window.location.pathname);

// Store scroll positions for history navigation
const scrollPositions = new Map<string, number>();

// Save current scroll position before navigation
function saveScrollPosition() {
  scrollPositions.set(window.location.pathname, window.scrollY);
}

// Restore scroll position or scroll to top
function restoreScrollPosition(path: string, shouldScrollToTop: boolean = true) {
  // The Router innerHTML clear will jump us to top instantly
  // We just need to ensure we're at top (which we will be)
  // Hash links and saved positions handled separately

  // Handle hash links (scroll to element)
  if (path.includes('#')) {
    const hash = path.split('#')[1];
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }, 300);
      return;
    }
  }

  // For back/forward navigation, restore saved position
  if (scrollPositions.has(path)) {
    const savedPosition = scrollPositions.get(path)!;
    setTimeout(() => {
      window.scrollTo({ top: savedPosition, behavior: 'instant' });
    }, 250);
    return;
  }

  // For new navigation, we're already at top due to innerHTML clear
  // No need to scroll again
}

window.addEventListener('popstate', () => {
  const newPath = window.location.pathname;
  currentPath.set(newPath);
  // Restore scroll position on back/forward
  restoreScrollPosition(newPath, false);
});

function navigate(path: string) {
  // Save current scroll position
  saveScrollPosition();

  // Update history and path
  window.history.pushState({}, '', path);
  currentPath.set(path);

  // DON'T call restoreScrollPosition here - let it happen naturally after render
  // The scroll will be handled by the effect after the Router completes
  setTimeout(() => {
    restoreScrollPosition(path, true);
  }, 0);
}

export function App() {
  return (
    <Router
      currentPath={currentPath}
      routes={[
        {
          path: (path) => path === '/' || path === '',
          component: () => <HomePage navigate={navigate} />
        },
        {
          path: (path) => path.startsWith('/docs'),
          component: () => <DocsViewer navigate={navigate} path={currentPath()} />
        },
        {
          path: () => true, // 404 fallback
          component: () => (
            <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1rem;">
              <h1 style="font-size: 4rem; font-weight: 700; color: var(--color-text);">404</h1>
              <p style="font-size: 1.25rem; color: var(--color-text-secondary);">Page not found</p>
              <button
                onClick={() => navigate('/')}
                style="
                  padding: 0.75rem 1.5rem;
                  background: var(--color-brand);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s;
                "
                onMouseEnter={(e) => (e.target as HTMLElement).style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.transform = 'scale(1)'}
              >
                Go Home
              </button>
            </div>
          )
        }
      ]}
    />
  );
}

// Component to render raw HTML
function RawHTML({ htmlSignal, id }: { htmlSignal: () => string; id: string }) {
  effect(() => {
    const html = htmlSignal();
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = html;
      }
    }, 0);
  });

  return <div id={id} />;
}

function DocsViewer({ navigate, path }: { navigate: (path: string) => void; path: string }) {
  const renderedHTML = signal('');
  const isSearchOpen = signal(false);

  // Parse the path to get section and file
  const pathParts = path.split('/').filter(Boolean);
  const section = pathParts[1] || 'getting-started';
  const file = pathParts[2] || getFirstFileForSection(section);

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  effect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isSearchOpen.set(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Intercept internal link clicks to use client-side navigation
  effect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Only handle internal links (not external or hash-only)
      if (href.startsWith('http') || href.startsWith('//')) return;
      if (href.startsWith('#')) return;

      // Check if the link is within the markdown content
      const markdownContent = document.getElementById('markdown-content');
      if (!markdownContent?.contains(link)) return;

      // Prevent default navigation and use client-side routing
      e.preventDefault();
      navigate(href);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });

  // Load markdown content
  effect(() => {
    const markdownPath = `/md-files/${section}/${file}.md`;
    fetch(markdownPath)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then(text => {
        const html = renderMarkdown(text);
        renderedHTML.set(html);
      })
      .catch(() => {
        const html = renderMarkdown('# Document not found\n\nThe requested documentation could not be loaded.');
        renderedHTML.set(html);
      });
  });

  return (
    <div class="docs-layout" style="display: flex; min-height: 100vh;">
      {/* Sidebar */}
      <Sidebar
        currentSection={section}
        currentFile={file}
        navigate={navigate}
        isOpen={true}
      />

      {/* Main Content */}
      <main class="docs-main" style="flex: 1; padding: 2rem; max-width: 900px; margin-left: 280px; margin-right: 240px;">
        <Breadcrumbs
          section={section}
          file={file}
          navigate={navigate}
        />
        <article class="prose" style="max-width: 100%;">
          <RawHTML htmlSignal={renderedHTML} id="markdown-content" />
        </article>
        <DocNavigation
          section={section}
          file={file}
          navigate={navigate}
        />
      </main>

      {/* Table of Contents */}
      <TableOfContents content={renderedHTML()} />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen()}
        onClose={() => isSearchOpen.set(false)}
        navigate={navigate}
      />
    </div>
  );
}

// Helper function to get first file for a section
function getFirstFileForSection(sectionPath: string): string {
  const section = docsStructure.find(s => s.path === sectionPath);
  return section?.items[0]?.file || 'overview';
}
