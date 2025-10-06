import type { PromptSpec, Provider } from "./types.js";

export * from "./types.js";

/**
 * Create a typed prompt specification.
 * @template TI, TO
 * @param {PromptSpec<TI, TO>} spec - Prompt specification
 * @returns {PromptSpec<TI, TO>}
 */
export function createPrompt(spec) {
  return spec;
}

/**
 * Create an AI client with a provider.
 * @param {Provider} provider - AI provider
 */
export function createAI(provider) {
  return {
    async generate(spec, input, opts) {
      // Check PII policy
      if (spec.policy?.pii === "block") {
        // In a real implementation, scan input for PII
        // For now, just proceed
      }

      const prompt = JSON.stringify({ spec, input });
      const text = await provider.generate(prompt, opts);

      return { text };
    }
  };
}

/**
 * Built-in providers.
 */
export const providers = {
  /**
   * HTTP provider that POSTs to an endpoint.
   * @param {string} url - AI endpoint URL
   * @returns {Provider}
   */
  http: (url) => ({
    name: "http",
    async generate(prompt, opts) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, ...opts })
      });

      const data = await res.json();
      return data.text ?? "";
    }
  }),

  /**
   * Echo provider for testing (returns the prompt as-is).
   * @returns {Provider}
   */
  echo: () => ({
    name: "echo",
    async generate(prompt) {
      return `Echo: ${prompt}`;
    }
  })
};
