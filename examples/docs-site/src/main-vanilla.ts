import { marked } from 'marked';
import hljs from 'highlight.js';
import { docsStructure, getAllDocs } from './lib/docs-structure';
import './styles/global.css';
import 'highlight.js/styles/github-dark.css';

// Configure marked with renderer
const renderer = new marked.Renderer();
const originalCode = renderer.code.bind(renderer);
renderer.code = function({ text, lang }: { text: string; lang?: string }) {
  if (lang && hljs.getLanguage(lang)) {
    const highlighted = hljs.highlight(text, { language: lang }).value;
    return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
  }
  const highlighted = hljs.highlightAuto(text).value;
  return `<pre><code class="hljs">${highlighted}</code></pre>`;
};

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true,
} as any);

// State
let currentPath = window.location.pathname;
let sidebarOpen = window.innerWidth >= 769;
let searchOpen = false;
let searchQuery = '';
let searchResults: any[] = [];
let expandedSections = new Set<string>();

// Initialize expanded sections with current section
function initExpandedSections() {
  if (currentPath.startsWith('/docs')) {
    const parts = currentPath.split('/').filter(Boolean);
    const section = parts[1] || 'getting-started';
    expandedSections.add(section);
  }
}
initExpandedSections();

// Navigation
function navigate(path: string) {
  window.history.pushState({}, '', path);
  currentPath = path;
  render();
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', () => {
  currentPath = window.location.pathname;
  render();
});

// Search
function performSearch(query: string) {
  searchQuery = query.toLowerCase();
  if (!query) {
    searchResults = [];
    return;
  }

  const allDocs = getAllDocs();
  searchResults = allDocs.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery) ||
    doc.section.toLowerCase().includes(searchQuery)
  );
  renderSearchResults();
}

function renderSearchResults() {
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer) return;

  if (searchResults.length === 0 && searchQuery) {
    resultsContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--color-text-secondary);">No results found</div>';
    return;
  }

  resultsContainer.innerHTML = searchResults
    .map(result => `
      <button
        class="search-result-item"
        onclick="window.navigateToDoc('/docs/${result.path}/${result.file}')"
        style="
          width: 100%;
          padding: 1rem;
          text-align: left;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          transition: background 0.2s;
        "
        onmouseover="this.style.background='var(--color-hover)'"
        onmouseout="this.style.background='transparent'"
      >
        <div style="font-weight: 500; color: var(--color-text); margin-bottom: 0.25rem;">
          ${result.title}
        </div>
        <div style="font-size: 0.875rem; color: var(--color-text-secondary);">
          ${result.section}
        </div>
      </button>
    `)
    .join('');
}

// Global function for onclick handlers
(window as any).navigateToDoc = (path: string) => {
  searchOpen = false;
  navigate(path);
};

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    searchOpen = !searchOpen;
    render();
    if (searchOpen) {
      setTimeout(() => {
        const input = document.getElementById('search-input') as HTMLInputElement;
        input?.focus();
      }, 100);
    }
  }
  if (e.key === 'Escape' && searchOpen) {
    searchOpen = false;
    render();
  }
});

