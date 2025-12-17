/**
 * PhilJS Playground Preview
 */
import type { PreviewConfig } from './types';
export declare function createPreview(container: HTMLElement, config?: PreviewConfig): {
    render(code: string, options?: {
        onConsole?: (type: string, ...args: any[]) => void;
        onError?: (error: Error) => void;
    }): void;
    clear(): void;
    destroy(): void;
};
export declare function Preview(props: PreviewConfig & {
    className?: string;
}): HTMLDivElement;
//# sourceMappingURL=preview.d.ts.map