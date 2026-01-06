/**
 * Ambient type declarations for philjs-migrate
 */

// commander module
declare module 'commander' {
  interface Command {
    name(name: string): Command;
    description(str: string): Command;
    version(str: string): Command;
    command(nameAndArgs: string): Command;
    argument(flags: string, description?: string, defaultValue?: unknown): Command;
    option(flags: string, description?: string, defaultValue?: unknown): Command;
    action(fn: (...args: any[]) => void | Promise<void>): Command;
    parse(argv?: string[]): Command;
  }

  export const program: Command;
}

// prompts module
declare module 'prompts' {
  interface Choice {
    title: string;
    value: string;
    description?: string;
    disabled?: boolean;
  }

  interface Options {
    type: 'text' | 'password' | 'invisible' | 'number' | 'confirm' | 'list' | 'toggle' | 'select' | 'multiselect' | 'autocomplete' | 'date';
    name: string;
    message: string;
    initial?: string | number | boolean;
    choices?: Choice[];
    validate?: (value: string) => boolean | string | Promise<boolean | string>;
    format?: (value: string) => string;
  }

  function prompts<T extends string>(questions: Options | Options[]): Promise<Record<T, any>>;

  export = prompts;
}

// ora module
declare module 'ora' {
  interface Spinner {
    start(text?: string): Spinner;
    stop(): Spinner;
    succeed(text?: string): Spinner;
    fail(text?: string): Spinner;
    warn(text?: string): Spinner;
    info(text?: string): Spinner;
    text: string;
    isSpinning: boolean;
  }

  interface Options {
    text?: string;
    spinner?: string | { interval: number; frames: string[] };
    color?: 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray';
    hideCursor?: boolean;
    indent?: number;
    interval?: number;
    stream?: NodeJS.WritableStream;
    isEnabled?: boolean;
    isSilent?: boolean;
  }

  function ora(options?: string | Options): Spinner;

  export = ora;
}

// jscodeshift module
declare module 'jscodeshift' {
  export interface FileInfo {
    path: string;
    source: string;
  }

  export interface Options {
    [key: string]: any;
  }

  export interface API {
    jscodeshift: JSCodeshift;
    stats: (name: string, quantity?: number) => void;
    report: (message: string) => void;
  }

  export interface JSCodeshift {
    (source: string): Collection;
    ImportDeclaration: any;
    VariableDeclaration: any;
    ExportNamedDeclaration: any;
    Identifier: any;
    MemberExpression: any;
    CallExpression: any;
    ObjectPattern: any;
    Property: any;
    JSXElement: any;
    JSXIdentifier: any;
    JSXAttribute: any;
    JSXOpeningElement: any;
    FunctionDeclaration: any;
    ArrowFunctionExpression: any;
    FunctionExpression: any;
    ReturnStatement: any;
    TemplateLiteral: any;
    StringLiteral: any;
    ArrayExpression: any;
    ObjectExpression: any;
    LabeledStatement: any;
    AssignmentExpression: any;
    identifier: (name: string) => any;
    stringLiteral: (value: string) => any;
    literal: (value: any) => any;
    memberExpression: (object: any, property: any) => any;
    callExpression: (callee: any, args: any[]) => any;
    importDeclaration: (specifiers: any[], source: any) => any;
    importSpecifier: (imported: any, local?: any) => any;
    importDefaultSpecifier: (local: any) => any;
    objectProperty: (key: any, value: any) => any;
    objectExpression: (properties: any[]) => any;
    arrowFunctionExpression: (params: any[], body: any) => any;
    blockStatement: (body: any[]) => any;
    expressionStatement: (expression: any) => any;
    returnStatement: (argument: any) => any;
    variableDeclaration: (kind: string, declarations: any[]) => any;
    variableDeclarator: (id: any, init?: any) => any;
    withParser: (parser: string) => JSCodeshift;
  }

  export interface Collection {
    find: (type: any, filter?: any) => Collection;
    filter: (fn: (path: any) => boolean) => Collection;
    forEach: (fn: (path: any) => void) => void;
    remove: () => void;
    insertBefore: (node: any) => void;
    insertAfter: (node: any) => void;
    replaceWith: (node: any) => void;
    at: (index: number) => Collection;
    get: () => any;
    length: number;
    toSource: (options?: any) => string;
    paths: () => any[];
    nodes: () => any[];
    closest: (type: any) => Collection;
    size: () => number;
  }

  const jscodeshift: JSCodeshift;
  export default jscodeshift;
}
