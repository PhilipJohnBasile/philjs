
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

export class InertiaAdapter {
    private sharedProps: Record<string, any> = {};

    constructor(private context: { url: string; version: string | null }) { }

    static init(page: InertiaPage) {
        if (typeof window !== 'undefined') {
            window.history.replaceState({ page }, '', page.url);
            console.log('Inertia: Mounted component', page.component);
        }
    }

    share(key: string, value: any) {
        this.sharedProps[key] = value;
    }

    render(component: string, props: Record<string, any>): InertiaPage {
        const mergedProps = { ...this.sharedProps, ...props };

        // Simulate partial reload filtering if headers were present
        // (mock logic for demonstration)

        return {
            component,
            props: mergedProps,
            url: this.context.url,
            version: this.context.version
        };
    }
}
