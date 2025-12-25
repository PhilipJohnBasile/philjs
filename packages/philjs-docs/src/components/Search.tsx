'use client';

import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Code2, BookOpen, ArrowRight, X } from 'lucide-react';
import Fuse from 'fuse.js';
import clsx from 'clsx';

interface SearchResult {
  title: string;
  description: string;
  href: string;
  category: string;
  icon: 'doc' | 'api' | 'guide';
}

// Sample search index - in production, this would be generated at build time
const searchData: SearchResult[] = [
  // Getting Started
  { title: 'Installation', description: 'Install PhilJS via npm, yarn, pnpm, or cargo', href: '/docs/getting-started/installation', category: 'Getting Started', icon: 'doc' },
  { title: 'Quick Start (TypeScript)', description: 'Create your first PhilJS app with TypeScript', href: '/docs/getting-started/quickstart-typescript', category: 'Getting Started', icon: 'doc' },
  { title: 'Quick Start (Rust)', description: 'Create your first PhilJS app with Rust', href: '/docs/getting-started/quickstart-rust', category: 'Getting Started', icon: 'doc' },
  { title: 'Project Structure', description: 'Understanding the PhilJS project layout', href: '/docs/getting-started/project-structure', category: 'Getting Started', icon: 'doc' },
  { title: 'IDE Setup', description: 'Configure your editor for PhilJS development', href: '/docs/getting-started/ide-setup', category: 'Getting Started', icon: 'doc' },

  // Core Concepts
  { title: 'Signals', description: 'Fine-grained reactivity with signals', href: '/docs/core-concepts/signals', category: 'Core Concepts', icon: 'doc' },
  { title: 'Components', description: 'Building UI with PhilJS components', href: '/docs/core-concepts/components', category: 'Core Concepts', icon: 'doc' },
  { title: 'JSX Syntax', description: 'JSX in PhilJS - familiar but enhanced', href: '/docs/core-concepts/jsx', category: 'Core Concepts', icon: 'doc' },
  { title: 'Effects & Memos', description: 'Side effects and computed values', href: '/docs/core-concepts/effects', category: 'Core Concepts', icon: 'doc' },
  { title: 'Context', description: 'Sharing state across components', href: '/docs/core-concepts/context', category: 'Core Concepts', icon: 'doc' },

  // Guides
  { title: 'SSR & Hydration', description: 'Server-side rendering with PhilJS', href: '/docs/guides/ssr-hydration', category: 'Guides', icon: 'guide' },
  { title: 'Islands Architecture', description: 'Partial hydration for better performance', href: '/docs/guides/islands', category: 'Guides', icon: 'guide' },
  { title: 'LiveView', description: 'Real-time server-rendered UI', href: '/docs/guides/liveview', category: 'Guides', icon: 'guide' },
  { title: 'Routing', description: 'File-based and programmatic routing', href: '/docs/guides/routing', category: 'Guides', icon: 'guide' },
  { title: 'Forms', description: 'Form handling and validation', href: '/docs/guides/forms', category: 'Guides', icon: 'guide' },
  { title: 'Styling', description: 'CSS-in-JS and styling options', href: '/docs/guides/styling', category: 'Guides', icon: 'guide' },
  { title: 'State Management', description: 'Managing application state', href: '/docs/guides/state-management', category: 'Guides', icon: 'guide' },
  { title: 'Data Fetching', description: 'Loading and caching data', href: '/docs/guides/data-fetching', category: 'Guides', icon: 'guide' },
  { title: 'Authentication', description: 'User authentication patterns', href: '/docs/guides/auth', category: 'Guides', icon: 'guide' },
  { title: 'Deployment', description: 'Deploy your PhilJS app', href: '/docs/guides/deployment', category: 'Guides', icon: 'guide' },

  // API Reference
  { title: 'signal()', description: 'Create a reactive signal', href: '/docs/api/core#signal', category: 'API', icon: 'api' },
  { title: 'memo()', description: 'Create a computed value', href: '/docs/api/core#memo', category: 'API', icon: 'api' },
  { title: 'effect()', description: 'Create a side effect', href: '/docs/api/core#effect', category: 'API', icon: 'api' },
  { title: 'resource()', description: 'Create an async resource', href: '/docs/api/core#resource', category: 'API', icon: 'api' },
  { title: 'createContext()', description: 'Create a context provider', href: '/docs/api/core#context', category: 'API', icon: 'api' },
  { title: 'useRouter()', description: 'Access the router', href: '/docs/api/router#useRouter', category: 'API', icon: 'api' },
  { title: 'Link', description: 'Client-side navigation component', href: '/docs/api/router#Link', category: 'API', icon: 'api' },
  { title: 'useForm()', description: 'Form state management hook', href: '/docs/api/forms#useForm', category: 'API', icon: 'api' },

  // Rust Guide
  { title: 'Rust Quickstart', description: 'Get started with PhilJS in Rust', href: '/docs/rust-guide/quickstart', category: 'Rust', icon: 'doc' },
  { title: 'cargo-philjs CLI', description: 'The PhilJS Cargo command', href: '/docs/rust-guide/cargo-philjs', category: 'Rust', icon: 'doc' },
  { title: 'View Macro', description: 'The view! macro syntax', href: '/docs/rust-guide/view-macro', category: 'Rust', icon: 'doc' },
  { title: 'Server Functions', description: 'Rust server functions', href: '/docs/rust-guide/server-functions', category: 'Rust', icon: 'doc' },
  { title: 'Axum Integration', description: 'Using PhilJS with Axum', href: '/docs/rust-guide/axum', category: 'Rust', icon: 'doc' },
  { title: 'WASM Deployment', description: 'Deploy to WebAssembly', href: '/docs/rust-guide/wasm', category: 'Rust', icon: 'doc' },

  // Comparisons
  { title: 'PhilJS vs React', description: 'Compare PhilJS with React', href: '/docs/comparison/react', category: 'Comparison', icon: 'doc' },
  { title: 'PhilJS vs SolidJS', description: 'Compare PhilJS with SolidJS', href: '/docs/comparison/solidjs', category: 'Comparison', icon: 'doc' },
  { title: 'PhilJS vs Leptos', description: 'Compare PhilJS with Leptos', href: '/docs/comparison/leptos', category: 'Comparison', icon: 'doc' },
];

