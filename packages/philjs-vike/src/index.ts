import { signal } from '@philjs/core';

export interface VikeContext {
    urlOriginal: string;
    pageContext: Record<string, unknown>;
}

export interface VikePageContextInit {
    urlOriginal: string;
    headers: Headers;
}

export function createVikeHandler(renderPage: (ctx: VikePageContextInit) => Promise<unknown>) {
    return async (req: Request) => {
        const urlOriginal = req.url;
        const pageContextInit = {
            urlOriginal,
            headers: req.headers,
        };

        const pageContext = await renderPage(pageContextInit);

        return pageContext;
    };
}

export function usePageContext(initialContext: Record<string, unknown>) {
    return signal(initialContext);
}
