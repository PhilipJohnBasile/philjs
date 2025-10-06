import { signal, effect } from 'philjs-core';
import { HomePage } from './pages/HomePage';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

// Configure marked with syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

// Simple client-side routing
const currentPath = signal(window.location.pathname);

window.addEventListener('popstate', () => {
  currentPath.set(window.location.pathname);
});

function navigate(path: string) {
  window.history.pushState({}, '', path);
  currentPath.set(path);
  window.scrollTo(0, 0);
}

export function App() {
  const path = currentPath();

  // Simple routing
  if (path === '/' || path === '') {
    return <HomePage navigate={navigate} />;
  }

  if (path.startsWith('/docs')) {
    return <DocsViewer navigate={navigate} path={path} />;
  }

  // 404
  return <div>Page not found</div>;
}

const docsSections = [
  {
    title: 'Getting Started',
    path: 'getting-started',
    items: [
      { title: 'Introduction', file: 'introduction.md' },
      { title: 'Installation', file: 'installation.md' },
      { title: 'Quick Start', file: 'quick-start.md' },
      { title: 'Your First Component', file: 'your-first-component.md' },
      { title: 'Tutorial: Tic-Tac-Toe', file: 'tutorial-tic-tac-toe.md' },
      { title: 'Tutorial: Todo App', file: 'tutorial-todo-app.md' },
      { title: 'Tutorial: Static Blog', file: 'tutorial-blog-ssg.md' },
      { title: 'Thinking in PhilJS', file: 'thinking-in-philjs.md' },
    ],
  },
  {
    title: 'Core Concepts',
    path: 'learn',
    items: [
      { title: 'Components', file: 'components.md' },
      { title: 'Signals', file: 'signals.md' },
      { title: 'Memos', file: 'memos.md' },
      { title: 'Effects', file: 'effects.md' },
      { title: 'Context', file: 'context.md' },
    ],
  },
  {
    title: 'Routing',
    path: 'routing',
    items: [
      { title: 'Basics', file: 'basics.md' },
      { title: 'Dynamic Routes', file: 'dynamic-routes.md' },
      { title: 'Navigation', file: 'navigation.md' },
    ],
  },
  {
    title: 'API Reference',
    path: 'api',
    items: [
      { title: 'Core API', file: 'core.md' },
      { title: 'Router API', file: 'router.md' },
      { title: 'Configuration', file: 'config.md' },
    ],
  },
];

function DocsViewer({ navigate, path }: { navigate: (path: string) => void; path: string }) {
  const content = signal('Loading...');
  const sidebarOpen = signal(true);

  // Parse the path to get section and file
  const pathParts = path.split('/').filter(Boolean);
  const section = pathParts[1] || 'getting-started';
  const file = pathParts[2] || 'introduction.md';

  // Load markdown content
  effect(() => {
    const markdownPath = `/docs/${section}/${file}`;
    fetch(markdownPath)
      .then(res => res.text())
      .then(text => {
        const html = marked(text);
        content.set(html);
      })
      .catch(() => {
        content.set('<h1>Document not found</h1><p>The requested documentation could not be loaded.</p>');
      });
  });

  return (
    <div style="display: flex; min-height: 100vh;">
      {/* Sidebar */}
      <aside
        style={`
          width: 280px;
          background: var(--color-bg-alt);
          border-right: 1px solid var(--color-border);
          padding: 1rem;
          overflow-y: auto;
          position: sticky;
          top: 0;
          height: 100vh;
          transform: ${sidebarOpen() ? 'translateX(0)' : 'translateX(-100%)'};
          transition: transform 0.3s ease;
        `}
      >
        <div style="margin-bottom: 2rem;">
          <button
            onClick={() => navigate('/')}
            style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: var(--color-text); background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0;"
          >
            <span style="font-size: 1.5rem;">⚡</span>
            <span style="font-weight: 700; font-size: 1.25rem;">PhilJS</span>
          </button>
        </div>

        {docsSections.map(sec => (
          <div style="margin-bottom: 2rem;">
            <h3 style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 0.75rem;">
              {sec.title}
            </h3>
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
              {sec.items.map(item => (
                <button
                  onClick={() => navigate(`/docs/${sec.path}/${item.file}`)}
                  style={`
                    text-align: left;
                    padding: 0.5rem 0.75rem;
                    border-radius: 6px;
                    background: ${section === sec.path && file === item.file ? 'var(--color-brand)' : 'transparent'};
                    color: ${section === sec.path && file === item.file ? 'white' : 'var(--color-text)'};
                    border: none;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                  `}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      {/* Main content */}
      <main style="flex: 1; padding: 3rem; max-width: 900px;">
        <button
          onClick={() => sidebarOpen.set(!sidebarOpen())}
          style="
            position: fixed;
            top: 1rem;
            left: ${sidebarOpen() ? '290px' : '1rem'};
            padding: 0.5rem;
            background: var(--color-bg-alt);
            border: 1px solid var(--color-border);
            border-radius: 6px;
            cursor: pointer;
            z-index: 100;
            transition: left 0.3s ease;
          "
        >
          {sidebarOpen() ? '←' : '→'}
        </button>

        {/* Rendered markdown */}
        <article
          class="prose"
          style="
            line-height: 1.7;
            color: var(--color-text);
          "
          innerHTML={content()}
        />
      </main>
    </div>
  );
}
