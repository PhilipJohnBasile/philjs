import { signal, effect, render } from 'philjs-core';
import { HomePage } from './pages/HomePage';
import { ExamplesPage } from './pages/ExamplesPage';
import { CompetitiveAnalysisPage } from './pages/CompetitiveAnalysisPage';
import { Sidebar } from './components/Sidebar';
import { TableOfContents } from './components/TableOfContents';
import { SearchModal } from './components/SearchModal';
import { Breadcrumbs } from './components/Breadcrumbs';
import { DocNavigation } from './components/DocNavigation';
import { renderMarkdown, playgroundCode } from './lib/markdown-renderer';
import { docsStructure } from './lib/docs-structure';
import { Router } from './Router';
import { theme } from './lib/theme';
import './styles/global.css';
import './styles/code-playground.css';

// Dynamically load highlight.js theme based on current theme
let currentHighlightTheme: HTMLLinkElement | null = null;

type Theme = 'light' | 'dark' | 'high-contrast';

function loadHighlightTheme(themeName: Theme) {
  // Map high-contrast to dark theme for syntax highlighting
  const effectiveTheme = themeName === 'high-contrast' ? 'dark' : themeName;
  // Remove existing theme
  if (currentHighlightTheme) {
    currentHighlightTheme.remove();
  }

  // Load new theme
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = effectiveTheme === 'dark'
    ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
    : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
  document.head.appendChild(link);
  currentHighlightTheme = link;
}

// Load initial theme
loadHighlightTheme(theme());

