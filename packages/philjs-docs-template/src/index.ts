/**
 * PhilJS Documentation Template
 * 
 * A VitePress-like documentation site generator for PhilJS.
 */

import { signal, memo } from '@philjs/core';
import { Router, Route } from '@philjs/router';

export interface DocsConfig {
    title: string;
    description?: string;
    base?: string;
    themeConfig?: ThemeConfig;
    markdown?: MarkdownConfig;
}

export interface ThemeConfig {
    logo?: string;
    nav?: NavItem[];
    sidebar?: SidebarConfig;
    socialLinks?: SocialLink[];
    footer?: FooterConfig;
    search?: SearchConfig;
}

export interface NavItem {
    text: string;
    link?: string;
    items?: NavItem[];
}

export interface SidebarConfig {
    [path: string]: SidebarItem[];
}

export interface SidebarItem {
    text: string;
    link?: string;
    items?: SidebarItem[];
    collapsed?: boolean;
}

export interface SocialLink {
    icon: 'github' | 'twitter' | 'discord' | 'linkedin';
    link: string;
}

export interface FooterConfig {
    message?: string;
    copyright?: string;
}

export interface SearchConfig {
    provider: 'local' | 'algolia';
    algoliaConfig?: {
        appId: string;
        apiKey: string;
        indexName: string;
    };
}

export interface MarkdownConfig {
    lineNumbers?: boolean;
    theme?: string;
    anchor?: boolean;
    toc?: boolean;
}

/**
 * Create a documentation site
 */
export function defineConfig(config: DocsConfig): DocsConfig {
    return {
        base: '/',
        ...config,
        themeConfig: {
            nav: [],
            sidebar: {},
            socialLinks: [],
            ...config.themeConfig,
        },
        markdown: {
            lineNumbers: true,
            theme: 'github-dark',
            anchor: true,
            toc: true,
            ...config.markdown,
        },
    };
}

/**
 * Generate sidebar from file structure
 */
export function generateSidebar(basePath: string): SidebarItem[] {
    // This would scan the directory and generate sidebar structure
    // Implementation depends on Node.js fs module at build time
    return [];
}

/**
 * Parse frontmatter from markdown
 */
export async function parseFrontmatter(content: string): Promise<{
    data: Record<string, any>;
    content: string;
}> {
    const matter = await import('gray-matter');
    return matter.default(content);
}

/**
 * Render markdown to HTML with syntax highlighting
 */
export async function renderMarkdown(content: string, config?: MarkdownConfig): Promise<string> {
    const { marked } = await import('marked');
    const shiki = await import('shiki');

    const highlighter = await shiki.getHighlighter({
        theme: config?.theme || 'github-dark',
        langs: ['typescript', 'javascript', 'jsx', 'tsx', 'html', 'css', 'bash', 'json'],
    });

    // Configure marked with shiki
    marked.setOptions({
        highlight: (code, lang) => {
            return highlighter.codeToHtml(code, { lang: lang || 'text' });
        },
    });

    return marked.parse(content);
}

// Re-export components
export { DocsLayout } from './theme/Layout.js';
export { DocPage } from './theme/DocPage.js';
export { Sidebar } from './theme/Sidebar.js';
export { NavBar } from './theme/NavBar.js';
export { SearchBox } from './theme/SearchBox.js';
