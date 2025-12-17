import type { IncomingMessage, ServerResponse } from "node:http";
import type { RouteDefinition, RouteManifestOptions } from "philjs-router";
import type { RenderOptions } from "./request-handler.js";
export type PhilJSServerOptions = {
    routes: RouteDefinition[];
    baseUrl?: string;
    render?: RenderOptions["render"];
    routeOptions?: RouteManifestOptions;
};
export declare function createFetchHandler(options: PhilJSServerOptions): (request: Request) => Promise<Response>;
export declare function createNodeHttpHandler(options: PhilJSServerOptions): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
export declare function createExpressMiddleware(options: PhilJSServerOptions): (req: IncomingMessage, res: ServerResponse, next?: (err?: unknown) => void) => void;
export declare function createViteMiddleware(options: PhilJSServerOptions): (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void;
export declare function createWorkerHandler(options: PhilJSServerOptions): (request: Request) => Promise<Response>;
//# sourceMappingURL=adapters.d.ts.map