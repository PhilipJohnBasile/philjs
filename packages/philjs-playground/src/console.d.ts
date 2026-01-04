/**
 * PhilJS Playground Console
 */
import type { ConsoleMessage } from './types.js';
export declare function createConsole(container: HTMLElement): {
    log(type: "log" | "info" | "warn" | "error", message: string): void;
    clear(): void;
    getMessages(): ConsoleMessage[];
};
export declare function Console(props: {
    className?: string;
}): HTMLDivElement;
//# sourceMappingURL=console.d.ts.map