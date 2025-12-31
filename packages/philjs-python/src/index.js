/**
 * @philjs/python - Python AI/ML Bindings for PhilJS
 *
 * High-performance Python integration for AI/ML workloads:
 * - LLM inference (OpenAI, Anthropic, local models)
 * - Vector embeddings
 * - ML model serving
 * - RAG pipelines
 *
 * @example
 * ```ts
 * import { createPythonServer, llm, embeddings } from '@philjs/python';
 *
 * // LLM inference
 * const response = await llm.chat({
 *   model: 'gpt-4',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 *
 * // Generate embeddings
 * const vectors = await embeddings.generate({
 *   model: 'text-embedding-3-small',
 *   input: ['Hello world', 'How are you?'],
 * });
 * ```
 */
export * from './server.js';
export * from './llm.js';
export * from './embeddings.js';
export * from './types.js';
//# sourceMappingURL=index.js.map