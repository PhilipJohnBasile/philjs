/**
 * Resumability helpers for serializing state and handler refs.
 */

/**
 * Serialize state to base64 for embedding in data-* attributes.
 * @param {unknown} obj - Object to serialize
 * @returns {string}
 */
export function serializeState(obj: unknown): string {
  const json = JSON.stringify(obj);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(json).toString("base64");
  }

  if (typeof btoa === "function") {
    return btoa(json);
  }

  throw new Error("serializeState: base64 encoding not supported in this environment");
}

/**
 * Deserialize state from base64.
 * @param {string} b64 - Base64 encoded state
 * @returns {unknown}
 */
export function deserializeState(b64: string): unknown {
  if (typeof Buffer !== "undefined") {
    return JSON.parse(Buffer.from(b64, "base64").toString());
  }

  if (typeof atob === "function") {
    return JSON.parse(atob(b64));
  }

  throw new Error("deserializeState: base64 decoding not supported in this environment");
}
