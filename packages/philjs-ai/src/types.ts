/**
 * Type definitions for AI prompts and providers.
 */

export type PromptSpec<I, O> = {
  in: I;
  out: O;
  policy?: {
    pii?: "block" | "allow";
    costBudgetCents?: number;
  };
};

export type Provider = {
  name: string;
  generate: (prompt: string, opts?: Record<string, any>) => Promise<string>;
};
