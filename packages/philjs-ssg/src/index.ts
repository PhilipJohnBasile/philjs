/**
 * PhilJS Static Site Generator
 */

import { signal } from '@philjs/core';

export interface SSGConfig {
    outDir?: string;
    routes?: string[] | (() => Promise<string[]>);
    prerender?: boolean;
}

export function defineSSGConfig(config: SSGConfig): SSGConfig {
    return { outDir: 'dist', prerender: true, ...config };
}

export async function generateStaticSite(config: SSGConfig, render: (url: string) => Promise<string>) {
    const routes = typeof config.routes === 'function' ? await config.routes() : config.routes || ['/'];
    const results: { route: string; html: string }[] = [];

    for (const route of routes) {
        const html = await render(route);
        results.push({ route, html });
    }

    return results;
}

export function useStaticProps<T>(loader: () => Promise<T>) {
    const data = signal<T | null>(null);
    const loading = signal(true);

    loader().then(result => { data.set(result); loading.set(false); });

    return { data, loading };
}
