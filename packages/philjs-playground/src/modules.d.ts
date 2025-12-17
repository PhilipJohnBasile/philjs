/**
 * Type declarations for optional dependencies
 */

declare module '@babel/standalone' {
  export function transform(code: string, options: any): { code: string };
}

declare module '@codemirror/state' {
  export const EditorState: any;
}

declare module '@codemirror/view' {
  export const EditorView: any;
  export const keymap: any;
  export const highlightActiveLine: any;
  export const lineNumbers: any;
}

declare module '@codemirror/commands' {
  export const defaultKeymap: any;
  export const indentWithTab: any;
  export const history: any;
  export const historyKeymap: any;
}

declare module '@codemirror/language' {
  export const javascript: any;
  export const syntaxHighlighting: any;
  export const defaultHighlightStyle: any;
}

declare module '@codemirror/autocomplete' {
  export const autocompletion: any;
}
