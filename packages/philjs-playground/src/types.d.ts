/**
 * PhilJS Playground Types
 */
export interface PlaygroundConfig {
    initialCode?: string;
    theme?: 'light' | 'dark';
    layout?: 'horizontal' | 'vertical';
    autoRun?: boolean;
    showConsole?: boolean;
    showShare?: boolean;
    onCompile?: (result: CompileResult) => void;
    onError?: (error: Error) => void;
}
export interface EditorConfig {
    initialCode?: string;
    theme?: 'light' | 'dark';
    language?: 'javascript' | 'typescript' | 'jsx' | 'tsx';
    onChange?: (code: string) => void;
    readOnly?: boolean;
}
export interface PreviewConfig {
    sandboxed?: boolean;
    onError?: (error: Error) => void;
}
export interface CompileResult {
    success: boolean;
    output: string;
    errors: string[];
    warnings: string[];
    duration: number;
}
export interface ConsoleMessage {
    type: 'log' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: number;
}
//# sourceMappingURL=types.d.ts.map