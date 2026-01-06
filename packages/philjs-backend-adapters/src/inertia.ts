
export interface InertiaPage {
    component: string;
    props: Record<string, any>;
    url: string;
    version: string | null;
}

export interface InertiaHeaders {
    'X-Inertia': 'true';
    'X-Inertia-Version'?: string;
    'X-Inertia-Location'?: string;
    'X-Inertia-Partial-Data'?: string;
    'X-Inertia-Partial-Component'?: string;
}

export type PageHandler = (page: InertiaPage) => Promise<void> | void;

export class InertiaAdapter {
    private sharedProps: Record<string, any> = {};
    private pageHandler: PageHandler | null = null;

    constructor(private context: { url: string; version: string | null }) { }

    static init(page: InertiaPage) {
        if (typeof window !== 'undefined') {
            window.history.replaceState({ page }, '', page.url);
        }
    }

    onPage(handler: PageHandler) {
        this.pageHandler = handler;
    }

    share(key: string, value: any) {
        this.sharedProps[key] = value;
    }

    async visit(url: string, options: {
        method?: 'get' | 'post' | 'put' | 'patch' | 'delete',
        data?: any,
        preserveState?: boolean,
        only?: string[]
    } = {}) {
        const method = options.method || 'get';
        const headers: Record<string, string> = {
            'X-Inertia': 'true',
            'Accept': 'text/html, application/xhtml+xml',
            'Content-Type': 'application/json',
        };

        if (this.context.version) {
            headers['X-Inertia-Version'] = this.context.version;
        }

        if (options.only && options.only.length > 0) {
            headers['X-Inertia-Partial-Component'] = this.context.url; // Simplification
            headers['X-Inertia-Partial-Data'] = options.only.join(',');
        }

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: method !== 'get' ? JSON.stringify(options.data) : undefined,
            } as RequestInit);

            if (response.headers.get('X-Inertia-Location')) {
                return this.visit(response.headers.get('X-Inertia-Location')!);
            }

            const page: InertiaPage = await response.json();

            // Merge shared props
            page.props = { ...this.sharedProps, ...page.props };

            // Handle navigation
            if (this.pageHandler) {
                await this.pageHandler(page);
            }

            if (typeof window !== 'undefined') {
                window.history.pushState({ page }, '', page.url);
            }

            this.context.url = page.url;
            this.context.version = page.version;

            return page;
        } catch (error) {
            console.error('Inertia Visit Failed:', error);
            // Fallback to hard reload for non-Inertia responses
            if (typeof window !== 'undefined') {
                window.location.href = url;
            }
            throw error;
        }
    }

    render(component: string, props: Record<string, any>): InertiaPage {
        const mergedProps = { ...this.sharedProps, ...props };
        return {
            component,
            props: mergedProps,
            url: this.context.url,
            version: this.context.version
        };
    }
}
