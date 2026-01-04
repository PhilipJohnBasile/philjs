import type { ServerResponse } from "node:http";
export type HintPriority = "high" | "low" | "auto";
export type HintAs = "script" | "style" | "font" | "fetch" | "image" | "document" | "worker" | "module";
export type EarlyHint = {
    href: string;
    rel?: "preload" | "preconnect" | "modulepreload" | "prefetch";
    as?: HintAs;
    crossorigin?: "anonymous" | "use-credentials";
    priority?: HintPriority;
    type?: string;
};
export declare function buildLinkHeader(hints?: EarlyHint[]): string;
export declare function writeEarlyHints(response: ServerResponse, hints?: EarlyHint[]): boolean;
//# sourceMappingURL=hints.d.ts.map