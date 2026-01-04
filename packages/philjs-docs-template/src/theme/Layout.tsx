/**
 * Documentation site layout
 */

import { signal, memo } from '@philjs/core';
import type { DocsConfig, SidebarItem } from '../index.js';

interface LayoutProps {
    config: DocsConfig;
    children?: any;
}

export function DocsLayout(props: LayoutProps) {
    const { config, children } = props;
    const sidebarOpen = signal(true);
    const searchOpen = signal(false);

    return (
        <div class="docs-layout">
            {/* Header */}
            <header class="docs-header">
                <div class="header-left">
                    <button
                        class="sidebar-toggle"
                        onClick={() => sidebarOpen.set(!sidebarOpen())}
                    >
                        ☰
                    </button>
                    {config.themeConfig?.logo && (
                        <img src={config.themeConfig.logo} alt={config.title} class="logo" />
                    )}
                    <span class="site-title">{config.title}</span>
                </div>

                <nav class="header-nav">
                    {config.themeConfig?.nav?.map((item) => (
                        <a href={item.link} class="nav-link">{item.text}</a>
                    ))}
                </nav>

                <div class="header-right">
                    <button class="search-btn" onClick={() => searchOpen.set(true)}>
                        🔍 Search
                    </button>
                    {config.themeConfig?.socialLinks?.map((link) => (
                        <a href={link.link} class="social-link" target="_blank">
                            {getSocialIcon(link.icon)}
                        </a>
                    ))}
                </div>
            </header>

            {/* Main content */}
            <div class="docs-main">
                {sidebarOpen() && (
                    <aside class="docs-sidebar">
                        <Sidebar items={getCurrentSidebar(config)} />
                    </aside>
                )}

                <main class="docs-content">
                    {children}
                </main>

                <aside class="docs-toc">
                    {/* Table of contents */}
                </aside>
            </div>

            {/* Footer */}
            {config.themeConfig?.footer && (
                <footer class="docs-footer">
                    {config.themeConfig.footer.message && (
                        <p>{config.themeConfig.footer.message}</p>
                    )}
                    {config.themeConfig.footer.copyright && (
                        <p class="copyright">{config.themeConfig.footer.copyright}</p>
                    )}
                </footer>
            )}

            {/* Search modal */}
            {searchOpen() && (
                <SearchModal
                    config={config}
                    onClose={() => searchOpen.set(false)}
                />
            )}
        </div>
    );
}

function Sidebar(props: { items: SidebarItem[] }) {
    return (
        <ul class="sidebar-list">
            {props.items.map((item) => (
                <SidebarItemComponent key={item.text} item={item} />
            ))}
        </ul>
    );
}

function SidebarItemComponent(props: { item: SidebarItem }) {
    const { item } = props;
    const expanded = signal(!item.collapsed);

    if (item.items && item.items.length > 0) {
        return (
            <li class="sidebar-group">
                <button
                    class="sidebar-group-title"
                    onClick={() => expanded.set(!expanded())}
                >
                    <span>{item.text}</span>
                    <span class="expand-icon">{expanded() ? '▼' : '▶'}</span>
                </button>
                {expanded() && (
                    <ul class="sidebar-group-items">
                        {item.items.map((child) => (
                            <SidebarItemComponent key={child.text} item={child} />
                        ))}
                    </ul>
                )}
            </li>
        );
    }

    return (
        <li class="sidebar-item">
            <a href={item.link} class="sidebar-link">{item.text}</a>
        </li>
    );
}

function SearchModal(props: { config: DocsConfig; onClose: () => void }) {
    const query = signal('');
    const results = signal<any[]>([]);

    return (
        <div class="search-modal" onClick={props.onClose}>
            <div class="search-dialog" onClick={(e) => e.stopPropagation()}>
                <input
                    type="search"
                    placeholder="Search docs..."
                    value={query()}
                    onInput={(e) => query.set((e.target as HTMLInputElement).value)}
                    autofocus
                />
                <ul class="search-results">
                    {results().map((result) => (
                        <li>
                            <a href={result.link}>{result.title}</a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function getSocialIcon(icon: string): string {
    const icons: Record<string, string> = {
        github: '🐙',
        twitter: '🐦',
        discord: '💬',
        linkedin: '💼',
    };
    return icons[icon] || '🔗';
}

function getCurrentSidebar(config: DocsConfig): SidebarItem[] {
    // Get sidebar based on current path
    const sidebar = config.themeConfig?.sidebar || {};
    return sidebar['/'] || [];
}