// Watch for theme changes
effect(() => {
  loadHighlightTheme(theme());
});

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
          path: (path) => path === '/examples' || path.startsWith('/examples'),
          component: () => <ExamplesPage navigate={navigate} />
        },
        {
          path: (path) => path === '/analysis' || path.startsWith('/analysis'),
          component: () => <CompetitiveAnalysisPage navigate={navigate} />
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
                onMouseEnter={(e: MouseEvent) => (e.target as HTMLElement).style.transform = 'scale(1.05)'}
                onMouseLeave={(e: MouseEvent) => (e.target as HTMLElement).style.transform = 'scale(1)'}
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

// Helper function to create playground HTML
function createPlaygroundHTML(code: string, lang: string, id: string): string {
  return `
    <div class="code-playground">
      <div class="code-playground-header">
        <div class="code-playground-toolbar">
          <button class="playground-btn playground-btn-run" data-playground="${id}">
            ▶ Run
          </button>
          <button class="playground-btn playground-btn-reset" data-playground="${id}">
            ↻ Reset
          </button>
          <button class="playground-btn playground-btn-copy" data-playground="${id}">
            📋 Copy
          </button>
        </div>
      </div>
      <div class="code-playground-content">
        <div class="code-playground-editor">
          <textarea class="code-editor-textarea" data-playground="${id}" spellcheck="false">${code}</textarea>
        </div>
        <div class="code-playground-preview">
          <div class="preview-header">Output</div>
          <div class="preview-content" data-playground="${id}">
            <div class="preview-empty">Click "Run" to see output</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Helper function to attach event handlers to playground
function attachPlaygroundHandlers(id: string, originalCode: string) {
  const textarea = document.querySelector(`textarea[data-playground="${id}"]`) as HTMLTextAreaElement;
  const runBtn = document.querySelector(`.playground-btn-run[data-playground="${id}"]`);
  const resetBtn = document.querySelector(`.playground-btn-reset[data-playground="${id}"]`);
  const copyBtn = document.querySelector(`.playground-btn-copy[data-playground="${id}"]`);
  const preview = document.querySelector(`.preview-content[data-playground="${id}"]`);

  if (!textarea || !runBtn || !resetBtn || !copyBtn || !preview) return;

  // Run button
  runBtn.addEventListener('click', () => {
    const code = textarea.value;
    try {
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: any[]) => {
          const formatted = args.map(a => {
            if (typeof a === 'object' && a !== null) {
              // Check if it's a signal-like object
              if ('value' in a || 'get' in a) {
                return `Signal(${a.value ?? a.get?.()})`;
              }
              return JSON.stringify(a, null, 2);
            }
            return String(a);
          }).join(' ');
          logs.push(formatted);
        },
        error: (...args: any[]) => logs.push('ERROR: ' + args.join(' ')),
        warn: (...args: any[]) => logs.push('WARN: ' + args.join(' ')),
      };

      const func = new Function('signal', 'effect', 'render', 'console', code);
      const result = func(signal, effect, render, mockConsole);

      if (result !== undefined) {
        logs.push(`Return: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`);
      }

      preview.innerHTML = `<pre class="preview-output">${logs.join('\n') || 'Code executed successfully (no output)'}</pre>`;
    } catch (err: any) {
      preview.innerHTML = `<div class="preview-error">❌ ${err.message || 'An error occurred'}</div>`;
    }
  });

  // Reset button
  resetBtn.addEventListener('click', () => {
    textarea.value = originalCode;
    preview.innerHTML = '<div class="preview-empty">Click "Run" to see output</div>';
  });

  // Copy button
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textarea.value);
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  });
}

// Component to render raw HTML
function RawHTML({ htmlSignal, id }: { htmlSignal: () => string; id: string }) {
  effect(() => {
    const html = htmlSignal();
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = html;

        console.log('[App] Mounting playgrounds. Map size:', playgroundCode.size);
        // Mount CodePlayground components for any placeholders
        playgroundCode.forEach((data, playgroundId) => {
          console.log('[App] Looking for placeholder:', playgroundId);
          const placeholder = document.getElementById(playgroundId);
          if (placeholder) {
            console.log('[App] Found placeholder, mounting playground');
            // Create playground HTML directly
            const playgroundHTML = createPlaygroundHTML(data.code, data.lang, playgroundId);
            placeholder.innerHTML = playgroundHTML;

            // Attach event handlers
            attachPlaygroundHandlers(playgroundId, data.code);
            console.log('[App] Playground mounted successfully');
          } else {
            console.log('[App] Placeholder not found!');
          }
        });

        // Clear the playground code map for next render
        playgroundCode.clear();
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
        console.log('[App] Raw markdown snippet:', text.substring(0, 500));
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
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        style="
          position: absolute;
          left: -9999px;
          z-index: 999;
          padding: 1rem;
          background: var(--color-brand);
          color: white;
          text-decoration: none;
          border-radius: 4px;
        "
        onFocus={(e: FocusEvent) => (e.target as HTMLElement).style.left = '1rem'}
        onBlur={(e: FocusEvent) => (e.target as HTMLElement).style.left = '-9999px'}
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar
        currentSection={section}
        currentFile={file}
        navigate={navigate}
        isOpen={true}
      />

      {/* Main Content */}
      <main id="main-content" class="docs-main" style="flex: 1; padding: 2rem; max-width: 900px; margin-left: 280px; margin-right: 240px;" tabindex="-1">
        <Breadcrumbs
          section={section}
          file={file}
          navigate={navigate}
        />
        <article class="prose" style="max-width: 100%;">
          <RawHTML htmlSignal={renderedHTML} id="markdown-content" />
        </article>

        {/* Page Footer */}
        <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--color-border);">
          {/* Edit this page */}
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
            <a
              href={`https://github.com/philjs/philjs/edit/main/docs/${section}/${file}.md`}
              target="_blank"
              rel="noopener noreferrer"
              style="display: flex; align-items: center; gap: 0.5rem; color: var(--color-text-secondary); font-size: 0.875rem; text-decoration: none; transition: color 0.2s;"
              onMouseEnter={(e: MouseEvent) => (e.target as HTMLElement).style.color = 'var(--color-brand)'}
              onMouseLeave={(e: MouseEvent) => (e.target as HTMLElement).style.color = 'var(--color-text-secondary)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit this page on GitHub
            </a>
            <span style="color: var(--color-text-tertiary); font-size: 0.75rem;">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Feedback */}
          <div style="background: var(--color-bg-alt); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
            <div style="font-weight: 600; margin-bottom: 0.75rem; color: var(--color-text);">Was this page helpful?</div>
            <div style="display: flex; gap: 0.75rem;">
              <button
                onClick={() => {
                  alert('Thanks for your feedback!');
                  console.log('Positive feedback for:', section, file);
                }}
                style="padding: 0.5rem 1rem; background: var(--color-success); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; transition: opacity 0.2s;"
                onMouseEnter={(e: MouseEvent) => (e.target as HTMLElement).style.opacity = '0.9'}
                onMouseLeave={(e: MouseEvent) => (e.target as HTMLElement).style.opacity = '1'}
              >
                👍 Yes
              </button>
              <button
                onClick={() => {
                  const feedback = prompt('What could we improve?');
                  if (feedback) {
                    console.log('Negative feedback for:', section, file, feedback);
                    alert('Thank you! Your feedback helps us improve.');
                  }
                }}
                style="padding: 0.5rem 1rem; background: var(--color-bg); color: var(--color-text); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; font-size: 0.875rem; transition: all 0.2s;"
                onMouseEnter={(e: MouseEvent) => { (e.target as HTMLElement).style.background = 'var(--color-hover)'; }}
                onMouseLeave={(e: MouseEvent) => { (e.target as HTMLElement).style.background = 'var(--color-bg)'; }}
              >
                👎 No
              </button>
            </div>
          </div>
        </div>

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
