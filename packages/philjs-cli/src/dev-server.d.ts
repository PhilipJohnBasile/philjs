/**
 * PhilJS Development Server
 * Powered by Vite with PhilJS-specific plugins
 */
import { type ViteDevServer } from "vite";
export type DevServerOptions = {
    port: number;
    host: string;
    open: boolean;
};
export declare function startDevServer(options: DevServerOptions): Promise<ViteDevServer>;
//# sourceMappingURL=dev-server.d.ts.map