/**
 * Resumability helpers for serializing state and handler refs.
 */
/**
 * Serialize state to base64 for embedding in data-* attributes.
 * @param {unknown} obj - Object to serialize
 * @returns {string}
 */
export declare function serializeState(obj: unknown): string;
/**
 * Deserialize state from base64.
 * @param {string} b64 - Base64 encoded state
 * @returns {unknown}
 */
export declare function deserializeState(b64: string): unknown;
//# sourceMappingURL=resume.d.ts.map