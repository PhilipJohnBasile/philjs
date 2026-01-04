/**
 * PhilJS Node.js Adapter
 *
 * Run PhilJS as a standalone Node.js server
 */
import type { Adapter, AdapterConfig } from '../types.js';
export interface NodeConfig extends AdapterConfig {
    /** Port to listen on */
    port?: number;
    /** Host to bind to */
    host?: string;
    /** Enable HTTPS */
    https?: {
        key: string;
        cert: string;
    };
    /** Compression */
    compression?: boolean;
    /** Request timeout in ms */
    timeout?: number;
    /** Trust proxy headers */
    trustProxy?: boolean;
    /** Enable clustering */
    cluster?: boolean | number;
    /** Static file serving */
    serveStatic?: boolean;
}
export declare function nodeAdapter(config?: NodeConfig): Adapter;
export declare function startServer(config?: NodeConfig): any;
export default nodeAdapter;
//# sourceMappingURL=index.d.ts.map