/**
 * PhilJS Development Server
 * Powered by Vite with PhilJS-specific plugins
 */
import { createServer } from "vite";
import * as pc from "picocolors";
import { philJSPlugin } from "./vite-plugin.js";
export async function startDevServer(options) {
    const server = await createServer({
        root: process.cwd(),
        server: {
            port: options.port,
            host: options.host,
            open: options.open,
        },
        plugins: [philJSPlugin()],
        optimizeDeps: {
            include: ["@philjs/core", "philjs-router", "philjs-ssr"],
        },
    });
    await server.listen();
    console.log(pc.green("\n✓ Dev server running!\n"));
    server.printUrls();
    console.log(pc.dim("\n  " + pc.bold("PhilJS features enabled:") + "\n" +
        "  • Hot Module Replacement (HMR)\n" +
        "  • Smart preloading with intent detection\n" +
        "  • Performance budget monitoring\n" +
        "  • Cost tracking dashboard\n" +
        "  • Time-travel debugging\n"));
    return server;
}
//# sourceMappingURL=dev-server.js.map