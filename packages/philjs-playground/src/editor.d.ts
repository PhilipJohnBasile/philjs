/**
 * PhilJS Playground Editor
 */
import type { EditorConfig } from './types.js';
export declare function createEditor(container: HTMLElement, config?: EditorConfig): {
    getValue(): any;
    setValue(code: string): void;
    focus(): void;
    destroy(): void;
};
export declare function Editor(props: EditorConfig & {
    className?: string;
}): HTMLDivElement;
//# sourceMappingURL=editor.d.ts.map