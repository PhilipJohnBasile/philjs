// Type declarations for optional dependencies

declare module 'yaml' {
  export interface ParseOptions {
    strict?: boolean;
    prettyErrors?: boolean;
    version?: '1.1' | '1.2';
    logLevel?: 'silent' | 'error' | 'warn';
  }

  export interface StringifyOptions {
    indent?: number;
    simpleKeys?: boolean;
    defaultKeyType?: 'PLAIN' | 'BLOCK_LITERAL' | 'BLOCK_FOLDED' | 'QUOTE_DOUBLE' | 'QUOTE_SINGLE';
    defaultStringType?: 'PLAIN' | 'BLOCK_LITERAL' | 'BLOCK_FOLDED' | 'QUOTE_DOUBLE' | 'QUOTE_SINGLE';
    lineWidth?: number;
    nullStr?: string;
    trueStr?: string;
    falseStr?: string;
  }

  export interface DocumentOptions {
    directives?: boolean;
    keepUndefined?: boolean;
  }

  export class Document {
    contents: any;
    toString(options?: StringifyOptions): string;
    toJSON(): any;
  }

  export function parse(str: string, options?: ParseOptions): any;
  export function stringify(value: any, options?: StringifyOptions): string;
  export function parseDocument(str: string, options?: ParseOptions): Document;
  export function parseAllDocuments(str: string, options?: ParseOptions): Document[];
}
