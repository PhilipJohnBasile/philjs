/**
 * AI summarization demo for the storefront.
 */

import type { PromptSpec } from "@philjs/ai";
import { createPrompt } from "@philjs/ai";

export const summarize = createPrompt({
  in: { text: "" },
  out: { tl_dr: "" },
  policy: {
    pii: "block",
    costBudgetCents: 10
  }
});

type PhilAIClient = {
  generate<TI, TO>(
    spec: PromptSpec<TI, TO>,
    input: TI,
    opts?: Record<string, unknown>
  ): Promise<{ text: string } & Record<string, unknown>>;
};

/**
 * Generate a summary for a product description with a provided AI client.
 */
export async function summarizeProduct(ai: PhilAIClient, description: string) {
  const result = await ai.generate(summarize, { text: description });
  return result.text;
}