const fuse = new Fuse(searchData, {
  keys: ['title', 'description', 'category'],
  threshold: 0.3,
  includeMatches: true,
});

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Search when query changes
  useEffect(() => {
    if (query.length > 0) {
      const searchResults = fuse.search(query).map(result => result.item);
      setResults(searchResults.slice(0, 10));
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }

      if (!open) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        router.push(results[selectedIndex].href);
        onClose();
        setQuery('');
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, results, selectedIndex, router]);

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'api':
        return <Code2 className="w-4 h-4" />;
      case 'guide':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative max-w-2xl mx-auto mt-[20vh]">
        <div className="bg-white dark:bg-surface-900 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center px-4 border-b border-surface-200 dark:border-surface-700">
            <Search className="w-5 h-5 text-surface-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documentation..."
              className="flex-1 px-4 py-4 bg-transparent text-surface-900 dark:text-white placeholder-surface-400 outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 rounded text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query.length > 0 ? (
              results.length > 0 ? (
                <ul className="py-2">
                  {results.map((result, index) => (
                    <li key={result.href}>
                      <button
                        onClick={() => {
                          router.push(result.href);
                          onClose();
                          setQuery('');
                        }}
                        className={clsx(
                          'w-full flex items-center gap-4 px-4 py-3 text-left transition-colors',
                          index === selectedIndex
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-surface-50 dark:hover:bg-surface-800'
                        )}
                      >
                        <div className={clsx(
                          'w-8 h-8 flex items-center justify-center rounded-lg',
                          index === selectedIndex
                            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                            : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
                        )}>
                          {getIcon(result.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-surface-900 dark:text-white">
                            {result.title}
                          </div>
                          <div className="text-sm text-surface-500 dark:text-surface-400 truncate">
                            {result.description}
                          </div>
                        </div>
                        <span className="text-xs text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                          {result.category}
                        </span>
                        {index === selectedIndex && (
                          <ArrowRight className="w-4 h-4 text-primary-500" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-surface-500 dark:text-surface-400">
                  No results found for "{query}"
                </div>
              )
            ) : (
              <div className="p-4">
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                  Quick links
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['Installation', 'Signals', 'Components', 'Routing', 'SSR', 'Rust'].map(term => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="text-left px-3 py-2 text-sm rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-700 text-xs text-surface-500 dark:text-surface-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800">Enter</kbd>
                to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800">Esc</kbd>
                to close
              </span>
            </div>
            <span>Powered by Fuse.js</span>
          </div>
        </div>
      </div>
    </div>
  );
}
