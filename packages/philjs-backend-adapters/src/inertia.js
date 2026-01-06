export class InertiaAdapter {
    context;
    sharedProps = {};
    pageHandler = null;
    constructor(context) {
        this.context = context;
    }
    static init(page) {
        if (typeof window !== 'undefined') {
            window.history.replaceState({ page }, '', page.url);
        }
    }
    onPage(handler) {
        this.pageHandler = handler;
    }
    share(key, value) {
        this.sharedProps[key] = value;
    }
    async visit(url, options = {}) {
        const method = options.method || 'get';
        const headers = {
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
            });
            if (response.headers.get('X-Inertia-Location')) {
                return this.visit(response.headers.get('X-Inertia-Location'));
            }
            const page = await response.json();
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
        }
        catch (error) {
            console.error('Inertia Visit Failed:', error);
            // Fallback to hard reload for non-Inertia responses
            if (typeof window !== 'undefined') {
                window.location.href = url;
            }
            throw error;
        }
    }
    render(component, props) {
        const mergedProps = { ...this.sharedProps, ...props };
        return {
            component,
            props: mergedProps,
            url: this.context.url,
            version: this.context.version
        };
    }
}
//# sourceMappingURL=inertia.js.map