/**
 * Extended commander types for PhilJS CLI
 */
import { Command as BaseCommand } from 'commander';

declare module 'commander' {
  interface Command {
    alias(alias: string): this;
    parseAsync(argv?: readonly string[], options?: ParseOptions): Promise<this>;
  }
}

export {};
