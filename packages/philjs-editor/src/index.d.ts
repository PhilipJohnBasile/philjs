/**
 * @philjs/editor - Rich Text Editor for PhilJS
 * Pure Web Components - No React
 */
export interface EditorConfig {
    content?: string;
    extensions?: string[];
    placeholder?: string;
    autofocus?: boolean | 'start' | 'end';
    editable?: boolean;
    class?: string;
    onUpdate?: (content: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}
export interface EditorInstance {
    getHTML: () => string;
    getText: () => string;
    setContent: (content: string) => void;
    clearContent: () => void;
    focus: () => void;
    blur: () => void;
    isEmpty: () => boolean;
    getCharacterCount: () => number;
    getWordCount: () => number;
    isFocused: () => boolean;
    destroy: () => void;
}
export declare class PhilEditor extends HTMLElement {
    static observedAttributes: string[];
    private shadow;
    private editorEl;
    private config;
    constructor();
    connectedCallback(): void;
    configure(config: EditorConfig): void;
    getHTML(): string;
    getText(): string;
    setContent(content: string): void;
    clearContent(): void;
    focus(): void;
    blur(): void;
    isEmpty(): boolean;
    getCharacterCount(): number;
    getWordCount(): number;
    isFocused(): boolean;
    bold(): void;
    italic(): void;
    underline(): void;
    strikethrough(): void;
    heading(level: 1 | 2 | 3 | 4 | 5 | 6): void;
    paragraph(): void;
    bulletList(): void;
    orderedList(): void;
    blockquote(): void;
    codeBlock(): void;
    link(url: string): void;
    unlink(): void;
    undo(): void;
    redo(): void;
    private setupEditor;
    private render;
    private executeCommand;
}
export declare function createEditorConfig(options?: Partial<EditorConfig>): EditorConfig;
export declare function getCharacterCount(content: string): number;
export declare function getWordCount(content: string): number;
export declare function sanitizeContent(html: string): string;
//# sourceMappingURL=index.d.ts.map