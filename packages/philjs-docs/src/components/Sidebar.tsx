'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

export interface SidebarLink {
  title: string;
  href: string;
}

export interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

export interface SidebarProps {
  sections: SidebarSection[];
}

export const docsNavigation: SidebarSection[] = [
  {
    title: 'Getting Started',
    links: [
      { title: 'Installation', href: '/docs/getting-started/installation' },
      { title: 'Quick Start (TypeScript)', href: '/docs/getting-started/quickstart-typescript' },
      { title: 'Quick Start (Rust)', href: '/docs/getting-started/quickstart-rust' },
      { title: 'Project Structure', href: '/docs/getting-started/project-structure' },
      { title: 'IDE Setup', href: '/docs/getting-started/ide-setup' },
    ],
  },
  {
    title: 'Tutorials',
    links: [
      { title: 'Building a Todo App', href: '/docs/tutorials/building-a-todo-app' },
      { title: 'Building a Dashboard', href: '/docs/tutorials/building-a-dashboard' },
      { title: 'Rust Full-Stack Guide', href: '/docs/tutorials/rust-fullstack' },
      { title: 'Migration from React', href: '/docs/tutorials/migration-from-react' },
    ],
  },
  {
    title: 'Core Concepts',
    links: [
      { title: 'Signals', href: '/docs/core-concepts/signals' },
      { title: 'Components', href: '/docs/core-concepts/components' },
      { title: 'Effects & Memos', href: '/docs/core-concepts/effects' },
      { title: 'Stores', href: '/docs/core-concepts/stores' },
      { title: 'Server-Side Rendering', href: '/docs/core-concepts/ssr' },
    ],
  },
  {
    title: 'Guides',
    links: [
      { title: 'SSR & Hydration', href: '/docs/guides/ssr-hydration' },
      { title: 'Islands Architecture', href: '/docs/guides/islands' },
      { title: 'LiveView', href: '/docs/guides/liveview' },
      { title: 'Routing', href: '/docs/guides/routing' },
      { title: 'Forms', href: '/docs/guides/forms' },
      { title: 'Styling', href: '/docs/guides/styling' },
      { title: 'State Management', href: '/docs/guides/state-management' },
      { title: 'Data Fetching', href: '/docs/guides/data-fetching' },
      { title: 'Authentication', href: '/docs/guides/auth' },
      { title: 'Deployment', href: '/docs/guides/deployment' },
    ],
  },
  {
    title: 'API Reference',
    links: [
      { title: 'philjs-core', href: '/docs/api/core' },
      { title: 'philjs-router', href: '/docs/api/router' },
      { title: 'philjs-ssr', href: '/docs/api/ssr' },
      { title: 'philjs-forms', href: '/docs/api/forms' },
      { title: 'Component Library', href: '/docs/api/ui' },
    ],
  },
  {
    title: 'Rust Guide',
    links: [
      { title: 'Rust Quickstart', href: '/docs/rust-guide/quickstart' },
      { title: 'cargo-philjs CLI', href: '/docs/rust-guide/cargo-philjs' },
      { title: 'View Macro Syntax', href: '/docs/rust-guide/view-macro' },
      { title: 'Server Functions', href: '/docs/rust-guide/server-functions' },
      { title: 'Axum Integration', href: '/docs/rust-guide/axum' },
      { title: 'WASM Deployment', href: '/docs/rust-guide/wasm' },
    ],
  },
  {
    title: 'Comparison',
    links: [
      { title: 'vs React', href: '/docs/comparison/react' },
      { title: 'vs SolidJS', href: '/docs/comparison/solidjs' },
      { title: 'vs Leptos', href: '/docs/comparison/leptos' },
    ],
  },
  {
    title: 'Examples',
    links: [
      { title: 'Example Gallery', href: '/examples' },
    ],
  },
];

export function Sidebar({ sections }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Find which section contains the current path and expand it
    const currentSection = sections.find(section =>
      section.links.some(link => pathname?.startsWith(link.href))
    );
    return new Set(currentSection ? [currentSection.title] : [sections[0]?.title]);
  });

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <nav className="w-64 flex-shrink-0">
      <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4">
        <ul className="space-y-6">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.title);
            const hasActiveLink = section.links.some(link => pathname === link.href);

            return (
              <li key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2"
                >
                  {section.title}
                  <ChevronRight
                    className={clsx(
                      'w-4 h-4 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </button>

                {(isExpanded || hasActiveLink) && (
                  <ul className="space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in">
                    {section.links.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className={clsx(
                              'block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2',
                              isActive
                                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500'
                                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600'
                            )}
                          >
                            {link.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