// Render functions
function renderHomePage() {
  return `
    <div>
      <!-- Header -->
      <header style="
        position: sticky;
        top: 0;
        z-index: 50;
        background: var(--color-bg);
        border-bottom: 1px solid var(--color-border);
        backdrop-filter: blur(10px);
      ">
        <div class="container" style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          padding: 0 2rem;
        ">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.5rem;">⚡</span>
            <span style="font-weight: 700; font-size: 1.25rem;">PhilJS</span>
          </div>

          <nav style="display: flex; align-items: center; gap: 2rem;">
            <a href="#features" style="color: var(--color-text); font-weight: 500; text-decoration: none;">Features</a>
            <a href="https://github.com/philjs/philjs" style="color: var(--color-text); font-weight: 500; text-decoration: none;" target="_blank" rel="noopener">GitHub</a>
            <button
              onclick="window.location.href='/docs/getting-started/introduction.md'"
              style="
                padding: 0.5rem 1rem;
                background: var(--color-brand);
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
              "
            >
              Get Started
            </button>
          </nav>
        </div>
      </header>

      <!-- Hero -->
      <section style="padding: 6rem 2rem; text-align: center;">
        <div class="container" style="max-width: 900px; margin: 0 auto;">
          <h1 style="
            font-size: clamp(2.5rem, 5vw, 4.5rem);
            font-weight: 700;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            background: linear-gradient(135deg, var(--color-brand) 0%, var(--color-accent) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">
            The framework that<br/>thinks ahead
          </h1>

          <p style="
            font-size: 1.25rem;
            color: var(--color-text-secondary);
            max-width: 600px;
            margin: 0 auto 3rem;
            line-height: 1.6;
          ">
            Fine-grained reactivity, zero hydration, and industry-first intelligence features.
            Build faster, ship less, analyze smarter.
          </p>

          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button
              onclick="window.location.href='/docs/getting-started/introduction.md'"
              style="
                padding: 0.75rem 1.5rem;
                font-size: 1.125rem;
                font-weight: 500;
                background: var(--color-brand);
                color: white;
                border: 2px solid var(--color-brand);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
              "
            >
              Get Started →
            </button>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" style="padding: 6rem 2rem; background: var(--color-bg-alt);">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <h2 style="font-size: 3rem; font-weight: 700; text-align: center; margin-bottom: 3rem;">
            Novel Features
          </h2>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
            ${[
              { icon: '⚡', title: 'Fine-Grained Reactivity', desc: 'Automatic dependency tracking with no dependency arrays.' },
              { icon: '🎯', title: 'Zero Hydration', desc: 'Qwik-style resumability means no expensive hydration step.' },
              { icon: '🏝️', title: 'Islands Architecture', desc: 'Ship minimal JavaScript. Only interactive components hydrate.' },
              { icon: '📊', title: 'Usage Analytics', desc: 'Track which components are used in production.' },
              { icon: '💰', title: 'Cost Tracking', desc: 'See estimated cloud costs per route during development.' },
              { icon: '🎨', title: 'Smart Preloading', desc: 'ML-powered navigation prediction with 60-80% accuracy.' },
            ].map(f => `
              <div style="
                padding: 2rem;
                background: var(--color-bg);
                border: 1px solid var(--color-border);
                border-radius: 12px;
              ">
                <div style="font-size: 2.5rem; margin-bottom: 1rem;">${f.icon}</div>
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.75rem;">${f.title}</h3>
                <p style="color: var(--color-text-secondary); line-height: 1.6;">${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section style="
        padding: 6rem 2rem;
        background: linear-gradient(135deg, var(--color-brand) 0%, var(--color-accent) 100%);
        color: white;
        text-align: center;
      ">
        <div class="container" style="max-width: 900px; margin: 0 auto;">
          <h2 style="font-size: 3rem; font-weight: 700; margin-bottom: 1.5rem;">
            Ready to build?
          </h2>
          <p style="font-size: 1.25rem; opacity: 0.9; margin-bottom: 2rem;">
            Install PhilJS and start building modern web applications in minutes.
          </p>

          <div style="
            background: rgba(0, 0, 0, 0.2);
            padding: 1.5rem;
            border-radius: 8px;
            max-width: 600px;
            margin: 2rem auto;
            font-family: var(--font-mono);
            text-align: left;
          ">
            <code>pnpm create philjs my-app</code>
          </div>

          <button
            onclick="window.location.href='/docs/getting-started/introduction.md'"
            style="
              padding: 0.75rem 1.5rem;
              font-size: 1.125rem;
              font-weight: 500;
              background: white;
              color: var(--color-brand);
              border: 2px solid white;
              border-radius: 8px;
              cursor: pointer;
            "
          >
            Read the Docs →
          </button>
        </div>
      </section>
    </div>
  `;
}

function renderSidebar(currentSection: string, currentFile: string) {
  const sections = docsStructure.map(section => {
    const isActive = section.path === currentSection;
    const isExpanded = expandedSections.has(section.path);
    const items = section.items.map(item => {
      const isItemActive = isActive && item.file === currentFile;
      return `
        <button
          onclick="event.stopPropagation(); window.location.href='/docs/${section.path}/${item.file}'"
          style="
            width: 100%;
            text-align: left;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            background: ${isItemActive ? 'var(--color-brand)' : 'transparent'};
            color: ${isItemActive ? 'white' : 'var(--color-text)'};
            border: none;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.2s;
            display: block;
            margin-bottom: 2px;
          "
        >
          ${item.title}
        </button>
      `;
    }).join('');

    return `
      <div style="margin-bottom: 0.5rem;">
        <button
          onclick="window.toggleSection('${section.path}')"
          style="
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.625rem 0.75rem;
            font-size: 0.8125rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: ${isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)'};
            background: none;
            border: none;
            cursor: pointer;
            text-align: left;
            border-radius: 6px;
          "
        >
          <span>${section.title}</span>
          <span style="transform: rotate(${isExpanded ? '90deg' : '0deg'}); transition: transform 0.2s;">▸</span>
        </button>
        ${isExpanded ? `<div style="padding-left: 0.5rem; margin-top: 0.25rem;">${items}</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <aside
      id="sidebar"
      style="
        width: 280px;
        background: var(--color-bg-alt);
        border-right: 1px solid var(--color-border);
        padding: 1.5rem 0;
        overflow-y: auto;
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 1000;
        transform: ${sidebarOpen || window.innerWidth >= 769 ? 'translateX(0)' : 'translateX(-100%)'};
        transition: transform 0.3s ease;
      "
    >
      <div style="padding: 0 1.5rem; margin-bottom: 2rem;">
        <a href="/" style="display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: var(--color-text);">
          <span style="font-size: 2rem;">⚡</span>
          <span style="font-weight: 700; font-size: 1.5rem; background: linear-gradient(135deg, var(--color-brand), var(--color-brand-dark)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            PhilJS
          </span>
        </a>
      </div>

      <nav style="padding: 0 0.75rem;">
        ${sections}
      </nav>
    </aside>
  `;
}

function renderDocsPage(section: string, file: string) {
  const docPath = `/docs/${section}/${file}`;

  // Fetch and render markdown
  fetch(docPath)
    .then(res => res.text())
    .then(markdown => {
      const html = marked(markdown) as string;
      const contentEl = document.getElementById('markdown-content');
      if (contentEl) {
        contentEl.innerHTML = html;
      }
    })
    .catch(() => {
      const contentEl = document.getElementById('markdown-content');
      if (contentEl) {
        contentEl.innerHTML = '<h1>Document not found</h1><p>The requested documentation could not be loaded.</p>';
      }
    });

  return `
    <div style="min-height: 100vh; position: relative;">
      ${renderSidebar(section, file)}

      <!-- Mobile menu button -->
      ${window.innerWidth < 769 ? `
        <button
          onclick="window.toggleSidebar()"
          style="
            position: fixed;
            top: 1rem;
            left: 1rem;
            padding: 0.75rem;
            background: var(--color-bg-alt);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            cursor: pointer;
            z-index: 999;
            box-shadow: var(--shadow-md);
          "
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
      ` : ''}

      <main style="
        flex: 1;
        padding: 2rem;
        max-width: 900px;
        margin: 0 auto;
        margin-left: ${window.innerWidth >= 769 ? '280px' : '0'};
      ">
        <div style="display: flex; justify-content: flex-end; margin-bottom: 2rem; ${window.innerWidth < 769 ? 'padding-left: 3.5rem;' : ''}">
          <button
            onclick="window.toggleSearch()"
            style="
              display: flex;
              align-items: center;
              gap: 0.75rem;
              padding: 0.5rem 1rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 8px;
              cursor: pointer;
              min-width: 200px;
            "
          >
            <span>🔍</span>
            <span style="color: var(--color-text-secondary); font-size: 0.875rem;">Search...</span>
            <kbd style="
              margin-left: auto;
              padding: 0.25rem 0.5rem;
              font-size: 0.75rem;
              background: var(--color-bg);
              border: 1px solid var(--color-border);
              border-radius: 4px;
              color: var(--color-text-secondary);
            ">⌘K</kbd>
          </button>
        </div>

        <article id="markdown-content" class="prose" style="
          line-height: 1.7;
          color: var(--color-text);
        ">
          Loading...
        </article>
      </main>

      ${sidebarOpen && window.innerWidth < 769 ? `
        <div
          onclick="window.toggleSidebar()"
          style="
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
          "
        ></div>
      ` : ''}
    </div>
  `;
}

function renderSearchModal() {
  if (!searchOpen) return '';

  return `
    <div
      style="
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 10vh;
        background: rgba(0, 0, 0, 0.5);
      "
      onclick="if (event.target === this) window.toggleSearch()"
    >
      <div
        style="
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 70vh;
          overflow: hidden;
          box-shadow: var(--shadow-lg);
        "
      >
        <div style="padding: 1rem; border-bottom: 1px solid var(--color-border);">
          <input
            id="search-input"
            type="text"
            placeholder="Search documentation..."
            value="${searchQuery}"
            oninput="window.handleSearchInput(event)"
            style="
              width: 100%;
              padding: 0.75rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 8px;
              color: var(--color-text);
              font-size: 1rem;
            "
            autofocus
          />
        </div>

        <div id="search-results" style="
          max-height: calc(70vh - 100px);
          overflow-y: auto;
        "></div>
      </div>
    </div>
  `;
}

// Global functions for onclick handlers
(window as any).toggleSidebar = () => {
  sidebarOpen = !sidebarOpen;
  render();
};

(window as any).toggleSection = (sectionPath: string) => {
  if (expandedSections.has(sectionPath)) {
    expandedSections.delete(sectionPath);
  } else {
    expandedSections.add(sectionPath);
  }
  render();
};

(window as any).toggleSearch = () => {
  searchOpen = !searchOpen;
  render();
  if (searchOpen) {
    setTimeout(() => {
      const input = document.getElementById('search-input') as HTMLInputElement;
      input?.focus();
    }, 100);
  }
};

(window as any).handleSearchInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  performSearch(input.value);
};

// Main render function
function render() {
  const root = document.getElementById('root');
  if (!root) return;

  let content = '';

  if (currentPath === '/' || currentPath === '') {
    content = renderHomePage();
  } else if (currentPath.startsWith('/docs')) {
    const parts = currentPath.split('/').filter(Boolean);
    const section = parts[1] || 'getting-started';
    const file = parts[2] || 'introduction.md';
    content = renderDocsPage(section, file);
  } else {
    content = '<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center;"><h1>404 - Page not found</h1></div>';
  }

  root.innerHTML = content + renderSearchModal();
}

// Initial render
try {
  render();
  console.log('PhilJS Docs Site loaded successfully!');
  console.log('Current path:', currentPath);
} catch (error) {
  console.error('Error rendering docs site:', error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h1 style="color: var(--color-brand);">⚠️ Error Loading Docs</h1>
        <p style="color: var(--color-text-secondary);">There was an error loading the documentation site.</p>
        <pre style="background: var(--color-bg-alt); padding: 1rem; border-radius: 8px; text-align: left; overflow-x: auto; margin-top: 1rem;">${error}</pre>
      </div>
    `;
  }
}
