/**
 * PhilJS Playground Component
 *
 * The main playground component that brings together the editor, preview, and console.
 */
import type { PlaygroundConfig, ConsoleMessage } from './types.js';
/**
 * Create a PhilJS playground
 */
export declare function createPlayground(container: HTMLElement, config?: PlaygroundConfig): {
    editor: {
        getValue(): any;
        setValue(code: string): void;
        focus(): void;
        destroy(): void;
    };
    preview: {
        render(code: string, options?: {
            onConsole?: (type: string, ...args: any[]) => void;
            onError?: (error: Error) => void;
        }): void;
        clear(): void;
        destroy(): void;
    };
    console: {
        log(type: "log" | "info" | "warn" | "error", message: string): void;
        clear(): void;
        getMessages(): ConsoleMessage[];
    };
    run: () => Promise<void>;
    share: () => Promise<void>;
    setCode(code: string): void;
    getCode(): any;
    destroy(): void;
};
/**
 * Standalone Playground component
 */
export declare function Playground(props: PlaygroundConfig & {
    className?: string;
}): HTMLDivElement;
//# sourceMappingURL=playground.d.ts.map