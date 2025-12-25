'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Search, Github, Moon, Sun, Zap } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { SearchDialog } from './Search';
import clsx from 'clsx';

const navigation = [
  { name: 'Docs', href: '/docs/getting-started/installation' },
  { name: 'API', href: '/docs/api/core' },
  { name: 'Guides', href: '/docs/guides/ssr-hydration' },
  { name: 'Rust', href: '/docs/rust-guide/quickstart' },
  { name: 'Playground', href: '/playground' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-950/80 backdrop-blur-sm">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-surface-900 dark:text-white">
                  PhilJS
                </span>
              </Link>

              {/* Version badge */}
              <span className="ml-3 hidden sm:inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/30 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:text-primary-200">
                v2.0
              </span>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex md:items-center md:gap-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'text-sm font-medium transition-colors',
                    pathname?.startsWith(item.href.split('/').slice(0, 3).join('/'))
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-1.5 text-sm text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600 transition-colors"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden sm:inline-block ml-2 text-xs font-sans bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">
                  Ctrl+K
                </kbd>
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              {/* GitHub link */}
              <a
                href="https://github.com/philjs/philjs"
                className="hidden sm:block p-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                aria-label="GitHub repository"
              >
                <Github className="h-5 w-5" />
              </a>

              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden p-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open menu</span>
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-surface-200 dark:border-surface-800">
              <div className="flex flex-col gap-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'text-sm font-medium transition-colors',
                      pathname?.startsWith(item.href.split('/').slice(0, 3).join('/'))
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
