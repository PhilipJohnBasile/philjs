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
