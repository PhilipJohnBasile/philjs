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
export declare class InertiaAdapter {
    private context;
    private sharedProps;
    private pageHandler;
    constructor(context: {
        url: string;
        version: string | null;
    });
    static init(page: InertiaPage): void;
    onPage(handler: PageHandler): void;
    share(key: string, value: any): void;
    visit(url: string, options?: {
        method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
        data?: any;
        preserveState?: boolean;
        only?: string[];
    }): any;
    render(component: string, props: Record<string, any>): InertiaPage;
}
//# sourceMappingURL=inertia.d.ts.map